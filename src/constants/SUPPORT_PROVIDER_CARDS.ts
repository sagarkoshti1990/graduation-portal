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
  LIVE: "LIVE",
  CANCELLED: "CANCELLED"
} as const;

export const SESSION_STATUS_LABEL = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  COMPLETED: "Completed",
  EXPIRED: "Expired",
  UPCOMING: "Upcoming",
  IN_PROGRESS: "In progress",
  LIVE: "In progress",
  CANCELLED: "Cancelled"
} as const;

export const DEFAULT_SESSION_CONFIG = {
  TIMEZONE: 'Asia/Kolkata',
  SESSION_TYPE: 'Public',
} as const;

export const REQUEST_SUPPORT_OPTIONS = [
  {
    id: SUPPORT_CATEGORIES.TRAINING,
    icon: 'Calendar',
    title: 'Training & Sessions',
    route: 'sessions-support/request',
  },
  {
    id: SUPPORT_CATEGORIES.ADDITIONAL_SERVICE,
    icon: 'Wrench',
    title: 'Additional Services',
    route: 'sessions-support/request-additional-service',
  },
  {
    id: SUPPORT_CATEGORIES.ASSET,
    icon: 'Box',
    title: 'Assets',
    route: 'sessions-support/request-asset',
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

export const ADDITIONAL_SERVICE_FORM_FIELDS = {
  PROVINCES: 'provinces',
  SITES: 'sites',
  CATEGORIES: 'categories',
  IDP_ADDITIONAL_SERVICES_TASKS: 'idp_tasks',
} as const;

export const SUPPORT_PROVIDER_ROUTES = {
  SESSIONS_SUPPORT: 'sessions-support',
  SESSIONS_SUPPORT_CREATE: 'sessions-support/create',
  SESSIONS_SUPPORT_CREATE_SESSION: 'sessions-support-create-session',
  CREATE_OPPORTUNITY: 'create-opportunity',
  OPPORTUNITIES: 'opportunities',
} as const;

export const SESSIONS_SUPPORT_TABS = {
  ACTIVE_TAB: 'additional_services',
  ACTIVE_SUB_TAB: 'my_requests',
} as const;

export const BUTTON_LOADING_STATE = {
  SAVE_DRAFT: 'saveDraft',
  SUBMIT: 'submit',
} as const;

export const ASSET_FORM_FIELDS = {
  PROVINCE: 'province',
  SITE: 'site',
} as const;

export const ASSET_SESSIONS_SUPPORT_TABS = {
  ACTIVE_TAB: 'assets',
  ACTIVE_SUB_TAB: 'my_requests',
} as const;

export const SUPPORT_OFFERING_TABS = {
  SESSIONS: 'sessions',
  ADDITIONAL_SERVICES: 'additional_services',
  ASSETS: 'assets',
} as const;

export const SUPPORT_OFFERING_SUB_TABS = {
  BROWSE_SESSIONS: 'browse_sessions',
  MY_REQUESTS: 'my_requests',
  MY_SESSIONS: 'my_sessions',
  HISTORY: 'history',
} as const;

export const SUPPORT_OFFERING_TYPE_VALUES = {
  TRAINING_SESSION: 'training',
  ADDITIONAL_SERVICE: 'additional_service',
  ASSET: 'asset',
} as const;

export const REQUEST_STATUS = {
  REQUESTED: 'REQUESTED',
  REJECTED: 'REJECTED',
  PENDING: 'pending',
  DECLINED: 'Declined',
} as const;

export const SUPPORT_REQUEST_TABS = {
  SESSIONS: 'sessions',
  ADDITIONAL_SERVICES: 'additional_services',
  ASSETS: 'assets',
  DECLINED: 'declined',
} as const;

export const OFFERING_FILTER_FIELDS = {
  PROVINCE: 'province',
  SITE: 'site',
  PATHWAY: 'pathway',
  PILLAR: 'pillar',
  TYPE: 'type',
  FORMAT: 'format',
  SEARCH: 'search',
  STATUS: 'status',
} as const;

export const OFFERING_QUERY_PARAM_KEYS = {
  PAGE: 'page',
  LIMIT: 'limit',
  SEARCH: 'search',
  STATUS: 'status',
  PROVINCES: 'provinces',
  SITES: 'sites',
  CATEGORIES: 'categories',
  PILLAR: 'pillar',
  TYPE: 'type',
  DELIVERY_MODE: 'delivery_mode',
  IDP_TASKS: 'idp_tasks',
} as const;

export const OFFERING_FILTER_ALL_OPTIONS = {
  ALL_PROVINCES: 'all-provinces',
  ALL_SITES: 'all-sites',
  ALL_PATHWAYS: 'all-pathways',
  ALL_PILLARS: 'all-pillars',
  ALL_TYPES: 'all-types',
  ALL_FORMATS: 'all-formats',
  ALL_STATUSES: 'all-statuses',
  ALL_STATUS: 'all-status',
} as const;

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
        label: t('lc.sessionsSupport.tabs.browseSessions', 'Browse Trainings & Sessions'),
      },
      {
        key: 'my_requests',
        label: t('lc.sessionsSupport.tabs.myRequests', 'My Requests'),
      },
      {
        key: 'my_sessions',
        label: t('lc.sessionsSupport.tabs.mySessions', 'My Trainings & Sessions'),
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
        label: t('lc.sessionsSupport.tabs.browseServices', 'Browse Services'),
      },
      {
        key: 'my_requests',
        label: t('lc.sessionsSupport.tabs.myRequests', 'My Requests'),
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
        label: t('lc.sessionsSupport.tabs.browseAssets', 'Browse Assets'),
      },
      {
        key: 'my_requests',
        label: t('lc.sessionsSupport.tabs.myRequests', 'My Requests'),
      },
      {
        key: 'history',
        label: t('lc.sessionsSupport.tabs.history', 'History'),
      },
    ],
  },
];

