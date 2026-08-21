import React, { useState, useEffect, useCallback } from 'react';
import { Box, Button, ButtonIcon, ButtonText, Container, HStack, LucideIcon, VStack } from '@ui';
import styles from './styles';
import SPTitleHeader from '@components/Header/SPTitleHeader';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useLanguage } from '@contexts/LanguageContext';
import { TabButton } from '@components/Tabs';
import FilterButton from '@components/Filter';
import TrainingCard from './components/Cards/TrainingCard';
import AdditionalServicesCard from './components/Cards/AdditionalServicesCard';
import AssetCard from './components/Cards/AssetCard';
import { getProvincesList, getSitesByProvince } from '../../../services/usersService';
import { getTrainingSessions, getAdditionalServices, getAssets, } from '../../../services/SupportOfferingsServices/supportOfferingsService';
import type { ProvinceEntity } from '@app-types/Users';
import logger from '@utils/logger';
import { getSessionDetails } from '../../../services/mentoringService';

export const STATUS_OPTIONS = [
  {
    labelKey: 'supportProvider.supportOfferings.statusOptions.allStatuses',
    value: 'all-statuses',
  },
  {
    labelKey: 'supportProvider.supportOfferings.statusOptions.upcoming',
    value: 'Upcoming',
  },
  {
    labelKey: 'supportProvider.supportOfferings.statusOptions.inProgress',
    value: 'In progress',
  },
  {
    labelKey: 'supportProvider.supportOfferings.statusOptions.completed',
    value: 'Completed',
  },
  {
    labelKey: 'supportProvider.supportOfferings.statusOptions.draft',
    value: 'Draft',
  },
];

const DEFAULT_PROVINCE_OPTIONS = [{ label: 'All Provinces', value: 'all-provinces' }];

const DEFAULT_SITE_OPTIONS = [{ label: 'All Sites', value: 'all-sites' },];

const App = ({ hideHeader = false, isSessionsSupport = false }: { hideHeader?: boolean; isSessionsSupport?: boolean } = {}): React.JSX.Element => {
  const navigation = useNavigation();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('sessions');
  const [activeSubTab, setActiveSubTab] = useState('browse_sessions');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [provincesList, setProvincesList] = useState<ProvinceEntity[]>([]);
  const [provinceOptions, setProvinceOptions] = useState(DEFAULT_PROVINCE_OPTIONS);
  const [allSiteOptions, setAllSiteOptions] = useState();
  const [siteOptions, setSiteOptions] = useState(DEFAULT_SITE_OPTIONS);
  // Listing state
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(5);
  const [total, setTotal] = useState<number>(0);
  const [_loading, setLoading] = useState<boolean>(false);
  const [counts, setCounts] = useState({
    sessions: 0,
    additional_services: 0,
    assets: 0,
  });

  const tabs = [
    { key: 'sessions', label: t('supportProvider.supportOfferings.tabs.trainings', 'Trainings & Sessions'), count: counts.sessions, icon: 'GraduationCap' },
    { key: 'additional_services', label: t('supportProvider.supportOfferings.tabs.additionalServices', 'Additional Services'), count: counts.additional_services, icon: 'Briefcase' },
    { key: 'assets', label: t('supportProvider.supportOfferings.tabs.assets', 'Assets'), count: counts.assets, icon: 'Box' },
  ];

  const subTabs = [
    { key: 'browse_sessions', label: t('lc.sessionsSupport.tabs.browseSessions', 'Browse Sessions') },
    { key: 'my_requests', label: t('lc.sessionsSupport.tabs.myRequests', 'My Requests') },
    { key: 'my_sessions', label: t('lc.sessionsSupport.tabs.mySessions', 'My Sessions') },
    { key: 'history', label: t('lc.sessionsSupport.tabs.history', 'History') },
  ];

  const displayTabs = isSessionsSupport
    ? tabs.map((tab) => ({
      ...tab,
      count: undefined,
      icon: tab.key === 'sessions' ? 'Calendar' : tab.key === 'additional_services' ? 'Wrench' : 'Box',
    }))
    : tabs;

  const handleTabChange = (key: string) => {
    setActiveTab(key);
  };

  const handleFilterChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters);
  };

  const isShowLoadMore = items.length < total && items.length > 0;
  const onLoadMoreItems = () => {
    setPage((prevPage) => prevPage + 1);
  };

  const filterOptions = [
    { type: 'search', attr: 'search', placeholderKey: 'admin.filters.searchOfferingsPlaceholder' },
    {
      type: 'select',
      attr: 'status',
      placeholder: 'All Statuses',
      data: STATUS_OPTIONS,
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

  // Fetch dynamic provinces from API
  useEffect(() => {
    let isMounted = true;
    const fetchFilterData = async () => {
      try {
        const provincesData = await getProvincesList();
        if (isMounted && provincesData && provincesData.length > 0) {
          setProvincesList(provincesData);
          const { result: { data } } = await getSitesByProvince();
          setAllSiteOptions(data || []);
          const dynamicProvinces = [
            { label: 'All Provinces', value: 'all-provinces' },
            ...provincesData.map((p: any) => ({
              label: p.metaInformation?.name || p.name || p.title || p.label,
              value: p.externalId || p._id || p.id || p.value,
            })),
          ];
          setProvinceOptions(dynamicProvinces);
        }
      } catch (err) {
        console.error('Error fetching dynamic provinces:', err);
      }
    };
    fetchFilterData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch dynamic sites based on selected province filter
  useEffect(() => {
    let isMounted = true;
    const fetchSitesData = async () => {
      const selectedProv = filters.province;

      if (!selectedProv || selectedProv === 'all-provinces') {
        if (isMounted) {
          setSiteOptions([]);
        }
        return;
      }

      try {

        const res = await getSitesByProvince({
          provinceId: selectedProv,
          page: 1,
          limit: 100,
        });

        const fetchedSites = res?.result?.data || [];

        if (isMounted) {
          const dynamicSites = [
            { label: 'All Sites', value: 'all-sites' },
            ...fetchedSites.map((s: any) => ({
              label:
                s.metaInformation?.name ||
                s.name ||
                s.title ||
                s.label,
              value:
                s.externalId ||
                s._id ||
                s.id ||
                s.value,
            })),
          ];

          setSiteOptions(dynamicSites);
        }
      } catch (err) {
        console.error('Error fetching dynamic sites:', err);
        if (isMounted) {
          setSiteOptions([]);
        }
      }
    };

    fetchSitesData();
    return () => {
      isMounted = false;
    };
  }, [filters.province, provincesList]);

  // Reset page when tab or filters change
  useEffect(() => {
    setPage(1);
  }, [activeTab, activeSubTab, filters.search, filters.status, filters.province, filters.site]);

  // Fetch listing data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        filters,
        page,
        limit,
      };

      let fetchedData: any[] = [];
      let totalCount = 0;

      if (activeTab === 'sessions') {
        const res = await getTrainingSessions(params);
        fetchedData = res?.result?.data || [];
        totalCount = res?.result?.count ?? res?.total ?? res?.count ?? (res?.result?.total ?? fetchedData.length);
        setCounts((prev) => ({ ...prev, sessions: totalCount }));
      } else if (activeTab === 'additional_services') {
        const res = await getAdditionalServices(params);
        fetchedData = Array.isArray(res) ? res : (res as any)?.result?.data || [];
        totalCount = (res as any)?.result?.count ?? (res as any)?.total ?? (res as any)?.count ?? fetchedData.length;
        setCounts((prev) => ({ ...prev, additional_services: totalCount }));
      } else if (activeTab === 'assets') {
        const res = await getAssets(params);
        fetchedData = Array.isArray(res) ? res : (res as any)?.result?.data || [];
        totalCount = (res as any)?.result?.count ?? (res as any)?.total ?? (res as any)?.count ?? fetchedData.length;
        setCounts((prev) => ({ ...prev, assets: totalCount }));
      }
      if (page === 1) {
        setItems(fetchedData);
      } else {
        setItems((prev) => [...prev, ...fetchedData]);
      }
      setTotal(totalCount);
    } catch (err) {
      logger.error('Error fetching offerings list:', err);
      if (page === 1) {
        setItems([]);
        setTotal(0);
      }
    } finally {
      setLoading(false);
    }
  }, [activeTab, filters, page, limit]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
      return () => {
        setLoading(true);
      };
    }, [fetchData])
  );

  const handleGetDetails = async (item: any) => {
    const { result } = await getSessionDetails(item.id);
    setItems(prevItems =>
      prevItems.map((subItem: any) =>
        subItem.id === item.id
          ? {
            ...subItem,
            materials: result?.resources,
          }
          : subItem
      )
    );
  }

  return (
    <VStack flex={1}>
      {!hideHeader && (
        <SPTitleHeader
          title={t('supportProvider.supportOfferings.title')}
          subTitle={t('supportProvider.supportOfferings.subtitle')}
          rightSection={
            <Button
              onPress={() => navigation.navigate('create-opportunity' as never)}
            >
              <ButtonIcon as={LucideIcon} name={'Plus'} />
              <ButtonText>{t('supportProvider.supportOfferings.createNew')}</ButtonText>
            </Button>
          }
        />
      )}
      <Box {...(isSessionsSupport ? styles.sessionSupportTabBox : styles.tabBarBox)}>
        <Container {...styles.container} py="$0">
          {isSessionsSupport ? (
            <Box {...styles.sessionSupportTabWrapper}>
              {displayTabs.map((tab) => (
                <TabButton
                  key={tab.key}
                  tab={tab}
                  isActive={activeTab === tab.key}
                  onPress={handleTabChange}
                  variant="ButtonTab"
                  _text={styles.tabTextProps}
                  _container={{
                    ...styles.tabButtonContainer,
                    borderRadius: activeTab === tab.key ? 50 : 0,
                  }}
                  iconSize={16}
                />
              ))}
            </Box>
          ) : (
            <HStack alignItems="center" space="sm">
              {tabs.map((tab) => (
                <TabButton
                  key={tab.key}
                  tab={tab}
                  isActive={activeTab === tab.key}
                  onPress={handleTabChange}
                  _text={styles.tabTextProps}
                  _container={styles.tabButtonContainer}
                  iconSize={16}
                />
              ))}
            </HStack>
          )}
        </Container>
      </Box>

      {isSessionsSupport && (
        <Box {...styles.sessionSupportSubTabBarBox}>
          <Container {...styles.container} py="$0">
            <HStack alignItems="center" space="sm">
              {subTabs.map((tab) => (
                <TabButton
                  key={tab.key}
                  tab={tab}
                  isActive={activeSubTab === tab.key}
                  onPress={(key) => setActiveSubTab(key)}
                  _text={styles.tabTextProps}
                  _container={styles.tabButtonContainer}
                  iconSize={16}
                />
              ))}
            </HStack>
          </Container>
        </Box>
      )}

      <Container {...styles.container}>
        <VStack {...styles.contentContainer}>
          {activeTab === 'sessions' && (!isSessionsSupport || activeSubTab === 'browse_sessions') && (
            <FilterButton
              data={filterOptions}
              onFilterChange={handleFilterChange}
              showClearButton={false}
              hideTitleHeader={true}
              _container={styles.filterContainer}
              _input={styles.filterInputProps}
            />
          )}

          {activeTab === 'sessions' && (!isSessionsSupport || activeSubTab === 'browse_sessions') && (
            <TrainingCard
              items={items}
              isShowLoadMore={isShowLoadMore}
              onLoadMoreItems={onLoadMoreItems}
              isLoadingMore={_loading && page > 1}
              _card={{
                getItemDetails: handleGetDetails,
                provinces: provincesList,
                sites: allSiteOptions
              }}
            />
          )}

          {activeTab === 'additional_services' && (
            <AdditionalServicesCard
              items={items}
              isShowLoadMore={isShowLoadMore}
              onLoadMoreItems={onLoadMoreItems}
              isLoadingMore={_loading && page > 1}
            />
          )}

          {activeTab === 'assets' && (
            <AssetCard
              items={items}
              isShowLoadMore={isShowLoadMore}
              onLoadMoreItems={onLoadMoreItems}
              isLoadingMore={_loading && page > 1}
            />
          )}
        </VStack>
      </Container>
    </VStack>
  );
};

export default App;
