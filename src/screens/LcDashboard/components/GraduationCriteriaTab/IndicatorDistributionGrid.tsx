import React, { useMemo, useState } from 'react';
import { Box, HStack, VStack, Text, Pressable, LucideIcon } from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import {
  INDICATOR_CONFIG,
  PILLAR_LABELS,
  PILLAR_ORDER,
  sumBreakdown,
  type IndicatorCountBreakdown,
  type PillarKey,
} from '../../utils/graduationTypes';

interface IndicatorDistributionGridProps {
  distribution: Record<string, IndicatorCountBreakdown>;
}

const SEGMENTS: { key: keyof IndicatorCountBreakdown; color: string; labelKey: string }[] = [
  { key: 'achieved', color: '#22C55E', labelKey: 'lc.dashboard.graduation.achieved' },
  { key: 'onTrack', color: '#FACC15', labelKey: 'lc.dashboard.graduation.onTrack' },
  { key: 'atRisk', color: '#EF4444', labelKey: 'lc.dashboard.graduation.atRisk' },
  { key: 'notComputable', color: '#94A3B8', labelKey: 'lc.dashboard.graduation.notComputable' },
];

const IndicatorCard: React.FC<{ indicatorKey: string; breakdown: IndicatorCountBreakdown }> = ({
  indicatorKey,
  breakdown,
}) => {
  const { t } = useLanguage();
  const config = INDICATOR_CONFIG[indicatorKey];
  const total = sumBreakdown(breakdown);

  return (
    <Box flex={1} minWidth={320} bg="$white" borderRadius="$xl" borderWidth={1} borderColor="$borderColor" p="$4">
      <HStack space="sm" alignItems="center" mb="$3">
        <Box width={36} height={36} borderRadius="$md" bg="$primary100" justifyContent="center" alignItems="center">
          <LucideIcon name={config?.icon || 'HelpCircle'} size={18} color="$primary500" />
        </Box>
        <VStack flex={1}>
          <Text fontSize="$sm" fontWeight="$semibold" color="$textForeground" numberOfLines={1}>
            {config?.name || indicatorKey}
          </Text>
          <Text fontSize="$xs" color="$textMutedForeground">
            {PILLAR_LABELS[config?.pillar]}
          </Text>
        </VStack>
      </HStack>

      <VStack space="sm">
        {SEGMENTS.map(segment => {
          const count = breakdown[segment.key];
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <VStack key={segment.key} space="xs">
              <HStack justifyContent="space-between">
                <Text fontSize="$xs" color="$textMutedForeground">
                  {t(segment.labelKey)}
                </Text>
                <Text fontSize="$xs" fontWeight="$semibold" color="$textForeground">
                  {`${count} (${pct}%)`}
                </Text>
              </HStack>
              <Box w="100%" h={6} bg="$backgroundLight100" borderRadius="$full" overflow="hidden">
                <Box h="100%" borderRadius="$full" bg={segment.color} width={`${pct}%`} />
              </Box>
            </VStack>
          );
        })}
      </VStack>
    </Box>
  );
};

const IndicatorDistributionGrid: React.FC<IndicatorDistributionGridProps> = ({ distribution }) => {
  const { t } = useLanguage();
  const [pillarFilter, setPillarFilter] = useState<PillarKey | 'all'>('all');

  const keys = useMemo(
    () =>
      Object.keys(distribution).filter(
        key => pillarFilter === 'all' || INDICATOR_CONFIG[key]?.pillar === pillarFilter,
      ),
    [distribution, pillarFilter],
  );

  return (
    <Box bg="$white" borderRadius="$xl" borderWidth={1} borderColor="$borderColor" p="$4">
      <HStack justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="$2" mb="$3">
        <VStack>
          <Text fontSize="$md" fontWeight="$semibold" color="$textForeground">
            {t('lc.dashboard.graduation.indicatorsTitle')}
          </Text>
          <Text fontSize="$xs" color="$textMutedForeground">
            {t('lc.dashboard.graduation.indicatorsSubtitle')}
          </Text>
        </VStack>
        <HStack space="xs" flexWrap="wrap">
          <Pressable onPress={() => setPillarFilter('all')}>
            <Box px="$2.5" py="$1" borderRadius="$full" bg={pillarFilter === 'all' ? '$primary500' : '$backgroundLight100'}>
              <Text fontSize="$xs" color={pillarFilter === 'all' ? '$white' : '$textMutedForeground'}>
                {t('lc.dashboard.graduation.allPillars')}
              </Text>
            </Box>
          </Pressable>
          {PILLAR_ORDER.map(pillar => (
            <Pressable key={pillar} onPress={() => setPillarFilter(pillar)}>
              <Box px="$2.5" py="$1" borderRadius="$full" bg={pillarFilter === pillar ? '$primary500' : '$backgroundLight100'}>
                <Text fontSize="$xs" color={pillarFilter === pillar ? '$white' : '$textMutedForeground'}>
                  {PILLAR_LABELS[pillar]}
                </Text>
              </Box>
            </Pressable>
          ))}
        </HStack>
      </HStack>

      <HStack flexWrap="wrap" gap="$3">
        {keys.map(key => (
          <IndicatorCard key={key} indicatorKey={key} breakdown={distribution[key]} />
        ))}
      </HStack>
    </Box>
  );
};

export default IndicatorDistributionGrid;
