import React, { memo, useMemo } from 'react';
import { Box, HStack, VStack, Text } from '@ui';
import { LucideIcon } from '@ui/index';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';
import { taskCardStyles } from './styles';
import { isTaskCompleted } from '../shared/helpers';
import type { Task } from '../../../types/project.types';

interface ReadOnlyTaskProps {
  task: Task;
  isLastTask?: boolean;
  isChildOfProject?: boolean;
  isOnboardingTask?: boolean;
}

const ReadOnlyTask = memo<ReadOnlyTaskProps>(
  ({ task, isLastTask = false, isChildOfProject = false, isOnboardingTask = false }) => {
    const isCompleted = useMemo(() => isTaskCompleted(task?.status), [task?.status]);

    const statusIconName = isCompleted ? 'CheckCircle' : 'Circle';
    const statusIconColor = isCompleted ? '$success500' : '$textMuted';

    const titleTypography = isChildOfProject ? TYPOGRAPHY.h4 : TYPOGRAPHY.h3;
    const textOpacity = isCompleted ? 0.6 : 1;

    return (
      <>
        <HStack
          alignItems="flex-start"
          space="sm"
          paddingVertical="$2"
          opacity={0.85}
        >
          <Box flexShrink={0} mt="$1">
            <LucideIcon name={statusIconName} size={20} color={statusIconColor} />
          </Box>

          <VStack flex={1} space="xs">
            <Text
              {...titleTypography}
              color="$textPrimary"
              opacity={textOpacity}
            >
              {task?.name}
            </Text>
            {task?.description && (
              <Text
                {...(isChildOfProject ? TYPOGRAPHY.bodySmall : TYPOGRAPHY.paragraph)}
                color="$textSecondary"
                opacity={textOpacity}
              >
                {task.description}
              </Text>
            )}
          </VStack>
        </HStack>

        {!isLastTask && !isOnboardingTask && (
          <Box {...taskCardStyles.divider} marginHorizontal={!isChildOfProject ? '$5' : undefined} />
        )}
      </>
    );
  },
);

ReadOnlyTask.displayName = 'ReadOnlyTask';
export default ReadOnlyTask;
