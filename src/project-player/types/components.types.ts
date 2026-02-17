import { Task, ProjectData, Attachment, TaskStatus } from './project.types';

// ============================================
// TASK COMPONENT PROPS
// ============================================

export interface TaskCardProps {
  task: Task;
  level?: number;
  isLastTask?: boolean;
  isChildOfProject?: boolean;
  isOnboardingTask?: boolean;
}

export interface TaskStatusProps {
  status: TaskStatus;
  isReadOnly: boolean;
  onStatusChange?: (status: TaskStatus) => void;
}

export interface TaskAccordionProps {
  task: Task;
  level?: number;
  showAccordionWrapper?: boolean;
}

export interface TaskComponentProps {
  task: Task;
  level?: number;
  isLastTask?: boolean;
  isChildOfProject?: boolean;
  isOnboardingTask?: boolean;
  showAccordionWrapper?: boolean;
}

export interface UploadComponentProps {
  taskId: string;
  attachments?: Attachment[];
}

export interface ObservationPopupFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  formId: string;
}

// ============================================
// PROJECT COMPONENT PROPS
// ============================================

export interface ProjectInfoCardProps {
  project: ProjectData;
}

export interface ProjectAsTaskComponentProps {
  task: Task;
  level?: number;
  showAccordionWrapper?: boolean;
}

export interface ProjectContextValue {
  projectData: ProjectData | null;
  isLoading: boolean;
  error: Error | null;
  mode: 'preview' | 'edit' | 'read-only';
  config: ProjectPlayerConfig; // Full config object

  // Actions
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  updateProjectInfo: (updates: Partial<ProjectData>) => void;
  addTask: (pillarId: string, task: Task) => void; // Updated signature
  deleteTask: (taskId: string) => void;
  saveLocal: () => void;
  syncToServer: () => Promise<void>;
  addedToPlanTaskIds: string[];
  setTaskAddedToPlan: (taskId: string, added: boolean) => void;
  taskPlanActionPerformedIds: string[];
  setTaskPlanActionPerformed: (taskId: string) => void;
  onTaskUpdate?: (task: Task) => void;
}

export interface ProjectProviderProps {
  children: React.ReactNode;
  config: ProjectPlayerConfig;
  initialData: ProjectData | null;
  onTaskUpdate?: (task: Task) => void;
}

// ============================================
// MAIN COMPONENT PROPS
// ============================================

export interface ProjectPlayerConfig {
  mode: 'preview' | 'edit' | 'read-only';
  solutionId?: string;
  projectId?: string;
  permissions?: {
    canEdit: boolean;
    canAddTask: boolean;
    canDelete: boolean;
  };
  maxFileSize?: number; // in MB
  baseUrl?: string;
  accessToken?: any;
  language?: string;
  showAddCustomTaskButton?: boolean; // Config to show/hide AddCustomTask button
  showSubmitButton?: boolean; // Config to show/hide Submit Intervention Plan button
  onSubmitInterventionPlan?: (projectId?: string) => void; // Callback for Submit Intervention Plan button
  onChangePathway?: () => void; // Callback for Change Pathway button
  isSubmitDisabled?: boolean; // Disable submit button until conditions are met
  submitWarningMessage?: string; // Warning message to show when submit is disabled
  profileInfo?: {
    id: number | string;
    name: string;
    email?: string;
    role?: string;
    [key: string]: any;
  };
  redirectionLinks?: {
    unauthorizedRedirectUrl?: string;
    // loginRedirectUrl?: string;
    // homeRedirectUrl?: string;
    [key: string]: any;
  };
}

export interface ProjectPlayerData {
  solutionId?: string;
  projectId?: string;
  entityId?: string;
  userStatus?: string;
  data?: ProjectData;
  categoryIds?: string[]; // Array of category IDs (pillar IDs without categories + selected subcategory IDs)
  selectedPathway?: string;
  pillarCategoryRelation?: any;
  province?:string;
}

export interface ProjectPlayerProps {
  config: ProjectPlayerConfig;
  data?: ProjectPlayerData;
  projectData?: any; // as per mock data json
  onTaskUpdate?: (task: Task) => void;
  onTaskCompletionChange?: (areAllCompleted: boolean) => void; // Callback when task completion status changes
  onProgressChange?: (progress: number) => void; // Callback for progress updates
}

// ============================================
// API TYPES
// ============================================

export interface ApiResponse<T> {
  data: T;
  error?: string;
}

export interface AddCustomTaskProps {
  templateId?: string;
  templateName?: string;
}

export interface AddCustomTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task; // If provided, we're in edit mode
  templateId?: string;
  templateName?: string;
  mode?: 'add' | 'edit';
}

// ============================================
// MODAL COMPONENT PROPS
// ============================================

// Attachment interface for evidence preview (extended from base Attachment)
export interface EvidenceAttachment {
  _id?: string;
  name: string;
  url?: string;
  type?: string;
  uploadedBy?: string;
  uploadedAt?: string;
  size?: number;
}

export interface EvidencePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskName: string;
  attachments: EvidenceAttachment[];
}

export interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (method: 'camera' | 'device', files?: any[]) => void;
  onConfirm?: (files?: any[]) => void;
  taskName: string;
  participantName?: string;
  existingAttachments?: any[];
  isConsent?: boolean;
}

export interface UploadMethodOptionProps {
  method: 'camera' | 'device';
  selectedMethod: 'camera' | 'device' | null;
  hoveredOption: 'camera' | 'device' | null;
  title: string;
  subtitle: string;
  icon: string;
  onSelect: (method: 'camera' | 'device') => void;
  onHoverIn: (method: 'camera' | 'device') => void;
  onHoverOut: () => void;
}
