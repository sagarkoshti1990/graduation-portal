import React from 'react';
import { Box, VStack, HStack, Text, Progress, ProgressFilledTrack } from '@ui';
import { LucideIcon } from '@ui';
import { topPerformersCardStyles } from './Styles';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';

interface Performer {
  name: string;
  id: string;
  progress: number;
}

interface TopPerformersCardProps {
  performers?: Performer[];
}

const TopPerformersCard: React.FC<TopPerformersCardProps> = ({
  performers = [
    { name: 'Sipho Dube', id: '1006E', progress: 100 },
    { name: 'Nomvula Zulu', id: '1006F', progress: 100 },
    { name: 'Kabelo Moeti', id: '1011', progress: 100 },
    { name: 'Ahmed Hassan', id: '1017', progress: 100 },
    { name: 'Daniel Kowalski', id: '024', progress: 100 },
  ],
}) => {
  return (
    <Box {...topPerformersCardStyles.container}>
      <HStack {...topPerformersCardStyles.header}>
        <Box {...topPerformersCardStyles.iconContainer}>
          <LucideIcon name="User" size={20} color="$primary500" />
        </Box>
        <Text {...TYPOGRAPHY.h4} color="$textPrimary">
          Top Performers
        </Text>
      </HStack>
      
      <VStack {...topPerformersCardStyles.content}>
        {performers.map((performer, index) => (
          <VStack key={index} {...topPerformersCardStyles.performerItem}>
            <HStack {...topPerformersCardStyles.performerRow}>
              <VStack {...topPerformersCardStyles.performerInfo}>
                <Text {...TYPOGRAPHY.bodySmall} color="$textPrimary" fontWeight="$medium">
                  {performer.name}
                </Text>
                <Text {...TYPOGRAPHY.caption} color="$textSecondary">
                  ID: {performer.id}
                </Text>
              </VStack>
              <Text {...TYPOGRAPHY.h4} color="$success600" fontWeight="$bold">
                {performer.progress}%
              </Text>
            </HStack>
            <Progress
              value={performer.progress}
              w="$full"
              h="$1.5"
              bg="$progressBarBackground"
              {...topPerformersCardStyles.progressBar}
            >
              <ProgressFilledTrack bg="$success600" />
            </Progress>
          </VStack>
        ))}
      </VStack>
    </Box>
  );
};

export default TopPerformersCard;

