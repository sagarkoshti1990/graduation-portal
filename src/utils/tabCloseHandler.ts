import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from './logger';
import { STORAGE_KEYS } from '@constants/STORAGE_KEYS';
import { getAuthConfig } from '@config/auth';

/**
 * Clears authentication data when tab/window closes if rememberMe is false
 * Only works on web platform
 * Config-driven via authConfig
 * Uses synchronous localStorage operations for reliability during tab close
 */
export const setupTabCloseHandler = (): (() => void) => {
  if (Platform.OS !== 'web') {
    // Not web platform, return no-op cleanup function
    return () => {};
  }

  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return () => {};
  }

  const authConfig = getAuthConfig();

  // Only setup if config allows it
  if (!authConfig.rememberMe.clearOnTabClose) {
    logger.info('Tab close handler disabled by config');
    return () => {};
  }

  /**
   * Clear auth data synchronously if rememberMe is false
   * Uses localStorage directly for synchronous operations during tab close
   */
  const clearAuthDataIfNeeded = () => {
    try {
      // Read rememberMe preference synchronously from localStorage
      const rememberMeStr = localStorage.getItem(STORAGE_KEYS.AUTH_REMEMBER_ME);
      let rememberMe: boolean | null = null;
      
      if (rememberMeStr !== null) {
        try {
          rememberMe = JSON.parse(rememberMeStr) as boolean;
        } catch {
          // If parsing fails, treat as null
          rememberMe = null;
        }
      }

      // Only clear if rememberMe is explicitly false (not null/undefined)
      if (rememberMe === false) {
        logger.info('Remember Me is false - clearing auth data on tab close');

        // Clear all auth-related storage synchronously
        try {
          localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
          localStorage.removeItem(STORAGE_KEYS.AUTH_REFRESH_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.AUTH_REMEMBER_ME);
          
          // Also clear from AsyncStorage (for React Native compatibility)
          // This is async but we do our best effort
          AsyncStorage.multiRemove([
            STORAGE_KEYS.AUTH_TOKEN,
            STORAGE_KEYS.AUTH_USER,
            STORAGE_KEYS.AUTH_REFRESH_TOKEN,
            STORAGE_KEYS.AUTH_REMEMBER_ME,
          ]).catch((error) => {
            // Silently fail - we already cleared from localStorage
            logger.error('Error clearing AsyncStorage on tab close:', error);
          });

          logger.info('Auth data cleared successfully');
        } catch (error) {
          logger.error('Error clearing localStorage on tab close:', error);
        }
      } else {
        logger.info(
          'Remember Me is true or not set - keeping auth data on tab close'
        );
      }
    } catch (error) {
      logger.error('Error checking Remember Me preference on tab close:', error);
    }
  };

  /**
   * Handle beforeunload event (tab/window close)
   * Note: This event fires before the page unloads, but async operations may not complete
   */
  const handleBeforeUnload = () => {
    clearAuthDataIfNeeded();
  };

  /**
   * Handle unload event (fires when page is unloading)
   * More reliable for clearing data synchronously
   */
  const handleUnload = () => {
    clearAuthDataIfNeeded();
  };

  /**
   * Handle pagehide event (more reliable for mobile browsers and modern browsers)
   * This is the most reliable event for detecting tab/window close
   */
  const handlePageHide = (event: PageTransitionEvent) => {
    // Only clear if page is being hidden (not just navigating)
    // persisted = false means the page is being unloaded
    if (!event.persisted) {
      clearAuthDataIfNeeded();
    }
  };

  // Add event listeners
  window.addEventListener('beforeunload', handleBeforeUnload);
  window.addEventListener('unload', handleUnload);
  window.addEventListener('pagehide', handlePageHide);

  logger.info('Tab close handler setup complete');

  // Return cleanup function
  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
    window.removeEventListener('unload', handleUnload);
    window.removeEventListener('pagehide', handlePageHide);
    logger.info('Tab close handler cleanup complete');
  };
};

