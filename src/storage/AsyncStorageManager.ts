/**
 * Thin adapter implementing IKeyValueStorage over
 * `@react-native-async-storage/async-storage`. Contains zero SmartStorage
 * business logic — its only job is translating the interface StorageManager
 * depends on into calls against the concrete AsyncStorage module, so the
 * module can be swapped for a test double without StorageManager changing.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { IKeyValueStorage } from './types';
import { AsyncStorageOperationError } from './errors';

export class AsyncStorageManager implements IKeyValueStorage {
  async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (cause) {
      throw new AsyncStorageOperationError(`getItem("${key}")`, cause);
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (cause) {
      throw new AsyncStorageOperationError(`setItem("${key}")`, cause);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (cause) {
      throw new AsyncStorageOperationError(`removeItem("${key}")`, cause);
    }
  }

  async multiGet(keys: readonly string[]): Promise<Array<[string, string | null]>> {
    if (keys.length === 0) return [];
    try {
      const result = await AsyncStorage.multiGet(keys as string[]);
      return result.map(([key, value]) => [key, value ?? null] as [string, string | null]);
    } catch (cause) {
      throw new AsyncStorageOperationError('multiGet', cause);
    }
  }

  async multiSet(keyValuePairs: ReadonlyArray<[string, string]>): Promise<void> {
    if (keyValuePairs.length === 0) return;
    try {
      await AsyncStorage.multiSet(keyValuePairs as [string, string][]);
    } catch (cause) {
      throw new AsyncStorageOperationError('multiSet', cause);
    }
  }

  async multiRemove(keys: readonly string[]): Promise<void> {
    if (keys.length === 0) return;
    try {
      await AsyncStorage.multiRemove(keys as string[]);
    } catch (cause) {
      throw new AsyncStorageOperationError('multiRemove', cause);
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      return [...(await AsyncStorage.getAllKeys())];
    } catch (cause) {
      throw new AsyncStorageOperationError('getAllKeys', cause);
    }
  }

  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (cause) {
      throw new AsyncStorageOperationError('clear', cause);
    }
  }

  flushGetRequests(): void {
    // Only implemented on Android in the underlying library; guard for
    // environments (iOS, web, test doubles) where it's undefined.
    AsyncStorage.flushGetRequests?.();
  }
}
