import { TemplateData } from '@app-types/screens';
import api from './api';
import { API_ENDPOINTS } from './apiEndpoints';
import { isNetworkOffline } from '@utils/networkStatus';
import offlineStorage from './offlineStorage';
import { OFFLINE_KEYS } from '@constants/STORAGE_KEYS';

export const getProjectCategoryList = async (): Promise<any> => {
  // Prevent API call when offline — return cached project categories.
  if (isNetworkOffline()) {
    const cached = await offlineStorage.read<any[]>(OFFLINE_KEYS.PROJECT_CATEGORIES).catch(() => null);
    return cached ?? [];
  }

  try {
    const response = await api.get(API_ENDPOINTS.PROJECT_CATEGORIES_LIST);
    return response.data.result || [];
  } catch (error: any) {
    throw error;
  }
};

export const getChildCategories = async (): Promise<TemplateData[]> => {
  try {
    const response = await api.get(API_ENDPOINTS.PROJECT_CATEGORIES_LIST);
    return response.data.result || [];
  } catch (error: any) {
    // Error is already handled by axios interceptor
    throw error;
  }
};
