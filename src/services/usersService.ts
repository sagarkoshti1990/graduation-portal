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
import { getUserProfile } from './authenticationService';

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
 * Normalizes a string for loose comparison: lowercase, strip spaces/underscores/dashes.
 * Lets e.g. "parenting_skills_training" match the profile's "Parenting Skills Training".
 */
const normalize = (val: any): string =>
  String(val ?? '').toLowerCase().replace(/[\s_-]+/g, '');

/**
 * A mentor's organisation-profile Coverage entry, as actually stored under
 * `user.meta.provinceCoverage` (confirmed against GET /user/v1/user/read/:id).
 * `provinceId`/`siteIds` here are entity **externalId codes** (e.g. "SA-G",
 * "SA-G-RF"), NOT the entity's mongo `_id` - see resolveExternalIds below.
 */
interface MentorCoverageEntry {
  provinceId?: string;
  siteIds?: string[];
}

/**
 * A mentor's organisation-profile Support Categories entry, as stored under
 * `user.meta.supportCategories`. Training areas are grouped by pillar inside
 * `trainingData`; we flatten every pillar's array into one list of labels.
 */
interface MentorSupportCategory {
  trainingData?: Record<string, string[]>;
  linkageData?: Record<string, string[]>;
  assetsData?: Record<string, string[]>;
  othersData?: string;
}

/**
 * The request form's province/site select values are entity mongo `_id`s
 * (see buildTrainingFormOptionsMap), but mentor profiles store coverage using
 * the entity's `externalId` code instead. Resolve the selected province `_id`
 * to its `externalId`, and each selected site `_id` to its `externalId`, so
 * they can be compared against a mentor's `provinceCoverage`.
 */
const resolveExternalIds = async (
  provinceId?: string,
  siteIds?: string[]
): Promise<{ provinceCode?: string; siteCodes: string[] }> => {
  if (!provinceId) return { provinceCode: undefined, siteCodes: [] };

  const provinces = await getProvincesList().catch(() => []);
  const provinceEntity = (provinces || []).find((p: any) => String(p._id) === String(provinceId));
  const provinceCode = provinceEntity?.externalId || provinceEntity?._id || provinceId;

  let siteCodes: string[] = [];
  if (Array.isArray(siteIds) && siteIds.length > 0) {
    const sitesRes = await getSitesByProvince({ provinceId }).catch(() => null);
    const siteEntities = sitesRes?.result?.data || [];
    siteCodes = siteIds.map((sid) => {
      const siteEntity = siteEntities.find((s: any) => String(s._id) === String(sid));
      return siteEntity?.externalId || siteEntity?._id || sid;
    });
  }

  return { provinceCode, siteCodes };
};

/**
 * Get mentors list, filtered by what the mentor's own organisation profile
 * declares they're available for - their Coverage (province + sites) and
 * Support Categories Offered (specific training areas) - not just a province
 * query param.
 *
 * Uses POST /user/v1/account/search?tenant_code=brac&type=mentor&role=mentor to
 * get candidate mentors for the province, then reads each candidate's own
 * profile (GET /user/v1/user/read/:id) to confirm they actually cover every
 * selected site and offer the selected training type before including them.
 *
 * @param filters.provinceId - Province entity _id selected on the request form
 * @param filters.siteIds - Site entity _ids selected on the request form (multi-select)
 * @param filters.category - Training type / specific training area (idp_training_task)
 * @returns Array of mentor user IDs (as strings) eligible for this request
 */
export const getMentorsList = async (
  filters?: string | { provinceId?: string; siteId?: string; siteIds?: string[]; category?: string }
): Promise<Array<string | number>> => {
  // Back-compat: callers used to pass provinceId directly as a string, or a single siteId.
  const parsed =
    typeof filters === 'string' ? { provinceId: filters, siteIds: undefined, category: undefined } : filters || {};
  const provinceId = parsed.provinceId;
  const siteIds = parsed.siteIds ?? (parsed.siteId ? [parsed.siteId] : []);
  const category = parsed.category;

  try {
    if (!provinceId) {
      return [];
    }

    // Selected province/sites are mongo _ids; mentor profiles store externalId
    // codes, so resolve them once up front.
    const { provinceCode, siteCodes } = await resolveExternalIds(provinceId, siteIds);

    const response = await getUsersList({
      type: 'mentor',
      role: 'mentor',
      limit: 100,
    });

    const usersData = response?.result?.data || (Array.isArray(response?.result) ? response.result : []);
    const candidateIds = usersData
      .map((u: any) => u.id ?? u._id ?? u.user_id ?? u.userId)
      .filter((id: any) => id !== undefined && id !== null && id !== '');

    if (candidateIds.length === 0) return [];

    // Confirm eligibility against each candidate's own profile - the search
    // endpoint above doesn't return site/category coverage, only their own
    // profile does.
    const profiles = await Promise.all(
      candidateIds.map((id: any) => getUserProfile(String(id)).catch(() => null))
    );

    const matchingIds = candidateIds.filter((_id: any, index: number) => {
      const profile = profiles[index];

      if (!profile) {
        return false;
      }

      const rawCoverage: MentorCoverageEntry[] =
        profile?.meta?.provinceCoverage ?? profile?.provinceCoverage ?? profile?.extra?.provinceCoverage ?? [];
      const rawCategories: MentorSupportCategory[] =
        profile?.meta?.supportCategories ?? profile?.supportCategories ?? profile?.extra?.supportCategories ?? [];

      const coverage = Array.isArray(rawCoverage) ? rawCoverage : [];
      const categories = Array.isArray(rawCategories) ? rawCategories : [];

      const offeredLabels: string[] = [];
      categories.forEach((cat) => {
        [cat.trainingData, cat.linkageData, cat.assetsData].forEach((group) => {
          if (group && typeof group === 'object') {
            Object.values(group).forEach((arr) => {
              if (Array.isArray(arr)) arr.forEach((v) => offeredLabels.push(String(v)));
            });
          }
        });
        if (cat.othersData) offeredLabels.push(String(cat.othersData));
      });

      const hasCoverage = coverage.length > 0;
      const hasCategories = offeredLabels.length > 0;

      if (!hasCoverage && !hasCategories) {
        return false;
      }

      if (provinceCode) {
        const matchingEntry = coverage.find(
          (entry) => normalize(entry.provinceId) === normalize(provinceCode)
        );
        if (!matchingEntry) {
          return false;
        }

        if (siteCodes.length > 0) {
          const mentorSiteCodes = (matchingEntry.siteIds || []).map(normalize);
          const missing = siteCodes.filter((sc) => !mentorSiteCodes.includes(normalize(sc)));
          if (missing.length > 0) {
            return false;
          }
        }
      }

      if (category) {
        const catNorm = normalize(category);
        const matchesCategory = offeredLabels.some((label) => {
          const labelNorm = normalize(label);
          return labelNorm === catNorm || catNorm.includes(labelNorm) || labelNorm.includes(catNorm);
        });
        if (!matchesCategory) {
          return false;
        }
      }

      return true;
    });

    return matchingIds;
  } catch (error) {
    console.error('Error fetching mentors list:', error);
    return [];
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
    console.error('Error reading entity types from storage:', error);
    return null;
  }
};

/**
 * Shared bootstrap: ensures entity types are fetched exactly once even when
 * multiple helpers (provinces, genders, orgs, positions) call concurrently.
 * Returns the cached entity-type map after populating storage.
 */
let _entityTypesBootstrapPromise: Promise<Record<string, string> | null> | null = null;

export const ensureEntityTypes = async (forceRefresh = false): Promise<Record<string, string> | null> => {
  // Fast path: already in storage (if not forcing refresh)
  if (!forceRefresh) {
    const cached = await getEntityTypesFromStorage();
    if (cached && Object.keys(cached).length > 0) {
      return cached;
    }
  }

  // Deduplicate concurrent fetches
  if (!_entityTypesBootstrapPromise) {
    _entityTypesBootstrapPromise = (async () => {
      try {
        await getEntityTypesList();
        return await getEntityTypesFromStorage();
      } catch (error) {
        console.error('Error bootstrapping entity types:', error);
        return null;
      } finally {
        _entityTypesBootstrapPromise = null;
      }
    })();
  }

  return _entityTypesBootstrapPromise;
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
    const entityTypes = await ensureEntityTypes();
    const provinceEntityTypeId = entityTypes?.['province'];
    if (!provinceEntityTypeId) {
      return [];
    }

    const provincesResponse = await getProvincesByEntityType(provinceEntityTypeId);
    return provincesResponse.result || [];
  } catch (error) {
    console.error('Error fetching provinces:', error);
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
    if (!entityTypes || !entityTypes['site']) {
      await getEntityTypesList();
      entityTypes = await getEntityTypesFromStorage();
    }

    // Get site entity type ID
    const siteEntityTypeId = entityTypes?.['site'];
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
    console.error('Error fetching all sites:', error);
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
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    return staticResponse;
  } catch (error: any) {
    console.error('Reset password error:', {
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

/**
 * Update user (Org Admin)
 *
 * API: POST /api/user/v1/org-admin/updateUser/:id
 * Body: { "name": "New Name", ... }
 */
export const updateOrgAdminUser = async (
  userId: string | number,
  payload: any
): Promise<any> => {
  try {
    const idStr = String(userId);
    const endpoint = `${API_ENDPOINTS.ORG_ADMIN_UPDATE_USER}/${idStr}`;
    const response = await api.post(endpoint, payload);
    return response.data?.result ?? response.data;
  } catch (error: any) {
    throw error;
  }
};

/**
 * Create a new user (Admin/Org Admin)
 *
 * API: POST /api/user/v1/admin/createUser
 */
export const createUser = async (
  payload: {
    name: string;
    username: string;
    email: string;
    roles: string;
    password: string;
    dob?: string;
    national_id?: number;
    gender?: string;
    site?: string;
    province?: string;
    phone?: string;
    phone_code?: string;
    alternative_phone?: string;
    alternative_phone_code?: string;
    address?: string;
    organisation?: string;
    position?: string;
    employee_id?: string;
  }
): Promise<any> => {
  try {
    const response = await api.post(API_ENDPOINTS.CREATE_USER, payload);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

/**
 * Get gender list - Fetches genders using entity type API
 * 
 * @returns A promise resolving to an array of entities, or empty array on error
 */
export const getGenderList = async (): Promise<ProvinceEntity[]> => {
  try {
    const entityTypes = await ensureEntityTypes();
    const entityTypeId = entityTypes?.['gender'];

    if (!entityTypeId) {
      return [];
    }

    const response = await getProvincesByEntityType(entityTypeId);
    return response.result || [];
  } catch (error) {
    console.error('Error fetching gender list:', error);
    return [];
  }
};

/**
 * Get organisation list - Fetches organisations using the same entity type API as provinces
 * Uses entity type key 'organisation' with the same getProvincesByEntityType endpoint
 * 
 * @returns A promise resolving to an array of entities, or empty array on error
 */
export const getOrganisationList = async (): Promise<ProvinceEntity[]> => {
  try {
    const entityTypes = await ensureEntityTypes();
    const orgKey = Object.keys(entityTypes || {}).find(k => k.toLowerCase().includes('org'));
    const entityTypeId = orgKey ? entityTypes?.[orgKey] : undefined;

    if (!entityTypeId) {
      return [];
    }

    const response = await getProvincesByEntityType(entityTypeId);
    return response.result || [];
  } catch (error) {
    console.error('Error fetching organisation list:', error);
    return [];
  }
};

/**
 * Get position list - Fetches positions using the same entity type API as provinces
 * Uses entity type key 'position' with the same getProvincesByEntityType endpoint
 * 
 * @returns A promise resolving to an array of entities, or empty array on error
 */
export const getPositionList = async (): Promise<ProvinceEntity[]> => {
  try {
    const entityTypes = await ensureEntityTypes();
    const entityTypeId = entityTypes?.['position'];

    if (!entityTypeId) {
      return [];
    }

    const response = await getProvincesByEntityType(entityTypeId);
    return response.result || [];
  } catch (error) {
    console.error('Error fetching position list:', error);
    return [];
  }
};

/**
 * Get country codes list - Fetches country codes from entity management service
 * 
 * @returns A promise resolving to an array of entities, or empty array on error
 */
export const getCountryCodesList = async (): Promise<ProvinceEntity[]> => {
  try {
    let entityTypes = await ensureEntityTypes();
    // Find the country code entity type key
    let countryKey = Object.keys(entityTypes || {}).find(
      k => k.toLowerCase() === 'country_code'
    );

    // If key not found, force a refresh from the server to bypass stale localStorage cache
    if (!countryKey) {
      entityTypes = await ensureEntityTypes(true);
      countryKey = Object.keys(entityTypes || {}).find(
        k => k.toLowerCase() === 'country_code'
      );
    }

    const entityTypeId = countryKey ? entityTypes?.[countryKey] : undefined;

    if (!entityTypeId) {
      return [];
    }

    const response = await getProvincesByEntityType(entityTypeId);
    return response.result || [];
  } catch (error) {
    console.error('Error fetching country codes list:', error);
    return [];
  }
};

/**
 * Update user profile
 *
 * API: PATCH /api/user/v1/user/update
 * Body: { "name": "New Name", ... }
 */
export const updateUser = async (
  _userId: string | number,
  payload: any
): Promise<any> => {
  try {
    const response = await api.patch(API_ENDPOINTS.UPDATE_USER, payload);
    return response.data?.result ?? response.data;
  } catch (error: any) {
    throw error;
  }
};