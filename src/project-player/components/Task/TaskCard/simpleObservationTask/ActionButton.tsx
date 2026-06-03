import React, { memo } from 'react';
import { Box, Button, ButtonIcon, ButtonText, HStack, Pressable } from '@ui';
import { LucideIcon } from '@ui/index';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';
import { taskCardStyles } from '../styles';

export interface ActionButtonProps {
  showActionButton: boolean; isPreview: boolean; isOptional: boolean;
  isAddedToPlan: boolean; isRejected: boolean; isReadOnly: boolean;
  isStatusUpdating: boolean; isWeb: boolean; showAsCard: boolean;
  isOnboardingTask: boolean; isEdit: boolean; actionIconName: string;
  handleTaskClick: () => void; handleAcceptTask: () => void; handleRejectTask: () => void;
  buttonLabel?: string; uploadText: string;
}

const ActionButton = memo<ActionButtonProps>(({
  showActionButton, isPreview, isOptional, isAddedToPlan, isRejected,
  isReadOnly, isStatusUpdating, isWeb, showAsCard, isOnboardingTask, isEdit,
  actionIconName, handleTaskClick, handleAcceptTask, handleRejectTask, buttonLabel, uploadText,
}) => {
  if (!showActionButton) return null;

  if (isPreview && isOptional) {
    return (
      <HStack space="xs" alignItems="center">
        <Pressable onPress={handleAcceptTask}>
          {(state: any) => {
            const isHovered = state?.hovered || state?.pressed || false;
            return (
              <Box bg={isAddedToPlan ? '$tickButtonActiveBg' : isHovered ? '$success100' : 'transparent'}
                padding="$2" borderRadius="$lg" borderWidth={1}
                borderColor={isAddedToPlan ? '$tickButtonActiveBg' : '$success500'} $web-cursor="pointer">
                <LucideIcon name="Check" size={16} color={isAddedToPlan ? '$white' : '$success500'} strokeWidth={3} />
              </Box>
            );
          }}
        </Pressable>
        <Pressable onPress={handleRejectTask}>
          {(state: any) => {
            const isHovered = state?.hovered || state?.pressed || false;
            return (
              <Box bg={isHovered || isRejected ? '$error100' : 'transparent'}
                padding="$2" borderRadius="$lg" borderWidth={1}
                borderColor="$error500" $web-cursor="pointer">
                <LucideIcon name="X" size={16} color="$error500" strokeWidth={3} />
              </Box>
            );
          }}
        </Pressable>
      </HStack>
    );
  }

  return (
    <Button onPress={handleTaskClick} isDisabled={isReadOnly || isStatusUpdating}
      size={isWeb ? (showAsCard || isOnboardingTask ? 'xs' : 'md') : 'xs'}
      variant={"outlineghost" as any} $web-cursor={isEdit ? 'pointer' : undefined}>
      <ButtonIcon name={actionIconName} size={16} as={LucideIcon} />
      <ButtonText {...TYPOGRAPHY.button} {...taskCardStyles.actionButtonText}
        fontSize={showAsCard || isOnboardingTask || !isWeb ? '$xs' : undefined}>
        {buttonLabel || uploadText}
      </ButtonText>
    </Button>
  );
});

ActionButton.displayName = 'ActionButton';
export default ActionButton;
