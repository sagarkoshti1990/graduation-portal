/** Relative paths under `BRAC_REPORTING_API_BASE_URL` (no leading slash required). */
export const BRAC_REPORTING_ENDPOINTS = {
  /** GET — fetch the LC dashboard overview for a coach (?coachId=...). */
  OVERVIEW: 'lc-dashboard/overview',
  /** GET — fetch a single participant's outcome indicators (?participantId=...). */
  OUTCOMES: 'lc-dashboard/outcomes',
  /** GET — fetch the coach-level graduation overview (?coachId=...). */
  GRADUATION_OVERVIEW: 'lc-dashboard/graduation-overview',
  /** GET — fetch a single participant's graduation readiness checklist (?participantId=...). */
  GRADUATION_READINESS: 'lc-dashboard/graduation-readiness',
  /** DELETE — remove all stored raw reporting data. Path unconfirmed against the live backend. */
  DELETE_RAW_DATA: '',
} as const;
