import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './STORAGE_KEYS';
import { isWeb } from '@utils/platform';
import { MAX_FILE_SIZE } from './app.constant';

declare const process:
  | {
      env: {
        [key: string]: string | undefined;
      };
    }
  | undefined;

const baseUrl = process.env.API_BASE_URL;

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
    console.error('Error getting token:', error);
    return null;
  }
};

export const PROJECT_PLAYER_CONFIGS = {
  maxFileSize: MAX_FILE_SIZE,
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
