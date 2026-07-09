import {
  TASK_STATUS,
  PROJECT_STATUS,
  UPLOAD_STATUS,
  TASK_TYPE,
} from '../../constants/app.constant';

export type TaskStatus = (typeof TASK_STATUS)[keyof typeof TASK_STATUS];

export interface ProjectData {
  _id: string;
  solutionId: string;
  title?: string;
  name?: string;
  description: string;
  status: (typeof PROJECT_STATUS)[keyof typeof PROJECT_STATUS];
  progress: number;
  tasks?: Task[];
  metaInformation?: any;
  createdAt: string;
  updatedAt: string;
  children?: Task[];
  categories?: any[];
  userProfile?: any;
  categoryExternalIds?:string[]
}

export interface Task {
  _id: string;
  name: string;
  description?: string;
  type: (typeof TASK_TYPE)[keyof typeof TASK_TYPE];
  status?: TaskStatus;
  isRequired?: boolean;
  isCustomTask?: boolean; // Flag to identify user-created custom tasks
  serviceProvider?: string; // Service provider for custom tasks
  children?: Task[]; // For nested project tasks
  tasks?: Task[]; // For nested project tasks
  attachments?: Attachment[];
  observationFormId?: string;
  metaInformation?: {
    minFiles?: number; // Minimum files required for file-type tasks
    maxFiles?: number; // Maximum files allowed for file-type tasks
    formCompleted?: boolean; // For observation tasks
    [key: string]: any;
    buttonLabel?: string;
  };
  solutionDetails?: any;
  parentId?:string;
  externalId?:string;
  isDeleted?:boolean;
  isDeletable?:boolean;
  excludedTaskIds?:string[];
  noOfEvidenceRequired?: number;
  referenceId?:string
  taskSequence?:string[]
  submissions?:any[]
}

export interface Attachment {
  _id: string;
  /** Original file name exactly as selected by the user — used for display (e.g. "invoice.pdf"). */
  name: string;
  /** Explicit display name — same as `name` for new uploads; preferred over `name` in UI. */
  originalName?: string;
  /** Unique generated file name used for upload, storage, and sync (e.g. "invoice_1751023456789.pdf"). */
  fileName?: string;
  type: string;
  size: number;
  url?: string;
  localPath?: string;
  uploadStatus: (typeof UPLOAD_STATUS)[keyof typeof UPLOAD_STATUS];
  createdAt: string;
}

// Types for render function props
export interface RenderFileInputProps {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  taskType: Task['type'];
  isWeb: boolean;
  handleFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isEdit: boolean;
  isUploading: boolean;
}

export interface RenderStatusIndicatorProps {
  showCheckbox: boolean;
  taskId: string;
  isCompleted: boolean;
  handleCheckboxChange: (checked: boolean) => void;
  isReadOnly: boolean;
  isChildOfProject: boolean;
}

export interface RenderTaskInfoProps {
  showCheckbox: boolean;
  isCompleted: boolean;
  showAsCard: boolean;
  taskName: string;
  taskDescription?: string;
  taskType?: string;
}

export interface RenderActionButtonProps {
  showActionButton: boolean;
  showAsCard: boolean;
  taskType: Task['type'];
  isUploading: boolean;
  handleTaskClick: () => void;
  isReadOnly: boolean;
  isEdit: boolean;
  t: (key: string) => string;
  metaInfo?: any;
}

export interface RenderDividerProps {
  isLastTask: boolean;
  isChildOfProject: boolean;
  isPreview: boolean;
}

export interface RenderCustomTaskActionsProps {
  isCustomTask: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export interface RenderModalsProps {
  modalState: {
    type: 'edit' | 'delete' | null;
    task?: Task;
  };
  onCloseModal: () => void;
  onConfirmDelete: () => void | Promise<void>;
  confirmDeleteLoading?: boolean;
  taskName: string;
  t: (key: string, values?: Record<string, unknown>) => string;
}

export interface createProjectPlanPayload{
  templates: Array<{
    templateId: string;
    targetTaskName?: string;
    targetProjectName?: string;
    customTasks: Array<{
      name: string;
      description: string;
      type: string;
    }>;
  }>;
  userId: string;
  entityId: string;
  programName: string;
  isPrivateProgram: boolean;
  projectConfig: {
    name: string;
    description: string;
  };
  isATargetedSolution: boolean;
}

export interface PathwayReplacementPayload {
  // replacements: Replacement[];
  // replacementReason: string;
  // categoryExternalIds: string[];
  templates:any[]
}
