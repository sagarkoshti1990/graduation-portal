import type { ProvinceEntity, SiteEntity } from './Users';

export interface MaterialItem {
  name: string;
  info?: string;
  link?: string;
  sourcePath?: string;
  type?: string;
  size?: number;
}

export interface ParticipantAttendanceItem {
  id: string;
  name: string;
  lcName: string;
  isPresent: boolean;
}

export interface MeetingInfo {
  location?: string;
  link?: string;
}

export interface DeliveryModeObject {
  id?: number;
  label?: string;
  value?: string;
}

export interface OrganizationObject {
  id?: number | string;
  name?: string;
  organization_code?: string;
  [key: string]: any;
}

export interface TrainingSessionItem {
  id: number | string;
  title: string;
  mentor_id?: number | string;
  description?: string;
  notes?: string;
  completionNotes?: string;
  status: string;
  start_date?: number | string;
  end_date?: number | string;
  image?: string;
  created_at?: number | string;
  created_by?: number | string;
  mentor_organization_id?: number | string;
  seats_remaining?: number;
  seats_limit?: number;
  mentor_name?: string;
  organization?: OrganizationObject | string;
  organization_code?: string;
  meeting_info?: MeetingInfo;
  meeting_info_details?: any;
  is_assigned?: boolean;
  sites?: string[];
  provinces?: string[];
  can_be_copied?: boolean;
  idp_training_task?: any;
  learning_objectives?: string;
  certificate_provided?: boolean;
  delivery_mode?: DeliveryModeObject | string;
  materials?: MaterialItem[];
  participantList?: ParticipantAttendanceItem[];
  meta?: any;
}

export interface ServiceItem {
  id: number | string;
  title: string;
  status: 'Upcoming' | 'In progress' | 'Completed' | string;
  description?: string;
  location?: string;
  hubOffice?: string;
  site?: string;
  requests?: string;
  actionType?: 'copy' | 'complete' | string;
  province?: string;
  siteKey?: string;
}

export interface AssetItem {
  id: number | string;
  title: string;
  status: 'Upcoming' | 'Accepted' | 'Pending' | 'Rejected' | string;
  type?: string;
  description?: string;
  sector?: string;
  value?: string;
  location?: string;
  requests?: string;
  province?: string;
  siteKey?: string;
}

export interface FilterParams {
  search?: string;
  status?: string;
  province?: string;
  site?: string;
  page?: number;
  limit?: number;
}
