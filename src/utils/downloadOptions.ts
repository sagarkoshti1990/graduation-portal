import type { DownloadConfig } from '@app-types/offline';
import { ALLOWOFFLINESTATUS, STATUS } from '@constants/app.constant';
import { ProjectData, Task } from '../project-player/types';
import { Participant } from '@app-types/screens';

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
        // {
        //   key: 'interventionPlan',
        //   labelKey: 'actions.downloadInterventionPlan',
        //   enabled: isCompleted,
        //   recommended: isCompleted,
        // },
        // {
        //   key: 'endline',
        //   labelKey: 'actions.downloadEndline',
        //   enabled: isCompleted,
        //   recommended: isCompleted,
        // },
      ],
    },
  ];
}

/**
 * Returns every possible download module, unfiltered by any single participant's
 * status — used to populate the bulk-download selection popup, where one selection
 * is made up-front for a batch of participants who may each be in a different state.
 * A module is included if it is enabled for at least one status. Per-participant
 * availability is resolved later, at download time, via getDownloadOptions(status).
 */
export function getAllDownloadOptions(status:any[]): DownloadModuleOption[] {
  const perStatus = status.map(status =>
    getDownloadOptions(status),
  );

  return perStatus[0].map((opt, i) => {
    const enabled = perStatus.some(list => list[i].enabled);
    const nested = opt.nested?.map((nestedOpt, j) => {
      const nestedEnabled = perStatus.some(list => list[i].nested?.[j]?.enabled);
      return { ...nestedOpt, enabled: nestedEnabled, recommended: nestedEnabled };
    });
    return { ...opt, enabled, recommended: enabled, ...(nested ? { nested } : {}) };
  });
}

/**
 * Default/all-selected set for the bulk popup — every module available to at
 * least one participant status starts checked; the user can deselect any of them.
 */
export function getAllDefaultSelection(participants:Participant[]): { selected: Set<string>; options: DownloadModuleOption[] } {
  const statuses = participants.map(participant => participant.status).filter(status => ALLOWOFFLINESTATUS.includes(status || ""));
  const options = getAllDownloadOptions(statuses);
  const selected = new Set<string>();
  for (const opt of options) {
    if (opt.recommended && opt.enabled) selected.add(opt.key as string);
    for (const nested of opt.nested ?? []) {
      if (nested.recommended && nested.enabled) selected.add(nested.key);
    }
  }
  return { selected, options };
}

/** Flattens a DownloadModuleOption tree into the set of keys enabled at that level. */
export function getEnabledKeys(options: DownloadModuleOption[]): Set<string> {
  const keys = new Set<string>();
  for (const opt of options) {
    if (opt.enabled) keys.add(opt.key as string);
    for (const nested of opt.nested ?? []) {
      if (nested.enabled) keys.add(nested.key);
    }
  }
  return keys;
}

export interface ResolvedDownloadContext {
  participantStatus: string;
  resolvedProjectId?: string;
  needsOnboarding: boolean;
  resolvedProvince?: string;
  resolvedEntityId?: string;
  /** true when an IN_PROGRESS participant has no IDP project — download cannot proceed. */
  missingProject: boolean;
}

/**
 * Resolves the project id / province / entityId / onboarding-needed fields required
 * to call startDownload, from a fetched participant record. Shared by the single and
 * bulk download modals so this resolution isn't duplicated between them.
 */
export function resolveDownloadContext(participantData: any): ResolvedDownloadContext {
  const participantStatus = participantData?.status;
  const projectId = participantData?.idpProjectId;
  const onBoardedProjectId = participantData?.onBoardedProjectId;
  const needsOnboarding = participantStatus === STATUS.NOT_ONBOARDED && !onBoardedProjectId;
  const missingProject = participantStatus === STATUS.IN_PROGRESS && !projectId;

  const resolvedProjectId = missingProject
    ? undefined
    : participantStatus === STATUS.IN_PROGRESS
    ? projectId
    : participantStatus === STATUS.NOT_ONBOARDED
    ? (onBoardedProjectId || undefined)
    : undefined;

  const rawProvince = participantData?.province ?? participantData?.userDetails?.province;
  const resolvedProvince: string | undefined =
    typeof rawProvince === 'string' ? rawProvince : rawProvince?.value ?? rawProvince?.label;

  const resolvedEntityId: string | undefined =
    participantData?.entityId ??
    participantData?.entity_id ??
    participantData?.userDetails?.entityId ??
    participantData?.userId;

  return { participantStatus, resolvedProjectId, needsOnboarding, resolvedProvince, resolvedEntityId, missingProject };
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
      // householdProfile: selected.has('householdProfile'),
      individualVisit:  selected.has('individualVisit'),
      midline:          selected.has('midline'),
      // interventionPlan: selected.has('interventionPlan'),
      // endline:          selected.has('endline'),
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
