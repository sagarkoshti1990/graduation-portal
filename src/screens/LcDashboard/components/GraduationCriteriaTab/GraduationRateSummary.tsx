import React from 'react';
import { Box, HStack, VStack, Text, LucideIcon } from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import type { GraduationOverviewData } from '../../utils/graduationTypes';

interface GraduationRateSummaryProps {
  data: GraduationOverviewData;
}

const EXIT_CATEGORY_COLORS: Record<string, string> = {
  graduated: '#059669',
  completed_below_threshold: '#F59E0B',
  dropped_off: '#DC2626',
};

const GraduationRateSummary: React.FC<GraduationRateSummaryProps> = ({ data }) => {
  const { t } = useLanguage();
  const { graduated, completed_below_threshold: belowThreshold, dropped_off: droppedOff } = data.exitDistribution;
  const totalExits = graduated + belowThreshold + droppedOff;

  const exitRows = [
    { key: 'graduated', label: t('lc.dashboard.graduation.exitGraduated'), value: graduated },
    { key: 'completed_below_threshold', label: t('lc.dashboard.graduation.exitBelowThreshold'), value: belowThreshold },
    { key: 'dropped_off', label: t('lc.dashboard.graduation.exitDroppedOff'), value: droppedOff },
  ];

  return (
    <VStack space="md" width="100%">
      <Box bg="$white" borderRadius="$xl" borderWidth={1} borderColor="$borderColor" p="$4">
        <HStack space="xs" alignItems="center" mb="$2">
          <LucideIcon name="Info" size={14} color="$textMutedForeground" />
          <Text fontSize="$sm" fontWeight="$semibold" color="$textForeground">
            {t('lc.dashboard.graduation.overallRate')}
          </Text>
        </HStack>
        <HStack alignItems="baseline" space="sm" flexWrap="wrap">
          <Text fontSize="$3xl" fontWeight="$bold" color="$textForeground">
            {data.graduationRate !== null ? `${data.graduationRate}%` : '—'}
          </Text>
          <Text fontSize="$sm" color="$textMutedForeground">
            {t('lc.dashboard.graduation.overallRateSubtitle', {
              graduated,
              totalExits,
            })}
          </Text>
        </HStack>
      </Box>

      <HStack flexWrap="wrap" gap="$3">
        <Box flex={1} minWidth={320} bg="$white" borderRadius="$xl" borderWidth={1} borderColor="$borderColor" p="$4">
          <Text fontSize="$md" fontWeight="$semibold" color="$textForeground" mb="$1">
            {t('lc.dashboard.graduation.exitDistribution')}
          </Text>
          <Text fontSize="$xs" color="$textMutedForeground" mb="$3">
            {t('lc.dashboard.graduation.exitDistributionSubtitle')}
          </Text>
          <VStack space="sm">
            {exitRows.map(row => {
              const pct = totalExits > 0 ? Math.round((row.value / totalExits) * 100) : 0;
              return (
                <VStack key={row.key} space="xs">
                  <HStack justifyContent="space-between">
                    <HStack space="xs" alignItems="center">
                      <Box width={8} height={8} borderRadius="$full" bg={EXIT_CATEGORY_COLORS[row.key]} />
                      <Text fontSize="$xs" color="$textForeground">
                        {row.label}
                      </Text>
                    </HStack>
                    <Text fontSize="$xs" color="$textMutedForeground">
                      {`${pct}% (${row.value})`}
                    </Text>
                  </HStack>
                  <Box w="100%" h={6} bg="$backgroundLight100" borderRadius="$full" overflow="hidden">
                    <Box h="100%" borderRadius="$full" bg={EXIT_CATEGORY_COLORS[row.key]} width={`${pct}%`} />
                  </Box>
                </VStack>
              );
            })}
          </VStack>
          <HStack justifyContent="space-between" mt="$3" pt="$3" borderTopWidth={1} borderColor="$borderLight100">
            <Text fontSize="$xs" color="$textMutedForeground">
              {t('lc.dashboard.graduation.totalExits')}
            </Text>
            <Text fontSize="$sm" fontWeight="$bold" color="$textForeground">
              {totalExits}
            </Text>
          </HStack>
        </Box>

        <Box flex={1} minWidth={320} bg="$white" borderRadius="$xl" borderWidth={1} borderColor="$borderColor" p="$4">
          <Text fontSize="$md" fontWeight="$semibold" color="$textForeground" mb="$1">
            {t('lc.dashboard.graduation.timeline')}
          </Text>
          <Text fontSize="$xs" color="$textMutedForeground" mb="$3">
            {t('lc.dashboard.graduation.timelineSubtitle')}
          </Text>
          {data.graduationTimeline.length === 0 ? (
            <VStack alignItems="center" justifyContent="center" minHeight={140} space="xs">
              <LucideIcon name="Clock" size={24} color="#94A3B8" />
              <Text fontSize="$sm" color="$textMutedForeground">
                {t('lc.dashboard.graduation.noTimelineData')}
              </Text>
            </VStack>
          ) : (
            <Text fontSize="$xs" color="$textMutedForeground">
              {t('lc.dashboard.graduation.timelineNotRendered')}
            </Text>
          )}
        </Box>
      </HStack>
    </VStack>
  );
};

export default GraduationRateSummary;
