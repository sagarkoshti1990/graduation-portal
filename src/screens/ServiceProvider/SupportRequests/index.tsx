import React, { useState, useEffect, useCallback } from 'react';
import { Container, VStack, HStack, Box, Text } from '@ui';
import styles from './styles';
import SPTitleHeader from '@components/Header/SPTitleHeader';
import TrainingSessionsCard from './components/Card/TrainingSessions';
import AdditionalServicesCard from './components/Card/AdditionalServices';
import AssetsCard from './components/Card/Assests';
import DeclinedCard from './components/Card/DeclinedCard';
import { TabButton } from '@components/Tabs';
import FilterButton from '@components/Filter';
import SupportRequestsModals, { SupportRequestModalType } from './components/modals/SupportRequestsModals';
import { useLanguage } from '@contexts/LanguageContext';
import { getSupportRequests } from '../../../services/serviceProvider/serviceProviderService';
import { getProvincesList, getSitesByProvince } from '../../../services/usersService';

const BASE_PATH = 'supportProvider.supportRequests';

const DEFAULT_PROVINCE_OPTIONS = [
  { label: 'All Provinces', value: 'all-provinces' },
];

const DEFAULT_SITE_OPTIONS = [
  { label: 'All Sites', value: 'all-sites' },
];

const App = (): React.JSX.Element => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('sessions');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [requestsData, setRequestsData] = useState<any[]>([]);
  const [tabCounts, setTabCounts] = useState<{
    sessions: number;
    additional_services: number;
    assets: number;
    declined: number;
    pendingTotal: number;
    overdueTotal: number;
  }>({
    sessions: 0,
    additional_services: 0,
    assets: 0,
    declined: 0,
    pendingTotal: 0,
    overdueTotal: 0,
  });
  const [activeModal, setActiveModal] = useState<SupportRequestModalType>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const [provinceOptions, setProvinceOptions] = useState(DEFAULT_PROVINCE_OPTIONS);
  const [siteOptions, setSiteOptions] = useState(DEFAULT_SITE_OPTIONS);

  // Fetch dynamic provinces from API
  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        const provincesData = await getProvincesList();
        if (provincesData && provincesData.length > 0) {
          const dynamicProvinces = [
            { label: 'All Provinces', value: 'all-provinces' },
            ...provincesData.map((p: any) => ({
              label: p.name || p.title || p.label,
              value: p.name?.toLowerCase(),
            })),
          ];
          setProvinceOptions(dynamicProvinces);
        }
      } catch (err) {
        console.error('[SupportRequests Screen] Error fetching dynamic provinces:', err);
      }
    };
    fetchFilterData();
  }, []);

  // Fetch dynamic sites based on selected province filter
  useEffect(() => {
    const fetchSitesData = async () => {
      try {
        const selectedProv = filters.province;
        const res = await getSitesByProvince({
          provinceId: selectedProv && selectedProv !== 'all-provinces' ? selectedProv : undefined,
          page: 1,
          limit: 100,
        });
        const sitesList = res?.result?.data || [];
        if (sitesList && sitesList.length > 0) {
          const dynamicSites = [
            { label: 'All Sites', value: 'all-sites' },
            ...sitesList.map((s: any) => ({
              label: s.name || s.title || s.label,
              value: s.name?.toLowerCase() || s._id || s.id || s.value,
            })),
          ];
          setSiteOptions(dynamicSites);
        }
      } catch (err) {
        console.error('[SupportRequests Screen] Error fetching dynamic sites:', err);
      }
    };
    fetchSitesData();
  }, [filters.province]);

  const filterOptions = [
    {
      type: 'search',
      attr: 'search',
      placeholder: 'Search requests...',
    },
    {
      type: 'select',
      attr: 'province',
      placeholder: 'All Provinces',
      data: provinceOptions,
    },
    {
      type: 'select',
      attr: 'site',
      placeholder: 'All Sites',
      data: siteOptions,
    },
  ];

  const fetchRequests = useCallback(async () => {
    try {
      const res = await getSupportRequests({
        tab: activeTab as any,
        province: filters.province,
        site: filters.site,
        search: filters.search,
      });
      if (res?.data) {
        setRequestsData(res.data);
      }
      if (res?.counts) {
        setTabCounts(res.counts);
      }
    } catch (err) {
      console.error('[SupportRequests Screen] Failed to fetch support requests via service:', err);
    }
  }, [activeTab, filters]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleFilterChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters);
  };

  const handleOpenModal = (type: SupportRequestModalType, item?: any) => {
    if (item) setSelectedItem(item);
    setActiveModal(type);
  };

  const handleCloseModal = () => {
    setActiveModal(null);
  };

  const tabs = [
    {
      key: 'sessions',
      label: `${t(`${BASE_PATH}.tabs.sessions`)}`,
      count: tabCounts.sessions ?? 0,
      icon: 'GraduationCap',
    },
    {
      key: 'additional_services',
      label: `${t(`${BASE_PATH}.tabs.additional_services`)}`,
      count: tabCounts.additional_services ?? 0,
      icon: 'MessageSquare',
    },
    {
      key: 'assets',
      label: `${t(`${BASE_PATH}.tabs.assets`)}`,
      count: tabCounts.assets ?? 0,
      icon: 'Package',
    },
    {
      key: 'declined',
      label: `${t(`${BASE_PATH}.tabs.declined`, 'Declined')}`,
      count: tabCounts.declined ?? 0,
      icon: 'XCircle',
    },
  ];

  return (
    <VStack flex={1}>
      <SPTitleHeader
        title={t(`${BASE_PATH}.titles.header`)}
        subTitle={t(`${BASE_PATH}.titles.subheader`)}
        rightSection={
          <HStack {...styles.labelRow}>
            <Box {...styles.pendingHeaderBadge}>
              <Text {...styles.headerBadgeText}>
                {tabCounts.pendingTotal ?? 0} {t(`${BASE_PATH}.tabs.pending`)}
              </Text>
            </Box>
            <Box {...styles.overdueHeaderBadge}>
              <Text {...styles.headerBadgeText}>
                {tabCounts.overdueTotal ?? 0} {t(`${BASE_PATH}.tabs.overdue`)}
              </Text>
            </Box>
          </HStack>
        }
      />
      <Box {...styles.subbox}>
        <Container {...styles.container} py="$0">
          <HStack {...styles.tabsHeader}>
            {tabs.map((tab) => (
              <TabButton
                key={tab.key}
                tab={tab}
                isActive={activeTab === tab.key}
                onPress={(key) => setActiveTab(key)}
                _text={styles.tabTextProps}
                _container={styles.tabButtonContainer}
                iconSize={16}
              />
            ))}
          </HStack>
        </Container>
      </Box>
      <Container {...styles.container}>
        <VStack {...styles.screenVStack}>
          <FilterButton
            data={filterOptions}
            onFilterChange={handleFilterChange}
            showClearButton={false}
            hideTitleHeader={true}
            _container={styles.filterContainer}
          />

          {activeTab === 'sessions' && (
            <TrainingSessionsCard
              items={requestsData}
              onViewFullDetails={(item) => handleOpenModal('view_details', item)}
              onRequestInfo={(item) => handleOpenModal('request_info', item)}
              onDecline={(item) => handleOpenModal('decline', item)}
              onAcceptAndSchedule={(item) => handleOpenModal('accept_schedule', item)}
            />
          )}
          {activeTab === 'additional_services' && (
            <AdditionalServicesCard
              items={requestsData}
              onViewFullDetails={(item) => handleOpenModal('view_details', item)}
              onRequestInfo={(item) => handleOpenModal('request_info', item)}
              onDecline={(item) => handleOpenModal('decline', item)}
              onAcceptAndSchedule={(item) => handleOpenModal('accept_schedule', item)}
            />
          )}
          {activeTab === 'assets' && (
            <AssetsCard
              items={requestsData}
              onViewFullDetails={(item) => handleOpenModal('view_details', item)}
              onRequestInfo={(item) => handleOpenModal('request_info', item)}
              onDecline={(item) => handleOpenModal('decline', item)}
              onAcceptAndSchedule={(item) => handleOpenModal('accept_schedule', item)}
            />
          )}
          {activeTab === 'declined' && (
            <DeclinedCard
              items={requestsData}
              onViewFullDetails={(item) => handleOpenModal('view_details', item)}
            />
          )}
        </VStack>
      </Container>

      {/* Centralized Support Requests Modals Container */}
      <SupportRequestsModals
        selectedItem={selectedItem}
        activeModal={activeModal}
        onClose={handleCloseModal}
        onOpenModal={handleOpenModal}
        onSuccess={fetchRequests}
      />
    </VStack>
  );
};

export default App;
