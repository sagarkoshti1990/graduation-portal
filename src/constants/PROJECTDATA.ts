import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './STORAGE_KEYS';
import { isWeb } from '@utils/platform';
import logger from '@utils/logger';

declare const process:
  | {
      env: {
        [key: string]: string | undefined;
      };
    }
  | undefined;
  // @ts-ignore - process.env is injected by webpack DefinePlugin on web, available in React Native
  const baseUrl = process.env.API_BASE_URL || '';
// Helper function to get access token from AsyncStorage
export const getAccessToken = async (): Promise<string | null> => {
  try {
    if (isWeb) {
      // On web, check both localStorage and sessionStorage
      if (typeof window !== 'undefined') {
        // First check localStorage (persistent)
    const localStorageToken = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

        if (localStorageToken) {
          return localStorageToken;
        }
        // Then check sessionStorage (temporary)
        const sessionStorageToken = window.sessionStorage?.getItem(STORAGE_KEYS.AUTH_TOKEN);
        if (sessionStorageToken) {
          return sessionStorageToken;
        }
      }
      return null;
    } else {
      // On native platforms, use AsyncStorage
      return await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    }
  } catch (error) {
    logger.error('Error getting token:', error);
    return null;
  }
};

export const PROJECT_PLAYER_CONFIGS = {
  maxFileSize: 50,
  baseUrl: baseUrl,
  accessToken: getAccessToken,
  language: 'en',
  profileInfo: {
    id: 123,
    name: 'John Doe',
  },
  redirectionLinks: {
    unauthorizedRedirectUrl: '/login',
  },
};

export const MODE = {
  // Edit mode with full permissions
  editMode: {
    mode: 'edit' as const,
  },
  // Preview mode (template view)
  previewMode: {
    mode: 'preview' as const,
  },

  // Read-only mode
  readOnlyMode: {
    mode: 'read-only' as const,
  },
};
