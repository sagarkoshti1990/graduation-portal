import type { ParticipantData, ParticipantSearchParams, ParticipantSearchResponse, Site } from '@app-types/participant';
import { PARTICIPANTS_DATA, PROVINCES, SITES } from '@constants/PARTICIPANTS_LIST';
import api from './api';
import { API_ENDPOINTS } from './apiEndpoints';
import { ROLE_NAMES } from '@constants/ROLES';
import { getUserProfile } from './authenticationService';
import { User } from '@contexts/AuthContext';
/**
 * Get participants list for table view
 * Searches users by user IDs and returns the search response
 *
 * @param params - Search parameters including user_ids array and optional query params
 * @returns A promise resolving to the search response from the API
 */
export const getParticipantsList = async (params: ParticipantSearchParams): Promise<ParticipantSearchResponse> => {
  try {
    const {
      userId,
      type = ROLE_NAMES.USER,
      page = 1,
      limit = 20, 
      search,
      status,
      entityId,
    } = params;


    // Build query string
    const queryParams = new URLSearchParams({
      userId,
      type,
      page: page.toString(),
      limit: limit.toString(),
      search: search || '',
      programId: process.env.GLOBAL_LC_PROGRAM_ID as string,
      ...(entityId ? {entityId}:{})
    });

    // Add status to query params if provided
    if (status) {
      queryParams.append('status', status);
    }


    const endpoint = `${API_ENDPOINTS.PARTICIPANTS_LIST}?${queryParams.toString()}`;
    
    // Validate entity_id before constructing endpoint
    // if (!entity_id?.trim()) {
    //   throw new Error('entity_id is required and cannot be empty');
    // }
    
    // const subEntityListEndpoint = `${API_ENDPOINTS.PARTICIPANTS_SUB_ENTITY_LIST}/${encodeURIComponent(entity_id)}?type=${ROLE_NAMES.PARTICIPANT.toLowerCase()}`;
    // const subEntityListResponse = await api.get<any>(subEntityListEndpoint);
    // const subEntityList = subEntityListResponse.data?.result?.data || [];

    const response = await api.get<ParticipantSearchResponse>(endpoint);
    return response.data;
  } catch (error: any) {
    // Error is already handled by axios interceptor
    throw error;
  }
};

export const getParticipantById = (id: string): any => {
  const participant = PARTICIPANTS_DATA.find(p => p.id === id);
  if (!participant) return undefined;
  return {
    id: participant.id,
    name: participant.name,
    contact: participant.contact,
    status: participant.status,
    progress: participant.progress,
    pathway: participant.pathway || undefined,
    graduationProgress:
      participant.graduationProgress != null &&
      !isNaN(Number(participant.graduationProgress))
        ? participant.graduationProgress
        : undefined,
    graduationDate:
      participant.graduationDate && participant.graduationDate !== ''
        ? participant.graduationDate
        : undefined,
    email: participant.email,
    address: participant.address,
  };
};
/**
 * Get participant profile data by ID
 * Returns full participant data including contact info and address
 * Currently uses mock data, will be replaced with API call later
 */
export const getParticipantProfile = async (id: string): Promise<User |undefined> => {
  try {
    const userProfile = await getUserProfile(id);

    return userProfile;
  } catch (error: any) {
    // Error is already handled by axios interceptor
    throw error;
  }
};

/**
 * Update participant address
 * Currently uses mock data update, will be replaced with API call later
 * 
 * @param id - Participant ID
 * @param address - New address object with street, province, and site
 * @returns Updated participant or undefined if not found
 */

interface UpdateParticipantAddressPayload {
  // userId: string;
  entityId: string;
  programId:string;
  updateData: {
    // province: string;
    // site: string;
    location: string;
  };
}

export const updateParticipantAddress = async (
  payload: UpdateParticipantAddressPayload
): Promise<any> => {
  try {
    const response = await api.post(API_ENDPOINTS.UPDATE_ENTITY, payload);
    return response?.data;
  } catch (error) {
    console.error('updateParticipantAddress error:', error);
    throw error;
  }
};
/**
 * Get province label by value
 * @param value - Province value
 * @returns Province label or the value if not found
 */
export const getProvinceLabel = (value: string): string => {
  const province = PROVINCES.find(p => p.value === value);
  return province?.label || value;
};

/**
 * Get site label by value
 * @param value - Site value
 * @returns Site label or the value if not found
 */
export const getSiteLabel = (value: string): string => {
  const site = SITES.find(s => s.value === value);
  return site?.label || value;
};

/**
 * Get sites by province (for future API integration)
 * For now, returns all sites. In future, this will filter by province
 * @param provinceValue - Province value to filter sites
 * @returns Array of sites for the given province
 */
export const getSitesByProvince = (provinceValue: string): Site[] => {
  // TODO: Replace with API call that filters sites by province
  // For now, return all sites
  return SITES;
};

export const getEntityDetails = async (userId: string): Promise<any> => {
  try {
    const response = await api.get(API_ENDPOINTS.GET_ENTITY_DETAILS(userId));

    return { data: response.data.result };
  } catch (error) {
    throw error;
  }
};

export const updateEntityDetails = async ({
  userId,
  entityId,
  entityUpdates,
}: {
  userId:string;
  entityId: string;
  entityUpdates: any;
}): Promise<any> => {
  try {

    const requestBody = {
      userId,
      programId: process.env.GLOBAL_LC_PROGRAM_ID,
      entityId,
      entityUpdates,
    };

    const response = await api.post(
      API_ENDPOINTS.UPDATE_ENTITY_DETAILS,
      requestBody,
    );

    return { data: response.data.result };
  } catch (error) {
    throw error;
  }
};

export const createOrUpdateProgramUserMapping = async ({
  userId,
  programId,
  metaInformation,
  status
}): Promise<any> => {
  try {

    const requestBody = {
      userId,
      programId,
      metaInformation,
      status
    };

    const response = await api.post(
      API_ENDPOINTS.UPDATE_ENTITY_DETAILS,
      requestBody,
    );

    return { data: response.data.result };
  } catch (error) {
    throw error;
  }
};