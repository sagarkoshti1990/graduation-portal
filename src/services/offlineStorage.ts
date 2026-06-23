import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '@utils/logger';
import { Platform } from 'react-native';
import { OFFLINE_KEYS } from '@constants/STORAGE_KEYS';

/**
 * Offline Storage Service
 *
 * Routing strategy:
 *   - Web + keys starting with 'participant:', 'participants:', 'sync:' → IndexedDB
 *     (avoids the 5 MB localStorage cap that AsyncStorage hits on web)
 *   - Everything else (auth tokens, settings, …)                         → AsyncStorage
 *     (maps to localStorage on web, which is fine for small values)
 *
 * Native (iOS/Android): AsyncStorage is used for all keys.
 */

// ---------------------------------------------------------------------------
// IndexedDB config
// ---------------------------------------------------------------------------

export interface IndexedDBConfig {
  dbName: string;
  storeName: string;
}

const OFFLINE_DB_NAME  = 'gbl-offline-db';
const OFFLINE_DB_STORE = 'offline-data';

// Keys that must go to IndexedDB on web (large blobs, offline participant data)
const IDB_KEY_PREFIXES: string[] = ['participant:', 'participants:', 'sync:'];

function isIndexedDBKey(key: string): boolean {
  return Platform.OS === 'web' && IDB_KEY_PREFIXES.some(p => key.startsWith(p));
}

// ---------------------------------------------------------------------------
// IndexedDB helpers — single cached connection
// ---------------------------------------------------------------------------

let _idb: IDBDatabase | null = null;

function openOfflineDB(): Promise<IDBDatabase> {
  if (_idb) return Promise.resolve(_idb);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(OFFLINE_DB_NAME, 1);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => { _idb = req.result; resolve(_idb!); };
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(OFFLINE_DB_STORE)) {
        db.createObjectStore(OFFLINE_DB_STORE, { keyPath: 'key' });
      }
    };
  });
}

async function idbWrite(key: string, data: any): Promise<void> {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([OFFLINE_DB_STORE], 'readwrite');
    const store = tx.objectStore(OFFLINE_DB_STORE);
    const req = store.put({ key, data, updatedAt: Date.now() });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function idbRead<T>(key: string): Promise<T | null> {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([OFFLINE_DB_STORE], 'readonly');
    const store = tx.objectStore(OFFLINE_DB_STORE);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result?.data ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function idbRemove(key: string): Promise<void> {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([OFFLINE_DB_STORE], 'readwrite');
    const store = tx.objectStore(OFFLINE_DB_STORE);
    const req = store.delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function idbGetAllKeys(prefix?: string): Promise<string[]> {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([OFFLINE_DB_STORE], 'readonly');
    const store = tx.objectStore(OFFLINE_DB_STORE);
    const req = store.openCursor();
    const keys: string[] = [];
    req.onsuccess = (e) => {
      const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        const k: string = cursor.value.key;
        if (!prefix || k.startsWith(prefix)) keys.push(k);
        cursor.continue();
      } else {
        resolve(keys);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

async function idbClearAll(): Promise<void> {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([OFFLINE_DB_STORE], 'readwrite');
    const store = tx.objectStore(OFFLINE_DB_STORE);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ---------------------------------------------------------------------------
// Legacy external-IndexedDB helper (kept for backwards compat)
// ---------------------------------------------------------------------------

const initIndexedDB = (dbName: string, storeName: string): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (Platform.OS !== 'web') {
      return reject(new Error('IndexedDB not available in this environment'));
    }
    const request = indexedDB.open(dbName, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = event => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: 'key' });
      }
    };
  });
};

const readFromIndexedDB = async <T>(
  key: string,
  dbName: string,
  storeName: string
): Promise<T | null> => {
  try {
    const db = await initIndexedDB(dbName, storeName);
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result?.data ?? null);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    logger.error(`OfflineStorage: Error reading from IndexedDB key "${key}"`, error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Public CRUD API
// ---------------------------------------------------------------------------

/**
 * Create/Update — save data.
 * Routes to IndexedDB for participant/sync keys on web; AsyncStorage otherwise.
 */
export const create = async <T>(key: string, data: T): Promise<void> => {
  try {
    if (isIndexedDBKey(key)) {
      await idbWrite(key, data);
    } else {
      const valueToStore = typeof data === 'string' ? data : JSON.stringify(data);
      await AsyncStorage.setItem(key, valueToStore);
    }
    logger.info(`OfflineStorage: Created/Updated key "${key}"`);
  } catch (error) {
    logger.error(`OfflineStorage: Error creating/updating key "${key}"`, error);
    throw error;
  }
};


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
 * Read — retrieve data.
 * Routes to IndexedDB for participant/sync keys on web; AsyncStorage otherwise.
 * Legacy `indexedDBConfig` param is still supported for callers that pass it directly.
 */
export const read = async <T>(
  key: string,
  indexedDBConfig?: IndexedDBConfig
): Promise<T | null> => {
  try {
    // Legacy: explicit external IndexedDB config
    if (Platform.OS === 'web' && indexedDBConfig) {
      const data = await readFromIndexedDB<T>(key, indexedDBConfig.dbName, indexedDBConfig.storeName);
      if (!data) logger.info(`OfflineStorage: Key "${key}" not found in IndexedDB`);
      return data;
    }

    // Automatic routing: large offline keys → IndexedDB
    if (isIndexedDBKey(key)) {
      const data = await idbRead<T>(key);
      if (!data) logger.info(`OfflineStorage: Key "${key}" not found in IDB`);
      return data;
    }

    // Default: AsyncStorage (localStorage on web)
    const value = await AsyncStorage.getItem(key);
    if (!value) {
      logger.info(`OfflineStorage: Key "${key}" not found`);
      return null;
    }
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  } catch (error) {
    logger.error(`OfflineStorage: Error reading key "${key}"`, error);
    throw error;
  }
};

/** Update — alias for create. */
export const update = async <T>(key: string, data: T): Promise<void> => create(key, data);

/**
 * Remove — delete a single key.
 * Routes to IndexedDB for participant/sync keys on web.
 */
export const remove = async (key: string): Promise<void> => {
  try {
    if (isIndexedDBKey(key)) {
      await idbRemove(key);
    } else {
      await AsyncStorage.removeItem(key);
    }
    logger.info(`OfflineStorage: Deleted key "${key}"`);
  } catch (error) {
    logger.error(`OfflineStorage: Error deleting key "${key}"`, error);
    throw error;
  }
};

/** Remove multiple keys (each routed individually). */
export const removeMultiple = async (keys: string[]): Promise<void> => {
  try {
    await Promise.all(keys.map(k => remove(k)));
    logger.info(`OfflineStorage: Deleted ${keys.length} keys`);
  } catch (error) {
    logger.error('OfflineStorage: Error deleting multiple keys', error);
    throw error;
  }
};

/** Get all storage keys (AsyncStorage only — IDB keys accessible via getParticipantKeys). */
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

/** Read multiple AsyncStorage keys. */
export const readMultiple = async <T>(
  keys: string[]
): Promise<Array<{ key: string; value: T | null }>> => {
  try {
    const values = await AsyncStorage.multiGet(keys);
    return values.map(([key, value]) => ({
      key,
      value: value ? (JSON.parse(value) as T) : null,
    }));
  } catch (error) {
    logger.error('OfflineStorage: Error reading multiple keys', error);
    throw error;
  }
};

/** Save multiple key-value pairs (each routed individually). */
export const createMultiple = async <T>(
  items: Array<{ key: string; value: T }>
): Promise<void> => {
  try {
    await Promise.all(items.map(({ key, value }) => create(key, value)));
    logger.info(`OfflineStorage: Created/Updated ${items.length} keys`);
  } catch (error) {
    logger.error('OfflineStorage: Error creating multiple keys', error);
    throw error;
  }
};

/** Clear all storage — both AsyncStorage and the IDB offline store. */
export const clearAll = async (): Promise<void> => {
  try {
    await AsyncStorage.clear();
    if (Platform.OS === 'web') {
      await idbClearAll().catch(() => {});
    }
    logger.info('OfflineStorage: Cleared all storage');
  } catch (error) {
    logger.error('OfflineStorage: Error clearing all storage', error);
    throw error;
  }
};

/** Check if a key exists. */
export const exists = async (key: string): Promise<boolean> => {
  try {
    if (isIndexedDBKey(key)) {
      return (await idbRead(key)) !== null;
    }
    const value = await AsyncStorage.getItem(key);
    return value !== null;
  } catch {
    return false;
  }
};

/** Approximate total AsyncStorage size in bytes. */
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
 * Returns all storage keys that belong to a specific participant under a specific user.
 * On web, reads from IndexedDB (where participant:* keys live).
 * On native, reads from AsyncStorage.
 * userId prefix ensures multi-user isolation.
 */
export const getParticipantKeys = async (userId: string, participantId: string): Promise<string[]> => {
  try {
    const prefix = `participant:${userId}:${participantId}:`;
    if (Platform.OS === 'web') {
      return idbGetAllKeys(prefix);
    }
    const allKeys = await AsyncStorage.getAllKeys();
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
