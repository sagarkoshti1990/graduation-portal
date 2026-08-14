import { DEFAULT_PROVINCE_OPTIONS, DEFAULT_SITE_OPTIONS } from './SUPPORT_PROVIDER_CARDS';

export const DEFAULT_PATHWAY_OPTIONS = [
  { label: 'All Pathways', value: 'all-pathways' }
];

export const DEFAULT_FORMAT_OPTIONS = [
  { label: 'All Formats', value: 'all-formats' },
  { label: 'Online', value: 'online' },
  { label: 'Offline', value: 'offline' },
  { label: 'Hybrid', value: 'hybrid' }
];

export const REQUESTOR_FILTERS = [
  {
    attr: 'pathway',
    type: 'select' as const,
    placeholder: 'All Pathways',
    data: DEFAULT_PATHWAY_OPTIONS,
  },
  {
    attr: 'format',
    type: 'select' as const,
    placeholder: 'All Formats',
    data: DEFAULT_FORMAT_OPTIONS,
  },
  {
    attr: 'province',
    type: 'select' as const,
    placeholder: 'All Provinces',
    data: DEFAULT_PROVINCE_OPTIONS,
  },
  {
    attr: 'site',
    type: 'select' as const,
    placeholder: 'All Sites',
    data: DEFAULT_SITE_OPTIONS,
  }
];
