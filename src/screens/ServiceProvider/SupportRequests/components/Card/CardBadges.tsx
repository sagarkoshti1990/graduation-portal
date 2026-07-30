import React from 'react';
import { VStack, HStack, Box, Text, LucideIcon } from '@ui';

interface CardBadgesProps {
  overdueDays?: number;
  status?: string;
}

export const CardBadges: React.FC<CardBadgesProps> = ({ overdueDays, status = 'Pending' }) => {
  return (
    <VStack space="xs" alignItems="flex-end">
      {/* Overdue Red Badge */}
      <Box
        bg="#FEF2F2"
        borderColor="#FCA5A5"
        borderWidth={1}
        px="$3"
        py="$1"
        borderRadius="$full"
      >
        <HStack space="xs" alignItems="center">
          <LucideIcon name="AlertCircle" size={12} color="#DC2626" />
          <Text fontSize="$xs" color="#DC2626" fontWeight="$medium">
            Overdue ({overdueDays || 7}+ days)
          </Text>
        </HStack>
      </Box>

      {/* Status Yellow Badge */}
      <Box
        bg="#FEFCE8"
        borderColor="#FEF08A"
        borderWidth={1}
        px="$3"
        py="$1"
        borderRadius="$full"
      >
        <Text fontSize="$xs" color="#CA8A04" fontWeight="$bold">
          {status}
        </Text>
      </Box>
    </VStack>
  );
};

export default CardBadges;
