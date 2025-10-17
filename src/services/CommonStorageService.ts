/**
 * CommonStorageService
 * A simple wrapper around BaseStorageService for quick use
 * Can be used directly or extended for specific entity types
 */

import { BaseStorageService } from './storage/BaseStorageService';
import { StorageConfig } from './storage/types';

/**
 * Generic common storage service
 * Usage:
 * const userStorage = new CommonStorageService<User>({ key_name: 'users' });
 */
export class CommonStorageService<
  T extends Record<string, any>,
> extends BaseStorageService<T> {
  constructor(config: StorageConfig<T>) {
    super(config);
  }

  /**
   * Static method to create an instance quickly
   */
  static create<T extends Record<string, any>>(
    keyName: string,
  ): CommonStorageService<T> {
    return new CommonStorageService<T>({ key_name: keyName });
  }
}

/**
 * Factory function for creating storage services
 */
export function createStorageService<T extends Record<string, any>>(
  keyName: string,
  config?: Partial<StorageConfig<T>>,
): CommonStorageService<T> {
  return new CommonStorageService<T>({
    key_name: keyName,
    ...config,
  });
}

export default CommonStorageService;
