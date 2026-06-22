import type { DownloadConfig } from '@app-types/offline';
import { STATUS } from '@constants/app.constant';
import { ProjectData, Task } from '../project-player/types';

// ---------------------------------------------------------------------------
// Status-based download option visibility (Section 3.6)
// ---------------------------------------------------------------------------

export interface DownloadModuleOption {
  key: keyof DownloadConfig | string;
  labelKey: string; // i18n key
  enabled: boolean;
  recommended: boolean;
  required?: boolean;
  nested?: { key: string; labelKey: string; enabled: boolean; recommended: boolean,required?: boolean; }[];
}

const getObservationTasks = (tasks: Task[]): DownloadModuleOption[] => {
  const observations: DownloadModuleOption[] = [];

  const traverse = (items: Task[]) => {
    items.forEach((item) => {
      if (item.type === 'observation') {
        observations.push({key:item?._id,labelKey: item?.name,enabled:true, recommended:true, required: true});
      }

      if (item.children?.length) {
        traverse(item.children);
      }
    });
  };

  traverse(tasks);

  return observations;
};

/**
 * Returns the download options (enabled/disabled, recommended) for a participant
 * based on their current status. Used to populate the DownloadConfigModal.
 *
 * Section 3.6 mapping:
 *   NOT_ONBOARDED → participant, project, logVisit, householdProfile
 *   IN_PROGRESS   → participant, project, logVisit, individualVisit, midline
 *   COMPLETED     → participant, project (read-only), individualVisit, midline, interventionPlan, endline
 */
export function getDownloadOptions(participantStatus: string,project?: ProjectData): DownloadModuleOption[] {
  const isNotOnboarded = participantStatus === STATUS.NOT_ONBOARDED || participantStatus === STATUS.NOT_ENROLLED;
  const isInProgress   = participantStatus === STATUS.IN_PROGRESS;
  const isCompleted    = participantStatus === STATUS.COMPLETED || participantStatus === STATUS.GRADUATED;
  let taskObservation: DownloadModuleOption[] = [];
  
  if(project?.children || project?.tasks) {
    taskObservation = getObservationTasks(project.children || project.tasks || []);
  }
  
  return [
    {
      key: 'participant',
      labelKey: 'actions.downloadParticipant',
      enabled: true,
      recommended: true,
    },
    {
      key: 'project',
      labelKey: 'actions.downloadProject',
      enabled: true,
      recommended: true,
      ...(taskObservation?.length > 0
      ? {nested:taskObservation} : {}),
    },
    {
      key: 'observation',
      labelKey: 'actions.observation.forms',
      enabled: isNotOnboarded || isInProgress || isCompleted,
      recommended: isNotOnboarded || isInProgress,
      nested: [
        {
          key: 'logVisit',
          labelKey: 'actions.downloadLogVisit',
          enabled: isNotOnboarded || isInProgress,
          recommended: isNotOnboarded || isInProgress,
        },
        {
          key: 'individualVisit',
          labelKey: 'actions.downloadIndividualVisit',
          enabled: isInProgress || isCompleted,
          recommended: isInProgress,
        },
        {
          key: 'midline',
          labelKey: 'actions.downloadMidline',
          enabled: isInProgress || isCompleted,
          recommended: false,
        },
        {
          key: 'interventionPlan',
          labelKey: 'actions.downloadInterventionPlan',
          enabled: isCompleted,
          recommended: isCompleted,
        },
        {
          key: 'endline',
          labelKey: 'actions.downloadEndline',
          enabled: isCompleted,
          recommended: isCompleted,
        },
      ],
    },
  ];
}

/**
 * Builds a DownloadConfig from the user's checkbox selections.
 * `selected` is a flat set of keys: 'participant', 'project', 'logVisit', etc.
 */
export function buildDownloadConfig(selected: Set<string>): DownloadConfig {
  return {
    participant: selected.has('participant'),
    project:     selected.has('project'),
    tasks:       selected.has('project'), // tasks are always bundled with project
    observation: {
      logVisit:         selected.has('logVisit'),
      householdProfile: selected.has('householdProfile'),
      individualVisit:  selected.has('individualVisit'),
      midline:          selected.has('midline'),
      interventionPlan: selected.has('interventionPlan'),
      endline:          selected.has('endline'),
    },
    files:     false,
    timestamp: Date.now(),
  };
}

/**
 * Builds the default/recommended selection set for a given status.
 */
export function getDefaultSelection(participantStatus: string,project?:ProjectData): {selected:Set<string>, options:DownloadModuleOption[]} {
  const options = getDownloadOptions(participantStatus,project);
  const selected = new Set<string>();

  for (const opt of options) {
    if (opt.recommended && opt.enabled) selected.add(opt.key as string);
    for (const nested of opt.nested ?? []) {
      if (nested.recommended && nested.enabled) selected.add(nested.key);
    }
  }
  return { selected, options }
}
