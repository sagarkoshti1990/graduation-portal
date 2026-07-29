/**
 * Custom error hierarchy for SmartStorage.
 *
 * Every failure mode SmartStorage can encounter is represented by a typed
 * subclass so callers can `instanceof`-check and react appropriately.
 * SmartStorage itself never lets these escape as uncaught rejections from a
 * read path — see StorageManager for where each is caught/self-healed.
 */

export type SmartStorageErrorCode =
  | 'SERIALIZATION_ERROR'
  | 'FILE_WRITE_ERROR'
  | 'FILE_READ_ERROR'
  | 'FILE_DELETE_ERROR'
  | 'FILE_NOT_FOUND'
  | 'DIRECTORY_ERROR'
  | 'DISK_FULL'
  | 'PERMISSION_DENIED'
  | 'ASYNC_STORAGE_ERROR'
  | 'UNSUPPORTED_PLATFORM'
  | 'CONFIGURATION_ERROR';

export class SmartStorageError extends Error {
  public readonly code: SmartStorageErrorCode;
  public readonly cause?: unknown;

  constructor(code: SmartStorageErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'SmartStorageError';
    this.code = code;
    this.cause = cause;
    // Restore prototype chain (TS -> ES5 target transpilation quirk).
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class SerializationError extends SmartStorageError {
  constructor(key: string, cause?: unknown) {
    super('SERIALIZATION_ERROR', `SmartStorage: failed to serialize value for key "${key}".`, cause);
    this.name = 'SerializationError';
  }
}

export class FileWriteError extends SmartStorageError {
  constructor(path: string, cause?: unknown) {
    super('FILE_WRITE_ERROR', `SmartStorage: failed to write file at "${path}".`, cause);
    this.name = 'FileWriteError';
  }
}

export class FileReadError extends SmartStorageError {
  constructor(path: string, cause?: unknown) {
    super('FILE_READ_ERROR', `SmartStorage: failed to read file at "${path}".`, cause);
    this.name = 'FileReadError';
  }
}

export class FileDeleteError extends SmartStorageError {
  constructor(path: string, cause?: unknown) {
    super('FILE_DELETE_ERROR', `SmartStorage: failed to delete file at "${path}".`, cause);
    this.name = 'FileDeleteError';
  }
}

export class FileNotFoundError extends SmartStorageError {
  constructor(path: string) {
    super('FILE_NOT_FOUND', `SmartStorage: file not found at "${path}".`);
    this.name = 'FileNotFoundError';
  }
}

export class DirectoryError extends SmartStorageError {
  constructor(path: string, cause?: unknown) {
    super('DIRECTORY_ERROR', `SmartStorage: failed to create/access directory "${path}".`, cause);
    this.name = 'DirectoryError';
  }
}

export class DiskFullError extends SmartStorageError {
  constructor(path: string, cause?: unknown) {
    super('DISK_FULL', `SmartStorage: insufficient disk space while writing "${path}".`, cause);
    this.name = 'DiskFullError';
  }
}

export class PermissionDeniedError extends SmartStorageError {
  constructor(path: string, cause?: unknown) {
    super('PERMISSION_DENIED', `SmartStorage: permission denied accessing "${path}".`, cause);
    this.name = 'PermissionDeniedError';
  }
}

export class AsyncStorageOperationError extends SmartStorageError {
  constructor(operation: string, cause?: unknown) {
    super('ASYNC_STORAGE_ERROR', `SmartStorage: AsyncStorage operation "${operation}" failed.`, cause);
    this.name = 'AsyncStorageOperationError';
  }
}

export class UnsupportedPlatformError extends SmartStorageError {
  constructor(feature: string) {
    super('UNSUPPORTED_PLATFORM', `SmartStorage: "${feature}" is not supported on this platform.`);
    this.name = 'UnsupportedPlatformError';
  }
}

export class ConfigurationError extends SmartStorageError {
  constructor(message: string) {
    super('CONFIGURATION_ERROR', `SmartStorage configuration error: ${message}`);
    this.name = 'ConfigurationError';
  }
}

/** Wraps an unknown thrown value into a classified SmartStorageError, preserving the original as `cause`. */
export function classifyFileSystemError(
  path: string,
  operation: 'write' | 'read' | 'delete' | 'mkdir',
  cause: unknown,
): SmartStorageError {
  const message = cause instanceof Error ? cause.message.toLowerCase() : String(cause).toLowerCase();

  if (message.includes('enospc') || message.includes('disk full') || message.includes('no space')) {
    return new DiskFullError(path, cause);
  }
  if (message.includes('eacces') || message.includes('permission denied') || message.includes('eperm')) {
    return new PermissionDeniedError(path, cause);
  }
  if (operation === 'mkdir') return new DirectoryError(path, cause);
  if (operation === 'write') return new FileWriteError(path, cause);
  if (operation === 'delete') return new FileDeleteError(path, cause);
  return new FileReadError(path, cause);
}
