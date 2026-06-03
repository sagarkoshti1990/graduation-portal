import React, { memo, useState } from 'react';
import {
  Box, Button, ButtonIcon, ButtonText, HStack, Pressable,
  Text, Tooltip, TooltipContent, TooltipText, VStack,
} from '@ui';
import { LucideIcon } from '@ui/index';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';
import { taskCardStyles } from '../styles';
import { taskAccordionStyles } from '../../TaskAccordion/styles';
import type { Task } from '../../../../types/project.types';

interface ContentWrapperProps {
  isInterventionPlanEditMode: boolean;
  isObservationTask: boolean;
  onPress: () => void;
  children: React.ReactNode;
}
const ContentWrapper = memo<ContentWrapperProps>(({ isInterventionPlanEditMode, isObservationTask, onPress, children }) => {
  if (isInterventionPlanEditMode && isObservationTask) return <Pressable onPress={onPress}>{children}</Pressable>;
  return <>{children}</>;
});
ContentWrapper.displayName = 'ContentWrapper';

interface StatusBadgeTriggerProps {
  triggerProps: any; isTaskDone: boolean; isManualToggleDisabled: boolean;
  isStatusUpdating: boolean; doneText: string; toDoText: string;
}
const StatusBadgeTrigger = memo<StatusBadgeTriggerProps>(
  ({ triggerProps, isTaskDone, isManualToggleDisabled, isStatusUpdating, doneText, toDoText }) => {
    const [isHovered, setIsHovered] = useState(false);
    return (
      <Pressable {...triggerProps} disabled onHoverIn={() => setIsHovered(true)} onHoverOut={() => setIsHovered(false)}>
        <Box
          {...taskCardStyles.statusBadge}
          {...(isTaskDone ? (isHovered ? taskCardStyles.statusBadgeDoneHover : taskCardStyles.statusBadgeDone) : taskCardStyles.statusBadgeToDo)}
          opacity={isManualToggleDisabled ? 1 : undefined} minWidth={50} justifyContent="center"
        >
          <Text
            {...(isTaskDone ? (isHovered ? taskCardStyles.statusBadgeDoneTextHover : taskCardStyles.statusBadgeDoneText) : taskCardStyles.statusBadgeToDoText)}
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

export interface TaskInfoProps {
  task: Task;
  isPreview: boolean; isReadOnly: boolean; isWeb: boolean; isCompleted: boolean;
  showCheckbox: boolean; showAsCard: boolean; isInterventionPlanEditMode: boolean;
  isObservationTask: boolean; isEvidenceRequired: boolean; isManualToggleDisabled: boolean;
  isStatusUpdating: boolean; isTaskDone: boolean;
  handleTaskClick: () => void; handleTitlePress: () => void; handleOpenPreviewModal: () => void;
  doneText: string; toDoText: string; evidenceRequiredText: string;
  completeFormText: string; uploadEvidenceText: string; fileText: string; filesText: string;
}

const TaskInfo = memo<TaskInfoProps>(({
  task, isPreview, isReadOnly, isWeb, isCompleted, showCheckbox, showAsCard,
  isInterventionPlanEditMode, isObservationTask, isEvidenceRequired,
  isManualToggleDisabled, isStatusUpdating, isTaskDone,
  handleTaskClick, handleTitlePress, handleOpenPreviewModal,
  doneText, toDoText, evidenceRequiredText, completeFormText, uploadEvidenceText,
  fileText, filesText,
}) => {
  const textStyle = showCheckbox ? { textDecorationLine: 'none' as const, opacity: isCompleted ? 0.6 : 1 } : {};
  const titleTypography = showAsCard ? TYPOGRAPHY.h4 : TYPOGRAPHY.h3;

  const taskBadge = isPreview && task?.isDeletable ? (
    <Box bg="$optionalBadgeBg" paddingHorizontal="$3" paddingVertical="$1" borderRadius="$full" alignSelf="center">
      <Text fontSize="$xs" fontWeight="$medium" color="$optionalBadgeText">Optional</Text>
    </Box>
  ) : null;

  const evidenceRequiredBadge = (isEvidenceRequired || isObservationTask) && showAsCard && isInterventionPlanEditMode ? (
    <Box {...taskAccordionStyles.actionRequiredBadge}>
      <Text {...taskAccordionStyles.actionRequiredText}>{evidenceRequiredText || 'Evidence Required'}</Text>
    </Box>
  ) : null;

  const statusBadgeTriggerFn = (triggerProps: any) => (
    <StatusBadgeTrigger triggerProps={triggerProps} isTaskDone={isTaskDone}
      isManualToggleDisabled={isManualToggleDisabled} isStatusUpdating={isStatusUpdating}
      doneText={doneText} toDoText={toDoText} />
  );

  const statusBadge = isInterventionPlanEditMode && showAsCard ? (
    <Tooltip isDisabled={!isManualToggleDisabled || isStatusUpdating || isTaskDone} placement="top" trigger={statusBadgeTriggerFn}>
      <TooltipContent {...taskCardStyles.tooltipContent}>
        <TooltipText {...taskCardStyles.tooltipText}>
          {isObservationTask ? completeFormText : uploadEvidenceText}
        </TooltipText>
      </TooltipContent>
    </Tooltip>
  ) : null;

  return (
    <VStack space="xs" flex={1}>
      {isPreview || isReadOnly ? (
        <HStack space="sm" alignItems="center" flexWrap="wrap">
          <Text {...titleTypography} color="$textPrimary" {...textStyle} style={isWeb ? (taskCardStyles.webTextWrap as any) : undefined}>{task?.name}</Text>
          {taskBadge}{evidenceRequiredBadge}
        </HStack>
      ) : (
        <>
          <ContentWrapper isInterventionPlanEditMode={isInterventionPlanEditMode} isObservationTask={isObservationTask} onPress={handleTaskClick}>
            <Pressable onPress={handleTitlePress}>
              <Text {...titleTypography} color="$textPrimary" {...textStyle} fontWeight={(titleTypography as any).fontWeight} style={isWeb ? (taskCardStyles.webTextWrap as any) : undefined}>{task.name}</Text>
            </Pressable>
          </ContentWrapper>
          <HStack space="sm" alignItems="center" flexWrap="wrap">
            {statusBadge}{taskBadge}{evidenceRequiredBadge}
            {isInterventionPlanEditMode && task.attachments && task.attachments.length > 0 && (
              <Button variant={"outlineghost" as any} px="$2" height="$6" onPress={handleOpenPreviewModal}>
                <ButtonIcon as={LucideIcon} name="Paperclip" size={taskCardStyles.fileCountIcon.size} />
                <ButtonText {...taskCardStyles.fileCountText}>
                  {task.attachments?.length}{' '}{task.attachments?.length === 1 ? fileText : filesText}
                </ButtonText>
              </Button>
            )}
          </HStack>
        </>
      )}
    </VStack>
  );
});

TaskInfo.displayName = 'TaskInfo';
export default TaskInfo;
