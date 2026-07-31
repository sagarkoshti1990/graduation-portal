import type { ProvinceEntity, SiteEntity } from '@app-types/Users';
import supportOfferingsData from '../services/SupportOfferingsServices/mockData/supportOfferings.json';

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
  id: number;
  title: string;
  status: 'Upcoming' | 'In progress' | 'Completed';
  date: string;
  time: string;
  format: string;
  participants: string;
  requestedBy: string;
  province: string;
  siteKey: string;
  hasCopyButton: boolean;
  location?: string;
  virtualLink?: string;
  expectedParticipants: number;
  confirmedPresent: string;
  notes?: string;
  completionNotes?: string;
  materials: MaterialItem[];
  participantList?: ParticipantAttendanceItem[];
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
  { labelKey: 'supportProvider.supportOfferings.statusOptions.pending', value: 'Pending' },
  { labelKey: 'supportProvider.supportOfferings.statusOptions.upcoming', value: 'Upcoming' },
  { labelKey: 'supportProvider.supportOfferings.statusOptions.inProgress', value: 'In progress' },
  { labelKey: 'supportProvider.supportOfferings.statusOptions.completed', value: 'Completed' },
];