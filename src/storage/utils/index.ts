/**
 * Stateless utility functions shared by StorageManager: serialization,
 * UTF-8 byte sizing, AsyncStorage-compatible deep merge, and deterministic
 * file-path construction. Grouped in one file since each function is small
 * and none carries independent state — splitting them into separate files
 * would add navigation overhead without a real payoff.
 */
import { SerializationError } from '../errors';

// ---------------------------------------------------------------------------
// Serialization
//
// Convention deliberately matches this codebase's existing
// `src/services/offlineStorage.ts`: strings pass through untouched (never
// double-stringified/quoted), everything else is JSON.stringify'd on write;
// on read, JSON.parse is attempted first and a parse failure falls back to
// returning the raw string. This keeps SmartStorage's format compatible
// with how the rest of the app already reasons about stored values.
//
// Known trade-off (inherited from the existing convention, not new here): a
// string value that itself happens to be valid JSON (e.g. the literal text
// "123") will be parsed back into its JSON type rather than returned as the
// original literal. Values that must round-trip as opaque strings should be
// wrapped by the caller (e.g. `{ raw: "123" }`).
// ---------------------------------------------------------------------------

/** Serializes an arbitrary value to a string for storage. Strings pass through as-is. */
export function serialize(key: string, value: unknown): string {
  if (typeof value === 'string') return value;
  try {
    const result = JSON.stringify(value);
    // JSON.stringify returns `undefined` (not the string "undefined") for
    // undefined/functions/symbols — treat as an explicit failure rather
    // than silently persisting the string "undefined".
    if (result === undefined) {
      throw new Error(`Value of type "${typeof value}" is not JSON-serializable`);
    }
    return result;
  } catch (cause) {
    throw new SerializationError(key, cause);
  }
}

/** Deserializes a stored string back to its original shape, falling back to the raw string if it isn't JSON. */
export function deserialize<T = unknown>(raw: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return raw as unknown as T;
  }
}

/**
 * Best-effort deserialize for mergeItem's incoming `value`, which per the
 * AsyncStorage contract is a JSON string but which SmartStorage also
 * accepts as a raw value for ergonomics. Never throws.
 */
export function tryDeserialize(raw: unknown): unknown {
  if (typeof raw !== 'string') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

/**
 * UTF-8 byte length of a string. Uses TextEncoder when available (Hermes,
 * JSC, all modern web engines) and falls back to manual UTF-16 -> UTF-8
 * counting otherwise (e.g. stripped-down test environments).
 */
export function getByteSize(str: string): number {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(str).length;
  }
  let bytes = 0;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code <= 0x7f) {
      bytes += 1;
    } else if (code <= 0x7ff) {
      bytes += 2;
    } else if (code >= 0xd800 && code <= 0xdbff) {
      bytes += 4; // surrogate pair -> one 4-byte UTF-8 code point
      i++;
    } else {
      bytes += 3;
    }
  }
  return bytes;
}

// ---------------------------------------------------------------------------
// Deep merge (mirrors AsyncStorage.mergeItem semantics)
// ---------------------------------------------------------------------------

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

/**
 * Plain objects merge recursively key-by-key; arrays and primitives in
 * `incoming` replace the corresponding existing value outright (never
 * concatenated/element-merged) — matching AsyncStorage's native behavior.
 */
export function deepMerge<T>(existing: T, incoming: unknown): T {
  if (incoming === undefined) return existing;
  if (existing === null || existing === undefined) return incoming as T;

  if (isPlainObject(existing) && isPlainObject(incoming)) {
    const result: Record<string, unknown> = { ...existing };
    for (const key of Object.keys(incoming)) {
      result[key] = deepMerge(existing[key], incoming[key]);
    }
    return result as T;
  }

  return incoming as T;
}

// ---------------------------------------------------------------------------
// Deterministic, collision-resistant file paths
//
// Keys in this app routinely contain characters unsafe/ambiguous in file
// names (e.g. "participant:userId:id:project:x" contains colons). Naive
// sanitizing (replacing unsafe characters with "_") is lossy and can make
// two distinct keys collide on the same file name. Each file name instead
// embeds a deterministic FNV-1a hash of the *original* key, with a short
// sanitized prefix kept only for human debuggability.
// ---------------------------------------------------------------------------

const MAX_FILENAME_PREFIX_LENGTH = 40;

/** FNV-1a 32-bit hash — fast, dependency-free, stable across platforms/engines. */
/* eslint-disable no-bitwise -- bitwise ops are intrinsic to the FNV-1a algorithm */
function fnv1aHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = (hash + (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24)) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}
/* eslint-enable no-bitwise */

function sanitizeFileNamePrefix(key: string): string {
  const sanitized = key.replace(/[^a-zA-Z0-9._-]/g, '_');
  return sanitized.length > MAX_FILENAME_PREFIX_LENGTH ? sanitized.slice(0, MAX_FILENAME_PREFIX_LENGTH) : sanitized;
}

/** Absolute path to the SmartStorage-managed folder, e.g. `.../Documents/offline-storage`. */
export function buildFolderPath(rootDirectory: string, folderName: string): string {
  return `${rootDirectory}/${folderName}`;
}

/** Deterministic, collision-resistant file path a given logical key's large value is/would be stored at. */
export function buildFilePath(rootDirectory: string, folderName: string, key: string): string {
  const fileName = `${sanitizeFileNamePrefix(key)}_${fnv1aHash(key)}.json`;
  return `${buildFolderPath(rootDirectory, folderName)}/${fileName}`;
}

/** Validates a folder name contains no path separators or traversal segments. */
export function isValidFolderName(folderName: string): boolean {
  if (!folderName || typeof folderName !== 'string') return false;
  if (folderName.includes('/') || folderName.includes('\\')) return false;
  if (folderName === '.' || folderName === '..') return false;
  return true;
}
