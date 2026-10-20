import api from './api';
import { API_ENDPOINTS } from './apiEndpoints';

export interface MenteeSessionsParams {
  support_offering_type?: string;
  [key: string]: any;
}

/**
 * Get mentee sessions for logged-in participant
 * @param params Optional query parameters including support_offering_type
 */
export const getMenteeSessions = async (params?: MenteeSessionsParams): Promise<any> => {
  try {
    const response = await api.get(API_ENDPOINTS.SESSION_MENTEES_SESSIONS, { params });
    return response?.data;
  } catch (error) {
    console.error('Error fetching mentee sessions:', error);
    throw error;
  }
};

/**
 * Get session details by sessionId
 * @param sessionId Session ID
 */
export const getSessionDetails = async (sessionId: string): Promise<any> => {
  try {
    const response = await api.get(API_ENDPOINTS.SESSION_DETAILS(sessionId));
    return response?.data;
  } catch (error) {
    console.error('Error fetching session details:', error);
    throw error;
  }
};
