import api, { saveToken } from './api';
import { API_ENDPOINTS } from './apiEndpoints';
import offlineStorage from './offlineStorage';
import { STORAGE_KEYS } from '@constants/STORAGE_KEYS';
import logger from '@utils/logger';

export interface LoginResponse {
  responseCode: string;
  message: string;
  result: {
    access_token: string;
    refresh_token: string;
    user: any;
  };
}

export interface RefreshTokenResponse {
  responseCode: string;
  message: string;
  result: {
    access_token: string;
    refresh_token: string;
  };
}

/**
 * Refreshes the access token using the refresh token.
 *
 * @param refreshToken - The refresh token to use for getting a new access token
 * @returns A promise resolving to the refresh token response from the API
 */
export const refreshToken = async (
  refreshTokenValue: string
): Promise<RefreshTokenResponse> => {
  try {
    logger.info('Calling refresh token endpoint:', API_ENDPOINTS.REFRESH_TOKEN);
    logger.info('Refresh token (first 20 chars):', refreshTokenValue.substring(0, 20));
    
    const response = await api.post<RefreshTokenResponse>(
      API_ENDPOINTS.REFRESH_TOKEN,
      {
        refresh_token: refreshTokenValue,
      }
    );

    const responseData = response.data;
    logger.info('Refresh token response received:', {
      hasResult: !!responseData.result,
      hasAccessToken: !!responseData.result?.access_token,
      hasRefreshToken: !!responseData.result?.refresh_token,
    });

    // Extract tokens from result
    const { access_token, refresh_token: newRefreshToken } =
      responseData.result || {};

    // Validate and save access token (must be non-empty string)
    if (
      access_token &&
      typeof access_token === 'string' &&
      access_token.trim().length > 0
    ) {
      await saveToken(access_token);
      logger.info('Access token refreshed and saved successfully');
    } else {
      logger.warn('Access token is missing or empty in refresh response', {
        responseData,
      });
      throw new Error('Access token is required but was not provided');
    }

    // Save new refresh token if present and non-empty
    if (
      newRefreshToken &&
      typeof newRefreshToken === 'string' &&
      newRefreshToken.trim().length > 0
    ) {
      await offlineStorage.create(
        STORAGE_KEYS.AUTH_REFRESH_TOKEN,
        newRefreshToken
      );
      logger.info('Refresh token updated successfully');
    } else {
      // If no new refresh token, keep the existing one
      logger.info('No new refresh token in response, keeping existing one');
    }

    return responseData;
  } catch (error: any) {
    logger.error('Refresh token error:', {
      message: error?.message,
      response: error?.response?.data,
      status: error?.response?.status,
    });
    // Error is already handled by axios interceptor
    throw error;
  }
};

/**
 * Logs in the user with the specified credentials.
 *
 * @param identifier - The user's identifier (usually email or username)
 * @param password - The user's password
 * @param isAdmin - Whether to use admin login endpoint (defaults to false)
 * @param rememberMe - Whether to save refresh token for automatic token refresh (defaults to false)
 * @returns A promise resolving to the login response from the API
 */
export const login = async (
  identifier: string,
  password: string,
  isAdmin: boolean = false,
  rememberMe: boolean = false
): Promise<LoginResponse> => {
  try {
    // Determine the endpoint based on isAdmin flag
    const endpoint = isAdmin ? API_ENDPOINTS.ADMIN_LOGIN : API_ENDPOINTS.LOGIN;

    const response = await api.post<LoginResponse>(endpoint, {
      identifier,
      password,
    });

    const responseData = response.data;

    // Extract tokens and user from result
    const { access_token, refresh_token, user } = responseData.result || {};

    // Validate and save access token (must be non-empty string)
    if (
      access_token &&
      typeof access_token === 'string' &&
      access_token.trim().length > 0
    ) {
      await saveToken(access_token);
      logger.info('Access token saved successfully');
    } else {
      logger.warn(
        `Access token is missing or empty in ${isAdmin ? 'admin ' : ''}login response`
      );
      throw new Error('Access token is required but was not provided');
    }

    // Save rememberMe preference to storage (config-driven)
    await offlineStorage.create(
      STORAGE_KEYS.AUTH_REMEMBER_ME,
      rememberMe
    );
    logger.info(`Remember Me preference saved: ${rememberMe}`);

    // Save refresh token only if rememberMe is true
    if (rememberMe) {
      if (
        refresh_token &&
        typeof refresh_token === 'string' &&
        refresh_token.trim().length > 0
      ) {
        await offlineStorage.create(
          STORAGE_KEYS.AUTH_REFRESH_TOKEN,
          refresh_token
        );
        logger.info('Refresh token saved successfully (Remember Me enabled)');
      }
    } else {
      // If rememberMe is false, ensure refresh token is not saved
      await offlineStorage.remove(STORAGE_KEYS.AUTH_REFRESH_TOKEN);
      logger.info('Refresh token not saved (Remember Me disabled)');
    }

    // Save user data to offline storage (will be overwritten by AuthContext with mapped user)
    if (user) {
      await offlineStorage.create(STORAGE_KEYS.AUTH_USER, user);
      logger.info('User data saved to storage');
    }

    return responseData;
  } catch (error: any) {
    // Error is already handled by axios interceptor
    throw error;
  }
};


export const getUserProfile = async (id?: string | null): Promise<any> => {
  try {
    const response = await api.get(API_ENDPOINTS.USER_PROFILE + (id ? '/' + id : ''));
    return response.data.result || {};
  } catch (error: any) {
    // Error is already handled by axios interceptor
    throw error;
  }
};

export const getEntityDetails = async (userId: string): Promise<any> => {
  try {
    const response = await api.get(API_ENDPOINTS.ENTITY_DETAILS + '/' + userId);
    return response.data.result || {};
  } catch (error: any) {
    // Error is already handled by axios interceptor
    throw error;
  }
};