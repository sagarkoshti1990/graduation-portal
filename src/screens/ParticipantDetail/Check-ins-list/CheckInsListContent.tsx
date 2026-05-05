import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Spinner,
  Card,
  Button,
  ButtonText,
  ButtonIcon,
  useAlert,
  Badge,
  BadgeText,
} from '@ui';
import { LucideIcon } from '@ui';
import { getParticipantsList } from '../../../services/participantService';
import {
  getTargetedSolutions,
  getObservationEntities,
  getObservationSubmissions,
} from '../../../services/solutionService';
import { useLanguage } from '@contexts/LanguageContext';
import { logVisitStyles } from './Style';
import { assessmentSurveyCardStyles } from '@components/ObservationCards/Styles';
import NotFound from '@components/NotFound';
import { ParticipantData } from '@app-types/participant';
import { AssessmentSurveyCardData } from '@app-types/participant';
import logger from '@utils/logger';
import { isWeb } from '@utils/platform';
import { StatusBadge } from '@components/ObservationCards';
import { CARD_STATUS, ENTITY_TYPE } from '@constants/app.constant';
import { ICONS, PARTICIPANT_LOG_VISIT_KEYWORD } from '@constants/LOG_VISIT_CARDS';
import offlineStorage from '../../../services/offlineStorage';
import { STORAGE_KEYS } from '@constants/STORAGE_KEYS';
import type { User } from '@contexts/AuthContext';
import PaginationControls from '@components/DataTable/PaginationControls';
import { getAnsweData } from '@utils/helper';

/**
 * CheckInsListContent Component Props
 * Component without navigation dependencies - can be used in modals
 */
interface CheckInsListContentProps {
  id: string;
  solutions?: AssessmentSurveyCardData[];
  userName?: string;
  onClose?: () => void;
  onFormSelect?: (submission: any,solutionName: string) => void;
  onNavigateToObservation?: (params: {
    id: string;
    solutionId: string;
    submissionNumber: number;
  }) => void;
  preSelectedSolution?: string;
  participant?: ParticipantData;
  _container?:any
}

/**
 * CheckInsListContent Component
 * Component for viewing participant check-ins without navigation dependencies
 */
const CheckInsListContent: React.FC<CheckInsListContentProps> = ({
  id,
  onNavigateToObservation,
  preSelectedSolution,
  onFormSelect,
  solutions: propSolutions,
  participant: propParticipant,
  _container
}) => {
  type IconMeta = {
    color?: string;
    icon?: string;
    iconColor?: string;
  } | null;

  const [loading, setLoading] = useState<boolean>(true);
  const [solutions, setSolutions] = useState<AssessmentSurveyCardData[]>(propSolutions || []);
  const [selectedSolution, setSelectedSolution] = useState<string>('');
  const [solutionItem, setSolutionItem] = useState<AssessmentSurveyCardData | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState<boolean>(false);
  const [iconMeta, setIconMeta] = useState<IconMeta>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isUserLoaded, setIsUserLoaded] = useState(false);
  const [limit,setLimit] = useState(5);
  const [page,setPage] = useState(1);
  const [total,setTotal] = useState(0)
  const [participant, setParticipant] = useState<
    ParticipantData | undefined
  >(propParticipant);
  const { t } = useLanguage();
  const { showAlert } = useAlert();
  
  /**
   * Load user from offline storage (so this component can work outside AuthProvider).
   */
  useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      try {
        const storedUser = await offlineStorage.read<User>(STORAGE_KEYS.AUTH_USER);
        const isValidUser =
          storedUser &&
          typeof storedUser === 'object' &&
          Object.keys(storedUser).length > 0 &&
          ((storedUser as any).id || (storedUser as any).email);

        if (isMounted) {
          setUser(isValidUser ? storedUser : null);
        }
      } catch (error) {
        logger.error('Error loading user from storage:', error);
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setIsUserLoaded(true);
      }
    };

    loadUser();

    return () => {
      isMounted = false;
    };
  }, []);
  /**
   * Fetch targeted solutions from API
   * Only fetch participant if not provided via props
   */
  useEffect(() => {
    if (!isUserLoaded) return;

    const fetchSolutions = async () => {
      try {
        if(propSolutions) {
          setSolutions(propSolutions);
        } else {
          const data = await getTargetedSolutions({
            type: 'observation',
          });
          setSolutions(data);
        }
       
      } catch (error) {
        logger.error('Error fetching solutions:', error);
        setSolutions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSolutions();
  }, [isUserLoaded, propSolutions]);

  useEffect(() => {
    if (preSelectedSolution) {
      setSelectedSolution(preSelectedSolution);
    }
  }, [preSelectedSolution]);

  /**
   * Update local participant state when prop changes
   */
  useEffect(() => {
    const fetchParticipant = async () => {
      if (propParticipant) {
        setParticipant(propParticipant);
      } else {
        // Only fetch participant if not provided via props
        if (id && user?.id) {
          const response = await getParticipantsList({
            entityId: id,
            userId: user.id,
          });
          setParticipant(response?.result?.data?.[0] as ParticipantData);
        }
      }
    }
    fetchParticipant();
  }, [propParticipant, id, user?.id]);

  /**
   * Fetch submissions when a solution is selected
   */
  useEffect(() => {
    const fetchSubmissions = async () => {
      if (!selectedSolution || !participant?.userId || solutions.length <= 0 || !user?.id) {
        setSubmissions([]);
        return;
      }
      
      setSubmissionsLoading(true);
      try {
        const selectedSolutionData = solutions.find(
          s => s.solutionId === selectedSolution || s.id === selectedSolution,
        );
        if (!selectedSolutionData) {
          logger.error('Solution not found');
          setSubmissions([]);
          return;
        }
       
        const getAnswers = selectedSolutionData?.keywords?.includes(PARTICIPANT_LOG_VISIT_KEYWORD);
        const iconMetanew = ICONS?.[selectedSolutionData?.name?.toLowerCase() as keyof typeof ICONS];
        setIconMeta(iconMetanew as any);
        const solutionNameData = solutions.find((sol: any) => sol.solutionId === selectedSolution);
        let filterAnswerValue,userId, entityId: string | null = null;
        setSolutionItem(solutionNameData || null);
        if(solutionNameData?.entityType === ENTITY_TYPE.LINKAGE_CHAMPION){
          filterAnswerValue = participant?.entityId
          userId = user?.id;
        } else {
          userId = participant?.userId;
        }

        // Get observation entities to find observationId and entityId
        const observationData = await getObservationEntities({
          solutionId: selectedSolutionData.solutionId || selectedSolutionData.id,
          profileData: {},
        });
        const observationId = observationData?.result?._id;
        if (!observationId) {
          logger.error('Observation ID not found');
          setSubmissions([]);
          return;
        }

        // Find entityId for the participant
        if (Array.isArray(observationData.result?.entities) && userId) {
          const participantEntity = observationData.result.entities.find(
            (entityItem: any) => entityItem.externalId == userId,
          );
          if (participantEntity) {
            entityId = participantEntity._id;
          }
        }

        if (!entityId) {
          logger.log(t('logVisit.errors.entityIdNotFound'));
          setSubmissions([]);
          return;
        }

        // Fetch submissions
        const submissionsData = await getObservationSubmissions({
          observationId,
          entityId,
          filterAnswerValue,
          getAnswers,
          page,
          limit
        });

        // Map submissions from response
        const submissionsList =
          (submissionsData?.result || submissionsData?.data || []).filter(
            (e: any) => e.status === CARD_STATUS.COMPLETED,
          );
        setTotal(submissionsData?.total);
        setSubmissions(Array.isArray(submissionsList) ? submissionsList : []);
      } catch (error) {
        logger.error('Error fetching submissions:', error);
        setSubmissions([]);
      } finally {
        setSubmissionsLoading(false);
      }
    };

    fetchSubmissions();
  }, [selectedSolution, solutions, participant, user,limit,page,t]);

  const handleViewForm = (submissionNumber: number) => {
    if (onNavigateToObservation && participant?.userId && selectedSolution) {
      if (solutionItem?.entityType === ENTITY_TYPE.LINKAGE_CHAMPION && !user?.id) {
        showAlert('error', t('logVisit.errors.userNotFound'));
        return;
      }
      onNavigateToObservation({
        id: solutionItem?.entityType === ENTITY_TYPE.LINKAGE_CHAMPION ? user?.id : participant.userId,
        solutionId: selectedSolution,
        submissionNumber,
      });
    }
  };

  if (loading) {
    return (
      <Spinner
        height={isWeb ? ('$calc(100vh - 285px)' as any) : '$full'}
        size="large"
        color="$primary500"
      />
    );
  }

  // Error State: Missing participant ID or participant not found
  if (!participant) {
    return <NotFound message="participantDetail.notFound.title" />;
  }

  return (
    <Container px="$3" py="$4" $md-px="$6" $md-py="$6" {..._container}>
      {/* Submissions List */}
      {selectedSolution ? (
        <VStack {...logVisitStyles.cardsContainer}>
          {submissionsLoading ? (
            <Spinner size="large" color="$primary500" />
          ) : submissions.length > 0 ? (
            <VStack flex={1} space="md" width={"$full"}>
            {submissions.map((submission, index) => (
              <SubmitionCard key={submission._id || index} submission={submission} iconMeta={iconMeta} 
                onFormSelect={() =>
                  onFormSelect
                    ? onFormSelect(
                        submission,
                        solutionItem?.name || '',
                      )
                    : handleViewForm(submission.submissionNumber)
                }
              />
            ))}
            <PaginationControls
              currentPage={page}
              totalPages={Math.ceil(total/limit)}
              pageSize={limit}
              totalItems={total}
              startIndex={limit*(page-1)}
              endIndex={page*limit}
              onPageChange={(num) => setPage(num)}
              onPageSizeChange={(num) => setLimit(num)}
              config={{
                pageSizeOptions:[5,10,20,30],
                showPageSizeSelector:true
              }}
            />
            </VStack>
          ) : (
            !submissionsLoading && (
              <Card
                {...assessmentSurveyCardStyles.emptyCard}
                width="100%"
                maxWidth="100%"
              >
                <LucideIcon name={'Clock'} size={48} />
                <Text {...assessmentSurveyCardStyles.emptyCardTitale}>
                  {t('logVisit.noCheckInsYet')}
                </Text>
                <Text {...assessmentSurveyCardStyles.emptyCardTitale} pt="$0">
                  {t('logVisit.noCheckInsYetDescription')}
                </Text>
              </Card>
            )
          )}
        </VStack>
      ) : (
        <Box {...logVisitStyles.selectSolutionContainer} width="100%" px="$1">
          <Card
            {...assessmentSurveyCardStyles.cardContainer}
            {...logVisitStyles.selectSolutionCard}
            width="100%"
            maxWidth="100%"
            $web-boxShadow="none"
          >
            <LucideIcon name={'Info'} size={48} color="$textMutedForeground" />
            <Text {...assessmentSurveyCardStyles.emptyCardTitale}>
              {t('logVisit.selectFormTypeMessage')}
            </Text>
          </Card>
        </Box>
      )}
    </Container>
  );
};

export default CheckInsListContent;

const SubmitionCard = ({ submission, iconMeta, onFormSelect }: { submission: any, iconMeta: any, onFormSelect?: any }) => {
  const { t } = useLanguage()
  const [answers,setAnswers] = useState<any>();

  useEffect(() => {
    if(submission?.answers) {
      // @ts-ignore
      setAnswers(getAnsweData(["Visit Date","Notes","Tags"],submission?.answers));
    }
  },[submission?.answers])
  
  return <Card
    {...assessmentSurveyCardStyles.cardContainer}
    p="$4"
    $md-p="$5"
    width="100%"
    maxWidth="100%"
    $web-boxShadow="none"
  >
    <VStack space="lg" width="100%">
      <HStack
        {...assessmentSurveyCardStyles.cardHeader}
        alignItems="flex-start"
        width="100%"
        space="md"
      >
        <Box
          flexShrink={0}
          {...{
            ...assessmentSurveyCardStyles.iconContainer,
            bg: iconMeta?.color || '$primary500',
          }}
        >
          <LucideIcon
            name={iconMeta?.icon || 'Info'}
            size={24}
            color={iconMeta?.iconColor || '$white'}
          />
        </Box>
        {submission.answers ?
          <VStack flex={1} minWidth="$0" space="md" alignSelf="stretch">
            <HStack justifyContent='space-between'>
              <Badge size="md" variant="solid" bg="$primary500" borderRadius="10px">
                <BadgeText color="$white" fontWeight={500}>{answers?.tags || "visit"}</BadgeText>
              </Badge>
              <HStack space='sm' alignItems='center'>
                <LucideIcon name="Calendar" color="$badgeColor" size={14} />
                <Text color="$badgeColor" fontSize={"$sm"}>
                  {answers?.visitDate
                    ? (() => {
                        const date = new Date(answers.visitDate);
                        const day = String(date.getDate()).padStart(2, '0');
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const year = date.getFullYear();
                        return `${day}-${month}-${year}`;
                      })()
                    : ''}
             
                </Text>
              </HStack>
            </HStack>
            <Text fontSize={"$sm"} color='$textForegroundColor'>
              {answers?.notes}
            </Text>
          </VStack>
        : <VStack flex={1} minWidth="$0" space="md" alignSelf="stretch">
          <HStack
            alignItems="flex-start"
            space="sm"
            flexWrap="wrap"
            width="100%"
          >
            <Text
              {...assessmentSurveyCardStyles.title}
              flexShrink={1}
            >
              {submission.observationName} #
              {submission.submissionNumber}
            </Text>
            {submission.status && (
              <Box flexShrink={0} mt="$0.5">
                <StatusBadge status={submission.status} />
              </Box>
            )}
          </HStack>
          <HStack
            alignItems="flex-start"
            space="xs"
            flexWrap="wrap"
            width="100%"
          >
            <Text
              {...assessmentSurveyCardStyles.description}
              flexShrink={0}
            >
              {t('logVisit.submissionDate')} :
            </Text>
            {submission.submissionDate && (
              <HStack
                alignItems="center"
                space="xs"
                flexWrap="wrap"
                flexShrink={1}
                minWidth="$0"
              >
                <LucideIcon
                  name="Calendar"
                  size={16}
                  color="$textMutedForeground"
                />
                <Text
                  {...assessmentSurveyCardStyles.description}
                  flexShrink={1}
                >
                  {new Date(
                    submission.submissionDate,
                  ).toLocaleString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </Text>
              </HStack>
            )}
          </HStack>
          <Button
            width="$full"
            $md-width="fit-content"
            alignSelf="stretch"
            $md-alignSelf="flex-start"
            // @ts-ignore
            variant={'outlineghost'}
            onPress={onFormSelect}
          >
            <ButtonIcon as={LucideIcon} name="Eye" size={16} />
            <ButtonText {...assessmentSurveyCardStyles.buttonText}>
              {t('logVisit.viewForm')}
            </ButtonText>
          </Button>
        </VStack>}
      </HStack>
    </VStack>
  </Card>
}