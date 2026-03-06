import { User } from '@contexts/AuthContext';
import { STATUS } from '@constants/app.constant';
import { ParticipantStatus, PathwayType } from './participant';
export type StatusType = (typeof STATUS)[keyof typeof STATUS];
export interface Participant {
  userId: string;
  name: string;
  idpProgress?: unknown;
  status?: StatusType;
  userDetails?: User;
  idpProjectId?: string;
  certificateId?: string;
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
  participantStatus?: StatusType;
  participantId?: string;
  participantName?: string;
  participantProfile?: unknown;
  onIdpCreation?: (projectId?: string) => void;
  onProgressChange?: (progress: number) => void;
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
};

export interface ParticipantProgressCardProps {
  status?: ParticipantStatus;
  graduationProgress?: number;
  updatedProgress?: number;
  graduationDate?: string;
}