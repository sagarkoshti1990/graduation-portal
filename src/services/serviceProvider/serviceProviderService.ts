import moment from 'moment';
import api from '../api';
import { API_ENDPOINTS } from '../apiEndpoints';
import { getProvincesList, getAllSites } from '../usersService';
import {
  SUPPORT_REQUEST_TABS,
  SUPPORT_OFFERING_TYPE_VALUES,
  REQUEST_STATUS,
  OFFERING_FILTER_ALL_OPTIONS as FILTER_ALL,
} from '@constants/SUPPORT_PROVIDER_CARDS';

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
  support_offering_type?: 'training' | 'additional_service' | 'asset';
  province?: string;
  sites?: string[];
  category?: string;
  title?: string;
  description?: string;
  targetAudience?: string;
  recommended_for?: string[];
  date: string;
  time: string;
  duration: string;
  delivery_mode?: string;
  capacity?: string;
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

/**
 * Maps a raw record from GET /mentoring/v1/requestSessions/list into the
 * SupportRequestItem shape consumed by the Support Requests cards.
 * Field names are defensive/fallback-based since the QA dataset currently
 * has no populated records to confirm the exact response schema against.
 */
const mapRequestSessionItem = (
  item: any,
  tab: 'sessions' | 'additional_services' | 'assets' | 'declined',
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

  const provinceId = meta.provinces?.[0];
  const siteIds: string[] = Array.isArray(meta.sites) ? meta.sites : [];
  const provinceName = provinceMap[provinceId];
  const siteNames = siteIds.map((id) => siteMap[id] || id).join(', ');

  const participantsCount = item.participants_count ?? session.seats_remaining ?? (Array.isArray(item.requestees) ? item.requestees.length : undefined) ?? 1;

  const title = item.title;

  return {
    id: item.id ?? item._id ?? item.request_id,
    type: tab,
    category: title,
    title,
    coach: item.user_details?.name || item.user?.name || item.requester_name || item.mentee_name || session.mentor_name || '-',
    hub: provinceName,
    location: siteNames || '-',
    province: provinceName || provinceId,
    site: siteNames || undefined,
    participants: participantsCount,
    preferredDate: startMoment ? startMoment.format('DD MMM YYYY') : '-',
    preferredTime: startMoment ? startMoment.format('hh:mm A') : '-',
    status: tab === SUPPORT_REQUEST_TABS.DECLINED ? REQUEST_STATUS.DECLINED : REQUEST_STATUS.PENDING,
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

  if (province && province !== FILTER_ALL.ALL_PROVINCES) {
    const targetProv = province.toLowerCase().replace(/[\s-_]/g, '');
    filtered = filtered.filter((item) => {
      const itemProv = (item.province || '').toLowerCase().replace(/[\s-_]/g, '');
      return itemProv === targetProv || itemProv.includes(targetProv) || targetProv.includes(itemProv);
    });
  }

  if (site && site !== FILTER_ALL.ALL_SITES) {
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
        (item.title || '').toLowerCase().includes(q) ||
        (item.coach || '').toLowerCase().includes(q) ||
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
  const { tab = SUPPORT_REQUEST_TABS.SESSIONS, provinces: province, sites: site, search } = params || {};

  const { provinceMap, siteMap } = await getProvinceAndSiteMaps();

  let sessionsData: SupportRequestItem[] | null = null;
  let additionalServicesData: SupportRequestItem[] | null = null;
  let assetsData: SupportRequestItem[] | null = null;
  let declinedData: SupportRequestItem[] | null = null;
  let sessionsCount = 0;
  let additionalServicesCount = 0;
  let assetsCount = 0;
  let declinedCount = 0;
  let sessionsOverdueCount = 0;

  // support_offering_type value the requestSessions API expects for each tab (declined isn't
  // type-scoped - it spans every offering type, so it's handled separately below).
  const SUPPORT_OFFERING_TYPE: Record<'sessions' | 'additional_services' | 'assets', string> = {
    sessions: SUPPORT_OFFERING_TYPE_VALUES.TRAINING_SESSION,
    additional_services: SUPPORT_OFFERING_TYPE_VALUES.ADDITIONAL_SERVICE,
    assets: SUPPORT_OFFERING_TYPE_VALUES.ASSET,
  };

  const buildParams = (isDeclined: boolean, offeringTab?: 'sessions' | 'additional_services' | 'assets') => {
    const apiParams: any = { status: isDeclined ? REQUEST_STATUS.REJECTED : REQUEST_STATUS.REQUESTED };
    if (!isDeclined && offeringTab) {
      apiParams.support_offering_type = SUPPORT_OFFERING_TYPE[offeringTab];
    }
    if (search && search.trim() !== '') apiParams.search = search.trim();
    if (province && province !== FILTER_ALL.ALL_PROVINCES) apiParams.provinces = province;
    if (site && site !== FILTER_ALL.ALL_SITES) apiParams.sites = site;
    return apiParams;
  };

  try {
    const isDeclinedTab = tab === SUPPORT_REQUEST_TABS.DECLINED;
    const response = await api.get(API_ENDPOINTS.REQUEST_SESSIONS_LIST, {
      params: buildParams(isDeclinedTab, isDeclinedTab ? undefined : (tab as 'sessions' | 'additional_services' | 'assets')),
    });

    const extractResult = (
      res: any,
      mapTab: 'sessions' | 'additional_services' | 'assets' | 'declined'
    ) => {
      if (res?.data?.responseCode !== 'OK') return null;
      const resObj = res.data.result;
      const rawList = Array.isArray(resObj) ? resObj : (resObj?.data || []);
      const mapped: SupportRequestItem[] = rawList.map((item: any) =>
        mapRequestSessionItem(item, mapTab, provinceMap, siteMap));
      const count = resObj?.count ?? (Array.isArray(resObj) ? resObj.length : mapped.length);
      return { mapped, count };
    };

    const result = extractResult(response, tab);
    if (result) {
      switch (tab) {
        case SUPPORT_REQUEST_TABS.SESSIONS:
          sessionsData = result.mapped;
          sessionsCount = result.count;
          sessionsOverdueCount = result.mapped.filter(i => (i.overdueDays || 0) > 0).length;
          break;
        case SUPPORT_REQUEST_TABS.ADDITIONAL_SERVICES:
          additionalServicesData = result.mapped;
          additionalServicesCount = result.count;
          break;
        case SUPPORT_REQUEST_TABS.ASSETS:
          assetsData = result.mapped;
          assetsCount = result.count;
          break;
        case SUPPORT_REQUEST_TABS.DECLINED:
          declinedData = result.mapped;
          declinedCount = result.count;
          break;
      }
    }
  } catch (error) {
    console.warn('[SupportRequests] Failed to fetch session requests:', error);
  }

  const additionalServicesList = additionalServicesData ?? [];
  const assetsList = assetsData ?? [];

  let list: SupportRequestItem[];
  switch (tab) {
    case SUPPORT_REQUEST_TABS.SESSIONS:
      list = sessionsData ?? [];
      break;
    case SUPPORT_REQUEST_TABS.DECLINED:
      list = declinedData ?? [];
      break;
    case SUPPORT_REQUEST_TABS.ADDITIONAL_SERVICES:
      list = additionalServicesList;
      break;
    case SUPPORT_REQUEST_TABS.ASSETS:
      list = assetsList;
      break;
    default:
      list = [];
  }

  const provinceParam = (province && provinceMap[province]) ? provinceMap[province] : province;
  const siteParam = (site && siteMap[site]) ? siteMap[site] : site;

  list = applySupportRequestFilters(list, { province: provinceParam, site: siteParam, search });

  const overdueTotal =
    sessionsOverdueCount +
    additionalServicesList.filter(i => (i.overdueDays || 0) > 0).length +
    assetsList.filter(i => (i.overdueDays || 0) > 0).length;

  const counts = {
    sessions: sessionsCount,
    additional_services: additionalServicesCount,
    assets: assetsCount,
    declined: declinedCount,
    pendingTotal: sessionsCount + additionalServicesCount + assetsCount,
    overdueTotal,
  };

  return {
    success: true,
    data: list,
    counts,
  };
};

/**
 * Accept and schedule a support request.
 * Maps the AcceptAndSchedulePayload (form values) to the API contract for
 * POST /mentoring/v1/requestSessions/accept?SkipValidation=true
 */
export const acceptAndScheduleSupportRequest = async (
  payload: AcceptAndSchedulePayload
): Promise<{ success: boolean; message: string; result?: string }> => {
  // Build start_date unix timestamp from date + time strings
  const startMoment = moment(
    `${payload.date} ${payload.time}`,
    'YYYY-MM-DD HH:mm'
  );
  const startDate = startMoment.isValid() ? Math.floor(startMoment.valueOf() / 1000) : 0;

  // Build end_date by adding the duration in hours
  const durationHours = DURATION_HOURS[payload.duration] ?? 2;
  const endDate = startDate + Math.round(durationHours * 3600);

  const isAsset = payload.support_offering_type === 'asset';

  const body: Record<string, any> = {
    request_session_id: String(payload.requestId),
    type: 'public',
    support_offering_type: isAsset
      ? SUPPORT_OFFERING_TYPE_VALUES.ASSET
      : (payload.support_offering_type || SUPPORT_OFFERING_TYPE_VALUES.TRAINING_SESSION),
    title: payload.title || '',
    start_date: startDate,
    end_date: endDate,
    delivery_mode: payload.delivery_mode || (isAsset ? 'offline' : 'online'),
    can_be_copied: false,
    certificate_provided: false,
    recommended_for: payload.recommended_for?.length ? payload.recommended_for : ['user'],
    ...(isAsset
      ? {
          agenda: payload.description || payload.title || '',
          description: payload.description || payload.title || '',
          meeting_info: { link: '', location: payload.location || '' },
        }
      : { description: payload.description || '', meeting_info: { link: payload.meetingLink || '' } }),
  };

  if (payload.province) {
    body.provinces = [payload.province];
  }

  if (payload.sites?.length) {
    body.sites = payload.sites;
  }

  if (payload.category) {
    body.categories = [payload.category];
  }

  if (isAsset) {
    if (payload.capacity) {
      body.meta = { quantity: Number(payload.capacity) };
    }
  } else {
    if (payload.targetAudience) {
      body.learning_objectives = payload.targetAudience;
    }

    if (payload.capacity) {
      body.seats_limit = Number(payload.capacity);
    }
  }

  const response = await api.post(API_ENDPOINTS.REQUEST_SESSIONS_ACCEPT, body);
  const data = response.data;

  return {
    success: data?.responseCode === 'OK',
    message: data?.message || 'Request accepted.',
    result: data?.result,
  };
};

/**
 * Request additional information from coach for a support request
 */
export const requestMoreInfoForSupportRequest = async (
  payload: RequestInfoPayload
): Promise<{ success: boolean; message: string; result?: any }> => {
  const response = await api.post(API_ENDPOINTS.REQUEST_SESSIONS_UPDATE, {
    request_session_id: String(payload.requestId),
    extra_information: payload.message || '',
  });

  const data = response.data;
  return {
    success: data?.responseCode === 'OK' || data?.success === true,
    message: data?.message || 'Request for additional information sent to Coach successfully.',
    result: data?.result,
  };
};

/**
 * Fetch the raw detail record for a single request-session (best-effort - the exact response
 * shape, and whether it embeds per-requestee names, is unconfirmed against a real backend
 * response; callers should parse defensively and fall back gracefully).
 */
export const getRequestSessionDetails = async (requestId: string | number): Promise<any> => {
  try {
    const response = await api.get(API_ENDPOINTS.REQUEST_SESSIONS_GET_DETAILS, {
      params: { request_session_id: String(requestId) },
    });
    return response.data?.result ?? null;
  } catch (error) {
    console.warn('[getRequestSessionDetails] Failed to fetch request details:', error);
    return null;
  }
};

/**
 * Decline a support request with reason and details
 */
export const declineSupportRequest = async (
  payload: DeclinePayload
): Promise<{ success: boolean; message: string }> => {
  const response = await api.post(API_ENDPOINTS.SP_REQUEST_SESSIONS_REJECT, {
    request_session_id: payload.requestId,
    reason: payload.reason,
    details: payload.details,
  });
  const data = response.data;
  return {
    success: data?.responseCode === 'OK' || data?.success === true,
    message: data?.message || 'Support request declined successfully.',
  };
};
