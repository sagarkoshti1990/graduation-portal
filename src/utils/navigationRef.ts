import { createNavigationContainerRef, CommonActions } from '@react-navigation/native';
import logger from '@utils/logger';
export const navigationRef = createNavigationContainerRef();

/**
 * Navigate to a screen from outside React components (e.g., API interceptors)
 * @param name - Screen name to navigate to
 * @param params - Optional navigation parameters
 */
export function navigate(name: string, params?: Record<string, unknown>) {
  if (navigationRef.isReady()) {
    try {
      // @ts-ignore - navigation type inference
      navigationRef.navigate(name, params);
    } catch (error) {
      logger.warn('Navigation error:', error);
    }
  } else {
    // If navigation is not ready, log a warning
    logger.warn('Navigation is not ready yet. Cannot navigate to:', name);
  }
}

/**
 * Reset navigation stack to a specific screen
 * Useful when navigating to login from API interceptor
 * @param name - Screen name to reset to
 * @param params - Optional navigation parameters
 */
export function resetToScreen(name: string, params?: Record<string, unknown>) {
  if (navigationRef.isReady()) {
    try {
      navigationRef.dispatch(
        CommonActions.reset({
          index: 0,
          // @ts-ignore - navigation type inference
          routes: [{ name, params }],
        })
      );
    } catch (error) {
      logger.warn('Navigation reset error:', error);
    }
  } else {
    logger.warn('Navigation is not ready yet. Cannot reset to:', name);
  }
}

