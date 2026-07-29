// Storage abstraction for web (IndexedDB) and native (FileSystem)

const DB_NAME = 'ProjectPlayerDB';
const STORE_NAME = 'projects';

// Initialize IndexedDB (for web)
let _dbPromise: Promise<IDBDatabase> | null = null;

const initDB = (): Promise<IDBDatabase> => {
  if (_dbPromise) return _dbPromise;
  _dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      _dbPromise = null;
      return reject(new Error('IndexedDB not available in this environment'));
    }
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => { _dbPromise = null; reject(request.error); };
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = event => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: '_id' });
      }
    };
  });
  return _dbPromise;
};

// Storage API
export const storage = {
  // Save project data
  saveProject: async (projectData: any): Promise<void> => {
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
      console.error('Error saving project:', error);
      // Fallback to localStorage
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(
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
      console.error('Error getting project:', error);
      // Fallback to localStorage
      const data = localStorage.getItem(`project_${projectId}`);
      return data ? JSON.parse(data) : null;
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
      console.error('Error deleting project:', error);
      // Fallback to localStorage
      localStorage.removeItem(`project_${projectId}`);
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
      console.error('Error getting all projects:', error);
      return [];
    }
  },
};

