import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '@utils/logger';
import { STORAGE_KEYS } from '@constants/STORAGE_KEYS';
// import { API_BASE_URL, ORIGIN } from '@config/env';
import offlineStorage from './offlineStorage';
import { isAndroid } from '@utils/platform';
import { refreshToken } from './authenticationService';
import { resetToScreen } from '@utils/navigationRef';

// Type declaration for process.env (injected by webpack DefinePlugin on web, available in React Native)
declare const process:
  | {
      env: {
        [key: string]: string | undefined;
      };
    }
  | undefined;

const TOKEN_STORAGE_KEY = STORAGE_KEYS.AUTH_TOKEN;
const INTERNAL_ACCESS_TOKEN_KEY = STORAGE_KEYS.INTERNAL_ACCESS_TOKEN;

/**
 * Create axios instance with base configuration
 * baseURL is loaded from .env file via @config/env
 */

const api: AxiosInstance = axios.create({
  // @ts-ignore - process.env is injected by webpack DefinePlugin on web, available in React Native
  baseURL: process.env.API_BASE_URL || '',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/plain, */*',
    'internal-access-token': process.env.INTERNAL_ACCESS_TOKEN || '',
    // @ts-ignore - process.env is injected by webpack DefinePlugin on web
    ...(!isAndroid ? {} : { origin: process.env.ORIGIN || '' }),
  },
});

/**
 * Request Interceptor
 * Adds authentication token to requests and handles other request details
 */
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      // Skip adding Authorization header for refresh token endpoint
      const isRefreshTokenRequest = config.url?.includes('/account/refresh');
      
      if (!isRefreshTokenRequest) {
        // Get token from storage
        const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);

        // Add token to Authorization header if available
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
          config.headers['x-auth-token'] = token;
        }
      }

      // Add internal-access-token header if available - Required for entity-management API endpoints
      const internalAccessToken = await AsyncStorage.getItem(INTERNAL_ACCESS_TOKEN_KEY);
      if (internalAccessToken && config.headers) {
        config.headers['internal-access-token'] = internalAccessToken;
      }

      // Add organization code header if available (from stored user data)
      const userData = await offlineStorage.read<any>(STORAGE_KEYS.AUTH_USER);
      const orgCode = userData?.organizations?.[0]?.code;
      if (orgCode && config.headers) {
        config.headers['organization'] = orgCode;
      }

      // Add tenant code header if available (from stored user data)
      const tenantCode = userData?.tenant_code;
      if (tenantCode && config.headers) {
        config.headers['tenant'] = tenantCode;
      }
      // Log request details (optional - can be removed in production)
      // logger.info(`API Request: ${config.method?.toUpperCase()} ${config.url}`, {
      //   headers: config.headers,
      //   data: config.data,
      // });

      return config;
    } catch (error) {
      logger.error('Request interceptor error:', error);
      return Promise.reject(error);
    }
  },
  (error: AxiosError) => {
    logger.error('Request error:', error);
    return Promise.reject(error);
  },
);

/**
 * Response Interceptor
 * Handles response data, errors, and token refresh logic
 */
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log successful response (optional)
    logger.info(
      `API Response: ${response.config.method?.toUpperCase()} ${
        response.config.url
      }`,
      {
        status: response.status,
        data: response.data,
      },
    );

    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
      _isRefreshTokenCall?: boolean;
    };

    // Don't try to refresh if the failed request is already a refresh token request
    const isRefreshTokenRequest = originalRequest.url?.includes(
      '/account/refresh'
    );

    // Handle 401 Unauthorized - Token expired or invalid
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshTokenRequest) {
        // Refresh token itself is invalid, redirect to logout page
        logger.warn(
          'Refresh token request failed with 401. Refresh token is invalid. Redirecting to logout page.'
        );
        resetToScreen('logout');
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        // Check if refresh token exists (Remember Me was checked)
        const storedRefreshToken = await offlineStorage.read<string>(
          STORAGE_KEYS.AUTH_REFRESH_TOKEN
        );

        if (storedRefreshToken && typeof storedRefreshToken === 'string') {
          // Try to refresh the token
          try {
            logger.info('Attempting to refresh access token using refresh token');
            logger.info('Refresh token value:', storedRefreshToken.substring(0, 20) + '...');
            
            const refreshResponse = await refreshToken(storedRefreshToken);
            logger.info('Refresh token call completed successfully');

            // Get the new token
            const newToken = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
            logger.info('New token retrieved:', newToken ? 'Token exists' : 'Token missing');

            if (newToken && originalRequest.headers) {
              // Update the original request with new token
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              originalRequest.headers['x-auth-token'] = newToken;

              // Retry the original request
              logger.info('Retrying original request with new access token');
              return api(originalRequest);
            } else {
              logger.error('Failed to get new token after refresh', {
                refreshResponse,
                newToken,
              });
              throw new Error('Failed to get new token after refresh');
            }
          } catch (refreshError: any) {
            // Log detailed error information
            logger.error('Refresh token error details:', {
              message: refreshError?.message,
              response: refreshError?.response?.data,
              status: refreshError?.response?.status,
              statusText: refreshError?.response?.statusText,
              url: refreshError?.config?.url,
            });
            
            // Only redirect to logout if refresh token is actually invalid/expired
            // Check if it's a 401 or 403 error (token invalid/expired)
            const isTokenInvalid = refreshError?.response?.status === 401 || 
                                   refreshError?.response?.status === 403;
            
            if (isTokenInvalid) {
              logger.warn(
                'Refresh token is invalid or expired. Redirecting to logout page.'
              );
              resetToScreen('logout');
            } else {
              // For other errors (network, server errors), don't logout - just reject
              logger.error('Refresh token failed with non-auth error:', refreshError);
            }
            return Promise.reject(error);
          }
        } else {
          // No refresh token found (Remember Me was not checked)
          // Redirect to logout page
          logger.warn(
            'Session expired. No refresh token available. Redirecting to logout page.'
          );
          resetToScreen('logout');
          return Promise.reject(error);
        }
      } catch (storageError) {
        logger.error('Error handling token refresh:', storageError);
        // Redirect to logout page
        resetToScreen('logout');
        return Promise.reject(error);
      }
    }

    // Handle other error status codes
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as any;

      logger.error(
        `API Error: ${status} - ${error.config?.method?.toUpperCase()} ${
          error.config?.url
        }`,
        {
          status,
          message: data?.message || error.message,
          data,
        },
      );

      // Return a more user-friendly error message
      const errorMessage =
        data?.message || `Request failed with status ${status}`;
      return Promise.reject(new Error(errorMessage));
    }

    // Handle network errors
    if (error.request) {
      logger.error('Network error - No response received:', error.message);
      return Promise.reject(
        new Error('Network error. Please check your connection.'),
      );
    }

    // Handle other errors
    logger.error('Request setup error:', error.message);
    return Promise.reject(error);
  },
);

/**
 * Helper function to save token
 */
export const saveToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch (error) {
    logger.error('Error saving token:', error);
    throw error;
  }
};

/**
 * Helper function to get token
 */
export const getToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
  } catch (error) {
    logger.error('Error getting token:', error);
    return null;
  }
};

/**
 * Helper function to remove token
 */
export const removeToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch (error) {
    logger.error('Error removing token:', error);
    throw error;
  }
};

export default api;
