import React, { useState, useEffect } from 'react';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { Box, Container, VStack, HStack, Text, Spinner, Button, ButtonText, ButtonIcon, LucideIcon } from '@ui';
import { AssessmentCard } from '@components/ObservationCards';
import { getParticipantsList } from '../../../services/participantService';
import { getTargetedSolutions } from '../../../services/solutionService';
import { useLanguage } from '@contexts/LanguageContext';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';
import { logVisitStyles } from './Style';
import NotFound from '@components/NotFound';
import { PageHeader } from '@components/PageHeader';
import { ParticipantData } from '@app-types/participant';
import { AssessmentSurveyCardData } from '@app-types/participant';
import logger from '@utils/logger';
import { isWeb } from '@utils/platform';
import { useAuth, User } from '@contexts/AuthContext';
import { FILTER_KEYWORDS } from '@constants/LOG_VISIT_CARDS';
import { useOfflineSync } from '@contexts/OfflineSyncContext';

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
 * LogVisit Component
 * Component for logging and viewing participant visits/check-ins
 */
const LogVisit: React.FC = () => {
  const route = useRoute<LogVisitRouteProp>();
  const { isOffline } = useOfflineSync()
  const [loading, setLoading] = useState<boolean>(true);
  const [solutions, setSolutions] = useState<AssessmentSurveyCardData[]>([]);
  const [participant, setParticipant] = useState<ParticipantData | User | undefined>(undefined);
  const navigation = useNavigation();
  const { t } = useLanguage();
  const { setNavbarData, user } = useAuth();
  /**
   * Fetch targeted solutions from API
   */
  useEffect(() => {
    const fetchSolutions = async () => {
      try {
        const data = await getTargetedSolutions({
          authUserId: user?.id,
          type: 'observation',
          // @ts-ignore - filter[keywords] is a valid parameter
          "filter[keywords]": FILTER_KEYWORDS.LOG_VISIT.join(','),
          participantId:route.params?.id
        });
        setSolutions(data);
        if (route.params?.id) {
          const response = await getParticipantsList({ entityId: route.params?.id, userId: user?.id as string });
          const { userDetails, ...rest } = response?.result?.data?.[0]
          const participantData = { ...(userDetails || {}), ...rest }
          setParticipant(participantData as ParticipantData);
          setNavbarData({
            subtitle: participantData?.name,
          });
        }
      } catch (error) {
        logger.error('Error fetching solutions:', error);
        setSolutions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSolutions();

    return () => {
      setNavbarData(null);
    };
  }, [route.params?.id, setNavbarData]);

  /**
   * Handle Back Navigation
   * Goes back to the previous screen in the navigation stack
   * Falls back to navigating to participant-detail if goBack is not available
   */
  const handleBackPress = () => {
    if (navigation.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // Fallback: Navigate to participant detail if there's no previous screen
      // @ts-ignore
      navigation.navigate('participant-detail', { id: route.params?.id });
    }
  };


  if (loading) {
    return <Spinner height={isWeb ? ('$calc(100vh - 68px)' as any) : '$full'} size="large" color="$primary500" />;
  }
  
  // Error State: Missing participant ID or participant not found
  if (!participant) {
    return <NotFound message="participantDetail.notFound.title" />;
  }

  return (
    <Box flex={1} bg="$accent100">
      {/* Header */}
      <PageHeader
        title={t('participantDetail.header.logVisit')}
        subtitle={t('logVisit.selectVisitType', { name: participant?.name || '' })}
        onBackPress={handleBackPress}
        {...(!isOffline
        ? {
            rightSection: (
              <Button
                // @ts-ignore
                variant="outlineghost"
                onPress={() => {
                  const resolvedCoachId =
                    participant?.hierarchy?.[0] ||
                    participant?.extra?.hierarchy?.find(
                      (item: any) => item.level === 0,
                    )?.id;

                  // @ts-ignore
                  navigation.navigate('check-ins-list', {
                    id: route.params?.id,
                    coachId: resolvedCoachId,
                  });
                }}
              >
                <ButtonIcon as={LucideIcon} name="History" size={16} />
                <ButtonText {...TYPOGRAPHY.bodySmall}>
                  {t('logVisit.viewCheckIns')}
                </ButtonText>
              </Button>
            ),
          }
        : {})}
      />
      <Container>
        {/* Cards */}
        <VStack {...logVisitStyles.cardsContainer}>
          {!loading && solutions.length > 0 ? (
            solutions.map(card => (
              <AssessmentCard key={card.id} card={card} userId={participant?.id || ''} />
            ))
          ) : (
            !loading && (
              <Text color="$textMutedForeground" textAlign="center" py="$4">
                {t('logVisit.noSolutions')}
              </Text>
            )
          )}
        </VStack>
        <VStack {...logVisitStyles.noteContainer}>
          <HStack {...logVisitStyles.noteBox}>
            <Text {...TYPOGRAPHY.bodySmall} color="$textForeground" fontWeight="$medium">{t('logVisit.note')}
              <Text {...TYPOGRAPHY.bodySmall} color="$textMutedForeground" pl="$1">
                {t('logVisit.logVisitNote')}
              </Text>
            </Text>
          </HStack>
        </VStack>
      </Container>
    </Box>
  );
};

export default LogVisit;

