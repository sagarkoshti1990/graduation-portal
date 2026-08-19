import api from '../api';
import { API_ENDPOINTS } from '../apiEndpoints';
import { encodeSearchText } from '../../utils/helper';
import { getParticipantsList } from '../participantService';
import type { ParticipantSearchParams, ParticipantSearchResponse } from '@app-types/participant';

export const getRequestSessionsList = async (params: any): Promise<any> => {
  try {
    const { page, limit, status, search, provinces, sites, pathway, format } = params;
    const queryParams = new URLSearchParams();

    if (status && status !== 'all-statuses') {
      queryParams.append('status', status.toUpperCase());
    }

    if (page != null) {
      queryParams.append('page', page.toString());
    }

    if (limit != null) {
      queryParams.append('limit', limit.toString());
    }

    if (search?.trim()) {
      queryParams.append('search', encodeSearchText(search.trim()));
    }

    if (provinces && provinces !== 'all-provinces') {
      queryParams.append('provinces', provinces);
    }

    if (sites && sites !== 'all-sites') {
      queryParams.append('sites', sites);
    }

    if (pathway && pathway !== 'all-pathways') {
      queryParams.append('categories', pathway);
    }

    if (format && format !== 'all-formats') {
      queryParams.append('delivery_mode', format);
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