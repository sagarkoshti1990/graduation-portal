import React from 'react';
import { HStack, Text, Pressable } from '@gluestack-ui/themed';
import LucideIcon from '@components/ui/LucideIcon';
import cardStyles from '../../styles';
import { useLanguage } from '@contexts/LanguageContext';

const BASE_PATH = 'supportProvider.supportRequests';

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
  acceptLabel = `${BASE_PATH}.buttonTexts.acceptSchedule`,
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
            {t(`${BASE_PATH}.buttonTexts.viewFullDetails`)}
          </Text>
        </HStack>
      </Pressable>

      {/* Right Action Buttons */}
      {(onRequestInfo || onDecline || onAcceptAndSchedule) ? (
        <HStack {...cardStyles.rightActionGroup}>
          {/* Request Info Button */}
          {onRequestInfo ? (
            <Pressable
              onPress={() => onRequestInfo?.()}
              {...cardStyles.requestInfoBtn}
            >
              <HStack {...cardStyles.buttonRowMd}>
                <LucideIcon name="MessageSquare" {...cardStyles.iconRequestInfo} />
                <Text {...cardStyles.textRequestInfo}>
                  {t(`${BASE_PATH}.buttonTexts.requestInfo`)}
                </Text>
              </HStack>
            </Pressable>
          ) : null}

          {/* Decline Button */}
          {onDecline ? (
            <Pressable
              onPress={() => onDecline?.()}
              {...cardStyles.declineBtn}
            >
              <HStack {...cardStyles.buttonRowMd}>
                <LucideIcon name="X" {...cardStyles.iconDecline} />
                <Text {...cardStyles.textDecline}>
                  {t(`${BASE_PATH}.buttonTexts.decline`)}
                </Text>
              </HStack>
            </Pressable>
          ) : null}

          {/* Accept & Schedule Button */}
          {onAcceptAndSchedule ? (
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
          ) : null}
        </HStack>
      ) : null}
    </HStack>
  );
}
