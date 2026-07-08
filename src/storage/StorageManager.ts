/**
 * StorageManager — the orchestrator at the heart of SmartStorage.
 *
 * Owns the size-based storage-strategy decision and coordinates the two
 * backends (IKeyValueStorage, IFileStorage). SmartStorage (the public
 * facade) is a thin pass-through to this class — kept separate so the
 * facade can stay a stable, simple API while this class is free to evolve
 * internally.
 *
 * Metadata-envelope handling, the logical-key registry, and the small
 * mutex that serializes registry updates all live here as private
 * concerns (not separate files/classes) — StorageManager is the only
 * component that needs to understand any of them; AsyncStorageManager and
 * FileStorageManager stay pure, metadata-agnostic backend adapters.
 *
 * Every backend dependency is constructor-injected behind an interface
 * (Dependency Inversion), so this class is fully unit-testable without a
 * real AsyncStorage or filesystem.
 */
import type { IKeyValueStorage, IFileStorage, IStorageMetadata } from './types';
import { METADATA_FLAG, METADATA_VERSION } from './types';
import { AsyncStorageManager } from './AsyncStorageManager';
import { FileStorageManager } from './FileStorageManager';
import { serialize, deserialize, tryDeserialize, getByteSize, deepMerge, buildFilePath, buildFolderPath } from './utils';
import { configurationManager, ConfigurationManager } from './Configuration';
import logger from '@utils/logger';

/** Reserved AsyncStorage key SmartStorage persists its own key registry under. */
const REGISTRY_STORAGE_KEY = '__smart_storage_registry__';

/**
 * Minimal async mutex serializing the registry's read-modify-write cycle,
 * so two concurrently-awaited setItem calls can't lose one's registry
 * update to the other (classic lost-update race). Deliberately tiny —
 * a single `runExclusive` entry point is all this class needs.
 */
class AsyncMutex {
  private tail: Promise<unknown> = Promise.resolve();

  runExclusive<T>(task: () => Promise<T>): Promise<T> {
    const result = this.tail.then(task, task);
    this.tail = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }
}

export class StorageManager {
  private readonly registryMutex = new AsyncMutex();

  constructor(
    private readonly kv: IKeyValueStorage = new AsyncStorageManager(),
    private readonly fileStorage: IFileStorage = new FileStorageManager(),
    private readonly config: ConfigurationManager = configurationManager,
  ) {}

  // ---------------------------------------------------------------------
  // Metadata envelope helpers (kept private — only StorageManager needs
  // to understand the concept of a metadata envelope at all)
  // ---------------------------------------------------------------------

  private buildMetadata(path: string, size: number): IStorageMetadata {
    return { [METADATA_FLAG]: true, path, size, updatedAt: new Date().toISOString(), version: METADATA_VERSION };
  }

  /** Parses a raw AsyncStorage string as a metadata envelope, or returns null (not an error) if it isn't one. */
  private tryParseMetadata(raw: string): IStorageMetadata | null {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return null;
    }
    const isMetadata =
      typeof parsed === 'object' &&
      parsed !== null &&
      (parsed as Record<string, unknown>)[METADATA_FLAG] === true &&
      typeof (parsed as Record<string, unknown>).path === 'string';
    return isMetadata ? (parsed as IStorageMetadata) : null;
  }

  // ---------------------------------------------------------------------
  // Key registry helpers — scope clear()/getAllKeys() to keys SmartStorage
  // itself created, since AsyncStorage is shared app-wide (this app already
  // stores hundreds of unrelated keys in it via other services).
  // ---------------------------------------------------------------------

  private async getRegisteredKeys(): Promise<Set<string>> {
    const raw = await this.kv.getItem(REGISTRY_STORAGE_KEY);
    if (!raw) return new Set<string>();
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? new Set<string>(parsed) : new Set<string>();
    } catch {
      return new Set<string>(); // corrupted registry — fail safe, rebuilt from here on
    }
  }

  private async addToRegistry(keys: readonly string[]): Promise<void> {
    return this.registryMutex.runExclusive(async () => {
      const current = await this.getRegisteredKeys();
      let changed = false;
      for (const key of keys) {
        if (!current.has(key)) {
          current.add(key);
          changed = true;
        }
      }
      if (changed) await this.kv.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(Array.from(current)));
    });
  }

  private async removeFromRegistry(keys: readonly string[]): Promise<void> {
    return this.registryMutex.runExclusive(async () => {
      const current = await this.getRegisteredKeys();
      let changed = false;
      for (const key of keys) {
        if (current.delete(key)) changed = true;
      }
      if (changed) await this.kv.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(Array.from(current)));
    });
  }

  // ---------------------------------------------------------------------
  // Read/write resolution shared by the single-key and batched methods
  // ---------------------------------------------------------------------

  /** Turns a raw AsyncStorage string (inline value or metadata envelope) into the caller's original value. */
  private async resolveStoredValue<T>(key: string, raw: string | null): Promise<T | null> {
    if (raw === null) return null;

    const metadata = this.tryParseMetadata(raw);
    if (!metadata) return deserialize<T>(raw);

    try {
      const fileExists = await this.fileStorage.exists(metadata.path);
      if (!fileExists) {
        logger.warn(
          `SmartStorage: metadata for key "${key}" points at a missing file (${metadata.path}) — self-healing by clearing the entry.`,
        );
        await this.removeItem(key);
        return null;
      }
      const fileContent = await this.fileStorage.readFile(metadata.path);
      return deserialize<T>(fileContent);
    } catch (error) {
      logger.error(`SmartStorage: failed to read file-backed value for key "${key}" — treating as absent.`, error);
      return null;
    }
  }

  /** Deletes the backing file for `key` if `raw` is a metadata envelope. Best-effort — never throws. */
  private async deleteBackingFileIfAny(key: string, raw: string | null): Promise<void> {
    if (raw === null) return;
    const metadata = this.tryParseMetadata(raw);
    if (!metadata) return;
    await this.fileStorage.deleteFile(metadata.path).catch(err => {
      logger.warn(`SmartStorage: failed to delete backing file for key "${key}"`, err);
    });
  }

  // ---------------------------------------------------------------------
  // setItem / getItem / removeItem
  // ---------------------------------------------------------------------

  async setItem(key: string, value: unknown): Promise<void> {
    const serialized = serialize(key, value);
    const byteSize = getByteSize(serialized);
    const { maxInlineSize, folderName } = this.config.getConfig();

    if (byteSize > maxInlineSize) {
      const rootDirectory = this.fileStorage.getRootDirectory();
      const filePath = buildFilePath(rootDirectory, folderName, key);
      await this.fileStorage.ensureDirectoryExists(buildFolderPath(rootDirectory, folderName));
      await this.fileStorage.writeFile(filePath, serialized);
      const metadata = this.buildMetadata(filePath, byteSize);
      await this.kv.setItem(key, JSON.stringify(metadata));
    } else {
      // A previous large value at this key would otherwise be orphaned on disk.
      const existingRaw = await this.kv.getItem(key);
      await this.deleteBackingFileIfAny(key, existingRaw);
      await this.kv.setItem(key, serialized);
    }

    await this.addToRegistry([key]);
  }

  async getItem<T = unknown>(key: string): Promise<T | null> {
    const raw = await this.kv.getItem(key);
    return this.resolveStoredValue<T>(key, raw);
  }

  async removeItem(key: string): Promise<void> {
    const raw = await this.kv.getItem(key);
    await this.deleteBackingFileIfAny(key, raw);
    await this.kv.removeItem(key);
    await this.removeFromRegistry([key]);
  }

  // ---------------------------------------------------------------------
  // mergeItem / multiMerge
  // ---------------------------------------------------------------------

  async mergeItem(key: string, value: unknown): Promise<void> {
    const existing = await this.getItem<unknown>(key);
    const incoming = tryDeserialize(value);
    const merged = existing === null ? incoming : deepMerge(existing, incoming);
    await this.setItem(key, merged);
  }

  async multiMerge(keyValuePairs: ReadonlyArray<[string, unknown]>): Promise<void> {
    // Sequential by design: if the same key appears twice, the second merge
    // must see the first's result — matching AsyncStorage's own ordered processing.
    for (const [key, value] of keyValuePairs) {
      await this.mergeItem(key, value);
    }
  }

  // ---------------------------------------------------------------------
  // multiGet / multiSet / multiRemove
  // ---------------------------------------------------------------------

  async multiGet<T = unknown>(keys: readonly string[]): Promise<Array<[string, T | null]>> {
    if (keys.length === 0) return [];
    const rawPairs = await this.kv.multiGet(keys);
    return Promise.all(
      rawPairs.map(async ([key, raw]) => [key, await this.resolveStoredValue<T>(key, raw)] as [string, T | null]),
    );
  }

  async multiSet(keyValuePairs: ReadonlyArray<[string, unknown]>): Promise<void> {
    if (keyValuePairs.length === 0) return;

    const keys = keyValuePairs.map(([key]) => key);
    const existingRawByKey = new Map(await this.kv.multiGet(keys));
    const { maxInlineSize, folderName } = this.config.getConfig();
    const rootDirectory = () => this.fileStorage.getRootDirectory();

    const inlinePairs: Array<[string, string]> = [];
    const fileWriteTasks: Array<Promise<void>> = [];

    for (const [key, value] of keyValuePairs) {
      const serialized = serialize(key, value);
      const byteSize = getByteSize(serialized);

      if (byteSize > maxInlineSize) {
        fileWriteTasks.push(
          (async () => {
            const root = rootDirectory();
            const filePath = buildFilePath(root, folderName, key);
            await this.fileStorage.ensureDirectoryExists(buildFolderPath(root, folderName));
            await this.fileStorage.writeFile(filePath, serialized);
            const metadata = this.buildMetadata(filePath, byteSize);
            inlinePairs.push([key, JSON.stringify(metadata)]);
          })(),
        );
      } else {
        await this.deleteBackingFileIfAny(key, existingRawByKey.get(key) ?? null);
        inlinePairs.push([key, serialized]);
      }
    }

    await Promise.all(fileWriteTasks);
    if (inlinePairs.length > 0) {
      await this.kv.multiSet(inlinePairs);
    }
    await this.addToRegistry(keys);
  }

  async multiRemove(keys: readonly string[]): Promise<void> {
    if (keys.length === 0) return;
    const rawPairs = await this.kv.multiGet(keys);
    await Promise.all(rawPairs.map(([key, raw]) => this.deleteBackingFileIfAny(key, raw)));
    await this.kv.multiRemove(keys);
    await this.removeFromRegistry(keys);
  }

  // ---------------------------------------------------------------------
  // getAllKeys / clear / flushGetRequests
  // ---------------------------------------------------------------------

  /** Returns only the logical keys SmartStorage itself created — never the internal registry key. */
  async getAllKeys(): Promise<string[]> {
    const keys = await this.registryMutex.runExclusive(() => this.getRegisteredKeys());
    return Array.from(keys);
  }

  async clear(): Promise<void> {
    const keys = Array.from(await this.registryMutex.runExclusive(() => this.getRegisteredKeys()));

    if (keys.length > 0) {
      const rawPairs = await this.kv.multiGet(keys);
      await Promise.all(rawPairs.map(([key, raw]) => this.deleteBackingFileIfAny(key, raw)));
      await this.kv.multiRemove(keys);
    }
    await this.registryMutex.runExclusive(() => this.kv.removeItem(REGISTRY_STORAGE_KEY));

    // Belt-and-suspenders: wipe and recreate the whole managed folder so any
    // file that was ever orphaned (e.g. a crash mid-write, before it was
    // registered) is cleaned up too. Non-fatal if unsupported (e.g. web).
    try {
      const { folderName } = this.config.getConfig();
      const root = this.fileStorage.getRootDirectory();
      const folderPath = buildFolderPath(root, folderName);
      await this.fileStorage.deleteDirectory(folderPath);
      await this.fileStorage.ensureDirectoryExists(folderPath);
    } catch (error) {
      logger.warn('SmartStorage: could not reset the storage folder during clear()', error);
    }
  }

  flushGetRequests(): void {
    this.kv.flushGetRequests?.();
  }
}

/** Process-wide instance shared by the default SmartStorage export. */
export const storageManager = new StorageManager();
