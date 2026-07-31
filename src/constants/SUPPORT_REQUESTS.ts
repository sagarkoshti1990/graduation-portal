export const SUPPORT_REQUEST_BUTTON_TEXTS = {
  CANCEL: 'Cancel',
  SEND_REQUEST: 'Send Request',
  CONFIRM_DECLINE: 'Confirm Decline',
  CONFIRM_SCHEDULE: 'Confirm & Schedule',
  REQUEST_INFO: 'Request Info',
  DECLINE: 'Decline',
  ACCEPT_SCHEDULE: 'Accept & Schedule',
  ACCEPT_REQUEST: 'Accept Request',
  VIEW_FULL_DETAILS: 'View Full Details',
} as const;

export const SUPPORT_REQUEST_TITLES = {
  HEADER: 'Support Requests',
  SUBHEADER: 'Review and respond to requests from Coaches',
  VIEW_DETAILS: 'View Details',
  REQUEST_DETAILS: 'Request Details',
  REQUEST_INFO: 'Request More Information',
  DECLINE: 'Decline Request',
  ACCEPT_SCHEDULE: 'Accept & Schedule Training',
} as const;

export const DECLINE_REASON_OPTIONS = [
  { label: 'Capacity / Resource Constraints', value: 'capacity' },
  { label: 'Outside Scope of Service', value: 'outside_scope' },
  { label: 'Schedule Conflict', value: 'schedule_conflict' },
  { label: 'Other / Custom Reason', value: 'other' },
] as const;

export const DURATION_OPTIONS = [
  { label: '1 hour', value: '1 hour' },
  { label: '1.5 hours', value: '1.5 hours' },
  { label: '2 hours', value: '2 hours' },
  { label: '3 hours', value: '3 hours' },
  { label: 'Full Day (4+ hours)', value: 'full_day' },
] as const;

export const SUPPORT_REQUEST_LABELS = {
  REQUEST: 'Request:',
  COACH: 'Coach:',
  YOUR_QUESTION: 'Your Question or Request',
  SELECT_REASON: 'Select Reason',
  REASON_DETAILS: 'Reason Details',
  DATE: 'Date',
  TIME: 'Time',
  DURATION: 'Duration',
  LOCATION_VENUE: 'Location / Venue',
  MEETING_LINK: 'Meeting Link (if online)',
  NOTES_FOR_COACH: 'Notes for Coach (optional)',
  PARTICIPANTS: 'Participants',
  REQUESTED_DATE: 'Requested Date',
  PREFERRED_DATE: 'Preferred Date',
  PREFERRED_TIME: 'Preferred Time',
  PREFERRED_LOCATION: 'Preferred Location',
  PROVINCE: 'Province',
  CATEGORY: 'Category',
  REQUEST_JUSTIFICATION: 'Request Justification',
  PARTICIPANT_DETAILS: 'Participant Details',
  SPECIAL_REQUIREMENTS: 'Special Requirements',
} as const;

export const SUPPORT_REQUEST_PLACEHOLDERS = {
  REQUEST_INFO: 'What additional information do you need from the Coach?',
  DECLINE_REASON: 'Choose a preset reason or write your own',
  DECLINE_DETAILS: 'Provide additional context or details for the Coach...',
  LOCATION: 'e.g. Online via Zoom or BRAC Hub Room 1',
  MEETING_LINK: 'https://...',
  NOTES: 'Any additional information or instructions...',
  SEARCH: 'Search requests...',
} as const;

export const SUPPORT_REQUEST_HINTS = {
  REQUEST_INFO: 'The Coach will receive this message and can respond with the requested information',
  DECLINE: 'This feedback will be shared with the Coach',
} as const;

export const SUPPORT_REQUEST_FALLBACKS = {
  DATE: '03/25/2024',
  TIME: '09:00 AM',
  LOCATION: 'Online via Zoom',
  MEETING_LINK: 'https://meet.example.com/sp-session',
  NOT_AVAILABLE: 'N/A',
} as const;

export const SUPPORT_REQUEST_CARDBADGES = {
  OVERDUE: 'Overdue',
  DAYS: 'days'
} as const;
