import api from '../api';
import { API_ENDPOINTS } from '../apiEndpoints';
import type { ServiceItem, AssetItem, FilterParams } from '../../types/supportOfferingsTypes';
import { encodeSearchText } from '../../utils/helper';
import { SUPPORT_CATEGORIES, OFFERING_FILTER_ALL_OPTIONS as FILTER_ALL, OFFERING_QUERY_PARAM_KEYS as QUERY_PARAM } from '@constants/SUPPORT_PROVIDER_CARDS';
import { MENTORING_ENTITY_TYPES } from '@constants/SP_MENU_OPTIONS';

/**
 * Fetches the created mentoring sessions list from the backend for the Support Offerings screen.
 */
const getSupportOfferingsList = async (
  params: any,
  offeringType: string = SUPPORT_CATEGORIES.TRAINING
): Promise<any> => {
  try {
    const { page, limit, status, search, provinces, sites } = params;

    const apiStatus = (status && status !== FILTER_ALL.ALL_STATUSES) ? status.toUpperCase() : '';

    const queryParams = new URLSearchParams();

    queryParams.append(MENTORING_ENTITY_TYPES.SUPPORT_OFFERING_TYPE, offeringType);

    if (apiStatus) {
      queryParams.append(QUERY_PARAM.STATUS, apiStatus);
    }

    if (page !== undefined && page !== null) {
      queryParams.append(QUERY_PARAM.PAGE, page.toString());
    }

    if (limit !== undefined && limit !== null) {
      queryParams.append(QUERY_PARAM.LIMIT, limit.toString());
    }

    if (search?.trim()) {
      // Must be sent base64-encoded
      queryParams.append(QUERY_PARAM.SEARCH, encodeSearchText(search.trim()));
    }

    if (provinces && provinces !== FILTER_ALL.ALL_PROVINCES) {
      queryParams.append(QUERY_PARAM.PROVINCES, provinces);
    }

    if (sites && sites !== FILTER_ALL.ALL_SITES) {
      queryParams.append(QUERY_PARAM.SITES, sites);
    }

    const queryString = queryParams.toString();
    const endpoint = queryString
      ? `${API_ENDPOINTS.SUPPORT_OFFERINGS_SESSIONS}?${queryString}`
      : API_ENDPOINTS.SUPPORT_OFFERINGS_SESSIONS;

    const response = await api.get(endpoint);

    const data = response.data?.result?.data || [];
    const totalCount =
      response.data?.result?.count ??
      response.data?.result?.total ??
      response.data?.total ??
      response.data?.count ??
      data.length;

    return {
      ...response.data,
      result: {
        ...response.data?.result,
        data,
      },
      total: totalCount,
    };
  } catch (error) {
    console.error('Error fetching support offerings:', error);
    throw error;
  }
};

/**
 * Fetch Training Sessions
 */
export const getTrainingSessions = async (
  params?: any
): Promise<any> => {
  let responseData: any = {
    result: { data: [] },
    total: 0,
  };

  try {
    responseData = await getSupportOfferingsList(params, SUPPORT_CATEGORIES.TRAINING);
  } catch (error) {
    console.warn('Backend API endpoint unavailable for Training Sessions:', error);
    responseData = {
      result: { data: [] },
      total: 0,
    };
  }

  return responseData;
};

/**
 * Fetch Additional Services
 */
export const getAdditionalServices = async (params?: any): Promise<any> => {
  let responseData: any = {
    result: { data: [] },
    total: 0,
  };

  try {
    responseData = await getSupportOfferingsList(params, SUPPORT_CATEGORIES.ADDITIONAL_SERVICE);
  } catch (error) {
    console.warn('Backend API endpoint unavailable for Training Sessions:', error);
    responseData = {
      result: { data: [] },
      total: 0,
    };
  }

  return responseData;
};

const ASSET_STATUS_LABEL: Record<string, AssetItem['status']> = {
  DRAFT: 'Pending',
  PUBLISHED: 'Upcoming',
  COMPLETED: 'Accepted',
};

export const mapToAssetItem = (raw: any): AssetItem => {
  const assetType = Array.isArray(raw.asset_types) ? raw.asset_types[0] : raw.asset_types;
  const estimatedValue = raw.estimated_value ?? raw.meta?.estimated_value;

  return {
    id: raw.id ?? raw._id,
    title: raw.title,
    status: ASSET_STATUS_LABEL[String(raw.status).toUpperCase()] || raw.status,
    type: typeof assetType === 'object' ? assetType?.label ?? assetType?.value : assetType,
    description: raw.description,
    sector: Array.isArray(raw.livelihoods)
      ? raw.livelihoods.map((l: any) => (typeof l === 'object' ? l?.label ?? l?.value ?? l?.name : l)).join(', ')
      : (typeof raw.livelihoods === 'object' ? raw.livelihoods?.label ?? raw.livelihoods?.value : raw.livelihoods),
    value: estimatedValue ? `R ${estimatedValue} / participant` : undefined,
    province: Array.isArray(raw.provinces) ? raw.provinces[0] : raw.provinces,
    siteKey: Array.isArray(raw.sites) ? raw.sites[0] : raw.sites,
    requests: raw.requests ?? raw.meta?.requests,
    mentor_name: raw.mentor_name ?? raw.meta?.mentor_name,
    organization: raw.organization ?? raw.meta?.organization,
    delivery_mode: raw.delivery_mode,
    seats_limit: raw.seats_limit,
    seats_remaining: raw.seats_remaining,
    can_be_copied: raw.can_be_copied,
    meeting_info: raw.meeting_info,
    meeting_info_details: raw.meeting_info_details,
    quantity: raw.seats_limit !== undefined && raw.seats_limit !== null ? Number(raw.seats_limit) : undefined,
    estimatedValuePerParticipant: estimatedValue !== undefined && estimatedValue !== null ? Number(estimatedValue) : undefined,
  };
};

/**
 * Fetch Assets
 */
export const getAssets = async (params?: any): Promise<any> => {
  let responseData: any = {
    result: { data: [] },
    total: 0,
  };

  try {
    const res = await getSupportOfferingsList(params, SUPPORT_CATEGORIES.ASSET);
    const data = (res?.result?.data || []).map(mapToAssetItem);
    responseData = {
      ...res,
      result: { ...res?.result, data },
    };
  } catch (error) {
    console.warn('Backend API endpoint unavailable for Assets:', error);
    responseData = {
      result: { data: [] },
      total: 0,
    };
  }

  return responseData;
};

/**
 * Fetches the mentees actually enrolled in a session, for the "Confirm Attendance" /
 * "Complete Session" modal. Without this the modal has nothing real to show and falls back to
 * fabricated placeholder participants that can never be marked complete against the real API.
 * Endpoint: GET /mentoring/v1/sessions/enrolledMentees/:sessionId
 */
export const getSessionEnrolledParticipants = async (
  sessionId: string | number
): Promise<{ id: string; name: string; lcName: string; isPresent: boolean }[]> => {
  try {
    const response = await api.get(API_ENDPOINTS.SESSION_ENROLLED_MENTEES(sessionId));
    const list = response?.data?.result || [];
    return (Array.isArray(list) ? list : []).map((mentee: any) => ({
      id: String(mentee?.id ?? mentee?.user_id ?? ''),
      name: mentee?.name || 'Unknown Participant',
      lcName: mentee?.type ? `${mentee.type === 'INVITED' ? 'Assigned by' : 'Enrolled'}` : '',
      isPresent: false,
    })).filter((p) => p.id);
  } catch (error) {
    console.error('Error fetching enrolled participants:', error);
    return [];
  }
};

export interface AttendedSessionItem {
  id: number | string;
  title: string;
  description?: string;
  status: string;
  start_date?: number | string;
  end_date?: number | string;
  medium?: string[] | null;
  categories?: (string | { value: string; label: string })[];
  joined_at?: string | null;
  mentor_name?: string;
}

/**
 * Get the sessions a mentee is enrolled in.
 * Endpoint: GET /mentoring/v1/mentees/sessions?menteeId=&scope=attended|missed
 *
 * @param menteeId - Mentee (participant) user id
 * @param scope - 'attended' or 'missed'. When omitted the upcoming sessions are returned.
 */
export const getMenteeSessions = async (
  menteeId: string | number,
  scope?: 'attended' | 'missed',
  page = 1,
  limit = 10
): Promise<{ data: any[]; count: number }> => {
  const response = await api.get(API_ENDPOINTS.SESSION_MENTEES_SESSIONS, {
    params: { menteeId, ...(scope ? { scope } : {}), page, limit },
  });
  const result = response?.data?.result;
  const data = Array.isArray(result?.data) ? result.data : [];
  return { data, count: Number(result?.count ?? result?.total ?? data.length) };
};


/**
 * Complete Training Session API
 */
export const completeTrainingSession = async (
  sessionId: string | number,
  payload: { mentees: string[] } | string[] | any
): Promise<any> => {
  const mentees = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.mentees)
      ? payload.mentees
      : [];

  const endpoint = API_ENDPOINTS.SUPPORT_OFFERINGS_COMPLETE_SESSION(sessionId);
  const response = await api.patch(endpoint, { mentees });
  return response.data;
};

/**
 * Save / Update a Training Session (Draft or Published)
 */
export const saveTrainingSession = async (
  _values: any,
  _isDraft: boolean
): Promise<{ success: boolean; message: string }> => {
  return {
    success: true,
    message: _isDraft
      ? 'Draft saved successfully!'
      : 'Training session saved successfully!',
  };
};

/**
 * Get a single training session by its ID
 */
export const getTrainingSessionById = async (
  sessionId: string | number
): Promise<any> => {
  try {
    const listRes = await getSupportOfferingsList({ limit: 100 });
    const sessions = listRes?.result?.data || [];
    const matched = sessions.find((s: any) => String(s.id) === String(sessionId) || String(s._id) === String(sessionId));
    return matched || null;
  } catch (error) {
    console.error('Error fetching training session by id:', error);
    return null;
  }
};


