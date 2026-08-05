import api from '../api';
import { API_ENDPOINTS } from '../apiEndpoints';
import supportOfferingsData from './mockData/supportOfferings.json';
import {
  TrainingSessionItem,
  ServiceItem,
  AssetItem,
  FilterParams,
} from '../../constants/SUPPORT_OFFERINGS_MOCK';


const sessions: TrainingSessionItem[] = [...supportOfferingsData.mockTrainings] as TrainingSessionItem[];

/**
 * Helper to dynamically compute status based on session date vs current date
 */
export const getDynamicStatusFromDate = (
  dateStr?: string
): 'Upcoming' | 'In progress' | 'Completed' => {
  if (!dateStr) return 'Upcoming';

  const sessionDate = new Date(dateStr);
  if (isNaN(sessionDate.getTime())) {
    return 'Upcoming';
  }

  const today = new Date();

  // Reset time portions for accurate day comparison
  const sessionDay = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate());
  const currentDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  if (sessionDay.getTime() > currentDay.getTime()) {
    return 'Upcoming';
  } else if (sessionDay.getTime() === currentDay.getTime()) {
    return 'In progress';
  } else {
    return 'Completed';
  }
};

/**
 * Fetch Training Sessions
 */
export const getTrainingSessions = async (params: FilterParams): Promise<TrainingSessionItem[]> => {
  try {
    if (API_ENDPOINTS && (API_ENDPOINTS as any).SUPPORT_OFFERINGS_SESSIONS) {
      const response = await api.get((API_ENDPOINTS as any).SUPPORT_OFFERINGS_SESSIONS, { params });
      if (response.data) {
        return response.data.map((item: TrainingSessionItem) => ({
          ...item,
          status: item.date ? getDynamicStatusFromDate(item.date) : item.status,
        }));
      }
    }
  } catch (error) {
    console.warn('Backend API endpoint unavailable, using local mock dataset for Training Sessions:', error);
  }

  const { searchQuery, statusFilter, provinceFilter, siteFilter, draftStatusFilter, provincesList = [], sitesList = [] } = params || {};

  let list = sessions.map((item) => {
    if (item.status === 'Draft') {
      return item;
    }
    return {
      ...item,
      status: item.date ? getDynamicStatusFromDate(item.date) : item.status,
    };
  });

  if (searchQuery && searchQuery.trim() !== '') {
    const q = searchQuery.toLowerCase().trim();
    list = list.filter((item) => {
      return (
        item.title?.toLowerCase().includes(q) ||
        item.requestedBy?.toLowerCase().includes(q) ||
        item.location?.toLowerCase().includes(q) ||
        item.notes?.toLowerCase().includes(q)
      );
    });
  }

  if (provinceFilter && provinceFilter !== 'all-provinces') {
    const selectedProvName = provincesList.find((p) => p._id === provinceFilter)?.name;
    const targetProv = (selectedProvName || provinceFilter).toLowerCase().replace(/[\s-_]/g, '');
    list = list.filter((item) => {
      const itemProv = (item.province || '').toLowerCase().replace(/[\s-_]/g, '');
      const itemReq = (item.requestedBy || '').toLowerCase().replace(/[\s-_]/g, '');
      return itemProv === targetProv || itemProv.includes(targetProv) || itemReq.includes(targetProv);
    });
  }

  if (siteFilter && siteFilter !== 'all-sites') {
    const selectedSiteName = sitesList.find((s) => s._id === siteFilter)?.name;
    const targetSite = (selectedSiteName || siteFilter).toLowerCase().replace(/[\s-_]/g, '');
    list = list.filter((item) => {
      const itemSite = (item.siteKey || '').toLowerCase().replace(/[\s-_]/g, '');
      const itemReq = (item.requestedBy || '').toLowerCase().replace(/[\s-_]/g, '');
      return itemSite === targetSite || itemSite.includes(targetSite) || itemReq.includes(targetSite);
    });
  }

  if (statusFilter && statusFilter !== 'all-statuses') {
    list = list.filter((item) => item.status === statusFilter);
  }

  if (draftStatusFilter === 'Draft') {
    list = list.filter((item) => item.status === 'Draft');
  } else if (draftStatusFilter === 'Published') {
    list = list.filter((item) => item.status !== 'Draft');
  }

  return list;
};

/**
 * Fetch Additional Services
 */
export const getAdditionalServices = async (params: FilterParams): Promise<ServiceItem[]> => {
  try {
    if (API_ENDPOINTS && (API_ENDPOINTS as any).SUPPORT_OFFERINGS_SERVICES) {
      const response = await api.get((API_ENDPOINTS as any).SUPPORT_OFFERINGS_SERVICES, { params });
      if (response.data) {
        return response.data;
      }
    }
  } catch (error) {
    console.warn('Backend API endpoint unavailable, using local mock dataset for Additional Services:', error);
  }

  const { searchQuery, statusFilter, provinceFilter, siteFilter, provincesList = [], sitesList = [] } = params || {};

  const rawServices = (supportOfferingsData.mockServices || []) as ServiceItem[];
  let list = [...rawServices];

  if (searchQuery && searchQuery.trim() !== '') {
    const q = searchQuery.toLowerCase().trim();
    list = list.filter((item) => {
      return (
        item.title?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.location?.toLowerCase().includes(q) ||
        item.hubOffice?.toLowerCase().includes(q) ||
        item.site?.toLowerCase().includes(q)
      );
    });
  }

  if (provinceFilter && provinceFilter !== 'all-provinces') {
    const selectedProvName = provincesList.find((p) => p._id === provinceFilter)?.name;
    const targetProv = (selectedProvName || provinceFilter).toLowerCase().replace(/[\s-_]/g, '');
    list = list.filter((item) => {
      const itemProv = (item.province || '').toLowerCase().replace(/[\s-_]/g, '');
      return itemProv === targetProv || itemProv.includes(targetProv);
    });
  }

  if (siteFilter && siteFilter !== 'all-sites') {
    const selectedSiteName = sitesList.find((s) => s._id === siteFilter)?.name;
    const targetSite = (selectedSiteName || siteFilter).toLowerCase().replace(/[\s-_]/g, '');
    list = list.filter((item) => {
      const itemSiteKey = (item.siteKey || '').toLowerCase().replace(/[\s-_]/g, '');
      const itemSite = (item.site || '').toLowerCase().replace(/[\s-_]/g, '');
      return itemSiteKey === targetSite || itemSiteKey.includes(targetSite) || itemSite.includes(targetSite);
    });
  }

  if (statusFilter && statusFilter !== 'all-statuses') {
    list = list.filter((item) => item.status === statusFilter);
  }

  return list;
};

/**
 * Fetch Assets
 */
export const getAssets = async (params: FilterParams): Promise<AssetItem[]> => {
  try {
    if (API_ENDPOINTS && (API_ENDPOINTS as any).SUPPORT_OFFERINGS_ASSETS) {
      const response = await api.get((API_ENDPOINTS as any).SUPPORT_OFFERINGS_ASSETS, { params });
      if (response.data) {
        return response.data;
      }
    }
  } catch (error) {
    console.warn('Backend API endpoint unavailable, using local mock dataset for Assets:', error);
  }

  const { searchQuery, statusFilter, provinceFilter, siteFilter, provincesList = [], sitesList = [] } = params || {};

  const rawAssets = (supportOfferingsData.mockAssets || []) as AssetItem[];
  let list = [...rawAssets];

  if (searchQuery && searchQuery.trim() !== '') {
    const q = searchQuery.toLowerCase().trim();
    list = list.filter((item) => {
      return (
        item.title?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.type?.toLowerCase().includes(q) ||
        item.sector?.toLowerCase().includes(q) ||
        item.location?.toLowerCase().includes(q)
      );
    });
  }

  if (provinceFilter && provinceFilter !== 'all-provinces') {
    const selectedProvName = provincesList.find((p) => p._id === provinceFilter)?.name;
    const targetProv = (selectedProvName || provinceFilter).toLowerCase().replace(/[\s-_]/g, '');
    list = list.filter((item) => {
      const itemProv = (item.province || '').toLowerCase().replace(/[\s-_]/g, '');
      const itemLoc = (item.location || '').toLowerCase().replace(/[\s-_]/g, '');
      return itemProv === targetProv || itemProv.includes(targetProv) || itemLoc.includes(targetProv);
    });
  }

  if (siteFilter && siteFilter !== 'all-sites') {
    const selectedSiteName = sitesList.find((s) => s._id === siteFilter)?.name;
    const targetSite = (selectedSiteName || siteFilter).toLowerCase().replace(/[\s-_]/g, '');
    list = list.filter((item) => {
      const itemSiteKey = (item.siteKey || '').toLowerCase().replace(/[\s-_]/g, '');
      return itemSiteKey === targetSite || itemSiteKey.includes(targetSite);
    });
  }

  if (statusFilter && statusFilter !== 'all-statuses') {
    list = list.filter((item) => item.status === statusFilter);
  }

  return list;
};

/**
 * Complete Training Session API
 */
export const completeTrainingSession = async (
  sessionId: string,
  data: { presentCount: number }
): Promise<any> => {
  try {
    const endpoint = (API_ENDPOINTS as any).SUPPORT_OFFERINGS_COMPLETE_SESSION
      ? (API_ENDPOINTS as any).SUPPORT_OFFERINGS_COMPLETE_SESSION(sessionId)
      : `/api/user/v1/support-offerings/sessions/${sessionId}/complete`;
    const response = await api.post(endpoint, data);
    return response.data;
  } catch (error) {
    console.warn('Backend API endpoint unavailable for completeTrainingSession, returning fallback response:', error);
    return { success: true, sessionId, presentCount: data.presentCount };
  }
};

/**
 * Save / Update a Training Session (Draft or Published)
 */
export const saveTrainingSession = async (
  _values: any,
  _isDraft: boolean
): Promise<{ success: boolean }> => {
  return { success: true };
};

/**
 * Get a single training session by ID
 */
export const getTrainingSessionById = async (
  id: number
): Promise<TrainingSessionItem | undefined> => {
  return sessions.find((s) => s.id === id);
};
