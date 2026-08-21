import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { FlatList, ActivityIndicator } from 'react-native';
import Modal from '@components/ui/Modal';
import { theme } from '@config/theme';
import { VStack, HStack, Text, Button, ButtonText, Pressable, LucideIcon, Box, Input, InputField, InputSlot, } from '@ui';
import { STATUS as PARTICIPANT_DISPLAY_STATUS } from '@constants/PARTICIPANTS_LIST';
import { STATUS } from '@constants/app.constant';
import { getStatusColors } from '../../../ParticipantsList/StatusBadge';
import { getInitials } from '@utils/helper';
import { useAuth } from '@contexts/AuthContext';
import { getParticipants } from '../../../../services/SessionSupportServices/sessionRequestorService';
import styles from '../../styles';

interface AssignParticipantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: any;
  onConfirm: (selectedIds: string[]) => void;
}

const PAGE_SIZE = 20;
const DEBOUNCE_MS = 500;

export default function AssignParticipantsModal({
  isOpen,
  onClose,
  session,
  onConfirm,
}: AssignParticipantsModalProps): React.JSX.Element {
  const { user } = useAuth();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [participants, setParticipants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [total, setTotal] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Memoized extraData for FlatList performance and re-rendering on status/loading changes
  const extraData = useMemo(() => ({ isLoading, selectedIds }), [isLoading, selectedIds]);

  // Refs for race-condition prevention and debounced search
  const isLoadingRef = useRef(false);
  const requestCountRef = useRef(0);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasMore = total === null || participants.length < total;

  /**
   * Core paginated fetch — mirrors the Choose Supervisor doFetch pattern.
   * `reset = true` clears the list (used for modal open, search, etc.).
   * `requestCountRef` ensures stale responses from earlier requests are discarded.
   */
  const doFetch = useCallback(
    async (page: number, search: string, reset: boolean) => {
      if (!user?.id) return;
      if (!reset && (isLoadingRef.current)) return;

      const requestId = ++requestCountRef.current;
      isLoadingRef.current = true;
      setIsLoading(true);

      if (reset) {
        setParticipants([]);
        setTotal(null);
        setCurrentPage(1);
      }

      try {
        const response = await getParticipants({
          userId: user.id,
          page,
          limit: PAGE_SIZE,
          search: search || undefined,
        });

        // Discard response if a newer request has been initiated
        if (requestId !== requestCountRef.current) return;

        const fetchedList: any[] = response?.result?.data || [];
        // Client-side filter: exclude dropped-out and graduated participants
        const eligible = fetchedList.filter((p) => p.status !== STATUS.DROPOUT && p.status !== STATUS.GRADUATED,);

        // Total from the API; fall back to fetched data length
        const apiTotal = response?.count ?? response?.total ?? fetchedList.length;

        setTotal(apiTotal);
        setCurrentPage(page);
        setParticipants((prev) => (reset ? eligible : [...prev, ...eligible]));
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

  // Fetch first page when the modal opens; reset all state
  useEffect(() => {
    if (!isOpen) return;
    setSelectedIds([]);
    setSearchQuery('');
    isLoadingRef.current = false;
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    doFetch(1, '', true);
  }, [isOpen, doFetch]);

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
        {...styles.assignParticipantsCancelButton}
        onPress={onClose}>
        <ButtonText {...styles.assignParticipantsCancelButtonText}>
          Cancel
        </ButtonText>
      </Button>
      <Button
        {...styles.assignParticipantsConfirmButton}
        onPress={() => {
          onConfirm(selectedIds);
          onClose();
        }}
        disabled={selectedIds.length === 0 || isLoading}
        opacity={selectedIds.length === 0 || isLoading ? 0.5 : 1}>
        <ButtonText {...styles.assignParticipantsConfirmButtonText}>
          Assign Session
        </ButtonText>
      </Button>
    </HStack>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      headerTitle="Assign Participants to Session"
      headerDescription={`Select participants from your caseload to assign to "${sessionName}"`}
      showCloseButton={true}
      footerContent={footerContent}
      bodyProps={styles.assignParticipantsModalBodyProps}
    >
      <VStack {...styles.assignParticipantsContentVStack}>
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
        <HStack {...styles.assignParticipantsCountHeaderHStack}>
          <HStack {...styles.assignParticipantsCountLeftHStack}>
            <LucideIcon name="Users" size={14} color="$textMuted" />
            <Text {...styles.assignParticipantsCountLeftText}>
              {total !== null ? total : '–'} eligible participants
            </Text>
          </HStack>
          <HStack {...styles.assignParticipantsCountRightHStack}>
            <Text {...styles.assignParticipantsCountRightText}>
              {selectedIds.length} selected
            </Text>
            {selectedIds.length > 0 && (
              <Pressable onPress={() => setSelectedIds([])}>
                <Text {...styles.assignParticipantsClearAllText}>
                  Clear
                </Text>
              </Pressable>
            )}
          </HStack>
        </HStack>

        {/* Scrollable participant list (FlatList for virtualised incremental loading) */}
        <FlatList
          data={participants}
          extraData={extraData}
          keyExtractor={(p) => p.userId}
          renderItem={({ item: p }) => {
            const isSelected = selectedIds.includes(p.userId);
            const colors = getStatusColors(p.status || '');
            const displayStatus =
              PARTICIPANT_DISPLAY_STATUS[
              p.status as keyof typeof PARTICIPANT_DISPLAY_STATUS
              ] || p.status;
            const progressPercentage =
              p.idpProgress?.completionPercentage ?? 0;

            return (
              <Pressable
                onPress={() => {
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
                      <Text {...styles.assignParticipantsMetaText}>
                        •
                      </Text>
                      <Text {...styles.assignParticipantsMetaText}>
                        {progressPercentage}% Progress
                      </Text>
                    </HStack>
                  </VStack>

                  {/* Status Badge */}
                  <Box
                    {...styles.assignParticipantsBadge}
                    bg={colors.bg}
                    borderColor={colors.border}>
                    <Text
                      {...styles.assignParticipantsBadgeText}
                      color={colors.text}>
                      {displayStatus}
                    </Text>
                  </Box>
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
                    No results found
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
      </VStack>
    </Modal>
  );
}
