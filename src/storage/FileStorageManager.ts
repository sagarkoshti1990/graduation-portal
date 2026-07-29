/**
 * Adapter implementing IFileStorage over `react-native-fs`.
 *
 * react-native-fs is a native-only module with no web implementation. This
 * app targets React Native *and* React Native Web from the same source
 * tree, so `react-native-fs` is loaded via a guarded dynamic `require`
 * (never a static top-level import) — mirroring the exact technique this
 * codebase already uses for `react-native-blob-util` in
 * `src/services/fileStorageService.ts` — so the web bundler never attempts
 * to resolve it. On web, every method throws UnsupportedPlatformError
 * instead of touching the module at all; callers (StorageManager) only
 * reach these methods when a value actually needs file-backed storage, so
 * apps that stay under `maxInlineSize` are unaffected on web.
 */
import { Platform } from 'react-native';
import type { IFileStorage } from './types';
import { FileNotFoundError, UnsupportedPlatformError, classifyFileSystemError } from './errors';

/** Subset of react-native-fs's API surface this module actually uses. */
interface RNFSModule {
  DocumentDirectoryPath: string;
  mkdir(filepath: string): Promise<void>;
  exists(filepath: string): Promise<boolean>;
  writeFile(filepath: string, contents: string, encoding?: string): Promise<void>;
  readFile(filepath: string, encoding?: string): Promise<string>;
  unlink(filepath: string): Promise<void>;
}

export class FileStorageManager implements IFileStorage {
  private rnfs: RNFSModule | null = null;

  /** Lazily requires react-native-fs — never evaluated on web (see class doc). */
  private getRNFS(): RNFSModule {
    if (Platform.OS === 'web') {
      throw new UnsupportedPlatformError('file-backed storage');
    }
    if (!this.rnfs) {
      this.rnfs = require('react-native-fs') as RNFSModule;
    }
    return this.rnfs;
  }

  getRootDirectory(): string {
    return this.getRNFS().DocumentDirectoryPath;
  }

  async ensureDirectoryExists(dirPath: string): Promise<void> {
    const rnfs = this.getRNFS();
    try {
      const alreadyExists = await rnfs.exists(dirPath);
      if (!alreadyExists) {
        await rnfs.mkdir(dirPath);
      }
    } catch (cause) {
      throw classifyFileSystemError(dirPath, 'mkdir', cause);
    }
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    const rnfs = this.getRNFS();
    try {
      await rnfs.writeFile(filePath, content, 'utf8');
    } catch (cause) {
      throw classifyFileSystemError(filePath, 'write', cause);
    }
  }

  async readFile(filePath: string): Promise<string> {
    const rnfs = this.getRNFS();
    try {
      const fileExists = await rnfs.exists(filePath);
      if (!fileExists) {
        throw new FileNotFoundError(filePath);
      }
      return await rnfs.readFile(filePath, 'utf8');
    } catch (cause) {
      if (cause instanceof FileNotFoundError) throw cause;
      throw classifyFileSystemError(filePath, 'read', cause);
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    const rnfs = this.getRNFS();
    try {
      const fileExists = await rnfs.exists(filePath);
      if (!fileExists) return; // Already gone — not an error.
      await rnfs.unlink(filePath);
    } catch (cause) {
      throw classifyFileSystemError(filePath, 'delete', cause);
    }
  }

  async deleteDirectory(dirPath: string): Promise<void> {
    const rnfs = this.getRNFS();
    try {
      const dirExists = await rnfs.exists(dirPath);
      if (!dirExists) return;
      // react-native-fs's unlink recursively removes directories and their contents.
      await rnfs.unlink(dirPath);
    } catch (cause) {
      throw classifyFileSystemError(dirPath, 'delete', cause);
    }
  }

  async exists(filePath: string): Promise<boolean> {
    const rnfs = this.getRNFS();
    try {
      return await rnfs.exists(filePath);
    } catch (cause) {
      throw classifyFileSystemError(filePath, 'read', cause);
    }
  }
}
