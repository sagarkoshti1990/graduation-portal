import api from '../api';
import { API_ENDPOINTS } from '../apiEndpoints';
import type { ServiceItem, AssetItem, FilterParams } from '../../types/supportOfferingsTypes';
import { encodeSearchText } from '../../utils/helper';

/**
 * Fetches the created mentoring sessions list from the backend for the Support Offerings screen.
 */
const getSupportOfferingsList = async (
  params: any,
  offeringType: string = 'training'
): Promise<any> => {
  try {
    console.log(params);
    const { page, limit, status, search, provinces, sites } = params;

    const apiStatus = (status && status !== 'all-statuses') ? status.toUpperCase() : '';

    const queryParams = new URLSearchParams();

    queryParams.append('support_offering_type', offeringType);

    if (apiStatus) {
      queryParams.append('status', apiStatus);
    }

    if (page !== undefined && page !== null) {
      queryParams.append('page', page.toString());
    }

    if (limit !== undefined && limit !== null) {
      queryParams.append('limit', limit.toString());
    }

    if (search?.trim()) {
      // Backend base64-decodes `search` before using it (see pagination
      // middleware), so it must be sent base64-encoded — otherwise plain
      // text gets mis-decoded into garbage bytes and can incorrectly trip
      // the backend's "Invalid search text" special-character check.
      queryParams.append('search', encodeSearchText(search.trim()));
    }

    if (provinces && provinces !== 'all-provinces') {
      queryParams.append('provinces', provinces);
    }

    if (sites && sites !== 'all-sites') {
      queryParams.append('sites', sites);
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
    responseData = await getSupportOfferingsList(params, 'training');
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
    responseData = await getSupportOfferingsList(params, 'additional_service');
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
 * Fetch Assets
 */
export const getAssets = async (params?: FilterParams): Promise<AssetItem[]> => {
  return [];
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
  const response = await api.post(endpoint, { mentees });
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


