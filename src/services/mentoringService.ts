import api from './api';
import { API_ENDPOINTS } from './apiEndpoints';
import { MENTORING_ENTITY_TYPES } from '@constants/SP_MENU_OPTIONS';

export interface MentoringOption {
  value: string;
  label: string;
}

/**
 * Get mentoring entities by type name
 * (e.g. 'provider_type', 'support_categories', 'training_areas', 'asset_types')
 *
 * Uses POST /mentoring/v1/entity-type/read with { value: <type_name> } in body.
 * The response includes the entity type record along with its nested entities list —
 * so a single call returns everything we need, no second request required.
 *
 * @param params - Params object containing the entity type name to fetch
 * @returns A promise resolving to the formatted list of mentoring options
 */
export const getMentoringEntities = async (
  params: { value: string }
): Promise<MentoringOption[]> => {
  const value = params?.value || '';
  try {
    const response = await api.post(API_ENDPOINTS.MENTORING_READ_ENTITY_TYPE, {
      value: [value],
    });

    const result = response?.data?.result;
    const entityTypeRecord = Array.isArray(result?.entity_types)
      ? result.entity_types[0]
      : result;

    const entitiesList: any[] = entityTypeRecord?.entities ?? [];

    return entitiesList;
  } catch (error: any) {
    console.error(`Error fetching mentoring entities for '${value}':`, error);
    return [];
  }
};

/**
 * Get session categories (pillars) list
 */
export const getSessionCategories = async (): Promise<MentoringOption[]> => {
  return getMentoringEntities({ value: MENTORING_ENTITY_TYPES.SESSION_CATEGORIES });
};

/**
 * Get recommended target audience list
 */
export const getRecommendedFor = async (): Promise<MentoringOption[]> => {
  return getMentoringEntities({ value: MENTORING_ENTITY_TYPES.RECOMMENDED_FOR });
};

/**
 * Get session types by pillar code
 */
export const getSessionTypesByPillar = async (pillarCode: string): Promise<MentoringOption[]> => {
  if (!pillarCode) return [];
  return getMentoringEntities({ value: pillarCode });
};

/**
 * Get delivery mode options (e.g. Online / Offline / Hybrid) list
 */
export const getDeliveryModes = async (): Promise<MentoringOption[]> => {
  return getMentoringEntities({ value: MENTORING_ENTITY_TYPES.DELIVERY_MODE });
};

/**
 * Get certificate provided options list
 */
export const getCertificateProvided = async (): Promise<MentoringOption[]> => {
  return getMentoringEntities({ value: MENTORING_ENTITY_TYPES.CERTIFICATE_PROVIDED });
};

/**
 * Create/Update Mentoring Session
 * Endpoint: POST /mentoring/v1/sessions/update
 *
 * @param payload - Session payload or raw form values to create/update
 * @returns A promise resolving to the API response
 */
export const createSession = async (payload: any): Promise<any> => {
  try {
    const response = await api.post(API_ENDPOINTS.MENTORING_CREATE_SESSION, payload);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

/**
 * Create Mentoring Request Session
 * Endpoint: POST /mentoring/v1/requestSessions/create
 *
 * @param payload - Request session payload
 * @returns A promise resolving to the API response
 */
export const requestSession = async (payload: any): Promise<any> => {
  try {
    const response = await api.post(API_ENDPOINTS.REQUEST_SESSION_CREATE, payload);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

/**
 * Get Mentoring Session details by ID
 * Endpoint: GET /mentoring/v1/sessions/details/:sessionId?get_mentees=true
 */
export const getSessionDetails = async (sessionId: string | number): Promise<any> => {
  try {
    const response = await api.get(API_ENDPOINTS.MENTORING_DETAILS_SESSION(sessionId));
    return response.data;
  } catch (error: any) {
    return { error: error.response.data };
  }
};

/**
 * Get Additional Service categories list
 */
export const getAdditionalServiceCategories = async (): Promise<MentoringOption[]> => {
  return getMentoringEntities({ value: MENTORING_ENTITY_TYPES.ADDITIONAL_SERVICE_CATEGORIES });
};