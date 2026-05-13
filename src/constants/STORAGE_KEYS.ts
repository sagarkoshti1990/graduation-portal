/**
 * Storage keys used throughout the application.
 * Used for both localStorage (web) and AsyncStorage (React Native).
 */
export const STORAGE_KEYS = {
  /** Language preference storage key */
  LANGUAGE: '@app_language',
  /** Color mode preference storage key (light/dark) */
  COLOR_MODE: 'colorMode',
  /** Authentication token storage key */
  AUTH_TOKEN: '@auth_token',
  /** Authentication user storage key */
  AUTH_USER: '@auth_user',
  /** Authentication refresh token storage key */
  AUTH_REFRESH_TOKEN: '@auth_refresh_token',
  /** Remember Me preference storage key */
  AUTH_REMEMBER_ME: '@auth_remember_me',
  /** Internal access token storage key */
  INTERNAL_ACCESS_TOKEN: '@internal_access_token',
  /** Entity types storage key */
  ENTITY_TYPES: '@entity_types',
  /** User Management screen page size preference */
  USER_MANAGEMENT_PAGE_SIZE: 'user_management_page_size',
  /** Participants List screen page size preference */
  PARTICIPANTS_PAGE_SIZE: 'participants_page_size',
  /** Admin sidebar open/collapsed state */
  ADMIN_SIDEBAR_OPEN: 'admin_sidebar_open',
} as const;

// ---------------------------------------------------------------------------
// Offline participant data keys
// All keys under participant:* are routed to IndexedDB on web.
// ---------------------------------------------------------------------------

export const PARTICIPANT_KEYS = {
  /** Download status for the participant */
  downloadStatus: (id: string) => `participant:${id}:downloadStatus`,
  /** Full entity details from GET_ENTITY_DETAILS API */
  details:        (id: string) => `participant:${id}:details`,
  /** List-row snapshot saved at download time (shape = ParticipantData) */
  listSnapshot:   (id: string) => `participant:${id}:listSnapshot`,
  /** Project data */
  project:        (id: string) => `participant:${id}:project`,
  /** Task list */
  tasks:          (id: string) => `participant:${id}:tasks`,
  /** Pending task-status edits */
  projectEdits:   (id: string) => `participant:${id}:projectEdits`,
  /** Observation form schema + submission snapshot */
  form:      (participantId: string, formId: string) => `participant:${participantId}:form:${formId}`,
  /** Pending form edits saved before sync */
  formEdits: (participantId: string, formId: string) => `participant:${participantId}:form:${formId}:edits`,
  /** Pending file upload references */
  filesPending:   (id: string) => `participant:${id}:filesPending`,
};

// ---------------------------------------------------------------------------
// Global offline keys (participants list, sync state)
// ---------------------------------------------------------------------------

export const OFFLINE_KEYS = {
  /** Array of participant IDs that have been downloaded for offline use */
  OFFLINE_PARTICIPANT_IDS: 'participants:offline:ids',
  /** Cached participants list data */
  PARTICIPANTS_LIST: 'participants:list',
  /** Sync failure log */
  SYNC_FAILED: 'sync:failed',
  /** Last sync timestamp */
  SYNC_LAST: 'sync:lastSync',
};
