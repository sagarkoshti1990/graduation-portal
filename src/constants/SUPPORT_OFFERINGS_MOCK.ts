import type { ProvinceEntity, SiteEntity } from '@app-types/Users';

export interface MaterialItem {
  name: string;
  info: string;
}

export interface ParticipantAttendanceItem {
  id: string;
  name: string;
  lcName: string;
  isPresent: boolean;
}

export interface TrainingSessionItem {
  id: number | string;
  title: string;
  status: any;
  start_date?: number | string;
  end_date?: number | string;
  delivery_mode?: any;
  training_type?: string;
  session_type?: any;
  mentor_name?: string;
  organization?: any;
  organization_code?: string;
  provinces?: string[];
  sites?: string[];
  can_be_copied?: boolean;
  location?: string;
  virtualLink?: string;
  expected_participants?: number;
  confirmed_present?: string | number;
  notes?: string;
  completionNotes?: string;
  materials?: MaterialItem[];
  participantList?: ParticipantAttendanceItem[];
  learning_objectives?: string;
}

export interface ServiceItem {
  id: number;
  title: string;
  status: 'Upcoming' | 'In progress' | 'Completed';
  description: string;
  location: string;
  hubOffice: string;
  site: string;
  requests: string;
  actionType: 'copy' | 'complete';
  province: string;
  siteKey: string;
}

export interface AssetItem {
  id: number;
  title: string;
  status: 'Upcoming' | 'Accepted' | 'Pending' | 'Rejected';
  type: string;
  description: string;
  sector: string;
  value: string;
  location: string;
  requests: string;
  province: string;
  siteKey: string;
}

export interface FilterParams {
  searchQuery?: string;
  statusFilter?: string;
  provinceFilter?: string;
  siteFilter?: string;
  draftStatusFilter?: string;
  provincesList?: ProvinceEntity[];
  sitesList?: SiteEntity[];
}


/**
 * Support Offerings Filter Configurations
 * Static filter definitions for the Support Offerings screen
 */
// Status filter options for Support Offerings
export const STATUS_OPTIONS = [
  { labelKey: 'supportProvider.supportOfferings.statusOptions.allStatuses', value: 'all-statuses' },
  { labelKey: 'supportProvider.supportOfferings.statusOptions.upcoming', value: 'Upcoming' },
  { labelKey: 'supportProvider.supportOfferings.statusOptions.inProgress', value: 'In progress' },
  { labelKey: 'supportProvider.supportOfferings.statusOptions.completed', value: 'Completed' },
  { labelKey: 'supportProvider.supportOfferings.statusOptions.draft', value: 'Draft' },
];