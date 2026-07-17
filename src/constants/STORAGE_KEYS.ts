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
  /** Participants List screen active/inactive filter preference */
  PARTICIPANTS_ACTIVE_FILTER: 'participants_active_filter',
  /** Participants List screen active status preference */
  PARTICIPANTS_ACTIVE_STATUS: 'participants_active_status',
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
  project:        (id: string,projectId:string) => `participant:${id}:project:${projectId}`,
  /** Pending task-status edits */
  projectEdits:   (id: string,projectId:string) => `participant:${id}:projectEdits:${projectId}`,
  /** Observation form schema + submission snapshot */
  form:      (participantId: string, formId: string) => `participant:${participantId}:form:${formId}`,
  /** Pending form edits saved before sync */
  formEdits: (participantId: string, formId: string) => `participant:${participantId}:form:${formId}:edits`,
  /**
   * Pending file upload queue.
   * Stores PendingFile[] — structured entries that carry taskId so syncService
   * knows which task each file belongs to.
   */
  filesPending:   (id: string) => `participant:${id}:filesPending`,
  /**
   * Stored file content (base64 data-URL) for a single pending file.
   * Keyed by participantId + fileName; removed after successful upload.
   */
  fileBlob: (participantId: string, fileName: string) => `participant:${participantId}:file:${encodeURIComponent(fileName)}`,
  /** Timestamp (ms) of the last successful sync for this participant */
  lastSyncedAt:   (id: string) => `participant:${id}:lastSyncedAt`,
  /** Keyword→solution mapping built during download — used by offline observation resolver */
  solutions:      (id: string) => `participant:${id}:solutions`,
};

// ---------------------------------------------------------------------------
// Global offline keys (participants list, sync state)
// All keys under participants:* and sync:* are routed to IndexedDB on web.
// ---------------------------------------------------------------------------

export const OFFLINE_KEYS = {
  /** Array of participant IDs that have been downloaded for offline use */
  OFFLINE_PARTICIPANT_IDS: 'participants:offline:ids',
  /** Cached targeted solutions per type — participants:solutions:{type} */
  SOLUTIONS: (type: string) => `participants:solutions:${type}`,
  /** Cached project categories/pathways */
  PROJECT_CATEGORIES: 'participants:projectCategories',
  /** Sync failure log */
  SYNC_FAILED: 'sync:failed',
  /** Last sync timestamp */
  SYNC_LAST: 'sync:lastSync',
};

// ---------------------------------------------------------------------------
// Offline API configuration
//
// Declares which service functions support offline and what cache key they use.
// `dataService.ts` reads this config when calling `withOfflineFirst()`.
//
// To add offline support to a new API:
//   1. Add an entry here with supported: true and a cacheKey function.
//   2. Call withOfflineFirst(apiCall, { offlineSupported: config.supported,
//        cacheKey: config.cacheKey(...), emptyValue: ... }) in dataService.
// ---------------------------------------------------------------------------

export const OFFLINE_API_CONFIG = {
  // ── Offline-supported (data cached in IndexedDB) ─────────────────────────

  PARTICIPANTS_LIST: {
    supported: true as const,
  },

  PARTICIPANT_DETAILS: {
    supported: true as const,
    /** cacheKey(participantId) → 'participant:{id}:details' */
    cacheKey: (id: string) => PARTICIPANT_KEYS.details(id),
    /** Fallback key when details key has no data */
    fallbackCacheKey: (id: string) => PARTICIPANT_KEYS.listSnapshot(id),
  },

  PROJECT: {
    supported: true as const,
  },

  OBSERVATION_FORM: {
    supported: true as const,
    /** cacheKey(participantId, formId) → 'participant:{id}:form:{formId}' */
    cacheKey: (participantId: string, formId: string) =>
      PARTICIPANT_KEYS.form(participantId, formId),
  },

  TARGETED_SOLUTIONS: {
    supported: true as const,
    /** cacheKey(type) → 'participants:solutions:{type}' */
    cacheKey: (type: string) => OFFLINE_KEYS.SOLUTIONS(type),
  },

  PROJECT_CATEGORIES: {
    supported: true as const,
    cacheKey: () => OFFLINE_KEYS.PROJECT_CATEGORIES,
  },

  ENTITY_DETAILS: {
    supported: true as const,
    cacheKey: (id: string) => PARTICIPANT_KEYS.details(id),
    fallbackCacheKey: (id: string) => PARTICIPANT_KEYS.listSnapshot(id),
  },

  // ── NOT offline-supported (online-only) ───────────────────────────────────

  /** Admin user-management APIs — online only */
  USER_MANAGEMENT: { supported: false as const },
  /** Observation entities — only resolved during download (online-only step) */
  OBSERVATION_ENTITIES: { supported: false as const },
  /** Entity types for admin filters — online only */
  ENTITY_TYPES: { supported: false as const },
  /** Certificate generation — write operation, online only */
  CERTIFICATE: { supported: false as const },
  /** Participant address update — write operation, online only */
  UPDATE_PARTICIPANT: { supported: false as const },
};
