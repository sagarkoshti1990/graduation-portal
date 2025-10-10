import { Project, Task, Evidence, SyncQueue } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  PROJECTS: 'projects',
  TASKS: 'tasks',
  EVIDENCE: 'evidence',
  SYNC_QUEUE: 'sync_queue',
};

export class StorageService {
  // Projects
  static async getProjects(): Promise<Project[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PROJECTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting projects:', error);
      return [];
    }
  }

  static async saveProjects(projects: Project[]): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.PROJECTS,
        JSON.stringify(projects),
      );
    } catch (error) {
      console.error('Error saving projects:', error);
    }
  }

  static async getProject(id: string): Promise<Project | null> {
    try {
      const projects = await this.getProjects();
      return projects.find(p => p.id === id) || null;
    } catch (error) {
      console.error('Error getting project:', error);
      return null;
    }
  }

  // Tasks
  static async getTasks(projectId?: string): Promise<Task[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.TASKS);
      const tasks: Task[] = data ? JSON.parse(data) : [];
      return projectId ? tasks.filter(t => t.projectId === projectId) : tasks;
    } catch (error) {
      console.error('Error getting tasks:', error);
      return [];
    }
  }

  static async saveTasks(tasks: Task[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    } catch (error) {
      console.error('Error saving tasks:', error);
    }
  }

  static async addTask(task: Task): Promise<void> {
    try {
      const tasks = await this.getTasks();
      tasks.push(task);
      await this.saveTasks(tasks);
    } catch (error) {
      console.error('Error adding task:', error);
    }
  }

  static async updateTask(
    taskId: string,
    updates: Partial<Task>,
  ): Promise<void> {
    try {
      const tasks = await this.getTasks();
      const index = tasks.findIndex(t => t.id === taskId);
      if (index !== -1) {
        tasks[index] = { ...tasks[index], ...updates, updatedAt: new Date() };
        await this.saveTasks(tasks);
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  }

  // Evidence
  static async getEvidence(taskId: string): Promise<Evidence[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.EVIDENCE);
      const evidence: Evidence[] = data ? JSON.parse(data) : [];
      return evidence.filter(e => e.taskId === taskId);
    } catch (error) {
      console.error('Error getting evidence:', error);
      return [];
    }
  }

  static async addEvidence(evidence: Evidence): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.EVIDENCE);
      const evidenceList: Evidence[] = data ? JSON.parse(data) : [];
      evidenceList.push(evidence);
      await AsyncStorage.setItem(
        STORAGE_KEYS.EVIDENCE,
        JSON.stringify(evidenceList),
      );
    } catch (error) {
      console.error('Error adding evidence:', error);
    }
  }

  // Sync Queue
  static async getSyncQueue(): Promise<SyncQueue> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
      return data ? JSON.parse(data) : { tasks: [], evidence: [] };
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
      await AsyncStorage.setItem(
        STORAGE_KEYS.SYNC_QUEUE,
        JSON.stringify(queue),
      );
    } catch (error) {
      console.error('Error adding to sync queue:', error);
    }
  }

  static async clearSyncQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.SYNC_QUEUE,
        JSON.stringify({ tasks: [], evidence: [] }),
      );
    } catch (error) {
      console.error('Error clearing sync queue:', error);
    }
  }

  // Get all evidence (not filtered by task)
  static async getAllEvidence(): Promise<Evidence[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.EVIDENCE);
      return data ? JSON.parse(data) : [];
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
      const data = await AsyncStorage.getItem(STORAGE_KEYS.EVIDENCE);
      const evidenceList: Evidence[] = data ? JSON.parse(data) : [];
      const index = evidenceList.findIndex(e => e.id === evidenceId);
      if (index !== -1) {
        evidenceList[index] = { ...evidenceList[index], ...updates };
        await AsyncStorage.setItem(
          STORAGE_KEYS.EVIDENCE,
          JSON.stringify(evidenceList),
        );
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
        task => task.needsSync || task.syncStatus === 'pending' || task.syncStatus === 'failed',
      );
      const pendingEvidence = allEvidence.filter(
        evidence => evidence.needsSync || evidence.syncStatus === 'pending' || evidence.syncStatus === 'failed',
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
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
      const syncQueue: SyncQueue = data
        ? JSON.parse(data)
        : { tasks: [], evidence: [] };
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
      await AsyncStorage.setItem(
        STORAGE_KEYS.SYNC_QUEUE,
        JSON.stringify(queue),
      );
    } catch (error) {
      console.error('Error updating last sync timestamp:', error);
    }
  }
}
