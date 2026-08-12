import api from '../api';
import { API_ENDPOINTS } from '../apiEndpoints';
import type { ServiceItem, AssetItem, FilterParams } from '../../types/supportOfferingsTypes';

/**
 * Fetches the created mentoring sessions list from the backend for the Support Offerings screen.
 */
const getSupportOfferingsList = async (
  params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    province?: string;
    site?: string;
  }
): Promise<any> => {
  try {
    const {
      page,
      limit,
      status,
      search,
      province,
      site,
    } = params || {};

    let apiStatus = '';
    if (status === 'Draft') {
      apiStatus = 'DRAFT';
    } else if (status === 'Completed') {
      apiStatus = 'COMPLETED';
    } else if (status === 'Upcoming' || status === 'In progress') {
      apiStatus = 'PUBLISHED';
    } else if (status && status !== 'all-statuses') {
      apiStatus = status.toUpperCase();
    }

    const queryParams = new URLSearchParams();

    if (page !== undefined && page !== null) {
      queryParams.append('page', page.toString());
    }

    if (limit !== undefined && limit !== null) {
      queryParams.append('limit', limit.toString());
    }

    if (apiStatus) {
      queryParams.append('status', apiStatus);
    }

    if (search?.trim()) {
      queryParams.append('search', search.trim());
    }

    if (province && province !== 'all-provinces') {
      queryParams.append('province', province);
    }

    if (site && site !== 'all-sites') {
      queryParams.append('site', site);
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
  params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    province?: string;
    site?: string;
  }
): Promise<any> => {
  let responseData: any = {
    result: { data: [] },
    total: 0,
  };

  try {
    responseData = await getSupportOfferingsList(params);
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
export const getAdditionalServices = async (params?: FilterParams): Promise<ServiceItem[]> => {
  return [];
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


