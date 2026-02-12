import React, { useEffect, useState } from 'react';
import { VStack, Box, ScrollView, Text, Spinner } from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import { assessmentSurveysStyles } from './Styles';
import { AssessmentCard } from '@components/ObservationCards';
import type {
  AssessmentSurveyCardData,
  ParticipantData,
} from '@app-types/participant';
import { getObservationEntities, getTargetedSolutions } from '../../../services/solutionService';
import { FILTER_KEYWORDS } from '@constants/LOG_VISIT_CARDS';
import logger from '@utils/logger';
import { isWeb } from '@utils/platform';
import { ENTITY_TYPE } from '@constants/ROLES';
import { STATUS } from '@constants/app.constant';

interface AssessmentSurveysProps {
  participant: ParticipantData;
}

/**
 * AssessmentSurveys Component
 * Displays assessment survey cards based on participant status
 */
const AssessmentSurveys: React.FC<AssessmentSurveysProps> = ({
  participant,
}) => {
  const { t } = useLanguage();
  const [solutions, setSolutions] = useState<AssessmentSurveyCardData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchSolutions = async () => {
      try {
        const data = await getTargetedSolutions({
          type: 'observation',
          'filter[keywords]': participant?.status === STATUS.COMPLETED ? FILTER_KEYWORDS.PROGRAM_COMPLETED.join(',') : FILTER_KEYWORDS.ASSESSMENT_SURVEYS.join(','),
        });
        const dataNew = await Promise.all(
          data.map(async (item) => {
            try {
              const entity = await getdetails({
                solutionId: item.solutionId,
                id: participant?.id,
              });
              return { ...item, entity };
            } catch (error) {
              logger.error('Failed to fetch entity for solutionId:', item.solutionId, error);
              // Skip this item by returning null
              return null;
            }
          })
        );
        // Filter out failed items (nulls)
        const filteredData = dataNew.filter(item => item !== null);
        setSolutions(filteredData);
      } catch (error) {
        logger.error('Error fetching solutions:', error);
        setSolutions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSolutions();
  }, [participant?.id]);

  const getdetails = async ({solutionId,id}:{solutionId:string,id:string}) => {
    const observationData = await getObservationEntities({
      solutionId,
      profileData: {},
    });
    if (
      observationData.result?.entityType === ENTITY_TYPE.PARTICIPANT &&
      Array.isArray(observationData.result?.entities)
    ) {
      const newData = observationData.result.entities.find(
        (entity: any) => entity.externalId == id,
      );
      if (newData) {
        return newData;
      }
    }
    return {};
  };

  if (loading) {
    return <Spinner height={isWeb ? '$calc(100vh - 68px)' : '$full'} size="large" color="$primary500" />;
  }

  return (
    <ScrollView
      {...assessmentSurveysStyles.scrollView}
      showsVerticalScrollIndicator={false}
    >
      <VStack {...assessmentSurveysStyles.cardsContainer} gap="$5" mt="$2">
        {solutions.length > 0 ? (
          solutions.map(card => (
            <AssessmentCard
              key={card.id}
              card={card}
              userId={participant?.userId || ''}
            />
          ))
        ) : (
          <Box {...assessmentSurveysStyles.container}>
            <VStack {...assessmentSurveysStyles.content}>
              <Box {...assessmentSurveysStyles.emptyIconContainer}>
                {/* You can add an icon here if needed */}
              </Box>
                <Text {...assessmentSurveysStyles.emptyTitle}>
                  {t('participantDetail.assessmentSurveys.noSurveysTitle')}
                </Text>
                <Text {...assessmentSurveysStyles.emptyDescription}>
                  {t(
                    'participantDetail.assessmentSurveys.noSurveysDescription',
                  )}
                </Text>
              </VStack>
          </Box>
        )}
      </VStack>
    </ScrollView>
  );
};

export default AssessmentSurveys;
