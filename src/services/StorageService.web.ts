import { Project, Task, Evidence, SyncQueue } from '../types';

const DB_NAME = 'MyAppDatabase';
const DB_VERSION = 1;

const STORE_NAMES = {
  PROJECTS: 'projects',
  TASKS: 'tasks',
  EVIDENCE: 'evidence',
  SYNC_QUEUE: 'sync_queue',
};

class IndexedDBHelper {
  private dbPromise: Promise<IDBDatabase> | null = null;

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
        resolve(request.result);
      };

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains(STORE_NAMES.PROJECTS)) {
          db.createObjectStore(STORE_NAMES.PROJECTS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_NAMES.TASKS)) {
          const taskStore = db.createObjectStore(STORE_NAMES.TASKS, {
            keyPath: 'id',
          });
          taskStore.createIndex('projectId', 'projectId', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORE_NAMES.EVIDENCE)) {
          const evidenceStore = db.createObjectStore(STORE_NAMES.EVIDENCE, {
            keyPath: 'id',
          });
          evidenceStore.createIndex('taskId', 'taskId', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORE_NAMES.SYNC_QUEUE)) {
          db.createObjectStore(STORE_NAMES.SYNC_QUEUE);
        }
      };
    });

    return this.dbPromise;
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`Error getting all from ${storeName}:`, error);
      return [];
    }
  }

  async get<T>(storeName: string, key: string): Promise<T | null> {
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`Error getting from ${storeName}:`, error);
      return null;
    }
  }

  async put<T>(storeName: string, value: T, key?: string): Promise<void> {
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = key ? store.put(value, key) : store.put(value);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`Error putting to ${storeName}:`, error);
    }
  }

  async putMany<T>(storeName: string, items: T[]): Promise<void> {
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);

        // Clear existing data first
        store.clear();

        // Add all items
        items.forEach(item => store.put(item));

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (error) {
      console.error(`Error putting many to ${storeName}:`, error);
    }
  }

  async delete(storeName: string, key: string): Promise<void> {
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`Error deleting from ${storeName}:`, error);
    }
  }

  async clear(storeName: string): Promise<void> {
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`Error clearing ${storeName}:`, error);
    }
  }

  async getByIndex<T>(
    storeName: string,
    indexName: string,
    value: string,
  ): Promise<T[]> {
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const index = store.index(indexName);
        const request = index.getAll(value);

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`Error getting by index from ${storeName}:`, error);
      return [];
    }
  }
}

const dbHelper = new IndexedDBHelper();

export class StorageService {
  // Projects
  static async getProjects(): Promise<Project[]> {
    try {
      return await dbHelper.getAll<Project>(STORE_NAMES.PROJECTS);
    } catch (error) {
      console.error('Error getting projects:', error);
      return [];
    }
  }

  static async saveProjects(projects: Project[]): Promise<void> {
    try {
      await dbHelper.putMany(STORE_NAMES.PROJECTS, projects);
    } catch (error) {
      console.error('Error saving projects:', error);
    }
  }

  static async getProject(id: string): Promise<Project | null> {
    try {
      return await dbHelper.get<Project>(STORE_NAMES.PROJECTS, id);
    } catch (error) {
      console.error('Error getting project:', error);
      return null;
    }
  }

  // Tasks
  static async getTasks(projectId?: string): Promise<Task[]> {
    try {
      if (projectId) {
        return await dbHelper.getByIndex<Task>(
          STORE_NAMES.TASKS,
          'projectId',
          projectId,
        );
      }
      return await dbHelper.getAll<Task>(STORE_NAMES.TASKS);
    } catch (error) {
      console.error('Error getting tasks:', error);
      return [];
    }
  }

  static async saveTasks(tasks: Task[]): Promise<void> {
    try {
      await dbHelper.putMany(STORE_NAMES.TASKS, tasks);
    } catch (error) {
      console.error('Error saving tasks:', error);
    }
  }

  static async addTask(task: Task): Promise<void> {
    try {
      await dbHelper.put(STORE_NAMES.TASKS, task);
    } catch (error) {
      console.error('Error adding task:', error);
    }
  }

  static async updateTask(
    taskId: string,
    updates: Partial<Task>,
  ): Promise<void> {
    try {
      const task = await dbHelper.get<Task>(STORE_NAMES.TASKS, taskId);
      if (task) {
        const updatedTask = { ...task, ...updates, updatedAt: new Date() };
        await dbHelper.put(STORE_NAMES.TASKS, updatedTask);
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  }

  // Evidence
  static async getEvidence(taskId: string): Promise<Evidence[]> {
    try {
      return await dbHelper.getByIndex<Evidence>(
        STORE_NAMES.EVIDENCE,
        'taskId',
        taskId,
      );
    } catch (error) {
      console.error('Error getting evidence:', error);
      return [];
    }
  }

  static async addEvidence(evidence: Evidence): Promise<void> {
    try {
      await dbHelper.put(STORE_NAMES.EVIDENCE, evidence);
    } catch (error) {
      console.error('Error adding evidence:', error);
    }
  }

  // Sync Queue
  static async getSyncQueue(): Promise<SyncQueue> {
    try {
      const queue = await dbHelper.get<SyncQueue>(
        STORE_NAMES.SYNC_QUEUE,
        'queue',
      );
      return queue || { tasks: [], evidence: [] };
    } catch (error) {
      console.error('Error getting sync queue:', error);
      return { tasks: [], evidence: [] };
    }
  }

  static async addToSyncQueue(item: Task | Evidence): Promise<void> {
    try {
      const queue = await this.getSyncQueue();
      if ('projectId' in item) {
        queue.tasks.push(item as Task);
      } else {
        queue.evidence.push(item as Evidence);
      }
      await dbHelper.put(STORE_NAMES.SYNC_QUEUE, queue, 'queue');
    } catch (error) {
      console.error('Error adding to sync queue:', error);
    }
  }

  static async clearSyncQueue(): Promise<void> {
    try {
      await dbHelper.put(
        STORE_NAMES.SYNC_QUEUE,
        { tasks: [], evidence: [] },
        'queue',
      );
    } catch (error) {
      console.error('Error clearing sync queue:', error);
    }
  }

  // Get all evidence (not filtered by task)
  static async getAllEvidence(): Promise<Evidence[]> {
    try {
      return await dbHelper.getAll<Evidence>(STORE_NAMES.EVIDENCE);
    } catch (error) {
      console.error('Error getting all evidence:', error);
      return [];
    }
  }

  // Update evidence sync status
  static async updateEvidence(
    evidenceId: string,
    updates: Partial<Evidence>,
  ): Promise<void> {
    try {
      const evidence = await dbHelper.get<Evidence>(
        STORE_NAMES.EVIDENCE,
        evidenceId,
      );
      if (evidence) {
        const updatedEvidence = { ...evidence, ...updates };
        await dbHelper.put(STORE_NAMES.EVIDENCE, updatedEvidence);
      }
    } catch (error) {
      console.error('Error updating evidence:', error);
    }
  }

  // Get all items that need syncing
  static async getItemsNeedingSync(): Promise<{
    tasks: Task[];
    evidence: Evidence[];
  }> {
    try {
      const allTasks = await this.getTasks();
      const allEvidence = await this.getAllEvidence();

      const pendingTasks = allTasks.filter(
        task =>
          task.needsSync ||
          task.syncStatus === 'pending' ||
          task.syncStatus === 'failed',
      );
      const pendingEvidence = allEvidence.filter(
        evidence =>
          evidence.needsSync ||
          evidence.syncStatus === 'pending' ||
          evidence.syncStatus === 'failed',
      );

      return {
        tasks: pendingTasks,
        evidence: pendingEvidence,
      };
    } catch (error) {
      console.error('Error getting items needing sync:', error);
      return { tasks: [], evidence: [] };
    }
  }

  // Get last sync timestamp
  static async getLastSyncTimestamp(): Promise<Date | null> {
    try {
      const syncQueue = await this.getSyncQueue();
      return syncQueue.lastSyncAt ? new Date(syncQueue.lastSyncAt) : null;
    } catch (error) {
      console.error('Error getting last sync timestamp:', error);
      return null;
    }
  }

  // Update last sync timestamp
  static async updateLastSyncTimestamp(): Promise<void> {
    try {
      const queue = await this.getSyncQueue();
      queue.lastSyncAt = new Date();
      await dbHelper.put(STORE_NAMES.SYNC_QUEUE, queue, 'queue');
    } catch (error) {
      console.error('Error updating last sync timestamp:', error);
    }
  }
}
