import React from 'react';
import { Box, VStack, HStack, Text, Progress, ProgressFilledTrack } from '@ui';
import { LucideIcon } from '@ui';
import { enrollmentStatusCardStyles } from './Styles';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';

interface EnrollmentStatus {
  label: string;
  count: number;
  percentage: number;
}

interface EnrollmentStatusCardProps {
  statuses?: EnrollmentStatus[];
}

const EnrollmentStatusCard: React.FC<EnrollmentStatusCardProps> = ({
  statuses = [
    { label: 'Not Enrolled', count: 4, percentage: 14 },
    { label: 'Onboarded', count: 2, percentage: 7 },
    { label: 'In Progress', count: 15, percentage: 54 },
    { label: 'Completed', count: 7, percentage: 25 },
  ],
}) => {
  const total = statuses.reduce((sum, status) => sum + status.count, 0);

  return (
    <Box {...enrollmentStatusCardStyles.container}>
      <HStack {...enrollmentStatusCardStyles.header}>
        <Box {...enrollmentStatusCardStyles.iconContainer}>
          <LucideIcon name="User" size={20} color="$primary500" />
        </Box>
        <Text {...TYPOGRAPHY.h4} color="$textPrimary">
          Enrollment Status
        </Text>
      </HStack>
      
      <VStack {...enrollmentStatusCardStyles.content}>
        {statuses.map((status, index) => (
          <VStack key={index} {...enrollmentStatusCardStyles.statusItem}>
            <HStack {...enrollmentStatusCardStyles.statusRow}>
              <Text {...TYPOGRAPHY.bodySmall} color="$textSecondary">
                {status.label}
              </Text>
              <Text {...TYPOGRAPHY.h4} color="$textPrimary">
                {status.count}
              </Text>
            </HStack>
            <Progress
              value={status.percentage}
              w="$full"
              h="$1.5"
              bg="$progressBarBackground"
              {...enrollmentStatusCardStyles.progressBar}
            >
              <ProgressFilledTrack bg="$blue500" />
            </Progress>
          </VStack>
        ))}
      </VStack>
    </Box>
  );
};

export default EnrollmentStatusCard;

