import api from '../api';
import { API_ENDPOINTS } from '../apiEndpoints';
import supportRequestsMock from './mockData/supportRequests.json';

export interface SupportRequestItem {
  id: string;
  type: 'sessions' | 'additional_services' | 'assets';
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
  preferredDate?: string;
  preferredTime?: string;
  preferredLocation?: string;
  description?: string;
  specialRequirements?: string;
  status: 'pending' | 'accepted' | 'declined' | 'info_requested';
  requestedDate?: string;
  overdueDays?: number;
  declineReason?: string;
  declineDetails?: string;
}

export interface SupportRequestsFilterParams {
  tab?: 'sessions' | 'additional_services' | 'assets' | 'declined';
  province?: string;
  site?: string;
  search?: string;
}

export interface AcceptAndSchedulePayload {
  requestId: string;
  date: string;
  time: string;
  duration: string;
  location: string;
  meetingLink?: string;
  notes?: string;
}

export interface RequestInfoPayload {
  requestId: string;
  message: string;
}

export interface DeclinePayload {
  requestId: string;
  reason: string;
  details?: string;
}

/**
 * Fetch support requests list filtered by tab, province, site, and search term
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
  try {
    // Attempt API fetch if endpoint is configured, otherwise fallback gracefully to mockData
    if (API_ENDPOINTS && (API_ENDPOINTS as any).SERVICE_PROVIDER_REQUESTS) {
      const response = await api.get((API_ENDPOINTS as any).SERVICE_PROVIDER_REQUESTS, {
        params,
      });
      if (response.data) {
        return response.data;
      }
    }
  } catch (error) {
    console.warn('Backend API endpoint unavailable, using local mock dataset for Support Requests:', error);
  }

  // Mock Data fallback & filtering logic
  const { tab = 'sessions', province, site, search } = params || {};

  const allCategories = supportRequestsMock as Record<string, SupportRequestItem[]>;
  let list: SupportRequestItem[] = allCategories[tab] || [];

  if (province && province !== 'all-provinces') {
    const targetProv = province.toLowerCase().replace(/[\s-_]/g, '');
    list = list.filter((item) => {
      const itemProv = (item.province || '').toLowerCase().replace(/[\s-_]/g, '');
      return itemProv === targetProv || itemProv.includes(targetProv) || targetProv.includes(itemProv);
    });
  }

  if (site && site !== 'all-sites') {
    const targetSite = site.toLowerCase().replace(/[\s-_]/g, '');
    list = list.filter((item) => {
      const itemSite = (item.site || '').toLowerCase().replace(/[\s-_]/g, '');
      return itemSite === targetSite || itemSite.includes(targetSite) || targetSite.includes(itemSite);
    });
  }

  if (search && search.trim() !== '') {
    const q = search.toLowerCase();
    list = list.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.coach.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }

  const counts = {
    sessions: (allCategories.sessions || []).length,
    additional_services: (allCategories.additional_services || []).length,
    assets: (allCategories.assets || []).length,
    declined: (allCategories.declined || []).length,
    pendingTotal: 11,
    overdueTotal: 11,
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

  // Simulated local response
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

  return {
    success: true,
    message: 'Support request declined successfully.',
  };
};
