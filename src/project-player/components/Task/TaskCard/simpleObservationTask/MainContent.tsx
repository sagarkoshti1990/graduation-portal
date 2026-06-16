import React, { memo } from 'react';
import {
  Box, Button, ButtonIcon, ButtonText, Card, HStack, Text, VStack,
} from '@ui';
import { LucideIcon } from '@ui/index';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';
import { taskCardStyles } from '../styles';
import type { Task } from '../../../../types/project.types';
import StatusIndicator from './StatusIndicator';
import TaskInfo from './TaskInfo';
import ActionButton from './ActionButton';

// ─────────────────────────────────────────────────────────────────────────────

export interface MainContentProps {
  // Core data
  task: Task;
  /** Explicit read-only override. Propagated to StatusIndicator, TaskInfo, ActionButton. */
  isReadOnly?: boolean;

  // Layout context
  isLastTask: boolean;
  isMobile: boolean;
  isWeb: boolean;
  isOnboardingTask: boolean;
  isChildOfProject: boolean;
  /** Pre-computed: isOnboardingTask && (task.isDeletable ? hasUploadedFiles : isCompleted) */
  isOnboardingCompletedUI: boolean;

  // Mode flags
  isEdit: boolean;
  isPreview: boolean;
  isInterventionPlanEditMode: boolean;

  // Derived task state
  isCompleted: boolean;
  isObservationTask: boolean;
  isEvidenceRequired: boolean;
  isStatusUpdating: boolean;
  isManualToggleDisabled: boolean;
  isAddedToPlan: boolean;
  isRejected: boolean;

  // StatusIndicator
  showCheckbox: boolean;
  onCheckboxChange: (checked: boolean) => void;

  // ActionButton
  showActionButton: boolean;
  actionIconName: string;
  handleAcceptTask: () => void;
  handleRejectTask: () => void;

  // Shared handlers
  handleTaskClick: () => void;
  handleTitlePress: (canChangePathway?: any) => void;
  handleOpenPreviewModal: () => void;

  // i18n (single function — strings derived internally)
  t: (key: string) => string;

  // External injections (e.g. edit/delete actions from CustomTaskManager)
  extraActions?: React.ReactNode;
  isSyncTaskId?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────

const MainContent = memo<MainContentProps>(({
  task, isReadOnly = false,
  isLastTask, isMobile, isWeb,
  isOnboardingTask, isChildOfProject, isOnboardingCompletedUI,
  isEdit, isPreview, isInterventionPlanEditMode,
  isCompleted, isObservationTask, isEvidenceRequired,
  isStatusUpdating, isManualToggleDisabled, isAddedToPlan, isRejected,
  showCheckbox, onCheckboxChange,
  showActionButton, actionIconName, handleAcceptTask, handleRejectTask,
  handleTaskClick, handleTitlePress, handleOpenPreviewModal,
  t, extraActions, isSyncTaskId,
}) => {
  // showAsCard === isChildOfProject by definition
  const showAsCard = isChildOfProject;

  // ── Onboarding text styles (derived here; no longer passed as props) ────────
  const onboardingTextStyle = {
    textDecorationLine: 'none' as const,
    opacity: isOnboardingCompletedUI ? 0.6 : 1,
  };
  const onboardingDescStyle = { opacity: isOnboardingCompletedUI ? 0.6 : 1 };

  // ── Sub-components ────────────────────────────────────────────────────────

  const statusIndicator = (
    <StatusIndicator
      isInterventionPlanEditMode={isInterventionPlanEditMode}
      isObservationTask={isObservationTask}
      isEvidenceRequired={isEvidenceRequired}
      isStatusUpdating={isStatusUpdating}
      showCheckbox={showCheckbox}
      isCompleted={isCompleted}
      onCheckboxChange={onCheckboxChange}
      isReadOnly={isReadOnly}
      taskId={task._id}
      taskName={task?.name ?? ''}
      isOptional={!!task?.isDeletable}
      isOnboardingTask={isOnboardingTask}
      isChildOfProject={isChildOfProject}
      isPreview={isPreview}
      isAddedToPlan={isAddedToPlan}
      isRejected={isRejected}
      t={t}
    />
  );

  const taskInfo = (
    <TaskInfo
      task={task}
      isPreview={isPreview}
      isReadOnly={isReadOnly}
      isWeb={isWeb}
      isCompleted={isCompleted}
      showCheckbox={showCheckbox}
      showAsCard={showAsCard}
      isInterventionPlanEditMode={isInterventionPlanEditMode}
      isObservationTask={isObservationTask}
      isEvidenceRequired={isEvidenceRequired}
      isManualToggleDisabled={isManualToggleDisabled}
      isStatusUpdating={isStatusUpdating}
      handleTaskClick={handleTaskClick}
      handleTitlePress={handleTitlePress}
      handleOpenPreviewModal={handleOpenPreviewModal}
      doneText={t('projectPlayer.done')}
      toDoText={t('projectPlayer.toDo')}
      evidenceRequiredText={t('projectPlayer.evidenceRequired')}
      completeFormText={t('projectPlayer.completeFormToMarkDone')}
      uploadEvidenceText={t('projectPlayer.uploadEvidenceToMarkDone')}
      fileText={t('projectPlayer.file')}
      filesText={t('projectPlayer.files')}
    />
  );

  const actionButton = (
    <ActionButton
      isSyncTaskId={isSyncTaskId}
      showActionButton={showActionButton}
      isPreview={isPreview}
      isOptional={!!task?.isDeletable}
      isAddedToPlan={isAddedToPlan}
      isRejected={isRejected}
      isReadOnly={isReadOnly}
      isObservationTask={isObservationTask}
      isStatusUpdating={isStatusUpdating}
      isWeb={isWeb}
      showAsCard={showAsCard}
      isOnboardingTask={isOnboardingTask}
      isEdit={isEdit}
      actionIconName={actionIconName}
      handleTaskClick={handleTaskClick}
      handleAcceptTask={handleAcceptTask}
      handleRejectTask={handleRejectTask}
      buttonLabel={task.metaInformation?.buttonLabel}
      isCompleted={isCompleted}
      uploadText={t('projectPlayer.upload')}
      completeFormText={t('projectPlayer.viewForm')}
    />
  );

  // ── Onboarding layout ──────────────────────────────────────────────────────
  if (isOnboardingTask) {
    const titleStyle = isWeb
      ? ([taskCardStyles.webTextWrap, onboardingTextStyle] as any)
      : onboardingTextStyle;
    const descStyle = isWeb
      ? ([taskCardStyles.webTextWrap, onboardingDescStyle] as any)
      : onboardingDescStyle;

    // In read-only mode ActionButton returns null for non-observation tasks,
    // so surface the file-preview button here instead when files exist.
    const onboardingActions = isReadOnly && !isObservationTask && task.attachments && task.attachments.length > 0 ? (
      <Button variant={'outlineghost' as any} px="$2" height="$6" onPress={handleOpenPreviewModal}>
        <ButtonIcon as={LucideIcon} name="Paperclip" size={taskCardStyles.fileCountIcon.size} />
        <ButtonText {...taskCardStyles.fileCountText}>
          {task.attachments.length}{' '}
          {task.attachments.length === 1 ? t('projectPlayer.file') : t('projectPlayer.files')}
        </ButtonText>
      </Button>
    ) : actionButton;

    return (
      <Box {...taskCardStyles.onboardingStepCard} paddingVertical="$4"
        marginBottom={isLastTask ? 0 : isMobile ? taskCardStyles.onboardingCardMarginBottomMobile : taskCardStyles.onboardingCardMarginBottomDesktop}>
        {isMobile ? (
          <VStack {...taskCardStyles.onboardingMobileContainer}>
            <HStack {...taskCardStyles.onboardingMobileRow}>
              <Box {...taskCardStyles.onboardingMobileCircleBox}>{statusIndicator}</Box>
              <VStack {...taskCardStyles.onboardingMobileTextContainer}>
                <Text {...TYPOGRAPHY.h4} {...taskCardStyles.onboardingTitleText} {...onboardingTextStyle} style={titleStyle}>{task?.name}</Text>
                {!!task?.description && (
                  <Text {...TYPOGRAPHY.bodySmall} {...taskCardStyles.onboardingDescriptionText} {...onboardingDescStyle} style={descStyle}>{task.description}</Text>
                )}
              </VStack>
            </HStack>
            <Box><HStack space="xs" alignItems="center">{onboardingActions}{extraActions}</HStack></Box>
          </VStack>
        ) : (
          <HStack {...taskCardStyles.onboardingDesktopContainer}>
            <Box {...taskCardStyles.onboardingDesktopCircleBox}>{statusIndicator}</Box>
            <VStack {...taskCardStyles.onboardingDesktopTextContainer}>
              <Text {...TYPOGRAPHY.h4} {...taskCardStyles.onboardingTitleText} {...onboardingTextStyle} style={titleStyle}>{task?.name}</Text>
              {!!task?.description && (
                <Text {...TYPOGRAPHY.bodySmall} {...taskCardStyles.onboardingDescriptionText} {...onboardingDescStyle} style={descStyle}>{task.description}</Text>
              )}
            </VStack>
            <Box {...taskCardStyles.onboardingDesktopButtonBox}>
              <HStack space="xs" alignItems="center">{onboardingActions}{extraActions}</HStack>
            </Box>
          </HStack>
        )}
      </Box>
    );
  }

  // ── Card layout (child of project) ─────────────────────────────────────────
  if (showAsCard) {
    const isObservationCard = (isEdit || isReadOnly) && !isPreview && task.type === 'observation';
    const cardBg = isObservationCard ? '$observationTaskBg'
      : isPreview && task?.isDeletable
        ? (isAddedToPlan ? '$optionalTaskGreenBg' : isRejected ? '$socialProtectionAccordionBg' : '$optionalTaskYellowBg')
      : isInterventionPlanEditMode ? '$stylesCardBg' : taskCardStyles.childCard?.bg;
    const cardBorderColor = isObservationCard ? '$observationTaskBorder'
      : isPreview && task?.isDeletable
        ? (isAddedToPlan ? '$optionalTaskGreenBorder' : isRejected ? '$error200' : '$optionalTaskYellowBorder')
      : taskCardStyles.childCard?.borderColor;
    return (
      <Card {...taskCardStyles.childCard} bg={cardBg} borderRadius={taskCardStyles.childCard?.borderRadius as any} borderColor={cardBorderColor}>
        <HStack alignItems="flex-start" space="md" flexDirection={isMobile ? 'column' : 'row'}>
          {isMobile ? (
            <VStack space="sm" width="100%">
              <HStack alignItems="flex-start" space={isPreview ? 'md' : 'sm'} width="100%">
                <Box flexShrink={0}>{statusIndicator}</Box>
                <Box flex={1}>{taskInfo}</Box>
                <Box flexShrink={0}>
                  {isPreview
                    ? <HStack space="xs" alignItems="center">{actionButton}{extraActions}</HStack>
                    : extraActions}
                </Box>
              </HStack>
              {!isPreview && <Box width="100%">{actionButton}</Box>}
            </VStack>
          ) : (
            <>
              <Box flexShrink={0} mt="$1">{statusIndicator}</Box>
              <Box flex={1} minWidth="$0">{taskInfo}</Box>
              <Box flexShrink={0}>
                <HStack space="xs" alignItems="center">{actionButton}{extraActions}</HStack>
              </Box>
            </>
          )}
        </HStack>
      </Card>
    );
  }

  // ── Preview inline layout (child of project in preview mode) ──────────────
  if (isChildOfProject && isPreview) {
    return (
      <HStack {...taskCardStyles.previewInlineContainer} padding={isWeb ? '$4' : '$0'}
        bg={isAddedToPlan ? '$addedToPlanBg' : isRejected ? '$error50' : '$warning50'}
        borderColor={isAddedToPlan ? '$addedToPlanBorder' : isRejected ? '$error200' : '$warning200'}
        borderWidth={1} borderRadius="$lg" marginBottom="$2" alignItems="flex-start" space={isWeb ? 'md' : 'xs'}>
        <Box flexShrink={0} mt="$1">{statusIndicator}</Box>
        <Box flex={1} minWidth={isWeb ? '$0' : undefined}>{taskInfo}</Box>
        <Box flexShrink={0}>
          <HStack space="xs" alignItems="center">{actionButton}{extraActions}</HStack>
        </Box>
      </HStack>
    );
  }

  // ── Regular (top-level) layout ─────────────────────────────────────────────
  return (
    <>
      <Box {...taskCardStyles.regularTaskContainer} paddingVertical={isMobile ? '$5' : '$2'}>
        <HStack alignItems="flex-start" space={isWeb ? 'md' : 'sm'} flexDirection={isMobile ? 'column' : 'row'}>
          {isMobile ? (
            <Box flexDirection="row">
              <Box flexShrink={0} mt="$1">{statusIndicator}</Box>
              <Box flex={1} marginLeft="$1">{taskInfo}</Box>
            </Box>
          ) : (
            <>
              <Box flexShrink={0} mt="$1">{statusIndicator}</Box>
              <Box flex={1} minWidth="$0">{taskInfo}</Box>
            </>
          )}
          <Box flexShrink={0} width={isMobile ? '100%' : 'auto'}>
            <HStack space="xs" alignItems="center">{actionButton}{extraActions}</HStack>
          </Box>
        </HStack>
      </Box>
      {!isLastTask && (
        <Box
          {...taskCardStyles.divider}
          marginVertical={!isWeb ? '$2' : undefined}
          marginHorizontal="$5"
        />
      )}
    </>
  );
});

MainContent.displayName = 'MainContent';
export default MainContent;
