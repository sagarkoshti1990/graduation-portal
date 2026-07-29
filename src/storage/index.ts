/**
 * Public entry point for the SmartStorage module.
 *
 *   import SmartStorage from '@/storage';
 *   await SmartStorage.setItem('assessment', data);
 *
 * Everything else here is exported for advanced use (custom error handling,
 * testing with a custom StorageManager, etc.) — the default export alone is
 * a complete AsyncStorage-compatible API.
 */
import SmartStorage from './SmartStorage';

export default SmartStorage;

export { SmartStorageClass } from './SmartStorage';
export { StorageManager, storageManager } from './StorageManager';
export { AsyncStorageManager } from './AsyncStorageManager';
export { FileStorageManager } from './FileStorageManager';
export { ConfigurationManager, configurationManager, DEFAULT_CONFIG } from './Configuration';

export type {
  IKeyValueStorage,
  IFileStorage,
  IStorageMetadata,
  ISmartStorageConfig,
  SmartStorageConfigInput,
  KeyValuePair,
} from './types';
export { METADATA_FLAG, METADATA_VERSION } from './types';

export {
  SmartStorageError,
  SerializationError,
  FileWriteError,
  FileReadError,
  FileDeleteError,
  FileNotFoundError,
  DirectoryError,
  DiskFullError,
  PermissionDeniedError,
  AsyncStorageOperationError,
  UnsupportedPlatformError,
  ConfigurationError,
} from './errors';
export type { SmartStorageErrorCode } from './errors';
