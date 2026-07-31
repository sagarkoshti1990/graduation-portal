import React from 'react';
import { VStack, HStack, Box, Text, LucideIcon } from '@ui';
import cardStyles from '../../styles';
import { SUPPORT_REQUEST_CARDBADGES } from '@constants/SUPPORT_REQUESTS';
import { useLanguage } from '@contexts/LanguageContext';

interface CardBadgesProps {
  overdueDays?: number;
  status?: string;
}

export const CardBadges: React.FC<CardBadgesProps> = ({ overdueDays, status = 'Pending' }) => {
  const { t } = useLanguage();
  return (
    <VStack {...cardStyles.badgeContainer}>
      {/* Overdue Red Badge */}
      <Box {...cardStyles.overdueBadge}>
        <HStack {...cardStyles.badgeRow}>
          <LucideIcon name="AlertCircle" {...cardStyles.badgeIconOverdue} />
          <Text {...cardStyles.badgeTextOverdue}>
            {t(SUPPORT_REQUEST_CARDBADGES.OVERDUE)} ({overdueDays || 7} {t(SUPPORT_REQUEST_CARDBADGES.DAYS)})
          </Text>
        </HStack>
      </Box>

      {/* Status Yellow Badge */}
      <Box {...cardStyles.pendingBadge}>
        <Text {...cardStyles.badgeTextPending}>
          {status}
        </Text>
      </Box>
    </VStack>
  );
};

export default CardBadges;
