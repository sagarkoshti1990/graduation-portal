import React, { useMemo } from 'react';
import { Box, HStack, VStack, Text, LucideIcon } from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import {
  INDICATOR_CONFIG,
  PILLAR_LABELS,
  PILLAR_ORDER,
  READINESS_BAND_LABELS,
  STATUS_STYLES,
  type GraduationReadinessData,
  type PillarKey,
} from '../../utils/graduationTypes';

interface IndividualGraduationReadinessProps {
  data: GraduationReadinessData;
}

const SummaryTile: React.FC<{ label: string; count: number; colorKey: 'success' | 'warning' | 'error' | 'muted' }> = ({
  label,
  count,
  colorKey,
}) => {
  const palette: Record<string, { bg: string; text: string; border: string }> = {
    success: { bg: '$success50', text: '$success700', border: '$success200' },
    warning: { bg: '$warning50', text: '$warningIconColor', border: '$warning200' },
    error: { bg: '$error50', text: '$error700', border: '$error200' },
    muted: { bg: '$backgroundLight100', text: '$textMutedForeground', border: '$borderColor' },
  };
  const colors = palette[colorKey];
  return (
    <Box flex={1} minWidth={100} bg={colors.bg} borderWidth={1} borderColor={colors.border} borderRadius="$lg" p="$3" alignItems="center">
      <Text fontSize="$2xl" fontWeight="$bold" color={colors.text}>
        {count}
      </Text>
      <Text fontSize="$xs" color={colors.text} mt="$0.5">
        {label}
      </Text>
    </Box>
  );
};

const IndividualGraduationReadiness: React.FC<IndividualGraduationReadinessProps> = ({ data }) => {
  const { t } = useLanguage();
  const { summary, indicators } = data;

  const indicatorsByPillar = useMemo(() => {
    const grouped: Record<PillarKey, typeof indicators> = {
      livelihoods: [],
      financialInclusion: [],
      socialEmpowerment: [],
      gender: [],
    };
    indicators.forEach(indicator => {
      grouped[indicator.pillar]?.push(indicator);
    });
    return grouped;
  }, [indicators]);

  return (
    <VStack space="md" width="100%">
      <Box bg="$white" borderRadius="$xl" borderWidth={1} borderColor="$borderColor" p="$5">
        <HStack justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap="$2" mb="$4">
          <VStack>
            <Text fontSize="$lg" fontWeight="$semibold" color="$textForeground">
              {t('lc.dashboard.graduation.criteriaTitle')}
            </Text>
            <Text fontSize="$sm" color="$textMutedForeground" mt="$1">
              {t('lc.dashboard.graduation.criteriaSubtitle')}
            </Text>
          </VStack>
          <Box
            px="$3"
            py="$1.5"
            borderRadius="$full"
            bg={summary.readinessBand === 'ready_to_graduate' ? '$success50' : summary.readinessBand === 'near_ready' ? '$warning50' : '$error50'}
          >
            <Text
              fontSize="$xs"
              fontWeight="$bold"
              color={summary.readinessBand === 'ready_to_graduate' ? '$success700' : summary.readinessBand === 'near_ready' ? '$warningIconColor' : '$error700'}
            >
              {READINESS_BAND_LABELS[summary.readinessBand]}
            </Text>
          </Box>
        </HStack>

        <HStack space="sm" flexWrap="wrap">
          <SummaryTile label={t('lc.dashboard.graduation.achieved')} count={summary.achievedCount} colorKey="success" />
          <SummaryTile label={t('lc.dashboard.graduation.onTrack')} count={summary.onTrackCount} colorKey="warning" />
          <SummaryTile label={t('lc.dashboard.graduation.atRisk')} count={summary.atRiskCount} colorKey="error" />
          <SummaryTile label={t('lc.dashboard.graduation.notComputable')} count={summary.notComputableCount} colorKey="muted" />
        </HStack>

        {summary.gateStatus === 'not_met' && summary.gateBlockedBy.length > 0 ? (
          <Box bg="$error50" borderWidth={1} borderColor="$error200" borderRadius="$md" p="$3" mt="$4">
            <HStack space="xs" alignItems="center" mb="$1">
              <LucideIcon name="AlertTriangle" size={14} color="$error700" />
              <Text fontSize="$sm" fontWeight="$semibold" color="$error700">
                {t('lc.dashboard.graduation.gateNotMet')}
              </Text>
            </HStack>
            <Text fontSize="$xs" color="$error700">
              {summary.gateBlockedBy.map(key => INDICATOR_CONFIG[key]?.name || key).join(', ')}
            </Text>
          </Box>
        ) : null}
      </Box>

      {PILLAR_ORDER.map(pillar => {
        const pillarIndicators = indicatorsByPillar[pillar];
        if (pillarIndicators.length === 0) return null;
        const pillarSummary = summary.pillars[pillar];

        return (
          <Box key={pillar} bg="$white" borderRadius="$xl" borderWidth={1} borderColor="$borderColor" p="$4">
            <HStack justifyContent="space-between" alignItems="center" mb="$3" pb="$3" borderBottomWidth={1} borderColor="$borderLight100">
              <Text fontSize="$md" fontWeight="$semibold" color="$textForeground">
                {PILLAR_LABELS[pillar]}
              </Text>
              {pillarSummary ? (
                <Text fontSize="$xs" color="$textMutedForeground">
                  {t('lc.dashboard.graduation.pillarSummaryFormat', {
                    achieved: pillarSummary.achieved,
                    onTrack: pillarSummary.onTrack,
                    atRisk: pillarSummary.atRisk,
                  })}
                </Text>
              ) : null}
            </HStack>

            <VStack space="sm">
              {pillarIndicators.map(indicator => {
                const config = INDICATOR_CONFIG[indicator.key];
                const style = STATUS_STYLES[indicator.status];
                return (
                  <Box key={indicator.key} borderWidth={1} borderColor={style.border} borderRadius="$lg" p="$3">
                    <HStack space="sm" alignItems="flex-start">
                      <Box width={36} height={36} borderRadius="$md" bg={style.bg} justifyContent="center" alignItems="center">
                        <LucideIcon name={style.icon} size={18} color={style.text} />
                      </Box>
                      <VStack flex={1} space="xs">
                        <HStack justifyContent="space-between" alignItems="flex-start" gap="$2">
                          <Text fontSize="$sm" fontWeight="$semibold" color="$textForeground" flex={1}>
                            {config?.name || indicator.key}
                          </Text>
                          <Box px="$2" py="$0.5" borderRadius="$full" bg={style.bg}>
                            <Text fontSize={10} fontWeight="$bold" color={style.text}>
                              {style.label}
                            </Text>
                          </Box>
                        </HStack>
                        <Box bg={style.bg} borderRadius="$md" p="$2">
                          <Text fontSize="$xs" fontWeight="$semibold" color={style.text} mb="$0.5">
                            {t('lc.dashboard.graduation.toAchieve')}
                          </Text>
                          <Text fontSize="$xs" color={style.text}>
                            {indicator.achieveText}
                          </Text>
                        </Box>
                        {indicator.pathway !== 'both' ? (
                          <Box alignSelf="flex-start" px="$2" py="$0.5" borderWidth={1} borderColor="$borderColor" borderRadius="$full" bg="$backgroundLight50">
                            <Text fontSize={10} color="$textMutedForeground">
                              {t('lc.dashboard.graduation.pathwayOnly', { pathway: indicator.pathway })}
                            </Text>
                          </Box>
                        ) : null}
                      </VStack>
                    </HStack>
                  </Box>
                );
              })}
            </VStack>
          </Box>
        );
      })}
    </VStack>
  );
};

export default IndividualGraduationReadiness;
