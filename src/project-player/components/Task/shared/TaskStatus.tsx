import React from 'react';
import { Box, Text, Pressable } from '@gluestack-ui/themed';
import { TaskStatus as TaskStatusType } from '../../../types/project.types';
import { getStatusColor } from '../../ProjectComponent/helpers';
import { TaskStatusProps } from '../../../types/components.types';
import { TASK_STATUS } from '../../../../constants/app.constant';

const TaskStatus: React.FC<TaskStatusProps> = ({
  status,
  isReadOnly,
  onStatusChange,
}) => {
  const statusColor = getStatusColor(status);

  const toggleStatus = () => {
    if (isReadOnly || !onStatusChange) return;

    // Simple toggle: to-do ↔ completed
    const nextStatus: Record<TaskStatusType, TaskStatusType> = {
      [TASK_STATUS.TO_DO]: TASK_STATUS.COMPLETED,
      [TASK_STATUS.COMPLETED]: TASK_STATUS.TO_DO,
    };

    onStatusChange(nextStatus[status]);
  };

  return (
    <Pressable onPress={toggleStatus} disabled={isReadOnly}>
      <Box
        bg={statusColor}
        paddingHorizontal="$3"
        paddingVertical="$1"
        borderRadius="$full"
      >
        <Text color="$white" fontSize="$xs" fontWeight="$medium">
          {status.toUpperCase()}
        </Text>
      </Box>
    </Pressable>
  );
};

export default TaskStatus;
