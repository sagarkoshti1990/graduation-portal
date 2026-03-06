import TEMPLATE_PATHWAY_DATA from '@constants/TEMPLATE_PATHWAYS';
import TEMPLATE_CATEGORIES from '@constants/TEMPLATE_CATEGORIES';
import { TemplateData } from '@app-types/screens';
import api from './api';
import { API_ENDPOINTS } from './apiEndpoints';

// TODO: Replace simulated API calls with real backend integration when API endpoints are available
export const getProjectTemplates = async (): Promise<TemplateData[]> => {
  // Simulate API call - Replace with actual fetch/axios call in production
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(TEMPLATE_PATHWAY_DATA);
    }, 100);
  });
};

export const getProjectCategories = async (): Promise<
  { name: string; options: string[] }[]
> => {
  // Simulate API call - Replace with actual fetch/axios call in production
  return new Promise(resolve => {
    setTimeout(() => {
      const categoriesArray = Object.entries(TEMPLATE_CATEGORIES).map(
        ([name, options]) => ({
          name,
          options,
        }),
      );
      resolve(categoriesArray);
    }, 100);
  });
};

export const getProjectCategoryList = async (): Promise<any> => {
  try {
    const response = await api.get(API_ENDPOINTS.PROJECT_CATEGORIES_LIST);
    return response.data.result || [];
  } catch (error: unknown) {
    // Error is already handled by axios interceptor
    throw error;
  }
};

export const getChildCategories = async (): Promise<TemplateData[]> => {
  try {
    const response = await api.get(API_ENDPOINTS.PROJECT_CATEGORIES_LIST);
    return response.data.result || [];
  } catch (error: unknown) {
    throw error;
  }
};
