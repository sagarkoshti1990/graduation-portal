/**
 * Holds SmartStorage's runtime configuration. A single instance is shared
 * by the default SmartStorage export; StorageManager reads through this
 * rather than caching config values itself, so `configure()` calls made
 * mid-session take effect immediately for subsequent operations.
 */
import type { ISmartStorageConfig, SmartStorageConfigInput } from './types';
import { ConfigurationError } from './errors';
import { isValidFolderName } from './utils';

export const DEFAULT_MAX_INLINE_SIZE = 200 * 1024; // 200 KiB
export const DEFAULT_FOLDER_NAME = 'offline-storage';

export const DEFAULT_CONFIG: Readonly<ISmartStorageConfig> = Object.freeze({
  maxInlineSize: DEFAULT_MAX_INLINE_SIZE,
  folderName: DEFAULT_FOLDER_NAME,
  enableCompression: false,
  enableEncryption: false,
});

function validate(config: ISmartStorageConfig): void {
  if (!Number.isFinite(config.maxInlineSize) || config.maxInlineSize <= 0) {
    throw new ConfigurationError(`"maxInlineSize" must be a positive number, got ${config.maxInlineSize}.`);
  }
  if (!isValidFolderName(config.folderName)) {
    throw new ConfigurationError(
      `"folderName" must be a non-empty string with no path separators, got "${config.folderName}".`,
    );
  }
  // Compression/encryption are reserved for future use. Fail loudly rather
  // than silently accepting a flag that currently has no effect, so callers
  // never mistake "configured" for "active".
  if (config.enableCompression) {
    throw new ConfigurationError('"enableCompression" is reserved for future use and is not implemented yet.');
  }
  if (config.enableEncryption) {
    throw new ConfigurationError('"enableEncryption" is reserved for future use and is not implemented yet.');
  }
}

export class ConfigurationManager {
  private config: ISmartStorageConfig = { ...DEFAULT_CONFIG };

  configure(input: SmartStorageConfigInput): void {
    const merged: ISmartStorageConfig = { ...this.config, ...input };
    validate(merged);
    this.config = merged;
  }

  getConfig(): Readonly<ISmartStorageConfig> {
    return this.config;
  }

  resetToDefaults(): void {
    this.config = { ...DEFAULT_CONFIG };
  }
}

/** Process-wide configuration instance shared by the default SmartStorage export. */
export const configurationManager = new ConfigurationManager();
