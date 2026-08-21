import { FeatureCardData } from '@app-types/components';

export const SUPPORT_CATEGORIES = {
  TRAINING: 'training',
  ADDITIONAL_SERVICE: 'additional_service',
  ASSET: 'asset',
} as const;

export const SUPPORT_PROVIDER_CARDS: FeatureCardData[] = [
  {
    id: SUPPORT_CATEGORIES.TRAINING,
    color: '#0284C7', // Blue color
    icon: 'GraduationCap',
    title: 'supportProvider.createSupport.cards.training.title',
    description: 'supportProvider.createSupport.cards.training.description',
    navigationUrl: 'form-training-session',
  },
  {
    id: SUPPORT_CATEGORIES.ADDITIONAL_SERVICE,
    color: '#7C3AED', // Purple color
    icon: 'Briefcase',
    title: 'supportProvider.createSupport.cards.additionalServices.title',
    description: 'supportProvider.createSupport.cards.additionalServices.description',
    navigationUrl: 'create-additional-service',
  },
  {
    id: SUPPORT_CATEGORIES.ASSET,
    color: '#16A34A', // Green color
    icon: 'Package',
    title: 'supportProvider.createSupport.cards.assets.title',
    description: 'supportProvider.createSupport.cards.assets.description',
    navigationUrl: 'create-asset',
  },
];

export const FORM_MODE = {
  CREATE: 'create',
  EDIT: 'edit',
  COPY: 'copy',
} as const;

export type FormModeType = typeof FORM_MODE[keyof typeof FORM_MODE];

export const SESSION_STATUS = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  COMPLETED: "COMPLETED",
  LIVE: "LIVE"
} as const;

export const SESSION_STATUS_LABEL = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  COMPLETED: "Completed",
  UPCOMING: "Upcoming",
  IN_PROGRESS: "In progress",
  LIVE: "In progress"
} as const;

export const DEFAULT_SESSION_CONFIG = {
  TIMEZONE: 'Asia/Kolkata',
  SESSION_TYPE: 'Public',
} as const;

export const REQUEST_SUPPORT_OPTIONS = [
  {
    id: SUPPORT_CATEGORIES.TRAINING,
    icon: 'Calendar',
    title: 'Session or Training',
    description: 'Request a training session',
    route: 'sessions-support/request',
  },
  {
    id: SUPPORT_CATEGORIES.ADDITIONAL_SERVICE,
    icon: 'Wrench',
    title: 'Additional Service',
    description: 'Request a support service',
    route: 'create-additional-service',
  },
  {
    id: SUPPORT_CATEGORIES.ASSET,
    icon: 'Box',
    title: 'Asset',
    description: 'Request equipment or resources',
    route: 'create-asset',
  },
];

export const CERTIFICATE_OPTIONS = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
] as const;

export const RECURRING_OPTIONS = [
  { value: 'true', label: 'Yes — recurring session' },
  { value: 'false', label: 'No — one-off session' },
] as const;

export const STATUS_OPTIONS = [
  {
    labelKey: 'supportProvider.supportOfferings.statusOptions.allStatuses',
    value: 'all-statuses',
  },
  {
    labelKey: 'supportProvider.supportOfferings.statusOptions.upcoming',
    value: 'Upcoming',
  },
  {
    labelKey: 'supportProvider.supportOfferings.statusOptions.inProgress',
    value: 'In progress',
  },
  {
    labelKey: 'supportProvider.supportOfferings.statusOptions.completed',
    value: 'Completed',
  },
  {
    labelKey: 'supportProvider.supportOfferings.statusOptions.draft',
    value: 'Draft',
  },
];

export const DEFAULT_PROVINCE_OPTIONS = [{ label: 'All Provinces', value: 'all-provinces' }];

export const DEFAULT_SITE_OPTIONS = [{ label: 'All Sites', value: 'all-sites' }];

export const getSupportOfferingTabs = (t: any, counts: any) => [
  {
    key: 'sessions',
    label: t(
      'supportProvider.supportOfferings.tabs.trainings',
      'Trainings & Sessions'
    ),
    count: counts.sessions,
    icon: 'GraduationCap',
    children: [
      {
        key: 'browse_sessions',
        label: t('lc.sessionsSupport.tabs.browseSessions', 'Browse Sessions'),
      },
      {
        key: 'my_requests',
        label: t('lc.sessionsSupport.tabs.myRequests', 'My Requests'),
      },
      {
        key: 'my_sessions',
        label: t('lc.sessionsSupport.tabs.mySessions', 'My Sessions'),
      },
      {
        key: 'history',
        label: t('lc.sessionsSupport.tabs.history', 'History'),
      },
    ],
  },
  {
    key: 'additional_services',
    label: t(
      'supportProvider.supportOfferings.tabs.additionalServices',
      'Additional Services'
    ),
    count: counts.additional_services,
    icon: 'Briefcase',
    children: [
      {
        key: 'browse_sessions',
        label: t('lc.sessionsSupport.tabs.browseSessions', 'Browse Sessions'),
      },
      {
        key: 'my_sessions',
        label: t('lc.sessionsSupport.tabs.mySessions', 'My Sessions'),
      },
      {
        key: 'history',
        label: t('lc.sessionsSupport.tabs.history', 'History'),
      },
    ],
  },
  {
    key: 'assets',
    label: t(
      'supportProvider.supportOfferings.tabs.assets',
      'Assets'
    ),
    count: counts.assets,
    icon: 'Box',
    children: [
      {
        key: 'browse_sessions',
        label: t('lc.sessionsSupport.tabs.browseSessions', 'Browse Sessions'),
      },
      {
        key: 'my_sessions',
        label: t('lc.sessionsSupport.tabs.mySessions', 'My Sessions'),
      },
      {
        key: 'history',
        label: t('lc.sessionsSupport.tabs.history', 'History'),
      },
    ],
  },
];

