import React, { useEffect, useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Spinner,
  Button,
  ButtonText,
  Pressable,
  LucideIcon,
} from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import type { ParticipantData } from '@app-types/participant';
import { getMenteeSessions } from '../../../services/SupportOfferingsServices/supportOfferingsService';
import { formatDateString } from '@utils/helper';
import { attendedSessionsStyles as styles } from './Styles';

const PAGE_LIMIT = 10;

interface AttendedSessionsProps {
  participant?: ParticipantData;
}

const AttendedSessions: React.FC<AttendedSessionsProps> = ({ participant }) => {
  const { t } = useLanguage();
  const [filterType, setFilterType] = useState<'ATTENDED' | 'MISSED'>('ATTENDED');

  const filterOptions = [
    { label: t('participantDetail.attendedSessions.attended'), value: 'ATTENDED' },
    { label: t('participantDetail.attendedSessions.missed'), value: 'MISSED' },
  ];

  const participantName = participant?.name ?? '';
  const isAttended = filterType === 'ATTENDED';
  const [sessions, setSessions] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  // Restart from the first page when the participant or tab changes
  useEffect(() => {
    setPage(1);
    setSessions([]);
    setTotalCount(0);
  }, [participant?.userId, isAttended]);

  useEffect(() => {
    const menteeId = participant?.userId;
    if (!menteeId) return;
    let cancelled = false;
    setLoading(true);
    getMenteeSessions(menteeId, isAttended ? 'attended' : 'missed', page, PAGE_LIMIT)
      .then(({ data, count }) => {
        if (cancelled) return;
        setSessions(prev => (page === 1 ? data : [...prev, ...data]));
        setTotalCount(count);
      })
      .catch(() => !cancelled && page === 1 && setSessions([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [participant?.userId, isAttended, page]);

  const hasMore = sessions.length < totalCount;

  const formatEpoch = (value?: string) =>
    value ? formatDateString(new Date(Number(value) * 1000).toISOString()) : '';

  return (
    <Box {...styles.container}>
      {/* Header with Title and Filter */}
      <HStack {...styles.headerHStack}>
        <Text {...styles.headerTitleText}>
          {isAttended
            ? t('participantDetail.attendedSessions.sectionTitle')
            : t('participantDetail.attendedSessions.missedSectionTitle')}{' '}
          ({totalCount || sessions.length})
        </Text>
        <HStack {...styles.toggleHStack}>
          {filterOptions.map(opt => {
            const active = opt.value === filterType;
            return (
              <Pressable
                key={opt.value}
                onPress={() => setFilterType(opt.value as 'ATTENDED' | 'MISSED')}
                {...styles.toggleButton(active)}>
                <Text {...styles.toggleButtonText(active)}>{opt.label}</Text>
              </Pressable>
            );
          })}
        </HStack>
      </HStack>

      {loading && sessions.length === 0 ? (
        <Box {...styles.loadingContainer}>
          <Spinner size="large" color="$primary500" />
        </Box>
      ) : sessions.length === 0 ? (
        <Box {...styles.emptyStateContainer}>
          <VStack {...styles.emptyStateVStack}>
            <Box {...styles.emptyStateIconContainer}>
              <LucideIcon name="Clock" size={30} color="$textMutedForeground" />
            </Box>
            <Text {...styles.emptyStateTitle}>
              {isAttended
                ? t('participantDetail.attendedSessions.noAttendedTitle', 'No attended sessions')
                : t('participantDetail.attendedSessions.noMissedTitle', 'No missed sessions')}
            </Text>
            <Text {...styles.emptyStateDescription}>
              {isAttended
                ? t('participantDetail.attendedSessions.noAttended', { name: participantName })
                : t('participantDetail.attendedSessions.noMissed', { name: participantName })}
            </Text>
          </VStack>
        </Box>
      ) : (
        <VStack {...styles.listVStack}>
          {sessions.map(session => (
            <Box key={session.id} {...styles.card(isAttended)}>
              <HStack {...styles.cardHeaderHStack}>
                <HStack {...styles.cardTitleHStack}>
                  <Text {...styles.cardTitleText}>{session.title}</Text>
                  <Box {...styles.statusBadge(isAttended)}>
                    <Text {...styles.statusBadgeText(isAttended)}>
                      {isAttended
                        ? t('participantDetail.attendedSessions.attended')
                        : t('participantDetail.attendedSessions.missed')}
                    </Text>
                  </Box>
                </HStack>
              </HStack>
              {!!session.description && (
                <Text {...styles.subtitleText}>{session.description}</Text>
              )}
              <HStack {...styles.metaRowHStack}>
                <HStack {...styles.metaItemHStack}>
                  <LucideIcon name="Calendar" size={14} color="$textSecondary" />
                  <Text {...styles.metaText}>{formatEpoch(session.start_date)}</Text>
                </HStack>
                {!!session.mentor_name && (
                  <Text {...styles.metaText}>
                    {t('participantDetail.attendedSessions.serviceProvider')}: {session.mentor_name}
                  </Text>
                )}
                {!!session.delivery_mode && (
                  <HStack {...styles.metaItemHStack}>
                    <LucideIcon name="Building2" size={14} color="$success600" />
                    <Text {...styles.deliveryText}>{session.delivery_mode}</Text>
                  </HStack>
                )}
              </HStack>
            </Box>
          ))}
          {hasMore && (
            <Box alignItems="center" mt="$4" width="100%">
              {loading ? (
                <Spinner />
              ) : (
                <Button onPress={() => setPage(prev => prev + 1)}>
                  <ButtonText>
                    {t(
                      'supportProvider.supportOfferings.buttonTexts.loadMoreSessions',
                      'Load More Sessions'
                    )}
                  </ButtonText>
                </Button>
              )}
            </Box>
          )}
        </VStack>
      )}
    </Box>
  );
};

export default AttendedSessions;