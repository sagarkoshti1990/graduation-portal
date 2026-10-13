import React, { useState, useEffect, useMemo } from 'react';
import { Box, VStack, HStack, Text, Heading, Pressable } from '@gluestack-ui/themed';
import { Container, LucideIcon, Loader, Progress, ProgressFilledTrack, useAlert } from '@ui';
import { useAuth } from '@contexts/AuthContext';
import { useLanguage } from '@contexts/LanguageContext';
import { useNavigation } from '@react-navigation/native';
import InterventionPlan from '../../ParticipantDetail/InterventionPlan';
import dataService from '../../../services/dataService';
import { ProjectData } from '../../../project-player/types';
import { MODE } from '@constants/PROJECTDATA';
import { STATUS, TASK_STATUS } from '@constants/app.constant';
import { theme } from '@config/theme';
import { idpProgressStyles, overallProgressCardStyles } from './Styles';
import { participantHeaderStyles } from '../../ParticipantDetail/ParticipantHeader/Styles';
import { isWeb } from '@utils/platform';
import { getParticipantStatusMessage } from '@utils/participantJourneyUtils';

const IdpProgressScreen: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigation = useNavigation();
  const { showAlert } = useAlert();
  const [isBackHovered, setIsBackHovered] = useState(false);
  const [participantProfile, setParticipantProfile] = useState<any>(null);
  const [projectData, setProjectData] = useState<ProjectData | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [overallProgress, setOverallProgress] = useState<number | undefined>(undefined);

  useEffect(() => {
    const fetchProjectData = async () => {
      // The participant's own external/entity ID is stored in externalId or userId on the auth user
      const participantId = (user as any)?.externalId || (user as any)?.userId || user?.id || '';
      const authUserId = user?.id || '';

      if (!participantId || !authUserId) {
        setIsLoading(false);
        return;
      }

      try {
        const detailResult = await dataService.getParticipantDetails(participantId, authUserId);
        const pData = detailResult?.data || null;

        if (pData) {
          setParticipantProfile(pData);
          const projectId =
            pData?.status === 'NOT_ONBOARDED' && pData?.onBoardedProjectId
              ? pData.onBoardedProjectId
              : pData?.idpProjectId || pData?.onBoardedProjectId || '';

          if (projectId) {
            const response = await dataService.getProject<ProjectData>(
              pData?.id || participantId,
              projectId,
              authUserId,
            );
            if (response?.data) {
              setProjectData(response.data);
            }
          }
        }
      } catch (err: any) {
        console.error('Failed to fetch IDP project data:', err);
        const msg = err?.response?.data?.message || err?.message;
        if (msg) {
          showAlert('error', msg);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjectData();
  }, [user]);

  const { totalChildTasks, completedChildTasks, calculatedProgress } = useMemo(() => {
    if (!projectData) return { totalChildTasks: 0, completedChildTasks: 0, calculatedProgress: 0 };
    const topLevelTasks = projectData.children?.length
      ? projectData.children
      : projectData.tasks || [];
    let total = 0;
    let completed = 0;

    topLevelTasks.forEach((task: any) => {
      const childTasks = task.children || task.tasks || [];
      if (!childTasks.length) return;

      const validChildren = childTasks.filter(
        (childTask: any) => !childTask.isDeleted,
      );

      total += validChildren.length;
      completed += validChildren.filter(
        (childTask: any) => childTask.status === TASK_STATUS.COMPLETED,
      ).length;
    });

    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { totalChildTasks: total, completedChildTasks: completed, calculatedProgress: progress };
  }, [projectData]);

  const progressValue = overallProgress !== undefined ? overallProgress : calculatedProgress;

  const handleBackToHome = () => {
    // @ts-ignore
    navigation.navigate('participant-portal');
  };

  const participantStatus = participantProfile?.status || user?.status;
  const statusMessage = getParticipantStatusMessage(
    participantStatus,
    participantProfile?.accountUserStatus || (user as any)?.accountUserStatus,
  );
  const normalizedStatus = (participantStatus || '').toString().trim().toUpperCase().replace(/\s+/g, '_');
  // Dropout participants see only the status message — no IDP progress content.
  const isDropout = normalizedStatus === STATUS.DROPOUT || normalizedStatus === 'DROPOUT';

  return (
    <Box {...idpProgressStyles.page}>
      <Box {...idpProgressStyles.topHeaderBar}>
        <Container {...idpProgressStyles.headerContainer}>
          <HStack {...idpProgressStyles.headerTitleRow}>
            <Pressable
              {...idpProgressStyles.backPressable}
              {...(isWeb && {
                onHoverIn: () => setIsBackHovered(true),
                onHoverOut: () => setIsBackHovered(false),
              })}
              onPress={handleBackToHome}
              accessibilityRole="button"
              accessibilityLabel={t('common.back')}
            >
              <Box
                {...idpProgressStyles.backIconBox}
                {...(isBackHovered ? idpProgressStyles.backIconBoxHover : {})}
              >
                <LucideIcon
                  name="ArrowLeft"
                  size={18}
                  color={isBackHovered ? theme.tokens.colors.primary500 : '$textDark900'}
                  strokeWidth={1.5}
                />
              </Box>
            </Pressable>
            <Heading {...idpProgressStyles.title}>
              {t('participantJourney.cards.idpProgress')}
            </Heading>
          </HStack>
        </Container>
      </Box>

      <Box {...idpProgressStyles.contentArea}>
        <Container {...idpProgressStyles.container}>
          {isDropout ? (
            <VStack {...idpProgressStyles.content}>
              <Text color="$warning700" fontSize="$md" fontWeight="$medium">
                This participant is Dropout.
              </Text>
            </VStack>
          ) : (
          <VStack {...idpProgressStyles.content}>
            {statusMessage && (
              <Text color="$warning700" fontSize="$sm" fontWeight="$medium" mb="$2">
                {statusMessage}
              </Text>
            )}

            <Text {...idpProgressStyles.subtitle}>
              {t('participantJourney.idpProgressSubtitle')}
            </Text>

            {!isLoading && projectData && (
              <Box {...overallProgressCardStyles.cardBox}>
                <VStack space="xs">
                  <HStack justifyContent="space-between" alignItems="center">
                    <Text
                      fontSize="$md"
                      fontWeight="$bold"
                      color="$textDark900"
                    >
                      {t('participants.overallProgress', 'Overall Progress')}
                    </Text>
                    <Text
                      fontSize="$xl"
                      fontWeight="$bold"
                      color="$progressBarFillColor"
                    >
                      {progressValue}%
                    </Text>
                  </HStack>

                  {totalChildTasks > 0 && (
                    <Text
                      fontSize="$sm"
                      color="$textMutedForeground"
                    >
                      {completedChildTasks} of {totalChildTasks} {t('participantJourney.activitiesCompleted', 'activities completed')}
                    </Text>
                  )}

                  <Box {...participantHeaderStyles.progressBarContainer} mt="$2">
                    <Progress
                      value={progressValue}
                      {...participantHeaderStyles.progressBarBackground}
                    >
                      <ProgressFilledTrack {...participantHeaderStyles.progressBarFill} />
                    </Progress>
                  </Box>
                </VStack>
              </Box>
            )}

            <Box {...idpProgressStyles.idpContent}>
              {isLoading ? (
                <Loader />
              ) : !projectData ? (
                <Text>{t('projectPlayer.failToLoad')}</Text>
              ) : (
                <InterventionPlan
                  mode={MODE.readOnlyMode?.mode}
                  projectData={projectData}
                  participantProfile={participantProfile || { status: STATUS.IN_PROGRESS }}
                  onProgressChange={setOverallProgress}
                />
              )}
            </Box>
          </VStack>
          )}
        </Container>
      </Box>
    </Box>
  );
};

export default IdpProgressScreen;

