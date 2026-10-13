import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, ButtonIcon, ButtonText, Container, HStack, LucideIcon, Pressable, Text, VStack, useAlert, Badge, BadgeText, Spinner } from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import { useAuth } from '@contexts/AuthContext';
import { useProfileCompletion } from '@hooks';
import { useNavigation, useRoute } from '@react-navigation/native';
import PageHeader from '@components/PageHeader';
import MyRequests from './MyRequests';
import {
  REQUEST_SUPPORT_OPTIONS,
  getSupportOfferingTabs,
  DEFAULT_PROVINCE_OPTIONS,
  DEFAULT_SITE_OPTIONS,
  FORM_MODE,
  SUPPORT_PROVIDER_ROUTES as ROUTES,
  SUPPORT_OFFERING_TABS,
  SUPPORT_OFFERING_SUB_TABS,
  SUPPORT_OFFERING_TYPE_VALUES,
  REQUEST_STATUS,
  SESSION_STATUS_LABEL,
  OFFERING_FILTER_FIELDS as FILTER_FIELDS,
  OFFERING_FILTER_ALL_OPTIONS as FILTER_ALL,
} from '@constants/SUPPORT_PROVIDER_CARDS';
import { deriveStatusLabel } from '@hooks/useSessionStatus';
import { TabButton } from '@components/Tabs';
import FilterButton from '@components/Filter';
import TrainingCard from '../ServiceProvider/SupportOfferings/components/Cards/TrainingCard';
import AssetsCard from './AssetsCard';
import AdditionalServiceCard from './AdditionalServiceCard';
import { getProvincesList, getSitesByProvince } from '../../services/usersService';
import { getTrainingSessions, getAdditionalServices, getAssets, mapToAssetItem } from '../../services/SupportOfferingsServices/supportOfferingsService';
import { getRequestSessionsList, requestorAssignMenteesToSession, getMyRequestsList } from '../../services/SessionSupportServices/sessionRequestorService';
import type { ProvinceEntity } from '@app-types/Users';
import type { AssetItem } from '../../types/supportOfferingsTypes';
import { getSessionCategories, getDeliveryModes, getSessionTypesByPillar, requestSession } from '../../services/mentoringService';
import { requestAssetPayloadMapping } from '@utils/supportProvider';
import { DEFAULT_FORMAT_OPTIONS, DEFAULT_PILLAR_OPTIONS, DEFAULT_TYPE_OPTIONS } from '../../constants/REQUESTOR_CONSTANTS';
import { STATUS_OPTIONS as SP_STATUS_OPTIONS } from '../ServiceProvider/SupportOfferings';
import { RequestorFilter } from './RequestorFilter';
import styles from './styles';
import supportOfferingsStyles from '../ServiceProvider/SupportOfferings/styles';
import { RequestFooter } from './RequestorFooter';
import AssignParticipantsModal from './modals/AssignParticipantsModal';
import LcMySessionTab, { getSessionBadgeLabel } from './MyTraining&Sessions/LcMySessionTab';

// Fallback filter if the backend doesn't apply `support_offering_type`; normalizes both string
// and `{ value, label }` shapes across APIs (missing type = assume it belongs).

const HISTORY_FETCH_LIMIT = 100;

// Browse tabs only list offerings that can still be joined: Upcoming or In Progress (completed ones live in History)
const BROWSE_VISIBLE_STATUSES: string[] = [SESSION_STATUS_LABEL.UPCOMING, SESSION_STATUS_LABEL.IN_PROGRESS];
const isBrowsable = (item: any) => BROWSE_VISIBLE_STATUSES.includes(deriveStatusLabel(item));
// LC status filter: All Statuses, Upcoming and In Progress (values as in the SP status options)
const LC_STATUS_FILTER_VALUES = ['all-statuses', 'Upcoming', 'live'];
// sessions/list ignores the status param, so each filter value is also matched against the card's status badge
const LC_STATUS_FILTER_TO_BADGE: Record<string, string> = {
  Upcoming: SESSION_STATUS_LABEL.UPCOMING,
  live: SESSION_STATUS_LABEL.IN_PROGRESS,
};
// History tab only lists sessions whose card badge is Completed or Expired
const HISTORY_BADGES: string[] = [SESSION_STATUS_LABEL.COMPLETED, SESSION_STATUS_LABEL.EXPIRED];
const matchesOfferingType = (item: any, expectedType: string): boolean => {
  const rawType = item?.support_offering_type || item?.type || item?.session?.support_offering_type;
  const itemType = rawType && typeof rawType === 'object' ? rawType.value : rawType;
  return !itemType || itemType === expectedType || (expectedType === SUPPORT_OFFERING_TYPE_VALUES.TRAINING_SESSION && itemType === 'training_session');
};

const SessionsSupportScreen: React.FC = () => {
  const { t } = useLanguage();
  const navigation = useNavigation();
  const route = useRoute() as any;
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [mySessions, setMySessions] = useState<any[]>([]);
  const [isRequestAssetModalOpen, setIsRequestAssetModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<AssetItem | null>(null);
  const { showAlert } = useAlert();
  const { user } = useAuth() || {};
  const { allowedProvinces, allowedSites, isProfileLoading } = useProfileCompletion();
  // org_admin / tenant_admin operate on a single province: lock it and limit sites to their profile
  const isProvinceLocked = (user?.role === 'org_admin' || user?.role === 'tenant_admin') && allowedProvinces.length > 0;
  const lockedProvinceId = isProvinceLocked ? allowedProvinces[0] : undefined;

  const handleAssignSessionClick = (item: any) => {
    setSelectedSession(item);
    setIsAssignModalOpen(true);
  };

  const handleRequestAssetClick = (item: AssetItem) => {
    setSelectedAsset(item);
    setIsRequestAssetModalOpen(true);
  };

  const handleConfirmAssetRequest = async (selectedIds: string[]): Promise<boolean> => {
    if (!selectedAsset) return false;
    try {
      const payload = requestAssetPayloadMapping({
        assetTitle: selectedAsset.title,
        assetDescription: selectedAsset.description,
        assetType: selectedAsset.type,
        livelihoodCategory: selectedAsset.sector,
        estimatedValue: selectedAsset.estimatedValuePerParticipant,
        availableQuantity: selectedIds.length,
        provinces: selectedAsset.province,
        sites: selectedAsset.siteKey,
        requestees: selectedIds,
        isDraft: false,
      });
      await requestSession(payload);
      showAlert(
        'success',
        t(
          'lc.sessionsSupport.alerts.assetRequestSuccess',
          { count: selectedIds.length, defaultValue: `Asset request submitted for ${selectedIds.length} participant(s).` }
        )
      );
      return true;
    } catch (err: any) {
      console.error('Error requesting asset:', err);
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to submit asset request.';
      showAlert('error', errMsg);
      return false;
    }
  };

  const handleConfirmAssignment = async (selectedIds: string[]): Promise<boolean> => {
    if (!selectedSession) return false;
    const sessionId = selectedSession.id || selectedSession._id;
    try {
      await requestorAssignMenteesToSession(sessionId, selectedIds);
      showAlert(
        'success',
        t(
          'lc.sessionsSupport.alerts.assignSuccess',
          { count: selectedIds.length, defaultValue: `${selectedIds.length} participant(s) assigned to session successfully.` }
        )
      );

      // Decrement seats_remaining locally so reopening the modal enforces the updated limit
      const decrementSeats = (session: any) => {
        if ((session.id || session._id) !== sessionId) return session;
        const currentRemaining = session.seats_remaining ?? session.seats_limit ?? 0;
        return { ...session, seats_remaining: Math.max(0, currentRemaining - selectedIds.length) };
      };
      setSelectedSession((prev: any) => (prev ? decrementSeats(prev) : prev));
      setItems((prev) => prev.map(decrementSeats));
      setMySessions((prev) => prev.map(decrementSeats));
      return true;
    } catch (err: any) {
      console.error('Error assigning participants:', err);
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to assign participants to session.';
      showAlert('error', errMsg);
      return false;
    }
  };

  // Listing state, filters, and tabs reused from SupportOfferings logic
  const [activeTab, setActiveTab] = useState<string>(SUPPORT_OFFERING_TABS.SESSIONS);
  const [activeSubTab, setActiveSubTab] = useState<string>(SUPPORT_OFFERING_SUB_TABS.BROWSE_SESSIONS);
  const [refreshRequests, setRefreshRequests] = useState<number>(0);

  // Capture newly created session or request from navigation params
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
      setActiveTab(SUPPORT_OFFERING_TABS.SESSIONS);
      setActiveSubTab(SUPPORT_OFFERING_SUB_TABS.MY_SESSIONS);
      // Clear the param so re-visits don't re-add it
      navigation.setParams({ newSession: undefined } as any);
    }
    if (params?.activeSubTab) {
      setActiveTab(params.activeTab || SUPPORT_OFFERING_TABS.SESSIONS);
      setActiveSubTab(params.activeSubTab);
      if (params.refreshRequests) {
        setRefreshRequests(params.refreshRequests);
      }
      navigation.setParams({ activeTab: undefined, activeSubTab: undefined, refreshRequests: undefined } as any);
    }
  }, [route?.params]);


  const [filters, setFilters] = useState<Record<string, any>>({});
  const [provincesList, setProvincesList] = useState<ProvinceEntity[]>([]);
  const [provinceOptions, setProvinceOptions] = useState(DEFAULT_PROVINCE_OPTIONS);
  const [allSiteOptions, setAllSiteOptions] = useState<any[]>([]);
  const [siteOptions, setSiteOptions] = useState(DEFAULT_SITE_OPTIONS);
  const [pillarOptions, setPillarOptions] = useState(DEFAULT_PILLAR_OPTIONS);
  const [typeOptions, setTypeOptions] = useState(DEFAULT_TYPE_OPTIONS);
  // SP "My Support Interventions" status options, limited to the two statuses LC needs (plus "All Statuses")
  const [statusOptions, setStatusOptions] = useState<any[]>(
    SP_STATUS_OPTIONS.filter((option) => LC_STATUS_FILTER_VALUES.includes(option.value)),
  );
  const [formatOptions, setFormatOptions] = useState(DEFAULT_FORMAT_OPTIONS);

  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(5);
  const [total, setTotal] = useState<number>(0);
  const browseHiddenCountRef = useRef(0);
  const historyLoadedCountRef = useRef(0);
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
    icon: tab.key === SUPPORT_OFFERING_TABS.SESSIONS ? 'Calendar' : tab.key === SUPPORT_OFFERING_TABS.ADDITIONAL_SERVICES ? 'Wrench' : 'Box',
  }));

  const subTabs = tabs.find((tab) => tab.key === activeTab)?.children || [];

  const handleTabChange = (key: string) => {
    if (key === activeTab) return;
    // Every tab's Browse sub-tab shares the same key, so filters are cleared here or they would carry over to the new tab
    setFilters({});
    setPage(1);
    setItems([]);
    setActiveTab(key);
    const newTab = tabs.find((tab) => tab.key === key);
    if (newTab && newTab.children && newTab.children.length > 0) {
      setActiveSubTab(newTab.children[0].key);
    } else {
      setActiveSubTab(SUPPORT_OFFERING_SUB_TABS.BROWSE_SESSIONS);
    }
  };

  // Clears the previous sub-tab's filters and page in the same update, so the new sub-tab is never fetched with them
  const handleSubTabChange = (key: string) => {
    if (key === activeSubTab) return;
    setFilters({});
    setPage(1);
    setItems([]);
    setActiveSubTab(key);
  };

  const handleFilterChange = (newFilters: Record<string, any>) => {
    // Reset the page in the same update, so the list is fetched once (page 1) instead of first with the old page
    setPage(1);
    setFilters(newFilters);
  };

  const isShowLoadMore = items.length < total && items.length > 0;
  const onLoadMoreItems = () => {
    setPage((prevPage) => prevPage + 1);
  };

  const filterOptions = [
    {
      type: 'select',
      attr: FILTER_FIELDS.PROVINCE,
      placeholder: 'All Provinces',
      data: provinceOptions,
    },
    {
      type: 'select',
      attr: FILTER_FIELDS.SITE,
      placeholder: 'All Sites',
      data: siteOptions,
    },
  ];

  // Fetch dynamic provinces, pillars, and formats/delivery modes from API
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
            // Profile may have changed while the request was pending; drop the stale result
            if (!isMounted) return;
            setAllSiteOptions(data || []);
            const mappedProvinces = provincesData.map((p: any) => ({
              label: p.metaInformation?.name || p.name || p.title || p.label,
              value: p._id || p.id || p.value,
            }));
            const dynamicProvinces = isProvinceLocked
              ? mappedProvinces.filter((p: any) => allowedProvinces.includes(p.value))
              : [{ label: 'All Provinces', value: FILTER_ALL.ALL_PROVINCES }, ...mappedProvinces];
            setProvinceOptions(dynamicProvinces);
          }

          if (categoriesData && categoriesData.length > 0) {
            const dynamicPillars = [
              { label: 'All Pillars', value: FILTER_ALL.ALL_PILLARS },
              ...categoriesData.map((c: any) => ({
                label: c.label || c.name || c.value,
                value: c.value,
              })),
            ];
            setPillarOptions(dynamicPillars);
          }

          if (deliveryModesData && deliveryModesData.length > 0) {
            const dynamicFormats = [
              { label: 'All Formats', value: FILTER_ALL.ALL_FORMATS },
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
    if (isProfileLoading) return;
    fetchFilterData();
    return () => {
      isMounted = false;
    };
  }, [isProfileLoading, isProvinceLocked]);

  // Fetch dynamic sites based on selected province filter
  useEffect(() => {
    let isMounted = true;
    const fetchSitesData = async () => {
      const selectedProv = filters[FILTER_FIELDS.PROVINCE];

      if (!selectedProv || selectedProv === FILTER_ALL.ALL_PROVINCES) {
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
          const mappedSites = fetchedSites.map((s: any) => ({
            label: s.metaInformation?.name || s.name || s.title || s.label,
            value: s._id || s.id || s.value,
          }));
          const dynamicSites = [
            { label: 'All Sites', value: FILTER_ALL.ALL_SITES },
            ...(isProvinceLocked && allowedSites.length > 0
              ? mappedSites.filter((s: any) => allowedSites.includes(s.value))
              : mappedSites),
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
  }, [filters.province, provincesList, isProvinceLocked, allowedSites]);

  // Fetch dynamic types based on selected pillar filter
  useEffect(() => {
    let isMounted = true;
    const fetchTypesData = async () => {
      const selectedPillar = filters[FILTER_FIELDS.PILLAR];

      if (!selectedPillar || selectedPillar === FILTER_ALL.ALL_PILLARS) {
        if (isMounted) {
          setTypeOptions(DEFAULT_TYPE_OPTIONS);
        }
        return;
      }

      try {
        const typesData = await getSessionTypesByPillar(selectedPillar);
        if (isMounted) {
          const dynamicTypes = [
            { label: 'All Types', value: FILTER_ALL.ALL_TYPES },
            ...typesData.map((t: any) => ({
              label: t.label || t.name || t.value,
              value: t.value || t._id || t.id,
            })),
          ];
          setTypeOptions(dynamicTypes);
        }
      } catch (err) {
        console.error('Error fetching session types by pillar:', err);
        if (isMounted) {
          setTypeOptions(DEFAULT_TYPE_OPTIONS);
        }
      }
    };

    fetchTypesData();
    return () => {
      isMounted = false;
    };
  }, [filters.pillar]);

  // Reset page when tab or filters change
  useEffect(() => {
    setPage(1);
  }, [activeTab, filters.search, filters.status, filters.province, filters.site, filters.pillar, filters.type, filters.format]);

  // Reset page and filters when active sub-tab changes
  useEffect(() => {
    setPage(1);
    setFilters({});
    setItems([]);
  }, [activeSubTab]);

  // Fetch listing data
  useEffect(() => {
    if (
      activeSubTab !== SUPPORT_OFFERING_SUB_TABS.BROWSE_SESSIONS &&
      activeSubTab !== SUPPORT_OFFERING_SUB_TABS.MY_REQUESTS &&
      activeSubTab !== SUPPORT_OFFERING_SUB_TABS.MY_SESSIONS &&
      activeSubTab !== SUPPORT_OFFERING_SUB_TABS.HISTORY
    ) {
      return;
    }
    let isMounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        // Sessions store the training type in idp_training_task, so Pillar = any type of that pillar and Type = that one type
        const selectedPillar = filters[FILTER_FIELDS.PILLAR];
        const selectedType = filters[FILTER_FIELDS.TYPE];
        const pillarTypeValues = typeOptions
          .map((option: any) => option.value)
          .filter((value: string) => value && value !== FILTER_ALL.ALL_TYPES);
        let idpTrainingTask: string | undefined;
        if (selectedPillar && selectedPillar !== FILTER_ALL.ALL_PILLARS && pillarTypeValues.length > 0) {
          idpTrainingTask = pillarTypeValues.includes(selectedType) ? selectedType : pillarTypeValues.join(',');
        }

        const params: any = {
          page,
          limit,
          search: filters[FILTER_FIELDS.SEARCH],
          status: filters[FILTER_FIELDS.STATUS],
          idp_training_task: idpTrainingTask,
          format: filters[FILTER_FIELDS.FORMAT],
          isSessionsSupport: true,
        };

        if (filters[FILTER_FIELDS.PROVINCE] && filters[FILTER_FIELDS.PROVINCE] !== FILTER_ALL.ALL_PROVINCES) {
          params.provinces = filters[FILTER_FIELDS.PROVINCE];
        }

        if (filters[FILTER_FIELDS.SITE] && filters[FILTER_FIELDS.SITE] !== FILTER_ALL.ALL_SITES) {
          params.sites = filters[FILTER_FIELDS.SITE];
        }

        let fetchedData: any[] = [];
        const isBrowseSubTab = activeSubTab === SUPPORT_OFFERING_SUB_TABS.BROWSE_SESSIONS;
        if (page === 1) browseHiddenCountRef.current = 0;
        const selectedStatusBadge = LC_STATUS_FILTER_TO_BADGE[filters[FILTER_FIELDS.STATUS]];
        const keepBrowsable = (list: any[]) => {
          if (!isBrowseSubTab) return list;
          const visible = list.filter(
            (item) => isBrowsable(item) && (!selectedStatusBadge || deriveStatusLabel(item) === selectedStatusBadge),
          );
          // A superseded request must not add to the shared hidden count, or "sessions found" is reduced twice
          if (isMounted) browseHiddenCountRef.current += list.length - visible.length;
          return visible;
        };
        let totalCount = 0;

        if (activeSubTab === SUPPORT_OFFERING_SUB_TABS.HISTORY && activeTab === SUPPORT_OFFERING_TABS.SESSIONS) {
          // sessions/list ignores a status filter and also returns upcoming sessions, so only cards whose badge is Completed/Expired are kept
          const result = await getRequestSessionsList({
            ...params,
            support_offering_type: SUPPORT_OFFERING_TYPE_VALUES.TRAINING_SESSION,
          });
          const rawSessions = result?.result?.data || [];
          fetchedData = rawSessions.filter((item: any) => HISTORY_BADGES.includes(getSessionBadgeLabel(item)));
          if (page === 1) historyLoadedCountRef.current = 0;
          if (isMounted) historyLoadedCountRef.current += fetchedData.length;
          // Results are sorted by start date, so a page without any ended session means only upcoming ones remain
          const hasReachedUpcoming = fetchedData.length === 0 || rawSessions.length < limit;
          totalCount = hasReachedUpcoming
            ? historyLoadedCountRef.current
            : result?.result?.count ?? result?.total ?? result?.count ?? rawSessions.length;
        } else if (activeSubTab === SUPPORT_OFFERING_SUB_TABS.HISTORY) {
          const historyParams = { ...params, page: 1, limit: HISTORY_FETCH_LIMIT };
          const offeringType = activeTab === SUPPORT_OFFERING_TABS.ADDITIONAL_SERVICES
            ? SUPPORT_OFFERING_TYPE_VALUES.ADDITIONAL_SERVICE
            : SUPPORT_OFFERING_TYPE_VALUES.ASSET;
          const res = await getMyRequestsList({ ...historyParams, support_offering_type: offeringType });
          const rawList = (Array.isArray(res) ? res : (res as any)?.result?.data || (res as any)?.result || [])
            .filter((item: any) => matchesOfferingType(item, offeringType))
            .map((item: any) => {
              const session = item.session || item.session_details || {};
              return {
                ...item,
                title: item.title || session.title || 'Untitled Request',
                status: item.status || REQUEST_STATUS.REQUESTED,
                start_date: item.start_date || session.start_date,
                end_date: item.end_date || session.end_date,
                delivery_mode: item.delivery_mode || session.delivery_mode,
              };
            });
          fetchedData = rawList.filter((item: any) => deriveStatusLabel(item) === SESSION_STATUS_LABEL.COMPLETED);
          // Additional Services History reuses the My Requests card, whose badge reads `status`
          if (activeTab === SUPPORT_OFFERING_TABS.ADDITIONAL_SERVICES) {
            fetchedData = fetchedData.map((item: any) => ({ ...item, status: SESSION_STATUS_LABEL.COMPLETED }));
          }
          totalCount = fetchedData.length;
        } else if (activeTab === SUPPORT_OFFERING_TABS.SESSIONS) {
          let result;
          if (activeSubTab === SUPPORT_OFFERING_SUB_TABS.BROWSE_SESSIONS) {
            result = await getRequestSessionsList({ ...params, support_offering_type: SUPPORT_OFFERING_TYPE_VALUES.TRAINING_SESSION });
            const rawSessions = result?.result?.data || [];
            totalCount = result?.result?.count ?? result?.total ?? result?.count ?? (result?.result?.total ?? rawSessions.length);
            fetchedData = keepBrowsable(rawSessions);
            setCounts((prev) => ({ ...prev, sessions: totalCount }));
          } else if (activeSubTab === SUPPORT_OFFERING_SUB_TABS.MY_REQUESTS) {
            result = await getMyRequestsList({ ...params, support_offering_type: SUPPORT_OFFERING_TYPE_VALUES.TRAINING_SESSION });
            const rawList = (Array.isArray(result) ? result : (result?.result?.data || result?.result || []))
              .filter((item: any) => matchesOfferingType(item, SUPPORT_OFFERING_TYPE_VALUES.TRAINING_SESSION));
            fetchedData = rawList.map((item: any) => {
              const session = item.session || item.session_details || {};
              return {
                ...item,
                title: item.title || session.title || 'Untitled Request',
                status: item.status || REQUEST_STATUS.REQUESTED,
                start_date: item.start_date || session.start_date,
                end_date: item.end_date || session.end_date,
                seats_limit: item.seats_limit || session.seats_limit || item.max_participants || session.max_participants,
                seats_remaining: item.seats_remaining ?? session.seats_remaining ?? item.seats_limit ?? session.seats_limit,
                delivery_mode: item.delivery_mode || session.delivery_mode,
              };
            });
            totalCount = result?.result?.count ?? result?.total ?? result?.count ?? (result?.result?.total ?? fetchedData.length);
          } else {
            result = await getTrainingSessions({});
            fetchedData = result?.result?.data || [];
            totalCount = result?.result?.count ?? result?.total ?? result?.count ?? (result?.result?.total ?? fetchedData.length);
          }

        } else if (activeTab === SUPPORT_OFFERING_TABS.ADDITIONAL_SERVICES) {
          let res;
          if (activeSubTab === SUPPORT_OFFERING_SUB_TABS.MY_SESSIONS || activeSubTab === SUPPORT_OFFERING_SUB_TABS.MY_REQUESTS) {
            res = await getMyRequestsList({ ...params, support_offering_type: SUPPORT_OFFERING_TYPE_VALUES.ADDITIONAL_SERVICE });
          } else {
            res = await getRequestSessionsList({ ...params, support_offering_type: SUPPORT_OFFERING_TYPE_VALUES.ADDITIONAL_SERVICE });
          }
          const rawList = keepBrowsable(
            (Array.isArray(res) ? res : (res as any)?.result?.data || (res as any)?.result || [])
              .filter((item: any) => matchesOfferingType(item, SUPPORT_OFFERING_TYPE_VALUES.ADDITIONAL_SERVICE)),
          );
          fetchedData = rawList.map((item: any) => {
            const session = item.session || item.session_details || {};
            return {
              ...item,
              title: item.title || session.title || 'Untitled Request',
              status: item.status || REQUEST_STATUS.REQUESTED,
              start_date: item.start_date || session.start_date,
              end_date: item.end_date || session.end_date,
              delivery_mode: item.delivery_mode || session.delivery_mode,
            };
          });
          totalCount = (res as any)?.result?.count ?? (res as any)?.total ?? (res as any)?.count ?? fetchedData.length;
          setCounts((prev) => ({ ...prev, additional_services: totalCount }));
        } else if (activeTab === SUPPORT_OFFERING_TABS.ASSETS) {
          const isBrowse = activeSubTab !== SUPPORT_OFFERING_SUB_TABS.MY_SESSIONS && activeSubTab !== SUPPORT_OFFERING_SUB_TABS.MY_REQUESTS;
          let res;
          if (!isBrowse) {
            res = await getMyRequestsList({ ...params, support_offering_type: SUPPORT_OFFERING_TYPE_VALUES.ASSET });
          } else {
            res = await getRequestSessionsList({ ...params, support_offering_type: SUPPORT_OFFERING_TYPE_VALUES.ASSET });
          }
          // Filter before mapToAssetItem, which drops the start/end dates the status is derived from
          const rawList = keepBrowsable(
            (Array.isArray(res) ? res : (res as any)?.result?.data || (res as any)?.result || [])
              .filter((item: any) => matchesOfferingType(item, SUPPORT_OFFERING_TYPE_VALUES.ASSET)),
          );
          fetchedData = isBrowse
            ? rawList.map(mapToAssetItem)
            : rawList.map((item: any) => {
              const session = item.session || item.session_details || {};
              return {
                ...item,
                title: item.title || session.title || 'Untitled Request',
                status: item.status || REQUEST_STATUS.REQUESTED,
                start_date: item.start_date || session.start_date,
                end_date: item.end_date || session.end_date,
                delivery_mode: item.delivery_mode || session.delivery_mode,
              };
            });
          totalCount = (res as any)?.result?.count ?? (res as any)?.total ?? (res as any)?.count ?? fetchedData.length;
          setCounts((prev) => ({ ...prev, assets: totalCount }));
        }

        if (isMounted) {
          if (activeSubTab === SUPPORT_OFFERING_SUB_TABS.MY_SESSIONS || activeSubTab === SUPPORT_OFFERING_SUB_TABS.HISTORY) {
            if (page === 1) {
              setMySessions(fetchedData);
            } else {
              setMySessions((prev) => [...prev, ...fetchedData]);
            }
          }
          if (page === 1) {
            setItems(fetchedData);
          } else {
            setItems((prev) => [...prev, ...fetchedData]);
          }
          setTotal(isBrowseSubTab ? Math.max(0, totalCount - browseHiddenCountRef.current) : totalCount);
          if (isBrowseSubTab && fetchedData.length === 0 && page * limit < totalCount) {
            setPage((prev) => prev + 1);
          }
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
  }, [activeTab, activeSubTab, filters.search, filters.status, filters.province, filters.site, filters.pillar, filters.type, typeOptions, filters.format, page, limit, refreshRequests]);

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
              <Button {...styles.createSessionBtn} onPress={() => navigation.navigate(ROUTES.SESSIONS_SUPPORT_CREATE as never)}>
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
                            {(item as any).description ? (
                              <Text {...styles.dropdownItemDescription}>
                                {(item as any).description}
                              </Text>
                            ) : null}
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
                    onPress={handleSubTabChange}
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
          {activeSubTab === SUPPORT_OFFERING_SUB_TABS.BROWSE_SESSIONS ? (
            <>
              <RequestorFilter
                key={activeTab}
                filters={filters}
                onFilterChange={handleFilterChange}
                provinceOptions={provinceOptions}
                siteOptions={siteOptions}
                pillarOptions={pillarOptions}
                typeOptions={typeOptions}
                statusOptions={statusOptions}
                formatOptions={formatOptions}
                hideProvince={isProvinceLocked}
                initialValue={lockedProvinceId ? { [FILTER_FIELDS.PROVINCE]: lockedProvinceId } : undefined}
                shouldDisableSite={!filters[FILTER_FIELDS.PROVINCE] || filters[FILTER_FIELDS.PROVINCE] === FILTER_ALL.ALL_PROVINCES}
                shouldDisableType={!filters[FILTER_FIELDS.PILLAR] || filters[FILTER_FIELDS.PILLAR] === FILTER_ALL.ALL_PILLARS}
              />
              <Text {...styles.sessionsFoundText}>
                {total} {t('lc.sessionsSupport.sessionsFound')}
              </Text>

              {activeTab === SUPPORT_OFFERING_TABS.SESSIONS && (
                <TrainingCard
                  items={items}
                  isShowLoadMore={isShowLoadMore}
                  onLoadMoreItems={onLoadMoreItems}
                  isLoadingMore={_loading && page > 1}
                  _card={{
                    footer: (item: any) => (
                      <RequestFooter item={item} onAssignSession={handleAssignSessionClick} provinces={provincesList} />
                    ),
                    provinces: provincesList,
                    sites: allSiteOptions
                  }}
                />
              )}

              {activeTab === SUPPORT_OFFERING_TABS.ADDITIONAL_SERVICES && (
                <AdditionalServiceCard
                  items={items}
                  isShowLoadMore={isShowLoadMore}
                  onLoadMoreItems={onLoadMoreItems}
                  isLoadingMore={_loading && page > 1}
                  provinces={provincesList}
                  sites={allSiteOptions}
                />
              )}

              {activeTab === SUPPORT_OFFERING_TABS.ASSETS && (
                <AssetsCard
                  items={items}
                  isShowLoadMore={isShowLoadMore}
                  onLoadMoreItems={onLoadMoreItems}
                  isLoadingMore={_loading && page > 1}
                  onRequestAsset={handleRequestAssetClick}
                />
              )}
            </>
          ) : activeSubTab === SUPPORT_OFFERING_SUB_TABS.MY_SESSIONS ? (
            mySessions.length > 0 ? (
              <VStack {...styles.mySessionsListVStack}>
                {mySessions.map((session, idx) => (
                  <LcMySessionTab
                    key={session.id || session._id || idx}
                    item={session}
                    isFirst={idx === 0}
                    onAssignParticipants={handleAssignSessionClick}
                    onEditSession={(sessionId) => {
                      (navigation as any).navigate(ROUTES.SESSIONS_SUPPORT_CREATE_SESSION, {
                        type: FORM_MODE.EDIT,
                        id: sessionId,
                      });
                    }}
                    isShowLoadMore={idx === mySessions.length - 1 && isShowLoadMore}
                    onLoadMoreItems={onLoadMoreItems}
                    isLoadingMore={_loading && page > 1}
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
                        {t('lc.sessionsSupport.emptyState.title', 'No Session Found')}
                      </Text>
                      {/* <Text {...styles.emptyStateDescription}>
                        {t('lc.sessionsSupport.emptyState.description', 'No Session Found')}
                      </Text> */}
                    </VStack>
                  </Box>
                )
          ) : activeSubTab === SUPPORT_OFFERING_SUB_TABS.HISTORY && activeTab === SUPPORT_OFFERING_TABS.ADDITIONAL_SERVICES ? (
            // Same card as My Requests (provider, requested date, notes, View Details -> request details page)
            <MyRequests
              items={items}
              _loading={_loading}
              isShowLoadMore={false}
              onLoadMoreItems={onLoadMoreItems}
            />
          ) : activeSubTab === SUPPORT_OFFERING_SUB_TABS.HISTORY ? (
            mySessions.length > 0 ? (
              <VStack {...styles.mySessionsListVStack}>
                {/* Read-only: no assign/edit actions on completed sessions */}
                {mySessions.map((session, idx) => (
                  <LcMySessionTab
                    key={session.id || session._id || idx}
                    item={session}
                    isFirst={idx === 0}
                    hideSchedule={activeTab === SUPPORT_OFFERING_TABS.ASSETS}
                    isShowLoadMore={idx === mySessions.length - 1 && isShowLoadMore}
                    onLoadMoreItems={onLoadMoreItems}
                    isLoadingMore={_loading && page > 1}
                  />
                ))}
              </VStack>
            ) : !_loading ? (
              <Box alignItems="center" py="$10" width="100%">
                <Text color="$textMuted">
                  {t('lc.sessionsSupport.history.empty', 'No completed sessions yet.')}
                </Text>
              </Box>
            ) : null
          ) : activeSubTab === SUPPORT_OFFERING_SUB_TABS.MY_REQUESTS ? (
            <MyRequests
              items={items}
              _loading={_loading}
              isShowLoadMore={isShowLoadMore}
              onLoadMoreItems={onLoadMoreItems}
              isLoadingMore={_loading && page > 1}
            />
          ) : null}
        </VStack>
      </Container>

      <AssignParticipantsModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        session={selectedSession}
        onConfirm={handleConfirmAssignment}
        maxSelectable={selectedSession?.seats_remaining}
      />

      <AssignParticipantsModal
        isOpen={isRequestAssetModalOpen}
        onClose={() => setIsRequestAssetModalOpen(false)}
        session={selectedAsset}
        onConfirm={handleConfirmAssetRequest}
        skipEnrolledCheck
        title={t('lc.sessionsSupport.requestAssetModal.title', 'Request Asset for Participants')}
        description={t(
          'lc.sessionsSupport.requestAssetModal.description',
          { defaultValue: 'Select participants from your caseload to request "{{title}}" for.', title: selectedAsset?.title || '' }
        )}
        submitActionVerb={t('lc.sessionsSupport.requestAssetModal.submitActionVerb', 'Request')}
        confirmTitle={t('lc.sessionsSupport.requestAssetModal.confirmTitle', 'Confirm Asset Request')}
        confirmSubtitle={t('lc.sessionsSupport.requestAssetModal.confirmSubtitle', 'You are about to request this asset for the following participants:')}
        confirmButtonLabel={t('lc.sessionsSupport.requestAssetModal.confirmButtonText', 'Confirm Request')}
      />
    </VStack>
  );
};

export default SessionsSupportScreen;
