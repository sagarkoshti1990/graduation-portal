import React from 'react';
import { VStack, HStack, Text, Box, Progress, ProgressFilledTrack } from '@ui';
import { participantHeaderStyles, getStatusCard } from './Styles';
import { useLanguage } from '@contexts/LanguageContext';
import { LucideIcon } from '@ui';
import { theme } from '@config/theme';
import { STATUS } from '@constants/app.constant';
import { ParticipantProgressCardProps } from '@app-types/screens';

const ParticipantProgressCard: React.FC<ParticipantProgressCardProps> = ({
  status,
  graduationProgress,
  graduationDate,
  updatedProgress
}) => {
  const { t } = useLanguage();

  // Return null if status is invalid or not provided
  if (!status || ![STATUS.IN_PROGRESS, STATUS.COMPLETED,STATUS.GRADUATED, STATUS.DROPOUT].includes(status)) {
    return null;
  }

  const progress = graduationProgress ?? 0;
  const date = graduationDate;
  // Dropout: Return warning content directly
  if (status === STATUS.DROPOUT) {
    return (
      <Box {...getStatusCard(STATUS.DROPOUT as 'dropout')}>
        <HStack {...participantHeaderStyles.dropoutWarningContent}>
          <Box {...participantHeaderStyles.dropoutWarningIcon}>
            <LucideIcon name="XCircle" size={18} color={theme.tokens.colors.error600} />
          </Box>
          <VStack {...participantHeaderStyles.dropoutWarningTextContainer}>
            <Text {...participantHeaderStyles.dropoutWarningTitle}>
              {t('participantDetail.header.participantDroppedOut')}
            </Text>
            <Text {...participantHeaderStyles.dropoutWarningMessage}>
              {t('participantDetail.header.dropoutWarning')}
            </Text>
          </VStack>
        </HStack>
      </Box>
    );
  }

  // In-progress or Completed: Return main card with title and content
  // Note: Since dropout is handled above with early return, status here is always STATUS.IN_PROGRESS or STATUS.COMPLETED
  return (
    <Box
      {...getStatusCard(status as typeof STATUS.IN_PROGRESS | typeof STATUS.COMPLETED | typeof STATUS.GRADUATED)}
      // @ts-ignore - Web-specific props not in Gluestack UI types
      $web-boxShadow={participantHeaderStyles.statusCardBoxShadow}
      $web-backgroundImage={participantHeaderStyles.statusCardBackgroundImage}
    >
      <HStack {...participantHeaderStyles.completedCardContent}>
        <VStack flex={1}>
          {/* Title: Conditionally render based on status */}
          <Text
            {...(status === STATUS.IN_PROGRESS
              ? participantHeaderStyles.progressCardTitleTop
              : participantHeaderStyles.completedCardTitle)}
          >
            {t(
              status === STATUS.IN_PROGRESS
                ? 'participantDetail.header.graduationReadiness'
                : 'participantDetail.header.programStatus'
            )}
          </Text>
          {/* Content: Conditionally render based on status */}
          {status === STATUS.IN_PROGRESS ? (
            <>
              <VStack
                {...participantHeaderStyles.progressCardContent}
                $md-flexDirection="row"
                $md-justifyContent="space-between"
                $md-alignItems="center"
                space="sm"
              >
                <Box
                  {...participantHeaderStyles.progressBarContainer}
                  $md-width="auto"
                >
                  <Progress
                    value={updatedProgress !== undefined ? updatedProgress : progress}
                    {...participantHeaderStyles.progressBarBackground}
                  >
                    <ProgressFilledTrack {...participantHeaderStyles.progressBarFill} />
                  </Progress>
                </Box>
              </VStack>
              {updatedProgress !== progress ? (
                <Text {...participantHeaderStyles.progressCardTitleBottom}>
                  {t('participantDetail.header.previous')}: {progress}%
                </Text>
              ) : null}
            </>
          ) : (
            <VStack flex={1} space="xs">
              <Text {...participantHeaderStyles.completedStatus}>
                {status === STATUS.GRADUATED ? t('participantDetail.header.graduatedStatus') : t('participantDetail.header.completeStatus')}
              </Text>
              {date && (
                <Text {...participantHeaderStyles.completedDate}>
                  {date
                    ? t('participantDetail.header.graduatedOn', { date })
                    : t('participantDetail.header.graduationDateNotAvailable')}
                </Text>
              )}
            </VStack>
          )}
        </VStack>

        {status === STATUS.IN_PROGRESS ? (
          <Text {...participantHeaderStyles.progressPercentage}>
            {updatedProgress !== progress ? updatedProgress : progress}%
          </Text>
        ) :
          <LucideIcon name="CircleCheck" size={40} color={theme.tokens.colors.accent300} />
        }
      </HStack>
    </Box>
  );
};

export default ParticipantProgressCard;

