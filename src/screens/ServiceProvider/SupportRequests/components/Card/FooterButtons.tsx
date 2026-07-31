import React from 'react';
import { HStack, Text, Pressable } from '@gluestack-ui/themed';
import LucideIcon from '@components/ui/LucideIcon';
import { SUPPORT_REQUEST_BUTTON_TEXTS } from '../../constants/supportRequests.constants';
import cardStyles from '../../styles';

export interface ActionButtonsProps {
  onViewFullDetails?: () => void;
  onRequestInfo?: () => void;
  onDecline?: () => void;
  onAcceptAndSchedule?: () => void;
  acceptLabel?: string;
}

export default function ActionButtons({
  onViewFullDetails,
  onRequestInfo,
  onDecline,
  onAcceptAndSchedule,
  acceptLabel = SUPPORT_REQUEST_BUTTON_TEXTS.ACCEPT_SCHEDULE,
}: ActionButtonsProps): React.JSX.Element {
  return (
    <HStack justifyContent="space-between" alignItems="center">
      {/* Left Action: View Full Details */}
      <Pressable
        onPress={() => onViewFullDetails?.()}
        sx={{ ':active': { opacity: 0.6 } }}
      >
        <HStack space="md" alignItems="center">
          <LucideIcon name="Eye" size={16} color="$textDark800" />
          <Text fontSize="$sm" fontWeight="$bold" color="$textDark900">
            {SUPPORT_REQUEST_BUTTON_TEXTS.VIEW_FULL_DETAILS}
          </Text>
        </HStack>
      </Pressable>

      {/* Right Action Buttons */}
      <HStack space="sm" alignItems="center">
        {/* Request Info Button */}
        <Pressable
          onPress={() => onRequestInfo?.()}
          {...cardStyles.requestInfoBtn}
        >
          <HStack space="md" alignItems="center">
            <LucideIcon name="MessageSquare" size={14} color="$textDark700" />
            <Text fontSize="$sm" fontWeight="$bold" color="$textDark700">
              {SUPPORT_REQUEST_BUTTON_TEXTS.REQUEST_INFO}
            </Text>
          </HStack>
        </Pressable>

        {/* Decline Button */}
        <Pressable
          onPress={() => onDecline?.()}
          {...cardStyles.declineBtn}
        >
          <HStack space="md" alignItems="center">
            <LucideIcon name="X" size={14} color="$red600" />
            <Text fontSize="$sm" fontWeight="$bold" color="$red600">
              {SUPPORT_REQUEST_BUTTON_TEXTS.DECLINE}
            </Text>
          </HStack>
        </Pressable>

        {/* Accept & Schedule Button */}
        <Pressable
          onPress={() => onAcceptAndSchedule?.()}
          {...cardStyles.acceptBtn}
        >
          <HStack space="md" alignItems="center">
            <LucideIcon name="CheckCircle" size={16} color="$white" />
            <Text fontSize="$sm" fontWeight="$bold" color="$white">
              {acceptLabel}
            </Text>
          </HStack>
        </Pressable>
      </HStack>
    </HStack>
  );
}
