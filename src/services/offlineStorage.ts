import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '@utils/logger';
import { Platform } from 'react-native';

/**
 * Offline Storage Service
 * Provides CRUD operations for offline data storage
 * Works for both React Native (Android/iOS) and Web platforms
 */

/**
 * IndexedDB configuration for web platform
 */
export interface IndexedDBConfig {
  dbName: string;
  storeName: string;
}

/**
 * Initialize IndexedDB database
 */
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

/**
 * Read from IndexedDB
 */
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
      request.onsuccess = () => {
        const result = request.result;
        if (result && result.data) {
          resolve(result.data);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    logger.error(`OfflineStorage: Error reading from IndexedDB key "${key}"`, error);
    throw error;
  }
};

/**
 * Create/Update - Save data to storage
 * @param key - Storage key
 * @param data - Data to save (objects/arrays will be JSON stringified, strings saved raw)
 * @returns Promise<void>
 */
export const create = async <T>(key: string, data: T): Promise<void> => {
  try {
    // Save strings as raw values to avoid extra quotes (for tokens)
    // Save other types (objects, arrays, etc.) as JSON
    const valueToStore = typeof data === 'string' 
      ? data 
      : JSON.stringify(data);
    
    await AsyncStorage.setItem(key, valueToStore);
    logger.info(`OfflineStorage: Created/Updated key "${key}"`);
  } catch (error) {
    logger.error(`OfflineStorage: Error creating/updating key "${key}"`, error);
    throw error;
  }
};

/**
 * Read - Get data from storage
 * @param key - Storage key
 * @param indexedDBConfig - Optional IndexedDB configuration for web platform (dbName, storeName)
 * @returns Promise<T | null> - Parsed data or null if not found
 */
export const read = async <T>(
  key: string,
  indexedDBConfig?: IndexedDBConfig
): Promise<T | null> => {
  try {
    // Use IndexedDB for web if config is provided
    if (Platform.OS === 'web' && indexedDBConfig) {
      const data = await readFromIndexedDB<T>(
        key,
        indexedDBConfig.dbName,
        indexedDBConfig.storeName
      );
      
      if (!data) {
        logger.info(`OfflineStorage: Key "${key}" not found in IndexedDB`);
        return null;
      }
      logger.info(`OfflineStorage: Read key "${key}" from IndexedDB`);
      return data;
    }

    // Default to AsyncStorage
    const value = await AsyncStorage.getItem(key);
    if (!value) {
      logger.info(`OfflineStorage: Key "${key}" not found`);
      return null;
    }
    
    // Try to parse as JSON, if it fails, return as raw string
    try {
      const data = JSON.parse(value) as T;
      logger.info(`OfflineStorage: Read key "${key}"`);
      return data;
    } catch {
      // If JSON.parse fails, it's a raw string (like a token)
      logger.info(`OfflineStorage: Read raw key "${key}"`);
      return value as T;
    }
  } catch (error) {
    logger.error(`OfflineStorage: Error reading key "${key}"`, error);
    throw error;
  }
};

/**
 * Update - Update existing data in storage (alias for create)
 * @param key - Storage key
 * @param data - Data to update (will be JSON stringified)
 * @returns Promise<void>
 */
export const update = async <T>(key: string, data: T): Promise<void> => {
  return create(key, data);
};

/**
 * Delete - Remove data from storage
 * @param key - Storage key to remove
 * @returns Promise<void>
 */
export const remove = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
    logger.info(`OfflineStorage: Deleted key "${key}"`);
  } catch (error) {
    logger.error(`OfflineStorage: Error deleting key "${key}"`, error);
    throw error;
  }
};

/**
 * Delete Multiple - Remove multiple keys from storage
 * @param keys - Array of storage keys to remove
 * @returns Promise<void>
 */
export const removeMultiple = async (keys: string[]): Promise<void> => {
  try {
    await AsyncStorage.multiRemove(keys);
    logger.info(`OfflineStorage: Deleted ${keys.length} keys`);
  } catch (error) {
    logger.error(`OfflineStorage: Error deleting multiple keys`, error);
    throw error;
  }
};

/**
 * Read All Keys - Get all storage keys
 * @returns Promise<string[]> - Array of all storage keys
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

/**
 * Read Multiple - Get multiple values from storage
 * @param keys - Array of storage keys
 * @returns Promise<Array<{key: string, value: T | null}>> - Array of key-value pairs
 */
export const readMultiple = async <T>(
  keys: string[]
): Promise<Array<{ key: string; value: T | null }>> => {
  try {
    const values = await AsyncStorage.multiGet(keys) as [string, string][];
    const result = values.map(([key, value]) => ({
      key,
      value: value ? (JSON.parse(value) as T) : null,
    }));
    logger.info(`OfflineStorage: Read ${keys.length} keys`);
    return result;
  } catch (error) {
    logger.error('OfflineStorage: Error reading multiple keys', error);
    throw error;
  }
};

/**
 * Create Multiple - Save multiple key-value pairs
 * @param items - Array of key-value pairs
 * @returns Promise<void>
 */
export const createMultiple = async <T>(
  items: Array<{ key: string; value: T }>
): Promise<void> => {
  try {
    const pairs: [string, string][] = items.map(({ key, value }) => [
      key,
      JSON.stringify(value),
    ]);
    await AsyncStorage.multiSet(pairs);
    logger.info(`OfflineStorage: Created/Updated ${items.length} keys`);
  } catch (error) {
    logger.error('OfflineStorage: Error creating multiple keys', error);
    throw error;
  }
};

/**
 * Clear All - Remove all data from storage
 * @returns Promise<void>
 */
export const clearAll = async (): Promise<void> => {
  try {
    await AsyncStorage.clear();
    logger.info('OfflineStorage: Cleared all storage');
  } catch (error) {
    logger.error('OfflineStorage: Error clearing all storage', error);
    throw error;
  }
};

/**
 * Check if key exists
 * @param key - Storage key to check
 * @returns Promise<boolean> - True if key exists, false otherwise
 */
export const exists = async (key: string): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(key);
    return value !== null;
  } catch (error) {
    logger.error(`OfflineStorage: Error checking existence of key "${key}"`, error);
    return false;
  }
};

/**
 * Get storage size (approximate)
 * @returns Promise<number> - Approximate size in bytes
 */
export const getSize = async (): Promise<number> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const values = await AsyncStorage.multiGet(keys);
    const size = values.reduce((total, [, value]) => {
      return total + (value ? value.length : 0);
    }, 0);
    return size;
  } catch (error) {
    logger.error('OfflineStorage: Error getting storage size', error);
    return 0;
  }
};

// Export default object with all CRUD functions
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
};

export default offlineStorage;

