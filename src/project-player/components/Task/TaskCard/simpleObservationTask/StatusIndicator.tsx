import React, { memo } from 'react';
import {
  Box,
  Checkbox,
  CheckboxIcon,
  CheckboxIndicator,
  Pressable,
  Spinner,
  Tooltip,
  TooltipContent,
  TooltipText,
} from '@ui';
import { LucideIcon } from '@ui/index';
import { theme } from '@config/theme';
import { taskCardStyles } from '../styles';
import { getStatusIconConfig } from '../utils/taskStatusUtils';

const EmptyCircleTrigger = (triggerProps: any) => (
  <Pressable {...triggerProps} cursor="default">
    <Box
      {...taskCardStyles.primaryFilledCircle}
      borderColor="$textMuted"
      bg="$backgroundPrimary.light"
    />
  </Pressable>
);

export interface StatusIndicatorProps {
  isInterventionPlanEditMode: boolean;
  isObservationTask: boolean;
  isEvidenceRequired: boolean;
  isStatusUpdating: boolean;
  isTaskDone: boolean;
  showCheckbox: boolean;
  isCompleted: boolean;
  onCheckboxChange: (checked: boolean) => void;
  isReadOnly: boolean;
  taskId: string;
  taskName: string;
  isOptional: boolean;
  isOnboardingTask: boolean;
  isChildOfProject: boolean;
  isPreview: boolean;
  isAddedToPlan: boolean;
  isRejected: boolean;
  t: (key: string) => string;
}

const StatusIndicator = memo<StatusIndicatorProps>(({
  isInterventionPlanEditMode, isObservationTask, isEvidenceRequired,
  isStatusUpdating, isTaskDone, showCheckbox, isCompleted, onCheckboxChange,
  isReadOnly, taskId, taskName, isOptional, isOnboardingTask, isChildOfProject,
  isPreview, isAddedToPlan, isRejected, t,
}) => {
  if (isInterventionPlanEditMode && (isObservationTask || isEvidenceRequired)) {
    if (isStatusUpdating) {
      return (
        <Box {...taskCardStyles.primaryFilledCircle} borderColor="transparent" bg="transparent">
          <Spinner size="small" color={theme.tokens.colors.primary500} />
        </Box>
      );
    }
    if (isTaskDone) return <LucideIcon name="CheckCircle" size={20} color="$success500" />;
    const tooltipText = isObservationTask
      ? t('projectPlayer.completeFormToMarkDone')
      : t('projectPlayer.uploadEvidenceToMarkDone');
    return (
      <Tooltip placement="top" trigger={EmptyCircleTrigger}>
        <TooltipContent {...taskCardStyles.tooltipContent}>
          <TooltipText {...taskCardStyles.tooltipText}>{tooltipText}</TooltipText>
        </TooltipContent>
      </Tooltip>
    );
  }

  if (showCheckbox) {
    return (
      <Box alignItems="center" justifyContent="center">
        {isStatusUpdating ? (
          <Spinner size="small" color="$primary500" />
        ) : (
          <Checkbox
            value={taskId} isChecked={isCompleted} onChange={onCheckboxChange}
            isDisabled={isReadOnly || isStatusUpdating} size="md"
            aria-label={`Mark ${taskName} as ${isCompleted ? 'incomplete' : 'complete'}`}
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
    isOnboardingTask, isChildOfProject, isCompleted, isOptional, isPreview, isAddedToPlan, isRejected,
  });

  return isStatusUpdating
    ? <Spinner size="small" color="$primary500" />
    : <LucideIcon name={iconName} size={20} color={checkColor} />;
});

StatusIndicator.displayName = 'StatusIndicator';
export default StatusIndicator;
