/**
 * Shared types and interfaces for SmartStorage.
 *
 * Kept in a single file deliberately — the module is small enough that
 * splitting each interface into its own file would add navigation overhead
 * without a real payoff (YAGNI). Split it out only if/when a given section
 * grows large enough to warrant it.
 */

/** Marker field identifying a metadata envelope (as opposed to an inline value) in AsyncStorage. */
export const METADATA_FLAG = '__offline_file__' as const;

/** Bumped whenever the on-disk metadata envelope shape changes, to support future migrations. */
export const METADATA_VERSION = 1;

/**
 * The envelope persisted in AsyncStorage in place of the real value when a
 * key's serialized size exceeds `maxInlineSize`. The real value lives on
 * disk at `path`; this is the only thing ever stored under the caller's key
 * in that case.
 */
export interface IStorageMetadata {
  readonly [METADATA_FLAG]: true;
  /** Absolute path to the JSON file on disk. */
  readonly path: string;
  /** UTF-8 byte size of the serialized value at write time. */
  readonly size: number;
  /** ISO-8601 timestamp of the most recent write. */
  readonly updatedAt: string;
  /** Metadata envelope schema version — for future migrations. */
  readonly version: number;
}

/**
 * Narrow abstraction over a raw string key-value store (what AsyncStorage
 * actually is). StorageManager depends on this interface, not on the
 * concrete `@react-native-async-storage/async-storage` module, so the
 * backend can be swapped or mocked in tests (Dependency Inversion).
 */
export interface IKeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  multiGet(keys: readonly string[]): Promise<Array<[string, string | null]>>;
  multiSet(keyValuePairs: ReadonlyArray<[string, string]>): Promise<void>;
  multiRemove(keys: readonly string[]): Promise<void>;
  getAllKeys(): Promise<string[]>;
  clear(): Promise<void>;
  /** Optional — mirrors AsyncStorage's Android-only batching hint. No-op where unsupported. */
  flushGetRequests?(): void;
}

/**
 * Narrow abstraction over the filesystem operations SmartStorage needs.
 * FileStorageManager implements this over react-native-fs; tests substitute
 * an in-memory fake.
 */
export interface IFileStorage {
  /** Absolute root directory large values are written under (e.g. RNFS.DocumentDirectoryPath). */
  getRootDirectory(): string;
  /** Creates the directory (and intermediate segments) if it doesn't already exist. Idempotent. */
  ensureDirectoryExists(dirPath: string): Promise<void>;
  /** Writes UTF-8 text content to `filePath`, overwriting any existing file. */
  writeFile(filePath: string, content: string): Promise<void>;
  /** Reads UTF-8 text content from `filePath`. Throws FileNotFoundError if absent. */
  readFile(filePath: string): Promise<string>;
  /** Deletes the file at `filePath`. No-op (does not throw) if it does not exist. */
  deleteFile(filePath: string): Promise<void>;
  /** Recursively deletes a directory and everything under it. No-op if it does not exist. */
  deleteDirectory(dirPath: string): Promise<void>;
  /** True if a file or directory exists at the given path. */
  exists(filePath: string): Promise<boolean>;
}

/**
 * Runtime-configurable behavior for SmartStorage. All fields are optional in
 * `configure()` input (a Partial is merged over the current config); this
 * type describes the fully-resolved shape held internally.
 */
export interface ISmartStorageConfig {
  /**
   * Maximum UTF-8 byte size (inclusive) a serialized value may have and
   * still be stored inline in AsyncStorage. Anything larger is written to
   * the filesystem instead. Must be a positive integer.
   */
  maxInlineSize: number;
  /**
   * Name of the subdirectory (under the platform's document directory)
   * that file-backed values are stored in. Must be a non-empty string
   * containing no path separators.
   */
  folderName: string;
  /**
   * Reserved for future use. Compression is not implemented yet — setting
   * this to `true` raises ConfigurationError rather than silently doing
   * nothing, so callers never mistakenly assume it's active.
   */
  enableCompression: boolean;
  /**
   * Reserved for future use. Encryption is not implemented yet — setting
   * this to `true` raises ConfigurationError rather than silently doing
   * nothing.
   */
  enableEncryption: boolean;
}

/** Partial config accepted by `SmartStorage.configure()` — every field optional. */
export type SmartStorageConfigInput = Partial<ISmartStorageConfig>;

/** A single [key, value] tuple as returned by multiGet — mirrors AsyncStorage's shape. */
export type KeyValuePair<T = unknown> = [string, T | null];
