/**
 * Standardized offline-aware response contract.
 *
 * Every service function that reads data returns this shape.
 * Components check the flags to decide what UI to render — no custom offline
 * detection logic belongs in components.
 *
 * Scenarios:
 *   isOffline=false, offlineDataAvailable=true   → live API data (or API error + cache fallback)
 *   isOffline=true,  offlineDataAvailable=true   → served from IndexedDB cache
 *   isOffline=true,  offlineDataAvailable=false,
 *                    offlineSupported=true        → offline + download was not done
 *   isOffline=true,  offlineDataAvailable=false,
 *                    offlineSupported=false       → this API does not support offline at all
 */
export interface OfflineServiceResponse<T> {
  /** Actual result — empty value ([] / null / {}) when data unavailable. */
  data: T;
  /** True when device has no network connection. */
  isOffline: boolean;
  /** True when this API has offline storage configured (see OFFLINE_API_CONFIG). */
  offlineSupported: boolean;
  /** True when data was returned from cache (either fully offline or as fallback). */
  offlineDataAvailable: boolean;
  /** i18n key — present when data could not be served. */
  message?: string;
  /** True when data came from IndexedDB/AsyncStorage, not the live API. */
  fromCache?: boolean;
}

// ---------------------------------------------------------------------------
// Response builder helpers — keep service functions concise
// ---------------------------------------------------------------------------

/** Device offline, API not configured for offline — return empty + flags. */
export function buildOfflineUnsupported<T>(emptyValue: T): OfflineServiceResponse<T> {
  return {
    data: emptyValue,
    isOffline: true,
    offlineSupported: false,
    offlineDataAvailable: false,
    message: 'offlineSync.dataUnavailable',
  };
}

/** Device offline, API supports offline, but no cached data found. */
export function buildOfflineNoData<T>(emptyValue: T): OfflineServiceResponse<T> {
  return {
    data: emptyValue,
    isOffline: true,
    offlineSupported: true,
    offlineDataAvailable: false,
    message: 'offlineSync.dataUnavailable',
  };
}

/** Device offline (or API error fallback), cached data returned. */
export function buildFromCache<T>(data: T, isOffline: boolean): OfflineServiceResponse<T> {
  return {
    data,
    isOffline,
    offlineSupported: true,
    offlineDataAvailable: true,
    fromCache: true,
  };
}

/** Online, live API data. */
export function buildOnlineSuccess<T>(data: T, offlineSupported: boolean): OfflineServiceResponse<T> {
  return {
    data,
    isOffline: false,
    offlineSupported,
    offlineDataAvailable: false,
  };
}
