import { TabData } from '@app-types/components';

export const TABS: TabData[] = [
  {
    key: 'participants',
    label: 'participants.myParticipants',
    isDisabled: false,
  },
  {
    key: 'dashboard',
    label: 'participants.dashboard',
    isDisabled: true,
  },
];

export const PARTICIPANT_DETAIL_TABS: TabData[] = [
  {
    key: 'intervention-plan',
    label: 'participantDetail.tabs.interventionPlan',
    mobileLabel: 'Plan',
    icon: 'FileText',
    isDisabled: false,
  },
  {
    key: 'assessment-surveys',
    label: 'participantDetail.tabs.assessmentSurveys',
    mobileLabel: 'Surveys',
    icon: 'UserCheck',
    isDisabled: false,
  },
];
