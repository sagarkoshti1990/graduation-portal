import api from '../api';
import { API_ENDPOINTS } from '../apiEndpoints';
import { encodeSearchText } from '../../utils/helper';
import { getParticipantsList } from '../participantService';
import type { ParticipantSearchParams, ParticipantSearchResponse } from '@app-types/participant';
import { OFFERING_FILTER_ALL_OPTIONS as FILTER_ALL, OFFERING_QUERY_PARAM_KEYS as QUERY_PARAM } from '@constants/SUPPORT_PROVIDER_CARDS';
import { MENTORING_ENTITY_TYPES } from '@constants/SP_MENU_OPTIONS';

export const getRequestSessionsList = async (params: any): Promise<any> => {
  try {
    const { page, limit, status, search, provinces, sites, pillar, type, format } = params;
    const queryParams = new URLSearchParams();

    if (status && status !== FILTER_ALL.ALL_STATUSES && status !== FILTER_ALL.ALL_STATUS) {
      queryParams.append(QUERY_PARAM.STATUS, status.toUpperCase());
    }

    if (page != null) {
      queryParams.append(QUERY_PARAM.PAGE, page.toString());
    }

    if (limit != null) {
      queryParams.append(QUERY_PARAM.LIMIT, limit.toString());
    }

    if (search?.trim()) {
      queryParams.append(QUERY_PARAM.SEARCH, search.trim());
    }

    if (provinces && provinces !== FILTER_ALL.ALL_PROVINCES) {
      queryParams.append(QUERY_PARAM.PROVINCES, provinces);
    }

    if (sites && sites !== FILTER_ALL.ALL_SITES) {
      queryParams.append(QUERY_PARAM.SITES, sites);
    }

    if (pillar && pillar !== FILTER_ALL.ALL_PILLARS) {
      queryParams.append(QUERY_PARAM.PILLAR, pillar);
    }

    if (type && type !== FILTER_ALL.ALL_TYPES) {
      queryParams.append(QUERY_PARAM.TYPE, type);
    }

    if (format && format !== FILTER_ALL.ALL_FORMATS) {
      queryParams.append(QUERY_PARAM.DELIVERY_MODE, format);
    }

    if (params.support_offering_type) {
      queryParams.append(MENTORING_ENTITY_TYPES.SUPPORT_OFFERING_TYPE, params.support_offering_type);
    }

    // Comma-separated training types; the backend matches any of them
    if (params.idp_training_task) {
      queryParams.append(QUERY_PARAM.IDP_TRAINING_TASK, params.idp_training_task);
    }

    const endpoint = `${API_ENDPOINTS.USER_SESSIONS_LIST}?${queryParams.toString()}`;
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    console.error('Error fetching user sessions:', error);
    throw error;
  }
};

export const getMyRequestsList = async (params: any): Promise<any> => {
  try {
    const { page, limit, status, search, provinces, sites, pillar, type, format } = params;
    const queryParams = new URLSearchParams();

    if (status && status !== FILTER_ALL.ALL_STATUSES && status !== FILTER_ALL.ALL_STATUS) {
      queryParams.append(QUERY_PARAM.STATUS, status.toUpperCase());
    }

    if (page != null) {
      queryParams.append(QUERY_PARAM.PAGE, page.toString());
    }

    if (limit != null) {
      queryParams.append(QUERY_PARAM.LIMIT, limit.toString());
    }

    if (search?.trim()) {
      queryParams.append(QUERY_PARAM.SEARCH, search.trim());
    }

    if (provinces && provinces !== FILTER_ALL.ALL_PROVINCES) {
      queryParams.append(QUERY_PARAM.PROVINCES, provinces);
    }

    if (sites && sites !== FILTER_ALL.ALL_SITES) {
      queryParams.append(QUERY_PARAM.SITES, sites);
    }

    if (pillar && pillar !== FILTER_ALL.ALL_PILLARS) {
      queryParams.append(QUERY_PARAM.PILLAR, pillar);
    }

    if (type && type !== FILTER_ALL.ALL_TYPES) {
      queryParams.append(QUERY_PARAM.TYPE, type);
    }

    if (format && format !== FILTER_ALL.ALL_FORMATS) {
      queryParams.append(QUERY_PARAM.DELIVERY_MODE, format);
    }

    if (params.support_offering_type) {
      queryParams.append(MENTORING_ENTITY_TYPES.SUPPORT_OFFERING_TYPE, params.support_offering_type);
    }

    const endpoint = `${API_ENDPOINTS.REQUEST_SESSIONS_LIST}?${queryParams.toString()}`;
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    console.error('Error fetching request sessions:', error);
    throw error;
  }
};


export const getParticipants = async (
  params: ParticipantSearchParams
): Promise<ParticipantSearchResponse> => {
  return getParticipantsList(params);
};

/**
 * Remove (unenroll) Mentees/Participants from a Session, freeing their seats
 * Endpoint: POST /mentoring/v1/sessions/removeMentees/:sessionId
 */
export const removeMenteesFromSession = async (
  sessionId: string | number,
  menteeIds: string[]
): Promise<any> => {
  const response = await api.post(API_ENDPOINTS.REMOVE_SESSION_MENTEES(sessionId), { mentees: menteeIds });
  return response.data;
};

/**
 * Assign Mentees/Participants to Session by the Requestor
 * Endpoint: POST /mentoring/v1/sessions/addMentees/:sessionId
 *
 * @param sessionId - Session ID
 * @param menteeIds - Array of mentee/participant IDs
 * @returns A promise resolving to the API response
 */
export const requestorAssignMenteesToSession = async (
  sessionId: string | number,
  menteeIds: string[]
): Promise<any> => {
  try {
    const response = await api.post(
      API_ENDPOINTS.REQUESTOR_ASSIGN_MENTEES(sessionId),
      { mentees: menteeIds }
    );
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

/**
 * Get the list of mentees/participants already enrolled in a session.
 * Used by the Assign Participants flow to exclude already-enrolled users
 * from the eligible participants list.
 * Endpoint: GET /mentoring/v1/sessions/enrolledMentees/:sessionId
 *
 * @param sessionId - Session ID
 * @returns A promise resolving to an array of enrolled user ids (as strings)
 */
export const getEnrolledMenteeIds = async (
  sessionId: string | number
): Promise<string[]> => {
  try {
    const response = await api.get(API_ENDPOINTS.SESSION_ENROLLED_MENTEES(sessionId));
    const list = response?.data?.result || [];
    console.log('[getEnrolledMenteeIds] raw response.data:', response?.data);
    console.log('[getEnrolledMenteeIds] raw list:', list);
    const ids = (Array.isArray(list) ? list : [])
      .map((mentee: any) => mentee?.id ?? mentee?.user_id)
      .filter(Boolean)
      .map((id: any) => String(id));
    console.log('[getEnrolledMenteeIds] extracted ids:', ids);
    return ids;
  } catch (error) {
    console.error('Error fetching enrolled mentees:', error);
    throw error;
  }
};