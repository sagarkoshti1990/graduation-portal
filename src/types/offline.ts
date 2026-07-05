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
  /** Unix-ms timestamp recorded when this observation was downloaded for offline use.
   *  Used by syncValidationService to detect when the server copy was updated after download. */
  downloadedAt?: number;
}

export interface ObservationFormEdits {
  answers:any;
  endTime:number;
  externalId:string;
  isSubmitted:boolean;
  startTime:number;
  status:string;
  solutionId:string;
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
  taskId?: string;
  /** Original file name exactly as selected by the user — used only for display (e.g. "invoice.pdf"). */
  originalName: string;
  /**
   * Unique generated file name used for upload, storage, and sync matching
   * (e.g. "invoice_1751023456789.pdf").  Legacy entries written before this
   * field was introduced store the original name here; the presence of
   * `originalName` distinguishes new entries from legacy ones.
   */
  fileName: string;
  /** MIME type needed to reconstruct the File object from the stored base64. */
  fileType: string;
  /**
   * Actual offlineStorage key where the base64 blob is stored.
   * Falls back to the legacy key derived from fileName when absent
   * (entries written before this field was added).
   */
  storageKey?: string;
  /**
   * Native only — local filesystem path where the file content was written
   * (react-native-blob-util), used instead of `storageKey` so the base64
   * never has to be stored in AsyncStorage. When present, sync reads the
   * file from this path and deletes it after a successful upload.
   */
  localFilePath?: string;
  /**
   * True when the file belongs to an onboarding task.  When set, the sync
   * stage calls updateEntityDetails / createOrUpdateProgramUserMapping after
   * the upload succeeds — mirroring what updateEntityFile does in the online flow.
   */
  isOnboardingTask?: boolean;
  /**
   * task.referenceId at queue time — used by buildOnboardingFileUpdate to
   * determine which entity fields to update (consent vs SLA).
   */
  taskReferenceId?: string;

  // for observation files 
  submissionId?: string;
  solutionId?: string;
  fieldId?: string;
  mimeType?: string;
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
