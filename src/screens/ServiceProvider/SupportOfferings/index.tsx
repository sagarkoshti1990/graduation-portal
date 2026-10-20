import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Button, ButtonIcon, ButtonText, Container, HStack, LucideIcon, Spinner, Text, VStack } from '@ui';
import styles from './styles';
import SPTitleHeader from '@components/Header/SPTitleHeader';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useLanguage } from '@contexts/LanguageContext';
import { useAuth } from '@contexts/AuthContext';
import { useProfileCompletion } from '@hooks';
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
    value: 'live',
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

const App = (): React.JSX.Element => {
  const navigation = useNavigation();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('sessions');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const { user } = useAuth() || {};
  const { allowedProvinces, allowedSites, isProfileLoading } = useProfileCompletion();
  // Mentors only see the provinces/sites from their mentoring profile (empty list = no restriction)
  const isMentor = user?.role === 'mentor';
  const restrictProvinces = isMentor && allowedProvinces.length > 0;
  const restrictSites = isMentor && allowedSites.length > 0;
  const [provincesList, setProvincesList] = useState<ProvinceEntity[]>([]);
  const [provinceOptions, setProvinceOptions] = useState(DEFAULT_PROVINCE_OPTIONS);
  const [allSiteOptions, setAllSiteOptions] = useState();
  const [siteOptions, setSiteOptions] = useState(DEFAULT_SITE_OPTIONS);
  // Listing state
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(5);
  const [total, setTotal] = useState<number>(0);
  const [_loading, setLoading] = useState<boolean>(true);

  const tabs = [
    { key: 'sessions', label: t('supportProvider.supportOfferings.tabs.trainings', 'Trainings & Sessions'), icon: 'GraduationCap' },
    { key: 'additional_services', label: t('supportProvider.supportOfferings.tabs.additionalServices', 'Additional Services'), icon: 'Briefcase' },
    { key: 'assets', label: t('supportProvider.supportOfferings.tabs.assets', 'Assets'), icon: 'Box' },
  ];

  const handleTabChange = (key: string) => {
    if (key === activeTab) return;
    // Clear the previous tab's list so it is never rendered inside the new tab's cards while loading
    setItems([]);
    setTotal(0);
    setPage(1);
    setLoading(true);
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
      dependencyAttr: 'province',
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
          // Profile may have changed while the request was pending; drop the stale result
          if (!isMounted) return;
          setAllSiteOptions(data || []);
          const mappedProvinces = provincesData.map((p: any) => ({
            label: p.metaInformation?.name || p.name || p.title || p.label,
            value: p._id || p.id || p.value,
          }));
          const dynamicProvinces = [
            { label: 'All Provinces', value: 'all-provinces' },
            ...(restrictProvinces ? mappedProvinces.filter((p: any) => allowedProvinces.includes(p.value)) : mappedProvinces),
          ];
          setProvinceOptions(dynamicProvinces);
        }
      } catch (err) {
        console.error('Error fetching dynamic provinces:', err);
      }
    };
    if (isProfileLoading) return;
    fetchFilterData();
    return () => {
      isMounted = false;
    };
  }, [isProfileLoading, restrictProvinces]);

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
            ...(restrictSites ? fetchedSites.filter((s: any) => allowedSites.includes(s._id || s.id || s.value)) : fetchedSites).map((s: any) => ({
              label:
                s.metaInformation?.name ||
                s.name ||
                s.title ||
                s.label,
              value:
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
  }, [filters.province, provincesList, restrictSites, allowedSites]);

  // Drop selected province/site values the profile no longer allows so they aren't sent to the listing API
  useEffect(() => {
    if (isProfileLoading) return;
    setFilters((prev) => {
      const next = { ...prev };
      let changed = false;
      if (restrictProvinces && prev.province && prev.province !== 'all-provinces' && !allowedProvinces.includes(prev.province)) {
        delete next.province;
        delete next.site;
        changed = true;
      }
      if (restrictSites && next.site && next.site !== 'all-sites' && !allowedSites.includes(next.site)) {
        delete next.site;
        changed = true;
      }
      return changed ? next : prev;
    });
  }, [isProfileLoading, restrictProvinces, restrictSites, allowedProvinces, allowedSites]);

  // Reset page when tab or filters change
  useEffect(() => {
    setPage(1);
  }, [activeTab, filters.search, filters.status, filters.province, filters.site]);

  // Only the latest request may update the list, so a slow response from a previous tab/filter is ignored
  const latestRequestIdRef = useRef(0);

  // Fetch listing data
  const fetchData = useCallback(async () => {
    const requestId = ++latestRequestIdRef.current;
    const isStale = () => requestId !== latestRequestIdRef.current;
    try {
      setLoading(true);
      const params = {
        search: filters.search,
        status: filters.status,
        provinces: filters.province,
        sites: filters.site,
        page,
        limit,
      };

      let fetchedData: any[] = [];
      let totalCount = 0;

      if (activeTab === 'sessions') {
        const res = await getTrainingSessions(params);
        fetchedData = res?.result?.data || [];
        totalCount = res?.result?.count ?? res?.total ?? res?.count ?? (res?.result?.total ?? fetchedData.length);
      } else if (activeTab === 'additional_services') {
        const res = await getAdditionalServices(params);
        fetchedData = Array.isArray(res) ? res : (res as any)?.result?.data || [];
        totalCount = (res as any)?.result?.count ?? (res as any)?.total ?? (res as any)?.count ?? fetchedData.length;
      } else if (activeTab === 'assets') {
        const res = await getAssets(params);
        fetchedData = Array.isArray(res) ? res : (res as any)?.result?.data || [];
        totalCount = (res as any)?.result?.count ?? (res as any)?.total ?? (res as any)?.count ?? fetchedData.length;
      }
      if (isStale()) return;
      if (page === 1) {
        setItems(fetchedData);
      } else {
        setItems((prev) => [...prev, ...fetchedData]);
      }
      setTotal(totalCount);
    } catch (err) {
      if (isStale()) return;
      logger.error('Error fetching offerings list:', err);
      if (page === 1) {
        setItems([]);
        setTotal(0);
      }
    } finally {
      if (!isStale()) setLoading(false);
    }
  }, [activeTab, filters.search, filters.status, filters.province, filters.site, page, limit]);

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
      <Box {...styles.tabBarBox}>
        <Container {...styles.container} py="$0">
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
        </Container>
      </Box>

      <Container {...styles.container}>
        <VStack {...styles.contentContainer}>
          <FilterButton
            data={filterOptions}
            onFilterChange={handleFilterChange}
            showClearButton={false}
            hideTitleHeader={true}
            _container={styles.filterContainer}
            _input={styles.filterInputProps}
          />

          {_loading && page === 1 && items.length === 0 && (
            <Box {...styles.emptyStateBox}>
              <Spinner />
            </Box>
          )}

          {!_loading && items.length === 0 && (
            <Box {...styles.emptyStateBox}>
              <LucideIcon name="FileX" size={styles.emptyStateIcon.size} color={styles.emptyStateIcon.color} />
              <Text {...styles.emptyStateText}>{t('common.noDataFound')}</Text>
            </Box>
          )}

          {activeTab === 'sessions' && (
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
              _card={{
                provinces: provincesList,
                sites: allSiteOptions
              }}
            />
          )}

          {activeTab === 'assets' && (
            <AssetCard
              items={items}
              isShowLoadMore={isShowLoadMore}
              onLoadMoreItems={onLoadMoreItems}
              isLoadingMore={_loading && page > 1}
              _card={{
                provinces: provincesList,
                sites: allSiteOptions
              }}
            />
          )}
        </VStack>
      </Container>
    </VStack>
  );
};

export default App;