import api from './api';
import { API_ENDPOINTS } from './apiEndpoints';
import logger from '@utils/logger';
import { AssessmentSurveyCardData } from '@app-types/participant';

/**
 * Solution Service
 * Handles API calls for targeted solutions
 */

/**
 * Interface for targeted solutions API request parameters
 */
export interface TargetedSolutionsParams {
  type: string;
  page?: number;
  limit?: number;
  search?: string;
}

/**
 * Interface for targeted solutions API response
 */
export interface TargetedSolutionsResponse {
  result?: {
    data?: AssessmentSurveyCardData[];
    [key: string]: any;
  };
  data?: AssessmentSurveyCardData[];
  [key: string]: any;
}

/**
 * Get targeted solutions from API
 *
 * @param params - Query parameters for the API call
 * @returns Promise resolving to array of AssessmentSurveyCardData
 */
export const getTargetedSolutions = async (
  params: TargetedSolutionsParams,
): Promise<AssessmentSurveyCardData[]> => {
  try {
    const { type, page, limit, search = '', ...rest } = params;

    // Build query string - ensure all values are strings and filter undefined
    const queryParamsObject: Record<string, string> = {
      type: String(type),
    };
    
    if (page !== undefined) {
      queryParamsObject.page = String(page);
    }
    
    if (limit !== undefined) {
      queryParamsObject.limit = String(limit);
    }
    
    if (search !== undefined && search !== '') {
      queryParamsObject.search = String(search);
    }
    
    // Convert all rest values to strings and filter undefined
    Object.entries(rest).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParamsObject[key] = String(value);
      }
    });
    
    const queryParams = new URLSearchParams(queryParamsObject);

    // Make API call with internal-access-token header
    const response = await api.post<TargetedSolutionsResponse>(
      `${API_ENDPOINTS.TARGETED_SOLUTIONS}?${queryParams.toString()}`,
      {
        participant: 'ALL',
        linkageChampion: 'ALL',
        supervisor: 'ALL',
      }
    );

    // Extract data from response (handle different response structures)
    const responseData = response.data;
    const solutions = responseData?.result?.data || responseData?.data || [];

    // Map API response to AssessmentSurveyCardData format
    const mappedSolutions: AssessmentSurveyCardData[] = solutions.map(item => ({
      ...item,
      navigationUrl: item.navigationUrl || 'observation',
      status: item.status,
    }));

    logger.info('Targeted solutions fetched successfully', {
      count: mappedSolutions.length,
    });

    return mappedSolutions;
  } catch (error: any) {
    logger.error('Error fetching targeted solutions:', error);
    throw error;
  }
};

/**
 * Fetch entities for a given observation solution
 *
 * @param {Object} params
 * @param {string} params.solutionId - The observation solution ID
 * @param {Object} params.profileData - Profile data for the observation context
 * @returns {Promise<any>} - List of entities (API response)
 */
export const getObservationEntities = async ({
  solutionId,
  profileData,
}: {
  solutionId: string;
  profileData: {
    state?: string;
    district?: string;
    block?: string;
    cluster?: string;
    school?: string;
    professional_role?: string;
    professional_subroles?: string;
    organizations?: string;
    [key: string]: any;
  };
}): Promise<any> => {
  try {
    // POST body
    const data = { ...profileData };

    const response = await api.post(
      `${API_ENDPOINTS.OBSERVATION_ENTITIES}?solutionId=${solutionId}`,
      data,
    );

    return response.data;
  } catch (error) {
    logger.error('Error fetching observation entities:', error);
    throw error;
  }
};

/**
 * Update observation entities for a given observation
 *
 * @param {Object} params
 * @param {string} params.observationId - The observation ID to update
 * @param {string[]} params.data - Array of observation entity IDs to update
 * @returns {Promise<any>} - Updated entities response
 */
export const updateObservationEntities = async ({
  observationId,
  data,
}: {
  observationId: string;
  data: string[];
}): Promise<any> => {
  try {
    const response = await api.post(
      `${API_ENDPOINTS.UPDATE_OBSERVATION_ENTITIES}/${observationId}`,
      { data },
    );

    logger.info('Observation entities updated successfully', {
      observationId,
      dataCount: data.length,
    });

    return response.data;
  } catch (error) {
    logger.error('Error updating observation entities:', error);
    throw error;
  }
};

/**
 * Interface for search observation entities request parameters
 */
export interface SearchObservationEntitiesParams {
  state?: string;
  district?: string;
  block?: string;
  cluster?: string;
  school?: string;
  professional_role?: string;
  professional_subroles?: string;
  organizations?: string | string[] | object;
  [key: string]: any;
}

/**
 * Search observation entities for a given observation
 *
 * @param {Object} params
 * @param {string} params.observationId - The observation ID
 * @param {SearchObservationEntitiesParams} params.filters - Filter parameters for the search
 * @returns {Promise<any>} - Search results response
 */
export const searchObservationEntities = async ({
  observationId,
  search = '',
  filters = {},
}: {
  observationId: string;
  search?: string;
  filters?: SearchObservationEntitiesParams;
}): Promise<any> => {
  try {
    // Prepare the request body
    const requestBody: SearchObservationEntitiesParams = { ...filters };

    // Handle organizations field - ensure it's properly serialized
    if (
      requestBody.organizations &&
      typeof requestBody.organizations === 'object' &&
      !Array.isArray(requestBody.organizations)
    ) {
      // If it's an object, convert to JSON string or handle appropriately
      requestBody.organizations = JSON.stringify(requestBody.organizations);
    }

    const response = await api.post(
      `${API_ENDPOINTS.SEARCH_OBSERVATION_ENTITIES}?observationId=${observationId}&search=${search}`,
      requestBody,
    );

    logger.info('Observation entities searched successfully', {
      observationId,
      filtersCount: Object.keys(filters).length,
    });

    return response.data;
  } catch (error) {
    logger.error('Error searching observation entities:', error);
    throw error;
  }
};


export const getObservationSolution = async ({
  observationId,
  entityId,
  submissionNumber,
  evidenceCode,
}: {
  observationId: string;
  entityId: string;
  submissionNumber: number;
  evidenceCode: string;
}): Promise<any> => {
  try {
    const response = await api.post(`${API_ENDPOINTS.OBSERVATION_SOLUTION}/${observationId}?entityId=${entityId}&submissionNumber=${submissionNumber}&evidenceCode=${evidenceCode}`);
    return response.data;
  } catch (error) {
    logger.error('Error fetching observation solution:', error);
    throw error;
  }
}


export const getObservationSubmissions = async ({
  observationId,
  entityId,
  filterAnswerValue,
}: {
  observationId: string;
  entityId: string;
  filterAnswerValue?: any;
}): Promise<any> => {
  try {
    const response = await api.post (`${API_ENDPOINTS.OBSERVATION_SUBMISSIONS}/${observationId}?entityId=${entityId}` + (filterAnswerValue ? `&filterAnswerValue=${filterAnswerValue}` : ''));
    return response.data;
  } catch (error) {
    logger.error('Error fetching observation:', error);
    throw error;
  }
}


/**
 * Create a new observation submission for a given observation and entity.
 *
 * @param params - Object containing observationId and entityId
 * @param token - Optional auth token for the request (used for passing "X-auth-token" header if needed)
 * @returns Promise resolving to API response data for the created submission
 */
export const createObservationSubmission = async (
  {
    observationId,
    entityId,
    data = {}
  }: {
    observationId: string;
    entityId: string;
    data?: any;
  }
): Promise<any> => {
  try {
    const response = await api.post(
      `${API_ENDPOINTS.CREATE_OBSERVATION_SUBMISSION}/${observationId}?entityId=${entityId}`,
      data
    );
    return response.data;
  } catch (error) {
    logger.error('Error creating observation submission:', error);
    throw error;
  }
};
