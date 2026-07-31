import React from 'react';
import { VStack, HStack, Box, Text, LucideIcon } from '@ui';
import cardStyles from '../../styles';
import {
  SUPPORT_REQUEST_CARDBADGES,
} from '../../constants/supportRequests.constants';

interface CardBadgesProps {
  overdueDays?: number;
  status?: string;
}

export const CardBadges: React.FC<CardBadgesProps> = ({ overdueDays, status = 'Pending' }) => {
  return (
    <VStack space="xs" alignItems="flex-end">
      {/* Overdue Red Badge */}
      <Box {...cardStyles.overdueBadge}>
        <HStack space="xs" alignItems="center">
          <LucideIcon name="AlertCircle" size={12} color="$red600" />
          <Text fontSize="$xs" color="$red600" fontWeight="$medium">
            {SUPPORT_REQUEST_CARDBADGES.OVERDUE} ({overdueDays || 7} {SUPPORT_REQUEST_CARDBADGES.DAYS})
          </Text>
        </HStack>
      </Box>

      {/* Status Yellow Badge */}
      <Box {...cardStyles.pendingBadge}>
        <Text fontSize="$xs" color="$amber600" fontWeight="$bold">
          {status}
        </Text>
      </Box>
    </VStack>
  );
};

export default CardBadges;
