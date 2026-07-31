import React from 'react';
import { VStack, HStack, Box, Text, LucideIcon } from '@ui';
import cardStyles from '../../styles';
import { useLanguage } from '@contexts/LanguageContext';

const BASE_PATH = 'supportProvider.supportRequests';

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
            {t(`${BASE_PATH}.cardBadges.overdue`)} ({overdueDays || 7} {t(`${BASE_PATH}.cardBadges.days`)})
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
