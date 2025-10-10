/**
 * FileStorageService - Web
 * Handles Base64 file storage in browser using IndexedDB
 * Files are stored in database named "uploads" with Base64 data
 */

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

const DB_NAME = 'uploads';
const DB_VERSION = 1;
const STORE_NAME = 'files';

class IndexedDBHelper {
  private dbPromise: Promise<IDBDatabase> | null = null;

  /**
   * Initialize IndexedDB
   */
  private initDB(): Promise<IDBDatabase> {
    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Error opening IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        console.log('IndexedDB opened successfully');
        resolve(request.result);
      };

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store for files if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, {
            keyPath: 'id',
          });

          // Create indexes for efficient querying
          objectStore.createIndex('name', 'name', { unique: false });
          objectStore.createIndex('type', 'type', { unique: false });
          objectStore.createIndex('uploadedAt', 'uploadedAt', {
            unique: false,
          });

          console.log('Object store created successfully');
        }
      };
    });

    return this.dbPromise;
  }

  /**
   * Save file to IndexedDB
   */
  async put(file: StoredFile): Promise<void> {
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(file);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error putting file to IndexedDB:', error);
      throw error;
    }
  }

  /**
   * Get file from IndexedDB by ID
   */
  async get(fileId: string): Promise<StoredFile | null> {
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(fileId);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error getting file from IndexedDB:', error);
      return null;
    }
  }

  /**
   * Get all files from IndexedDB
   */
  async getAll(): Promise<StoredFile[]> {
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error getting all files from IndexedDB:', error);
      return [];
    }
  }

  /**
   * Delete file from IndexedDB
   */
  async delete(fileId: string): Promise<void> {
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(fileId);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error deleting file from IndexedDB:', error);
      throw error;
    }
  }

  /**
   * Clear all files from IndexedDB
   */
  async clear(): Promise<void> {
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error clearing IndexedDB:', error);
      throw error;
    }
  }

  /**
   * Count total files
   */
  async count(): Promise<number> {
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.count();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error counting files:', error);
      return 0;
    }
  }
}

const dbHelper = new IndexedDBHelper();

class FileStorageServiceClass {
  /**
   * Save file to IndexedDB with Base64 data
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

      await dbHelper.put(storedFile);

      console.log(`File saved successfully to IndexedDB: ${fileId}`);
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
      const file = await dbHelper.get(fileId);
      if (file) {
        // Ensure uploadedAt is a Date object
        file.uploadedAt = new Date(file.uploadedAt);
      }
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
      await dbHelper.delete(fileId);
      console.log(`File deleted successfully: ${fileId}`);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  /**
   * Get all stored files metadata (without base64 data for performance)
   */
  async getAllFilesMetadata(): Promise<Array<Omit<StoredFile, 'base64Data'>>> {
    try {
      const files = await dbHelper.getAll();
      return files.map(file => {
        const { base64Data, ...metadata } = file;
        return metadata;
      });
    } catch (error) {
      console.error('Error getting files metadata:', error);
      return [];
    }
  }

  /**
   * Get all files with data
   */
  async getAllFiles(): Promise<StoredFile[]> {
    try {
      return await dbHelper.getAll();
    } catch (error) {
      console.error('Error getting all files:', error);
      return [];
    }
  }

  /**
   * Clear all stored files
   */
  async clearAllFiles(): Promise<boolean> {
    try {
      await dbHelper.clear();
      console.log('All files cleared successfully from IndexedDB');
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
   * Get count of stored files
   */
  async getFileCount(): Promise<number> {
    try {
      return await dbHelper.count();
    } catch (error) {
      console.error('Error getting file count:', error);
      return 0;
    }
  }

  /**
   * Convert file to Base64
   */
  async convertFileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  }

  /**
   * Convert blob to Base64
   */
  async convertBlobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = error => reject(error);
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Convert data URL/URI to Base64
   */
  async convertUriToBase64(uri: string): Promise<string | null> {
    try {
      // If it's already a data URL, return it
      if (uri.startsWith('data:')) {
        return uri;
      }

      // If it's a blob URL, fetch and convert
      if (uri.startsWith('blob:')) {
        const response = await fetch(uri);
        const blob = await response.blob();
        return await this.convertBlobToBase64(blob);
      }

      // If it's a regular URL, fetch and convert
      if (uri.startsWith('http://') || uri.startsWith('https://')) {
        const response = await fetch(uri);
        const blob = await response.blob();
        return await this.convertBlobToBase64(blob);
      }

      return null;
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
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Download file from IndexedDB to user's device
   */
  async downloadFile(fileId: string): Promise<boolean> {
    try {
      const file = await this.getFile(fileId);
      if (!file) {
        console.error('File not found');
        return false;
      }

      // Create a download link
      const link = document.createElement('a');
      link.href = file.base64Data;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return true;
    } catch (error) {
      console.error('Error downloading file:', error);
      return false;
    }
  }
}

export const FileStorageService = new FileStorageServiceClass();
