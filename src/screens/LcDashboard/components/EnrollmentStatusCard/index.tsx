import React from 'react';
import { Box, HStack, VStack, Text, Progress, ProgressFilledTrack, LucideIcon } from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import { pickBreakdownValue, type LcDashboardOverviewData } from '../../utils/reportingMetrics';

interface EnrollmentStatusCardProps {
  data?: LcDashboardOverviewData;
}

interface StatusConfig {
  key: string;
  labelKey: string;
  keys: string[];
}

const STATUS_CONFIG: StatusConfig[] = [
  { key: 'notEnrolled', labelKey: 'lc.dashboard.enrollment.notEnrolled', keys: ['not_enrolled', 'notEnrolled'] },
  { key: 'onboarded', labelKey: 'lc.dashboard.enrollment.onboarded', keys: ['onboarded', 'Onboarded'] },
  { key: 'inProgress', labelKey: 'lc.dashboard.enrollment.inProgress', keys: ['in_progress', 'inProgress', 'inprogress'] },
  { key: 'completed', labelKey: 'lc.dashboard.enrollment.completed', keys: ['completed', 'Completed'] },
];

const EnrollmentStatusCard: React.FC<EnrollmentStatusCardProps> = ({ data }) => {
  const { t } = useLanguage();
  const breakdown = data?.lifecycleStatusBreakdown;
  const total = data?.totalParticipants ?? 0;

  return (
    <Box flex={1} minWidth={280} bg="$white" borderRadius="$xl" borderWidth={1} borderColor="$borderColor" p="$4">
      <HStack space="sm" alignItems="center" mb="$4">
        <Box width={32} height={32} borderRadius="$md" bg="$primary100" justifyContent="center" alignItems="center">
          <LucideIcon name="User" size={18} color="$primary500" />
        </Box>
        <Text fontSize="$md" fontWeight="$semibold" color="$textForeground">
          {t('lc.dashboard.enrollmentStatus')}
        </Text>
      </HStack>

      <VStack space="md">
        {STATUS_CONFIG.map(status => {
          const count = pickBreakdownValue(breakdown, status.keys) ?? 0;
          const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

          return (
            <VStack key={status.key} space="xs">
              <HStack justifyContent="space-between" alignItems="center">
                <Text fontSize="$sm" color="$textMutedForeground">
                  {t(status.labelKey)}
                </Text>
                <Text fontSize="$md" fontWeight="$semibold" color="$textForeground">
                  {count}
                </Text>
              </HStack>
              <Progress value={percentage} w="$full" h="$1.5" bg="$progressBarBackground" borderRadius="$full">
                <ProgressFilledTrack bg="$blue500" />
              </Progress>
            </VStack>
          );
        })}
      </VStack>
    </Box>
  );
};

export default EnrollmentStatusCard;
