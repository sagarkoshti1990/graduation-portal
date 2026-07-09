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
//
// Key format: participant:{userId}:{participantId}:{dataType}
// The userId prefix isolates data between different logged-in users on the
// same device. This prevents one user from seeing another user's offline data.
// ---------------------------------------------------------------------------

export const PARTICIPANT_KEYS = {
  /** Download status for the participant */
  downloadStatus: (userId: string, id: string) => `participant:${userId}:${id}:downloadStatus`,
  /** Full entity details from GET_ENTITY_DETAILS API */
  details:        (userId: string, id: string) => `participant:${userId}:${id}:details`,
  /** List-row snapshot saved at download time (shape = ParticipantData) */
  listSnapshot:   (userId: string, id: string) => `participant:${userId}:${id}:listSnapshot`,
  /** Project data */
  project:        (userId: string, id: string, projectId: string) => `participant:${userId}:${id}:project:${projectId}`,
  /** Pending task-status edits */
  projectEdits:   (userId: string, id: string, projectId: string) => `participant:${userId}:${id}:projectEdits:${projectId}`,
  /** Observation form schema + submission snapshot */
  form:      (userId: string, participantId: string, formId: string) => `participant:${userId}:${participantId}:form:${formId}`,
  /** Pending form edits saved before sync */
  formEdits: (userId: string, participantId: string, formId: string) => `participant:${userId}:${participantId}:form:${formId}:edits`,
  /**
   * Pending file upload queue.
   * Stores PendingFile[] — structured entries that carry taskId so syncService
   * knows which task each file belongs to.
   */
  filesPending:   (userId: string, id: string) => `participant:${userId}:${id}:filesPending`,
  /**
   * Stored file content (base64 data-URL) for a single pending file.
   * Keyed by userId + participantId + fileName; removed after successful upload.
   */
  fileBlob: (userId: string, participantId: string, fileName: string) => `participant:${userId}:${participantId}:file:${encodeURIComponent(fileName)}`,
  /** Timestamp (ms) of the last successful sync for this participant */
  lastSyncedAt:   (userId: string, id: string) => `participant:${userId}:${id}:lastSyncedAt`,
  /** Keyword→solution mapping built during download — used by offline observation resolver */
  solutions:      (userId: string, id: string) => `participant:${userId}:${id}:solutions`,
  /** Queued Intervention Plan submission (createProjectPlan/updateProjectPlan payload), pending sync */
  idpSubmissionPending: (userId: string, id: string) => `participant:${userId}:${id}:idpSubmissionPending`,
};

// ---------------------------------------------------------------------------
// Global offline keys (participants list, sync state)
// All keys under participants:* and sync:* are routed to IndexedDB on web.
//
// Registry and sync-state keys are user-specific to prevent one user's
// downloaded participants / pending queue from leaking into another user's session.
// ---------------------------------------------------------------------------

export const OFFLINE_KEYS = {
  /**
   * Array of participant IDs that have been downloaded for offline use.
   * Scoped per user so each LC only sees their own downloaded participants.
   */
  OFFLINE_PARTICIPANT_IDS: (userId: string) => `participants:offline:ids:${userId}`,
  /** Cached targeted solutions per type — shared across users (read-only reference data) */
  SOLUTIONS: (type: string) => `participants:solutions:${type}`,
  /** Cached project categories/pathways — shared across users (read-only reference data) */
  PROJECT_CATEGORIES: 'participants:projectCategories',
  /**
   * Full IDP library category hierarchy (all pathways, fully nested), downloaded
   * at login — shared across users (read-only reference data).
   */
  LIBRARY_CATEGORIES_TREE: 'library:categoriesTree',
  /**
   * Full, unfiltered project templates list, downloaded at login — shared
   * across users (read-only reference data). Filtered locally by category id
   * to reproduce the online `getTaskDetails` grouping when offline.
   */
  PROJECT_TEMPLATES_ALL: 'library:templatesAll',
  /**
   * Sync failure log — scoped per user so each user tracks their own failed syncs.
   */
  SYNC_FAILED: (userId: string) => `sync:failed:${userId}`,
  /**
   * Last sync timestamp — scoped per user.
   */
  SYNC_LAST: (userId: string) => `sync:lastSync:${userId}`,
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
    /** cacheKey(userId, participantId) → 'participant:{userId}:{id}:details' */
    cacheKey: (userId: string, id: string) => PARTICIPANT_KEYS.details(userId, id),
    /** Fallback key when details key has no data */
    fallbackCacheKey: (userId: string, id: string) => PARTICIPANT_KEYS.listSnapshot(userId, id),
  },

  PROJECT: {
    supported: true as const,
  },

  OBSERVATION_FORM: {
    supported: true as const,
    /** cacheKey(userId, participantId, formId) → 'participant:{userId}:{participantId}:form:{formId}' */
    cacheKey: (userId: string, participantId: string, formId: string) =>
      PARTICIPANT_KEYS.form(userId, participantId, formId),
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
    cacheKey: (userId: string, id: string) => PARTICIPANT_KEYS.details(userId, id),
    fallbackCacheKey: (userId: string, id: string) => PARTICIPANT_KEYS.listSnapshot(userId, id),
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
