import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  HStack,
  Card,
  useToast,
  Checkbox,
  CheckboxIndicator,
  CheckboxIcon,
  VStack,
  Text,
  Button,
  ButtonText,
  Pressable,
  CheckIcon,
  showSuccessToast,
} from '@ui';
import { useProjectContext } from '../../context/ProjectContext';
import { useTaskActions } from '../../hooks/useTaskActions';
import { useLanguage } from '@contexts/LanguageContext';
import {
  TASK_STATUS,
  TASK_TYPE,
  PROJECT_MODES,
  BADGE_TYPES,
} from '../../../constants/app.constant';
import { TaskCardProps } from '../../types/components.types';
import { Task } from '../../types/project.types';
import { taskCardStyles } from './Styles';
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
  const { mode, config, addedToPlanTaskIds } =
    useProjectContext();
  const { deleteTask } = useProjectContext();
  // handleOpenForm
  const { handleStatusChange, handleAddToPlan } =
    useTaskActions();
  const { isWeb, isMobile } = usePlatform();
  const { t } = useLanguage();
  const toast = useToast();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isAddedToPlan, setIsAddedToPlan] = useState(
    Boolean(!task?.isDeletable),
  );
  const [isRejected, setIsRejected] = useState(false);
  const participantId = route.params?.id;
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

  // Common Logic Variables
  const isInterventionPlanEditMode = isEdit && !isPreview && isChildOfProject;

  const uiConfig = useMemo(
    () => ({
      showAsCard: isChildOfProject,
      showAsInline: !isChildOfProject || isPreview,
      showCheckbox: isChildOfProject && !isPreview,
      showActionButton: isEdit || task?.isDeletable,
      isInteractive: isEdit,
    }),
    [isChildOfProject, isPreview, isEdit, task?.isDeletable],
  );

  const showSuccess = (message: string) => {
    showSuccessToast(toast, message);
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

  const handleConfirmDelete = () => {
    deleteTask(task?._id);
    closeModal();
    showSuccess(t('projectPlayer.taskDeleted'));
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
      const solutionDetails = await getSolutionDetails(projectTemplateId, task._id);
      
      if(solutionDetails.data._id) {
        // @ts-ignore Navigate to observation screen - task will be marked as completed on return
        navigation.navigate('observation', {
          id: participantId,
          solutionId: solutionDetails.data._id
        });
      }
    } else {
      setShowUploadModal(true); // Open modal instead of file picker
    }
  };

  // Checkbox change handler
  const handleCheckboxChange = async (checked: boolean) => {
    if (!isEdit) return;
    const newStatus = checked ? TASK_STATUS.COMPLETED : TASK_STATUS.TO_DO;
    await handleStatusChange(task._id, newStatus);
  };

  // Custom Renderers (From HEAD to preserve styling)

  // Render task status indicator (circle or checkbox)
  const renderStatusIndicator = () => {
    if (uiConfig.showCheckbox) {
      return (
        <Checkbox
          value={task?._id}
          isChecked={isCompleted}
          onChange={handleCheckboxChange}
          isDisabled={isReadOnly}
          size="md"
          aria-label={`Mark ${task?.name} as ${isCompleted ? 'incomplete' : 'complete'
            }`}
          opacity={isReadOnly ? 0.6 : 1}
        >
          <CheckboxIndicator
            borderColor={isCompleted ? '$primary500' : '$textMuted'}
            bg={isCompleted ? '$primary500' : '$backgroundPrimary.light'}
            alignItems="center"
            justifyContent="center"
            borderRadius="$full"
          >
            <CheckboxIcon as={CheckIcon} color="$accent100" />
          </CheckboxIndicator>
        </Checkbox>
      );
    }

    // Simple status circle
    const circleSize = 20;
    const checkSize = 15;

    // Status Circle Logic
    const isOptional = task?.isDeletable;

    let circleBorderColor = '$textMuted';
    let circleBg = '$backgroundPrimary.light';
    let showCheck = false;
    let checkColor: string = theme.tokens.colors.backgroundPrimary.light;

    // Onboarding: empty circle initially, brown tick only when document uploaded / task completed
    if (isOnboardingTask) {
      if (isOptional && task?.isDeletable) {
        // Show tick when files are uploaded (check attachments array)
        const hasUploadedFiles = task.attachments && task.attachments.length > 0;
        const showTick = hasUploadedFiles;
        circleBorderColor = showTick ? '$primary500' : '$textMuted';
        circleBg = showTick ? '$primary500' : '$backgroundPrimary.light';
        checkColor = theme.tokens.colors.backgroundPrimary.light;
        showCheck = showTick;
      } else {
        // Mandatory onboarding tasks - show tick when files are uploaded
        showCheck = isCompleted;
        circleBorderColor = showCheck ? '$primary500' : '$textMuted';
        circleBg = showCheck ? '$primary500' : '$backgroundPrimary.light';
        checkColor = theme.tokens.colors.backgroundPrimary.light;
      }
    } else if (isChildOfProject) {
      if (isOptional) {
        // Preview mode: Show orange circle initially, green with tick when added, red with X when rejected
        if (isPreview) {
          if (isAddedToPlan) {
            circleBorderColor = '$success500';
            circleBg = '$success500';
            checkColor = theme.tokens.colors.backgroundPrimary.light;
            showCheck = true;
          } else if (isRejected) {
            // Rejected: Just show red X icon, no circle
            showCheck = true;
          } else {
            // Initial state - orange/warning circle
            circleBorderColor = '$warning500';
            circleBg = '$backgroundPrimary.light';
            showCheck = false;
          }
        } else if (isAddedToPlan) {
          // Edit mode: Added to Plan - green outlined circle with green check
          circleBorderColor = '$success500';
          circleBg = '$backgroundPrimary.light';
          checkColor = theme.tokens.colors.success500;
          showCheck = true;
        } else {
          circleBorderColor = '$textMuted';
          showCheck = false;
        }
      } else {
        // Mandatory Child Project Tasks
        circleBorderColor = '$primary500';
        circleBg = '$backgroundPrimary.light';
        checkColor = theme.tokens.colors.primary500;
        showCheck = true;
      }
    } else {
      // Regular tasks
      circleBorderColor = isCompleted ? '$success500' : '$textMuted'; // Green Border (Outlined)
      circleBg = isCompleted ? 'transparent' : '$backgroundPrimary.light'; // Transparent BG
      checkColor = isCompleted
        ? theme.tokens.colors.success500
        : theme.tokens.colors.backgroundPrimary.light; // Green Check
      showCheck = isCompleted;
    }

    return (
      <Box
        width={circleSize}
        height={circleSize}
        {...taskCardStyles.statusCircle}
        alignSelf="center"
        borderColor={isPreview && isRejected ? 'transparent' : circleBorderColor}
        borderWidth={isPreview && isRejected ? 0 : taskCardStyles.statusCircle.borderWidth}
        bg={isPreview && isRejected ? 'transparent' : circleBg}
      >
        {showCheck && (
          <LucideIcon
            name={isPreview && isRejected ? "X" : "Check"}
            size={checkSize}
            color={isPreview && isRejected ? theme.tokens.colors.error500 : checkColor}
            strokeWidth={3}
          />
        )}
      </Box>
    );
  };

  // Render task information (name and description) - HEAD logic with Badges
  const renderTaskInfo = () => {
    const textStyle = uiConfig.showCheckbox
      ? {
          textDecorationLine: (isCompleted ? 'line-through' : 'none') as
            | 'line-through'
            | 'none',
          opacity: isCompleted ? 0.6 : 1,
        }
      : {};

    const titleTypography = uiConfig.showAsCard ? TYPOGRAPHY.bodySmall : TYPOGRAPHY.h3;

    // Task badge rendering (Evidence Required / Optional)
    // In Edit mode, hide Optional badges - only show 'required' type badges
    const isEditModeForBadge = isEdit && !isPreview;
    // In preview mode, show badge for deletable tasks even if metaInformation is not set
    const shouldShowBadge =
      (task.metaInformation?.badgeText &&
        (!isEditModeForBadge ||
          task.metaInformation?.badgeType === BADGE_TYPES.REQUIRED)) ||
      (isPreview && task?.isDeletable);

    const taskBadge = shouldShowBadge ? (
      <Box
        bg={
          task.metaInformation?.badgeType === BADGE_TYPES.REQUIRED
            ? '$warning100'
            : task.metaInformation?.badgeType === BADGE_TYPES.OPTIONAL || (isPreview && task?.isDeletable)
            ? '$optionalBadgeBg'
            : '$backgroundLight100'
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
            task.metaInformation?.badgeType === BADGE_TYPES.REQUIRED
              ? '$warning900'
              : task.metaInformation?.badgeType === BADGE_TYPES.OPTIONAL || (isPreview && task?.isDeletable)
              ? '$optionalBadgeText'
              : '$textMuted'
          }
        >
          {task.metaInformation?.badgeText || (isPreview && task?.isDeletable ? 'Optional' : '')}
        </Text>
      </Box>
    ) : null;

    // Status badge for Intervention Plan Edit mode only (not Onboarding)
    // isInterventionPlanEditMode is true ONLY for Intervention Plan tasks that are children of pillars
    const isEditModeOnly = isInterventionPlanEditMode;
    const statusBadge =
      isEditModeOnly && uiConfig.showAsCard ? (
        <Box
          bg={isCompleted ? '$accent200' : '$textSecondary'}
          paddingHorizontal="$3"
          paddingVertical="$0.5"
          borderRadius="$full"
          alignSelf="flex-start"
        >
          <Text fontSize="$xs" fontWeight="$semibold" color={isCompleted ? '$textPrimary' : '$white'}>
            {isCompleted ? t('projectPlayer.done') : t('projectPlayer.toDo')}
          </Text>
        </Box>
      ) : null;

    // In Edit mode only (non-preview), hide description
    const showDescription = !isEditModeOnly || !uiConfig.showAsCard;

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
              {task.name}
            </Text>
            {taskBadge}
          </HStack>
        ) : (
          /* Edit mode: title on first line, badges on second line */
          <>
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
            <HStack space="sm" alignItems="center" flexWrap="wrap">
              {statusBadge}
              {taskBadge}
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
                          bg={isHovered ? '$hoverPink' : '$backgroundLight100'}
                          paddingHorizontal="$2"
                          paddingVertical="$1"
                          borderRadius="$sm"
                          borderWidth={1}
                          borderColor={
                            isHovered ? '$primary300' : '$borderLight300'
                          }
                          $web-cursor="pointer"
                        >
                          <HStack space="xs" alignItems="center">
                            <LucideIcon
                              name="Paperclip"
                              size={12}
                              color={
                                isHovered
                                  ? theme.tokens.colors.primary500
                                  : theme.tokens.colors.textSecondary
                              }
                            />
                            <Text
                              fontSize="$xs"
                              color={
                                isHovered ? '$primary500' : '$textSecondary'
                              }
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
        {showDescription && task.description && (
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
        )}
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
                  bg={isHovered ? '$success100' : 'transparent'}
                  padding="$1.5"
                  borderRadius="$md"
                  borderWidth={1}
                  borderColor="$success500"
                  $web-cursor="pointer"
                >
                  <LucideIcon
                    name="Check"
                    size={22}
                    color={theme.tokens.colors.success500}
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
                  bg={isHovered ? '$error100' : 'transparent'}
                  padding="$1.5"
                  borderRadius="$md"
                  borderWidth={1}
                  borderColor="$error500"
                  $web-cursor="pointer"
                >
                  <LucideIcon
                    name="X"
                    size={22}
                    color={theme.tokens.colors.error500}
                    strokeWidth={3}
                  />
                </Box>
              );
            }}
          </Pressable>
        </HStack>
      );
    }

    const buttonStyles = isOnboardingTask
      ? taskCardStyles.onboardingActionButton
      : uiConfig.showAsCard
        ? taskCardStyles.actionButtonCard
        : taskCardStyles.actionButtonInline;

    const iconName = task.metaInformation?.icon || 'Upload';

    const defaultIconColor = isOnboardingTask
      ? theme.tokens.colors.textPrimary
      : theme.tokens.colors.textSecondary;

    return (
      <Button
        {...taskCardStyles.actionButton}
        variant={(isInterventionPlanEditMode || isOnboardingTask) ? 'outline' : 'solid'}
        onPress={handleTaskClick}
        ml="$0"
        isDisabled={isReadOnly}
        size={isWeb ? (uiConfig.showAsCard || isOnboardingTask ? 'xs' : 'md') : 'xs'}
        borderRadius="$lg"
        bg={isOnboardingTask ? (buttonStyles as any).bg : undefined}
        borderColor={(buttonStyles as any).borderColor}
        opacity={isReadOnly ? 0.5 : 1}
        $hover-bg={
          isEdit ? ((buttonStyles as any).hoverBg ?? '$primary100') : 'transparent'
        }
        $hover-borderColor={
          isEdit && (buttonStyles as any).hoverBorderColor
            ? (buttonStyles as any).hoverBorderColor
            : isEdit
              ? '$primary500'
              : 'transparent'
        }
        $web-cursor={isEdit ? 'pointer' : undefined}
        sx={
          isOnboardingTask && isWeb
            ? {
              transition: 'background-color 0.2s, border-color 0.2s',
              ':hover': {
                backgroundColor: (buttonStyles as any).hoverBg ?? theme.tokens.colors.onboardingFormBtnBgHover,
                borderColor: (buttonStyles as any).hoverBorderColor ?? theme.tokens.colors.primary500,
              },
            }
            : undefined
        }
      >
        {(state: any) => {
          const isHovered = state?.hovered || state?.pressed || false;
          // For onboarding tasks, change icon and text to primary color on hover
          const iconColor = isOnboardingTask
            ? isHovered
              ? theme.tokens.colors.primary500
              : theme.tokens.colors.textPrimary
            : isHovered
              ? theme.tokens.colors.primary500
              : defaultIconColor;
          const textColor = isOnboardingTask
            ? isHovered
              ? '$primary500'
              : '$textPrimary'
            : isHovered
              ? '$primary500'
              : '$textPrimary';
          return (
            <HStack space="xs" alignItems="center">
              {iconName && (
                <LucideIcon
                  name={iconName}
                  size={16}
                  color={iconColor}
                />
              )}
              <ButtonText
                {...TYPOGRAPHY.button}
                {...taskCardStyles.actionButtonText}
                fontSize={uiConfig.showAsCard || isOnboardingTask || !isWeb ? '$xs' : undefined}
                color={textColor}
              >
                {' '}
                {task.metaInformation?.buttonLabel || 'Upload'}
              </ButtonText>
            </HStack>
          );
        }}
      </Button>
    );
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
  const renderUploadModal = () => (
    <FileUploadModal
      isOpen={showUploadModal}
      onClose={() => setShowUploadModal(false)}
      taskName={task.name}
      participantName={!isChildOfProject ? config.profileInfo?.name : undefined}
      existingAttachments={task.attachments}
      onUpload={method => {
        console.log('Upload method selected:', method);
      }}
      onConfirm={async (files) => {
        await handleStatusChange(task._id, TASK_STATUS.COMPLETED, files);
        setShowUploadModal(false);
        // Show success toast with task-specific message
        showSuccess(t('projectPlayer.evidenceUploaded'));
      }}
    />
  );

  // Render evidence preview modal (for viewing uploaded files in Edit mode)
  const renderPreviewModal = () => (
    <EvidencePreviewModal
      isOpen={showPreviewModal}
      onClose={() => setShowPreviewModal(false)}
      taskName={task.name}
      attachments={task.attachments || []}
    />
  );

  // Main Render Logic
  let mainContent;

  // Onboarding step card format: light grey card with circle, title, description, action button
  if (isOnboardingTask) {
    mainContent = (
      <Box
        {...taskCardStyles.onboardingStepCard}
        padding={isMobile ? taskCardStyles.onboardingCardPaddingMobile : taskCardStyles.onboardingCardPaddingDesktop}
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
                  style={isWeb ? (taskCardStyles.webTextWrap as any) : undefined}
                >
                  {task.name}
                </Text>
                {task.description && (
                  <Text
                    {...TYPOGRAPHY.bodySmall}
                    {...taskCardStyles.onboardingDescriptionText}
                    style={isWeb ? (taskCardStyles.webTextWrap as any) : undefined}
                  >
                    {task.description}
                  </Text>
                )}
              </VStack>
            </HStack>
            {/* Row 2: Button */}
            <Box>
              {renderActionButton()}
              {renderCustomTaskActions({
                isCustomTask: task.isCustomTask || false,
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
                style={isWeb ? (taskCardStyles.webTextWrap as any) : undefined}
              >
                {task.name}
              </Text>
              {task.description && (
                <Text
                  {...TYPOGRAPHY.bodySmall}
                  {...taskCardStyles.onboardingDescriptionText}
                  style={isWeb ? (taskCardStyles.webTextWrap as any) : undefined}
                >
                  {task.description}
                </Text>
              )}
            </VStack>
            <Box {...taskCardStyles.onboardingDesktopButtonBox}>
              {renderActionButton()}
              {renderCustomTaskActions({
                isCustomTask: task.isCustomTask || false,
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
                ? '$addedToPlanBg'
                : isRejected
                  ? '$error50'
                  : '$warning50'
              : isInterventionPlanEditMode
                ? '#F9FAFD'
                : taskCardStyles.childCard?.bg
        }
        borderRadius={taskCardStyles.childCard?.borderRadius as any}
        borderColor={
          isEdit && !isPreview && task.type === TASK_TYPE.OBSERVATION
            ? '$observationTaskBorder'
            : isPreview && task?.isDeletable
              ? isAddedToPlan
                ? '$addedToPlanBorder'
                : isRejected
                  ? '$error200'
                  : '$warning200'
              : taskCardStyles.childCard?.borderColor
        }
      >
        <Box
          {...taskCardStyles.childCardContent}
          padding={isMobile ? '20px 0' : '$2 0'}
        >
          <HStack
            alignItems="flex-start"
            space="md"
            flexDirection={isMobile ? 'column' : 'row'}
          >
            {isMobile ? (
              isPreview ? (
                <HStack alignItems="flex-start" space="xs" width="100%">
                  <Box flexShrink={0} mt="$1">
                    {renderStatusIndicator()}
                  </Box>
                  <Box flex={1}>
                    {renderTaskInfo()}
                  </Box>
                  <Box flexShrink={0}>
                    <HStack space="xs" alignItems="center">
                      {renderActionButton()}
                      {renderCustomTaskActions({
                        isCustomTask: task.isCustomTask || false,
                        onEdit: openEditModal,
                        onDelete: openDeleteModal,
                      })}
                    </HStack>
                  </Box>
                </HStack>
              ) : (
                <VStack space="xs" width="100%">
                  <HStack alignItems="flex-start" space="xs">
                    <Box flexShrink={0} mt="$1">
                      {renderStatusIndicator()}
                    </Box>
                    <Box flex={1}>
                      {renderTaskInfo()}
                    </Box>
                    {renderCustomTaskActions({
                      isCustomTask: task.isCustomTask || false,
                      onEdit: openEditModal,
                      onDelete: openDeleteModal,
                    })}
                  </HStack>
                  <Box width="100%">
                    {renderActionButton()}
                  </Box>
                </VStack>
              )
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
                      isCustomTask: task.isCustomTask || false,
                      onEdit: openEditModal,
                      onDelete: openDeleteModal,
                    })}
                  </HStack>
                </Box>
              </>
            )}
          </HStack>
        </Box>
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
            isCustomTask: task.isCustomTask || false,
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
        padding={isMobile ? '20px 0' : '$2 0'}
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
              <Box flex={1} marginLeft="5px">
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
              isCustomTask: task.isCustomTask || false,
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
        taskName: task.name,
        t,
      })}
    </>
  );
};

export default TaskCard;