/**
 * FileStorageService - Mobile (React Native)
 * Handles Base64 file storage on mobile devices using AsyncStorage
 * Files are stored with their metadata and can be retrieved by ID
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export interface StoredFile {
  id: string;
  name: string;
  type: string;
  size: number;
  base64Data: string;
  uploadedAt: Date;
  metadata?: Record<string, any>;
}

export interface FileStorageResult {
  success: boolean;
  fileId?: string;
  error?: string;
}

const STORAGE_PREFIX = 'file_storage_';
const METADATA_KEY = 'file_storage_metadata';

class FileStorageServiceClass {
  /**
   * Save file to AsyncStorage with Base64 data
   */
  async saveFile(
    base64Data: string,
    fileName: string,
    fileType: string,
    fileSize: number,
    metadata?: Record<string, any>,
  ): Promise<FileStorageResult> {
    try {
      const fileId = this.generateFileId();

      const storedFile: StoredFile = {
        id: fileId,
        name: fileName,
        type: fileType,
        size: fileSize,
        base64Data,
        uploadedAt: new Date(),
        metadata,
      };

      // Save file data
      await AsyncStorage.setItem(
        `${STORAGE_PREFIX}${fileId}`,
        JSON.stringify(storedFile),
      );

      // Update metadata index
      await this.updateMetadataIndex(fileId, {
        id: fileId,
        name: fileName,
        type: fileType,
        size: fileSize,
        uploadedAt: storedFile.uploadedAt,
      });

      console.log(`File saved successfully: ${fileId}`);
      return { success: true, fileId };
    } catch (error) {
      console.error('Error saving file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save file',
      };
    }
  }

  /**
   * Retrieve file by ID
   */
  async getFile(fileId: string): Promise<StoredFile | null> {
    try {
      const data = await AsyncStorage.getItem(`${STORAGE_PREFIX}${fileId}`);
      if (!data) {
        return null;
      }

      const file: StoredFile = JSON.parse(data);
      // Convert uploadedAt back to Date object
      file.uploadedAt = new Date(file.uploadedAt);
      return file;
    } catch (error) {
      console.error('Error retrieving file:', error);
      return null;
    }
  }

  /**
   * Delete file by ID
   */
  async deleteFile(fileId: string): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(`${STORAGE_PREFIX}${fileId}`);
      await this.removeFromMetadataIndex(fileId);
      console.log(`File deleted successfully: ${fileId}`);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  /**
   * Get all stored files metadata (without base64 data)
   */
  async getAllFilesMetadata(): Promise<Array<Omit<StoredFile, 'base64Data'>>> {
    try {
      const metadataJson = await AsyncStorage.getItem(METADATA_KEY);
      if (!metadataJson) {
        return [];
      }
      return JSON.parse(metadataJson);
    } catch (error) {
      console.error('Error getting files metadata:', error);
      return [];
    }
  }

  /**
   * Clear all stored files
   */
  async clearAllFiles(): Promise<boolean> {
    try {
      const metadata = await this.getAllFilesMetadata();
      const deletePromises = metadata.map(file =>
        AsyncStorage.removeItem(`${STORAGE_PREFIX}${file.id}`),
      );
      await Promise.all(deletePromises);
      await AsyncStorage.removeItem(METADATA_KEY);
      console.log('All files cleared successfully');
      return true;
    } catch (error) {
      console.error('Error clearing files:', error);
      return false;
    }
  }

  /**
   * Get total storage size used
   */
  async getStorageSize(): Promise<number> {
    try {
      const metadata = await this.getAllFilesMetadata();
      return metadata.reduce((total, file) => total + file.size, 0);
    } catch (error) {
      console.error('Error calculating storage size:', error);
      return 0;
    }
  }

  /**
   * Convert file URI to Base64 (for mobile files)
   */
  async convertUriToBase64(uri: string): Promise<string | null> {
    try {
      // For mobile, if the URI is already a data URL, return it
      if (uri.startsWith('data:')) {
        return uri;
      }

      // For file:// URIs, we need to read the file
      // This requires react-native-fs or similar library
      // For now, return the URI as-is (it should already be base64 from image picker)
      console.warn('URI conversion not fully implemented for mobile');
      return uri;
    } catch (error) {
      console.error('Error converting URI to Base64:', error);
      return null;
    }
  }

  /**
   * Generate unique file ID
   */
  private generateFileId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Update metadata index
   */
  private async updateMetadataIndex(
    fileId: string,
    metadata: Omit<StoredFile, 'base64Data' | 'metadata'>,
  ): Promise<void> {
    try {
      const allMetadata = await this.getAllFilesMetadata();
      allMetadata.push(metadata);
      await AsyncStorage.setItem(METADATA_KEY, JSON.stringify(allMetadata));
    } catch (error) {
      console.error('Error updating metadata index:', error);
    }
  }

  /**
   * Remove from metadata index
   */
  private async removeFromMetadataIndex(fileId: string): Promise<void> {
    try {
      const allMetadata = await this.getAllFilesMetadata();
      const filtered = allMetadata.filter(file => file.id !== fileId);
      await AsyncStorage.setItem(METADATA_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error removing from metadata index:', error);
    }
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}

export const FileStorageService = new FileStorageServiceClass();
