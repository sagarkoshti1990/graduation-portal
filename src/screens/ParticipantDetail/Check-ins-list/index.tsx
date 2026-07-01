import React, { useState, useEffect } from 'react';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { Box, Loader, Select } from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import PageHeader from '@components/PageHeader';
import CheckInsListContent from './CheckInsListContent';
import { getParticipantsList } from '../../../services/participantService';
import { getTargetedSolutions } from '../../../services/solutionService';
import { useAuth, User } from '@contexts/AuthContext';
import { ParticipantData } from '@app-types/participant';
import { AssessmentSurveyCardData } from '@app-types/participant';
import logger from '@utils/logger';
import { isWeb } from '@utils/platform';

/**
 * Route parameters type definition for LogVisit screen
 */
type LogVisitRouteParams = {
  id?: string;
};

/**
 * Route type for LogVisit screen
 */
type LogVisitRouteProp = RouteProp<{
  params: LogVisitRouteParams;
}>;

/**
 * LogVisit Component Props (for modal usage)
 */
interface LogVisitProps {
  id?: string;
  onClose?: () => void;
}

/**
 * LogVisit Component
 * Screen component for logging and viewing participant visits/check-ins
 * Uses CheckInsListContent for the actual content and adds navigation/header
 */
const LogVisit: React.FC<LogVisitProps> = ({ id: propId, onClose }) => {
  const route = useRoute<LogVisitRouteProp>();
  const navigation = useNavigation();
  const { t } = useLanguage();
  const { user, setNavbarData } = useAuth();

  // Use prop if provided, otherwise fall back to route params
  const id = propId || route.params?.id;
  // @ts-ignore
  const solutionId = route.params?.solutionId || '';
  // @ts-ignore
  const coachId = route.params?.coachId
  const authUserId = coachId || user?.id;
  const [participant, setParticipant] = useState<ParticipantData | User | undefined>(undefined);
  const [solutions, setSolutions] = useState<AssessmentSurveyCardData[]>([]);
  const [selectedSolution, setSelectedSolution] = useState<string>(solutionId);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch participant and solutions for header
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [response, solutionsData] = await Promise.all([
          id ? getParticipantsList({ entityId: id, userId: authUserId as string }) : Promise.resolve(undefined),
          getTargetedSolutions({authUserId: authUserId, type: 'observation', participantId: id }),
        ]);
        
        const { userDetails, ...rest } = response?.result?.data?.[0]
        const participantData = { ...(userDetails || {}), ...rest }
        if (participantData) {
          setParticipant(participantData);
          setNavbarData({
            subtitle: participantData?.name,
          });
        }
        setSolutions(solutionsData);
      } catch (error) {
        logger.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id && authUserId) {
      fetchData();
    }
    return () => {
      setNavbarData(null);
    };
  }, [id, setNavbarData, authUserId]);

  /**
   * Handle Back Navigation
   * Goes back to the previous screen in the navigation stack
   * Falls back to navigating to participant-detail if goBack is not available
   */
  const handleBackPress = () => {
    if (onClose) {
      onClose();
      return;
    }
    if (navigation.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // Fallback: Navigate to participant detail if there's no previous screen
      // @ts-ignore
      navigation.navigate('participant-detail', { id });
    }
  };

  const handleNavigateToObservation = (params: {
    id: string;
    solutionId: string;
    submissionNumber: number;
  }) => {
    // @ts-ignore
    navigation.navigate('observation' as never, params);
  };

  if (isLoading) {
    return <Loader message='Loading check-ins list...' containerProps={{height: isWeb ? ('$calc(100vh - 69px)' as any) : '$full' }} />;
  }

  if (!id) {
    return null;
  }

  return (
    <Box flex={1} bg="$accent100">
      {/* Header */}
      <PageHeader
        title={t('participantDetail.header.checkInsHistory')}
        subtitle={t('participantDetail.header.checkInsHistoryDescription', { name: participant?.name || '' })}
        onBackPress={handleBackPress}
        rightSection={
          <Box width="100%" minWidth={0} $md-width="auto" $md-minWidth={220}>
            <Select
              options={solutions.map(solution => ({
                label: solution.name || solution.id,
                value: solution.solutionId || solution.id,
              }))}
              value={selectedSolution}
              onChange={setSelectedSolution}
              placeholder={t('logVisit.selectSolutionPlaceholder')}
            />
          </Box>
        }
      />
      <CheckInsListContent
        id={id}
        onClose={onClose}
        onNavigateToObservation={handleNavigateToObservation}
        preSelectedSolution={selectedSolution}
        participant={participant as ParticipantData}
        solutions={solutions}
        coachId={coachId}
      />
    </Box>
  );
};

export default LogVisit;
