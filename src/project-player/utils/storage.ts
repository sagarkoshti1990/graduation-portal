// Storage abstraction for web (IndexedDB) and native (FileSystem)
import logger from '@utils/logger';
const DB_NAME = 'ProjectPlayerDB';
const STORE_NAME = 'projects';

// Initialize IndexedDB (for web)
const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not available in this environment'));
    }
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = event => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: '_id' });
      }
    };
  });
};

// Storage API
export const storage = {
  // Save project data
  saveProject: async (projectData: { _id: string } & Record<string, unknown>): Promise<void> => {
    try {
      const db = await initDB();
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.put(projectData);

      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (error) {
      logger.error('Error saving project:', error);
      // Fallback to localStorage only if available (avoid masking IndexedDB error)
      if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
        window.localStorage.setItem(
          `project_${projectData._id}`,
          JSON.stringify(projectData),
        );
      }
    }
  },

  // Get project data
  getProject: async (projectId: string): Promise<any | null> => {
    try {
      const db = await initDB();
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(projectId);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      logger.error('Error getting project:', error);
      // Fallback to localStorage only if available (avoid masking IndexedDB error)
      if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
        const data = window.localStorage.getItem(`project_${projectId}`);
        return data ? JSON.parse(data) : null;
      }
      return null;
    }
  },

  // Delete project data
  deleteProject: async (projectId: string): Promise<void> => {
    try {
      const db = await initDB();
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.delete(projectId);

      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (error) {
      logger.error('Error deleting project:', error);
      // Fallback to localStorage only if available (avoid masking IndexedDB error)
      if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
        window.localStorage.removeItem(`project_${projectId}`);
      }
    }
  },

  // Get all projects
  getAllProjects: async (): Promise<any[]> => {
    try {
      const db = await initDB();
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      logger.error('Error getting all projects:', error);
      if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
        return [];
      }
      return Object.keys(window.localStorage)
        .filter(key => key.startsWith('project_'))
        .flatMap(key => {
          const raw = window.localStorage.getItem(key);
          if (!raw) return [];
          try {
            return [JSON.parse(raw)];
          } catch {
            return [];
          }
        });
    }
  },
};

