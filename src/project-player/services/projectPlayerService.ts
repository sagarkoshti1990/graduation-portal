import axios from 'axios';
import { PROJECT_PLAYER_CONFIGS } from '../../constants/PROJECTDATA';
import { ApiResponse, NormalizedFile } from '../types/components.types';
import { API_ENDPOINTS } from './apiEndpoints';
import { isWeb } from '@utils/platform';
import { createProjectPlanPayload, PathwayReplacementPayload } from '../types';
import { PROJECT_STATUS } from '@constants/app.constant';
import { isNetworkOffline } from '@utils/networkStatus';
import offlineStorage, { getOfflineParticipantIds } from '../../services/offlineStorage';
import { PARTICIPANT_KEYS } from '../../constants/STORAGE_KEYS';

export const apiClient = axios.create({
  // Use baseUrl from PROJECT_PLAYER_CONFIGS (which gets from env, with fallback)
  baseURL: PROJECT_PLAYER_CONFIGS.baseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async config => {
  // Get token from PROJECT_PLAYER_CONFIGS.accessToken (which fetches from AsyncStorage)
  try {
    const token = await PROJECT_PLAYER_CONFIGS.accessToken();
    if (token) {
      config.headers['X-auth-token'] = token;
    }
  } catch (error) {
    console.error(
      'Error getting token from AsyncStorage in interceptor:',
      error,
    );
    // No token will be added if AsyncStorage fails
  }

  return config;
});

apiClient.interceptors.response.use(
  res => res,
  error => {
    if (error.response?.status === 401 && !isNetworkOffline()) {
      const redirectUrl =
        PROJECT_PLAYER_CONFIGS.redirectionLinks.unauthorizedRedirectUrl;

      if (isWeb) {
        window.location.href = redirectUrl;
      }
    }
    return Promise.reject(error);
  },
);

export const handleApiError = (error: unknown): ApiResponse<null> => {
  if (axios.isAxiosError(error)) {
    return {
      data: null,
      error: error.response
        ? `HTTP ${error.response.status}: ${error.response.statusText}`
        : error.message,
    };
  }

  return {
    data: null,
    error: error instanceof Error ? error.message : 'Unknown error occurred',
  };
};

export const getProjectTemplatesList = async (): Promise<ApiResponse<any>> => {
  if (isNetworkOffline()) return { data: null, error: 'offline' };
  try {
    const response = await apiClient.get(API_ENDPOINTS.PROJECT_TEMPLATES_LIST);

    return { data: response.data.result };
  } catch (error) {
    return handleApiError(error);
  }
};

export const createProjectForEntity = async (
  entityId: string,
  province:string
): Promise<ApiResponse<any>> => {
  if (isNetworkOffline()) return { data: null, error: 'offline' };
  try {
    const response = await apiClient.post(API_ENDPOINTS.CREATE_PROJECT, {
      entityId,
      province,
      participant:entityId
    });

    return  response.data.result ;
  } catch (error) {
    return handleApiError(error);
  }
};

export const getProjectDetails = async (
  projectID: string,
  userId?: string,
): Promise<ApiResponse<any>> => {
  if (isNetworkOffline()) {
    // Project cache is keyed by userId + participantId; scan all downloaded participants.
    const ids = await getOfflineParticipantIds(userId ?? '').catch(() => [] as string[]);
    for (const participantId of ids) {
      const project = await offlineStorage
        .read<any>(PARTICIPANT_KEYS.project(userId ?? '', participantId, projectID))
        .catch(() => null);
      if (project && (project._id === projectID || project.id === projectID)) {
        return { data: project };
      }
    }
    return { data: null, error: 'offline' };
  }

  try {
    const response = await apiClient.post(
      API_ENDPOINTS.PROJECT_DETAILS(projectID),
    );

    return { data: response.data.result };
  } catch (error) {
    return handleApiError(error);
  }
};

export const updateTask = async (
  projectId: string,
  requestBody: any,
): Promise<ApiResponse<any>> => {
  if (isNetworkOffline()) return { data: null, error: 'offline' };
  try {
    const response = await apiClient.post(
      API_ENDPOINTS.UPDATE_TASK(projectId),
      requestBody,
    );

    return response.data.result;
  } catch (error) {
    return handleApiError(error);
  }
};


export const updateProjectInfo = async (projectId: string, programUsersRef: string): Promise<any> => {
  if (isNetworkOffline()) throw new Error('offline');
  try {
    const response = await apiClient.post(API_ENDPOINTS.UPDATE_PROJECT_INFO(projectId), {
      programUserMappingReference: programUsersRef
    });
    return response.data.result;
  } catch (error: any) {
    throw error;
  }
};

export const completeProject = async (projectId: string): Promise<any> => {
  if (isNetworkOffline()) throw new Error('offline');
  try {
    const response = await apiClient.post(
      API_ENDPOINTS.UPDATE_PROJECT_INFO(projectId),
      {
        status: PROJECT_STATUS.COMPLETED,
      },
    );

    return response.data.result;
  } catch (error) {
    const apiError = handleApiError(error);
    throw new Error(apiError.error ?? 'Failed to complete project');
  }
};
export const getCategoryList = async (
  parentId: string,
): Promise<ApiResponse<any>> => {
  if (isNetworkOffline()) return { data: null, error: 'offline' };
  try {
    const response = await apiClient.get(
      API_ENDPOINTS.GET_CATEGORY_LIST(parentId),
    );
    return { data: response.data.result };
  } catch (error) {
    return handleApiError(error);
  }
};

export const getTemplateDetails = async (
  categoryId: string,
): Promise<ApiResponse<any>> => {
  if (isNetworkOffline()) return { data: null, error: 'offline' };
  try {
    const response = await apiClient.get(
      API_ENDPOINTS.GET_TEMPLATE(categoryId),
    );
    // const resData = templateDetailsAPIMockResponse;
    return { data: response.data.result };
  } catch (error) {
    return handleApiError(error);
  }
};
export const getTaskDetails = async (
  categoryIds: string,
): Promise<ApiResponse<any>> => {
  if (isNetworkOffline()) return { data: null, error: 'offline' };
  try {
    const response = await apiClient.get(
      API_ENDPOINTS.GET_TASK_DETAILS(categoryIds),
    );
    // const response = taskDetailsAPIMockResponse;
    return { data: response.data.result };
  } catch (error) {
    return handleApiError(error);
  }
};

export const submitInterventionPlan = async (
  reqBody : createProjectPlanPayload
): Promise<ApiResponse<any>> => {
  if (isNetworkOffline()) return { data: null, error: 'offline' };
  try {
    const response = await apiClient.post(
      API_ENDPOINTS.SUBMIT_INTERVENTION_PLAN, reqBody,
    );

    return { data: response.data.result || response.data };
  } catch (error) {
    return handleApiError(error);
  }
};


export const updateInterventionPlan = async (
  projectId: string,
  reqBody : PathwayReplacementPayload
): Promise<ApiResponse<any>> => {
  if (isNetworkOffline()) return { data: null, error: 'offline' };
  try {
    const response = await apiClient.post(
      API_ENDPOINTS.UPDATE_INTERVENTION_PLAN(projectId), reqBody,
    );

    return { data: response.data.result || response.data };
  } catch (error) {
    return handleApiError(error);
  }
};

export const getSolutionDetails = async (
  solutionId: string,
  taskId: string,
  payload: any = {}
): Promise<ApiResponse<any>> => {
  if (isNetworkOffline()) return { data: null, error: 'offline' };
  try {
    const response = await apiClient.post(
      API_ENDPOINTS.GET_SOLUTION_DETAILS(solutionId, taskId),
      payload || {}
    );
    return { data: response.data.result?.solutionDetails };
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Generates pre-signed URLs for file uploads via Cloud Services.
 * 
 * @param payload - Object representing files to get pre-signed URLs for, e.g.,
 *   {
 *     [entityId]: {
 *       files: [ 'filename.jpg', ... ]
 *     }
 *   }
 * @returns ApiResponse<any> - Resolves with presigned URLs or error response.
 */
export const preSignedUrls = async (
  payload: Record<string, { files: string[] }>
): Promise<ApiResponse<any>> => {
  if (isNetworkOffline()) return { data: null, error: 'offline' };
  try {
    const response = await apiClient.post(
      API_ENDPOINTS.PRE_SIGNED_URLS,
      { request: payload }
    );
    return { data: response.data.result || response.data };
  } catch (error) {
    return handleApiError(error);
  }
};


export const uploadFiles = async (
  id: string,
  files: File[]
): Promise<ApiResponse<any>> => {
  if (isNetworkOffline()) return { data: null, error: 'offline' };
  try {
    const response = await preSignedUrls({
      [id]: {
        files: files.map(file => file.name)
      }
    });
    if (response?.data?.[id]) {
      const responceData = await Promise.all(files.map(async (file) => {
        const presignedUrl = response.data[id].files.find((f: { file: string; url?: string; payload?: { sourcePath?: string } }) => f.file === file.name);
        if (presignedUrl?.url) {
         await fetch(presignedUrl.url, { 
          method: 'PUT',
          body: file.file ?? file.originalFile as File,
        });
      }
        return {
          name: file.name,
          sourcePath: presignedUrl?.payload?.sourcePath,
          type: file?.type,
          url: presignedUrl?.url ? presignedUrl.url.split('?')[0] : undefined,
          size:file?.size,
        };
      }));
      return { data: responceData };
    }
    return { data: [] };
  } catch (error) {
    return handleApiError(error);
  }
};