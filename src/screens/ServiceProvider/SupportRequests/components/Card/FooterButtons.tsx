import React from 'react';
import { HStack, Text, Pressable } from '@gluestack-ui/themed';
import LucideIcon from '@components/ui/LucideIcon';
import { SUPPORT_REQUEST_BUTTON_TEXTS } from '@constants/SUPPORT_REQUESTS';
import cardStyles from '../../styles';
import { useLanguage } from '@contexts/LanguageContext';

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
  const { t } = useLanguage();
  return (
    <HStack {...cardStyles.footerRow}>
      {/* Left Action: View Full Details */}
      <Pressable
        onPress={() => onViewFullDetails?.()}
        {...cardStyles.buttonPressableDetails}
      >
        <HStack {...cardStyles.buttonRowMd}>
          <LucideIcon name="Eye" {...cardStyles.iconDetails} />
          <Text {...cardStyles.textDetails}>
            {t(SUPPORT_REQUEST_BUTTON_TEXTS.VIEW_FULL_DETAILS)}
          </Text>
        </HStack>
      </Pressable>

      {/* Right Action Buttons */}
      <HStack {...cardStyles.rightActionGroup}>
        {/* Request Info Button */}
        <Pressable
          onPress={() => onRequestInfo?.()}
          {...cardStyles.requestInfoBtn}
        >
          <HStack {...cardStyles.buttonRowMd}>
            <LucideIcon name="MessageSquare" {...cardStyles.iconRequestInfo} />
            <Text {...cardStyles.textRequestInfo}>
              {t(SUPPORT_REQUEST_BUTTON_TEXTS.REQUEST_INFO)}
            </Text>
          </HStack>
        </Pressable>

        {/* Decline Button */}
        <Pressable
          onPress={() => onDecline?.()}
          {...cardStyles.declineBtn}
        >
          <HStack {...cardStyles.buttonRowMd}>
            <LucideIcon name="X" {...cardStyles.iconDecline} />
            <Text {...cardStyles.textDecline}>
              {t(SUPPORT_REQUEST_BUTTON_TEXTS.DECLINE)}
            </Text>
          </HStack>
        </Pressable>

        {/* Accept & Schedule Button */}
        <Pressable
          onPress={() => onAcceptAndSchedule?.()}
          {...cardStyles.acceptBtn}
        >
          <HStack {...cardStyles.buttonRowMd}>
            <LucideIcon name="CheckCircle" {...cardStyles.iconAccept} />
            <Text {...cardStyles.textAccept}>
              {acceptLabel.startsWith('supportProvider.') ? t(acceptLabel) : acceptLabel}
            </Text>
          </HStack>
        </Pressable>
      </HStack>
    </HStack>
  );
}
