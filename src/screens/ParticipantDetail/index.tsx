import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { HStack, Box, Container, ReadMoreAlert, Text } from '@ui';
import ParticipantHeader from './ParticipantHeader';
import { ParticipantProfileModal } from './ParticipantProfileModal';
import {
  getSolutionWithEntityStatus,
  // getSitesByProvince,
  // verifyParticipantCompletionActions
} from '../../services/participantService';
import dataService from '../../services/dataService';
import offlineStorage from '../../services/offlineStorage';
import { PARTICIPANT_KEYS } from '@constants/STORAGE_KEYS';
import type { OfflineSolutionEntry } from '@app-types/offline';
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
  // PathwayType,
} from '@app-types/participant';
import { Loader } from '@ui';
import {
  ENTITY_STATUS,
  GRADUATION_READINESS_PROGRESS_THRESHOLD,
  // GRADUATION_READINESS_PROGRESS_THRESHOLD,
  PARTICIPANT_DETAILS_TABS, STATUS, USER_STATUS } from '@constants/app.constant';
import { useAuth, User } from '@contexts/AuthContext';
import DownloadFormsCard from './ParticipantHeader/DownloadFormsCard';
import { ProjectData } from '../../project-player/types';
import logger from '@utils/logger';
import { FILTER_KEYWORDS, INDIVIDUAL_CHECKIN_KEYWORD } from '@constants/LOG_VISIT_CARDS';
import { getObservationSubmissions, getTargetedSolutions } from '../../services/solutionService';
import LogVisitModulePopup from './LogVisitModulePopup';
import { useGlobal } from '@contexts/GlobalContext';
import { getAnswerData } from '@utils/helper';
import { PARTICIPANT_DETAIL_CHALLENGE_NOTES_ANSWER_ITEMS } from '@constants/GET_ANSWER_DATA';
import { MODE } from '@constants/PROJECTDATA';
import TargetingCriteriaCard from './ParticipantHeader/TargetingCriteriaCard';

/**
 * Route parameters type definition for ParticipantDetail screen
 * The route path is configured as '/participants/:id', so the parameter is extracted as 'id'
 * @example navigate('ParticipantDetail', { id: 'P-006' })
 */
type ParticipantDetailRouteParams = {
  id?: string;
  coachId?:string;
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
  const coachId = route.params?.coachId
  const authUserId = coachId || user?.id;

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
  const isFetchingRef = useRef(false);
  const [isOfflineUnavailable, setIsOfflineUnavailable] = useState(false);
  const [projectData, setProjectData] = useState<ProjectData | undefined>(undefined);
  const [solutions, setSolutions] = useState<any[]>([]);
  const [challenges,setChallenges] = useState<{successNotes:string|undefined,challengeNotes:string|undefined} | never>();
  const [targetingCriteria,setTargetingCriteria] = useState(false);
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
      : status === STATUS.NOT_ELIGIBLE
      ? "not_eligible"
      : false;

  const fetchEntityDetails = useCallback(async () => {
    if (participantId && authUserId && !isFetchingRef.current) {
      try {
        isFetchingRef.current = true;
        const result = await dataService.getParticipantDetails(participantId, authUserId);
        const participantData = result.data as any;
        const resolvedProjectId = (participantData.status === STATUS.NOT_ONBOARDED && participantData.onBoardedProjectId) ? participantData.onBoardedProjectId : participantData?.idpProjectId;
        const response = await dataService.getProject<ProjectData>(participantData.id, resolvedProjectId, authUserId ?? '')

        if (result.isOffline && !result.offlineDataAvailable) {
          setIsOfflineUnavailable(true);
          setParticipant(undefined);
          setStatus('');
        } else {
          setIsOfflineUnavailable(false);
          setProjectData(response.data);
          setParticipant(participantData);
          setNavbarData({ subtitle: participantData?.name });
          setStatus(participantData?.status);
        }
      } catch (error) {
        logger.log(error);
        setParticipant(undefined);
      } finally {
        setIsLoading(false);
        isFetchingRef.current = false;
      }
    }
    // @ts-ignore
  }, [participantId, authUserId, setNavbarData]);

  // Re-fetch data when screen comes into focus (e.g., navigating back)
  useFocusEffect(
    useCallback(() => {
      fetchEntityDetails();
      return () => {
        setActiveTab("intervention-plan")
        setSolutions([]);
        setProjectData(undefined);
        setNavbarData(null);
        setParticipant(undefined);
        setStatus("");
        setIdpCreated(false);
        setAreAllTasksCompleted(false);
        setUpdatedProgress(undefined);
        setIsLoading(true);
        setChallenges(undefined);
        setIsOfflineUnavailable(false);
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
  }, [participantId]);

  useEffect(() => {
    const fetchSolutions = async () => {
      if(coachId) return false;
      // When offline, load solutions from the per-participant downloaded mapping.
      // The global targeted-solutions cache may be empty; the participant mapping
      // is always populated during download and has the correct solutionId/keyword data.
      if (dataService.isNetworkOffline()) {
        if (participantId) {
          const stored = await offlineStorage.read<OfflineSolutionEntry[]>(
            PARTICIPANT_KEYS.solutions(authUserId ?? '', participantId),
          );
          if (stored?.length) {
            setSolutions(
              stored.map(e => ({
                _id: e.observationId,
                id: e.observationId,
                solutionId: e.solutionId,
                keywords: [e.keyword],
                name: e.keyword,
                description: '',
              })),
            );
          }
        }
        return;
      }

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

      if (setRefComponent) {
      setRefComponent({bottom :
        solutionsWithEntityStatus.length > 0 ? (
          <LogVisitModulePopup
            participant={participant as ParticipantData}
            solutions={solutionsWithEntityStatus}
            observationLogsTitle={'actions.observationLogs'}
            noSolutionsMessage={'logVisit.noSolutions'}
          />
        ) : null})
      }
    }
    if (setRefComponent && participant && participantId && authUserId && solutions.length === 0 && updatedProgress !== undefined) {
      fetchSolutions();
    } else
    if(updatedProgress && updatedProgress >= GRADUATION_READINESS_PROGRESS_THRESHOLD && solutions.length > 0) {
      const bool = solutions.find((item:any) =>
        item.keywords.some((key:any) => FILTER_KEYWORDS.PROGRAM_COMPLETED_ONLY.includes(key))
      )
      if(!bool?._id) {
        fetchSolutions();
      }
    }
  }, [setRefComponent, updatedProgress, participant, participantId, solutions, authUserId]);

  const handleProgressChange = async (progress: number) => {
    setUpdatedProgress(progress);
  };

  const handleParticipantAddressSaved = useCallback(
    (patch: { location: string; email?: string }) => {
      setParticipant((prev: User | undefined) =>
        prev
          ? ({
              ...prev,
              location: patch.location,
              email: patch?.email || "",
            } as User)
          : prev,
      );
    },
    [],
  );

  const closeProfileModal = useCallback(() => setIsProfileModalOpen(false), []);

  const handleTargetingCriteriaResponce = useCallback((item:string|boolean) => {
    if(item === STATUS.NOT_ELIGIBLE) {
      setStatus(STATUS.NOT_ELIGIBLE);
      setParticipant((prev: User | undefined) =>
        prev
          ? ({
              ...prev,
              status: STATUS.NOT_ELIGIBLE,
            } as User)
          : prev,
      );
    } else {
      setTargetingCriteria(true)
    }
  }
  , []);
  
  if (isLoading) {
    return <Loader fullScreen message="Loading participant details..." />;
  }

  // Error State: Offline and no cached data
  if (isOfflineUnavailable) {
    return <NotFound message="offlineSync.dataUnavailable" />;
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
        coachId={coachId}
      />

      <Container px="$4" py="$6" $md-px="$6">
        {showOnboardingProject === "not_eligible" ? (
          <></>
        ) : !participant?.onBoardedProjectId && !targetingCriteria ?
          <TargetingCriteriaCard user={user} participant={participant} setTargetingCriteria={handleTargetingCriteriaResponce}/>
         : showOnboardingProject ? (
          <>
            <DownloadFormsCard
              mode={
                showOnboardingProject === 'not_enrolled' ? 'edit' : dataService.isNetworkOffline() ? 'hide' :  'read-only'
              }
            />
            <InterventionPlan
              key={`project-player-${participantId}`}
              participantProfile={participant}
              onTaskCompletionChange={setAreAllTasksCompleted}
              projectData={projectData}
              {...(coachId ? {mode:MODE.readOnlyMode?.mode}:{})}
            />
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
              {activeTab === PARTICIPANT_DETAILS_TABS.INTERVENTION_PLAN && (
                <Box gap="$2">
                  {challenges?.challengeNotes && (
                    <ReadMoreAlert
                      label={t('participantDetail.interventionPlan.challenges')}
                      variant="warning"
                      text={challenges?.challengeNotes || ''}
                      lineLimit={2}
                      readMoreText={t('common.showMore')}
                      readLessText={t('common.showLess')}
                    />
                  )}
                  {challenges?.successNotes && (
                    <ReadMoreAlert
                      label={t(
                        'participantDetail.interventionPlan.successNotes',
                      )}
                      variant="success"
                      text={challenges?.successNotes || ''}
                      lineLimit={2}
                      readMoreText={t('common.showMore')}
                      readLessText={t('common.showLess')}
                    />
                  )}
                  <InterventionPlan
                    participantProfile={participant}
                    onIdpCreation={handleIdpCreated}
                    onProgressChange={handleProgressChange}
                    projectData={projectData}
                    {...(coachId ? {mode:MODE.readOnlyMode?.mode}:{})}
                  />
                </Box>
              )}
              {activeTab === PARTICIPANT_DETAILS_TABS.ASSESSMENTS_SURVEYS && (
                <Box mt="$6">
                  <AssessmentSurveys
                    participant={participant as ParticipantData}
                    completionPercentage={updatedProgress || 0}
                    {...(coachId ? {isReadOnly:true}:{})}
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
        participantId={participant.userId || ''}
        userId={authUserId || ''}
        onParticipantSaved={handleParticipantAddressSaved}
        {...(coachId ? {isReadOnly:true}:{})}
      />
    </Box>
  );
}
