import { DEFAULT_PROVINCE_OPTIONS, DEFAULT_SITE_OPTIONS } from './SUPPORT_PROVIDER_CARDS';

export const DEFAULT_PILLAR_OPTIONS = [
  { label: 'All Pillars', value: 'all-pillars' }
];

export const DEFAULT_TYPE_OPTIONS = [
  { label: 'All Types', value: 'all-types' }
];

// Real status options are the SP "My Support Interventions" ones, set in the Sessions & Support screen
export const DEFAULT_STATUS_OPTIONS = [
  { label: 'All Statuses', value: 'all-statuses' },
];

// Real delivery modes come from the delivery_mode entity API; only the "All" option is static
export const DEFAULT_FORMAT_OPTIONS = [
  { label: 'All Formats', value: 'all-formats' },
];

export const REQUESTOR_FILTERS = [
  {
    attr: 'pillar',
    type: 'select' as const,
    placeholder: 'All Pillars',
    data: DEFAULT_PILLAR_OPTIONS,
  },
  {
    attr: 'type',
    type: 'select' as const,
    placeholder: 'All Types',
    data: DEFAULT_TYPE_OPTIONS,
  },
  {
    attr: 'status',
    type: 'select' as const,
    placeholder: 'All Statuses',
    data: DEFAULT_STATUS_OPTIONS,
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
