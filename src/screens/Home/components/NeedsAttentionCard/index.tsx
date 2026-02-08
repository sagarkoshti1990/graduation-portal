import React from 'react';
import { Box, VStack, HStack, Text, Progress, ProgressFilledTrack } from '@ui';
import { LucideIcon } from '@ui';
import { needsAttentionCardStyles } from './Styles';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';

interface Participant {
  name: string;
  id: string;
  progress: number;
}

interface NeedsAttentionCardProps {
  participants?: Participant[];
}

const NeedsAttentionCard: React.FC<NeedsAttentionCardProps> = ({
  participants = [
    { name: 'Bongani Zungu', id: '1006C', progress: 5 },
    { name: 'Mbali Cele', id: '1006D', progress: 8 },
    { name: 'Dakalo Ramaano', id: '1010', progress: 15 },
    { name: 'Rebecca Stone', id: '1016', progress: 19 },
    { name: 'Andile Nkosi', id: '1007', progress: 28 },
  ],
}) => {
  return (
    <Box {...needsAttentionCardStyles.container}>
      <HStack {...needsAttentionCardStyles.header}>
        <Box {...needsAttentionCardStyles.iconContainer}>
          <LucideIcon name="Clock" size={20} color="$warning500" />
        </Box>
        <Text {...TYPOGRAPHY.h4} color="$textPrimary">
          Needs Attention
        </Text>
      </HStack>
      
      <VStack {...needsAttentionCardStyles.content}>
        {participants.map((participant, index) => (
          <VStack key={index} {...needsAttentionCardStyles.participantItem}>
            <HStack {...needsAttentionCardStyles.participantRow}>
              <VStack {...needsAttentionCardStyles.participantInfo}>
                <Text {...TYPOGRAPHY.bodySmall} color="$textPrimary" fontWeight="$medium">
                  {participant.name}
                </Text>
                <Text {...TYPOGRAPHY.caption} color="$textSecondary">
                  ID: {participant.id}
                </Text>
              </VStack>
              <Text {...TYPOGRAPHY.h4} color="$warning500" fontWeight="$bold">
                {participant.progress}%
              </Text>
            </HStack>
            <Progress
              value={participant.progress}
              w="$full"
              h="$1.5"
              bg="$progressBarBackground"
              {...needsAttentionCardStyles.progressBar}
            >
              <ProgressFilledTrack bg="$warning500" />
            </Progress>
          </VStack>
        ))}
      </VStack>
    </Box>
  );
};

export default NeedsAttentionCard;

