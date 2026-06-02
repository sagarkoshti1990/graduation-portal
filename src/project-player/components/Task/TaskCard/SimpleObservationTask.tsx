import React, {
  memo,
  useState,
  useMemo,
  useCallback,
} from 'react';
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
  useAlert,
  Tooltip,
  TooltipContent,
  TooltipText,
  Spinner,
  ButtonIcon,
} from '@ui';
import { useProjectContext } from '../../../context/ProjectContext';
import { useTaskActions } from '../../../hooks/useTaskActions';
import { useLanguage } from '@contexts/LanguageContext';
import {
  TASK_STATUS,
  STATUS,
} from '../../../../constants/app.constant';
import { taskCardStyles } from './styles';
import { taskAccordionStyles } from '../TaskAccordion/styles';
import { LucideIcon } from '@ui/index';
import { theme } from '@config/theme';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';
import FileUploadModal from '../FileEvidence/FileUploadModal';
import EvidencePreviewModal from '../FileEvidence/EvidencePreviewModal';
import { usePlatform } from '@utils/platform';
import { getSolutionDetails } from '../../../services/projectPlayerService';
import { isNetworkOffline } from '../../../../services/dataService';
import logger from '@utils/logger';
import { useAuth } from '@contexts/AuthContext';
import {
  createOrUpdateProgramUserMapping,
  updateEntityDetails,
} from '../../../../services/participantService';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTaskPermissions } from './hooks/useTaskPermissions';
import { useTaskStatus } from './hooks/useTaskStatus';
import {
  getStatusIconConfig,
  getActionIconName,
  getUploadConfig,
} from './utils/taskStatusUtils';
import { filterNewFiles, buildOnboardingFileUpdate } from './utils/taskTransformers';
import type { Task } from '../../../types/project.types';

// ── Module-level stable sub-components ────────────────────────────────────────

interface ContentWrapperProps {
  isInterventionPlanEditMode: boolean;
  isObservationTask: boolean;
  onPress: () => void;
  children: React.ReactNode;
}

const ContentWrapper = memo<ContentWrapperProps>(
  ({ isInterventionPlanEditMode, isObservationTask, onPress, children }) => {
    if (isInterventionPlanEditMode && isObservationTask) {
      return <Pressable onPress={onPress}>{children}</Pressable>;
    }
    return <>{children}</>;
  },
);
ContentWrapper.displayName = 'ContentWrapper';

const EmptyCircleTrigger = (triggerProps: any) => (
  <Pressable {...triggerProps} cursor="default">
    <Box
      {...taskCardStyles.primaryFilledCircle}
      borderColor="$textMuted"
      bg="$backgroundPrimary.light"
    />
  </Pressable>
);

interface StatusBadgeTriggerProps {
  triggerProps: any;
  isTaskDone: boolean;
  isManualToggleDisabled: boolean;
  isStatusUpdating: boolean;
  doneText: string;
  toDoText: string;
}

const StatusBadgeTrigger = memo<StatusBadgeTriggerProps>(
  ({ triggerProps, isTaskDone, isManualToggleDisabled, isStatusUpdating, doneText, toDoText }) => {
    const [isHovered, setIsHovered] = useState(false);
    return (
      <Pressable
        {...triggerProps}
        disabled
        onHoverIn={() => setIsHovered(true)}
        onHoverOut={() => setIsHovered(false)}
      >
        <Box
          {...taskCardStyles.statusBadge}
          {...(isTaskDone
            ? isHovered ? taskCardStyles.statusBadgeDoneHover : taskCardStyles.statusBadgeDone
            : taskCardStyles.statusBadgeToDo)}
          opacity={isManualToggleDisabled ? 1 : undefined}
          minWidth={50}
          justifyContent="center"
        >
          <Text
            {...(isTaskDone
              ? isHovered ? taskCardStyles.statusBadgeDoneTextHover : taskCardStyles.statusBadgeDoneText
              : taskCardStyles.statusBadgeToDoText)}
            opacity={isStatusUpdating ? 0.5 : 1}
          >
            {isTaskDone ? doneText : toDoText}
          </Text>
        </Box>
      </Pressable>
    );
  },
);
StatusBadgeTrigger.displayName = 'StatusBadgeTrigger';

// ─────────────────────────────────────────────────────────────────────────────

export interface SimpleObservationTaskProps {
  task: Task;
  isLastTask?: boolean;
  isChildOfProject?: boolean;
  isOnboardingTask?: boolean;
  /** Edit/delete action buttons injected by CustomTaskManager. */
  extraActions?: React.ReactNode;
}

const SimpleObservationTask = memo<SimpleObservationTaskProps>(({
  task,
  isLastTask = false,
  isChildOfProject = false,
  isOnboardingTask = false,
  extraActions,
}) => {
  const { projectData, config } = useProjectContext();
  const route = useRoute();
  const navigation = useNavigation();
  const { handleStatusChange, handleAddToPlan } = useTaskActions();
  const { isWeb, isMobile } = usePlatform();
  const { t } = useLanguage();
  const { showAlert } = useAlert();
  const { user } = useAuth();

  const participantId = (route.params as any)?.id;

  const { isReadOnly, isPreview, isEdit, isInterventionPlanEditMode } =
    useTaskPermissions(isChildOfProject);

  const {
    isCompleted, isObservationTask, hasUploadedFiles, isEvidenceRequired,
    isTaskDone, isOnboardingCompletedUI, isManualToggleDisabled,
    isAddedToPlan, setIsAddedToPlan, isRejected, setIsRejected,
  } = useTaskStatus(task, isOnboardingTask);

  // ── Local state ──────────────────────────────────────────────────────────
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);

  // ── Derived values ────────────────────────────────────────────────────────

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

  const onboardingTextStyle = useMemo(
    () => ({ textDecorationLine: 'none' as const, opacity: isOnboardingCompletedUI ? 0.6 : 1 }),
    [isOnboardingCompletedUI],
  );

  const onboardingDescStyle = useMemo(
    () => ({ opacity: isOnboardingCompletedUI ? 0.6 : 1 }),
    [isOnboardingCompletedUI],
  );

  const actionIconName = useMemo(() => getActionIconName(task), [task.metaInformation?.icon, task.type]);

  const uploadConfig = useMemo(
    () => getUploadConfig(task, isOnboardingTask),
    [isOnboardingTask, task?.referenceId, task?.metaInformation?.maxFiles, task?.metaInformation?.allowedFileTypes],
  );

  // ── Callbacks ─────────────────────────────────────────────────────────────

  const showSuccess = useCallback((msg: string) => showAlert('success', msg), [showAlert]);
  const showError = useCallback((msg: string) => showAlert('error', msg), [showAlert]);

  const updateAddToPlan = useCallback(
    (added: boolean) => { handleAddToPlan(task._id, added); setIsAddedToPlan(added); },
    [handleAddToPlan, task._id],
  );
  const handleAcceptTask = useCallback(() => { updateAddToPlan(true); setIsRejected(false); }, [updateAddToPlan]);
  const handleRejectTask = useCallback(() => { updateAddToPlan(false); setIsRejected(true); }, [updateAddToPlan]);

  const handleTaskClick = useCallback(async () => {
    if (!isEdit) return;
    if (isObservationTask) {
      const projectTemplateId = projectData?._id;
      if (!participantId || !projectTemplateId) { console.error('Missing userId or projectTemplateId'); return; }
      if (isNetworkOffline()) {
        const offlineSolutionId: string =
          task.solutionDetails?._id ?? (task.solutionDetails as any)?.observationId ?? (task.solutionDetails as any)?.id ?? '';
        if (offlineSolutionId) {
          // @ts-ignore
          navigation.navigate('observation', { id: participantId, solutionId: offlineSolutionId, submissionNumber: 1, taskId: task._id });
        } else { showAlert('error', t('projectPlayer.unableToLoadObservation')); }
        return;
      }
      try {
        const solutionDetails = await getSolutionDetails(projectTemplateId, task._id);
        if (solutionDetails?.data?._id) {
          // @ts-ignore
          navigation.navigate('observation', { id: participantId, solutionId: solutionDetails.data._id, submissionNumber: 1, taskId: task._id });
        } else { showAlert('error', t('projectPlayer.unableToLoadObservation')); }
      } catch (error) {
        console.error('getSolutionDetails API failed:', error);
        showAlert('error', t('projectPlayer.unableToLoadObservation'));
      }
    } else {
      setShowUploadModal(true);
    }
  }, [isEdit, isObservationTask, task._id, task.solutionDetails, participantId, projectData?._id, navigation, showAlert, t]);

  const handleCheckboxChange = useCallback(async (checked: boolean) => {
    if (!isEdit) return;
    setIsStatusUpdating(true);
    try {
      await handleStatusChange(task._id, checked ? TASK_STATUS.COMPLETED : TASK_STATUS.TO_DO);
    } finally { setIsStatusUpdating(false); }
  }, [isEdit, task._id, handleStatusChange]);

  const handleTitlePress = useCallback(() => {
    if (!isManualToggleDisabled) handleCheckboxChange(!isCompleted);
  }, [isManualToggleDisabled, handleCheckboxChange, isCompleted]);

  const updateEntityFile = useCallback(async (data: any) => {
    if (data?.success) {
      const attachedFiles = data?.data?.attachments?.map((f: any) => f) ?? [];
      const thisDate = new Date().toISOString();
      if (isOnboardingTask && attachedFiles.length > 0) {
        const updates = buildOnboardingFileUpdate(task, attachedFiles, thisDate);
        if (updates) {
          if (!user?.id || !participantId) { showError(t('projectPlayer.evidenceUploadFailed')); return; }
          try {
            await updateEntityDetails({ userId: `${user?.id}`, entityId: participantId, entityUpdates: updates });
            await createOrUpdateProgramUserMapping({ userId: participantId, programId: process.env.GLOBAL_LC_PROGRAM_ID, metaInformation: updates, status: STATUS.NOT_ONBOARDED });
          } catch { showError(t('projectPlayer.evidenceUploadFailed')); return; }
        }
      }
      showSuccess(t('projectPlayer.evidenceUploaded'));
      setShowUploadModal(false);
    } else {
      showError(t('projectPlayer.evidenceUploadFailed'));
    }
  }, [isOnboardingTask, task, user?.id, participantId, showError, showSuccess, t]);

  const handleUploadConfirm = useCallback(async (files?: any[]) => {
    if (!files?.length) return;
    setIsStatusUpdating(true);
    try {
      const newFiles = filterNewFiles(files, task?.attachments);
      const data = await handleStatusChange(
        task._id, TASK_STATUS.COMPLETED, newFiles,
        uploadConfig.maxFiles && uploadConfig.maxFiles > 1 ? task?.attachments : [],
      );
      if (!isNetworkOffline()) await updateEntityFile(data);
    } finally { setIsStatusUpdating(false); }
  }, [task._id, task?.attachments, handleStatusChange, uploadConfig.maxFiles, updateEntityFile]);

  const handleCloseUploadModal = useCallback(() => setShowUploadModal(false), []);
  const handleClosePreviewModal = useCallback(() => setShowPreviewModal(false), []);
  const handleOpenPreviewModal = useCallback(() => setShowPreviewModal(true), []);
  const handleUploadMethodSelect = useCallback((method: any) => logger.info('Upload method:', method), []);

  const statusBadgeTrigger = useCallback(
    (triggerProps: any) => (
      <StatusBadgeTrigger
        triggerProps={triggerProps}
        isTaskDone={isTaskDone}
        isManualToggleDisabled={isManualToggleDisabled}
        isStatusUpdating={isStatusUpdating}
        doneText={t('projectPlayer.done')}
        toDoText={t('projectPlayer.toDo')}
      />
    ),
    [isTaskDone, isManualToggleDisabled, isStatusUpdating, t],
  );

  // ── Render functions ──────────────────────────────────────────────────────

  const renderStatusIndicator = useCallback(() => {
    if (isInterventionPlanEditMode && (isObservationTask || isEvidenceRequired)) {
      if (isStatusUpdating) {
        return (
          <Box {...taskCardStyles.primaryFilledCircle} borderColor="transparent" bg="transparent">
            <Spinner size="small" color={theme.tokens.colors.primary500} />
          </Box>
        );
      }
      if (isTaskDone) return <LucideIcon name="CheckCircle" size={20} color="$success500" />;
      const tooltipText = isObservationTask ? t('projectPlayer.completeFormToMarkDone') : t('projectPlayer.uploadEvidenceToMarkDone');
      return (
        <Tooltip placement="top" trigger={EmptyCircleTrigger}>
          <TooltipContent {...taskCardStyles.tooltipContent}>
            <TooltipText {...taskCardStyles.tooltipText}>{tooltipText}</TooltipText>
          </TooltipContent>
        </Tooltip>
      );
    }

    if (uiConfig.showCheckbox) {
      return (
        <Box alignItems="center" justifyContent="center">
          {isStatusUpdating ? (
            <Spinner size="small" color="$primary500" />
          ) : (
            <Checkbox
              value={task?._id} isChecked={isCompleted} onChange={handleCheckboxChange}
              isDisabled={isReadOnly} size="md"
              aria-label={`Mark ${task?.name} as ${isCompleted ? 'incomplete' : 'complete'}`}
              opacity={isReadOnly ? 0.6 : 1}
            >
              <CheckboxIndicator
                alignItems="center" justifyContent="center" borderRadius="$full"
                bg="transparent" borderWidth={isCompleted ? 0 : 1}
                sx={{ _checked: { bg: 'transparent' }, _hover: { bg: 'transparent' }, _focus: { bg: 'transparent' }, _disabled: { bg: 'transparent' } }}
              >
                <CheckboxIcon as={LucideIcon} name="CheckCircle" size={20} color="$success500" />
              </CheckboxIndicator>
            </Checkbox>
          )}
        </Box>
      );
    }

    const { iconName, checkColor } = getStatusIconConfig({
      isOnboardingTask, isChildOfProject, isCompleted,
      isOptional: !!task?.isDeletable, isPreview, isAddedToPlan, isRejected,
    });

    return isStatusUpdating
      ? <Spinner size="small" color="$primary500" />
      : <LucideIcon name={iconName} size={20} color={checkColor} />;
  }, [
    isInterventionPlanEditMode, isObservationTask, isEvidenceRequired, isStatusUpdating,
    isTaskDone, uiConfig.showCheckbox, isCompleted, handleCheckboxChange, isReadOnly,
    task, isOnboardingTask, isChildOfProject, isPreview, isAddedToPlan, isRejected, t,
  ]);

  const renderTaskInfo = useCallback(() => {
    const textStyle = uiConfig.showCheckbox ? { textDecorationLine: 'none' as const, opacity: isCompleted ? 0.6 : 1 } : {};
    const titleTypography = uiConfig.showAsCard ? TYPOGRAPHY.h4 : TYPOGRAPHY.h3;
    const titleFontSize = (!isWeb && !uiConfig.showAsCard ? '$sm' : (titleTypography as any).fontSize) as any;

    const taskBadge = isPreview && task?.isDeletable ? (
      <Box bg="$optionalBadgeBg" paddingHorizontal="$3" paddingVertical="$1" borderRadius="$full" alignSelf="center">
        <Text fontSize="$xs" fontWeight="$medium" color="$optionalBadgeText">Optional</Text>
      </Box>
    ) : null;

    const evidenceRequiredBadge = (isEvidenceRequired || isObservationTask) && uiConfig.showAsCard && isInterventionPlanEditMode ? (
      <Box {...taskAccordionStyles.actionRequiredBadge}>
        <Text {...taskAccordionStyles.actionRequiredText}>{t('projectPlayer.evidenceRequired') || 'Evidence Required'}</Text>
      </Box>
    ) : null;

    const statusBadge = isInterventionPlanEditMode && uiConfig.showAsCard ? (
      <Tooltip
        isDisabled={!isManualToggleDisabled || isStatusUpdating || isTaskDone}
        placement="top"
        trigger={statusBadgeTrigger}
      >
        <TooltipContent {...taskCardStyles.tooltipContent}>
          <TooltipText {...taskCardStyles.tooltipText}>
            {isObservationTask
              ? t('projectPlayer.completeFormToMarkDone') || 'Complete the form first to mark this task as done'
              : t('projectPlayer.uploadEvidenceToMarkDone') || 'Upload evidence first to mark this task as done'}
          </TooltipText>
        </TooltipContent>
      </Tooltip>
    ) : null;

    return (
      <VStack space="xs" flex={1}>
        {isPreview || isReadOnly ? (
          <HStack space="sm" alignItems="center" flexWrap="wrap">
            <Text {...titleTypography} color="$textPrimary" {...textStyle} fontSize={titleFontSize} style={isWeb ? (taskCardStyles.webTextWrap as any) : undefined}>{task?.name}</Text>
            {taskBadge}
            {evidenceRequiredBadge}
          </HStack>
        ) : (
          <>
            <ContentWrapper isInterventionPlanEditMode={isInterventionPlanEditMode} isObservationTask={isObservationTask} onPress={handleTaskClick}>
              <Pressable onPress={handleTitlePress}>
                <Text {...titleTypography} color="$textPrimary" {...textStyle} fontSize={titleFontSize} fontWeight={(titleTypography as any).fontWeight} style={isWeb ? (taskCardStyles.webTextWrap as any) : undefined}>{task.name}</Text>
              </Pressable>
            </ContentWrapper>
            <HStack space="sm" alignItems="center" flexWrap="wrap">
              {statusBadge}
              {taskBadge}
              {evidenceRequiredBadge}
              {isInterventionPlanEditMode && task.attachments && task.attachments.length > 0 && (
                <Button variant={"outlineghost" as any} px="$2" height="$6" onPress={handleOpenPreviewModal}>
                  <ButtonIcon as={LucideIcon} name="Paperclip" size={taskCardStyles.fileCountIcon.size} />
                  <ButtonText {...taskCardStyles.fileCountText}>
                    {task.attachments?.length}{' '}{task.attachments?.length === 1 ? t('projectPlayer.file') : t('projectPlayer.files')}
                  </ButtonText>
                </Button>
              )}
            </HStack>
          </>
        )}
      </VStack>
    );
  }, [
    uiConfig, isCompleted, isPreview, isReadOnly, isWeb, task, isInterventionPlanEditMode,
    isObservationTask, isEvidenceRequired, isManualToggleDisabled, isStatusUpdating, isTaskDone,
    handleTaskClick, handleTitlePress, handleOpenPreviewModal, statusBadgeTrigger, t,
  ]);

  const renderActionButton = useCallback(() => {
    if (!uiConfig.showActionButton) return null;
    if (isPreview && task?.isDeletable) {
      return (
        <HStack space="xs" alignItems="center">
          <Pressable onPress={handleAcceptTask}>
            {(state: any) => {
              const isHovered = state?.hovered || state?.pressed || false;
              return (
                <Box bg={isAddedToPlan ? '$tickButtonActiveBg' : isHovered ? '$success100' : 'transparent'} padding="$2" borderRadius="$lg" borderWidth={1} borderColor={isAddedToPlan ? '$tickButtonActiveBg' : '$success500'} $web-cursor="pointer">
                  <LucideIcon name="Check" size={16} color={isAddedToPlan ? '$white' : '$success500'} strokeWidth={3} />
                </Box>
              );
            }}
          </Pressable>
          <Pressable onPress={handleRejectTask}>
            {(state: any) => {
              const isHovered = state?.hovered || state?.pressed || false;
              return (
                <Box bg={isHovered || isRejected ? '$error100' : 'transparent'} padding="$2" borderRadius="$lg" borderWidth={1} borderColor="$error500" $web-cursor="pointer">
                  <LucideIcon name="X" size={16} color="$error500" strokeWidth={3} />
                </Box>
              );
            }}
          </Pressable>
        </HStack>
      );
    }
    return (
      <Button onPress={handleTaskClick} isDisabled={isReadOnly || isStatusUpdating} size={isWeb ? (uiConfig.showAsCard || isOnboardingTask ? 'xs' : 'md') : 'xs'} variant={"outlineghost" as any} $web-cursor={isEdit ? 'pointer' : undefined}>
        <ButtonIcon name={actionIconName} size={16} as={LucideIcon} />
        <ButtonText {...TYPOGRAPHY.button} {...taskCardStyles.actionButtonText} fontSize={uiConfig.showAsCard || isOnboardingTask || !isWeb ? '$xs' : undefined}>
          {task.metaInformation?.buttonLabel || t('projectPlayer.upload')}
        </ButtonText>
      </Button>
    );
  }, [uiConfig, isPreview, task, isAddedToPlan, isRejected, isReadOnly, isStatusUpdating, isWeb, isOnboardingTask, isEdit, actionIconName, handleTaskClick, handleAcceptTask, handleRejectTask, t]);

  const renderDivider = useCallback(() => {
    if (isLastTask) return null;
    return (
      <Box {...taskCardStyles.divider}
        marginVertical={!isWeb ? '$2' : isChildOfProject && isPreview ? '$1' : undefined}
        marginHorizontal={!isChildOfProject ? '$5' : undefined}
      />
    );
  }, [isLastTask, isWeb, isChildOfProject, isPreview]);

  // ── Main layout (memoized) ────────────────────────────────────────────────

  const mainContent = useMemo(() => {
    if (isOnboardingTask) {
      return (
        <Box {...taskCardStyles.onboardingStepCard} paddingVertical="$4"
          marginBottom={isLastTask ? 0 : isMobile ? taskCardStyles.onboardingCardMarginBottomMobile : taskCardStyles.onboardingCardMarginBottomDesktop}
        >
          {isMobile ? (
            <VStack {...taskCardStyles.onboardingMobileContainer}>
              <HStack {...taskCardStyles.onboardingMobileRow}>
                <Box {...taskCardStyles.onboardingMobileCircleBox}>{renderStatusIndicator()}</Box>
                <VStack {...taskCardStyles.onboardingMobileTextContainer}>
                  <Text {...TYPOGRAPHY.h4} {...taskCardStyles.onboardingTitleText} {...onboardingTextStyle} style={isWeb ? ([taskCardStyles.webTextWrap, onboardingTextStyle] as any) : onboardingTextStyle}>{task?.name}</Text>
                  {task?.description && <Text {...TYPOGRAPHY.bodySmall} {...taskCardStyles.onboardingDescriptionText} {...onboardingDescStyle} style={isWeb ? ([taskCardStyles.webTextWrap, onboardingDescStyle] as any) : onboardingDescStyle}>{task?.description}</Text>}
                </VStack>
              </HStack>
              <Box><HStack space="xs" alignItems="center">{renderActionButton()}{extraActions}</HStack></Box>
            </VStack>
          ) : (
            <HStack {...taskCardStyles.onboardingDesktopContainer}>
              <Box {...taskCardStyles.onboardingDesktopCircleBox}>{renderStatusIndicator()}</Box>
              <VStack {...taskCardStyles.onboardingDesktopTextContainer}>
                <Text {...TYPOGRAPHY.h4} {...taskCardStyles.onboardingTitleText} {...onboardingTextStyle} style={isWeb ? ([taskCardStyles.webTextWrap, onboardingTextStyle] as any) : onboardingTextStyle}>{task?.name}</Text>
                {task?.description && <Text {...TYPOGRAPHY.bodySmall} {...taskCardStyles.onboardingDescriptionText} {...onboardingDescStyle} style={isWeb ? ([taskCardStyles.webTextWrap, onboardingDescStyle] as any) : onboardingDescStyle}>{task?.description}</Text>}
              </VStack>
              <Box {...taskCardStyles.onboardingDesktopButtonBox}><HStack space="xs" alignItems="center">{renderActionButton()}{extraActions}</HStack></Box>
            </HStack>
          )}
        </Box>
      );
    }

    if (uiConfig.showAsCard) {
      return (
        <Card {...taskCardStyles.childCard}
          bg={isEdit && !isPreview && task.type === 'observation' ? '$observationTaskBg' : isPreview && task?.isDeletable ? isAddedToPlan ? '$optionalTaskGreenBg' : isRejected ? '$socialProtectionAccordionBg' : '$optionalTaskYellowBg' : isInterventionPlanEditMode ? '$stylesCardBg' : taskCardStyles.childCard?.bg}
          borderRadius={taskCardStyles.childCard?.borderRadius as any}
          borderColor={isEdit && !isPreview && task.type === 'observation' ? '$observationTaskBorder' : isPreview && task?.isDeletable ? isAddedToPlan ? '$optionalTaskGreenBorder' : isRejected ? '$error200' : '$optionalTaskYellowBorder' : taskCardStyles.childCard?.borderColor}
        >
          <HStack alignItems="flex-start" space="md" flexDirection={isMobile ? 'column' : 'row'}>
            {isMobile ? (
              <VStack space="sm" width="100%">
                <HStack alignItems="flex-start" space={isPreview ? 'md' : 'sm'} width="100%">
                  <Box flexShrink={0}>{renderStatusIndicator()}</Box>
                  <Box flex={1}>{renderTaskInfo()}</Box>
                  <Box flexShrink={0}>
                    {isPreview ? (<HStack space="xs" alignItems="center">{renderActionButton()}{extraActions}</HStack>) : extraActions}
                  </Box>
                </HStack>
                {!isPreview && <Box width="100%"><HStack space="xs" alignItems="center">{renderActionButton()}{extraActions}</HStack></Box>}
              </VStack>
            ) : (
              <>
                <Box flexShrink={0} mt="$1">{renderStatusIndicator()}</Box>
                <Box flex={1} minWidth="$0">{renderTaskInfo()}</Box>
                <Box flexShrink={0}><HStack space="xs" alignItems="center">{renderActionButton()}{extraActions}</HStack></Box>
              </>
            )}
          </HStack>
        </Card>
      );
    }

    if (isChildOfProject && isPreview) {
      return (
        <HStack {...taskCardStyles.previewInlineContainer} padding={isWeb ? '$4' : '$0'}
          bg={isAddedToPlan ? '$addedToPlanBg' : isRejected ? '$error50' : '$warning50'}
          borderColor={isAddedToPlan ? '$addedToPlanBorder' : isRejected ? '$error200' : '$warning200'}
          borderWidth={1} borderRadius="$lg" marginBottom="$2" alignItems="flex-start" space={isWeb ? 'md' : 'xs'}
        >
          <Box flexShrink={0} mt="$1">{renderStatusIndicator()}</Box>
          <Box flex={1} minWidth={isWeb ? '$0' : undefined}>{renderTaskInfo()}</Box>
          <Box flexShrink={0}><HStack space="xs" alignItems="center">{renderActionButton()}{extraActions}</HStack></Box>
        </HStack>
      );
    }

    return (
      <Box {...taskCardStyles.regularTaskContainer} paddingVertical={isMobile ? '$5' : '$2'}>
        <HStack alignItems="flex-start" space={isWeb ? 'md' : 'sm'} flexDirection={isMobile ? 'column' : 'row'}>
          {isMobile ? (
            <Box flexDirection="row">
              <Box flexShrink={0} mt="$1">{renderStatusIndicator()}</Box>
              <Box flex={1} marginLeft="$1">{renderTaskInfo()}</Box>
            </Box>
          ) : (
            <>
              <Box flexShrink={0} mt="$1">{renderStatusIndicator()}</Box>
              <Box flex={1} minWidth="$0">{renderTaskInfo()}</Box>
            </>
          )}
          <Box flexShrink={0} width={isMobile ? '100%' : 'auto'}>
            <HStack space="xs" alignItems="center">{renderActionButton()}{extraActions}</HStack>
          </Box>
        </HStack>
      </Box>
    );
  }, [
    isOnboardingTask, isLastTask, isMobile, isWeb, task, onboardingTextStyle, onboardingDescStyle,
    uiConfig, isEdit, isPreview, isAddedToPlan, isRejected, isInterventionPlanEditMode,
    isChildOfProject, extraActions, renderStatusIndicator, renderTaskInfo, renderActionButton,
  ]);

  return (
    <>
      {mainContent}
      {!uiConfig.showAsCard && !isOnboardingTask && renderDivider()}
      <FileUploadModal
        isOpen={showUploadModal} onClose={handleCloseUploadModal}
        taskName={task?.name}
        participantName={!isChildOfProject ? config.profileInfo?.name : undefined}
        existingAttachments={task?.attachments}
        maxFileUploadCount={uploadConfig.maxFiles}
        allowedFileTypes={uploadConfig.allowedFileTypes}
        onUpload={handleUploadMethodSelect}
        onConfirm={handleUploadConfirm}
      />
      <EvidencePreviewModal
        isOpen={showPreviewModal} onClose={handleClosePreviewModal}
        taskName={task?.name} attachments={task?.attachments || []}
      />
    </>
  );
});

SimpleObservationTask.displayName = 'SimpleObservationTask';
export default SimpleObservationTask;
