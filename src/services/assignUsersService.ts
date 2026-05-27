/**
 * Assign Users Service
 * Service functions for the Assign Users screen
 * Handles API calls for assigning LCs to Supervisors and Participants to LCs
 */

import type { UserSearchResponse } from '@app-types/Users';
import api from './api';
import { API_ENDPOINTS } from './apiEndpoints';

// Type declaration for process.env (injected by webpack DefinePlugin on web, available in React Native)
declare const process: {
  env: {
    [key: string]: string | undefined;
  };
} | undefined;

/**
 * Get supervisors list - Dynamic supervisor filter from API
 * Fetches supervisors (tenant_admin) - all supervisors if no province provided, or filtered by province
 * 
 * @param params - Optional parameters including province and pagination
 * @returns A promise resolving to the supervisors response from the API
 */
export const getSupervisorsByProvince = async (
  params?: { provinceId?: string; page?: number; limit?: number, search?:string }
): Promise<UserSearchResponse> => {
  try {
    const { provinceId, page = 1, limit = 100, search = "" } = params || {};
    
    // Build query string
    const queryParams = new URLSearchParams({
      tenant_code: 'brac', // Hardcoded tenant code for browser compatibility
      type: 'tenant_admin',
      search,
      page: page.toString(),
      limit: limit.toString(),
    });

    const endpoint = `${API_ENDPOINTS.USERS_LIST}?${queryParams.toString()}`;
    
    // Build request body - province goes in meta.province (only if province is provided)
    const requestBody: any = {};
    if (provinceId && provinceId !== 'all-provinces' && provinceId !== 'all-Provinces') {
      requestBody.meta = {
        province: provinceId,
    };
    }
    
    // POST request to fetch supervisors
    const response = await api.post<UserSearchResponse>(endpoint, requestBody);
    return response.data;
  } catch (error: any) {
    // Error is already handled by axios interceptor
    throw error;
  }
};

/**
 * Get linkage champions (org_admin) list for a program
 * Fetches linkage champions that can be assigned to supervisors
 * 
 * @param programId - Program ID (e.g., "6952469bd9f179bdf8abe717")
 * @param params - Optional parameters (excludeMapped, limit, province, site, search)
 * @returns A promise resolving to the linkage champions response from the API
 */
export const getLinkageChampions = async (
  programId: string,
  params?: { excludeMapped?: boolean; limit?: number; province?: string; site?: string; search?: string }
): Promise<UserSearchResponse> => {
  try {
    const { excludeMapped = true, limit = 100, province, site, search } = params || {};
    
    // Build query string
    const queryParams = new URLSearchParams({
      programId: programId,
      excludeMapped: excludeMapped.toString(),
      limit: limit.toString(),
      type: 'org_admin',
    });

    // Add optional search parameter (name/email)
    if (search && search.trim()) {
      queryParams.append('search', search.trim());
    }

    const endpoint = `${API_ENDPOINTS.PROGRAM_USERS_SEARCH}?${queryParams.toString()}`;
    
    // Build request body - site goes in meta.site (province removed from Step 2)
    const requestBody: any = {};
    const meta: any = {};
    
    if (site && site !== 'all-sites') {
      meta.site = site; // Site ID
    }
    
    // Add meta to requestBody if it has at least one property
    if (Object.keys(meta).length > 0) {
      requestBody.meta = meta;
    }
    
    // POST request to fetch linkage champions
    const response = await api.post<UserSearchResponse>(endpoint, requestBody);
    return response.data;
  } catch (error: any) {
    // Error is already handled by axios interceptor
    throw error;
  }
};

/**
 * Get participants (user type) list for a program
 * Fetches participants that can be assigned to LCs
 * 
 * @param programId - Program ID (e.g., "6952469bd9f179bdf8abe717")
 * @param params - Optional parameters (excludeMapped, limit, province, site, page, userIds)
 * @returns A promise resolving to the participants response from the API
 */
export const getParticipants = async (
  programId: string,
  params?: {
    excludeMapped?: boolean;
    limit?: number;
    province?: string;
    site?: string;
    page?: number;
    search?: string;
    /** When set, sent in the request body to restrict results to these user IDs. */
    userIds?: (string | number)[];
    /**
     * Query `type` for program user search (defaults to `user`).
     * Pass a comma-separated list when enriching a mixed-role admin table.
     */
    searchType?: string;
  }
): Promise<UserSearchResponse> => {
  try {
    const {
      excludeMapped = true,
      limit = 100,
      province,
      site,
      page = 1,
      search,
      userIds,
      searchType = 'user',
    } = params || {};
    
    // Build query string
    const queryParams = new URLSearchParams({
      programId: programId,
      excludeMapped: excludeMapped.toString(),
      limit: limit.toString(),
      type: searchType,
      page: page.toString(),
    });

    // Add optional search parameter (name/email)
    if (search && search.trim()) {
      queryParams.append('search', search.trim());
    }

    const endpoint = `${API_ENDPOINTS.PROGRAM_USERS_SEARCH}?${queryParams.toString()}`;
    
    // Build request body - province and site go in meta (similar to UserManagement)
    const requestBody: any = {};
    const meta: any = {};
    
    if (province && province !== 'all-provinces' && province !== 'all-Provinces') {
      meta.province = province; // Province ID (e.g., "69806d35b0bb2500136cfba5")
    }
    
    if (site && site !== 'all-sites') {
      meta.site = site; // Site ID
    }
    
    // Add meta to requestBody if it has at least one property
    if (Object.keys(meta).length > 0) {
      requestBody.meta = meta;
    }

    if (userIds && userIds.length > 0) {
      requestBody.userIds = userIds.map((id) =>
        typeof id === 'string' && /^\d+$/.test(id) ? Number(id) : id
      );
    }
    
    // POST request to fetch participants
    const response = await api.post<UserSearchResponse>(endpoint, requestBody);
    return response.data;
  } catch (error: any) {
    // Error is already handled by axios interceptor
    throw error;
  }
};

/**
 * Get mapped LCs for a supervisor
 * Fetches the list of Linkage Champions assigned to a specific supervisor
 * 
 * @param params - Query parameters
 * @returns A promise resolving to the mapped LCs response from the API
 */
export const getMappedLCsForSupervisor = async (params: {
  userId: string; // Supervisor's user ID
  programId: string; // Program ID
  type?: string; // Entity type (default: "org_admin")
  page?: number; // Page number (default: 1)
  limit?: number; // Limit per page (default: 5)
  search?: string; // Search query (default: "")
}): Promise<any> => {
  try {
    const { userId, programId, type = 'org_admin', page = 1, limit = 5, search = '' } = params;
    
    // Build query string
    const queryParams = new URLSearchParams({
      userId: userId,
      type: type,
      page: page.toString(),
      limit: limit.toString(),
      search: search,
      programId: programId,
    });

    const endpoint = `${API_ENDPOINTS.PARTICIPANTS_LIST}?${queryParams.toString()}`;
    
    // GET request to fetch mapped LCs
    const response = await api.get<any>(endpoint);
    return response.data;
  } catch (error: any) {
    // Error is already handled by axios interceptor
    throw error;
  }
};

/**
 * Assign LCs to Supervisor
 * Creates or updates program user assignments
 * 
 * @param params - Assignment parameters
 * @returns A promise resolving to the API response
 */
export const assignLCsToSupervisor = async (params: {
  userId: string; // Supervisor's user ID
  programId: string; // Program ID
  assignedUserIds: string[]; // Array of LC user IDs
  assignedUsersStatus?: string; // Status for assigned users (default: "ACTIVE")
  userRolesToEntityTypeMap?: Record<string, string>; // Role to entity type mapping
}): Promise<any> => {
  try {
    const {
      userId,
      programId,
      assignedUserIds,
      assignedUsersStatus = 'ACTIVE',
      userRolesToEntityTypeMap = {
        org_admin: 'linkageChampion',
        tenant_admin: 'supervisor',
        user: 'participant',
      },
    } = params;

    const endpoint = API_ENDPOINTS.UPDATE_ENTITY_DETAILS;
    
    const requestBody = {
      userId,
      programId,
      assignedUserIds,
      assignedUsersStatus,
      userRolesToEntityTypeMap,
    };
    
    // Additional headers (static for now)
    const headers = {
      // @ts-ignore - process.env is injected by webpack DefinePlugin on web, available in React Native
      'admin-access-token': process.env.ADMIN_ACCESS_TOKEN,
      // @ts-ignore - process.env is injected by webpack DefinePlugin on web, available in React Native
      'tenantId': process.env.TENANT_CODE_NAME,
      // @ts-ignore - process.env is injected by webpack DefinePlugin on web, available in React Native
      'orgId': process.env.ORG_ID,
    }
    const response = await api.post<any>(endpoint, requestBody, {headers});
    // Check if HTTP response status is 200 (success)
    if (response.status !== 200) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    // Check response data status - if it contains an error status, throw error
    const responseData = response.data;
    if (responseData?.status) {
      // Check for error status codes in response body
      if (responseData.status !== 200 && 
          responseData.status !== 'OK' && 
          responseData.status !== 'SUCCESS' &&
          responseData.status.toString().startsWith('ERR_')) {
        throw new Error(responseData?.message || 'API request failed');
      }
    }
    
    return response.data;
  } catch (error: any) {
    // Error is already handled by axios interceptor
    throw error;
  }
};

/**
 * Assign Participants to LC
 * Creates or updates program user assignments for participants to Linkage Champions
 * 
 * @param params - Assignment parameters
 * @returns A promise resolving to the API response
 */
export const assignParticipantsToLC = async (params: {
  userId: string; // LC's user ID
  programId: string; // Program ID
  assignedUserIds: string[]; // Array of participant user IDs
  assignedUsersStatus?: string; // Status for assigned users (default: "NOT_ONBOARDED")
  userRolesToEntityTypeMap?: Record<string, string>; // Role to entity type mapping
}): Promise<any> => {
  try {
    const {
      userId,
      programId,
      assignedUserIds,
      assignedUsersStatus = 'NOT_ONBOARDED',
      userRolesToEntityTypeMap = {
        org_admin: 'linkageChampion',
        tenant_admin: 'supervisor',
        user: 'participant',
      },
    } = params;

    const endpoint = API_ENDPOINTS.UPDATE_ENTITY_DETAILS;
    
    const requestBody = {
      userId,
      programId,
      assignedUserIds,
      assignedUsersStatus,
      userRolesToEntityTypeMap,
    };
    
    // Additional headers (static values as fallback if env vars are not set)
    // @ts-ignore - process.env is injected by webpack DefinePlugin on web, available in React Native
    const adminAccessToken = process.env.ADMIN_ACCESS_TOKEN;
    // @ts-ignore - process.env is injected by webpack DefinePlugin on web, available in React Native
    const tenantId = process.env.TENANT_CODE_NAME;
    // @ts-ignore - process.env is injected by webpack DefinePlugin on web, available in React Native
    const orgId = process.env.ORG_ID;

    const response = await api.post<any>(endpoint, requestBody, {
      headers: {
        'admin-access-token': adminAccessToken,
        'tenantId': tenantId,
        'orgId': orgId,
      },
    });
    
    // Check if HTTP response status is 200 (success)
    if (response.status !== 200) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    // Check response data status - if it contains an error status, throw error
    const responseData = response.data;
    if (responseData?.status) {
      // Check for error status codes in response body
      if (responseData.status !== 200 && 
          responseData.status !== 'OK' && 
          responseData.status !== 'SUCCESS' &&
          responseData.status.toString().startsWith('ERR_')) {
        throw new Error(responseData?.message || 'Failed to assign participants to LC.');
      }
    }
    
    // Also check for responseCode if status is not present
    if (responseData?.responseCode && responseData.responseCode !== 'OK') {
      throw new Error(responseData?.message || 'Failed to assign participants to LC.');
    }
    
    return response.data;
  } catch (error: any) {
    // Error is already handled by axios interceptor
    throw error;
  }
};

/**
 * Get mapped participants for an LC
 * Fetches the list of participants assigned to a specific Linkage Champion
 * 
 * @param params - Query parameters
 * @returns A promise resolving to the mapped participants response from the API
 */
export const getMappedParticipantsForLC = async (params: {
  userId: string; // LC's user ID
  programId: string; // Program ID
  type?: string; // Entity type (default: "user")
  page?: number; // Page number (default: 1)
  limit?: number; // Limit per page (default: 100)
  search?: string; // Search query (default: "")
}): Promise<any> => {
  try {
    const { userId, programId, type = 'user', page = 1, limit = 100, search = '' } = params;
    
    // Build query string
    const queryParams = new URLSearchParams({
      userId: userId,
      type: type,
      page: page.toString(),
      limit: limit.toString(),
      search: search,
      programId: programId,
    });

    const endpoint = `${API_ENDPOINTS.PARTICIPANTS_LIST}?${queryParams.toString()}`;
    
    // GET request to fetch mapped participants
    const response = await api.get<any>(endpoint);
    return response.data;
  } catch (error: any) {
    // Error is already handled by axios interceptor
    throw error;
  }
};
