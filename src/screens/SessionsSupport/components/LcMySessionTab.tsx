import React from 'react';
import { Box, HStack, VStack, Text, Button, ButtonText, Badge, BadgeText, LucideIcon } from '@ui';
import moment from 'moment';
import { useLanguage } from '@contexts/LanguageContext';
import styles from '../styles';

interface LcMySessionTabProps {
  item: {
    id?: string;
    _id?: string;
    title?: string;
    status?: string;
    start_date?: string | number;
    end_date?: string | number;
    seats_limit?: number;
    seats_remaining?: number;
    delivery_mode?: string | { value: string };
    [key: string]: any;
  };
  isFirst?: boolean;
}

const getStatusColors = (status: string) => {
  const s = (status || '').toUpperCase();
  if (s === 'UPCOMING') {
    return { bg: '$blue50', border: '$blue200', text: '$blue600', icon: 'Clock' };
  }
  if (s === 'IN PROGRESS') {
    return { bg: '$observationTaskBg', border: '#fde68a', text: '$warningIconColor', icon: 'AlertCircle' };
  }
  if (s === 'COMPLETED') {
    return { bg: '$success50', border: '#a7f3d0', text: '$success600', icon: 'CheckCircle' };
  }
  if (s === 'DRAFT') {
    return { bg: '$backgroundLight100', border: '$borderColor', text: '$textMuted', icon: 'FileText' };
  }
  return { bg: '$blue50', border: '$blue200', text: '$blue600', icon: 'Clock' };
};

const resolveStatus = (item: LcMySessionTabProps['item']): string => {
  const raw = (item.status || '').toUpperCase();
  if (raw === 'DRAFT') return 'Draft';
  if (raw === 'COMPLETED') return 'Completed';
  if (item.start_date) {
    const startMs =
      typeof item.start_date === 'number' || !isNaN(Number(item.start_date))
        ? Number(item.start_date) * 1000
        : new Date(item.start_date).getTime();
    const endMs = item.end_date
      ? typeof item.end_date === 'number' || !isNaN(Number(item.end_date))
        ? Number(item.end_date) * 1000
        : new Date(item.end_date).getTime()
      : undefined;
    const now = Date.now();
    if (endMs !== undefined && now > endMs) return 'Completed';
    if (now < startMs) return 'Upcoming';
    return 'In Progress';
  }
  return 'Upcoming';
};

const LcMySessionTab: React.FC<LcMySessionTabProps> = ({ item, isFirst }) => {
  const { t } = useLanguage();
  const statusLabel = resolveStatus(item);
  const statusColors = getStatusColors(statusLabel);

  // Date display
  const displayDate = item.start_date
    ? moment(
      typeof item.start_date === 'number' || !isNaN(Number(item.start_date))
        ? Number(item.start_date) * 1000
        : item.start_date
    ).format('D MMM YYYY')
    : '--';

  // Duration display
  const displayDuration = (() => {
    if (item.start_date && item.end_date) {
      const startMs =
        typeof item.start_date === 'number' || !isNaN(Number(item.start_date))
          ? Number(item.start_date) * 1000
          : new Date(item.start_date).getTime();
      const endMs =
        typeof item.end_date === 'number' || !isNaN(Number(item.end_date))
          ? Number(item.end_date) * 1000
          : new Date(item.end_date).getTime();
      const diffMins = (endMs - startMs) / 60000;
      if (diffMins <= 0) return null;
      if (diffMins % 60 === 0) return `${diffMins / 60} hour${diffMins / 60 > 1 ? 's' : ''}`;
      return `${(diffMins / 60).toFixed(1)} hours`;
    }
    if (item.duration) {
      return `${item.duration}`;
    }
    return null;
  })();

  // Participants display
  const maxParticipants = item.seats_limit || item.max_participants || 0;
  const seatsRemaining = item.seats_remaining ?? maxParticipants;
  const assignedCount = maxParticipants - seatsRemaining;

  // Delivery mode display
  const rawMode = ((typeof item.delivery_mode === 'object' ? (item.delivery_mode as any)?.value : item.delivery_mode) || '').toLowerCase();

  const deliveryModeLabel = rawMode.includes('online')
    ? 'Online'
    : rawMode.includes('hybrid')
      ? 'Hybrid'
      : rawMode
        ? rawMode.charAt(0).toUpperCase() + rawMode.slice(1)
        : null;

  return (
    <VStack space="sm" width="100%">
      {/* Description line shown above the first card only */}
      {isFirst && (
        <Text {...styles.mySessionsDescriptionText}>
          {t('lc.sessionsSupport.mySessionsDescription', 'Sessions created and conducted by you.')}
        </Text>
      )}

      <Box {...styles.mySessionCard}>
        <VStack {...styles.mySessionCardVStack}>
          {/* ROW 1: Title + Status Badge */}
          <HStack {...styles.mySessionCardHeaderRow}>
            <Text {...styles.mySessionCardTitle} flex={1} numberOfLines={2}>
              {item.title || 'Untitled Session'}
            </Text>
            <Badge borderWidth={1} borderColor={statusColors.border} bg={statusColors.bg} borderRadius="$full" px="$2" py="$0.5">
              <HStack space="xs" alignItems="center">
                <LucideIcon name={statusColors.icon} size={11} color={statusColors.text} />
                <BadgeText {...styles.mySessionCardStatusBadgeText} color={statusColors.text}>
                  {statusLabel}
                </BadgeText>
              </HStack>
            </Badge>
          </HStack>

          {/* ROW 2: Metadata */}
          <HStack {...styles.mySessionCardMetaRow}>
            {/* Date */}
            <HStack {...styles.mySessionCardMetaItem}>
              <LucideIcon name="Calendar" size={12} color="$textSecondary" />
              <Text {...styles.mySessionCardMetaText}>{displayDate}</Text>
            </HStack>

            {/* Duration */}
            {displayDuration && (
              <HStack {...styles.mySessionCardMetaItem}>
                <LucideIcon name="Clock" size={12} color="$textSecondary" />
                <Text {...styles.mySessionCardMetaText}>{displayDuration}</Text>
              </HStack>
            )}


            {/* Participants */}
            {maxParticipants > 0 && (
              <HStack {...styles.mySessionCardMetaItem}>
                <LucideIcon name="Users" size={12} color="$textSecondary" />
                <Text {...styles.mySessionCardMetaText}>
                  {assignedCount} / {maxParticipants} {t('lc.sessionsSupport.mySessionCard.participants')}
                </Text>
              </HStack>
            )}
          </HStack>

          {/* FOOTER: Action Buttons */}
          <HStack {...styles.mySessionCardFooter}>
            <Button variant="outlineghost" {...styles.mySessionCardAssignBtn} onPress={() => { }}>
              <ButtonText {...styles.mySessionCardAssignBtnText}>
                {t('lc.sessionsSupport.mySessionCard.assignParticipants')}
              </ButtonText>
            </Button>

            <Button {...styles.mySessionCardManageBtn} variant="solid" onPress={() => { }}>
              <ButtonText {...styles.mySessionCardManageBtnText}>
                {t('lc.sessionsSupport.mySessionCard.manageSession')}
              </ButtonText>
            </Button>
          </HStack>
        </VStack>
      </Box>
    </VStack>
  );
};

export default LcMySessionTab;
