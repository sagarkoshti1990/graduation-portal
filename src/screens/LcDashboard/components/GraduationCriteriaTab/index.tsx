import React, { useCallback, useEffect, useState } from 'react';
import { Box, VStack, HStack, Text, LucideIcon } from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import { useAuth } from '@contexts/AuthContext';
import logger from '@utils/logger';
import ParticipantPicker, { type PickedParticipant } from '../ParticipantPicker';
import GraduationReadinessCards from '../GraduationReadinessCards';
import GraduationRateSummary from './GraduationRateSummary';
import IndicatorDistributionGrid from './IndicatorDistributionGrid';
import IndividualGraduationReadiness from './IndividualGraduationReadiness';
import {
  fetchGraduationOverview,
  fetchGraduationReadiness,
} from '../../../../services/bracReporting/bracReportingService';
import type { GraduationOverviewResponse, GraduationReadinessResponse } from '../../utils/graduationTypes';

const GraduationCriteriaTab: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const coachId = user?.id;

  const [overview, setOverview] = useState<GraduationOverviewResponse | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  const [participant, setParticipant] = useState<PickedParticipant | null>(null);
  const [readiness, setReadiness] = useState<GraduationReadinessResponse | null>(null);
  const [readinessLoading, setReadinessLoading] = useState(false);
  const [readinessError, setReadinessError] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    if (!coachId) {
      setOverviewError(t('lc.dashboard.missingCoachId'));
      return;
    }
    setOverviewLoading(true);
    setOverviewError(null);
    try {
      const result = await fetchGraduationOverview(coachId);
      setOverview(result);
    } catch (err: any) {
      logger.error('Failed to fetch graduation overview', err);
      setOverviewError(err?.message || t('lc.dashboard.graduation.fetchOverviewError'));
    } finally {
      setOverviewLoading(false);
    }
  }, [coachId, t]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const loadReadiness = useCallback(
    async (participantId: string) => {
      setReadinessLoading(true);
      setReadinessError(null);
      try {
        const result = await fetchGraduationReadiness(participantId);
        setReadiness(result);
      } catch (err: any) {
        logger.error('Failed to fetch graduation readiness', err);
        setReadinessError(err?.message || t('lc.dashboard.graduation.fetchReadinessError'));
        setReadiness(null);
      } finally {
        setReadinessLoading(false);
      }
    },
    [t],
  );

  useEffect(() => {
    if (participant) {
      loadReadiness(participant.userId);
    }
  }, [participant, loadReadiness]);

  const data = overview?.data;

  return (
    <VStack space="lg" width="100%">
      {overviewLoading && !data ? (
        <Text fontSize="$sm" color="$textMutedForeground">
          {t('common.loading')}
        </Text>
      ) : overviewError ? (
        <Box bg="$error50" borderRadius="$md" p="$3">
          <Text fontSize="$sm" color="$error700">
            {overviewError}
          </Text>
        </Box>
      ) : data ? (
        <>
          <GraduationReadinessCards data={data} />
          <GraduationRateSummary data={data} />
          <IndicatorDistributionGrid distribution={data.indicatorDistribution} />
        </>
      ) : null}

      <Box borderTopWidth={1} borderColor="$borderLight200" pt="$2" />

      <VStack space="md" width="100%">
        <Text fontSize="$md" fontWeight="$semibold" color="$textForeground">
          {t('lc.dashboard.graduation.individualReadiness')}
        </Text>

        <Box bg="$white" borderRadius="$lg" borderWidth={1} borderColor="$borderColor" p="$3">
          <HStack space="sm" alignItems="center" flexWrap="wrap">
            <ParticipantPicker value={participant} onSelect={setParticipant} />
          </HStack>
        </Box>

        {!participant ? (
          <Box
            p="$8"
            bg="$white"
            borderRadius="$xl"
            borderWidth={1}
            borderColor="$borderColor"
            alignItems="center"
            justifyContent="center"
            minHeight={160}
          >
            <LucideIcon name="ListChecks" size={28} color="#94A3B8" />
            <Text fontSize="$sm" color="$textMutedForeground" mt="$2">
              {t('lc.dashboard.graduation.emptyState')}
            </Text>
          </Box>
        ) : readinessLoading ? (
          <Box p="$8" bg="$white" borderRadius="$xl" borderWidth={1} borderColor="$borderColor" alignItems="center">
            <Text fontSize="$sm" color="$textMutedForeground">
              {t('common.loading')}
            </Text>
          </Box>
        ) : readinessError ? (
          <Box bg="$error50" borderRadius="$md" p="$3">
            <Text fontSize="$sm" color="$error700">
              {readinessError}
            </Text>
          </Box>
        ) : readiness?.data ? (
          <IndividualGraduationReadiness data={readiness.data} />
        ) : null}
      </VStack>
    </VStack>
  );
};

export default GraduationCriteriaTab;
