export const STATUS = {
  NOT_ENROLLED: 'NOT_ONBOARDED',
  ENROLLED: 'ONBOARDED',
  NOT_ONBOARDED: 'NOT_ONBOARDED',
  ONBOARDED: 'ONBOARDED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  // Must match backend status value exactly (no hidden/leading whitespace)
  DROPOUT: 'DROPPED_OUT',
  GRADUATED: 'GRADUATED',
};

export const ENTITY_STATUS = {
  NOT_STARTED: 'notStarted',
  STARTED: 'started',
  COMPLETED: 'completed',
} as const;

export const ENTITY_TYPE = {
  PARTICIPANT: 'participant',
  LINKAGE_CHAMPION: 'linkageChampion',
  SUPERVISOR: 'supervisor',
} as const;

// Task Status Constants
export const TASK_STATUS = {
  TO_DO: 'notStarted',
  COMPLETED: 'completed',
} as const;

export const PLAYER_MODE = {
  EDIT: 'edit',
  PREVIEW: 'preview',
  READ_ONLY: 'readOnly',
} as const;

// Task Type Constants
export const TASK_TYPE = {
  PROJECT: 'project',
  FILE: 'file',
  OBSERVATION: 'observation',
  SIMPLE: 'simple',
  PROFILE_UPDATE: 'profile-update',
} as const;

// Project Status Constants
export const PROJECT_STATUS = {
  DRAFT: 'draft',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  SUBMITTED: 'submitted',
} as const;

export const GRADUATION_READINESS_PROGRESS_THRESHOLD = 100;

// Upload Status Constants
export const UPLOAD_STATUS = {
  PENDING: 'pending',
  UPLOADING: 'uploading',
  UPLOADED: 'uploaded',
  FAILED: 'failed',
} as const;

/**
 * Card Status Types
 * Defines the possible status types for assessment survey cards
 */
export const CARD_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  NOT_STARTED: 'not-started',
  IN_PROGRESS: 'started',
  COMPLETED: 'completed',
  GRADUATED: 'graduated',
  DRAFT: 'draft',
} as const;

/**
 * Participant Table Column Keys
 * Defines the column keys used in the participants table
 */
export const PARTICIPANT_COLUMN_KEYS = {
  NAME: 'name',
  ID: 'id',
  PROGRESS: 'progress',
  GRADUATED: 'graduated',
  PHONE: 'phone',
} as const;

export const PARTICIPANT_DETAILS_TABS = {
  INTERVENTION_PLAN: 'intervention-plan',
  ASSESSMENTS_SURVEYS: 'assessment-surveys',
};

/**
 * Pillar Names Constants
 * Defines the pillar name identifiers used for matching and display
 */
export const PILLAR_NAMES = {
  SOCIAL_EMPOWERMENT: 'social empowerment',
  EMPOWERMENT: 'empowerment',
  LIVELIHOOD: 'livelihood',
  FINANCIAL_INCLUSION: 'financial inclusion',
  FINANCIAL: 'financial',
  SOCIAL_PROTECTION: 'social protection',
  PROTECTION: 'protection',
} as const;

/**
 * Pillar Categories Constants
 * Defines the metadata category identifiers for pillars
 */
export const PILLAR_CATEGORIES = {
  PROTECTION: 'protection',
} as const;

// Project Modes
export const PROJECT_MODES = {
  READ_ONLY: 'read-only',
  PREVIEW: 'preview',
  EDIT: 'edit',
} as const;

// Badge Types
export const BADGE_TYPES = {
  REQUIRED: 'required',
  OPTIONAL: 'optional',
} as const;

export const ONBOARDING_PROJECT_TITLES = [
  'Onboarding Participants',
  'Onboarding the Participant',
];

export const PATHWAY_TAGS = {
  ENTREPRENEURSHIP: 'Entrepreneurship',
  EMPLOYMENT: 'Employment',
} as const;
