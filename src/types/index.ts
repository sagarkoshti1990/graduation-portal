export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'not-enrolled' | 'enrolled' | 'in-progress' | 'completed';
  progress: number;
  tasks: Task[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  dueDate?: Date;
  status: 'pending' | 'completed';
  evidence?: Evidence[];
  createdAt: Date;
  updatedAt: Date;
  isOffline?: boolean;
  needsSync?: boolean;
  syncStatus?: 'pending' | 'syncing' | 'synced' | 'failed';
  lastSyncedAt?: Date;
  syncError?: string;
}

export interface Evidence {
  id: string;
  taskId: string;
  type: 'photo' | 'document' | 'file';
  fileName: string;
  filePath: string;
  uploadedAt: Date;
  isOffline?: boolean;
  needsSync?: boolean;
  syncStatus?: 'pending' | 'syncing' | 'synced' | 'failed';
  lastSyncedAt?: Date;
  syncError?: string;
}

export interface SyncQueue {
  tasks: Task[];
  evidence: Evidence[];
  lastSyncAt?: Date;
}

export interface SyncStatusData {
  totalItems: number;
  pendingItems: number;
  syncedItems: number;
  failedItems: number;
  tasks: Task[];
  evidence: Evidence[];
  isOnline: boolean;
  lastSyncAt?: Date;
}

export interface SyncResult {
  success: boolean;
  syncedTasks: number;
  syncedEvidence: number;
  failedTasks: string[];
  failedEvidence: string[];
  errors: string[];
}

export interface NetworkStatus {
  isConnected: boolean;
  type: string;
}
