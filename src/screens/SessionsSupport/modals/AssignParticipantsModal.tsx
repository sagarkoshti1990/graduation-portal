import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { FlatList, ActivityIndicator } from 'react-native';
import Modal from '@components/ui/Modal';
import { theme } from '@config/theme';
import { VStack, HStack, Text, Button, ButtonText, Pressable, LucideIcon, Box, Input, InputField, InputSlot, } from '@ui';
import { STATUS as PARTICIPANT_DISPLAY_STATUS } from '@constants/PARTICIPANTS_LIST';
import { STATUS, USER_STATUS } from '@constants/app.constant';
import { getStatusColors } from '../../ParticipantsList/StatusBadge';
import { getInitials } from '@utils/helper';
import { useAuth } from '@contexts/AuthContext';
import { getParticipants, getEnrolledMenteeIds } from '../../../services/SessionSupportServices/sessionRequestorService';
import { useLanguage } from '@contexts/LanguageContext';
import styles from '../styles';
import ConfirmAssignment from './ConfirmAssignment';
import ParticipantStatusBadge from './ParticipantStatusBadge';

interface AssignParticipantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: any;
  onConfirm: (selectedIds: string[]) => Promise<boolean> | void;
  skipEnrolledCheck?: boolean;
  title?: string;
  description?: string;
  submitActionVerb?: string;
  confirmTitle?: string;
  confirmSubtitle?: string;
  confirmButtonLabel?: string;
  /** Max participants that can be selected (e.g. the session's seats_remaining); no limit when omitted */
  maxSelectable?: number | string | null;
}

const PAGE_SIZE = 5;
const DEBOUNCE_MS = 500;

export default function AssignParticipantsModal({
  isOpen,
  onClose,
  session,
  onConfirm,
  skipEnrolledCheck = false,
  title,
  description,
  submitActionVerb,
  confirmTitle,
  confirmSubtitle,
  confirmButtonLabel,
  maxSelectable,
}: AssignParticipantsModalProps): React.JSX.Element {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const parsedSeatLimit = maxSelectable === null || maxSelectable === undefined || maxSelectable === '' ? NaN : Number(maxSelectable);
  const seatLimit = Number.isFinite(parsedSeatLimit) ? Math.max(0, parsedSeatLimit) : undefined;
  const isSeatLimitReached = seatLimit !== undefined && selectedIds.length >= seatLimit;
  const isOverSeatLimit = seatLimit !== undefined && selectedIds.length > seatLimit;

  const [searchQuery, setSearchQuery] = useState('');
  const [participants, setParticipants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [total, setTotal] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isRawExhausted, setIsRawExhausted] = useState(false);
  const [enrolledLookupError, setEnrolledLookupError] = useState(false);
  const enrolledIdsRef = useRef<Set<string>>(new Set());

  const selectedParticipants = useMemo(() => {
    return participants.filter((p) => selectedIds.includes(p.userId));
  }, [participants, selectedIds]);

  // Memoized extraData for FlatList performance and re-rendering on status/loading changes
  const extraData = useMemo(() => ({ isLoading, selectedIds }), [isLoading, selectedIds]);

  // Refs for race-condition prevention and debounced search
  const isLoadingRef = useRef(false);
  const requestCountRef = useRef(0);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasMore = !isRawExhausted;

  /**
   * Core paginated fetch — mirrors the Choose Supervisor doFetch pattern.
   * `reset = true` clears the list (used for modal open, search, etc.).
   * `requestCountRef` ensures stale responses from earlier requests are discarded.
   */
  const doFetch = useCallback(
    async (startPage: number, search: string, reset: boolean) => {
      if (!user?.id) return;
      if (!reset && (isLoadingRef.current)) return;

      const requestId = ++requestCountRef.current;
      isLoadingRef.current = true;
      setIsLoading(true);

      if (reset) {
        setParticipants([]);
        setTotal(null);
        setCurrentPage(1);
        setIsRawExhausted(false);
      }

      try {
        let page = startPage;
        let accumulated: any[] = [];
        let apiTotal = 0;
        let lastPageFetched = startPage;
        let reachedRawEnd = false;

        for (let guard = 0; guard < 20; guard++) {
          const response = await getParticipants({
            userId: user.id,
            page,
            limit: PAGE_SIZE,
            search: search || undefined,
            status: `${STATUS.IN_PROGRESS},${STATUS.GRADUATED}`,
          });

          // Discard response if a newer request has been initiated
          if (requestId !== requestCountRef.current) return;

          const fetchedList: any[] = response?.result?.data || [];
          apiTotal = response?.total ?? response?.count ?? apiTotal;
          lastPageFetched = page;

          // Skip participants already in the session and deactivated accounts
          const eligible = fetchedList.filter(
            (p) =>
              !enrolledIdsRef.current.has(String(p.userId)) &&
              p.userDetails?.status !== USER_STATUS.INACTIVE,
          );
          accumulated = accumulated.concat(eligible);

          const isLastRawPage = fetchedList.length < PAGE_SIZE;
          if (isLastRawPage) reachedRawEnd = true;
          if (accumulated.length >= PAGE_SIZE || isLastRawPage) break;

          page += 1;
        }

        setTotal(apiTotal);
        setIsRawExhausted(reachedRawEnd);
        setCurrentPage(lastPageFetched);
        setParticipants((prev) => {
          const combined = reset ? accumulated : [...prev, ...accumulated];
          const seen = new Set<string>();
          return combined.filter((p) => {
            const id = String(p.userId);
            if (seen.has(id)) return false;
            seen.add(id);
            return true;
          });
        });
      } catch (error) {
        if (requestId === requestCountRef.current) {
          console.error('Error fetching participants:', error);
        }
      } finally {
        if (requestId === requestCountRef.current) {
          isLoadingRef.current = false;
          setIsLoading(false);
        }
      }
    },
    [user?.id],
  );

  // Loads the enrolled-mentee ids for the session, then kicks off the eligible-participants fetch. This is done on modal open and on search reset.
  const loadEnrolledAndFetch = useCallback(async () => {
    const sessionId = session?.id || session?._id;
    setEnrolledLookupError(false);
    try {
      let ids: string[] = [];
      if (sessionId) {
        ids = await getEnrolledMenteeIds(sessionId);
      }
      enrolledIdsRef.current = new Set(ids);
      doFetch(1, '', true);
    } catch (error) {
      console.error('Error fetching enrolled mentees:', error);
      setEnrolledLookupError(true);
    }
  }, [session?.id, session?._id, doFetch]);

  // Fetch first page when the modal opens; reset all state
  useEffect(() => {
    if (!isOpen) return;
    setSelectedIds([]);
    setSearchQuery('');
    isLoadingRef.current = false;
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    loadEnrolledAndFetch();
  }, [isOpen, loadEnrolledAndFetch]);

  // Debounced search — resets pagination and list on each new query
  const handleSearch = useCallback(
    (text: string) => {
      setSearchQuery(text);
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      searchTimerRef.current = setTimeout(() => {
        doFetch(1, text, true);
      }, DEBOUNCE_MS);
    },
    [doFetch],
  );

  if (!isOpen) return <></>;

  const sessionName = session?.title || session?.name || '';

  const footerContent = (
    <HStack {...styles.assignParticipantsFooterContainer}>
      <Button
        variant="outlineghost"
        {...styles.assignParticipantsCancelButton}
        onPress={onClose}>
        <ButtonText {...styles.assignParticipantsCancelButtonText}>
          {t('lc.sessionsSupport.assignParticipantsModal.cancel')}
        </ButtonText>
      </Button>
      <Button
        variant="solid"
        {...styles.assignParticipantsConfirmButton}
        onPress={() => {
          setIsConfirmOpen(true);
        }}
        disabled={selectedIds.length === 0 || isLoading || enrolledLookupError || isOverSeatLimit}
        opacity={selectedIds.length === 0 || isLoading || enrolledLookupError || isOverSeatLimit ? 0.5 : 1}>
        <ButtonText {...styles.assignParticipantsConfirmButtonText}>
          {t('lc.sessionsSupport.assignParticipantsModal.assignButtonText', { defaultValue: `${submitActionVerb || 'Assign'} ({{count}})`, count: selectedIds.length })}
        </ButtonText>
      </Button>
    </HStack>
  );

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="lg"
        headerTitle={title || 'Assign Participants to Session'}
        headerDescription={description || `Select participants from your caseload to assign to "${sessionName}"`}
        showCloseButton={true}
        footerContent={footerContent}
        bodyProps={styles.assignParticipantsModalBodyProps}
      >
        <VStack {...styles.assignParticipantsContentVStack}>
          {enrolledLookupError ? (
            <Box {...styles.assignParticipantsEmptyContainer}>
              <LucideIcon name="AlertTriangle" size={36} color="$textMutedForeground" />
              <Text {...styles.assignParticipantsEmptyText}>
                {t('lc.sessionsSupport.assignParticipantsModal.enrolledLookupFailed', 'Could not check already-enrolled participants. Please try again.')}
              </Text>
              <Button variant="outline" mt="$3" onPress={loadEnrolledAndFetch}>
                <ButtonText>
                  {t('common.retry', 'Retry')}
                </ButtonText>
              </Button>
            </Box>
          ) : (
          <>
          {/* Search Input */}
          <Input {...styles.assignParticipantsSearchInput}>
            <InputSlot>
              <LucideIcon name="Search" size={18} color="$textMutedForeground" />
            </InputSlot>
            <InputField
              placeholder="Search participants by name or ID..."
              value={searchQuery}
              onChangeText={handleSearch}
              autoCapitalize="none"
              autoCorrect={false} />
          </Input>

          {/* Counts display + Clear All */}
          <HStack {...styles.assignParticipantsCountHeaderHStack} py="$3.5">
            <HStack {...styles.assignParticipantsCountLeftHStack}>
              <LucideIcon name="Users" size={14} color="$textMuted" />
              <Text {...styles.assignParticipantsCountLeftText}>
                <Text fontWeight="$medium" color="$black">
                  {total !== null ? `${participants.length}${hasMore ? '+' : ''}` : '–'}{' '}
                </Text>
                {t('lc.sessionsSupport.assignParticipantsModal.eligibleParticipants', 'eligible participants')}
              </Text>
            </HStack>
            <HStack {...styles.assignParticipantsCountRightHStack}>
              <Text {...styles.assignParticipantsCountRightText}>
                {selectedIds.length} {t('lc.sessionsSupport.assignParticipantsModal.selected', 'selected')}
              </Text>
              {selectedIds.length > 0 && (
                <>
                  <Box {...styles.assignParticipantsDivider} />
                  <Pressable onPress={() => setSelectedIds([])}>
                    <Text {...styles.assignParticipantsClearAllText}>
                      {t('lc.sessionsSupport.assignParticipantsModal.clear', 'Clear')}
                    </Text>
                  </Pressable>
                </>
              )}
            </HStack>
          </HStack>

          {seatLimit !== undefined && (
            <Text fontSize="$xs" color={isSeatLimitReached ? '$error600' : '$textMuted'} mb="$2">
              {seatLimit === 0
                ? t('lc.sessionsSupport.assignParticipantsModal.noSeatsLeft', 'No seats left in this session.')
                : t('lc.sessionsSupport.assignParticipantsModal.seatsLeft', {
                    defaultValue: 'Only {{count}} seat(s) available - you can assign up to {{count}} participant(s).',
                    count: seatLimit,
                  })}
            </Text>
          )}

          {/* Scrollable participant list (FlatList for virtualised incremental loading) */}
          <FlatList
            data={participants}
            extraData={extraData}
            keyExtractor={(p) => p.userId}
            renderItem={({ item: p }) => {
              const isSelected = selectedIds.includes(p.userId);
              // Once every available seat is taken, only already-selected participants can be toggled
              const isSelectionBlocked = !isSelected && isSeatLimitReached;

              return (
                <Pressable
                  disabled={isSelectionBlocked}
                  opacity={isSelectionBlocked ? 0.5 : 1}
                  onPress={() => {
                    if (isSelectionBlocked) return;
                    setSelectedIds((prev) =>
                      prev.includes(p.userId)
                        ? prev.filter((id) => id !== p.userId)
                        : [...prev, p.userId],
                    );
                  }}
                  {...styles.assignParticipantsCard}
                  borderColor={isSelected ? '$primary500' : '$borderColor'}
                  sx={{
                    ':hover': {
                      borderColor: isSelected ? '$primary500' : '$primary300',
                    },
                  }}
                  style={styles.assignParticipantsCardStyle}>
                  <HStack alignItems="center" space="md" width="100%">
                    {/* Circular checkbox indicator */}
                    <Box {...styles.assignParticipantsCheckboxBase} borderColor={isSelected ? '$primary500' : '$borderColor'} bg={isSelected ? '$primary500' : 'transparent'}>
                      {isSelected && (
                        <LucideIcon name="Check" size={12} color="$white" />
                      )}
                    </Box>

                    {/* Info */}
                    <VStack {...styles.assignParticipantsInfoVStack}>
                      <Text {...styles.assignParticipantsNameText}>
                        {p.name}
                      </Text>
                      <HStack {...styles.assignParticipantsMetaHStack}>
                        <Text {...styles.assignParticipantsMetaText}>
                          {p.userId}
                        </Text>
                        {/* <Text {...styles.assignParticipantsMetaText}>
                        •
                      </Text>
                      <Text {...styles.assignParticipantsMetaText}>
                        {progressPercentage}% Progress
                      </Text> */}
                      </HStack>
                    </VStack>

                    {/* Status Badge */}
                    <ParticipantStatusBadge status={p.status || ''} />
                  </HStack>
                </Pressable>
              );
            }}
            style={styles.assignParticipantsFlatList}
            contentContainerStyle={styles.assignParticipantsFlatListContent}
            onEndReached={() => {
              if (!isLoadingRef.current && hasMore && total !== null) {
                doFetch(currentPage + 1, searchQuery, false);
              }
            }}
            onEndReachedThreshold={0.5}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator
            ListEmptyComponent={() => {
              if (isLoading) {
                return (
                  <Box {...styles.assignParticipantsLoadingContainer}>
                    <ActivityIndicator size="large" color={theme.tokens.colors.primary500} />
                  </Box>
                );
              }
              if (total !== null) {
                return (
                  <Box {...styles.assignParticipantsEmptyContainer}>
                    <LucideIcon name="SearchX" size={36} color="$textMutedForeground" />
                    <Text {...styles.assignParticipantsEmptyText}>
                      {t('lc.sessionsSupport.assignParticipantsModal.noResultsFound', 'No results found')}
                    </Text>
                  </Box>
                );
              }
              return null;
            }}
            ListFooterComponent={() => {
              if (isLoading && participants.length > 0) {
                return (
                  <Box {...styles.assignParticipantsFooterLoadingContainer}>
                    <ActivityIndicator size="small" color={theme.tokens.colors.primary500} />
                  </Box>
                );
              }
              return null;
            }}
          />
          </>
          )}
        </VStack>
      </Modal>

      <ConfirmAssignment
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={async () => {
          const success = await onConfirm(selectedIds);
          if (success) {
            setIsConfirmOpen(false);
            onClose();
          }
        }}
        session={session}
        selectedParticipants={selectedParticipants}
        title={confirmTitle}
        subtitle={confirmSubtitle}
        confirmButtonLabel={confirmButtonLabel}
      />
    </>
  );
}
