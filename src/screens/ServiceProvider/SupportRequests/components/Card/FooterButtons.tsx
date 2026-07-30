import React from 'react';
import { HStack, Text, Pressable } from '@gluestack-ui/themed';
import LucideIcon from '@components/ui/LucideIcon';
import { SUPPORT_REQUEST_BUTTON_TEXTS } from '../../constants/supportRequests.constants';

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
          borderWidth={1}
          borderColor="#E2E8F0"
          bg="$white"
          px="$4"
          py="$2"
          borderRadius="$lg"
          sx={{ ':active': { bg: '#F8FAFC' } }}
        >
          <HStack space="md" alignItems="center">
            <LucideIcon name="MessageSquare" size={14} color="#334155" />
            <Text fontSize="$sm" fontWeight="$bold" color="#334155">
              {SUPPORT_REQUEST_BUTTON_TEXTS.REQUEST_INFO}
            </Text>
          </HStack>
        </Pressable>

        {/* Decline Button */}
        <Pressable
          onPress={() => onDecline?.()}
          borderWidth={1}
          borderColor="#FECDD3"
          bg="$white"
          px="$4"
          py="$2"
          borderRadius="$lg"
          sx={{ ':active': { bg: '#FEF2F2' } }}
        >
          <HStack space="md" alignItems="center">
            <LucideIcon name="X" size={14} color="#E11D48" />
            <Text fontSize="$sm" fontWeight="$bold" color="#E11D48">
              {SUPPORT_REQUEST_BUTTON_TEXTS.DECLINE}
            </Text>
          </HStack>
        </Pressable>

        {/* Accept & Schedule Button */}
        <Pressable
          onPress={() => onAcceptAndSchedule?.()}
          bg="#00a63e"
          px="$4.5"
          py="$2"
          borderRadius="$lg"
          shadowColor="#15803D"
          shadowOffset={{ width: 0, height: 2 }}
          shadowOpacity={0.25}
          shadowRadius={6}
          elevation={2}
          sx={{ ':active': { bg: '#15803D' } }}
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
