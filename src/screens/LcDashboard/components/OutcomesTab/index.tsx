import React, { useCallback, useEffect, useState } from 'react';
import { Box, VStack, Text, Pressable, LucideIcon } from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import logger from '@utils/logger';
import ParticipantPicker, { type PickedParticipant } from '../ParticipantPicker';
import OutcomeOverviewCards from './OutcomeOverviewCards';
import OutcomeTrends from './OutcomeTrends';
import IncomeSourcesBreakdown from './IncomeSourcesBreakdown';
import { fetchParticipantOutcomes } from '../../../../services/bracReporting/bracReportingService';
import type { ParticipantOutcomesResponse } from '../../utils/outcomesTypes';

const OutcomesTab: React.FC = () => {
  const { t } = useLanguage();
  const [participant, setParticipant] = useState<PickedParticipant | null>(null);
  const [response, setResponse] = useState<ParticipantOutcomesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  const loadOutcomes = useCallback(
    async (participantId: string) => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchParticipantOutcomes(participantId);
        setResponse(result);
      } catch (err: any) {
        logger.error('Failed to fetch participant outcomes', err);
        setError(err?.message || t('lc.dashboard.outcomes.fetchError'));
        setResponse(null);
      } finally {
        setLoading(false);
      }
    },
    [t],
  );

  useEffect(() => {
    if (participant) {
      setShowRaw(false);
      loadOutcomes(participant.userId);
    }
  }, [participant, loadOutcomes]);

  const data = response?.data;

  return (
    <VStack space="lg" width="100%">
      <Box bg="$white" borderRadius="$xl" borderWidth={1} borderColor="$borderColor" p="$4">
        <Text fontSize="$md" fontWeight="$semibold" color="$textForeground" mb="$1">
          {t('lc.dashboard.outcomes.title')}
        </Text>
        <Text fontSize="$sm" color="$textMutedForeground" mb="$3">
          {t('lc.dashboard.outcomes.description')}
        </Text>
        <ParticipantPicker value={participant} onSelect={setParticipant} />
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
          <LucideIcon name="UserCheck" size={28} color="#94A3B8" />
          <Text fontSize="$sm" color="$textMutedForeground" mt="$2">
            {t('lc.dashboard.outcomes.emptyState')}
          </Text>
        </Box>
      ) : loading ? (
        <Box p="$8" bg="$white" borderRadius="$xl" borderWidth={1} borderColor="$borderColor" alignItems="center">
          <Text fontSize="$sm" color="$textMutedForeground">
            {t('common.loading')}
          </Text>
        </Box>
      ) : error ? (
        <Box bg="$error50" borderRadius="$md" p="$3">
          <Text fontSize="$sm" color="$error700">
            {error}
          </Text>
        </Box>
      ) : data ? (
        <>
          <OutcomeOverviewCards data={data} />

          <OutcomeTrends data={data} />

          <IncomeSourcesBreakdown sources={data.incomeSourcesBreakdown} />

          <Pressable onPress={() => setShowRaw(prev => !prev)}>
            <Text fontSize="$xs" color="$primary600">
              {showRaw ? t('lc.dashboard.outcomes.hideRawData') : t('lc.dashboard.outcomes.showRawData')}
            </Text>
          </Pressable>

          {showRaw ? (
            <Box bg="$white" borderRadius="$xl" borderWidth={1} borderColor="$borderColor" p="$4">
              <Text fontSize="$xs" fontFamily="monospace" color="$textForeground" selectable>
                {JSON.stringify(response, null, 2)}
              </Text>
            </Box>
          ) : null}
        </>
      ) : null}
    </VStack>
  );
};

export default OutcomesTab;
