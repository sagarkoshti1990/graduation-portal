import moment from 'moment';
import api from '../api';
import { API_ENDPOINTS } from '../apiEndpoints';
import supportRequestsMock from './mockData/supportRequests.json';
import { getProvincesList, getAllSites } from '../usersService';

export interface SupportRequestItem {
  id: string | number;
  type: 'sessions' | 'additional_services' | 'assets' | 'declined';
  category: string;
  badge?: string;
  badgeColor?: string;
  title: string;
  coach: string;
  time?: string;
  location: string;
  site?: string;
  province?: string;
  participantsCount?: number;
  participants?: number;
  preferredDate?: string;
  preferredTime?: string;
  preferredLocation?: string;
  description?: string;
  specialRequirements?: string;
  status: 'pending' | 'accepted' | 'declined' | 'info_requested' | 'Pending' | 'Declined';
  requestedDate?: string;
  overdueDays?: number;
  declineReason?: string;
  declineDetails?: string;
  hub?: string;
  email?: string;
  phone?: string;
  justification?: string;
  participantDetails?: string;
  raw?: any;
}

export interface SupportRequestsFilterParams {
  tab?: 'sessions' | 'additional_services' | 'assets' | 'declined';
  provinces?: string;
  sites?: string;
  search?: string;
}

export interface AcceptAndSchedulePayload {
  requestId: string | number;
  date: string;
  time: string;
  duration: string;
  location: string;
  meetingLink?: string;
  notes?: string;
  raw?: any;
}

/** Duration option values (as used by ACCEPT_AND_SCHEDULE_FORM_SCHEMA) -> hours to add to start_date. */
const DURATION_HOURS: Record<string, number> = {
  '1_hour': 1,
  '1.5_hours': 1.5,
  '2_hours': 2,
  '3_hours': 3,
  full_day: 8,
};

export interface RequestInfoPayload {
  requestId: string | number;
  message: string;
}

export interface DeclinePayload {
  requestId: string | number;
  reason: string;
  details?: string;
}

const LOCAL_STORAGE_KEY = 'sp_support_requests_store';

const loadMockStore = (): Record<string, SupportRequestItem[]> => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    }
  } catch (err) {
    console.error('Error loading support requests mockStore from localStorage:', err);
  }
  return {
    sessions: [...((supportRequestsMock as any).sessions || [])],
    additional_services: [...((supportRequestsMock as any).additional_services || [])],
    assets: [...((supportRequestsMock as any).assets || [])],
    declined: [],
  };
};

const saveMockStore = (store: Record<string, SupportRequestItem[]>) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(store));
    }
  } catch (err) {
    console.error('Error saving support requests mockStore to localStorage:', err);
  }
};

// In-memory & localStorage data store for fallback mock data
const mockStore: Record<string, SupportRequestItem[]> = loadMockStore();

/**
 * Maps a raw record from GET /mentoring/v1/requestSessions/list into the
 * SupportRequestItem shape consumed by the Support Requests cards.
 * Field names are defensive/fallback-based since the QA dataset currently
 * has no populated records to confirm the exact response schema against.
 */
const mapRequestSessionItem = (
  item: any,
  tab: 'sessions' | 'declined',
  provinceMap: Record<string, string> = {},
  siteMap: Record<string, string> = {}
): SupportRequestItem => {
  const session = item.session || item.session_details || {};
  const meta = item.meta || {};
  const rawRequestedAt = item.created_at ?? item.requested_at ?? item.createdAt;
  const rawStartDate = session.start_date ?? item.start_date;

  const toMoment = (value: any) => {
    if (!value) return null;
    const num = Number(value);
    const isEpochSeconds = !Number.isNaN(num) && String(value).length <= 10;
    return moment(isEpochSeconds ? num * 1000 : value);
  };

  const requestedMoment = toMoment(rawRequestedAt);
  const startMoment = toMoment(rawStartDate);
  const overdueDays = item.overdue_days ?? (requestedMoment
    ? Math.max(0, moment().diff(requestedMoment, 'days'))
    : 0);

  const provinceId = Array.isArray(meta.provinces) ? meta.provinces[0] : undefined;
  const siteId = Array.isArray(meta.sites) ? meta.sites[0] : undefined;
  const provinceName = provinceMap[provinceId] || item.province?.name || (typeof item.province === 'string' ? item.province : undefined);

  const participantsCount = item.participants_count ?? session.seats_remaining ?? (Array.isArray(item.requestees) ? item.requestees.length : undefined) ?? 1;

  const title = item.title || session.title || item.taskDetails?.title || item.name || 'Untitled Session';

  return {
    id: item.id ?? item._id ?? item.request_id,
    type: tab,
    category: session.category || item.category || title,
    title,
    coach: item.user_details?.name || item.user?.name || item.requester_name || item.mentee_name || session.mentor_name || '-',
    hub: item.hub || (provinceName ? `BRAC ${provinceName} Hub` : (siteMap[siteId] || item.site?.name || '-')),
    location: meta.meeting_info?.location || session.meeting_info?.location || session.location || item.location || '-',
    site: siteMap[siteId] || item.site?.name || item.site || siteId,
    province: provinceName || provinceId,
    // participants: participantsCount,
    participantsCount,
    preferredDate: startMoment ? startMoment.format('DD MMM YYYY') : '-',
    preferredTime: startMoment ? startMoment.format('hh:mm A') : '-',
    status: tab === 'declined' ? 'Declined' : 'pending',
    requestedDate: requestedMoment ? requestedMoment.format('DD MMM YYYY') : '-',
    overdueDays,
    declineReason: item.reason || item.decline_reason,
    declineDetails: item.details || item.decline_details,
    justification: meta.learning_objectives || item.agenda || undefined,
    email: item.user_details?.email || item.user?.email || undefined,
    phone: item.user_details?.phone || item.user?.phone || undefined,
    raw: item,
  } as SupportRequestItem;
};

/**
 * Applies province/site/search filters to a support requests list on the client,
 * since /requestSessions/list does not currently accept those as query params.
 */
const applySupportRequestFilters = (
  list: SupportRequestItem[],
  { province, site, search }: { province?: string; site?: string; search?: string }
): SupportRequestItem[] => {
  let filtered = list;

  if (province && province !== 'all-provinces') {
    const targetProv = province.toLowerCase().replace(/[\s-_]/g, '');
    filtered = filtered.filter((item) => {
      const itemProv = (item.province || '').toLowerCase().replace(/[\s-_]/g, '');
      return itemProv === targetProv || itemProv.includes(targetProv) || targetProv.includes(itemProv);
    });
  }

  if (site && site !== 'all-sites') {
    const targetSite = site.toLowerCase().replace(/[\s-_]/g, '');
    filtered = filtered.filter((item) => {
      const itemSite = (item.site || '').toLowerCase().replace(/[\s-_]/g, '');
      return itemSite === targetSite || itemSite.includes(targetSite) || targetSite.includes(itemSite);
    });
  }

  if (search && search.trim() !== '') {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.coach.toLowerCase().includes(q) ||
        (item.category && item.category.toLowerCase().includes(q))
    );
  }

  return filtered;
};

let provinceMapCache: Record<string, string> | null = null;
let siteMapCache: Record<string, string> | null = null;

const getProvinceAndSiteMaps = async (): Promise<{
  provinceMap: Record<string, string>;
  siteMap: Record<string, string>;
}> => {
  if (provinceMapCache && siteMapCache) {
    return { provinceMap: provinceMapCache, siteMap: siteMapCache };
  }
  try {
    const [provinces, sites] = await Promise.all([getProvincesList(), getAllSites()]);
    provinceMapCache = Object.fromEntries((provinces || []).map((p: any) => [p._id, p.name]));
    siteMapCache = Object.fromEntries((sites || []).map((s: any) => [s._id, s.name]));
  } catch (error) {
    console.warn('[SupportRequests] Failed to fetch province/site names:', error);
    provinceMapCache = provinceMapCache || {};
    siteMapCache = siteMapCache || {};
  }
  return { provinceMap: provinceMapCache || {}, siteMap: siteMapCache || {} };
};

/**
 * Fetch support requests list filtered by tab, province, site, and search term.
 *
 * `sessions` and `declined` tabs are backed by the real
 * GET /mentoring/v1/requestSessions/list API (status=REQUESTED / REJECTED
 * respectively). `additional_services` and `assets` tabs still use the local
 * mock dataset until an equivalent API is available for them.
 */
export const getSupportRequests = async (
  params?: SupportRequestsFilterParams
): Promise<{
  success: boolean;
  data: SupportRequestItem[];
  counts: {
    sessions: number;
    additional_services: number;
    assets: number;
    declined: number;
    pendingTotal: number;
    overdueTotal: number;
  };
}> => {
  const { tab = 'sessions', provinces: province, sites: site, search } = params || {};

  let sessionsData: SupportRequestItem[] | null = null;
  let declinedData: SupportRequestItem[] | null = null;
  let sessionsCount = mockStore.sessions.length;
  let declinedCount = mockStore.declined.length;
  let sessionsOverdueCount = mockStore.sessions.filter(i => (i.overdueDays || 0) > 0).length;

  try {
    if (tab === 'sessions' || tab === 'declined') {
      const { provinceMap, siteMap } = await getProvinceAndSiteMaps();

      if (tab === 'sessions') {
        const requestedRes = await api.get(API_ENDPOINTS.REQUEST_SESSIONS_LIST, {
          params: { status: 'REQUESTED' },
        });
        if (requestedRes?.data?.responseCode === 'OK') {
          const resObj = requestedRes.data.result;
          const rawList = Array.isArray(resObj) ? resObj : (resObj?.data || []);
          const mapped: SupportRequestItem[] = rawList.map((item: any) =>
            mapRequestSessionItem(item, 'sessions', provinceMap, siteMap));
          sessionsData = mapped;
          sessionsCount = resObj?.count ?? (Array.isArray(resObj) ? resObj.length : mapped.length);
          sessionsOverdueCount = mapped.filter(i => (i.overdueDays || 0) > 0).length;
        }
      } else {
        const rejectedRes = await api.get(API_ENDPOINTS.REQUEST_SESSIONS_LIST, {
          params: { status: 'REJECTED' },
        });
        if (rejectedRes?.data?.responseCode === 'OK') {
          const resObj = rejectedRes.data.result;
          const rawList = Array.isArray(resObj) ? resObj : (resObj?.data || []);
          const mapped: SupportRequestItem[] = rawList.map((item: any) =>
            mapRequestSessionItem(item, 'declined', provinceMap, siteMap));
          declinedData = mapped;
          declinedCount = resObj?.count ?? (Array.isArray(resObj) ? resObj.length : mapped.length);
        }
      }
    }
  } catch (error) {
    console.warn('[SupportRequests] Failed to fetch session requests:', error);
  }

  const additionalServicesList = [...mockStore.additional_services];
  const assetsList = [...mockStore.assets];

  let list: SupportRequestItem[];
  switch (tab) {
    case 'sessions':
      list = sessionsData ?? [...mockStore.sessions];
      break;
    case 'declined':
      list = declinedData ?? [...mockStore.declined];
      break;
    case 'additional_services':
      list = additionalServicesList;
      break;
    case 'assets':
      list = assetsList;
      break;
    default:
      list = [];
  }

  list = applySupportRequestFilters(list, { province, site, search });

  const overdueTotal =
    sessionsOverdueCount +
    additionalServicesList.filter(i => (i.overdueDays || 0) > 0).length +
    assetsList.filter(i => (i.overdueDays || 0) > 0).length;

  const counts = {
    sessions: sessionsCount,
    additional_services: additionalServicesList.length,
    assets: assetsList.length,
    declined: declinedCount,
    pendingTotal: sessionsCount + additionalServicesList.length + assetsList.length,
    overdueTotal,
  };

  return {
    success: true,
    data: list,
    counts,
  };
};

/**
 * Accept and schedule a support request
 */
export const acceptAndScheduleSupportRequest = async (
  payload: AcceptAndSchedulePayload
): Promise<{ success: boolean; message: string }> => {
  try {
    if (API_ENDPOINTS && (API_ENDPOINTS as any).SERVICE_PROVIDER_ACCEPT_REQUEST) {
      const response = await api.post((API_ENDPOINTS as any).SERVICE_PROVIDER_ACCEPT_REQUEST, payload);
      return response.data;
    }
  } catch (error) {
    console.warn('Backend API unavailable, using simulated success for Accept & Schedule:', error);
  }

  return {
    success: true,
    message: 'Support request accepted and scheduled successfully.',
  };
};

/**
 * Request additional information from coach for a support request
 */
export const requestMoreInfoForSupportRequest = async (
  payload: RequestInfoPayload
): Promise<{ success: boolean; message: string }> => {
  try {
    if (API_ENDPOINTS && (API_ENDPOINTS as any).SERVICE_PROVIDER_REQUEST_INFO) {
      const response = await api.post((API_ENDPOINTS as any).SERVICE_PROVIDER_REQUEST_INFO, payload);
      return response.data;
    }
  } catch (error) {
    console.warn('Backend API unavailable, using simulated success for Request Info:', error);
  }

  return {
    success: true,
    message: 'Request for additional information sent to Coach successfully.',
  };
};

/**
 * Decline a support request with reason and details
 */
export const declineSupportRequest = async (
  payload: DeclinePayload
): Promise<{ success: boolean; message: string }> => {
  try {
    if (API_ENDPOINTS && (API_ENDPOINTS as any).SERVICE_PROVIDER_DECLINE_REQUEST) {
      const response = await api.post((API_ENDPOINTS as any).SERVICE_PROVIDER_DECLINE_REQUEST, payload);
      return response.data;
    }
  } catch (error) {
    console.warn('Backend API unavailable, using simulated success for Decline Request:', error);
  }

  // Update in-memory mock store & persist to localStorage
  const { requestId, reason, details } = payload;
  const categories = ['sessions', 'additional_services', 'assets'];
  for (const cat of categories) {
    const idx = mockStore[cat].findIndex(item => String(item.id) === String(requestId));
    if (idx !== -1) {
      const [declinedItem] = mockStore[cat].splice(idx, 1);
      declinedItem.status = 'Declined';
      declinedItem.declineReason = reason;
      declinedItem.declineDetails = details;
      mockStore.declined.unshift(declinedItem);
      saveMockStore(mockStore);
      break;
    }
  }

  return {
    success: true,
    message: 'Support request declined successfully.',
  };
};
