import React, { useState, useEffect } from 'react';
import { Box, Button, ButtonIcon, ButtonText, Container, HStack, LucideIcon, VStack } from '@ui';
import styles from './styles';
import SPTitleHeader from '@components/Header/SPTitleHeader';
import { useNavigation } from '@react-navigation/native';
import { useLanguage } from '@contexts/LanguageContext';
import { TabButton } from '@components/Tabs';
import FilterButton from '@components/Filter';
import TrainingCard from './components/Cards/TrainingCard';
import AdditionalServicesCard from './components/Cards/AdditionalServicesCard';
import AssetCard from './components/Cards/AssetCard';
import { getProvincesList, getSitesByProvince } from '../../../services/usersService';
import { getTrainingSessions, getAdditionalServices, getAssets } from '../../../services/SupportOfferingsServices/supportOfferingsService';
import type { ProvinceEntity, SiteEntity } from '@app-types/Users';
import { STATUS_OPTIONS } from '../../../constants/SUPPORT_OFFERINGS_MOCK';

const DEFAULT_PROVINCE_OPTIONS = [
  { label: 'All Provinces', value: 'all-provinces' },
];

const DEFAULT_SITE_OPTIONS = [
  { label: 'All Sites', value: 'all-sites' },
];

const App = (): React.JSX.Element => {
  const navigation = useNavigation();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('sessions');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [provincesList, setProvincesList] = useState<ProvinceEntity[]>([]);
  const [sitesList, setSitesList] = useState<SiteEntity[]>([]);

  const [provinceOptions, setProvinceOptions] = useState(DEFAULT_PROVINCE_OPTIONS);
  const [siteOptions, setSiteOptions] = useState(DEFAULT_SITE_OPTIONS);

  const [counts, setCounts] = useState({
    sessions: 0,
    additional_services: 0,
    assets: 0,
  });

  // Fetch counts dynamically for each tab category
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [sessionsData, servicesData, assetsData] = await Promise.all([
          getTrainingSessions({}),
          getAdditionalServices({}),
          getAssets({}),
        ]);

        setCounts({
          sessions: sessionsData.length,
          additional_services: servicesData.length,
          assets: assetsData.length,
        });
      } catch (err) {
        console.error('Error fetching tab counts:', err);
      }
    };
    fetchCounts();
  }, []);

  const tabs = [
    { key: 'sessions', label: 'Trainings & Sessions', count: counts.sessions, icon: 'GraduationCap' },
    { key: 'additional_services', label: 'Additional Services', count: counts.additional_services, icon: 'Briefcase' },
    { key: 'assets', label: 'Assets', count: counts.assets, icon: 'Box' },
  ];

  // Fetch dynamic provinces from API
  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        const provincesData = await getProvincesList();
        if (provincesData && provincesData.length > 0) {
          setProvincesList(provincesData);
          const dynamicProvinces = [
            { label: 'All Provinces', value: 'all-provinces' },
            ...provincesData.map((p: any) => ({
              label: p.name || p.title || p.label,
              value: p.name?.toLowerCase()
              // we can use it for api
              // value: p._id || p.id || p.value || p.name?.toLowerCase(),
            })),
          ];
          setProvinceOptions(dynamicProvinces);
        }
      } catch (err) {
        console.error('Error fetching dynamic provinces:', err);
      }
    };
    fetchFilterData();
  }, []);

  // Fetch dynamic sites based on selected province filter
  useEffect(() => {
    const fetchSitesData = async () => {
      try {
        const selectedProv = filters.province;
        const selectedProvinceObj = provincesList.find(
          (p: any) => p.name?.toLowerCase() === selectedProv?.toLowerCase() || p._id === selectedProv
        );
        const provinceIdParam = selectedProvinceObj ? selectedProvinceObj._id : (selectedProv && selectedProv !== 'all-provinces' ? selectedProv : undefined);

        const res = await getSitesByProvince({
          provinceId: provinceIdParam,
          page: 1,
          limit: 100,
        });
        const fetchedSites = res?.result?.data || [];
        setSitesList(fetchedSites);
        const dynamicSites = [
          { label: 'All Sites', value: 'all-sites' },
          ...(fetchedSites || []).map((s: any) => ({
            label: s.name || s.title || s.label,
            value: s.name?.toLowerCase() || s._id,
          })),
        ];
        setSiteOptions(dynamicSites);
      } catch (err) {
        console.error('Error fetching dynamic sites:', err);
      }
    };
    fetchSitesData();
  }, [filters.province, provincesList]);

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
    {
      type: 'select',
      attr: 'draftStatus',
      placeholder: 'Publish Status',
      data: [
        { label: 'Published', value: 'Published' },
        { label: 'Drafts', value: 'Draft' },
      ],
    },
  ];

  const cardProps = {
    searchQuery: filters.search,
    statusFilter: filters.status,
    provinceFilter: filters.province,
    siteFilter: filters.site,
    draftStatusFilter: filters.draftStatus,
    provincesList: provincesList,
    sitesList: sitesList,
  };

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
                onPress={setActiveTab}
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
            onFilterChange={setFilters}
            showClearButton={false}
            hideTitleHeader={true}
            _container={styles.filterContainer}
          />

          {activeTab === 'sessions' && <TrainingCard {...cardProps} />}
          {activeTab === 'additional_services' && <AdditionalServicesCard {...cardProps} />}
          {activeTab === 'assets' && <AssetCard {...cardProps} />}
        </VStack>
      </Container>
    </VStack>
  );
};

export default App;
