import React from 'react';
import { Box, HStack, VStack, Text, Progress, ProgressFilledTrack, LucideIcon } from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import { displayMetric } from '../../utils/reportingMetrics';

interface TasksOverviewCardProps {
  totalTasks?: number;
  completedTasks?: number;
}

const TasksOverviewCard: React.FC<TasksOverviewCardProps> = ({ totalTasks, completedTasks }) => {
  const { t } = useLanguage();

  const completionPercentage =
    totalTasks && totalTasks > 0 ? Math.round(((completedTasks ?? 0) / totalTasks) * 100) : 0;

  return (
    <Box flex={1} minWidth={280} bg="$white" borderRadius="$xl" borderWidth={1} borderColor="$borderColor" p="$4">
      <HStack space="sm" alignItems="center" mb="$4">
        <Box width={32} height={32} borderRadius="$md" bg="$primary100" justifyContent="center" alignItems="center">
          <LucideIcon name="Target" size={18} color="$primary500" />
        </Box>
        <Text fontSize="$md" fontWeight="$semibold" color="$textForeground">
          {t('lc.dashboard.tasksOverview')}
        </Text>
      </HStack>

      <VStack space="md">
        <HStack justifyContent="space-between" alignItems="center">
          <Text fontSize="$sm" color="$textMutedForeground">
            {t('lc.dashboard.totalTasks')}
          </Text>
          <Text fontSize="$md" fontWeight="$semibold" color="$textForeground">
            {displayMetric(totalTasks)}
          </Text>
        </HStack>

        <VStack space="sm">
          <HStack justifyContent="space-between" alignItems="center">
            <Text fontSize="$sm" color="$textMutedForeground">
              {t('lc.dashboard.completedTasks')}
            </Text>
            <Text fontSize="$md" fontWeight="$semibold" color="$textForeground">
              {totalTasks !== undefined && completedTasks !== undefined
                ? `${completedTasks.toLocaleString()} / ${totalTasks.toLocaleString()}`
                : '—'}
            </Text>
          </HStack>
          <Progress value={completionPercentage} w="$full" h="$1.5" bg="$progressBarBackground" borderRadius="$full">
            <ProgressFilledTrack bg="$blue500" />
          </Progress>
        </VStack>
      </VStack>
    </Box>
  );
};

export default TasksOverviewCard;
