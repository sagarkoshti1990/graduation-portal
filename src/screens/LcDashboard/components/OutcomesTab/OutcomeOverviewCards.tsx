import React from 'react';
import { Box, HStack, VStack, Text, LucideIcon } from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import {
  formatCurrency,
  formatPercentFromBaseline,
  type ParticipantOutcomesData,
} from '../../utils/outcomesTypes';

interface OutcomeOverviewCardsProps {
  data: ParticipantOutcomesData;
}

const PrimaryStatCard: React.FC<{
  icon: string;
  label: string;
  value: string;
  trend?: string | null;
}> = ({ icon, label, value, trend }) => {
  const isPositive = trend ? trend.startsWith('+') : undefined;
  return (
    <Box flex={1} minWidth={200} bg="$white" borderRadius="$xl" borderWidth={1} borderColor="$borderColor" p="$4">
      <HStack space="xs" alignItems="center" mb="$2">
        <LucideIcon name={icon} size={14} color="$textMutedForeground" />
        <Text fontSize="$xs" color="$textMutedForeground">
          {label}
        </Text>
      </HStack>
      <Text fontSize="$xl" fontWeight="$bold" color="$textForeground" mb="$1">
        {value}
      </Text>
      {trend ? (
        <HStack space="xs" alignItems="center">
          <LucideIcon name={isPositive ? 'TrendingUp' : 'TrendingDown'} size={12} color={isPositive ? '#059669' : '#DC2626'} />
          <Text fontSize="$xs" color={isPositive ? '#059669' : '#DC2626'}>
            {trend}
          </Text>
        </HStack>
      ) : null}
    </Box>
  );
};

const SecondaryStatCard: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <Box flex={1} minWidth={160} bg="$white" borderRadius="$xl" borderWidth={1} borderColor="$borderColor" p="$3">
    <Text fontSize="$xs" color="$textMutedForeground" mb="$1">
      {label}
    </Text>
    {value}
  </Box>
);

const OutcomeOverviewCards: React.FC<OutcomeOverviewCardsProps> = ({ data }) => {
  const { t } = useLanguage();
  const { metrics } = data;

  const igaActive = !!metrics.igaStatus?.value;
  const hasDebt = !!metrics.debtStatus?.value;

  return (
    <VStack space="md" width="100%">
      <HStack flexWrap="wrap" gap="$3">
        <PrimaryStatCard
          icon="DollarSign"
          label={t('lc.dashboard.outcomes.metrics.currentMonthlyIncome')}
          value={formatCurrency(metrics.currentMonthlyIncome?.value)}
          trend={formatPercentFromBaseline(metrics.currentMonthlyIncome?.percentFromBaseline) ?? null}
        />
        <PrimaryStatCard
          icon="CreditCard"
          label={t('lc.dashboard.outcomes.metrics.currentSavings')}
          value={formatCurrency(metrics.currentSavings?.value)}
          trend={formatPercentFromBaseline(metrics.currentSavings?.percentFromBaseline) ?? null}
        />
        <Box flex={1} minWidth={200} bg="$white" borderRadius="$xl" borderWidth={1} borderColor="$borderColor" p="$4">
          <HStack space="xs" alignItems="center" mb="$2">
            <LucideIcon name="Briefcase" size={14} color="$textMutedForeground" />
            <Text fontSize="$xs" color="$textMutedForeground">
              {t('lc.dashboard.outcomes.metrics.igaStatus')}
            </Text>
          </HStack>
          <HStack space="xs" alignItems="center">
            <LucideIcon name={igaActive ? 'CheckCircle2' : 'XCircle'} size={16} color={igaActive ? '#059669' : '#DC2626'} />
            <Text fontSize="$md" color="$textForeground">
              {metrics.igaStatus?.label ??
                (igaActive
                  ? t('lc.dashboard.outcomes.metrics.igaActive')
                  : t('lc.dashboard.outcomes.metrics.igaInactive'))}
            </Text>
          </HStack>
        </Box>
        <Box flex={1} minWidth={200} bg="$white" borderRadius="$xl" borderWidth={1} borderColor="$borderColor" p="$4">
          <HStack space="xs" alignItems="center" mb="$2">
            <LucideIcon name="Award" size={14} color="$textMutedForeground" />
            <Text fontSize="$xs" color="$textMutedForeground">
              {t('lc.dashboard.outcomes.metrics.selfEfficacyScore')}
            </Text>
          </HStack>
          <Text fontSize="$xl" fontWeight="$bold" color="$textForeground" mb="$1.5">
            {metrics.selfEfficacyScore?.scaledValue ?? '—'}/100
          </Text>
          <Box w="100%" h={6} bg="$backgroundLight100" borderRadius="$full" overflow="hidden">
            <Box
              h="100%"
              borderRadius="$full"
              bg="$primary500"
              width={`${Math.min(100, Math.max(0, metrics.selfEfficacyScore?.scaledValue ?? 0))}%`}
            />
          </Box>
        </Box>
      </HStack>

      <HStack flexWrap="wrap" gap="$3">
        <SecondaryStatCard
          label={t('lc.dashboard.outcomes.metrics.savingsFrequency')}
          value={
            <Text fontSize="$sm" color="$textForeground">
              {metrics.savingsFrequency?.label ?? '—'}
            </Text>
          }
        />
        <SecondaryStatCard
          label={t('lc.dashboard.outcomes.metrics.savingsLocation')}
          value={
            <Text fontSize="$sm" color="$textForeground">
              {metrics.savingsLocation?.label ?? '—'}
            </Text>
          }
        />
        <SecondaryStatCard
          label={t('lc.dashboard.outcomes.metrics.recordKeeping')}
          value={
            <Text fontSize="$sm" color="$textForeground">
              {metrics.recordKeeping?.label ?? '—'}
            </Text>
          }
        />
        <SecondaryStatCard
          label={t('lc.dashboard.outcomes.metrics.debtStatus')}
          value={
            <HStack space="xs" alignItems="center">
              <LucideIcon name={hasDebt ? 'AlertTriangle' : 'CheckCircle2'} size={14} color={hasDebt ? '#F59E0B' : '#059669'} />
              <Text fontSize="$sm" color="$textForeground">
                {hasDebt ? formatCurrency(metrics.debtStatus.value) : t('lc.dashboard.outcomes.metrics.noDebt')}
              </Text>
            </HStack>
          }
        />
      </HStack>
    </VStack>
  );
};

export default OutcomeOverviewCards;
