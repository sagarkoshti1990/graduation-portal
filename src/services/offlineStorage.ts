import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '@utils/logger';
import { OFFLINE_KEYS } from '@constants/STORAGE_KEYS';
import SmartStorage from '../storage';

/**
 * Offline Storage Service — Native (iOS/Android).
 *
 * Metro resolves this file for native builds; React Native Web builds use
 * `offlineStorage.web.ts` instead (see that file for the IndexedDB-backed
 * implementation participant/sync keys use there). Splitting native and web
 * into separate files — rather than branching on `Platform.OS` inside one
 * file — mirrors the existing `src/utils/networkStatus.ts` /
 * `networkStatus.web.ts` convention already used elsewhere in this
 * codebase, and keeps this file free of browser-only APIs (`indexedDB`)
 * that only ever matter on web.
 *
 * All keys route through SmartStorage here — a drop-in AsyncStorage
 * replacement that transparently spills large values to a local JSON file
 * when they exceed SmartStorage's configured inline-size threshold.
 *
 * Migration note: SmartStorage reads existing plain-JSON AsyncStorage
 * values written before SmartStorage existed exactly as before (it only
 * treats a value as file-backed when it recognizes its own metadata
 * envelope) — no manual migration step is needed. An existing large value
 * moves to file storage the next time it is written again via
 * `create()`/`update()`.
 *
 * A few call sites here (`checkStorage`, `readAllKeys`, `getSize`) are
 * intentionally raw whole-AsyncStorage-namespace utilities and are NOT
 * routed through SmartStorage: other services in this app (auth token
 * storage, theme, language, admin sidebar state, etc.) write to
 * AsyncStorage directly, outside of this module, so a SmartStorage-scoped
 * view would silently omit those keys.
 */

// ---------------------------------------------------------------------------
// Legacy IndexedDB config type — kept for signature compatibility with the
// web implementation's `read()`; unused on native (no IndexedDB here).
// ---------------------------------------------------------------------------

export interface IndexedDBConfig {
  dbName: string;
  storeName: string;
}

// ---------------------------------------------------------------------------
// Public CRUD API
// ---------------------------------------------------------------------------

/** Create/Update — save data via SmartStorage. */
export const create = async <T>(key: string, data: T): Promise<void> => {
  try {
    // Pass the raw value through — SmartStorage handles serialization
    // (string passthrough / JSON.stringify) and the inline-vs-file
    // storage decision internally.
    await SmartStorage.setItem(key, data);
    logger.info(`OfflineStorage: Created/Updated key "${key}"`);
  } catch (error) {
    logger.error(`OfflineStorage: Error creating/updating key "${key}"`, error);
    throw error;
  }
};

/** Raw whole-AsyncStorage diagnostic dump — intentionally not routed through SmartStorage (see module doc). */
export const checkStorage = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const result = await AsyncStorage.multiGet(keys);
    return {keys,result}
  } catch (error) {
    console.log('Storage Error:', error);
    return {message:'Storage Error:', error}
  }
};

/**
 * Read — retrieve data via SmartStorage.
 * `indexedDBConfig` is accepted only for signature parity with the web
 * implementation; there is no IndexedDB on native so it is ignored here.
 */
export const read = async <T>(
  key: string,
  _indexedDBConfig?: IndexedDBConfig
): Promise<T | null> => {
  try {
    const data = await SmartStorage.getItem<T>(key);
    if (data === null) {
      logger.info(`OfflineStorage: Key "${key}" not found`);
    }
    return data;
  } catch (error) {
    logger.error(`OfflineStorage: Error reading key "${key}"`, error);
    throw error;
  }
};

/** Update — alias for create. */
export const update = async <T>(key: string, data: T): Promise<void> => create(key, data);

/** Remove — delete a single key, also deleting its backing file first if it was file-backed. */
export const remove = async (key: string): Promise<void> => {
  try {
    await SmartStorage.removeItem(key);
    logger.info(`OfflineStorage: Deleted key "${key}"`);
  } catch (error) {
    logger.error(`OfflineStorage: Error deleting key "${key}"`, error);
    throw error;
  }
};

/** Remove multiple keys in a single batched SmartStorage call. */
export const removeMultiple = async (keys: string[]): Promise<void> => {
  try {
    await SmartStorage.multiRemove(keys);
    logger.info(`OfflineStorage: Deleted ${keys.length} keys`);
  } catch (error) {
    logger.error('OfflineStorage: Error deleting multiple keys', error);
    throw error;
  }
};

/**
 * Get every raw AsyncStorage key.
 * Intentionally not routed through SmartStorage — other services in this app
 * write to AsyncStorage directly (auth tokens, theme, language, etc.), so a
 * SmartStorage-scoped view would silently omit those keys (see module doc).
 */
export const readAllKeys = async (): Promise<string[]> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    logger.info(`OfflineStorage: Retrieved ${keys.length} keys`);
    return [...keys];
  } catch (error) {
    logger.error('OfflineStorage: Error reading all keys', error);
    throw error;
  }
};

/** Read multiple keys in a single batched SmartStorage call. */
export const readMultiple = async <T>(
  keys: string[]
): Promise<Array<{ key: string; value: T | null }>> => {
  try {
    const values = await SmartStorage.multiGet<T>(keys);
    return values.map(([key, value]) => ({ key, value }));
  } catch (error) {
    logger.error('OfflineStorage: Error reading multiple keys', error);
    throw error;
  }
};

/** Save multiple key-value pairs in a single batched SmartStorage call. */
export const createMultiple = async <T>(
  items: Array<{ key: string; value: T }>
): Promise<void> => {
  try {
    await SmartStorage.multiSet(items.map(({ key, value }) => [key, value] as [string, unknown]));
    logger.info(`OfflineStorage: Created/Updated ${items.length} keys`);
  } catch (error) {
    logger.error('OfflineStorage: Error creating multiple keys', error);
    throw error;
  }
};

/** Clear all storage. */
export const clearAll = async (): Promise<void> => {
  try {
    // Clean up SmartStorage-managed files (and its own key registry) first —
    // this must run before the raw AsyncStorage.clear() below, since that
    // wipes the registry too and would otherwise leave file-backed JSON
    // files orphaned on disk with nothing left to know they exist.
    await SmartStorage.clear().catch(err => {
      logger.warn('OfflineStorage: SmartStorage.clear() failed during clearAll — continuing with full wipe', err);
    });
    await AsyncStorage.clear();
    logger.info('OfflineStorage: Cleared all storage');
  } catch (error) {
    logger.error('OfflineStorage: Error clearing all storage', error);
    throw error;
  }
};

/** Check if a key exists. */
export const exists = async (key: string): Promise<boolean> => {
  try {
    return (await SmartStorage.getItem(key)) !== null;
  } catch {
    return false;
  }
};

/**
 * Approximate total AsyncStorage size in bytes. Deliberately measures raw
 * AsyncStorage specifically (not routed through SmartStorage, and not
 * inclusive of SmartStorage's file-backed content) — after the SmartStorage
 * migration, a shrinking AsyncStorage footprint as large values move to
 * files is the intended, expected outcome this function should reflect.
 */
export const getSize = async (): Promise<number> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const values = await AsyncStorage.multiGet(keys);
    return values.reduce((total, [, value]) => total + (value ? value.length : 0), 0);
  } catch {
    return 0;
  }
};

/**
 * Returns all storage keys that belong to a specific participant under a
 * specific user. userId prefix ensures multi-user isolation.
 */
export const getParticipantKeys = async (userId: string, participantId: string): Promise<string[]> => {
  try {
    const prefix = `participant:${userId}:${participantId}:`;
    // Every participant:* key is written via create() → SmartStorage, so
    // its registry (cheaper than a full native AsyncStorage key scan) is a
    // complete and accurate source for this prefix filter.
    const allKeys = await SmartStorage.getAllKeys();
    return allKeys.filter((k: string) => k.startsWith(prefix));
  } catch {
    return [];
  }
};

// ---------------------------------------------------------------------------
// Offline participant ID registry
// Tracks which participants have been downloaded for offline use.
// All registry keys are scoped per userId to ensure multi-user isolation.
// Key: OFFLINE_KEYS.OFFLINE_PARTICIPANT_IDS(userId)  Value: string[]
// ---------------------------------------------------------------------------

/**
 * Register a participant as offline-capable for a specific user.
 * Idempotent — safe to call multiple times with the same id.
 */
export const addOfflineParticipantId = async (userId: string, id: string): Promise<void> => {
  const existing = await read<string[]>(OFFLINE_KEYS.OFFLINE_PARTICIPANT_IDS(userId));
  const ids = existing ?? [];
  if (!ids.includes(id)) {
    await create(OFFLINE_KEYS.OFFLINE_PARTICIPANT_IDS(userId), [...ids, id]);
  }
};

/** Remove a participant from the offline registry for a specific user (e.g. on clear). */
export const removeOfflineParticipantId = async (userId: string, id: string): Promise<void> => {
  const existing = await read<string[]>(OFFLINE_KEYS.OFFLINE_PARTICIPANT_IDS(userId));
  const ids = (existing ?? []).filter((x: string) => x !== id);
  await create(OFFLINE_KEYS.OFFLINE_PARTICIPANT_IDS(userId), ids);
};

/** Returns all participant IDs downloaded for a specific user. */
export const getOfflineParticipantIds = async (userId: string): Promise<string[]> => {
  const ids = await read<string[]>(OFFLINE_KEYS.OFFLINE_PARTICIPANT_IDS(userId));
  return ids ?? [];
};

/** Returns true if this participant has been downloaded for the given user. */
export const isParticipantOffline = async (userId: string, id: string): Promise<boolean> => {
  const ids = await getOfflineParticipantIds(userId);
  return ids.includes(id);
};

// ---------------------------------------------------------------------------
// Default export
// ---------------------------------------------------------------------------

const offlineStorage = {
  create,
  read,
  update,
  remove,
  removeMultiple,
  readAllKeys,
  readMultiple,
  createMultiple,
  clearAll,
  exists,
  getSize,
  getParticipantKeys,
  checkStorage
};

export default offlineStorage;
