/**
 * My Sessions Filter Options
 * Data-driven filter options for My Sessions screen
 */

export interface SessionFilterOption {
  labelKey: string;
  value: string;
}

export type SessionTabKey = 'scheduled' | 'attended' | 'missed';

export interface SessionTabOption {
  key: SessionTabKey;
  labelKey: string;
}

export const MY_SESSIONS_TABS: SessionTabOption[] = [
  {
    key: 'scheduled',
    labelKey: 'participantJourney.tabs.scheduled',
  },
  {
    key: 'attended',
    labelKey: 'participantJourney.tabs.attended',
  },
  {
    key: 'missed',
    labelKey: 'participantJourney.tabs.missed',
  },
];

export const MY_SESSIONS_FILTER_OPTIONS: SessionFilterOption[] = [
  {
    labelKey: 'participantJourney.sessionFilters.all',
    value: 'all',
  },
  {
    labelKey: 'participantJourney.sessionFilters.trainingsAndSessions',
    value: 'trainings',
  },
  {
    labelKey: 'participantJourney.sessionFilters.additionalServices',
    value: 'additional_services',
  },
];

