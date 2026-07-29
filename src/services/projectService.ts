import { TemplateData } from '@app-types/screens';
import api from './api';
import { API_ENDPOINTS } from './apiEndpoints';
import { isNetworkOffline } from '@utils/networkStatus';
import offlineStorage from './offlineStorage';
import { OFFLINE_KEYS } from '@constants/STORAGE_KEYS';

export const getProjectCategoryList = async (): Promise<any> => {
  // Offline master data is the source of truth. Recreate the API response for
// ?parentId=null&keywords=idp&getChildren=true by returning only root IDP
// categories and attaching their immediate (1-level) children. Fall back to
// the API only when no offline cache exists.
  const tree = await offlineStorage
    .read<any[]>(OFFLINE_KEYS.LIBRARY_CATEGORIES_TREE)
    .catch(() => null);

  if (tree) {
    const rootCategories = tree
      .filter(
        (node: any) =>
          node.parentId == null &&
          (node?.keywords ?? []).some(
            (kw: string) => kw?.toLowerCase() === 'idp',
          ),
      )
      .map((parent: any) => ({
        ...parent,
        children: tree.filter(
          (child: any) => child.parentId === parent._id,
        ),
      }));

    return rootCategories;
  }

  if (isNetworkOffline()) return [];

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
