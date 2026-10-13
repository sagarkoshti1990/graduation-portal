import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Box, VStack, HStack, Text, Heading, Pressable } from '@gluestack-ui/themed';
import { Container, LucideIcon, Loader, useAlert } from '@ui';
import Select from '@components/ui/Inputs/Select';
import { useAuth } from '@contexts/AuthContext';
import { useLanguage } from '@contexts/LanguageContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getMenteeSessions } from '../../../services/participantJourneyService';
import dataService from '../../../services/dataService';
import { getProvincesList } from '../../../services/usersService';
import {
  MY_SESSIONS_FILTER_OPTIONS,
  MY_SESSIONS_TABS,
  SessionTabKey,
} from '@constants/PARTICIPANT_JOURNEY_SESSION_FILTERS';
import { theme } from '@config/theme';
import { mySessionsStyles } from './Styles';
import { participantJourneyStyles } from '../Styles';
import { isWeb } from '@utils/platform';

import {
  formatSessionStartDateTimeParts,
  calculateSessionDuration,
  getDeliveryMode,
  resolveProvinceNames,
  getParticipantStatusBadgeKey,
  isRestrictedParticipantStatus,
} from '@utils/participantJourneyUtils';

export interface SessionItem {
  id: string;
  title: string;
  provider: string;
  date: string;
  datePart?: string;
  timePart?: string;
  duration: string;
  mode: string;
  province: string;
  status: 'scheduled' | 'attended' | 'missed';
  itemType: 'trainings' | 'additional_services';
  seatsLimit?: any;
  seatsRemaining?: any;
  enrolledText?: string;
  spotsRemainingText?: string;
  about?: string;
  learningObjectives?: string[];
  tags?: string[];
  rawData?: any;
}

const getModeIcon = (mode: string) => {
  const lower = (mode || '').toLowerCase();
  if (lower.includes('online') || lower.includes('virtual')) {
    return 'Video';
  }
  if (lower.includes('hybrid')) {
    return 'Building';
  }
  return 'Building';
};

const MySessionsScreen: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigation = useNavigation();
  const { showAlert } = useAlert();
  const [activeTab, setActiveTab] = useState<SessionTabKey>('scheduled');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [isBackHovered, setIsBackHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [provinceMap, setProvinceMap] = useState<Record<string, string>>({});
  const provinceMapRef = React.useRef<Record<string, string>>({});
  const currentStatus: string | undefined = user?.status;
  const accountUserStatus: string | undefined = (user as any)?.accountUserStatus;
  const [participantProfile, setParticipantProfile] = useState<any>(null);
  const [isParticipantProfileLoaded, setIsParticipantProfileLoaded] = useState(false);
  // Mapped sessions per `${tab}|${filter}`, so switching tabs reuses earlier responses.
  // Cleared on blur so re-entering the screen loads fresh data once.
  const sessionsCacheRef = React.useRef<Record<string, SessionItem[]>>({});

  useEffect(() => {
    const participantId = (user as any)?.externalId || (user as any)?.userId || user?.id || '';
    const authUserId = user?.id || '';
    if (!participantId || !authUserId) {
      setIsParticipantProfileLoaded(true);
      return;
    }
    let isMounted = true;
    dataService.getParticipantDetails(participantId, authUserId)
      .then(result => {
        if (isMounted) setParticipantProfile(result?.data || null);
      })
      .catch(() => {
        // Fail silently; badge falls back to the auth user status
      })
      .finally(() => {
        if (isMounted) setIsParticipantProfileLoaded(true);
      });
    return () => {
      isMounted = false;
    };
  }, [user?.id, (user as any)?.externalId, (user as any)?.userId]);

  useFocusEffect(
    useCallback(() => () => {
      sessionsCacheRef.current = {};
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const cacheKey = `${activeTab}|${selectedFilter}`;
      const cached = sessionsCacheRef.current[cacheKey];
      if (cached) {
        setSessions(cached);
        setIsLoading(false);
        return () => {
          isMounted = false;
        };
      }

      const fetchSessionData = async () => {
        setIsLoading(true);
        try {
          let currentProvinceMap = provinceMapRef.current;
          if (Object.keys(currentProvinceMap).length === 0) {
            try {
              const list = await getProvincesList();
              if (Array.isArray(list)) {
                const map: Record<string, string> = {};
                list.forEach((p: any) => {
                  if (p._id && p.name) map[p._id] = p.name;
                  if (p.id && p.name) map[p.id] = p.name;
                  if (p.externalId && p.name) map[p.externalId] = p.name;
                });
                provinceMapRef.current = map;
                currentProvinceMap = map;
                if (isMounted) setProvinceMap(map);
              }
            } catch {
              // Fail gracefully
            }
          }

          // Each tab calls only its own endpoint: scheduled -> /mentees/sessions, attended/missed -> scoped by menteeId
          const scopeParams = activeTab === 'scheduled'
            ? {}
            : { menteeId: user?.id, scope: activeTab };
          const filterParams = selectedFilter && selectedFilter !== 'all'
            ? { support_offering_type: selectedFilter }
            : {};
          const requestParams = { ...scopeParams, ...filterParams };
          const params = Object.keys(requestParams).length ? requestParams : undefined;
          const menteeRes = await getMenteeSessions(params);
          if (!isMounted) return;
          const menteeRaw = menteeRes?.result?.data || menteeRes?.result || menteeRes?.data || menteeRes || [];
          const menteeSessions = Array.isArray(menteeRaw) ? menteeRaw : [];

          const mappedSessions: SessionItem[] = menteeSessions.map((item: any, index: number) => {
            const itemId = String(item._id || item.id || item.sessionId || index);

            const rawStatus = (item.status || '').toLowerCase();
            let status: 'scheduled' | 'attended' | 'missed' = 'scheduled';
            if (activeTab !== 'scheduled') {
              // Scoped API already returns only this tab's sessions
              status = activeTab;
            } else if (rawStatus === 'completed' || rawStatus === 'attended') {
              status = 'attended';
            } else if (rawStatus === 'missed') {
              status = 'missed';
            } else if (rawStatus === 'scheduled' || rawStatus === 'upcoming' || rawStatus === 'published') {
              status = 'scheduled';
            }

            const provider = item.mentor_name || item.mentorName || item.provider || item.serviceProvider || item.organization || '';
            const { date: datePart, time: timePart } = formatSessionStartDateTimeParts(item);
            const dateDisplay = datePart && timePart ? `${datePart}, ${timePart}` : (datePart || timePart || '');

            const durationStr = calculateSessionDuration(item);
            const modeStr = getDeliveryMode(item);

            const rawProvince = item.meta?.provinces || item.meta?.province || item.province || item.provinces || item.location || item.venue || '';
            const provinceStr = resolveProvinceNames(rawProvince, currentProvinceMap);

            // Capacity
            const seatsLimit = item.seats_limit ?? item.seatsLimit ?? item.capacity ?? item.maxCapacity;
            const seatsRemaining = item.seats_remaining ?? item.seatsRemaining;

            let enrolledText = '';
            if (seatsLimit !== undefined && seatsLimit !== null && seatsLimit !== '') {
              if (seatsRemaining !== undefined && seatsRemaining !== null && seatsRemaining !== '') {
                const enrolled = item.enrolled_count ?? item.enrolledCount ?? (Number(seatsLimit) - Number(seatsRemaining));
                enrolledText = `${enrolled} / ${seatsLimit} enrolled`;
              } else {
                enrolledText = `${seatsLimit} enrolled`;
              }
            }

            let spotsRemainingText = '';
            if (seatsRemaining !== undefined && seatsRemaining !== null && seatsRemaining !== '') {
              spotsRemainingText = `${seatsRemaining} spots remaining`;
            }

            // About
            const aboutText = item.description || item.about || item.meta?.description || '';

            // Learning Objectives
            const rawObjectives = item.learning_objectives ?? item.learningObjectives ?? item.meta?.learning_objectives;
            let learningObjectives: string[] = [];
            if (Array.isArray(rawObjectives)) {
              learningObjectives = rawObjectives.map((o: any) => (typeof o === 'string' ? o : o.title || o.name || String(o))).filter(Boolean);
            } else if (typeof rawObjectives === 'string' && rawObjectives.trim()) {
              learningObjectives = rawObjectives.split('\n').map((s: string) => s.trim()).filter(Boolean);
            }

            // Tags
            const tags = Array.isArray(item.tags) ? item.tags : [];

            const itemTypeStr = (item.type || item.itemType || item.category || '').toLowerCase();
            const meta = item.meta || item.metaInformation || {};
            const isAdditionalService =
              itemTypeStr === 'additional-service' ||
              itemTypeStr === 'additional_service' ||
              meta.type === 'additional-service' ||
              meta.type === 'additional_service' ||
              meta.category === 'additional-service' ||
              meta.category === 'additional_service' ||
              meta.category === 'protection' ||
              (Array.isArray(item.tags) && (item.tags.includes('Additional Services') || item.tags.includes('additional_services')));

            return {
              id: itemId,
              title: item.title || item.name || item.label || '',
              provider,
              date: dateDisplay,
              datePart,
              timePart,
              duration: durationStr,
              mode: modeStr,
              province: provinceStr,
              status,
              itemType: isAdditionalService ? 'additional_services' : 'trainings',
              seatsLimit,
              seatsRemaining,
              enrolledText,
              spotsRemainingText,
              about: aboutText,
              learningObjectives,
              tags,
              rawData: item,
            };
          });

          sessionsCacheRef.current[cacheKey] = mappedSessions;
          setSessions(mappedSessions);
        } catch (err: any) {
          console.error('Failed to fetch sessions data:', err);
          const msg = err?.response?.data?.message || err?.message;
          if (msg) {
            showAlert('error', msg);
          }
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }
      };

      fetchSessionData();
      return () => {
        isMounted = false;
      };
    }, [selectedFilter, activeTab, user?.id])
  );

  const handleBackToHome = () => {
    // @ts-ignore
    navigation.navigate('participant-portal');
  };

  const filterOptions = useMemo(() => {
    return MY_SESSIONS_FILTER_OPTIONS.map(opt => ({
      label: t(opt.labelKey),
      value: opt.value,
    }));
  }, [t]);

  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
      const matchesTab = session.status === activeTab;
      if (!matchesTab) return false;

      if (selectedFilter === 'trainings') {
        return session.itemType === 'trainings';
      }
      if (selectedFilter === 'additional_services') {
        return session.itemType === 'additional_services';
      }
      return true;
    });
  }, [sessions, activeTab, selectedFilter]);

  const statusBadgeKey = getParticipantStatusBadgeKey(
    participantProfile?.status || currentStatus,
    participantProfile?.accountUserStatus || accountUserStatus,
    participantProfile?.pendingChangeRequest,
  );
  // Hide sessions until the participant status is known, so restricted participants never see them.
  const isContentRestricted = !isParticipantProfileLoaded || isRestrictedParticipantStatus(statusBadgeKey);

  return (
    <Box {...mySessionsStyles.page}>
      <Box {...mySessionsStyles.topHeaderBar}>
        <Container {...mySessionsStyles.headerContainer}>
          <HStack {...mySessionsStyles.headerTitleRow}>
            <Pressable
              {...mySessionsStyles.backPressable}
              {...(isWeb && {
                onHoverIn: () => setIsBackHovered(true),
                onHoverOut: () => setIsBackHovered(false),
              })}
              onPress={handleBackToHome}
              accessibilityRole="button"
              accessibilityLabel={t('common.back')}
            >
              <Box
                {...mySessionsStyles.backIconBox}
                {...(isBackHovered ? mySessionsStyles.backIconBoxHover : {})}
              >
                <LucideIcon
                  name="ArrowLeft"
                  size={18}
                  color={isBackHovered ? theme.tokens.colors.primary500 : '$textDark900'}
                  strokeWidth={1.5}
                />
              </Box>
            </Pressable>
            <Heading {...mySessionsStyles.title}>
              {t('participantJourney.cards.sessions')}
            </Heading>
            {statusBadgeKey && (
              <Box {...participantJourneyStyles.statusBadge}>
                <Text {...participantJourneyStyles.statusBadgeText}>{t(statusBadgeKey)}</Text>
              </Box>
            )}
          </HStack>
        </Container>
      </Box>

      <Box {...mySessionsStyles.contentArea}>
        <Container {...mySessionsStyles.container}>
          <VStack {...mySessionsStyles.content}>
            {!isContentRestricted && (
              <>
                <Text {...mySessionsStyles.subtitle}>
                  {t('participantJourney.sessionsSubtitle')}
                </Text>

                <HStack {...mySessionsStyles.tabRowWrapper}>
                  <HStack {...mySessionsStyles.tabsContainer}>
                    {MY_SESSIONS_TABS.map(tab => {
                      const isActive = activeTab === tab.key;
                      return (
                        <Pressable
                          key={tab.key}
                          {...mySessionsStyles.tabItem}
                          {...(isActive
                            ? mySessionsStyles.tabItemActive
                            : mySessionsStyles.tabItemInactive)}
                          onPress={() => setActiveTab(tab.key)}
                        >
                          <Text
                            {...mySessionsStyles.tabText}
                            {...(isActive
                              ? mySessionsStyles.tabTextActive
                              : mySessionsStyles.tabTextInactive)}
                          >
                            {t(tab.labelKey)}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </HStack>

                  <Box {...mySessionsStyles.filterSelectBox}>
                    <Select
                      options={filterOptions}
                      value={selectedFilter}
                      onChange={(val: string) => setSelectedFilter(val)}
                      size="sm"
                    />
                  </Box>
                </HStack>

                {isLoading ? (
                  <Loader />
                ) : filteredSessions.length === 0 ? (
                  <Box {...mySessionsStyles.emptyStateContainer}>
                    <Text {...mySessionsStyles.emptyStateText}>
                      {t('participantJourney.noSessions')}
                    </Text>
                  </Box>
                ) : (
                  <Box {...mySessionsStyles.cardsGrid}>
                    {filteredSessions.map(session => {
                      const modeIconName = getModeIcon(session.mode);

                      return (
                        <Pressable
                          key={session.id}
                          {...mySessionsStyles.cardPressable}
                          onPress={() => {
                            // @ts-ignore
                            navigation.navigate('session-details', { sessionId: session.id });
                          }}
                          accessibilityRole="button"
                        >
                          <Box {...mySessionsStyles.cardBox}>
                            <HStack {...mySessionsStyles.cardHeader}>
                              <Heading {...mySessionsStyles.cardTitle}>
                                {session.title}
                              </Heading>
                            </HStack>

                            {session.provider ? (
                              <Text {...mySessionsStyles.cardSubtitle}>
                                {session.provider}
                              </Text>
                            ) : null}

                            {session.datePart || session.date || session.duration || session.mode ? (
                              <HStack {...mySessionsStyles.metaRow}>
                                {session.datePart || session.date ? (
                                  <HStack alignItems="flex-start" space="xs">
                                    <LucideIcon
                                      name="Calendar"
                                      size={14}
                                      color={theme.tokens.colors.textMutedForeground}
                                      strokeWidth={1.5}
                                      style={{ marginTop: 1 }}
                                    />
                                    <HStack flexWrap="wrap" flexShrink={1} alignItems="center" space="xs">
                                      <Text {...mySessionsStyles.metaText}>
                                        {session.datePart || session.date}{session.timePart ? ',' : ''}
                                      </Text>
                                      {session.timePart ? (
                                        <Text {...mySessionsStyles.metaText}>
                                          {session.timePart}
                                        </Text>
                                      ) : null}
                                    </HStack>
                                  </HStack>
                                ) : null}

                                {session.duration ? (
                                  <HStack alignItems="center" space="xs" flexShrink={0}>
                                    <LucideIcon
                                      name="Clock"
                                      size={14}
                                      color={theme.tokens.colors.textMutedForeground}
                                      strokeWidth={1.5}
                                    />
                                    <Text {...mySessionsStyles.metaText}>
                                      {session.duration}
                                    </Text>
                                  </HStack>
                                ) : null}

                                {session.mode ? (
                                  <HStack alignItems="center" space="xs" flexShrink={0}>
                                    <LucideIcon
                                      name={modeIconName}
                                      size={14}
                                      color={theme.tokens.colors.textMutedForeground}
                                      strokeWidth={1.5}
                                    />
                                    <Text {...mySessionsStyles.metaText}>
                                      {session.mode}
                                    </Text>
                                  </HStack>
                                ) : null}
                              </HStack>
                            ) : null}

                            {session.province ? (
                              <HStack {...mySessionsStyles.locationRow}>
                                <LucideIcon
                                  name="MapPin"
                                  size={14}
                                  color={theme.tokens.colors.textMutedForeground}
                                  strokeWidth={1.5}
                                />
                                <Text
                                  {...mySessionsStyles.locationText}
                                  flexShrink={1}
                                  isTruncated
                                  numberOfLines={1}
                                >
                                  {session.province}
                                </Text>
                              </HStack>
                            ) : null}
                          </Box>
                        </Pressable>
                      );
                    })}
                  </Box>
                )}
              </>
            )}
          </VStack>
        </Container>
      </Box>
    </Box>
  );
};

export default MySessionsScreen;
