/**
 * Offline module types
 * Used by downloadService, syncService, dataService, and OfflineSyncContext.
 */

// ---------------------------------------------------------------------------
// Download pipeline types
// ---------------------------------------------------------------------------

export type DownloadModuleKey =
  | 'onboarding'
  | 'participant'
  | 'project'
  | 'tasks'
  | 'observation:logVisit'
  | 'observation:householdProfile'
  | 'observation:individualVisit'
  | 'observation:midline'
  | 'observation:interventionPlan'
  | 'observation:endline';

export interface DownloadConfig {
  participant: boolean;
  project: boolean;
  tasks: boolean;
  observation: {
    logVisit: boolean;
    householdProfile: boolean;
    individualVisit: boolean;
    midline: boolean;
    interventionPlan: boolean;
    endline: boolean;
  };
  files: boolean;
  timestamp: number;
}

export interface DownloadStatus {
  status: 'in_progress' | 'completed' | 'partial' | 'failed';
  /** Known static keys plus dynamic `observation:task:<taskId>` entries */
  completedModules: string[];
  failedModules: string[];
  lastStep: string;
  startedAt: number;
  completedAt?: number;
}

// ---------------------------------------------------------------------------
// Observation form types
// ---------------------------------------------------------------------------

export interface ObservationFormData {
  entityId: string;
  submissionId: string;
  submissionNumber: number;
  /** True observationId from the entities API — may differ from the storage key (solutionId). Used by syncService for the POST path. */
  observationId: string;
  schema: any;
  data: Record<string, any>;
  status: string;
  updatedAt: string;
}

export interface ObservationFormEdits {
  submissionId: string;
  data: Record<string, any>;
  updatedAt: string;
}

export interface OfflineSolutionEntry {
  name:string;
  keyword: string;
  keywords: string[];
  solutionId: string;
  submissionId: string;
  submissionNumber: number;
  observationId: string;
  entityId: string;
}

// ---------------------------------------------------------------------------
// Pending file upload types
// ---------------------------------------------------------------------------

/** One entry in PARTICIPANT_KEYS.filesPending — enough context to upload and patch the task. */
export interface PendingFile {
  /** Task ID that owns this attachment (used as the upload entity). */
  taskId: string;
  /** Original file name as selected by the user. */
  fileName: string;
  /** MIME type needed to reconstruct the File object from the stored base64. */
  fileType: string;
  /**
   * Actual offlineStorage key where the base64 blob is stored.
   * Includes a timestamp suffix to avoid collisions when the same file name is
   * uploaded more than once.  Falls back to the legacy key derived from fileName
   * when absent (entries written before this field was added).
   */
  storageKey?: string;
}

// ---------------------------------------------------------------------------
// Sync types
// ---------------------------------------------------------------------------

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  errors: string[];
}

export interface SyncProgress {
  stage: 'idle' | 'files' | 'forms' | 'tasks' | 'done';
  percentage: number;
  current: number;
  total: number;
}
