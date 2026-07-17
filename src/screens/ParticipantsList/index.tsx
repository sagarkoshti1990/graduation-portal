import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Pressable,
  Container,
  ScrollView,
  Select,
  LucideIcon,
  Button,
  ButtonIcon,
  ButtonText,
  useAlert,
  Checkbox,
  CheckboxIndicator,
  CheckboxIcon,
  CheckIcon,
} from '@ui';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import SearchBar from '@components/SearchBar';
import DataTable from '@components/DataTable';
import { getParticipantsColumns } from './ParticipantsTableConfig';
import { Participant } from '@app-types/screens';
import { useLanguage } from '@contexts/LanguageContext';
import { useDocumentTitle } from '@hooks';
import dataService from '../../services/dataService';
import type { ParticipantOverview } from '@app-types/participant';
import { STATUS, ALLOWOFFLINESTATUS, MAX_BULK_OFFLINE_DOWNLOAD } from '@constants/app.constant';
import { usePlatform } from '@utils/platform';
import { styles } from './Styles';
import { useAuth } from '@contexts/AuthContext';
import logger from '@utils/logger';
import { PageHeader } from '@components/PageHeader';
import { getTargetedSolutions } from '../../services/solutionService';
import { FILTER_KEYWORDS } from '@constants/LOG_VISIT_CARDS';
import { PAGE_SIZE_OPTIONS } from '@constants/USER_MANAGEMENT';
import { STORAGE_KEYS } from '@constants/STORAGE_KEYS';
import offlineStorage from '../../services/offlineStorage';
import { useOfflineSync } from '@contexts/OfflineSyncContext';
import BulkDownloadModal from '@components/BulkDownloadModal';

// Status value type (values of STATUS object) - used for API filter + comparisons
type StatusValue = (typeof STATUS)[keyof typeof STATUS];

// Status items interface
interface StatusFilterItem {
  key: StatusValue;
  label: string;
  count: number;
}

// Mapping between API overview keys and STATUS constants
const overviewToStatusMap = {
  notonboarded: { key: STATUS.NOT_ONBOARDED, label: 'participants.notEnrolled' },
  onboarded: { key: STATUS.ONBOARDED, label: 'participants.enrolled' },
  inprogress: { key: STATUS.IN_PROGRESS, label: 'participants.inProgress' },
  // completed: { key: STATUS.COMPLETED, label: 'participants.completed' },
  droppedout: { key: STATUS.DROPOUT, label: 'participants.droppedOut' },
  not_eligible: { key: STATUS.NOT_ELIGIBLE, label: 'participants.notEligible' },
  graduated: { key: STATUS.GRADUATED, label: 'participants.graduatedStatus' },
} as const;

/**
 * ParticipantsList Screen
 * Handles all screen-specific logic: navigation and dropout modal.
 */
const ParticipantsList: React.FC = () => {
  const { t } = useLanguage();
  const { isMobile, isWeb } = usePlatform();
  const { user } = useAuth();
  const { isOffline, offlineDataVersion } = useOfflineSync();
  const navigation = useNavigation();
  const { showAlert } = useAlert();

  // Set document title
  useDocumentTitle(t('lc.pageTitle.participants'));

  // State management
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [activeStatus, setActiveStatus] = useState<StatusValue | ''>(
    STATUS.NOT_ONBOARDED,
  );
  const [searchKey, setSearchKey] = useState('');
  const [activeFilter, setActiveFilter] = useState<'active' | 'inactive'>('active');
  const [isLoading, setIsLoading] = useState(true);
  const [overview, setOverview] = useState<ParticipantOverview | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [refetchKey, setRefetchKey] = useState(0);
  const [isReady, setIsReady] = useState(false);
  // Bulk offline download — selection mode state. Full participant row objects
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState<Map<string, Participant>>(new Map());
  const [isBulkDownloadModalOpen, setIsBulkDownloadModalOpen] = useState(false);

  // Load initial settings from offline storage on mount
  useEffect(() => {
    const loadInitialSettings = async () => {
      try {
        const [storedPageSize, storedFilter, storedStatus] = await Promise.all([
          offlineStorage.read<number>(STORAGE_KEYS.PARTICIPANTS_PAGE_SIZE),
          offlineStorage.read<'active' | 'inactive'>(STORAGE_KEYS.PARTICIPANTS_ACTIVE_FILTER),
          offlineStorage.read<StatusValue | ''>(STORAGE_KEYS.PARTICIPANTS_ACTIVE_STATUS),
        ]);

        if (storedPageSize && PAGE_SIZE_OPTIONS.includes(storedPageSize)) {
          setPageSize(storedPageSize);
        } else {
          setPageSize(PAGE_SIZE_OPTIONS[0]);
        }

        if (storedFilter) {
          setActiveFilter(storedFilter);
        }
        if (storedStatus) {
          setActiveStatus(storedStatus);
        }
      } catch (error) {
        logger.error('Error loading initial settings:', error);
        setPageSize(PAGE_SIZE_OPTIONS[0]);
      } finally {
        setIsReady(true);
      }
    };
    loadInitialSettings();
  }, []);

  // Refresh data on focus (e.g., when returning from detail screen)
  useFocusEffect(
    useCallback(() => {
      if (isReady) {
        setRefetchKey((k) => k + 1);
      }
    }, [isReady])
  );

  // Get status items directly from overview using STATUS constants
  const allStatusItems = useMemo<StatusFilterItem[]>(() => {
    if (!overview) {
      return Object.values(overviewToStatusMap).map(({ key, label }) => ({
        key,
        label,
        count: 0,
      }));
    }

    return Object.entries(overviewToStatusMap).map(([overviewKey, { key, label }]) => ({
      key,
      label,
      count: overview[overviewKey as keyof ParticipantOverview] as number || 0,
    }));
  }, [overview]);
  
  // Filter status items based on active/inactive filter
  const statusItems = useMemo<StatusFilterItem[]>(() => {
    // Active
    if (activeFilter === 'active') {

      if(isSelectionMode) {
        return allStatusItems.filter((item: StatusFilterItem) => ALLOWOFFLINESTATUS.includes(item.key));
      } 

      return allStatusItems.filter((item: StatusFilterItem) => 
        item.key === STATUS.NOT_ONBOARDED ||
        item.key === STATUS.ONBOARDED || 
        item.key === STATUS.IN_PROGRESS ||
        item.key === STATUS.COMPLETED ||
        item.key === STATUS.GRADUATED
    );
    } else {
      // inactive
      return allStatusItems.filter((item: StatusFilterItem) => 
        item.key === STATUS.DROPOUT ||
        item.key === STATUS.NOT_ELIGIBLE
      );
    }
  }, [allStatusItems, activeFilter, isSelectionMode]);

  // Calculate counts for Active and Inactive filters
  const activeInactiveCounts = useMemo(() => {
    const activeCount = allStatusItems
      .filter((item: StatusFilterItem) => 
        item.key === STATUS.NOT_ONBOARDED ||
        item.key === STATUS.ONBOARDED || 
        item.key === STATUS.IN_PROGRESS ||
        item.key === STATUS.COMPLETED ||
        item.key === STATUS.GRADUATED
    )
      .reduce((sum: number, item: StatusFilterItem) => sum + item.count, 0);
    
    const inactiveCount = allStatusItems
      .filter((item: StatusFilterItem) => 
        item.key === STATUS.DROPOUT ||
        item.key === STATUS.NOT_ELIGIBLE
      )
      .reduce((sum: number, item: StatusFilterItem) => sum + item.count, 0);
    
    return { active: activeCount, inactive: inactiveCount };
  }, [allStatusItems]);

  useEffect(() => {
    if (!isReady || !pageSize) return;
    const fetchParticipants = async () => {
        try {
          setIsLoading(true);
          const result = await dataService.getParticipantList({
            userId: user?.id as string,
            search: searchKey,
            status: activeStatus,
            page: currentPage,
            limit: pageSize ?? undefined,
          });
          setParticipants(result.data.participants || []);
          if (result.data.overview) {
            setOverview(result.data.overview);
          }
          setTotalItems(result.data.total ?? 0);
        } catch (err: any) {
          const errorMessage = err?.response?.data?.message || err?.message || 'Failed to fetch participants';
          logger.error('Error fetching participants:', errorMessage, err);
          setParticipants([]);
          setOverview(null);
          setTotalItems(0);
        } finally {
          setIsLoading(false);
        }
      };
      if (pageSize) {
        fetchParticipants();
      }
  }, [searchKey, user, activeStatus, currentPage, pageSize, refetchKey, isReady, isOffline, offlineDataVersion]);
  

  useEffect(() => {
    setCurrentPage(1);
  },[isOffline])

  // Handlers
  const handleSearch = useCallback((text: string) => {
    // Search functionality can be implemented here when needed
    setSearchKey(text);
    setCurrentPage(1); // Reset to first page when search changes
  }, []);

  const handleStatusChange = useCallback((status: StatusValue | '') => {
    setActiveStatus(status);
    setCurrentPage(1); // Reset to first page when status changes
    offlineStorage.create(STORAGE_KEYS.PARTICIPANTS_ACTIVE_STATUS, status);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback(async (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when page size changes
    // Save to isOffline storage
    try {
      await offlineStorage.create(STORAGE_KEYS.PARTICIPANTS_PAGE_SIZE, size);
    } catch (error) {
      logger.error('Error saving page size to storage:', error);
    }
  }, []);

  // Toggle one participant's bulk-download selection, enforcing MAX_BULK_OFFLINE_DOWNLOAD.
  const toggleSelectParticipant = useCallback((participant: Participant) => {
    setSelectedParticipants(prev => {
      const next = new Map(prev);
      if (next.has(participant.userId)) {
        next.delete(participant.userId);
        return next;
      }
      if (next.size >= MAX_BULK_OFFLINE_DOWNLOAD) {
        showAlert('error', t('participants.maxBulkSelectionReached', { max: MAX_BULK_OFFLINE_DOWNLOAD }));
        return prev;
      }
      next.set(participant.userId, participant);
      return next;
    });
  }, [showAlert, t]);

  const handleRowClick = useCallback(
    (participant: Participant) => {
      if (isSelectionMode) {
        if (ALLOWOFFLINESTATUS.includes(participant.status as string) && participant?.onBoardedProjectId) {
          toggleSelectParticipant(participant);
        }
        return;
      }
      // @ts-ignore
      navigation.navigate('participant-detail', {
        id: participant.userId,
      });
    },
    [navigation, isSelectionMode, toggleSelectParticipant],
  );

  const handleDropoutSuccess = useCallback(() => {
    // Refetch to sync overview counts + ensure inactive Dropped Out list includes participant
    setRefetchKey((k) => k + 1);
  }, []);

  // Bulk offline download — participants on the current page eligible for download,
  // mirroring the same ALLOWOFFLINESTATUS gate used by the single-row "Download Offline" action.
  const eligibleOnPage = useMemo(
    () => participants.filter(p => ALLOWOFFLINESTATUS.includes(p.status as string) && p.onBoardedProjectId),
    [participants],
  );

  const selectedOnPageCount = useMemo(
    () => eligibleOnPage.filter(p => selectedParticipants.has(p.userId)).length,
    [eligibleOnPage, selectedParticipants],
  );
  const allOnPageSelected = eligibleOnPage.length > 0 && selectedOnPageCount === eligibleOnPage.length;

  const toggleSelectAllOnPage = useCallback(() => {
    setSelectedParticipants(prev => {
      const next = new Map(prev);
      if (allOnPageSelected) {
        eligibleOnPage.forEach(p => next.delete(p.userId));
        return next;
      }
      let truncated = false;
      for (const p of eligibleOnPage) {
        if (next.has(p.userId)) continue;
        if (next.size >= MAX_BULK_OFFLINE_DOWNLOAD) {
          truncated = true;
          break;
        }
        next.set(p.userId, p);
      }
      if (truncated) {
        showAlert('error', t('participants.maxBulkSelectionReached', { max: MAX_BULK_OFFLINE_DOWNLOAD }));
      }
      return next;
    });
  }, [allOnPageSelected, eligibleOnPage, showAlert, t]);

  const handleEnterSelectionMode = useCallback(() => {
    setIsSelectionMode(true);
    setActiveFilter("active");
    setActiveStatus(STATUS.NOT_ONBOARDED);
    setSelectedParticipants(new Map());
  }, []);

  const handleCancelSelection = useCallback(() => {
    setIsSelectionMode(false);
    setSelectedParticipants(new Map());
  }, []);

  const handleBulkDownloadClose = useCallback((type:string) => {
    setIsBulkDownloadModalOpen(false);
    if(type === "close") {
      setIsSelectionMode(false);
      setSelectedParticipants(new Map());
    }
  }, []);

  const handleBulkDownloadSuccess = useCallback(() => {
    setRefetchKey((k) => k + 1);
  }, []);

  // Prepend a selection checkbox to the "name" column's render when selection
  // mode is active — reuses the existing checkbox pattern (UserAvatarCard) and
  // DataTable's column/render extensibility instead of a new selection mechanism.
  const tableColumns = useMemo(() => {
    const baseColumns = getParticipantsColumns(activeStatus || undefined, {
      onDropoutSuccess: handleDropoutSuccess,
    });
    if (!isSelectionMode) return baseColumns;

    return baseColumns.map(col => {
      if (col.key !== 'name') return col;
      const originalRender = col.render;
      return {
        ...col,
        render: (participant: Participant) => {
          const eligible = ALLOWOFFLINESTATUS.includes(participant.status as string) && participant?.onBoardedProjectId;
          return (
            <HStack space="sm" alignItems="center">
              {eligible ? (
                <Pressable
                  onPress={() => {}}
                  $web-onClick={(e: any) => e?.stopPropagation?.()}
                  $web-onMouseDown={(e: any) => e?.stopPropagation?.()}
                >
                  <Checkbox
                    value={participant.userId}
                    isChecked={selectedParticipants.has(participant.userId)}
                    onChange={() => toggleSelectParticipant(participant)}
                  >
                    <CheckboxIndicator borderWidth={1} borderColor="$textForeground">
                      <CheckboxIcon as={CheckIcon} color="$modalBackground" />
                    </CheckboxIndicator>
                  </Checkbox>
                </Pressable>
              ) : (
                <Box width={18} height={18} />
              )}
              {originalRender ? originalRender(participant) : <Text>{participant.name}</Text>}
            </HStack>
          );
        },
      };
    });
  }, [activeStatus, handleDropoutSuccess, isSelectionMode, selectedParticipants, toggleSelectParticipant]);

  return (
    <Box {...styles.mainContainer}>
      <ScrollView {...styles.scrollView}>
        <PageHeader title={t('participants.myParticipants')} />
        <Container>
          <VStack {...styles.contentVStack}>
            {/* Search Bar and Active/Inactive Filter */}
            <HStack {...styles.searchFilterHStack}>
              <Box {...styles.searchBarContainer}>
                <SearchBar
                  placeholder={t('participants.searchByNameOrId')}
                  onSearch={handleSearch}
                  debounceMs={500}
                  defaultValue={searchKey}
                />
              </Box>
              {!isSelectionMode &&
                <Box {...styles.selectContainer}>
                  <Select
                    options={[
                      { label: `${t('participants.active')} (${activeInactiveCounts.active})`, value: 'active' },
                      { label: `${t('participants.inactive')} (${activeInactiveCounts.inactive})`, value: 'inactive' },
                    ]}
                    value={activeFilter}
                    onChange={(value) => {
                      const nextFilter = value as 'active' | 'inactive';
                      setActiveFilter(nextFilter);
                      const nextStatus = nextFilter === 'inactive' ? STATUS.DROPOUT : STATUS.NOT_ONBOARDED;
                      setActiveStatus(nextStatus);
                      offlineStorage.create(STORAGE_KEYS.PARTICIPANTS_ACTIVE_FILTER, nextFilter);
                      offlineStorage.create(STORAGE_KEYS.PARTICIPANTS_ACTIVE_STATUS, nextStatus);
                    }}
                  />
                </Box>
              }
              {!isOffline && (
                <Box {...styles.buttonContainer}>
                  <GroupCheckInsButton />
                </Box>
              )}
              {!isOffline && !isWeb && !isSelectionMode && activeFilter !== "inactive" && (
                <Box {...styles.buttonContainer}>
                  {/* @ts-ignore */}
                  <Button variant="outlineghost" size="sm" onPress={handleEnterSelectionMode}>
                    <ButtonIcon as={LucideIcon} name="ListChecks" mr="$2" />
                    <ButtonText>{t('participants.bulkDownload')}</ButtonText>
                  </Button>
                </Box>
              )}
            </HStack>

            {/* Bulk download selection toolbar — shown while selection mode is active */}
            {isSelectionMode && (
              <HStack {...styles.searchFilterHStack} flexWrap="wrap">
                <HStack {...styles.searchFilterHStackSub}>
                  <Pressable onPress={toggleSelectAllOnPage} p="$2">
                    <HStack space="xs" alignItems="center">
                      <Checkbox isChecked={allOnPageSelected} value="select-all-on-page">
                        <CheckboxIndicator borderWidth={1} borderColor="$textForeground">
                          <CheckboxIcon as={CheckIcon} color="$modalBackground" />
                        </CheckboxIndicator>
                      </Checkbox>
                      <Text fontSize="$sm" color="$textPrimary">{t('participants.selectAllOnPage')}</Text>
                    </HStack>
                  </Pressable>

                  <Text fontSize="$sm" color="$textMutedForeground">
                    {t('participants.selectedCount', { count: selectedParticipants.size, max: MAX_BULK_OFFLINE_DOWNLOAD })}
                  </Text>
                </HStack>
                <HStack {...styles.searchFilterHStackButton}>
                  <Button
                    variant="solid"
                    isDisabled={selectedParticipants.size === 0}
                    onPress={() => setIsBulkDownloadModalOpen(true)}
                    {...styles.searchFilterHStackButtonSub}
                  >
                    <ButtonIcon as={LucideIcon} name="Download" mr="$2" />
                    <ButtonText>
                      {t('participants.downloadSelected', { count: selectedParticipants.size })}
                    </ButtonText>
                  </Button>

                  {/* @ts-ignore */}
                  <Button variant="outlineghost"
                    {...styles.searchFilterHStackButtonSub}
                    onPress={handleCancelSelection}
                   >
                    <ButtonText>{t('participants.cancelSelection')}</ButtonText>
                  </Button>
                </HStack>
              </HStack>
            )}

            {/* Status Filter Bar - Desktop: Filter buttons, Mobile: Dropdown */}
            {isMobile ? (
              <Box {...styles.mobileStatusSelectContainer}>
                <Select
                  options={statusItems.map((item: StatusFilterItem) => ({
                    label: `${t(item.label)} (${item.count})`,
                    value: item.key,
                  }))}
                  value={activeStatus}
                  onChange={(value) => handleStatusChange(value as StatusValue | '')}
                  placeholder={t('participants.selectStatus') || 'Select Status'}
                />
              </Box>
            ) : (
              <Box {...styles.desktopFilterContainer}>
                <HStack {...styles.desktopFilterHStack}>
                  {statusItems.map((item: StatusFilterItem) => {
                    const isActive = activeStatus === item.key;

                    return (
                      <Pressable
                        key={item.key}
                        onPress={() => handleStatusChange(item.key)}
                        {...styles.statusItemPressable}
                        {...(isActive ? styles.statusItemPressableActive : styles.statusItemPressableInactive)}
                      >
                        <HStack {...styles.statusItemHStack}>
                          <Text
                            {...styles.statusLabelText}
                            {...(isActive ? styles.statusLabelTextActive : styles.statusLabelTextInactive)}
                          >
                            {t(item.label)}
                          </Text>
                          <Box
                            {...styles.countBadgeBox}
                            {...(isActive ? styles.countBadgeBoxActive : styles.countBadgeBoxInactive)}
                          >
                            <Text
                              {...styles.countText}
                              {...(isActive ? styles.countTextActive : styles.countTextInactive)}
                            >
                              {item.count}
                            </Text>
                          </Box>
                        </HStack>
                      </Pressable>
                    );
                  })}
                </HStack>
              </Box>
            )}

            {/* Participants Table */}
            <DataTable
              data={participants}
              columns={tableColumns}
              getRowKey={participant => participant.userId}
              onRowClick={handleRowClick}
              isLoading={isLoading}
              emptyMessage={t('participants.noParticipantsFound')}
              loadingMessage={t('participants.loadingParticipants')}
              pagination={{
                enabled: true,
                pageSize: pageSize ?? undefined,
                maxPageNumbers: 5,
                showPageSizeSelector: true,
                pageSizeOptions: PAGE_SIZE_OPTIONS,
                serverSide: {
                  count: currentPage,
                  total: totalItems,
                },
              }}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </VStack>
        </Container>
      </ScrollView>

      <BulkDownloadModal
        isOpen={isBulkDownloadModalOpen}
        onClose={handleBulkDownloadClose}
        participants={Array.from(selectedParticipants.values())}
        onSuccess={handleBulkDownloadSuccess}
      />
    </Box>
  );
};

export default ParticipantsList;

// Helper hook/component for Group Check-Ins
const GroupCheckInsButton: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { showAlert } = useAlert();
  const [isLoading, setIsLoading] = useState(false);

  const handleGroupCheckIns = async () => {
    try {
      setIsLoading(true);
      // Call the API with keyword filter (e.g. "checkin") and send userId for auth context
      const response = await getTargetedSolutions({
        type: 'observation',
        // @ts-ignore - filter[keywords] is a valid parameter
        "filter[keywords]": FILTER_KEYWORDS.GROUP_CHECK_IN.join(',')
      });
      // Assume the API returns an array of solutions, pick the first one
      const solution = response?.[0];
      if (solution && solution?.solutionId) {
      // Navigate to the group check-in details page or solution details
        // @ts-ignore
        navigation.navigate('observation', {
          id: user?.id as string,
          solutionId: solution.solutionId,
          redirectUrl: 'participants',
        });
      } else {
        // Optionally show error (toast/snackbar)
        showAlert('error', t('participants.groupCheckInsNoSolutions'));
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to fetch targeted solutions';
      logger.error('Error fetching targeted solutions:', errorMessage, err);
      // Handle error (log or UI feedback)
      showAlert('error', t('participants.fetchSolutionsError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button variant="solid" size="sm" onPress={handleGroupCheckIns} isDisabled={isLoading}>
      <ButtonIcon as={LucideIcon} name={isLoading?"LoaderCircle":"Users"} mr="$2" />
      <ButtonText>{t('participants.groupCheckIns')}</ButtonText>
    </Button>
  );
};

export { GroupCheckInsButton };
