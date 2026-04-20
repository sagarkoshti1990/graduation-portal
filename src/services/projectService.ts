import { TemplateData } from '@app-types/screens';
import api from './api';
import { API_ENDPOINTS } from './apiEndpoints';

export const getProjectCategoryList = async (): Promise<any> => {
  try {
    const response = await api.get(API_ENDPOINTS.PROJECT_CATEGORIES_LIST);
    // const res = pathwaysData;
    return response.data.result || [];
    // return res?.result || [];
  } catch (error: any) {
    // Error is already handled by axios interceptor
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
