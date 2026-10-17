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
 * Saving a draft skips the backend required/business validations (enforced again on publish).
 */
const draftParams = (payload: any) => (payload?.status === 'DRAFT' ? { SkipValidation: true } : undefined);

/**
 * Create/Update Mentoring Session
 * Endpoint: POST /mentoring/v1/sessions/update
 *
 * @param payload - Session payload or raw form values to create/update
 * @returns A promise resolving to the API response
 */
export const createSession = async (payload: any): Promise<any> => {
  try {
    const response = await api.post(API_ENDPOINTS.MENTORING_CREATE_SESSION, payload, {
      params: draftParams(payload),
    });
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

/**
 * Update an existing Mentoring Session
 * Endpoint: POST /mentoring/v1/sessions/update/:sessionId
 */
export const updateSession = async (sessionId: string | number, payload: any): Promise<any> => {
  try {
    const response = await api.post(API_ENDPOINTS.MENTORING_UPDATE_SESSION(sessionId), payload, {
      params: draftParams(payload),
    });
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

/**
 * Delete a resource attached to a session
 * Endpoint: GET /mentoring/v1/resources/delete/:resourceId?sessionId=:sessionId
 * (the interface-service gateway registers this route as GET, not DELETE)
 */
export const deleteSessionResource = async (
  resourceId: string | number,
  sessionId: string | number
): Promise<any> => {
  const response = await api.get(API_ENDPOINTS.RESOURCE_DELETE(resourceId, sessionId));
  return response.data;
};

/**
 * Updates a session and syncs its resources. The update API inserts every resource it
 * receives as a new row and never removes any, so only newly uploaded resources (no `id`)
 * are sent with the update, and resources removed in the form are deleted separately.
 */
export const updateSessionWithResources = async (
  sessionId: string | number,
  payload: any,
  originalResources: any[] = []
): Promise<any> => {
  const current: any[] = Array.isArray(payload?.resources) ? payload.resources : [];
  const currentIds = new Set(current.filter((r) => r?.id).map((r) => String(r.id)));
  const newResources = current.filter((r) => r && !r.id);
  const removedResources = originalResources.filter((r) => r?.id && !currentIds.has(String(r.id)));

  const { resources, ...rest } = payload || {};
  const result = await updateSession(sessionId, newResources.length > 0 ? { ...rest, resources: newResources } : rest);

  await Promise.all(removedResources.map((r) => deleteSessionResource(r.id, sessionId)));
  return result;
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
 * Get the list of mentees actually enrolled in a session (real attendees, not
 * the session's static description) — used to populate the Confirm Attendance
 * participant list with real users instead of placeholder data.
 * Endpoint: GET /mentoring/v1/sessions/enrolledMentees/:sessionId
 */
export const getEnrolledMentees = async (sessionId: string | number): Promise<any[]> => {
  try {
    const response = await api.get(API_ENDPOINTS.SESSION_ENROLLED_MENTEES(sessionId));
    return response.data?.result || [];
  } catch (error: any) {
    return [];
  }
};

/**
 * Delete a Mentoring Session by ID
 * Endpoint: DELETE /mentoring/v1/sessions/update/:sessionId
 */
export const deleteSession = async (sessionId: string | number): Promise<any> => {
  try {
    const response = await api.delete(API_ENDPOINTS.MENTORING_UPDATE_SESSION(sessionId));
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

/**
 * Cancel a published Support Offering (Training/Additional Service/Asset).
 * Endpoint: POST /mentoring/v1/mentors/cancel/:sessionId
 * Body: { reason } - reason for cancellation (required).
 */
export const cancelSession = async (sessionId: string | number, reason: string): Promise<any> => {
  try {
    const response = await api.post(API_ENDPOINTS.MENTORING_CANCEL_SESSION(sessionId), { reason });
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

/**
 * Get Additional Service categories list
 */
export const getAdditionalServiceCategories = async (): Promise<MentoringOption[]> => {
  return getMentoringEntities({ value: MENTORING_ENTITY_TYPES.ADDITIONAL_SERVICE_CATEGORIES });
};

/**
 * Get Support Categories list
 */
export const getSupportCategories = async (): Promise<MentoringOption[]> => {
  return getMentoringEntities({ value: MENTORING_ENTITY_TYPES.SUPPORT_OFFERING_TYPE });
};

/**
 * Get Social Empowerment options
 */
export const getSocialEmpowermentOptions = async (): Promise<MentoringOption[]> => {
  return getMentoringEntities({ value: MENTORING_ENTITY_TYPES.SOCIAL_EMPOWERMENT });
};

/**
 * Get Financial Inclusion options
 */
export const getFinancialInclusionOptions = async (): Promise<MentoringOption[]> => {
  return getMentoringEntities({ value: MENTORING_ENTITY_TYPES.FINANCIAL_INCLUSION });
};

/**
 * Get Livelihoods options
 */
export const getLivelihoodsOptions = async (): Promise<MentoringOption[]> => {
  return getMentoringEntities({ value: MENTORING_ENTITY_TYPES.LIVELIHOODS });
};

/**
 * Get Asset livelihood categories (Agriculture, Mining, ...) - separate from the Livelihoods training types
 */
export const getLivelihoodCategoriesOptions = async (): Promise<MentoringOption[]> => {
  return getMentoringEntities({ value: MENTORING_ENTITY_TYPES.LIVELIHOOD_CATEGORIES });
};

/**
 * Get Special Attention tags options
 */
export const getSpecialAttentionOptions = async (): Promise<MentoringOption[]> => {
  return getMentoringEntities({ value: MENTORING_ENTITY_TYPES.SPECIAL_ATTENTION });
};

/**
 * Get Immediate Attention tags options
 */
export const getImmediateAttentionOptions = async (): Promise<MentoringOption[]> => {
  return getMentoringEntities({ value: MENTORING_ENTITY_TYPES.IMMEDIATE_ATTENTION });
};

/**
 * Get Asset Types options
 */
export const getAssetTypesOptions = async (): Promise<MentoringOption[]> => {
  return getMentoringEntities({ value: MENTORING_ENTITY_TYPES.ASSET_TYPES });
};

/**
 * Get Provider Type options
 */
export const getProviderTypeOptions = async (): Promise<MentoringOption[]> => {
  return getMentoringEntities({ value: MENTORING_ENTITY_TYPES.PROVIDER_TYPE });
};

/**
 * Read Mentoring Profile for current logged-in user
 * Endpoint: GET /mentoring/v1/profile/read
 */
export const getMentoringProfile = async (): Promise<any> => {
  try {
    const response = await api.get(API_ENDPOINTS.MENTORING_PROFILE_READ);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching mentoring profile:', error);
    throw error;
  }
};

/**
 * Create Mentoring Profile
 * Endpoint: POST /mentoring/v1/profile/create
 */
export const createMentoringProfile = async (payload: any): Promise<any> => {
  try {
    const response = await api.post(API_ENDPOINTS.MENTORING_PROFILE_CREATE, payload);
    return response.data;
  } catch (error: any) {
    console.error('Error creating mentoring profile:', error);
    throw error;
  }
};

/**
 * Update Mentoring Profile
 * Endpoint: POST /mentoring/v1/profile/update
 */
export const updateMentoringProfile = async (payload: any): Promise<any> => {
  try {
    const response = await api.post(API_ENDPOINTS.MENTORING_PROFILE_UPDATE, payload);
    return response.data;
  } catch (error: any) {
    console.error('Error updating mentoring profile:', error);
    throw error;
  }
};

/**
 * Get uploaded resources list (e.g. materials library files)
 * Endpoint: GET /mentoring/v1/resources/list
 */
export const getResourcesList = async (): Promise<any> => {
  try {
    const response = await api.get(API_ENDPOINTS.RESOURCES_LIST);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching resources list:', error);
    throw error;
  }
};