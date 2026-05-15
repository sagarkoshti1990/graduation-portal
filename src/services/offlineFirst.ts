/**
 * withOfflineFirst — core offline-first execution utility.
 *
 * Usage:
 *   return withOfflineFirst(
 *     () => api.get(...),
 *     {
 *       offlineSupported: OFFLINE_API_CONFIG.TARGETED_SOLUTIONS.supported,
 *       cacheKey: OFFLINE_API_CONFIG.TARGETED_SOLUTIONS.cacheKey(type),
 *       emptyValue: [],
 *     }
 *   );
 *
 * Flow:
 *   OFFLINE + not supported → return emptyValue with offlineSupported=false
 *   OFFLINE + supported + cache hit → return cached data
 *   OFFLINE + supported + no cache  → return emptyValue with offlineDataAvailable=false
 *   ONLINE + API success → cache result (background), return live data
 *   ONLINE + API error + cache hit  → return cached data as fallback
 *   ONLINE + API error + no cache   → rethrow (caller handles)
 */

import offlineStorage from './offlineStorage';
import { isNetworkOffline } from '@utils/networkStatus';
import type { OfflineServiceResponse } from './offlineTypes';
import {
  buildOfflineUnsupported,
  buildOfflineNoData,
  buildFromCache,
  buildOnlineSuccess,
} from './offlineTypes';
import logger from '@utils/logger';

export interface OfflineFirstConfig<T> {
  /** Whether this API has offline support configured in OFFLINE_API_CONFIG. */
  offlineSupported: boolean;
  /** Static storage key for the cache (e.g. 'participants:projectCategories'). */
  cacheKey?: string;
  /**
   * Custom cache read function for dynamic keys (e.g. participant:id:details).
   * Used when the key cannot be expressed as a plain string at call time.
   */
  cacheReader?: () => Promise<T | null>;
  /** Custom cache write function — mirrors cacheReader. */
  cacheWriter?: (data: T) => Promise<void>;
  /** Value to return in `data` when nothing is available ([] for lists, null for objects). */
  emptyValue: T;
  /**
   * Optional async check — when online, if this returns true the cache is
   * served instead of the live API (pending-sync priority: Rule 2).
   * Errors are swallowed and treated as false.
   */
  hasPendingSyncFn?: () => Promise<boolean>;
}

async function readCache<T>(
  cacheKey?: string,
  cacheReader?: () => Promise<T | null>,
): Promise<T | null> {
  try {
    if (cacheReader) return await cacheReader();
    if (cacheKey)    return await offlineStorage.read<T>(cacheKey);
  } catch { /* non-fatal */ }
  return null;
}

async function writeCache<T>(
  data: T,
  cacheKey?: string,
  cacheWriter?: (data: T) => Promise<void>,
): Promise<void> {
  try {
    if (cacheWriter) { await cacheWriter(data); return; }
    if (cacheKey)    { await offlineStorage.create(cacheKey, data); }
  } catch { /* non-fatal — cache write failures must never break the main flow */ }
}

export async function withOfflineFirst<T>(
  apiCall: () => Promise<T>,
  config: OfflineFirstConfig<T>,
): Promise<OfflineServiceResponse<T>> {
  const { offlineSupported, cacheKey, cacheReader, cacheWriter, emptyValue, hasPendingSyncFn } = config;

  // ── OFFLINE PATH ────────────────────────────────────────────────────────
  if (isNetworkOffline()) {
    if (!offlineSupported) {
      return buildOfflineUnsupported(emptyValue);
    }
    const cached = await readCache<T>(cacheKey, cacheReader);
    if (cached !== null) {
      return buildFromCache(cached, true);
    }
    return buildOfflineNoData(emptyValue);
  }

  // ── ONLINE + PENDING SYNC — serve cache to avoid overwriting local edits ─
  if (offlineSupported && hasPendingSyncFn) {
    const hasPending = await hasPendingSyncFn().catch(() => false);
    if (hasPending) {
      const cached = await readCache<T>(cacheKey, cacheReader);
      if (cached !== null) {
        return buildFromCache(cached, false); // online but local edits take priority
      }
    }
  }

  // ── ONLINE PATH ─────────────────────────────────────────────────────────
  try {
    const data = await apiCall();
    if (offlineSupported && data != null) {
      // Fire-and-forget background cache update
      writeCache(data, cacheKey, cacheWriter).catch(e =>
        logger.warn('offlineFirst: background cache write failed', e),
      );
    }
    return buildOnlineSuccess(data, offlineSupported);
  } catch (err) {
    // API error — attempt cache fallback
    if (offlineSupported) {
      const cached = await readCache<T>(cacheKey, cacheReader);
      if (cached !== null) {
        logger.warn('offlineFirst: API error, serving from cache', err);
        return buildFromCache(cached, false);
      }
    }
    throw err; // no fallback available — propagate to caller
  }
}
