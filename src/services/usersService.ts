import type {
  UserSearchParams,
  UserSearchResponse,
  RolesListParams,
  RolesListResponse,
  ProvinceEntity,
  SiteEntity,
  EntityTypesListResponse,
} from '@app-types/Users';
import api from './api';
import { API_ENDPOINTS } from './apiEndpoints';
import { ROLE_NAMES } from '@constants/ROLES';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@constants/STORAGE_KEYS';
import logger from '@utils/logger';

// Type declaration for process.env (injected by webpack DefinePlugin on web, available in React Native)
declare const process: {
  env: {
    [key: string]: string | undefined;
  };
} | undefined;

/**
 * Get users list for table view
 * Fetches users based on search and filter parameters
 *
 * @param params - Search parameters including optional search, role, status, province, and site filters
 * @returns A promise resolving to the search response from the API
 */
export const getUsersList = async (params: UserSearchParams): Promise<UserSearchResponse> => {
  try {
    const {
      tenant_code = process?.env?.TENANT_CODE_NAME || 'brac',
      type = ROLE_NAMES.USER,
      page = 1,
      limit = 20, 
      search,
      role,
      status,
      province,
      site,
    } = params;

    // Build query string
    const queryParams = new URLSearchParams({
      tenant_code: tenant_code || '',
      type,
      page: page.toString(),
      limit: limit.toString(),
    });

    // Add optional search parameter
    if (search) {
      queryParams.append('search', search);
    }

    // Add optional filter parameters (except province/site - they go in body meta)
    if (role) {
      queryParams.append('role', role);
    }
    if (status) {
      queryParams.append('status', status);
    }

    const endpoint = `${API_ENDPOINTS.USERS_LIST}?${queryParams.toString()}`;
    
    // Build request body - province/site go in meta
    const requestBody: any = {};
    if (province || site) {
      requestBody.meta = {};
      if (province) {
        requestBody.meta.province = province; // Province ID (e.g., "6952163ae83c1c00147132a8")
      }
      if (site) {
        requestBody.meta.site = site; // Site ID
      }
    }
    
    // Log the complete API URL with query parameters (for debugging)
    const paramsObj: Record<string, string> = {};
    queryParams.forEach((value, key) => {
      paramsObj[key] = value;
    });
    
    // POST request to fetch users
    const response = await api.post<UserSearchResponse>(endpoint, requestBody);
    return response.data;
  } catch (error: any) {
    // Error is already handled by axios interceptor
    throw error;
  }
};

/**
 * Get user roles list for filter dropdown - Dynamic role filter from API
 * Fetches available roles from the API with pagination support
 */
export const getRolesList = async (
  params?: RolesListParams
): Promise<RolesListResponse> => {
  try {
    const { page = 1, limit = 100 } = params || {};
    
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    const endpoint = `${API_ENDPOINTS.USER_ROLES_LIST}?${queryParams.toString()}`;
    
    // GET request to fetch roles
    const response = await api.get<RolesListResponse>(endpoint);

    return response.data;
  } catch (error: any) {
    // Error is already handled by axios interceptor
    throw error;
  }
};

/**
 * Get entity types list and store in local storage - Cache entity types for province filters
 * Stores entity type name-id pairs for later use
 */
export const getEntityTypesList = async (): Promise<EntityTypesListResponse> => {
  try {
    const endpoint = API_ENDPOINTS.ENTITY_TYPES_LIST;
    
    // GET request - internal-access-token header is added automatically by interceptor for entity-management endpoints
    const response = await api.get<EntityTypesListResponse>(endpoint);

    // Store entity types in local storage (name -> _id mapping)
    if (response.data?.result && Array.isArray(response.data.result)) {
      const entityTypesMap: Record<string, string> = {};
      response.data.result.forEach((entityType) => {
        entityTypesMap[entityType.name] = entityType._id;
      });
      
      await AsyncStorage.setItem(
        STORAGE_KEYS.ENTITY_TYPES,
        JSON.stringify(entityTypesMap)
      );
    }

    return response.data;
  } catch (error: any) {
    // Error is already handled by axios interceptor
    throw error;
  }
};

/**
 * Get entity types from local storage
 * Returns cached entity types if available
 */
export const getEntityTypesFromStorage = async (): Promise<Record<string, string> | null> => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.ENTITY_TYPES);
    if (stored) {
      return JSON.parse(stored);
    }
    return null;
  } catch (error) {
    logger.error('Error reading entity types from storage:', error);
    return null;
  }
};

/**
 * Get provinces list by entity type ID - Dynamic province filter from API
 * Uses the province entity type ID to fetch all provinces
 */
export const getProvincesByEntityType = async (
  provinceEntityTypeId: string
): Promise<{
  message: string;
  status: number;
  result: ProvinceEntity[];
}> => {
  try {
    const endpoint = `${API_ENDPOINTS.ENTITIES_BY_TYPE}/${provinceEntityTypeId}`;
    
    // GET request - internal-access-token header is added automatically by interceptor for entity-management endpoints
    const response = await api.get<{
      message: string;
      status: number;
      result: ProvinceEntity[];
    }>(endpoint);

    return response.data;
  } catch (error: any) {
    // Error is already handled by axios interceptor
    throw error;
  }
};

/**
 * Get provinces list - Helper function that handles entity type fetching and caching
 * Fetches provinces by first getting entity types (from cache or API), then fetching provinces
 * This encapsulates the common pattern used across the application
 * 
 * @returns A promise resolving to an array of ProvinceEntity, or empty array on error
 */
export const getProvincesList = async (): Promise<ProvinceEntity[]> => {
  try {
    // First, check if entity types are in storage
    let entityTypes = await getEntityTypesFromStorage();
    
    // If not in storage, fetch entity types from API
    if (!entityTypes || !entityTypes.province) {
      await getEntityTypesList();
      entityTypes = await getEntityTypesFromStorage();
    }

    // Get province entity type ID
    const provinceEntityTypeId = entityTypes?.province;
    
    if (!provinceEntityTypeId) {
      return [];
    }

    // Fetch provinces using the entity type ID
    const provincesResponse = await getProvincesByEntityType(provinceEntityTypeId);
    return provincesResponse.result || [];
  } catch (error) {
    logger.error('Error fetching provinces:', error);
    return [];
  }
};

/**
 * Get sites list by entity type ID - Fetches all sites
 * Uses the site entity type ID to fetch all sites
 */
export const getSitesByEntityType = async (
  siteEntityTypeId: string,
  params?: { page?: number; limit?: number }
): Promise<{
  message: string;
  status: number;
  result: SiteEntity[];
}> => {
  try {
    const { page = 1, limit = 100 } = params || {};
    
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    const endpoint = `${API_ENDPOINTS.ENTITIES_BY_TYPE}/${siteEntityTypeId}?${queryParams.toString()}`;
    
    // GET request - internal-access-token header is added automatically by interceptor for entity-management endpoints
    const response = await api.get<{
      message: string;
      status: number;
      result: SiteEntity[];
    }>(endpoint);

    return response.data;
  } catch (error: any) {
    // Error is already handled by axios interceptor
    throw error;
  }
};

/**
 * Get all sites list - Helper function that handles entity type fetching and caching
 * Fetches all sites by first getting entity types (from cache or API), then fetching sites
 * 
 * @returns A promise resolving to an array of SiteEntity, or empty array on error
 */
export const getAllSites = async (): Promise<SiteEntity[]> => {
  try {
    // First, check if entity types are in storage
    let entityTypes = await getEntityTypesFromStorage();
    
    // If not in storage, fetch entity types from API
    if (!entityTypes || !entityTypes.site) {
      await getEntityTypesList();
      entityTypes = await getEntityTypesFromStorage();
    }

    // Get site entity type ID
    const siteEntityTypeId = entityTypes?.site;
    
    if (!siteEntityTypeId) {
      return [];
    }

    // Fetch all sites using the entity type ID
    const sitesResponse = await getSitesByEntityType(siteEntityTypeId, {
      page: 1,
      limit: 100,
    });
    return sitesResponse.result || [];
  } catch (error) {
    logger.error('Error fetching all sites:', error);
    return [];
  }
};

/**
 * Get sites list by province ID - Dynamic site filter from API
 * Fetches sites for a specific province using subEntityList endpoint, or all sites if no province provided
 * 
 * @param params - Optional parameters including provinceId and pagination
 * @returns A promise resolving to the sites response from the API
 */
export const getSitesByProvince = async (
  params?: { provinceId?: string; page?: number; limit?: number }
): Promise<{
  message: string;
  status: number;
  result: {
    data: SiteEntity[];
    count?: number;
    total?: number;
  };
}> => {
  try {
    const { provinceId, page = 1, limit = 100 } = params || {};
    
    // If no province provided, fetch all sites
    if (!provinceId || provinceId === 'all-provinces' || provinceId === 'all-Provinces') {
      const allSites = await getAllSites();
      return {
        message: 'Success',
        status: 200,
        result: {
          data: allSites,
          count: allSites.length,
          total: allSites.length,
        },
      };
    }
    
    const queryParams = new URLSearchParams({
      type: 'site',
      page: page.toString(),
      limit: limit.toString(),
    });

    const endpoint = `${API_ENDPOINTS.PARTICIPANTS_SUB_ENTITY_LIST}/${provinceId}?${queryParams.toString()}`;
    
    // GET request - internal-access-token header is added automatically by interceptor for entity-management endpoints
    const response = await api.get<{
      message: string;
      status: number;
      result: {
        data: SiteEntity[];
        count?: number;
        total?: number;
      };
    }>(endpoint);

    return response.data;
  } catch (error: any) {
    // Error is already handled by axios interceptor
    throw error;
  }
};


/**
 * Reset Password Response Interface
 */
export interface ResetPasswordResponse {
  responseCode: string;
  message: string;
  result?: any;
}

/**
 * Reset Password Request Interface
 */
export interface ResetPasswordRequest {
  username: string;
  email: string;
  password: string;
  userId: string;
}

/**
 * Resets the password for a user.
 * 
 * @param params - Object containing username, email, and new password
 * @returns A promise resolving to the reset password response from the API
 * 
 * Note: Currently returns a static response for testing purposes.
 * TODO: Replace with actual API endpoint when backend is ready.
 */
export const resetPassword = async (
  params: ResetPasswordRequest
): Promise<ResetPasswordResponse> => {
  try {
    logger.log('Reset password called for user:', params.username);
    
    // TODO: Replace this with actual API call when endpoint is available
    // Example:
    // const response = await api.post<ResetPasswordResponse>(
    //   API_ENDPOINTS.RESET_PASSWORD,
    //   params
    // );
    // return response.data;
    
    // Static response for now
    const staticResponse: ResetPasswordResponse = {
      responseCode: '200',
      message: 'Password reset successfully',
      result: {
        username: params.username,
        email: params.email,
        updatedAt: new Date().toISOString(),
      },
    };
    
    logger.log('Password reset successful (static response)');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return staticResponse;
  } catch (error: any) {
    logger.error('Reset password error:', {
      message: error?.message,
      response: error?.response?.data,
      status: error?.response?.status,
    });
    throw error;
  }
};

/**
 * Deactivate one or more users (Admin only)
 *
 * API: POST /user/v1/admin/deactivateUser
 * Body: { "id": [3125] }
 */
export const deactivateUser = async (ids: Array<string | number>): Promise<any> => {
  try {
    const normalized = (ids || []).map((v) => {
      const n = typeof v === 'number' ? v : Number(v);
      return Number.isFinite(n) ? n : v;
    });
    const response = await api.post(API_ENDPOINTS.DEACTIVATE_USER, { id: normalized });
    return response.data;
  } catch (error: any) {
    throw error;
  }
};
