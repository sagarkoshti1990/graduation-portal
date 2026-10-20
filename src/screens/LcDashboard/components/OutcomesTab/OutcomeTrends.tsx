import React from 'react';
import { Box, HStack, VStack, Text, LucideIcon } from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import SimpleLineChart from '@components/charts/SimpleLineChart';
import {
  formatTrendPointLabel,
  sortTrendPoints,
  type ParticipantOutcomesData,
  type TrendPoint,
} from '../../utils/outcomesTypes';

interface OutcomeTrendsProps {
  data: ParticipantOutcomesData;
}

const TrendCard: React.FC<{ title: string; subtitle: string; points: TrendPoint[]; color: string; valueLabel: string }> = ({
  title,
  subtitle,
  points,
  color,
  valueLabel,
}) => {
  const { t } = useLanguage();
  const sorted = sortTrendPoints(points);
  const chartData = sorted.map(point => ({ month: formatTrendPointLabel(point), value: point.value }));

  return (
    <Box flex={1} minWidth={320} bg="$white" borderRadius="$xl" borderWidth={1} borderColor="$borderColor" p="$4">
      <Text fontSize="$md" fontWeight="$semibold" color="$textForeground" mb="$1">
        {title}
      </Text>
      <Text fontSize="$xs" color="$textMutedForeground" mb="$2">
        {subtitle}
      </Text>
      {chartData.length < 2 ? (
        <Text fontSize="$sm" color="$textMutedForeground">
          {t('lc.dashboard.outcomes.notEnoughTrendData')}
        </Text>
      ) : (
        <SimpleLineChart data={chartData} height={220} color={color} valueLabel={valueLabel} showGrid />
      )}
    </Box>
  );
};

const OutcomeTrends: React.FC<OutcomeTrendsProps> = ({ data }) => {
  const { t } = useLanguage();
  const { selfEfficacyProgress, agencyAndControl } = data;

  const efficacyPoints: TrendPoint[] = (
    [
      selfEfficacyProgress.baseline !== null
        ? { periodType: 'baseline', periodValue: null, visitDate: '1970-01-01', value: selfEfficacyProgress.baseline }
        : null,
      selfEfficacyProgress.midline !== null
        ? { periodType: 'midline', periodValue: null, visitDate: '1970-06-01', value: selfEfficacyProgress.midline }
        : null,
      selfEfficacyProgress.current !== null
        ? { periodType: 'current', periodValue: null, visitDate: '1970-12-01', value: selfEfficacyProgress.current }
        : null,
    ] as (TrendPoint | null)[]
  ).filter((p): p is TrendPoint => p !== null);

  const feelsInControl = (agencyAndControl?.scaledValue ?? 0) >= 50;

  return (
    <VStack space="md" width="100%">
      <HStack flexWrap="wrap" gap="$3">
        <TrendCard
          title={t('lc.dashboard.outcomes.incomeTrend')}
          subtitle={t('lc.dashboard.outcomes.incomeTrendSubtitle')}
          points={data.trends.income}
          color="#3B82F6"
          valueLabel={t('lc.dashboard.outcomes.metrics.currentMonthlyIncome')}
        />
        <TrendCard
          title={t('lc.dashboard.outcomes.savingsTrend')}
          subtitle={t('lc.dashboard.outcomes.savingsTrendSubtitle')}
          points={data.trends.savings}
          color="#0891B2"
          valueLabel={t('lc.dashboard.outcomes.metrics.currentSavings')}
        />
      </HStack>

      <HStack flexWrap="wrap" gap="$3">
        <Box flex={1} minWidth={320} bg="$white" borderRadius="$xl" borderWidth={1} borderColor="$borderColor" p="$4">
          <Text fontSize="$md" fontWeight="$semibold" color="$textForeground" mb="$1">
            {t('lc.dashboard.outcomes.selfEfficacyProgress')}
          </Text>
          <Text fontSize="$xs" color="$textMutedForeground" mb="$2">
            {t('lc.dashboard.outcomes.selfEfficacyProgressSubtitle')}
          </Text>
          {efficacyPoints.length < 2 ? (
            <Text fontSize="$sm" color="$textMutedForeground">
              {t('lc.dashboard.outcomes.notEnoughTrendData')}
            </Text>
          ) : (
            <SimpleLineChart
              data={efficacyPoints.map(p => ({ month: p.periodType, value: p.value }))}
              height={220}
              color="#8B5CF6"
              valueLabel={t('lc.dashboard.outcomes.metrics.selfEfficacyScore')}
              yMin={0}
              yMax={100}
              showGrid
            />
          )}
        </Box>

        <Box flex={1} minWidth={320} bg="$white" borderRadius="$xl" borderWidth={1} borderColor="$borderColor" p="$4">
          <Text fontSize="$md" fontWeight="$semibold" color="$textForeground" mb="$1">
            {t('lc.dashboard.outcomes.agencyAndControl')}
          </Text>
          <Text fontSize="$xs" color="$textMutedForeground" mb="$2">
            {t('lc.dashboard.outcomes.agencyAndControlSubtitle')}
          </Text>
          <VStack alignItems="center" justifyContent="center" minHeight={160} space="xs">
            <LucideIcon
              name={feelsInControl ? 'ShieldCheck' : 'AlertCircle'}
              size={40}
              color={feelsInControl ? '#059669' : '#F59E0B'}
            />
            <Text fontSize="$sm" color="$textForeground">
              {feelsInControl
                ? t('lc.dashboard.outcomes.feelsInControl')
                : t('lc.dashboard.outcomes.buildingControl')}
            </Text>
          </VStack>
        </Box>
      </HStack>
    </VStack>
  );
};

export default OutcomeTrends;
