import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  HStack,
  Card,
  Checkbox,
  CheckboxIndicator,
  CheckboxIcon,
  VStack,
  Text,
  Button,
  ButtonText,
  Pressable,
  CheckIcon,
  useAlert,
  Tooltip,
  TooltipContent,
  TooltipText,
  Spinner,
  ButtonIcon,
} from '@ui';
import { useProjectContext } from '../../context/ProjectContext';
import { useTaskActions } from '../../hooks/useTaskActions';
import { useLanguage } from '@contexts/LanguageContext';
import {
  TASK_STATUS,
  TASK_TYPE,
  PROJECT_MODES,
} from '../../../constants/app.constant';
import { TaskCardProps } from '../../types/components.types';
import { Task } from '../../types/project.types';
import { taskCardStyles, taskAccordionStyles } from './Styles';
import { LucideIcon } from '@ui/index';
import { theme } from '@config/theme';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';
import FileUploadModal from './FileUploadModal';
import EvidencePreviewModal from './EvidencePreviewModal';
import { usePlatform } from '@utils/platform';
import { isTaskCompleted } from './helpers';
import { renderCustomTaskActions, renderModals } from './renderHelpers';
import { useNavigation } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import { getSolutionDetails } from '../../services/projectPlayerService';
import logger from '@utils/logger';
import { useAuth, User } from '@contexts/AuthContext';
import { createOrUpdateProgramUserMapping, updateEntityDetails } from '../../../services/participantService';
import { STATUS } from '@constants/app.constant';


const TaskCard: React.FC<TaskCardProps> = ({
  task,
  isLastTask = false,
  isChildOfProject = false,
  isOnboardingTask = false,
}) => {
  const { projectData } = useProjectContext();
  const route = useRoute();
  const navigation = useNavigation();
  // Retrieve updateTask from context
  const { mode, config, addedToPlanTaskIds, deleteTask } =
    useProjectContext();
  // handleOpenForm
  const { handleStatusChange, handleAddToPlan } =
    useTaskActions();
  const { isWeb, isMobile } = usePlatform();
  const { t } = useLanguage();
  const { showAlert } = useAlert();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isAddedToPlan, setIsAddedToPlan] = useState(
    Boolean(!task?.isDeletable),
  );
  const [isRejected, setIsRejected] = useState(false);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);
  const [confirmDeleteLoading, setConfirmDeleteLoading] = useState(false);
  const participantId = (route.params as any)?.id;
  const { user } = useAuth()
  
  // Modal state management (from Incoming)
  type ModalType = 'edit' | 'delete' | null;
  const [modalState, setModalState] = useState<{
    type: ModalType;
    task?: Task;
  }>({
    type: null,
  });

  const isReadOnly = mode === PROJECT_MODES.READ_ONLY;
  const isPreview = mode === PROJECT_MODES.PREVIEW;
  const isEdit = mode === PROJECT_MODES.EDIT;
  // Use mixed logic for completion: check status or use helper
  const isCompleted = isTaskCompleted(task?.status);

  const isInterventionPlanEditMode = isEdit && !isPreview && isChildOfProject;
  const hasUploadedFiles = !!(task.attachments && task.attachments.length > 0);
  const isEvidenceRequired = !!(
    (task.noOfEvidenceRequired && task.noOfEvidenceRequired > 0) ||
    (task.metaInformation?.noOfEvidencesRequired && task.metaInformation.noOfEvidencesRequired > 0)
  );
  const isEvidenceUploaded = hasUploadedFiles;
  const isTaskDone = isCompleted || (isEvidenceRequired && isEvidenceUploaded);
  const isOnboardingCompletedUI = isOnboardingTask && (task.isDeletable ? hasUploadedFiles : isCompleted);
  const isObservationTask = task.type === TASK_TYPE.OBSERVATION;
  const isManualToggleDisabled = isObservationTask || isEvidenceRequired;

  const onboardingTextStyle = {
    textDecorationLine: 'none' as const,
    // (isOnboardingCompletedUI ? 'line-through' : 'none') as
    //   | 'line-through'
    //   | 'none',
    opacity: isOnboardingCompletedUI ? 0.6 : 1,
  };

  const onboardingDescStyle = {
    opacity: isOnboardingCompletedUI ? 0.6 : 1,
  };

  const uiConfig = useMemo(
    () => ({
      showAsCard: isChildOfProject,
      showAsInline: !isChildOfProject || isPreview,
      showCheckbox: isChildOfProject && !isPreview,
      showActionButton: !isPreview || task?.isDeletable,
      isInteractive: isEdit,
    }),
    [isChildOfProject, isPreview, isEdit, task?.isDeletable],
  );

  const showSuccess = (message: string) => {
    showAlert("success", message);
  };

  const showError = (message: string) => {
    showAlert("error", message);
  };

  // Modal actions (Incoming)
  const openEditModal = () => {
    setModalState({ type: 'edit', task });
  };

  const openDeleteModal = () => {
    setModalState({ type: 'delete' });
  };

  const closeModal = () => {
    setModalState({ type: null });
  };

  const handleConfirmDelete = async () => {
    if (!task?._id) return;
    setConfirmDeleteLoading(true);
    try {
      await deleteTask(task._id);
      closeModal();
      showSuccess(t('projectPlayer.taskDeleted'));
    } catch (e) {
      showError(
        e instanceof Error ? e.message : t('common.serverError500'),
      );
    } finally {
      setConfirmDeleteLoading(false);
    }
  };

  useEffect(() => {
    setIsAddedToPlan(addedToPlanTaskIds.includes(task?._id));
  }, [addedToPlanTaskIds, task?._id]);

  const updateAddToPlan = (added: boolean) => {
    handleAddToPlan(task._id, added);
    setIsAddedToPlan(added);
  };

  // Task click handler (HEAD logic)
  const handleTaskClick = async () => {
    if (!isEdit) return;

    if (task?.type === TASK_TYPE.OBSERVATION) {
      const projectTemplateId = projectData?._id;
      if (!participantId || !projectTemplateId) {
        console.error('Missing userId or projectTemplateId');
        return;
      }
      try {
        const solutionDetails = await getSolutionDetails(
          projectTemplateId,
          task._id,
        );

        if (solutionDetails?.data?._id) {
          // @ts-ignore Navigate to observation screen - task will be marked as completed on return
          navigation.navigate('observation', {
            id: participantId,
            solutionId: solutionDetails.data._id,
            submissionNumber: 1,
          });
        } else {
          showAlert('error', t('projectPlayer.unableToLoadObservation'));
        }
      } catch (error) {
        console.error('getSolutionDetails API failed:', error);
      }
    } else {
      setShowUploadModal(true); // Open modal instead of file picker
    }
  };

  // Checkbox change handler
  const handleCheckboxChange = async (checked: boolean) => {
    if (!isEdit) return;
    setIsStatusUpdating(true);
    try {
      const newStatus = checked ? TASK_STATUS.COMPLETED : TASK_STATUS.TO_DO;
      await handleStatusChange(task._id, newStatus);
    } finally {
      setIsStatusUpdating(false);
    }
  };

  // Custom Renderers (From HEAD to preserve styling)

  // Render task status indicator (circle or checkbox)
  const renderStatusIndicator = () => {
    // Special handling for Observation/Form tasks and Evidence Required tasks in Edit Mode
    if (isInterventionPlanEditMode && (isObservationTask || isEvidenceRequired)) {
      if (isStatusUpdating) {
        return (
          <Box {...taskCardStyles.primaryFilledCircle} borderColor="transparent" bg="transparent">
            <Spinner size="small" color={theme.tokens.colors.primary500} />
          </Box>
        );
      }
      if (isTaskDone) {
        // Render a simple green checkmark (non-interactive)
        return (
          <LucideIcon name={"CheckCircle"} size={20} color={"$success500"} />
        );
      } else {
        // Show empty circle for consistency (non-interactive) with Tooltip on hover
        const tooltipText = isObservationTask
          ? t('projectPlayer.completeFormToMarkDone')
          : t('projectPlayer.uploadEvidenceToMarkDone');

        return (
          <Tooltip
            placement="top"
            trigger={(triggerProps: any) => {
              return (
                <Pressable {...triggerProps} cursor="default">
                  <Box
                    {...taskCardStyles.primaryFilledCircle}
                    borderColor="$textMuted"
                    bg="$backgroundPrimary.light"
                  />
                </Pressable>
              );
            }}
          >
            <TooltipContent
              {...taskCardStyles.tooltipContent}
            >
              <TooltipText {...taskCardStyles.tooltipText}>
                {tooltipText}
              </TooltipText>
            </TooltipContent>
          </Tooltip>
        );
      }
    }

    if (uiConfig.showCheckbox) {
      return (
        <Box alignItems="center" justifyContent="center">
          {isStatusUpdating ? (
            <Spinner size="small" color="$primary500" />
          ) : (
            <Checkbox
              value={task?._id}
              isChecked={isCompleted}
              onChange={handleCheckboxChange}
              isDisabled={isReadOnly}
              size="md"
              aria-label={`Mark ${task?.name} as ${isCompleted ? 'incomplete' : 'complete'}`}
              opacity={isReadOnly ? 0.6 : 1}
            >
              <CheckboxIndicator
                alignItems="center"
                justifyContent="center"
                borderRadius="$full"
                bg="transparent"
                borderWidth={isCompleted ? 0 : 1}
                sx={{
                  _checked: {
                    bg: "transparent",
                  },
                  _hover: {
                    bg: "transparent",
                  },
                  _focus: {
                    bg: "transparent",
                  },
                  _disabled: {
                    bg: "transparent",
                  },
                }}
              >
                <CheckboxIcon as={LucideIcon} name={"CheckCircle"} size={20} color={"$success500"}/>
              </CheckboxIndicator>
            </Checkbox>
          )}
        </Box>
      );
    }
    
    // Status Circle Logic
    const isOptional = task?.isDeletable;
    let checkColor: string = "$textMuted";
    let iconName: string = "Circle"; // default icon is 'CheckCircle'

    if (isOnboardingTask) {
      checkColor = isCompleted ? "$success500" : "$textMuted";
      iconName = isCompleted ? "CheckCircle" : "Circle";
    } else if (isChildOfProject) {
      if (isOptional) {
        if (isPreview) {
          if (isAddedToPlan) {
            checkColor = "$success500";
            iconName = "CheckCircle";
          } else if (isRejected) {
            checkColor = "$error500";
            iconName = "X";
          } else {
            checkColor = "$warning500";
            iconName = "Circle";
          }
        } else if (isAddedToPlan) {
          checkColor = "$success500";
          iconName = "CheckCircle";
        } else {
          iconName = "CheckCircle";
        }
      } else {
        checkColor = "$success500";
        iconName = "CheckCircle";
      }
    } else {
      checkColor = isCompleted ? "$success500" : "$textMuted";
      iconName = isCompleted ? "CheckCircle" : "Circle";
    }

    // Optionally remove dev logging in production
    // console.log('isStatusUpdating', isCompleted, isPreview && isRejected);

    return isStatusUpdating ? (
      <Spinner size="small" color="$primary500" />
    ) : (
      <LucideIcon
        name={iconName}
        size={20}
        color={checkColor}
      />
    );
  };
  
  // Render task information (name and description) - HEAD logic with Badges
  const renderTaskInfo = () => {
    const textStyle = uiConfig.showCheckbox
      ? {
          textDecorationLine: 'none' as const,
          // (isCompleted ? 'line-through' : 'none') as
          //   | 'line-through'
          //   | 'none',
          opacity: isCompleted ? 0.6 : 1,
        }
      : {};

    const titleTypography = uiConfig.showAsCard ? TYPOGRAPHY.h4 : TYPOGRAPHY.h3;

    // Task badge rendering (Evidence Required / Optional)
    // In Edit mode, hide Optional badges - only show 'required' type badges
    // const isEditModeForBadge = isEdit && !isPreview;
    // In preview mode, show badge for deletable tasks even if metaInformation is not set
    const shouldShowBadge =
      (isPreview && task?.isDeletable);

    const taskBadge = shouldShowBadge ? (
      <Box
        bg={
            task?.isDeletable === true || (isPreview && task?.isDeletable)
            ? '$optionalBadgeBg'
            : ''
        }
        paddingHorizontal="$3"
        paddingVertical="$1"
        borderRadius="$full"
        alignSelf="center"
      >
        <Text
          fontSize="$xs"
          fontWeight="$medium"
          color={
             task?.isDeletable === false
              ? '$warning900'
              : task?.isDeletable === true || (isPreview && task?.isDeletable)
              ? '$optionalBadgeText'
              : '$textMuted'
          }
        >
          {!task?.isDeletable || (isPreview && task?.isDeletable ? 'Optional' : '')}
        </Text>
      </Box>
    ) : null;

    // Status badge for Intervention Plan Edit mode only (not Onboarding)
    // isInterventionPlanEditMode is true ONLY for Intervention Plan tasks that are children of pillars
    const isEditModeOnly = isInterventionPlanEditMode;
    const isObservationTask = task.type === TASK_TYPE.OBSERVATION;
    const statusBadge =
      isEditModeOnly && uiConfig.showAsCard ? (
        <Tooltip
          isDisabled={!isManualToggleDisabled || isStatusUpdating || isTaskDone}
          placement="top"
          trigger={(triggerProps: any) => (
            <Pressable
              {...triggerProps}
              disabled
            >
              {(state: any) => {        
                const isHovered = state?.hovered || state?.pressed || false;
                const isDone = isTaskDone;
                return (
                  <Box
                    {...taskCardStyles.statusBadge}
                    {...(isDone ? (isHovered ? taskCardStyles.statusBadgeDoneHover : taskCardStyles.statusBadgeDone) : taskCardStyles.statusBadgeToDo)}
                    opacity={isManualToggleDisabled ? 1 : undefined} 
                    minWidth={50}
                    justifyContent="center"
                  >
                    <Text
                      {...(isDone ? (isHovered ? taskCardStyles.statusBadgeDoneTextHover : taskCardStyles.statusBadgeDoneText) : taskCardStyles.statusBadgeToDoText)}
                      opacity={isStatusUpdating ? 0.5 : 1}
                    >
                      {isDone ? t('projectPlayer.done') : t('projectPlayer.toDo')}
                    </Text>
                  </Box>
                );
              }}
            </Pressable>
          )}
        >
          <TooltipContent {...taskCardStyles.tooltipContent}>
            <TooltipText {...taskCardStyles.tooltipText}>
              {isObservationTask
                ? (t('projectPlayer.completeFormToMarkDone') || 'Complete the form first to mark this task as done')
                : (t('projectPlayer.uploadEvidenceToMarkDone') || 'Upload evidence first to mark this task as done')}
            </TooltipText>
          </TooltipContent>
        </Tooltip>
      ) : null;

    const evidenceRequiredBadge = (isEvidenceRequired || isObservationTask) && uiConfig.showAsCard && isInterventionPlanEditMode ? (
      <Box {...taskAccordionStyles.actionRequiredBadge}>
        <Text {...taskAccordionStyles.actionRequiredText}>
          {t('projectPlayer.evidenceRequired') || 'Evidence Required'}
        </Text>
      </Box>
    ) : null;

    // In Edit mode only (non-preview), hide description
    // const showDescription = !isEditModeOnly || !uiConfig.showAsCard;

    // Wrap content in Pressable for Observation tasks in Edit mode to allow opening the form by clicking the text
    const ContentWrapper = ({ children }: { children: React.ReactNode }) => {
      const isInterventionPlanEditMode = isEdit && !isPreview && isChildOfProject;
      const isObservationTask = task.type === TASK_TYPE.OBSERVATION;

      if (isInterventionPlanEditMode && isObservationTask) {
        return (
          <Pressable onPress={handleTaskClick}>
            {children}
          </Pressable>
        );
      }
      return <>{children}</>;
    };

    return (
      <VStack space="xs" flex={1}>
        {/* Preview mode OR Read-only mode: title and badges on same line */}
        {isPreview || isReadOnly ? (
          <HStack space="sm" alignItems="center" flexWrap="wrap">
            <Text
              {...titleTypography}
              color="$textPrimary"
                {...textStyle}
              fontSize={
                (!isWeb && !uiConfig.showAsCard
                  ? '$sm'
                  : (titleTypography as any).fontSize) as any
              }
              style={isWeb ? (taskCardStyles.webTextWrap as any) : undefined}
            >
              {task?.name}
            </Text>
            {taskBadge}
            {evidenceRequiredBadge}
          </HStack>
        ) : (
          /* Edit mode: title on first line, badges on second line */
          <>
            <ContentWrapper>
              <Pressable
                onPress={() => {
                  if (!isManualToggleDisabled) {
                    handleCheckboxChange(!isCompleted);
                  }
                }}
              >
                <Text
                  {...titleTypography}
                  color="$textPrimary"
                  {...textStyle}
                  fontSize={
                    (!isWeb && !uiConfig.showAsCard
                      ? '$sm'
                      : (titleTypography as any).fontSize) as any
                  }
                  fontWeight={
                    (titleTypography as any).fontWeight
                  }
                  style={isWeb ? (taskCardStyles.webTextWrap as any) : undefined}
                >
                  {task.name}
                </Text>
              </Pressable>
            </ContentWrapper>
            <HStack space="sm"  alignItems="center" flexWrap="wrap">
              {statusBadge}
              {taskBadge}
              {evidenceRequiredBadge}
              {/* File count tag for Edit mode when files exist */}
              {isEditModeOnly &&
                task.attachments &&
                task.attachments.length > 0 && (
                  <Pressable onPress={() => setShowPreviewModal(true)}>
                    {(state: any) => {
                      const isHovered =
                        state?.hovered || state?.pressed || false;
                      return (
                        <Box
                          {...taskCardStyles.fileCountTag}
                          {...(isHovered ? taskCardStyles.fileCountTagHover : {})}
                        >
                          <HStack space="xs" alignItems="center">
                            <LucideIcon
                              name="Paperclip"
                              size={taskCardStyles.fileCountIcon.size}
                              color={
                                isHovered
                                  ? "$primary500"
                                  : "$textPrimary"
                              }
                            />
                            <Text
                              {...taskCardStyles.fileCountText}
                              color={
                                isHovered ? '$primary500' : '$textPrimary'
                              }
                              style={isHovered ? (taskCardStyles.fileCountTextHover as any) : undefined}
                            >
                              {task.attachments?.length}{' '}
                              {task.attachments?.length === 1
                                ? t('projectPlayer.file')
                                : t('projectPlayer.files')}
                            </Text>
                          </HStack>
                        </Box>
                      );
                    }}
                  </Pressable>
                )}
            </HStack>
          </>
        )}
        {/* {showDescription && task?.description && (
          <Text
            {...(uiConfig.showAsCard
              ? TYPOGRAPHY.bodySmall
              : TYPOGRAPHY.paragraph)}
            color="$textSecondary"
            lineHeight="$lg"
            {...textStyle}
            style={isWeb ? (taskCardStyles.webTextWrap as any) : undefined}
          >
            {task.description}
          </Text>
        )} */}
      </VStack>
    );
  };

  // Render action button (HEAD logic)
  const renderActionButton = () => {
    if (!uiConfig.showActionButton) return null;

    // In Preview mode only: If task is optional, show tick/cross buttons
    if (isPreview && task?.isDeletable) {
      return (
        <HStack space="xs" alignItems="center">
          <Pressable
            onPress={() => {
              updateAddToPlan(true);
              setIsRejected(false);
            }}
          >
            {(state: any) => {
              const isHovered = state?.hovered || state?.pressed || false;
              return (
                <Box
                  bg={isAddedToPlan ? '$tickButtonActiveBg' : isHovered ? '$success100' : 'transparent'}
                  padding="$2"
                  borderRadius="$lg"
                  borderWidth={1}
                  borderColor={isAddedToPlan ? '$tickButtonActiveBg' : '$success500'}
                  $web-cursor="pointer"
                >
                  <LucideIcon
                    name="Check"
                    size={16}
                    color={isAddedToPlan ? "$white" : "$success500"}
                    strokeWidth={3}
                  />
                </Box>
              );
            }}
          </Pressable>
          <Pressable
            onPress={() => {
              updateAddToPlan(false);
              setIsRejected(true);
            }}
          >
            {(state: any) => {
              const isHovered = state?.hovered || state?.pressed || false;
              return (
                <Box
                  bg={isHovered || isRejected ? '$error100' : 'transparent'}
                  padding="$2"
                  borderRadius="$lg"
                  borderWidth={1}
                  borderColor="$error500"
                  $web-cursor="pointer"
                >
                  <LucideIcon
                    name="X"
                    size={16}
                    color={"$error500"}
                    strokeWidth={3}
                  />
                </Box>
              );
            }}
          </Pressable>
        </HStack>
      );
    }

    const iconName = task.metaInformation?.icon || 'Upload';

    return <Button
      onPress={handleTaskClick}
      isDisabled={isReadOnly || isStatusUpdating}
      size={isWeb ? (uiConfig.showAsCard || isOnboardingTask ? 'xs' : 'md') : 'xs'}
      // @ts-ignore
      variant="outlineghost"
      $web-cursor={isEdit ? 'pointer' : undefined}
    >
      <ButtonIcon name={iconName} size={16} as={LucideIcon} />
      <ButtonText
        {...TYPOGRAPHY.button}
        {...taskCardStyles.actionButtonText}
        fontSize={uiConfig.showAsCard || isOnboardingTask || !isWeb ? '$xs' : undefined}
      >
        {task.metaInformation?.buttonLabel || t('projectPlayer.upload')}
      </ButtonText>
    </Button>
  };

  // Render divider
  const renderDivider = () => {
    if (isLastTask) return null;
    return (
      <Box
        {...taskCardStyles.divider}
        marginVertical={
          !isWeb ? '$2' : isChildOfProject && isPreview ? '$1' : undefined
        }
        marginHorizontal={!isChildOfProject ? '$5' : undefined}
      />
    );
  };

  // Render file upload modal (HEAD logic)
  const renderUploadModal = () => {
    let maxFiles, allowedFileTypes;
    if (isOnboardingTask) {
      const slaConsentTasks = [process.env.UPLOAD_CONSENT_TASK_ID, process.env.UPLOAD_SLA_TASK_ID];
      if (slaConsentTasks.includes(task?.referenceId)) {
        maxFiles = 1;
        allowedFileTypes = ['pdf']
      }
    }
    maxFiles = task?.metaInformation?.maxFiles || maxFiles
    allowedFileTypes = task?.metaInformation?.allowedFileTypes as string[] | undefined || allowedFileTypes
    
    return <FileUploadModal
      isOpen={showUploadModal}
      onClose={() => setShowUploadModal(false)}
      taskName={task?.name}
      participantName={!isChildOfProject ? config.profileInfo?.name : undefined}
      existingAttachments={task?.attachments}
      maxFileUploadCount={maxFiles}
      allowedFileTypes={allowedFileTypes}
      onUpload={method => {
        logger.info('Upload method selected:', method);
      }}
      onConfirm={async (files) => {
        setIsStatusUpdating(true);
        try {
          const newFiles = files?.filter(file => !task?.attachments?.find(file1 => file?.url === file1?.url));
          const data = await handleStatusChange(task._id, TASK_STATUS.COMPLETED, newFiles,(maxFiles && maxFiles > 1) ? task?.attachments:[]);
          if (data?.success) {
            // Show success toast with task-specific message
            let updates;
            const attachedFiles = data?.data?.attachments?.map((file: any) => file) ?? [];
            const thisDate = new Date().toISOString();
            if (isOnboardingTask && attachedFiles.length > 0) {
              const slaConsentTasks = [process.env.UPLOAD_CONSENT_TASK_ID, process.env.UPLOAD_SLA_TASK_ID];
              if (slaConsentTasks.includes(task?.referenceId)) {
                if (!user?.id || !participantId) {
                  showError(t('projectPlayer.evidenceUploadFailed'));
                  return;
                }
                if (task?.referenceId === process.env.UPLOAD_CONSENT_TASK_ID) {
                  updates = {
                    consentFiles: attachedFiles,
                    consentUpdloadedAt: thisDate,
                  }
                }
                if (task?.referenceId === process.env.UPLOAD_SLA_TASK_ID) {
                  updates = {
                    slaFiles: attachedFiles,
                    slaUpdloadedAt: thisDate,
                  }
                }
                try {
                  await updateEntityDetails({
                    userId: `${user?.id}`,
                    entityId: participantId,
                    entityUpdates: updates
                  });

                  await createOrUpdateProgramUserMapping({
                    userId: participantId,
                    programId: process.env.GLOBAL_LC_PROGRAM_ID,
                    metaInformation: updates,
                    status: STATUS.NOT_ONBOARDED
                  });
                } catch {
                  showError(t('projectPlayer.evidenceUploadFailed'));
                  return;
                }
              }
            }
            showSuccess(t('projectPlayer.evidenceUploaded'));
            setShowUploadModal(false);
          } else {
            showError(t('projectPlayer.evidenceUploadFailed'));
          }
        } finally {
          setIsStatusUpdating(false);
        }
      }}
    />
  };

  // Render evidence preview modal (for viewing uploaded files in Edit mode)
  const renderPreviewModal = () => (
    <EvidencePreviewModal
      isOpen={showPreviewModal}
      onClose={() => setShowPreviewModal(false)}
      taskName={task?.name}
      attachments={task?.attachments || []}
    />
  );

  // Main Render Logic
  let mainContent;

  // Onboarding step card format: light grey card with circle, title, description, action button
  if (isOnboardingTask) {
    mainContent = (
      <Box
        {...taskCardStyles.onboardingStepCard}
        paddingVertical={isMobile ? '$4' : '$4'}
        marginBottom={isLastTask ? 0 : (isMobile ? taskCardStyles.onboardingCardMarginBottomMobile : taskCardStyles.onboardingCardMarginBottomDesktop)}
      >
        {isMobile ? (
          <VStack {...taskCardStyles.onboardingMobileContainer}>
            {/* Row 1: Circle + Title + Description */}
            <HStack {...taskCardStyles.onboardingMobileRow}>
              <Box {...taskCardStyles.onboardingMobileCircleBox}>
                {renderStatusIndicator()}
              </Box>
              <VStack {...taskCardStyles.onboardingMobileTextContainer}>
                <Text
                  {...TYPOGRAPHY.h4}
                  {...taskCardStyles.onboardingTitleText}
                  {...onboardingTextStyle}
                  style={isWeb ? ([taskCardStyles.webTextWrap, onboardingTextStyle] as any) : onboardingTextStyle}
                >
                  {task?.name}
                </Text>
                {task?.description && (
                  <Text
                    {...TYPOGRAPHY.bodySmall}
                    {...taskCardStyles.onboardingDescriptionText}
                    {...onboardingDescStyle}
                    style={isWeb ? ([taskCardStyles.webTextWrap, onboardingDescStyle] as any) : onboardingDescStyle}
                  >
                    {task?.description}
                  </Text>
                )}
              </VStack>
            </HStack>
            {/* Row 2: Button */}
            <Box>
              {renderActionButton()}
              {renderCustomTaskActions({
                isCustomTask: isReadOnly ? false : task?.isCustomTask || false,
                onEdit: openEditModal,
                onDelete: openDeleteModal,
              })}
            </Box>
          </VStack>
        ) : (
          <HStack {...taskCardStyles.onboardingDesktopContainer}>
            <Box {...taskCardStyles.onboardingDesktopCircleBox}>
              {renderStatusIndicator()}
            </Box>
            <VStack {...taskCardStyles.onboardingDesktopTextContainer}>
              <Text
                {...TYPOGRAPHY.h4}
                {...taskCardStyles.onboardingTitleText}
                {...onboardingTextStyle}
                style={isWeb ? ([taskCardStyles.webTextWrap, onboardingTextStyle] as any) : onboardingTextStyle}
              >
                {task?.name}
              </Text>
              {task?.description && (
                <Text
                  {...TYPOGRAPHY.bodySmall}
                  {...taskCardStyles.onboardingDescriptionText}
                  {...onboardingDescStyle}
                  style={isWeb ? ([taskCardStyles.webTextWrap, onboardingDescStyle] as any) : onboardingDescStyle}
                >
                  {task?.description}
                </Text>
              )}
            </VStack>
            <Box {...taskCardStyles.onboardingDesktopButtonBox}>
              {renderActionButton()}
              {renderCustomTaskActions({
                isCustomTask: isReadOnly ? false : task?.isCustomTask || false,
                onEdit: openEditModal,
                onDelete: openDeleteModal,
              })}
            </Box>
          </HStack>
        )}
      </Box>
    );
  } else if (uiConfig.showAsCard) {
    mainContent = (
      <Card
        {...taskCardStyles.childCard}
        bg={
          isEdit && !isPreview && task.type === TASK_TYPE.OBSERVATION
            ? '$observationTaskBg'
            : isPreview && task?.isDeletable
              ? isAddedToPlan
                ? '$optionalTaskGreenBg'
                : isRejected
                  ? '$socialProtectionAccordionBg'
                  : '$optionalTaskYellowBg'
              : isInterventionPlanEditMode
                ? '$stylesCardBg'
                : taskCardStyles.childCard?.bg
        }
        borderRadius={taskCardStyles.childCard?.borderRadius as any}
        borderColor={
          isEdit && !isPreview && task.type === TASK_TYPE.OBSERVATION
            ? '$observationTaskBorder'
            : isPreview && task?.isDeletable
              ? isAddedToPlan
                ? '$optionalTaskGreenBorder'
                : isRejected
                  ? '$error200'
                  : '$optionalTaskYellowBorder'
              : taskCardStyles.childCard?.borderColor
        }
      >
        <HStack
          alignItems="flex-start"
          space="md"
          flexDirection={isMobile ? 'column' : 'row'}
        >
          {isMobile ? (
            <VStack space="sm" width="100%">
              <HStack
                alignItems="flex-start"
                space={isPreview ? "md" : "sm"}
                width="100%"
              >
                <Box flexShrink={0}>
                  {renderStatusIndicator()}
                </Box>
                <Box flex={1}>
                  {renderTaskInfo()}
                </Box>
                <Box flexShrink={0}>
                  {isPreview ? (
                    <HStack space="xs" alignItems="center">
                      {renderActionButton()}
                      {renderCustomTaskActions({
                        isCustomTask: isReadOnly ? false : task?.isCustomTask || false,
                        onEdit: openEditModal,
                        onDelete: openDeleteModal,
                      })}
                    </HStack>
                  ) : (
                    renderCustomTaskActions({
                      isCustomTask: isReadOnly ? false : task?.isCustomTask || false,
                      onEdit: openEditModal,
                      onDelete: openDeleteModal,
                    })
                  )}
                </Box>
              </HStack>
              {!isPreview && (
                <Box width="100%">
                  {renderActionButton()}
                </Box>
              )}
            </VStack>
          ) : (
            <>
              <Box flexShrink={0} mt="$1">
                {renderStatusIndicator()}
              </Box>
              <Box flex={1} minWidth="$0">
                {renderTaskInfo()}
              </Box>
              <Box flexShrink={0}>
                <HStack space="xs" alignItems="center">
                  {renderActionButton()}
                  {renderCustomTaskActions({
                    isCustomTask: isReadOnly ? false : task?.isCustomTask || false,
                    onEdit: openEditModal,
                    onDelete: openDeleteModal,
                  })}
                </HStack>
              </Box>
            </>
          )}
        </HStack>
      </Card>
    );
  } else if (isChildOfProject && isPreview) {
    // Inline style for preview mode with project children
    mainContent = (
      <HStack
        {...taskCardStyles.previewInlineContainer}
        padding={isWeb ? '$4' : '$0'}
        bg={
          isAddedToPlan
            ? '$addedToPlanBg'
            : isRejected
              ? '$error50'
              : '$warning50'
        }
        borderColor={
          isAddedToPlan
            ? '$addedToPlanBorder'
            : isRejected
              ? '$error200'
              : '$warning200'
        }
        borderWidth={1}
        borderRadius="$lg"
        marginBottom="$2"
        alignItems="flex-start"
        space={isWeb ? 'md' : 'xs'}
      >
        <Box flexShrink={0} mt="$1">
          {renderStatusIndicator()}
        </Box>
        <Box flex={1} minWidth={isWeb ? '$0' : undefined}>
          {renderTaskInfo()}
        </Box>
        <Box flexShrink={0}>
          {renderActionButton()}
          {renderCustomTaskActions({
            isCustomTask: isReadOnly ? false : task?.isCustomTask || false,
            onEdit: openEditModal,
            onDelete: openDeleteModal,
          })}
        </Box>
      </HStack>
    );
  } else {
    // Default inline style for regular tasks
    mainContent = (
      <Box
        {...taskCardStyles.regularTaskContainer}
        paddingVertical={isMobile ? '$5' : '$2'}
      >
        <HStack
          alignItems="flex-start"
          space={isWeb ? 'md' : 'sm'}
          flexDirection={isMobile ? 'column' : 'row'}
        >
          {/* 🔹 Status + Info Section */}
          {isMobile ? (
            <Box flexDirection="row">
              <Box flexShrink={0} mt="$1">
                {renderStatusIndicator()}
              </Box>
              <Box flex={1} marginLeft="$1">
                {renderTaskInfo()}
              </Box>
            </Box>
          ) : (
            <>
              <Box flexShrink={0} mt="$1">
                {renderStatusIndicator()}
              </Box>
              <Box flex={1} minWidth="$0">
                {renderTaskInfo()}
              </Box>
            </>
          )}

          {/* 🔹 Actions Section */}
          <Box flexShrink={0} width={isMobile ? '100%' : 'auto'}>
            {renderActionButton()}
            {renderCustomTaskActions({
              isCustomTask: isReadOnly ? false : task?.isCustomTask || false,
              onEdit: openEditModal,
              onDelete: openDeleteModal,
            })}
          </Box>
        </HStack>
      </Box>
    );
  }

  return (
    <>
      {mainContent}
      {!uiConfig.showAsCard && !isOnboardingTask && renderDivider()}
      {renderUploadModal()}
      {renderPreviewModal()}
      {renderModals({
        modalState,
        onCloseModal: closeModal,
        onConfirmDelete: handleConfirmDelete,
        confirmDeleteLoading,
        taskName: task?.name,
        t,
      })}
    </>
  );
};

export default TaskCard;