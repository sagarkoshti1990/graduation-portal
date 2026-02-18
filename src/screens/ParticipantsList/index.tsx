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
} from '@ui';
import { useNavigation } from '@react-navigation/native';
import SearchBar from '@components/SearchBar';
import DataTable from '@components/DataTable';
import { getParticipantsColumns } from './ParticipantsTableConfig';
import { Participant } from '@app-types/screens';
import { useLanguage } from '@contexts/LanguageContext';
import { getParticipantsList } from '../../services/participantService';
import type { ParticipantOverview } from '@app-types/participant';
import { STATUS } from '@constants/app.constant';
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

// Status key type (keys of STATUS object)
type StatusKey = keyof typeof STATUS;

// Status items interface
interface StatusFilterItem {
  key: StatusKey;
  label: string;
  count: number;
}

// Mapping between API overview keys and STATUS constants
const overviewToStatusMap = {
  notonboarded: { key: STATUS.NOT_ONBOARDED as StatusKey, label: 'participants.notEnrolled' },
  onboarded: { key: STATUS.ONBOARDED as StatusKey, label: 'participants.enrolled' },
  inprogress: { key: STATUS.IN_PROGRESS as StatusKey, label: 'participants.inProgress' },
  completed: { key: STATUS.COMPLETED as StatusKey, label: 'participants.completed' },
  droppedout: { key: STATUS.DROPOUT as StatusKey, label: 'participants.droppedOut' },
  graduated: { key: STATUS.GRADUATED as StatusKey, label: 'participants.graduatedStatus' },
} as const;

/**
 * ParticipantsList Screen
 * Handles all screen-specific logic: navigation and dropout modal.
 */
const ParticipantsList: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useLanguage();
  const { isMobile } = usePlatform();
  const { user } = useAuth();

  // State management
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [activeStatus, setActiveStatus] = useState<StatusKey | ''>(
    'NOT_ONBOARDED',
  );
  const [searchKey, setSearchKey] = useState('');
  const [activeFilter, setActiveFilter] = useState<'active' | 'inactive'>('active');
  const [isLoading, setIsLoading] = useState(true);
  const [overview, setOverview] = useState<ParticipantOverview | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | null>(null);
  const [totalItems, setTotalItems] = useState(0);

  // Load pageSize from offline storage on mount
  useEffect(() => {
    const loadPageSize = async () => {
      try {
        const storedPageSize = await offlineStorage.read<number>(STORAGE_KEYS.PARTICIPANTS_PAGE_SIZE);
        if (storedPageSize && PAGE_SIZE_OPTIONS.includes(storedPageSize)) {
          setPageSize(storedPageSize);
        } else {
          setPageSize(PAGE_SIZE_OPTIONS[0]);
        }
      } catch (error) {
        logger.error('Error loading page size from storage:', error);
        setPageSize(PAGE_SIZE_OPTIONS[0]);
      }
    };
    loadPageSize();
  }, []);

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
      return allStatusItems.filter((item: StatusFilterItem) => 
        item.key === STATUS.NOT_ONBOARDED ||
        item.key === STATUS.ONBOARDED || 
        item.key === STATUS.IN_PROGRESS ||
        item.key === STATUS.COMPLETED 
      );
    } else {
      // inactive
      return allStatusItems.filter((item: StatusFilterItem) => 
        item.key === STATUS.DROPOUT ||
        item.key === STATUS.GRADUATED
      );
    }
  }, [allStatusItems, activeFilter]);

  // Calculate counts for Active and Inactive filters
  const activeInactiveCounts = useMemo(() => {
    const activeCount = allStatusItems
      .filter((item: StatusFilterItem) => 
        item.key === STATUS.NOT_ONBOARDED ||
        item.key === STATUS.ONBOARDED || 
        item.key === STATUS.IN_PROGRESS ||
        item.key === STATUS.COMPLETED
      )
      .reduce((sum: number, item: StatusFilterItem) => sum + item.count, 0);
    
    const inactiveCount = allStatusItems
      .filter((item: StatusFilterItem) => 
        item.key === STATUS.DROPOUT ||
        item.key === STATUS.GRADUATED
      )
      .reduce((sum: number, item: StatusFilterItem) => sum + item.count, 0);
    
    return { active: activeCount, inactive: inactiveCount };
  }, [allStatusItems]);

  useEffect(() => {
    const fetchParticipants = async () => {
      // Early return if entity ID is not available
      try {
        setIsLoading(true);
        const response = await getParticipantsList({
          userId: user?.id as string,
          search: searchKey,
          status: activeStatus,
          page: currentPage,
          limit: pageSize ?? undefined,
        });
        setParticipants(response.result.data || []);
        // Set overview from API response
        if (response.result.overview) {
          setOverview(response.result.overview);
        }
        // Set pagination metadata from API response
        if (response.total !== undefined) {
          setTotalItems(response.total);
        }

        // if (response.result.data && response.result.data.length > 0) {
        //   await AsyncStorage.setItem('my_program_user_ref', response.result?.details._id);
        // }
        
      } catch (err: any) {
        const errorMessage = err?.response?.data?.message || err?.message || 'Failed to fetch participants';
        logger.error('Error fetching participants:', errorMessage, err);
        // Optionally set empty array on error to prevent stale data
        setParticipants([]);
        setOverview(null);
        setTotalItems(0);
      } finally {
        setIsLoading(false);
      }
    };
    fetchParticipants();
  }, [searchKey, user, activeStatus, currentPage, pageSize]);
  
  // When Active/Inactive filter changes, set default status
  useEffect(() => {
    if (activeFilter === 'inactive') {
      setActiveStatus('GRADUATED');
    } else if (activeFilter === 'active') {
      // Set default to NOT_ONBOARDED when Active is selected
      setActiveStatus('NOT_ONBOARDED');
    }

    // Load pageSize from storage if not already set
    const loadPageSize = async () => {
      if (pageSize === null) {
        try {
          const storedPageSize = await offlineStorage.read<number>(STORAGE_KEYS.PARTICIPANTS_PAGE_SIZE);
          if (storedPageSize && PAGE_SIZE_OPTIONS.includes(storedPageSize)) {
            setPageSize(storedPageSize);
          } else {
            setPageSize(PAGE_SIZE_OPTIONS[0]);
          }
        } catch (error) {
          setPageSize(PAGE_SIZE_OPTIONS[0]);
        }
      }
    };
    loadPageSize();
  }, [activeFilter, pageSize]);

  // Handlers
  const handleSearch = useCallback((text: string) => {
    // Search functionality can be implemented here when needed
    setSearchKey(text);
    setCurrentPage(1); // Reset to first page when search changes
  }, []);

  const handleStatusChange = useCallback((status: StatusKey | '') => {
    setActiveStatus(status);
    setCurrentPage(1); // Reset to first page when status changes
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback(async (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when page size changes
    // Save to offline storage
    try {
      await offlineStorage.create(STORAGE_KEYS.PARTICIPANTS_PAGE_SIZE, size);
    } catch (error) {
      logger.error('Error saving page size to storage:', error);
    }
  }, []);

  const handleRowClick = useCallback(
    (participant: Participant) => {
      // @ts-ignore
      navigation.navigate('participant-detail', {
        id: participant.userId,
      });
    },
    [navigation],
  );
  
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
              <Box {...styles.selectContainer}>
                <Select
                  options={[
                    { label: `${t('participants.active')} (${activeInactiveCounts.active})`, value: 'active' },
                    { label: `${t('participants.inactive')} (${activeInactiveCounts.inactive})`, value: 'inactive' },
                  ]}
                  value={activeFilter}
                  onChange={(value) => setActiveFilter(value as 'active' | 'inactive')}
                />
              </Box>
              <Box {...styles.buttonContainer}>
                <GroupCheckInsButton />
              </Box>
            </HStack>

            {/* Status Filter Bar - Desktop: Filter buttons, Mobile: Dropdown */}
            {isMobile ? (
              <Box {...styles.mobileStatusSelectContainer}>
                <Select
                  options={statusItems.map((item: StatusFilterItem) => ({
                    label: `${t(item.label)} (${item.count})`,
                    value: item.key,
                  }))}
                  value={activeStatus}
                  onChange={(value) => handleStatusChange(value as StatusKey | '')}
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
              columns={getParticipantsColumns(activeStatus ? STATUS[activeStatus] : undefined)}
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
        showAlert('error', 'No group check-in solutions found for keyword: '+FILTER_KEYWORDS.GROUP_CHECK_IN.join(','));
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to fetch targeted solutions';
      logger.error('Error fetching targeted solutions:', errorMessage, err);
      // Handle error (log or UI feedback)
      showAlert('error', 'Failed to fetch targeted solutions: '+errorMessage);
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
