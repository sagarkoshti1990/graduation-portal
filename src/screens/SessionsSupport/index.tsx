import React, { useState, useEffect } from 'react';
import { Box, Button, ButtonIcon, ButtonText, Container, HStack, LucideIcon, Pressable, Text, VStack, useAlert } from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import PageHeader from '@components/PageHeader';
import {
  REQUEST_SUPPORT_OPTIONS,
  getSupportOfferingTabs,
  DEFAULT_PROVINCE_OPTIONS,
  DEFAULT_SITE_OPTIONS,
} from '@constants/SUPPORT_PROVIDER_CARDS';
import { TabButton } from '@components/Tabs';
import FilterButton from '@components/Filter';
import TrainingCard from '../ServiceProvider/SupportOfferings/components/Cards/TrainingCard';
import AdditionalServicesCard from '../ServiceProvider/SupportOfferings/components/Cards/AdditionalServicesCard';
import AssetCard from '../ServiceProvider/SupportOfferings/components/Cards/AssetCard';
import { getProvincesList, getSitesByProvince } from '../../services/usersService';
import { getTrainingSessions, getAdditionalServices, getAssets } from '../../services/SupportOfferingsServices/supportOfferingsService';
import { getRequestSessionsList } from '../../services/SessionSupportServices/sessionRequestorService';
import type { ProvinceEntity } from '@app-types/Users';
import { getSessionCategories, getDeliveryModes } from '../../services/mentoringService';
import { DEFAULT_PATHWAY_OPTIONS, DEFAULT_FORMAT_OPTIONS } from '../../constants/REQUESTOR_CONSTANTS';
import { RequestorFilter } from './RequestorFilter';
import styles from './styles';
import supportOfferingsStyles from '../ServiceProvider/SupportOfferings/styles';
import { RequestFooter } from './RequestorFooter';
import AssignParticipantsModal from './components/modals/AssignParticipantsModal';
import LcMySessionTab from './components/LcMySessionTab';

const SessionsSupportScreen: React.FC = () => {
  const { t } = useLanguage();
  const navigation = useNavigation();
  const route = useRoute() as any;
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [mySessions, setMySessions] = useState<any[]>([]);
  const { showAlert } = useAlert();

  const handleAssignSessionClick = (item: any) => {
    setSelectedSession(item);
    setIsAssignModalOpen(true);
  };

  const handleConfirmAssignment = (selectedIds: string[]) => {
    showAlert(
      'success',
      t(
        'lc.sessionsSupport.alerts.assignSuccess',
        { count: selectedIds.length },
        `${selectedIds.length} participant(s) assigned to session successfully.`
      )
    );
  };

  // Listing state, filters, and tabs reused from SupportOfferings logic
  const [activeTab, setActiveTab] = useState('sessions');
  const [activeSubTab, setActiveSubTab] = useState('browse_sessions');

  // Capture newly created session from navigation params (passed back by CreateSession)
  useEffect(() => {
    const params = route?.params as any;
    if (params?.newSession) {
      setMySessions((prev) => {
        // Avoid duplicates by id
        const id = params.newSession.id || params.newSession._id;
        if (id && prev.some((s) => (s.id || s._id) === id)) return prev;
        return [params.newSession, ...prev];
      });
      // Switch to My Sessions tab so the user sees the new session
      setActiveTab('sessions');
      setActiveSubTab('my_sessions');
      // Clear the param so re-visits don't re-add it
      navigation.setParams({ newSession: undefined } as any);
    }
  }, [route?.params]);


  const [filters, setFilters] = useState<Record<string, any>>({});
  const [provincesList, setProvincesList] = useState<ProvinceEntity[]>([]);
  const [provinceOptions, setProvinceOptions] = useState(DEFAULT_PROVINCE_OPTIONS);
  const [allSiteOptions, setAllSiteOptions] = useState();
  const [siteOptions, setSiteOptions] = useState(DEFAULT_SITE_OPTIONS);
  const [pathwayOptions, setPathwayOptions] = useState(DEFAULT_PATHWAY_OPTIONS);
  const [formatOptions, setFormatOptions] = useState(DEFAULT_FORMAT_OPTIONS);

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

  const tabs = getSupportOfferingTabs(t, counts);
  const displayTabs = tabs.map((tab) => ({
    ...tab,
    count: undefined,
    icon: tab.key === 'sessions' ? 'Calendar' : tab.key === 'additional_services' ? 'Wrench' : 'Box',
  }));

  const subTabs = tabs.find((tab) => tab.key === activeTab)?.children || [];

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    const newTab = tabs.find((tab) => tab.key === key);
    if (newTab && newTab.children && newTab.children.length > 0) {
      setActiveSubTab(newTab.children[0].key);
    } else {
      setActiveSubTab('browse_sessions');
    }
  };

  const handleFilterChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters);
  };

  const isShowLoadMore = items.length < total && items.length > 0;
  const onLoadMoreItems = () => {
    setPage((prevPage) => prevPage + 1);
  };

  const filterOptions = [
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

  // Fetch dynamic provinces, pathways/pillars, and formats/delivery modes from API
  useEffect(() => {
    let isMounted = true;
    const fetchFilterData = async () => {
      try {
        const [provincesData, categoriesData, deliveryModesData] = await Promise.all([
          getProvincesList().catch(() => []),
          getSessionCategories().catch(() => []),
          getDeliveryModes().catch(() => []),
        ]);

        if (isMounted) {
          if (provincesData && provincesData.length > 0) {
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

          if (categoriesData && categoriesData.length > 0) {
            const dynamicPathways = [
              { label: 'All Pathways', value: 'all-pathways' },
              ...categoriesData.map((c: any) => ({
                label: c.label || c.name || c.value,
                value: c.value,
              })),
            ];
            setPathwayOptions(dynamicPathways);
          }

          if (deliveryModesData && deliveryModesData.length > 0) {
            const dynamicFormats = [
              { label: 'All Formats', value: 'all-formats' },
              ...deliveryModesData.map((d: any) => ({
                label: d.label || d.name || d.value,
                value: d.value,
              })),
            ];
            setFormatOptions(dynamicFormats);
          }
        }
      } catch (err) {
        console.error('Error fetching filter data:', err);
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
          setSiteOptions(DEFAULT_SITE_OPTIONS);
        }
        return;
      }

      try {
        const selectedProvinceObj = provincesList.find(
          (p: any) =>
            p.externalId === selectedProv ||
            p._id === selectedProv ||
            p.name?.toLowerCase() === selectedProv?.toLowerCase()
        );

        const provinceIdParam = selectedProvinceObj
          ? selectedProvinceObj._id || selectedProvinceObj.externalId
          : selectedProv;

        const res = await getSitesByProvince({
          provinceId: provinceIdParam,
          page: 1,
          limit: 100,
        });

        const fetchedSites = res?.result?.data || [];

        if (isMounted) {
          const dynamicSites = [
            { label: 'All Sites', value: 'all-sites' },
            ...fetchedSites.map((s: any) => ({
              label: s.metaInformation?.name || s.name || s.title || s.label,
              value: s.externalId || s._id || s.id || s.value,
            })),
          ];

          setSiteOptions(dynamicSites);
        }
      } catch (err) {
        console.error('Error fetching dynamic sites:', err);
        if (isMounted) {
          setSiteOptions(DEFAULT_SITE_OPTIONS);
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
  }, [activeTab, filters.search, filters.status, filters.province, filters.site, filters.pathway, filters.format]);

  // Reset page and filters when active sub-tab changes
  useEffect(() => {
    setPage(1);
    setFilters({});
  }, [activeSubTab]);

  // Fetch listing data
  useEffect(() => {
    if (activeSubTab !== 'browse_sessions') {
      return;
    }
    let isMounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        const params = {
          page,
          limit,
          search: filters.search,
          status: filters.status,
          province: filters.province,
          site: filters.site,
          pathway: filters.pathway,
          format: filters.format,
          isSessionsSupport: true,
        };

        let fetchedData: any[] = [];
        let totalCount = 0;

        if (activeTab === 'sessions') {
          let result;
          if (activeSubTab === 'browse_sessions') {
            result = await getRequestSessionsList(params);
          } else {
            result = await getTrainingSessions(params);
          }

          fetchedData = result?.result?.data || [];
          totalCount = result?.result?.count ?? result?.total ?? result?.count ?? (result?.result?.total ?? fetchedData.length);
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

        if (isMounted) {
          if (page === 1) {
            setItems(fetchedData);
          } else {
            setItems((prev) => [...prev, ...fetchedData]);
          }
          setTotal(totalCount);
        }
      } catch (err) {
        console.error('Error fetching offerings list:', err);
        if (isMounted) {
          if (page === 1) {
            setItems([]);
            setTotal(0);
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [activeTab, activeSubTab, filters.search, filters.status, filters.province, filters.site, filters.pathway, filters.format, page, limit]);

  const handleSelectOption = (route: string) => {
    setIsDropdownOpen(false);
    if (route) {
      navigation.navigate(route as never);
    }
  };

  const titleNode = (
    <HStack {...styles.headerTitleHStack}>
      <LucideIcon name="LifeBuoy" size={24} color="#8B2842" />
      <Text {...styles.headerTitleText}>
        {t('lc.pageTitle.sessions-support')}
      </Text>
    </HStack>
  );

  return (
    <VStack {...styles.container}>
      <PageHeader
        title={titleNode as any}
        subtitle={t('lc.sessionsSupport.subtitle')}
        _css={styles.pageHeaderCss}
        rightSection={
          <Box {...styles.rightSectionBox}>
            <HStack {...styles.rightSectionHStack}>
              <Button {...styles.createSessionBtn} onPress={() => navigation.navigate('sessions-support/create' as never)}>
                <ButtonIcon as={LucideIcon} name="Plus" size={16} color="$textForegroundColor" />
                <ButtonText {...styles.createSessionBtnText}>
                  {t('lc.sessionsSupport.createSession')}
                </ButtonText>
              </Button>
              <Button {...styles.requestSupportBtn} onPress={() => setIsDropdownOpen(prev => !prev)}>
                <ButtonIcon as={LucideIcon} name="Plus" size={16} color="$white" />
                <ButtonText {...styles.requestSupportBtnText}>
                  {t('lc.sessionsSupport.requestSupport')}
                </ButtonText>
              </Button>
            </HStack>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <>
                {/* Backdrop to close menu when clicking outside */}
                <Pressable
                  {...styles.backdropPressable}
                  onPress={() => setIsDropdownOpen(false)}
                />
                <Box {...styles.dropdownBox}>
                  <VStack>
                    {REQUEST_SUPPORT_OPTIONS.map((item, idx) => (
                      <Pressable
                        key={item.id}
                        {...styles.dropdownItemPressable}
                        borderBottomWidth={idx !== REQUEST_SUPPORT_OPTIONS.length - 1 ? 1 : 0}
                        borderBottomColor="$borderLight100"
                        onPress={() => handleSelectOption(item.route)}
                      >
                        <HStack {...styles.dropdownItemHStack}>
                          <Box {...styles.dropdownItemIconBox}>
                            <LucideIcon name={item.icon} size={18} color="#8B2842" />
                          </Box>
                          <VStack {...styles.dropdownItemVStack}>
                            <Text {...styles.dropdownItemTitle}>
                              {item.title}
                            </Text>
                            <Text {...styles.dropdownItemDescription}>
                              {item.description}
                            </Text>
                          </VStack>
                        </HStack>
                      </Pressable>
                    ))}
                  </VStack>
                </Box>
              </>
            )}
          </Box>
        }
      />

      <Box {...supportOfferingsStyles.sessionSupportTabBox}>
        <Container {...supportOfferingsStyles.container} py="$0">
          <Box {...supportOfferingsStyles.sessionSupportTabWrapper}>
            {displayTabs.map((tab) => (
              <TabButton
                key={tab.key}
                tab={tab}
                isActive={activeTab === tab.key}
                onPress={handleTabChange}
                variant="ButtonTab"
                _text={supportOfferingsStyles.tabTextProps}
                _container={{
                  ...supportOfferingsStyles.tabButtonContainer,
                  borderRadius: activeTab === tab.key ? 50 : 0,
                }}
                iconSize={16}
              />
            ))}
          </Box>
        </Container>
      </Box>

      {subTabs.length > 0 && (
        <Box {...styles.sessionSupportSubTabBarBox}>
          <Container {...supportOfferingsStyles.container} py="$0">
            <Box {...styles.subTabBarBorderWrapper}>
              <HStack alignItems="center" space="sm">
                {subTabs.map((tab) => (
                  <TabButton
                    key={tab.key}
                    tab={tab}
                    isActive={activeSubTab === tab.key}
                    onPress={(key) => setActiveSubTab(key)}
                    _text={supportOfferingsStyles.tabTextProps}
                    _container={styles.subTabButtonContainer}
                    iconSize={16}
                  />
                ))}
              </HStack>
            </Box>
          </Container>
        </Box>
      )}

      <Container {...supportOfferingsStyles.container}>
        <VStack {...supportOfferingsStyles.contentContainer}>
          {activeSubTab === 'browse_sessions' ? (
            <>
              <RequestorFilter
                filters={filters}
                onFilterChange={handleFilterChange}
                provinceOptions={provinceOptions}
                siteOptions={siteOptions}
                pathwayOptions={pathwayOptions}
                formatOptions={formatOptions}
                shouldDisableSite={!filters.province || filters.province === 'all-provinces'}
              />
              <Text {...styles.sessionsFoundText}>
                {total} {t('lc.sessionsSupport.sessionsFound')}
              </Text>

              {activeTab === 'sessions' && (
                <TrainingCard
                  items={items}
                  isShowLoadMore={isShowLoadMore}
                  onLoadMoreItems={onLoadMoreItems}
                  isLoadingMore={_loading && page > 1}
                  _card={{
                    footer: (item: any) => (
                      <RequestFooter item={item} onAssignSession={handleAssignSessionClick} />
                    ),
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
            </>
          ) : activeSubTab === 'my_sessions' ? (
            mySessions.length > 0 ? (
              <VStack {...styles.mySessionsListVStack}>
                {mySessions.map((session, idx) => (
                  <LcMySessionTab
                    key={session.id || session._id || idx}
                    item={session}
                    isFirst={idx === 0}
                  />
                ))}
              </VStack>
            ) : (
              <Box {...styles.emptyStateContainer}>
                <VStack {...styles.emptyStateVStack}>
                  <Box {...styles.emptyStateIconContainer}>
                    <LucideIcon name="Clock" size={30} color="$textMutedForeground" />
                  </Box>
                  <Text {...styles.emptyStateTitle}>
                    {t('lc.sessionsSupport.emptyState.title', 'No history yet')}
                  </Text>
                  <Text {...styles.emptyStateDescription}>
                    {t('lc.sessionsSupport.emptyState.description', 'Completed support will appear here')}
                  </Text>
                </VStack>
              </Box>
            )
          ) : (
            <Box {...styles.emptyStateContainer}>
              <VStack {...styles.emptyStateVStack}>
                <Box {...styles.emptyStateIconContainer}>
                  <LucideIcon name="Clock" size={30} color="$textMutedForeground" />
                </Box>
                <Text {...styles.emptyStateTitle}>
                  {t('lc.sessionsSupport.emptyState.title', 'No history yet')}
                </Text>
                <Text {...styles.emptyStateDescription}>
                  {t('lc.sessionsSupport.emptyState.description', 'Completed support will appear here')}
                </Text>
              </VStack>
            </Box>
          )}
        </VStack>
      </Container>

      <AssignParticipantsModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        session={selectedSession}
        onConfirm={handleConfirmAssignment}
      />
    </VStack>
  );
};

export default SessionsSupportScreen;
