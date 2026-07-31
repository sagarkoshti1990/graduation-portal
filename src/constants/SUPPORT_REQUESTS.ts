export const SUPPORT_REQUEST_BUTTON_TEXTS = {
  CANCEL: 'supportProvider.supportRequests.buttonTexts.cancel',
  SEND_REQUEST: 'supportProvider.supportRequests.buttonTexts.sendRequest',
  CONFIRM_DECLINE: 'supportProvider.supportRequests.buttonTexts.confirmDecline',
  CONFIRM_SCHEDULE: 'supportProvider.supportRequests.buttonTexts.confirmSchedule',
  REQUEST_INFO: 'supportProvider.supportRequests.buttonTexts.requestInfo',
  DECLINE: 'supportProvider.supportRequests.buttonTexts.decline',
  ACCEPT_SCHEDULE: 'supportProvider.supportRequests.buttonTexts.acceptSchedule',
  ACCEPT_REQUEST: 'supportProvider.supportRequests.buttonTexts.acceptRequest',
  VIEW_FULL_DETAILS: 'supportProvider.supportRequests.buttonTexts.viewFullDetails',
} as const;

export const SUPPORT_REQUEST_TITLES = {
  HEADER: 'supportProvider.supportRequests.titles.header',
  SUBHEADER: 'supportProvider.supportRequests.titles.subheader',
  VIEW_DETAILS: 'supportProvider.supportRequests.titles.viewDetails',
  REQUEST_DETAILS: 'supportProvider.supportRequests.titles.requestDetails',
  REQUEST_INFO: 'supportProvider.supportRequests.titles.requestInfo',
  DECLINE: 'supportProvider.supportRequests.titles.decline',
  ACCEPT_SCHEDULE: 'supportProvider.supportRequests.titles.acceptSchedule',
  COACH_INFORMATION: 'supportProvider.supportRequests.titles.coachInformation',
} as const;

export const DECLINE_REASON_OPTIONS = [
  { label: 'supportProvider.supportRequests.declineReasons.capacity', value: 'capacity' },
  { label: 'supportProvider.supportRequests.declineReasons.outsideScope', value: 'outside_scope' },
  { label: 'supportProvider.supportRequests.declineReasons.scheduleConflict', value: 'schedule_conflict' },
  { label: 'supportProvider.supportRequests.declineReasons.other', value: 'other' },
] as const;

export const DURATION_OPTIONS = [
  { label: 'supportProvider.supportRequests.durationOptions.1hour', value: '1 hour' },
  { label: 'supportProvider.supportRequests.durationOptions.1_5hours', value: '1.5 hours' },
  { label: 'supportProvider.supportRequests.durationOptions.2hours', value: '2 hours' },
  { label: 'supportProvider.supportRequests.durationOptions.3hours', value: '3 hours' },
  { label: 'supportProvider.supportRequests.durationOptions.fullDay', value: 'full_day' },
] as const;

export const SUPPORT_REQUEST_LABELS = {
  REQUEST: 'supportProvider.supportRequests.labels.request',
  COACH: 'supportProvider.supportRequests.labels.coach',
  YOUR_QUESTION: 'supportProvider.supportRequests.labels.yourQuestion',
  SELECT_REASON: 'supportProvider.supportRequests.labels.selectReason',
  REASON_DETAILS: 'supportProvider.supportRequests.labels.reasonDetails',
  DATE: 'supportProvider.supportRequests.labels.date',
  TIME: 'supportProvider.supportRequests.labels.time',
  DURATION: 'supportProvider.supportRequests.labels.duration',
  LOCATION_VENUE: 'supportProvider.supportRequests.labels.locationVenue',
  MEETING_LINK: 'supportProvider.supportRequests.labels.meetingLink',
  NOTES_FOR_COACH: 'supportProvider.supportRequests.labels.notesForCoach',
  PARTICIPANTS: 'supportProvider.supportRequests.labels.participants',
  REQUESTED_DATE: 'supportProvider.supportRequests.labels.requestedDate',
  PREFERRED_DATE: 'supportProvider.supportRequests.labels.preferredDate',
  PREFERRED_TIME: 'supportProvider.supportRequests.labels.preferredTime',
  PREFERRED_LOCATION: 'supportProvider.supportRequests.labels.preferredLocation',
  PROVINCE: 'supportProvider.supportRequests.labels.province',
  CATEGORY: 'supportProvider.supportRequests.labels.category',
  REQUEST_JUSTIFICATION: 'supportProvider.supportRequests.labels.requestJustification',
  PARTICIPANT_DETAILS: 'supportProvider.supportRequests.labels.participantDetails',
  SPECIAL_REQUIREMENTS: 'supportProvider.supportRequests.labels.specialRequirements',
} as const;

export const SUPPORT_REQUEST_PLACEHOLDERS = {
  REQUEST_INFO: 'supportProvider.supportRequests.placeholders.requestInfo',
  DECLINE_REASON: 'supportProvider.supportRequests.placeholders.declineReason',
  DECLINE_DETAILS: 'supportProvider.supportRequests.placeholders.declineDetails',
  LOCATION: 'supportProvider.supportRequests.placeholders.location',
  MEETING_LINK: 'supportProvider.supportRequests.placeholders.meetingLink',
  NOTES: 'supportProvider.supportRequests.placeholders.notes',
  SEARCH: 'supportProvider.supportRequests.placeholders.search',
} as const;

export const SUPPORT_REQUEST_HINTS = {
  REQUEST_INFO: 'supportProvider.supportRequests.hints.requestInfo',
  DECLINE: 'supportProvider.supportRequests.hints.decline',
} as const;

export const SUPPORT_REQUEST_FALLBACKS = {
  DATE: 'supportProvider.supportRequests.fallbacks.date',
  TIME: 'supportProvider.supportRequests.fallbacks.time',
  LOCATION: 'supportProvider.supportRequests.fallbacks.location',
  MEETING_LINK: 'supportProvider.supportRequests.fallbacks.meetingLink',
  NOT_AVAILABLE: 'supportProvider.supportRequests.fallbacks.notAvailable',
} as const;

export const SUPPORT_REQUEST_CARDBADGES = {
  OVERDUE: 'supportProvider.supportRequests.cardBadges.overdue',
  DAYS: 'supportProvider.supportRequests.cardBadges.days',
} as const;
