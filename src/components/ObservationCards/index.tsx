import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  Card,
  Box,
  VStack,
  HStack,
  Text,
  Button,
  ButtonText,
  Pressable,
  ButtonIcon,
} from '@ui';
import { AssessmentSurveyCardProps } from '@app-types/participant';
import { useLanguage } from '@contexts/LanguageContext';
import { LucideIcon } from '@ui';
import { assessmentSurveyCardStyles } from './Styles';
import { CARD_STATUS } from '@constants/app.constant';
import logger from '@utils/logger';
import { ICONS } from '@constants/LOG_VISIT_CARDS';

interface IconMeta {
  icon: string;
  color: string;
  iconColor: string;
}

/**
 * AssessmentCard Component
 * Reusable card component for displaying assessment survey information
 */
export const AssessmentCard: React.FC<AssessmentSurveyCardProps> = ({
  card,
  userId,
}) => {
  const { t } = useLanguage();
  const navigation = useNavigation();
  const { name, description, navigationUrl, entity } = card;
  const [iconMeta, setIconMeta] = useState<IconMeta | null>(null);

  useEffect(() => {
    const iconMeta =
      ICONS[card.id as keyof typeof ICONS] ||
      ICONS?.[card?.name?.toLowerCase() as keyof typeof ICONS];
    setIconMeta(iconMeta as IconMeta);
  }, [card]);

  return (
    <Card
      {...assessmentSurveyCardStyles.cardContainer}
      $web-boxShadow="none" // Remove shadow on web
    >
      <VStack space="lg">
        {/* Card Header with Icon, name, Description, Action Button and Status Badge */}
        <HStack {...assessmentSurveyCardStyles.cardHeader}>
          <HStack
            alignItems="flex-start"
            space={entity?.status ? 'sm' : 'lg'}
            flex={1}
          >
            <Box
              {...(!entity?.status && {
                ...assessmentSurveyCardStyles.iconContainer,
                bg: iconMeta?.color || '$primary500',
              })}
            >
              <LucideIcon
                name={iconMeta?.icon || 'info'}
                size={!entity?.status ? 24 : 20}
                color={iconMeta?.iconColor || '$white'}
              />
            </Box>
            <VStack flex={1} space="md">
              <Text {...assessmentSurveyCardStyles.title}>{t(name)}</Text>
              {/* Card Description */}
              {!entity?.status && (
                <VStack space="sm">
                  <Text {...assessmentSurveyCardStyles.description}>
                    {t(description)}
                  </Text>
                </VStack>
              )}
            </VStack>
            {/* Status Badge - only show if status exists */}
            {entity?.status && <StatusBadge status={entity?.status} />}
          </HStack>

          {/* Navigation Arrow - show if navigationUrl exists */}
          {!entity?.status && navigationUrl && (
            <Pressable
              onPress={() => {
                // @ts-ignore
                navigation.navigate(navigationUrl as never, {
                  id: userId || '',
                  solutionId: card?.solutionId || card?.id,
                });
              }}
              $web-cursor="pointer"
            >
              <LucideIcon
                name="ArrowRight"
                size={20}
                color={"$textMutedForeground"}
              />
            </Pressable>
          )}
        </HStack>
        {entity?.status && (
          <VStack space="lg">
            <Text {...assessmentSurveyCardStyles.additionalInfo}>
              {t(description)}
            </Text>

            {/* Action Button */}
            {entity?.status && (
              <Button
                $md-width="fit-content"
                // @ts-ignore
                variant={entity?.status === CARD_STATUS.COMPLETED ? "outlineghost" : "solid"}
                onPress={() => {
                  if (navigationUrl && userId) {
                    // @ts-ignore
                    navigation.navigate(navigationUrl as never, {
                      id: userId || '',
                      solutionId: card?.solutionId || card?.id,
                      submissionNumber: entity?.submissionsCount,
                    });
                  } else {
                    logger.log('userId is required');
                  }
                }}
              >
                <ButtonIcon
                  as={LucideIcon}
                  name="FileText"
                  size={16}

                />
                <ButtonText
                  {...assessmentSurveyCardStyles.buttonText}

                >
                  {entity?.status === CARD_STATUS.COMPLETED
                    ? `${t('actions.view')} ${t(card?.name)}`
                    : `${t('actions.fill')} ${t(card?.name)}`}
                </ButtonText>
              </Button>
            )}
          </VStack>
        )}
      </VStack>
    </Card>
  );
};

export const StatusBadge: React.FC<{ status: string,preFix?: any }> = ({ status, preFix }) => {
  // Get status badge styling based on status type
  const getStatusBadgeStyle = () => {
    if (!status) return null;
    switch (status) {
      case CARD_STATUS.GRADUATED:
        return assessmentSurveyCardStyles.statusBadgeGraduated;
      case CARD_STATUS.COMPLETED:
        return assessmentSurveyCardStyles.statusBadgeCompleted;
      case CARD_STATUS.IN_PROGRESS:
        return assessmentSurveyCardStyles.statusBadgeInProgress;
      case CARD_STATUS.NOT_STARTED:
      default:
        return assessmentSurveyCardStyles.statusBadgeNotStarted;
    }
  };

  return (
    <Box {...getStatusBadgeStyle()}>
      <HStack alignItems="center" gap="$1">
        {(status === CARD_STATUS.GRADUATED ||
          status === CARD_STATUS.COMPLETED) && (
            <LucideIcon
              name="CheckCircle"
              size={12}
              color={status === CARD_STATUS.GRADUATED ? '$white' : '$success600'}
            />
          )}
        {React.isValidElement(preFix)
          ? React.cloneElement(preFix, {
              color:
                status === CARD_STATUS.GRADUATED
                  ? '$white'
                  : status === CARD_STATUS.COMPLETED
                  ? '$success600'
                  : status === CARD_STATUS.IN_PROGRESS
                  ? '$warning600'
                  : '$textMuted',
            })
          : preFix}
        <Text
          {...(status === CARD_STATUS.GRADUATED
            ? assessmentSurveyCardStyles.statusBadgeTextGraduated
            : status === CARD_STATUS.COMPLETED
              ? assessmentSurveyCardStyles.statusBadgeTextCompleted
              : status === CARD_STATUS.IN_PROGRESS
                ? assessmentSurveyCardStyles.statusBadgeTextWarning
                : assessmentSurveyCardStyles.statusBadgeText)}
        >
          {status}
        </Text>
      </HStack>
    </Box>
  );
};
