import { User } from '@contexts/AuthContext';
import { STATUS } from '../constants/app.constant';
import { ParticipantStatus, PathwayType } from './participant';
import { ProjectData } from 'src/project-player/types/project.types';
export type StatusType = (typeof STATUS)[keyof typeof STATUS];
export interface Participant {
  userId: string;
  name: string;
  idpProgress?: any;
  status?: StatusType;
  userDetails?: User;
  onBoardedProjectId?: string;
  idpProjectId?:string;
  certificateId?:string;
  accountUserStatus?: string;
  phone_code?: string;
  phone?: string;
}

export type StatusCount = {
  [K in StatusType]: number;
};

export interface ParticipantsResponse {
    result: {
        data: {
            count: number;
            participants: Participant[];
        };
    };
    statusCount?: StatusCount;
}

export interface ParticipantsQueryParams {
    searchKey?: string;
    status?: StatusType | '';
    page?: number;
    limit?: number;
}

export interface TemplateData {
    id: string;
    title: string;
    description: string;
    tag: string;
    pillarsCount: number;
    tasksCount: number;
    version: string;
    includedPillars: {
        name: string;
        tasks: number;
    }[];
}

export interface InterventionPlanProps {
  mode?:string|boolean;
  projectData?:ProjectData
  /** True when offline and the project was never downloaded for offline use (no cached data available). */
  projectUnavailableOffline?: boolean;
  participantName?: string;
  participantProfile?:any;
  onIdpCreation?: (projectId?: string) => void;
  onProgressChange?: (progress: number) => void;
  onTaskCompletionChange?: (areAllCompleted: boolean) => void;
  /** Called with the latest full project/task tree after a task action succeeds, so the caller can keep its own project data (the source InterventionPlan re-initializes from on remount) in sync. */
  onProjectDataChange?: (project: ProjectData) => void;
  allowEditTaskIds?: string [];
  showAddCustomTask?: boolean;
}

export interface TemplateData {
  id: string;
  name: string;
  description: string;
  tag: string;
  badgeBg?: string; // Badge background color token
  badgeTextColor?: string; // Badge text color token
  pillarsCount: number;
  tasksCount: number;
  version: string;
  includedPillars: {
    name: string;
    tasks: number;
  }[];
}

export interface ParticipantHeaderProps {
  participant: Participant | User | undefined;
  pathway?: PathwayType;
  graduationProgress?: number;
  updatedProgress?: number;
  graduationDate?: string;
  onViewProfile?: () => void;
  areAllTasksCompleted?: boolean;
  onStatusUpdate?: (newStatus: string) => void;
  projectData?: ProjectData | null;
  onParticipantRefresh?: () => Promise<string | undefined> | string | undefined;
  solutions?: any[];
  isHideSecondButton?: Boolean;
}

export type SubCategory = {
  id: string;
  label: string;
};

export type Category = {
  id: string;
  label: string;
  hasChildren: boolean;
  subcategories: SubCategory[];
};

export type PillarCategoryMap = {
  pillarId: string;
  categories: Category[];
};
export type PillarSelection = {
  categoryId?: string;
  subCategoryId?: string;
  categoryName?:string;
  subCategoryName?:string;
  keywords?:string[]
};

export interface ParticipantProgressCardProps {
  status?: ParticipantStatus;
  graduationProgress?: number;
  updatedProgress?: number;
  graduationDate?: string;
  accountUserStatus?: string;
  participantName?: string;
}