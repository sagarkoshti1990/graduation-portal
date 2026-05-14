import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { HStack, Box, Container, ReadMoreAlert } from '@ui';
import ParticipantHeader from './ParticipantHeader';
import { ParticipantProfileModal } from './ParticipantProfileModal';
import {
  getParticipantsList,
  getSolutionWithEntityStatus,
  // getSitesByProvince,
  // verifyParticipantCompletionActions
} from '../../services/participantService';
import { useLanguage } from '@contexts/LanguageContext';
import { useDocumentTitle } from '../../hooks';
import NotFound from '@components/NotFound';
import { TabButton } from '@components/Tabs';
import { PARTICIPANT_DETAIL_TABS } from '@constants/TABS';
// import { PROVINCES } from '@constants/PARTICIPANTS_LIST';
import InterventionPlan from './InterventionPlan';
import AssessmentSurveys from './AssessmentSurveys';
import type {
  ParticipantData,
  ParticipantStatus,
  // PathwayType,
} from '@app-types/participant';
import { Loader } from '@ui';
import ProjectPlayer, { ProjectPlayerData } from '../../project-player/index';
import {
  MODE,
  // DUMMY_PROJECT_DATA,
  PROJECT_PLAYER_CONFIGS,
} from '@constants/PROJECTDATA';
import {
  ENTITY_STATUS,
  GRADUATION_READINESS_PROGRESS_THRESHOLD,
  // GRADUATION_READINESS_PROGRESS_THRESHOLD,
  PARTICIPANT_DETAILS_TABS, STATUS, USER_STATUS } from '@constants/app.constant';
import { useAuth, User } from '@contexts/AuthContext';
import DownloadFormsCard from './ParticipantHeader/DownloadFormsCard';
import { ProjectData } from 'src/project-player/types/project.types';
import logger from '@utils/logger';
import { FILTER_KEYWORDS, INDIVIDUAL_CHECKIN_KEYWORD } from '@constants/LOG_VISIT_CARDS';
import { getObservationSubmissions, getTargetedSolutions } from '../../services/solutionService';
import LogVisitModulePopup from './LogVisitModulePopup';
import { useGlobal } from '@contexts/GlobalContext';
import { getAnswerData } from '@utils/helper';
import { PARTICIPANT_DETAIL_CHALLENGE_NOTES_ANSWER_ITEMS } from '@constants/GET_ANSWER_DATA';

/**
 * Route parameters type definition for ParticipantDetail screen
 * The route path is configured as '/participants/:id', so the parameter is extracted as 'id'
 * @example navigate('ParticipantDetail', { id: 'P-006' })
 */
type ParticipantDetailRouteParams = {
  id?: string;
};

/**
 * Route type for ParticipantDetail screen
 */
type ParticipantDetailRouteProp = RouteProp<{
  params: ParticipantDetailRouteParams;
}>;

export default function ParticipantDetail() {
  const route = useRoute<ParticipantDetailRouteProp>();
  const { user, setNavbarData } = useAuth()
  const { t } = useLanguage();
  const { setRefComponent } = useGlobal()
  // Extract the id parameter from the route
  const participantId = route.params?.id;
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('intervention-plan');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [status, setStatus] = useState('');
  const [idpCreated, setIdpCreated] = useState(false);
  const [participant, setParticipant] = useState<User | undefined>();
  const [areAllTasksCompleted, setAreAllTasksCompleted] = useState(false);
  const [updatedProgress, setUpdatedProgress] = useState<number | undefined>(
    undefined,
  );
  const [hasProgressBaseline, setHasProgressBaseline] = useState(false);
  const [configData, setConfigData] = useState<any>(null);
  const [projectPlayerConfigData, setProjectPlayerConfigData] = useState<ProjectPlayerData | null>(null);
  const isFetchingRef = useRef(false);
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [solutions, setSolutions] = useState<any[]>([]);
  const [challenges,setChallenges] = useState<{successNotes:string|undefined,challengeNotes:string|undefined} | never>();
  // Set document title with participant name
  const pageTitle = participant?.name
    ? `${participant.name} - ${t('lc.pageTitle.participant-detail')}`
    : t('lc.pageTitle.participant-detail');
  useDocumentTitle(pageTitle);

  const showOnboardingProject =
    (participant?.accountUserStatus === USER_STATUS.INACTIVE && !participant?.idpProjectId)
      ? "user-inactive"
      : (status === STATUS.DROPOUT && !participant?.idpProjectId)
      ? "dropout"
      : status === STATUS.NOT_ENROLLED
      ? "not_enrolled"
      : false;

  const fetchEntityDetails = useCallback(async () => {
    if (participantId && user?.id && !isFetchingRef.current) {
      try {
        isFetchingRef.current = true;
        const response = await getParticipantsList({ entityId: participantId, userId: user?.id })
        const { userDetails, ...rest } = response?.result?.data?.[0]
        let participantData = { ...(userDetails || {}), ...rest, accountUserStatus: userDetails?.status }

        setParticipant(participantData);
        setNavbarData({
          subtitle: participantData?.name,
        });
        setStatus(participantData?.status);
      } catch (error) {
        logger.log(error);
      } finally {
        setIsLoading(false);
        isFetchingRef.current = false;
      }
    }
    // @ts-ignore
  }, [participantId, user?.id, setNavbarData]);

  // Re-fetch data when screen comes into focus (e.g., navigating back)
  useFocusEffect(
    useCallback(() => {
      fetchEntityDetails();
      return () => {
        setActiveTab("intervention-plan")
        setSolutions([]);
        setProjectData(null);
        setNavbarData(null);
        setParticipant(undefined);
        setStatus("");
        setIdpCreated(false);
        setAreAllTasksCompleted(false);
        setUpdatedProgress(undefined);
        setHasProgressBaseline(false);
        setConfigData(null);
        setProjectPlayerConfigData(null);
        setIsLoading(true);
        setChallenges(undefined)
        setRefComponent?.(undefined)
      };
    }, [fetchEntityDetails, setNavbarData])
  );

  // Re-fetch when idpCreated changes
  useEffect(() => {
    if (idpCreated) {
      fetchEntityDetails();
    }
  }, [idpCreated, fetchEntityDetails]);

  const handleIdpCreated = () => {
    setIdpCreated(true)
  }

  useEffect(() => {
    setUpdatedProgress(undefined);
    setHasProgressBaseline(false);
  }, [participantId]);

  // Update configData and ProjectPlayerConfigData when participant or status changes
  useEffect(() => {
    if (!participant) {
      setConfigData(null);
      setProjectPlayerConfigData(null);
      return;
    }

    // Determine ProjectPlayer config and data based on participant status
    const config = PROJECT_PLAYER_CONFIGS;
    const selectedMode = MODE.editMode;

    const newConfigData = {
      ...config,
      ...selectedMode,
      showAddCustomTaskButton: false,
      profileInfo: participant,
    };

    const newProjectPlayerConfigData: ProjectPlayerData = {
      projectId: status === STATUS.IN_PROGRESS
        ? participant?.idpProjectId
        : status === STATUS.NOT_ENROLLED
          ? participant?.onBoardedProjectId
          : participant?.onBoardedProjectId,
      entityId: participant?.entityId,
      userStatus: participant?.status,
      province: participant?.province?.value
    };

    setConfigData(newConfigData);
    setProjectPlayerConfigData(newProjectPlayerConfigData);

    // Cleanup function: clear state when component unmounts or dependencies change
    return () => {
      setConfigData(null);
      setProjectPlayerConfigData(null);
    };
  }, [participant, status]);
  useEffect(() => {
    const fetchSolutions = async () => {
      let keywordsString = `${FILTER_KEYWORDS.PARTICIPANT_LOG_VISIT.join(',')}`;
      
      if(participant?.status === STATUS.IN_PROGRESS && updatedProgress && updatedProgress >= GRADUATION_READINESS_PROGRESS_THRESHOLD) {
        keywordsString += `,${FILTER_KEYWORDS.PROGRAM_COMPLETED_ONLY.join(',')}`;
      }
      
      if(participant?.status === STATUS.IN_PROGRESS) {
        keywordsString += `,${FILTER_KEYWORDS.LOG_VISIT.join(',')}`;
      }

      const solutionsData = await getTargetedSolutions({
        type: 'observation',
        'filter[keywords]': keywordsString,
      });    // Verify participant completion conditions and perform certificate/graduation actions
      const solutionsWithEntityStatus = await getSolutionWithEntityStatus(solutionsData, participant?.id as string);

      if(participant?.status === STATUS.IN_PROGRESS) {
        const checkIns = solutionsWithEntityStatus.find(item => item?.keywords?.includes(INDIVIDUAL_CHECKIN_KEYWORD))
        if(checkIns?.entity?.submissionsCount >= 1 && checkIns?.entity) {
          const submissionsData = await getObservationSubmissions({
            observationId:checkIns?._id,
            entityId:checkIns?.entity?._id,
            getAnswers:true,
          });
          const submission = submissionsData?.result.find((item:any) => item.status === ENTITY_STATUS.COMPLETED)
          const { challengeNotes, successNotes } = getAnswerData(PARTICIPANT_DETAIL_CHALLENGE_NOTES_ANSWER_ITEMS,submission?.answers || {})
          if(challengeNotes || successNotes) {
            setChallenges({challengeNotes,successNotes});
          }
        }
      }

      setSolutions(solutionsWithEntityStatus);
      // if (updatedProgress && updatedProgress >= GRADUATION_READINESS_PROGRESS_THRESHOLD) {
      //   const completionActionResult = await verifyParticipantCompletionActions({
      //     participantData: participant,
      //     userId: user?.id as string,
      //     solutions: solutionsData
      //   });
      //   if (completionActionResult.success) {
      //     setIsLoading(true);
      //     try {
      //       const refreshedResponse = await getParticipantsList({
      //         entityId: participantId,
      //         userId: user?.id as string,
      //       });
      //       const refreshedRow = refreshedResponse?.result?.data?.[0] || {};

      //       if (refreshedRow) {
      //         const { userDetails: refreshedUserDetails, ...refreshedRest } = refreshedRow;
      //         setParticipant({
      //           ...(refreshedUserDetails || {}),
      //           ...refreshedRest,
      //           accountUserStatus: refreshedUserDetails?.status,
      //         } as User);
      //       }
      //     } catch (refreshError) {
      //       logger.log('Best-effort participant refresh failed:', refreshError);
      //     }
      //     setIsLoading(false);
      //   }
      // }
    }

    if (participant && participantId && user?.id && solutions.length === 0 && updatedProgress !== undefined) {
      fetchSolutions();
    }
  }, [updatedProgress, participant, participantId, solutions.length, user?.id]);

  const handleProgressChange = async (progress: number) => {
    if (!hasProgressBaseline) {
      setHasProgressBaseline(true);
      return;
    }
    setUpdatedProgress(progress);
  };

  const handleParticipantAddressSaved = useCallback(
    (patch: { location: string; email: string }) => {
      setParticipant((prev: User | undefined) =>
        prev
          ? ({
              ...prev,
              location: patch.location,
              email: patch.email,
            } as User)
          : prev,
      );
    },
    [],
  );

  useEffect(() => {
    if (setRefComponent) {
      setRefComponent({bottom :
        solutions.length > 0 ? (
          <LogVisitModulePopup
            participant={participant as ParticipantData}
            solutions={solutions}
            observationLogsTitle={t('actions.observationLogs')}
            noSolutionsMessage={t('logVisit.noSolutions')}
          />
        ) : null})
    }
  }, [setRefComponent, solutions.length, participant, t]);

  const closeProfileModal = useCallback(() => setIsProfileModalOpen(false), []);

  if (isLoading) {
    return <Loader fullScreen message="Loading participant details..." />;
  }

  // Error State: Participant Not Found
  if (!participant) {
    return <NotFound message="participantDetail.notFound.title" />;
  }
  
  return (
    <Box flex={1} bg="$accent100">
      {/* Participant Header with status-based variations */}
      <ParticipantHeader
        participant={participant}
        pathway={'employment'}
        graduationDate={''}
        updatedProgress={updatedProgress}
        onViewProfile={() => setIsProfileModalOpen(true)}
        areAllTasksCompleted={areAllTasksCompleted}
        onStatusUpdate={newStatus => {
          setStatus(newStatus);
          setParticipant((prev: User | undefined) =>
            prev
              ? ({
                  ...prev,
                  status: newStatus,
                } as User)
              : prev,
          );
        }}
        projectData={projectData}
        // @ts-ignore
        onParticipantRefresh={fetchEntityDetails}
        solutions={solutions}
      />

      <Container px="$4" py="$6" $md-px="$6">
        {showOnboardingProject ? (
          <>
            <DownloadFormsCard mode={showOnboardingProject === "not_enrolled" ? "edit" : "read-only"} />
            {configData && projectPlayerConfigData && (
              <ProjectPlayer
                key={`project-player-${participantId}`}
                config={{...configData, mode: showOnboardingProject === "not_enrolled" ? "edit" : "read-only"}}
                data={projectPlayerConfigData}
                onTaskCompletionChange={setAreAllTasksCompleted}
                onProgressChange={handleProgressChange}
              />
            )}
          </>
        ) : (
          // ENROLLED, IN_PROGRESS, DROPOUT: Show tabs with ProjectPlayer in InterventionPlan
          <Box>
            {/* Tabs */}
            <Box width="$full" mt="$2" mb="$0">
              <Box width="$full">
                <HStack
                  width="$full"
                  bg="$backgroundLight50"
                  borderRadius={50}
                  p={4}
                  gap={4}
                  alignItems="center"
                >
                  {PARTICIPANT_DETAIL_TABS?.map(tab => (
                    <TabButton
                      key={tab.key}
                      tab={tab}
                      isActive={activeTab === tab.key}
                      onPress={setActiveTab}
                      variant="ButtonTab"
                    />
                  ))}
                </HStack>
              </Box>
            </Box>

            {/* Tab Content */}
            <Box flex={1} mt="$2" mb="$4" bg="transparent" width="$full">
              {activeTab ===
                PARTICIPANT_DETAILS_TABS.INTERVENTION_PLAN && (
                  <Box gap="$2">
                    {challenges?.challengeNotes &&
                      <ReadMoreAlert
                        label={t("participantDetail.interventionPlan.challenges")}
                        variant="warning"
                        text={challenges?.challengeNotes || ""}
                        lineLimit={2}
                        readMoreText={t("common.showMore")}
                        readLessText={t("common.showLess")}
                      />
                    }
                    {challenges?.successNotes &&
                      <ReadMoreAlert
                        label={t("participantDetail.interventionPlan.successNotes")}
                        variant="success"
                        text={challenges?.successNotes || ""}
                        lineLimit={2}
                        readMoreText={t("common.showMore")}
                        readLessText={t("common.showLess")}
                      />
                      }
                    <InterventionPlan
                      participantStatus={status as ParticipantStatus}
                      participantId={participant?.id}
                      participantProfile={participant}
                      onIdpCreation={handleIdpCreated}
                      onProgressChange={handleProgressChange}
                      getProjectData={setProjectData}
                    />
                  </Box>
                )}
              {activeTab ===
                PARTICIPANT_DETAILS_TABS.ASSESSMENTS_SURVEYS && (
                  <Box mt="$6">
                    <AssessmentSurveys
                      participant={participant as ParticipantData}
                      completionPercentage={updatedProgress || 0}
                    />
                  </Box>
                )}
            </Box>
          </Box>
        )}
      </Container>

      <ParticipantProfileModal
        isOpen={isProfileModalOpen}
        onClose={closeProfileModal}
        participant={participant}
        onParticipantSaved={handleParticipantAddressSaved}
      />
    </Box>
  );
}
