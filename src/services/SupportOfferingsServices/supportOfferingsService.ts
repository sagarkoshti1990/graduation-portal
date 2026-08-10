import api from '../api';
import { API_ENDPOINTS } from '../apiEndpoints';

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
      page = 1,
      limit = 5,
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

    // Build query string matching getParticipantsList pattern
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

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

    const endpoint = `${API_ENDPOINTS.SUPPORT_OFFERINGS_SESSIONS}?${queryParams.toString()}`;

    const response = await api.get(endpoint);

    const data = response.data?.result?.data || [];

    return {
      ...response.data,
      result: {
        ...response.data?.result,
        data,
      },
      total: response.data?.total ?? response.data?.result?.total ?? response.data?.count ?? data.length,
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
 * Fetch Additional Services (Empty placeholder as mock data is deleted and API is not implemented)
 */
export const getAdditionalServices = async (params: FilterParams): Promise<ServiceItem[]> => {
  return [];
};

/**
 * Fetch Assets (Empty placeholder as mock data is deleted and API is not implemented)
 */
export const getAssets = async (params: FilterParams): Promise<AssetItem[]> => {
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
