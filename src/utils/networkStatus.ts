import { Platform } from 'react-native';

/**
 * Returns true when the device has no network connectivity.
 *
 * Web:    reads window.navigator.onLine (synchronous, no side-effects).
 * Native: API-error is the offline signal; always returns false here so the
 *         caller's error-handling / withOfflineFirst fallback path takes over.
 */
export function isNetworkOffline(): boolean {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return !window.navigator.onLine;
  }
  return false;
}
