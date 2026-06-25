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


/**
 * Upload a file to a presigned S3 PUT URL via XMLHttpRequest.
 *
 * Why XHR instead of fetch + Blob on React Native:
 * - Sending `{ uri, type, name }` as the body routes through the native networking
 *   layer so the OS reads the file directly — no JS heap pressure.
 * - Works with both file:// (iOS/Android) and content:// (Android document-picker) URIs.
 * - Preserves Content-Type so S3 presigned-URL signature validation passes.
 */
function uploadViaXHR(uri: string, url: string, contentType: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    // S3 presigned URLs are signed against a specific Content-Type.
    // A missing or mismatched Content-Type causes SignatureDoesNotMatch errors.
    xhr.setRequestHeader('Content-Type', contentType || 'application/octet-stream');
    xhr.timeout = 120_000;

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`S3 upload failed — HTTP ${xhr.status}: ${xhr.responseText?.slice(0, 200)}`));
      }
    };
    xhr.onerror = () => reject(new Error('S3 upload network error'));
    xhr.ontimeout = () => reject(new Error('S3 upload timed out'));

    // React Native XHR accepts { uri, type, name } as the body.
    // The native layer resolves file:// and content:// URIs and streams
    // the bytes directly — the file never loads into the JS heap.
    (xhr as any).send({ uri, type: contentType, name: 'upload' });
  });
}

export const uploadFiles = async (
  id: string,
  files: NormalizedFile[]
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
          if (isWeb) {
            // Web: File object carries MIME type; browser sets Content-Type automatically.
            await fetch(presignedUrl.url, {
              method: 'PUT',
              body: (file.file ?? file.originalFile) as File,
            });
          } else if (file.uri) {
            // React Native: XHR native upload handles file:// and content:// URIs.
            await uploadViaXHR(
              file.uri,
              presignedUrl.url,
              file.type || 'application/octet-stream',
            );
          } else if (file.base64) {
            // React Native sync path: in-memory base64 data, no file URI available.
            //
            // Why not fetch(dataUri): React Native on Android uses OkHttp, which
            //   does not support data: URIs — throws "Network request failed".
            // Why not new Blob([Uint8Array]): RN BlobManager throws
            //   "Creating blobs from ArrayBufferView are not supported".
            // Why xhr.send(bytes.buffer) works: RN's XHR.send() has an explicit
            //   ArrayBuffer branch — it base64-encodes the buffer in JS, sends
            //   {type:'base64', data} across the bridge, and the native layer
            //   (NSURLSession / OkHttp) decodes back to raw bytes for the HTTP body.
            const rawBase64 = file.base64.includes(',')
              ? file.base64.split(',')[1]
              : file.base64;
            const binary = atob(rawBase64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            await new Promise<void>((resolve, reject) => {
              const xhr = new XMLHttpRequest();
              xhr.open('PUT', presignedUrl.url);
              xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
              xhr.timeout = 120_000;
              xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) resolve();
                else reject(new Error(`S3 upload failed — HTTP ${xhr.status}: ${xhr.responseText?.slice(0, 200)}`));
              };
              xhr.onerror = () => reject(new Error('S3 upload network error'));
              xhr.ontimeout = () => reject(new Error('S3 upload timed out'));
              xhr.send(bytes.buffer);
            });
          }
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