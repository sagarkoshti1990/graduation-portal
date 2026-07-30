import React, { useState, useEffect } from 'react';
import { Container, VStack, HStack, Box, Text, Pressable, LucideIcon } from '@ui';
import styles from './styles';
import SPTitleHeader from '@components/Header/SPTitleHeader';
import TrainingSessionsCard from './components/Card/TrainingSessions';
import AdditionalServicesCard from './components/Card/AdditionalServices';
import AssetsCard from './components/Card/Assests';
import { TabButton } from '@components/Tabs';
import FilterButton from '@components/Filter';
import SupportRequestsModals, { SupportRequestModalType } from './components/modals/SupportRequestsModals';
import { SUPPORT_REQUEST_TITLES } from '@constants/SUPPORT_REQUESTS';
import { getSupportRequests } from '../../../services/serviceProvider';
import { getProvincesList, getSitesByProvince } from '../../../services/usersService';

const DEFAULT_PROVINCE_OPTIONS = [
  { label: 'All Provinces', value: 'all-provinces' },
];

const DEFAULT_SITE_OPTIONS = [
  { label: 'All Sites', value: 'all-sites' },
];



const App = (): React.JSX.Element => {
  const [activeTab, setActiveTab] = useState('sessions');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [requestsData, setRequestsData] = useState<any[]>([]);
  const [tabCounts, setTabCounts] = useState<{
    sessions: number;
    additional_services: number;
    assets: number;
    pendingTotal: number;
    overdueTotal: number;
  }>({
    sessions: 0,
    additional_services: 0,
    assets: 0,
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
        console.log('[SupportRequests Screen] Fetching Provinces & Sites from API...');
        const provincesData = await getProvincesList();
        if (provincesData && provincesData.length > 0) {
          const dynamicProvinces = [
            { label: 'All Provinces', value: 'all-provinces' },
            ...provincesData.map((p: any) => ({
              label: p.name || p.title || p.label,
              value: p.name?.toLowerCase(),
              // value: p._id || p.id || p.value || p.name?.toLowerCase(),
            })),
          ];
          console.log('[SupportRequests Screen] Dynamic Provinces loaded:', dynamicProvinces.length);
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
          console.log('[SupportRequests Screen] Dynamic Sites loaded:', dynamicSites.length);
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

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        console.log('[SupportRequests Screen] Fetching data for tab:', activeTab, 'with filters:', filters);
        const res = await getSupportRequests({
          tab: activeTab as any,
          province: filters.province,
          site: filters.site,
          search: filters.search,
        });
        if (res?.data) {
          console.log('[SupportRequests Screen] Successfully loaded data count:', res.data.length, res.data);
          setRequestsData(res.data);
        }
        if (res?.counts) {
          setTabCounts(res.counts);
        }
      } catch (err) {
        console.error('[SupportRequests Screen] Failed to fetch support requests via service:', err);
      }
    };
    fetchRequests();
  }, [activeTab, filters]);

  const handleFilterChange = (newFilters: Record<string, any>) => {
    console.log('[SupportRequests Screen] Filter Changed:', newFilters);
    setFilters(newFilters);
  };

  const handleOpenModal = (type: SupportRequestModalType, item?: any) => {
    console.log('[SupportRequests Screen] Opening Modal:', type, 'Item:', item);
    if (item) setSelectedItem(item);
    setActiveModal(type);
  };

  const handleCloseModal = () => {
    console.log('[SupportRequests Screen] Closing Modal');
    setActiveModal(null);
  };

  const tabs = [
    {
      key: 'sessions',
      label: `Sessions & Trainings (${tabCounts.sessions ?? 0})`,
      icon: 'Package',
    },
    {
      key: 'additional_services',
      label: `Additional Services (${tabCounts.additional_services ?? 0})`,
      icon: 'Package',
    },
    {
      key: 'assets',
      label: `Assets (${tabCounts.assets ?? 0})`,
      icon: 'Package',
    },
  ];

  return (
    <VStack flex={1}>
      <SPTitleHeader
        title={SUPPORT_REQUEST_TITLES.HEADER}
        subTitle={SUPPORT_REQUEST_TITLES.SUBHEADER}
        rightSection={
          <HStack space="xs" alignItems="center">
            <Box bg="#EA580C" px="$3" py="$0.5" borderRadius="$full">
              <Text color="$white" fontSize="$xs" fontWeight="$bold">
                {tabCounts.pendingTotal ?? 11} Pending
              </Text>
            </Box>
            <Box bg="#DC2626" px="$3" py="$0.5" borderRadius="$full">
              <Text color="$white" fontSize="$xs" fontWeight="$bold">
                {tabCounts.overdueTotal ?? 11} Overdue
              </Text>
            </Box>
          </HStack>
        }
      />
      <Container {...styles.container}>
        <VStack space="md" width="100%">
          {/* Tabs Navigation */}
          <HStack
            borderBottomWidth={1}
            borderBottomColor="$borderLight200"
            alignItems="center"
            space="sm"
          >
            {tabs.map((tab) => (
              <TabButton
                key={tab.key}
                tab={tab}
                isActive={activeTab === tab.key}
                onPress={(key) => setActiveTab(key)}
                _text={{ fontSize: '$sm' }}
                iconSize={16}
              />
            ))}
          </HStack>

          {/* Filter Bar without card border, placed directly under tabs */}
          <FilterButton
            data={filterOptions}
            onFilterChange={handleFilterChange}
            showClearButton={false}
            hideTitleHeader={true}
            _container={{
              borderWidth: 0,
              bg: 'transparent',
              p: 0,
              mt: 0,
              mb: '$2',
              shadowColor: 'transparent',
              elevation: 0,
            }}
            _input={{ size: 'sm' }}
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
        </VStack>
      </Container>

      {/* Centralized Support Requests Modals Container */}
      <SupportRequestsModals
        selectedItem={selectedItem}
        activeModal={activeModal}
        onClose={handleCloseModal}
        onOpenModal={handleOpenModal}
      />
    </VStack>
  );
};

export default App;
