import React from 'react';
import { Box, HStack, VStack, Text, LucideIcon } from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import { pickBreakdownValue, type LcDashboardOverviewData } from '../../utils/reportingMetrics';

interface PerformanceActivityReportProps {
  data?: LcDashboardOverviewData;
}

interface ReportBox {
  key: string;
  icon: string;
  iconColor: string;
  labelKey: string;
  subtitleKey: string;
  value?: number | string;
  comingSoon?: boolean;
}

const formatCurrency = (value: number): string => `R${value.toLocaleString('en-US')}`;

const ReportStatBox: React.FC<{ box: ReportBox }> = ({ box }) => {
  const { t } = useLanguage();

  return (
    <Box
      flex={1}
      minWidth={200}
      bg="$white"
      borderRadius="$lg"
      borderWidth={1}
      borderColor="$borderColor"
      p="$3"
    >
      <HStack alignItems="center" gap="$2" mb="$2">
        <LucideIcon name={box.icon} size={16} color={box.iconColor} />
        <Text fontSize="$xs" color="$textMutedForeground">
          {t(box.labelKey)}
        </Text>
      </HStack>
      {box.comingSoon ? (
        <Text fontSize="$sm" fontWeight="$bold" color="$textMutedForeground" fontStyle="italic">
          {t('lc.dashboard.comingSoon')}
        </Text>
      ) : (
        <Text fontSize="$xl" fontWeight="$bold" color="$textForeground">
          {box.value ?? '—'}
        </Text>
      )}
      <Text fontSize={10} color="$textMutedForeground" mt="$1">
        {t(box.subtitleKey)}
      </Text>
    </Box>
  );
};

const PerformanceActivityReport: React.FC<PerformanceActivityReportProps> = ({ data }) => {
  const { t } = useLanguage();

  const onboarded = pickBreakdownValue(data?.lifecycleStatusBreakdown, ['onboarded', 'Onboarded']);
  const idpsDeveloped = pickBreakdownValue(data?.lifecycleStatusBreakdown, [
    'in_progress',
    'inProgress',
    'inprogress',
  ]);

  const boxes: ReportBox[] = [
    {
      key: 'onboarded',
      icon: 'UserPlus',
      iconColor: '#059669',
      labelKey: 'lc.dashboard.participantsOnboarded',
      subtitleKey: 'lc.dashboard.participantsOnboardedSubtitle',
      value: onboarded,
    },
    {
      key: 'idps',
      icon: 'FileText',
      iconColor: '#2563EB',
      labelKey: 'lc.dashboard.idpsDeveloped',
      subtitleKey: 'lc.dashboard.idpsDevelopedSubtitle',
      value: idpsDeveloped,
    },
    {
      key: 'individualCheckins',
      icon: 'UserCheck',
      iconColor: '#7C3AED',
      labelKey: 'lc.dashboard.individualCheckins',
      subtitleKey: 'lc.dashboard.individualCheckinsSubtitle',
      value: data?.formSubmissions?.totalIndividualVisits,
    },
    {
      key: 'groupCheckins',
      icon: 'Users',
      iconColor: '#DB2777',
      labelKey: 'lc.dashboard.groupCheckins',
      subtitleKey: 'lc.dashboard.groupCheckinsSubtitle',
      value: data?.groupCheckinCount,
    },
    {
      key: 'midlineSurveys',
      icon: 'Calendar',
      iconColor: '#D97706',
      labelKey: 'lc.dashboard.midlineSurveys',
      subtitleKey: 'lc.dashboard.surveysCompleted',
      value: data?.formSubmissions?.totalMidlineSubmissions,
    },
    {
      key: 'endlineSurveys',
      icon: 'CheckCircle2',
      iconColor: '#059669',
      labelKey: 'lc.dashboard.endlineSurveys',
      subtitleKey: 'lc.dashboard.surveysCompleted',
      value: data?.formSubmissions?.totalEndlineSubmissions,
    },
    {
      key: 'bigPushFacilitated',
      icon: 'Target',
      iconColor: '#7C3AED',
      labelKey: 'lc.dashboard.bigPushFacilitated',
      subtitleKey: 'lc.dashboard.bigPushFacilitatedSubtitle',
      value: data?.bigPush?.facilitatedCount,
    },
    {
      key: 'bigPushValue',
      icon: 'DollarSign',
      iconColor: '#059669',
      labelKey: 'lc.dashboard.bigPushValue',
      subtitleKey: 'lc.dashboard.bigPushValueSubtitle',
      value:
        data?.bigPush?.totalValue !== undefined ? formatCurrency(data.bigPush.totalValue) : undefined,
    },
    {
      key: 'interventionsScheduled',
      icon: 'Clock',
      iconColor: '#64748B',
      labelKey: 'lc.dashboard.interventionsScheduled',
      subtitleKey: 'lc.dashboard.interventionsScheduledSubtitle',
      comingSoon: true,
    },
    {
      key: 'interventionsCompleted',
      icon: 'ListChecks',
      iconColor: '#64748B',
      labelKey: 'lc.dashboard.interventionsCompleted',
      subtitleKey: 'lc.dashboard.interventionsCompletedSubtitle',
      comingSoon: true,
    },
    {
      key: 'slowClimbers',
      icon: 'TrendingDown',
      iconColor: '#64748B',
      labelKey: 'lc.dashboard.slowClimbers',
      subtitleKey: 'lc.dashboard.slowClimbersSubtitle',
      //comingSoon: true,
    },
    {
      key: 'fastClimbers',
      icon: 'TrendingUp',
      iconColor: '#059669',
      labelKey: 'lc.dashboard.fastClimbers',
      subtitleKey: 'lc.dashboard.fastClimbersSubtitle',
      value: data?.fastClimberCount,
    },
  ];

  return (
    <Box bg="$white" borderRadius="$xl" borderWidth={1} borderColor="$borderColor" p="$4" width="100%">
      <VStack mb="$3">
        <Text fontSize="$md" fontWeight="$semibold" color="$textForeground">
          {t('lc.dashboard.performanceActivityReport')}
        </Text>
        <Text fontSize="$sm" color="$textMutedForeground">
          {t('lc.dashboard.performanceActivityReportSubtitle')}
        </Text>
      </VStack>
      <HStack flexWrap="wrap" gap="$3">
        {boxes.map(box => (
          <ReportStatBox key={box.key} box={box} />
        ))}
      </HStack>
    </Box>
  );
};

export default PerformanceActivityReport;
