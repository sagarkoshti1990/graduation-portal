import React from 'react';
import { Box, HStack, Text } from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import { displayMetric } from '../../utils/reportingMetrics';
import type { GraduationOverviewData } from '../../utils/graduationTypes';

interface GraduationReadinessCardsProps {
  data: GraduationOverviewData;
}

const StatCard: React.FC<{
  label: string;
  value: string | number;
  accentColor?: string;
}> = ({ label, value, accentColor }) => (
  <Box
    flex={1}
    minWidth={200}
    bg="$white"
    borderRadius="$xl"
    borderWidth={1}
    borderColor="$borderColor"
    borderLeftWidth={accentColor ? 4 : 1}
    borderLeftColor={accentColor || '$borderColor'}
    p="$4"
  >
    <Text
      fontSize={10}
      fontWeight="$bold"
      color={accentColor || '$textMutedForeground'}
      textTransform="uppercase"
      letterSpacing={1.2}
      mb="$2"
    >
      {label}
    </Text>
    <Text fontSize="$2xl" fontWeight="$bold" color={accentColor || '$textForeground'}>
      {value}
    </Text>
  </Box>
);

const GraduationReadinessCards: React.FC<GraduationReadinessCardsProps> = ({ data }) => {
  const { t } = useLanguage();

  return (
    <HStack flexWrap="wrap" gap="$4">
      <StatCard
        label={t('lc.dashboard.graduation.coachWorkload')}
        value={displayMetric(data.coachWorkload ?? data.totalParticipants)}
      />
      <StatCard
        label={t('lc.dashboard.graduation.readyToGraduate')}
        value={displayMetric(data.readiness?.readyToGraduateCount)}
        accentColor="#8A2542"
      />
      <StatCard
        label={t('lc.dashboard.graduation.nearReady')}
        value={displayMetric(data.readiness?.nearReadyCount)}
        accentColor="#F59E0B"
      />
      <StatCard
        label={t('lc.dashboard.graduation.notReady')}
        value={displayMetric(data.readiness?.notReadyCount)}
        accentColor="#EF4444"
      />
    </HStack>
  );
};

export default GraduationReadinessCards;
