import React from 'react';
import { HStack, Text, Pressable, Button, ButtonText, ButtonIcon } from '@gluestack-ui/themed';
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
      {/* <Pressable
        onPress={() => onViewFullDetails?.()}
        {...cardStyles.buttonPressableDetails}
      >
        <HStack {...cardStyles.buttonRowMd}>
          <LucideIcon name="Eye" {...cardStyles.iconDetails} />
          <Text {...cardStyles.textDetails}>
            {t(`${BASE_PATH}.buttonTexts.viewFullDetails`)}
          </Text>
        </HStack>
      </Pressable> */}

      {/* Right Action Buttons */}
      {(onRequestInfo || onDecline || onAcceptAndSchedule) ? (
        <HStack {...cardStyles.rightActionGroup}>
          {/* Request Info Button */}
          {onRequestInfo ? (
            <Button
              variant="outlineghost"
              onPress={() => onRequestInfo?.()}
              {...cardStyles.requestInfoButtonProps}
            >
              <ButtonIcon as={LucideIcon} name="MessageSquare" {...cardStyles.requestInfoIconProps} />
              <ButtonText {...cardStyles.requestInfoTextProps}>
                {t(`${BASE_PATH}.buttonTexts.requestInfo`)}
              </ButtonText>
            </Button>
          ) : null}

          {/* Decline Button */}
          {onDecline ? (
            <Button
              variant="outline"
              onPress={() => onDecline?.()}
              {...cardStyles.declineButtonProps}
            >
              <ButtonIcon as={LucideIcon} name="X" {...cardStyles.declineIconProps} />
              <ButtonText {...cardStyles.declineTextProps}>
                {t(`${BASE_PATH}.buttonTexts.decline`)}
              </ButtonText>
            </Button>
          ) : null}

          {/* Accept & Schedule Button */}
          {onAcceptAndSchedule ? (
            <Button
              variant="solid"
              onPress={() => onAcceptAndSchedule?.()}
              {...cardStyles.acceptButtonProps}
            >
              <ButtonIcon as={LucideIcon} name="CheckCircle" {...cardStyles.acceptIconProps} />
              <ButtonText {...cardStyles.acceptTextProps}>
                {acceptLabel.startsWith('supportProvider.') ? t(acceptLabel) : acceptLabel}
              </ButtonText>
            </Button>
          ) : null}
        </HStack>
      ) : null}
    </HStack>
  );
}
