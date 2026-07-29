import React, { memo, useState, useCallback } from 'react';
import { Box, Button, ButtonIcon, ButtonText, HStack, Pressable } from '@ui';
import { LucideIcon } from '@ui/index';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';
import { taskCardStyles } from '../styles';

export interface ActionButtonProps {
  showActionButton: boolean; isPreview: boolean; isOptional: boolean;
  isAddedToPlan: boolean; isRejected: boolean; isReadOnly: boolean;
  isStatusUpdating: boolean; isWeb: boolean; showAsCard: boolean;
  isOnboardingTask: boolean; isEdit: boolean; isObservationTask?: boolean; actionIconName: string;
  handleTaskClick: () => void; handleAcceptTask: () => void; handleRejectTask: () => void; completeFormText:string;
  buttonLabel?: string; uploadText: string; isCompleted?: boolean; isSyncTaskId?: boolean;
}

interface AcceptRejectButtonProps {
  variant: 'accept' | 'reject';
  isLocked: boolean;
  isActive: boolean;
  onPress: () => void;
}

// Plain onHoverIn/onHoverOut + local state, like every other Pressable in the
// app — no function-as-children render prop (that pattern was unique to this
// component and a candidate trigger for a native Fabric crash on this screen).
const AcceptRejectButton = memo<AcceptRejectButtonProps>(({ variant, isLocked, isActive, onPress }) => {
  const [isHovered, setIsHovered] = useState(false);
  const handleHoverIn = useCallback(() => setIsHovered(true), []);
  const handleHoverOut = useCallback(() => setIsHovered(false), []);

  const isAccept = variant === 'accept';
  const bg = isAccept
    ? (isActive ? '$tickButtonActiveBg' : isHovered ? '$success100' : 'transparent')
    : ((isHovered || isActive) ? '$error100' : 'transparent');
  const borderColor = isAccept ? (isActive ? '$tickButtonActiveBg' : '$success500') : '$error500';
  const iconColor = isAccept ? (isActive ? '$white' : '$success500') : '$error500';

  return (
    <Pressable
      onPress={isLocked ? undefined : onPress}
      disabled={isLocked}
      onHoverIn={handleHoverIn}
      onHoverOut={handleHoverOut}
      onPressIn={handleHoverIn}
      onPressOut={handleHoverOut}
    >
      <Box bg={bg} padding="$2" borderRadius="$lg" borderWidth={1} borderColor={borderColor}
        $web-cursor={isLocked ? 'not-allowed' : 'pointer'}>
        <LucideIcon name={isAccept ? 'Check' : 'X'} size={16} color={iconColor} strokeWidth={3} />
      </Box>
    </Pressable>
  );
});
AcceptRejectButton.displayName = 'AcceptRejectButton';

const ActionButton = memo<ActionButtonProps>(({
  showActionButton, isPreview, isOptional, isAddedToPlan, isRejected,
  isReadOnly, isStatusUpdating, isWeb, showAsCard, isOnboardingTask, isEdit, isObservationTask,
  actionIconName, handleTaskClick, handleAcceptTask, handleRejectTask, buttonLabel, uploadText, isCompleted, isSyncTaskId,completeFormText
}) => {
  if (!showActionButton) return null;

  if (isPreview && isOptional) {
    // Sync-dependent tasks are shown but locked — their state is controlled by the primary task.
    const isLocked = !!isSyncTaskId;
    return (
      <HStack space="xs" alignItems="center" opacity={isLocked ? 0.45 : 1}>
        <AcceptRejectButton variant="accept" isLocked={isLocked} isActive={isAddedToPlan} onPress={handleAcceptTask} />
        <AcceptRejectButton variant="reject" isLocked={isLocked} isActive={isRejected} onPress={handleRejectTask} />
      </HStack>
    );
  }

  // In read-only mode: hide upload/non-observation actions; keep observation button
  // active so the viewer can open the form. The observation form handles its own permissions.
  if ((isReadOnly && !isObservationTask) || (isReadOnly && isObservationTask && !isCompleted)) return null;

  return (
    <Button onPress={handleTaskClick} isDisabled={isStatusUpdating}
      size={isWeb ? (showAsCard || isOnboardingTask ? 'xs' : 'md') : 'xs'}
      variant={"outlineghost" as any} $web-cursor={isEdit || isReadOnly ? 'pointer' : undefined}>
      <ButtonIcon name={isObservationTask && isCompleted ? "Eye" :actionIconName} size={16} as={LucideIcon} />
      <ButtonText {...TYPOGRAPHY.button} {...taskCardStyles.actionButtonText}
        fontSize={showAsCard || isOnboardingTask || !isWeb ? '$xs' : undefined}>
        {isObservationTask && isCompleted ? completeFormText : buttonLabel || uploadText}
      </ButtonText>
    </Button>
  );
});

ActionButton.displayName = 'ActionButton';
export default ActionButton;
