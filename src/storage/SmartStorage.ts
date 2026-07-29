/**
 * SmartStorage — public facade.
 *
 * Drop-in replacement for `@react-native-async-storage/async-storage` that
 * transparently spills large values to the filesystem instead of
 * AsyncStorage. Callers never need to know or care which backend a given
 * key ended up in:
 *
 *   await SmartStorage.setItem('assessment', apiResponse);
 *   const data = await SmartStorage.getItem('assessment');
 *   await SmartStorage.removeItem('assessment');
 *
 * This class contains no storage logic itself — it exists purely to give
 * the public API a small, stable surface while StorageManager (the
 * orchestrator) is free to evolve underneath it.
 */
import { StorageManager, storageManager } from './StorageManager';
import { configurationManager } from './Configuration';
import type { ISmartStorageConfig, SmartStorageConfigInput } from './types';

export class SmartStorageClass {
  constructor(private readonly manager: StorageManager = storageManager) {}

  /**
   * Merges `input` over the current configuration. Safe to call at any
   * time — subsequent operations pick up the new config immediately.
   *
   * @example
   * SmartStorage.configure({ maxInlineSize: 200 * 1024, folderName: 'offline-storage' });
   */
  configure(input: SmartStorageConfigInput): void {
    configurationManager.configure(input);
  }

  /** Current, fully-resolved configuration (defaults merged with any configure() calls). */
  getConfig(): Readonly<ISmartStorageConfig> {
    return configurationManager.getConfig();
  }

  /**
   * Stores `value` under `key`. Non-string values are JSON-serialized
   * automatically (strings are stored as-is — never double-stringified).
   * Transparently spills to the filesystem when the serialized size
   * exceeds `maxInlineSize`.
   */
  setItem(key: string, value: unknown): Promise<void> {
    return this.manager.setItem(key, value);
  }

  /**
   * Retrieves the value stored under `key`, transparently reading from
   * disk if it was file-backed. Returns `null` if the key does not exist
   * (or its backing file is missing/corrupted — self-healed by clearing
   * the dangling entry so subsequent reads don't keep re-attempting it).
   */
  getItem<T = unknown>(key: string): Promise<T | null> {
    return this.manager.getItem<T>(key);
  }

  /** Removes `key`, deleting its backing file first if it has one. */
  removeItem(key: string): Promise<void> {
    return this.manager.removeItem(key);
  }

  /** Removes every key SmartStorage has created and clears the managed storage folder. */
  clear(): Promise<void> {
    return this.manager.clear();
  }

  /**
   * Deep-merges `value` into the existing value at `key` (mirrors
   * AsyncStorage.mergeItem: plain objects merge recursively; arrays and
   * primitives in `value` replace the existing value outright). Works
   * transparently whether the existing value is inline or file-backed.
   */
  mergeItem(key: string, value: unknown): Promise<void> {
    return this.manager.mergeItem(key, value);
  }

  /** Batched read. Returns `[key, value]` pairs in the same order as `keys`, regardless of backend. */
  multiGet<T = unknown>(keys: readonly string[]): Promise<Array<[string, T | null]>> {
    return this.manager.multiGet<T>(keys);
  }

  /** Batched write — each pair's storage strategy is determined independently. */
  multiSet(keyValuePairs: ReadonlyArray<[string, unknown]>): Promise<void> {
    return this.manager.multiSet(keyValuePairs);
  }

  /** Batched remove, deleting backing files for any file-backed keys. */
  multiRemove(keys: readonly string[]): Promise<void> {
    return this.manager.multiRemove(keys);
  }

  /** Returns every logical key SmartStorage has created (never exposes the internal registry key or metadata shape). */
  getAllKeys(): Promise<string[]> {
    return this.manager.getAllKeys();
  }

  /** Batched mergeItem, applied in order (later pairs see earlier pairs' results for the same key). */
  multiMerge(keyValuePairs: ReadonlyArray<[string, unknown]>): Promise<void> {
    return this.manager.multiMerge(keyValuePairs);
  }

  /** Mirrors AsyncStorage's Android-only read-batching hint. No-op on platforms without it. */
  flushGetRequests(): void {
    this.manager.flushGetRequests();
  }
}

/** Ready-to-use singleton — the only import most call sites need. */
const SmartStorage = new SmartStorageClass();

export default SmartStorage;
