import React from 'react';
import { Box, HStack, VStack, Text, LucideIcon } from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import { displayMetric, type LcDashboardMetrics } from '../../utils/reportingMetrics';

interface OverviewCardsProps {
  metrics: LcDashboardMetrics;
}

interface OverviewCardConfig {
  key: string;
  labelKey: string;
  value: string | number;
  icon: string;
  iconColor: string;
}

const OverviewStatCard: React.FC<{ card: OverviewCardConfig }> = ({ card }) => {
  const { t } = useLanguage();

  return (
    <Box flex={1} minWidth={200} bg="$white" borderRadius="$xl" borderWidth={1} borderColor="$borderColor" p="$4">
      <HStack space="md" alignItems="center">
        <Box
          width={48}
          height={48}
          borderRadius="$lg"
          bg={`${card.iconColor}20`}
          justifyContent="center"
          alignItems="center"
        >
          <LucideIcon name={card.icon} size={24} color={card.iconColor} />
        </Box>
        <VStack flex={1} space="xs">
          <Text fontSize="$sm" color="$textMutedForeground">
            {t(card.labelKey)}
          </Text>
          <Text fontSize="$2xl" fontWeight="$bold" color="$textForeground">
            {card.value}
          </Text>
        </VStack>
      </HStack>
    </Box>
  );
};

const OverviewCards: React.FC<OverviewCardsProps> = ({ metrics }) => {
  const cards: OverviewCardConfig[] = [
    {
      key: 'totalCaseload',
      labelKey: 'lc.dashboard.totalCaseload',
      value: displayMetric(metrics.totalCaseload),
      icon: 'Users',
      iconColor: '#8A2542',
    },
    {
      key: 'activeParticipants',
      labelKey: 'lc.dashboard.activeParticipants',
      value: displayMetric(metrics.activeParticipants),
      icon: 'Activity',
      iconColor: '#2563EB',
    },
    {
      key: 'graduated',
      labelKey: 'lc.dashboard.graduated',
      value: displayMetric(metrics.graduated),
      icon: 'GraduationCap',
      iconColor: '#059669',
    },
    {
      key: 'averageProgress',
      labelKey: 'lc.dashboard.averageProgress',
      value: displayMetric(metrics.averageProgress),
      icon: 'Clock',
      iconColor: '#D97706',
    },
  ];

  return (
    <HStack flexWrap="wrap" gap="$4">
      {cards.map(card => (
        <OverviewStatCard key={card.key} card={card} />
      ))}
    </HStack>
  );
};

export default OverviewCards;
