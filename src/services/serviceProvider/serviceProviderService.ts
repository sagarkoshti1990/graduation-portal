import api from '../api';
import { API_ENDPOINTS } from '../apiEndpoints';
import supportRequestsMock from './mockData/supportRequests.json';

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
}

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

  let list: SupportRequestItem[] = [...(mockStore[tab] || [])];

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
        (item.category && item.category.toLowerCase().includes(q))
    );
  }

  const counts = {
    sessions: mockStore.sessions.length,
    additional_services: mockStore.additional_services.length,
    assets: mockStore.assets.length,
    declined: mockStore.declined.length,
    pendingTotal: mockStore.sessions.length + mockStore.additional_services.length + mockStore.assets.length,
    overdueTotal: mockStore.sessions.filter(i => (i.overdueDays || 0) > 0).length +
      mockStore.additional_services.filter(i => (i.overdueDays || 0) > 0).length +
      mockStore.assets.filter(i => (i.overdueDays || 0) > 0).length,
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
