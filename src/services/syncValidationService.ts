/**
 * SyncValidationService — validates pending offline data against the current
 * online state before any sync API call is executed.
 *
 * Three outcomes per item:
 *   'blocked'  — online status has advanced beyond offline; skip silently
 *   'conflict' — statuses are equal but timestamps diverge; ask user to confirm
 *   'allowed'  — safe to sync immediately
 *
 * A fourth outcome 'remove' applies only to observation forms whose online
 * submission is already COMPLETED — the user may choose to delete offline data.
 *
 * Usage:
 *   const cache = createSyncValidationCache();
 *   const plan  = await runValidationForParticipant(participantId, userId, cache);
 *   const skip  = buildSkipSets(plan, userDecisions);
 *   await startSync(participantId, userId, onProgress, skip);
 *
 * Pass the same cache to every call inside startSyncAll so participant /
 * project / observation data is fetched at most once per Global Sync session.
 */

import logger from '@utils/logger';
import offlineStorage from './offlineStorage';
import { PARTICIPANT_KEYS } from '@constants/STORAGE_KEYS';
import type { ObservationFormData, DownloadStatus } from '@app-types/offline';
import { getParticipantsList } from './participantService';
import { getProjectDetails } from '../project-player/services/projectPlayerService';
import { getObservationSolution } from './solutionService';

// ── Status priority maps ─────────────────────────────────────────────────────

/** Higher number = further along the program journey. */
export const PARTICIPANT_STATUS_PRIORITY: Record<string, number> = {
  NOT_ONBOARDED: 1,
  ONBOARDED:     2,
  IN_PROGRESS:   3,
  COMPLETED:     4,
  GRADUATED:     4,
};

/** Higher number = more complete. draft / started / in-progress all rank as 2. */
export const PROJECT_TASK_STATUS_PRIORITY: Record<string, number> = {
  notStarted:    1,
  'not-started': 1,
  draft:         2,
  started:       2,
  'in-progress': 2,
  completed:     3,
  submitted:     3,
};

/** Observation statuses — DRAFT sits between STARTED and COMPLETED. */
export const OBSERVATION_STATUS_PRIORITY: Record<string, number> = {
  notStarted:    1,
  'not-started': 1,
  started:       2,
  draft:         3,
  completed:     4,
};

// ── Types ────────────────────────────────────────────────────────────────────

export type ValidationOutcome = 'blocked' | 'conflict' | 'allowed';
export type ObservationOutcome = ValidationOutcome | 'remove';

export interface TaskValidationResult {
  taskId: string;
  /** The project this task belongs to — needed for targeted removal in the UI. */
  projectId: string;
  outcome: ValidationOutcome;
}

export interface FormValidationResult {
  formId: string;
  outcome: ObservationOutcome;
  submissionId?: string;
}

/** Complete per-participant validation plan produced before sync starts. */
export interface ParticipantValidationPlan {
  participantId: string;
  /** Online participant status is ahead → block everything. */
  participantBlocked: boolean;
  participantBlockReason?: string;
  /** Online status value at validation time — shown in the participant-blocked dialog. */
  onlineParticipantStatus?: string;
  /** Equal status but timestamp diverges → ask user before syncing. */
  participantConflict: boolean;
  projectBlocked: boolean;
  /** IDs of projects whose online status is ahead — used for per-project skip/removal. */
  blockedProjectIds: string[];
  projectBlockReason?: string;
  projectConflict: boolean;
  /** IDs of projects with equal status but timestamp divergence — show conflict dialog. */
  conflictProjectIds: string[];
  taskResults: TaskValidationResult[];
  formResults: FormValidationResult[];
}

/** In-memory cache shared across all participants during one Global Sync session. */
export interface SyncValidationCache {
  participants: Map<string, any>;
  projects:     Map<string, any>;
  /** Key pattern: `${observationId}:${entityId}:${submissionNumber}` */
  observations: Map<string, any>;
}

export function createSyncValidationCache(): SyncValidationCache {
  return {
    participants: new Map(),
    projects:     new Map(),
    observations: new Map(),
  };
}

// ── Internal helpers ─────────────────────────────────────────────────────────

function getPriority(map: Record<string, number>, status: string | undefined): number {
  return map[status ?? ''] ?? 0;
}

function hasTimestampConflict(
  downloadedAt: number | undefined,
  offlineUpdatedAt: string | undefined,
  onlineUpdatedAt: string | undefined,
): boolean {
  if (!onlineUpdatedAt) return false;
  const onlineMs = new Date(onlineUpdatedAt).getTime();

  if (offlineUpdatedAt) {
    const offlineMs = new Date(offlineUpdatedAt).getTime();
    if (onlineMs > offlineMs) return true;
    if (onlineMs !== offlineMs) return true;
  }

  if (downloadedAt !== undefined && downloadedAt < onlineMs) return true;
  return false;
}

// ── Cached API fetchers ──────────────────────────────────────────────────────

async function fetchParticipantOnline(
  participantId: string,
  userId: string,
  cache?: SyncValidationCache,
): Promise<any | null> {
  if (cache?.participants.has(participantId)) return cache.participants.get(participantId);
  try {
    const res = await getParticipantsList({ userId, entityId: participantId, page: 1, limit: 1 });
    const data = res?.result?.data?.[0] ?? null;
    cache?.participants.set(participantId, data);
    return data;
  } catch (err) {
    logger.warn('SyncValidation: fetchParticipantOnline failed', err);
    return null;
  }
}

async function fetchProjectOnline(
  projectId: string,
  userId: string,
  cache?: SyncValidationCache,
): Promise<any | null> {
  if (cache?.projects.has(projectId)) return cache.projects.get(projectId);
  try {
    const res = await getProjectDetails(projectId, userId);
    const data = res?.data ?? null;
    cache?.projects.set(projectId, data);
    return data;
  } catch (err) {
    logger.warn('SyncValidation: fetchProjectOnline failed', err);
    return null;
  }
}

async function fetchObservationOnline(
  observationId: string,
  entityId: string,
  submissionNumber: number,
  evidenceCode: string,
  cache?: SyncValidationCache,
): Promise<any | null> {
  const key = `${observationId}:${entityId}:${submissionNumber}`;
  if (cache?.observations.has(key)) return cache.observations.get(key);
  try {
    const res = await getObservationSolution({ observationId, entityId, submissionNumber, evidenceCode });
    const data = res?.result ?? res ?? null;
    cache?.observations.set(key, data);
    return data;
  } catch (err) {
    logger.warn('SyncValidation: fetchObservationOnline failed', err);
    return null;
  }
}

// ── Key parsing ──────────────────────────────────────────────────────────────

function parseFormIdFromStorageKey(key: string): string | null {
  const formMarker = ':form:';
  const editsMarker = ':edits';
  const start = key.indexOf(formMarker);
  const end = key.lastIndexOf(editsMarker);
  if (start === -1 || end === -1) return null;
  return key.slice(start + formMarker.length, end) || null;
}

function buildOnlineTaskMap(project: any): Map<string, any> {
  const map = new Map<string, any>();
  function traverse(tasks: any[]) {
    for (const t of tasks ?? []) {
      map.set(t._id, t);
      if (t.children?.length) traverse(t.children);
      if (t.tasks?.length)    traverse(t.tasks);
    }
  }
  traverse(project?.tasks    ?? []);
  traverse(project?.children ?? []);
  return map;
}

// ── Main export: per-participant validation ──────────────────────────────────

/**
 * Validates all pending offline changes for one participant against the current
 * online state. Returns a `ParticipantValidationPlan` describing which items are
 * safe to sync, which must be skipped, and which require user confirmation.
 *
 * Supply a `SyncValidationCache` when invoking this inside a Global Sync loop
 * so that remote data fetched for one participant is reused for others within
 * the same session.
 */
export async function runValidationForParticipant(
  participantId: string,
  userId: string,
  cache?: SyncValidationCache,
): Promise<ParticipantValidationPlan> {
  const plan: ParticipantValidationPlan = {
    participantId,
    participantBlocked: false,
    participantConflict: false,
    projectBlocked: false,
    blockedProjectIds: [],
    projectConflict: false,
    conflictProjectIds: [],
    taskResults: [],
    formResults: [],
  };

  // ── Baseline offline data ──────────────────────────────────────────────────
  const [offlineParticipant, downloadStatus] = await Promise.all([
    offlineStorage.read<any>(PARTICIPANT_KEYS.details(userId, participantId)).catch(() => null),
    offlineStorage.read<DownloadStatus>(PARTICIPANT_KEYS.downloadStatus(userId, participantId)).catch(() => null),
  ]);
  const downloadedAt = downloadStatus?.completedAt;

  // ── Validation 1: Participant status ───────────────────────────────────────
  const onlineParticipantRaw = await fetchParticipantOnline(participantId, userId, cache);
  if (onlineParticipantRaw) {
    const { userDetails, ...rest } = onlineParticipantRaw;
    const onlineParticipant = { ...(userDetails ?? {}), ...rest };

    const offlinePri = getPriority(PARTICIPANT_STATUS_PRIORITY, offlineParticipant?.status);
    const onlinePri  = getPriority(PARTICIPANT_STATUS_PRIORITY, onlineParticipant.status);

    if (onlinePri > offlinePri) {
      plan.participantBlocked = true;
      plan.onlineParticipantStatus = onlineParticipant.status;
      plan.participantBlockReason =
        `Participant has already progressed to "${onlineParticipant.status}" online.`;
      // Block everything — no further validation needed.
      return plan;
    }

    if (onlinePri === offlinePri) {
      if (hasTimestampConflict(downloadedAt, offlineParticipant?.updatedAt, onlineParticipant.updatedAt)) {
        plan.participantConflict = true;
      }
    }
  }

  // ── Validation 2 & 3: Project + Task statuses ──────────────────────────────
  const allKeys = await offlineStorage.getParticipantKeys(userId, participantId).catch(() => [] as string[]);
  const projectEditKeys = allKeys.filter((k: string) => k.includes(':projectEdits:'));

  for (const editKey of projectEditKeys) {
    const projectId = editKey.split(':projectEdits:')[1];
    if (!projectId) continue;

    const [onlineProject, offlineProject, projectEdits] = await Promise.all([
      fetchProjectOnline(projectId, userId, cache),
      offlineStorage.read<any>(PARTICIPANT_KEYS.project(userId, participantId, projectId)).catch(() => null),
      offlineStorage.read<{ tasks: any[] }>(editKey).catch(() => null),
    ]);

    if (!onlineProject || !offlineProject) continue;

    const offlineProjPri = getPriority(PROJECT_TASK_STATUS_PRIORITY, offlineProject.status);
    const onlineProjPri  = getPriority(PROJECT_TASK_STATUS_PRIORITY, onlineProject.status);

    if (onlineProjPri > offlineProjPri) {
      plan.projectBlocked = true;
      plan.blockedProjectIds.push(projectId);
      plan.projectBlockReason =
        `Project status online ("${onlineProject.status}") is ahead of offline ("${offlineProject.status}").`;
    } else if (onlineProjPri === offlineProjPri) {
      if (hasTimestampConflict(downloadedAt, offlineProject.updatedAt, onlineProject.updatedAt)) {
        plan.projectConflict = true;
        plan.conflictProjectIds.push(projectId);
      }
    }

    // Validation 3: individual task statuses (only when project itself is not blocked)
    if (!plan.projectBlocked && projectEdits?.tasks?.length) {
      const onlineTaskMap = buildOnlineTaskMap(onlineProject);
      for (const offlineTask of projectEdits.tasks) {
        const onlineTask = onlineTaskMap.get(offlineTask._id);
        if (!onlineTask) continue;

        const offlineTaskPri = getPriority(PROJECT_TASK_STATUS_PRIORITY, offlineTask.status);
        const onlineTaskPri  = getPriority(PROJECT_TASK_STATUS_PRIORITY, onlineTask.status);

        plan.taskResults.push({
          taskId: offlineTask._id,
          projectId,
          outcome: onlineTaskPri > offlineTaskPri ? 'blocked' : 'allowed',
        });
      }
    }
  }

  // ── Validation 4: Observation form statuses ────────────────────────────────
  const formEditKeys = allKeys.filter(
    (k: string) => k.endsWith(':edits') && k.includes(':form:'),
  );

  for (const formEditKey of formEditKeys) {
    const editData = await offlineStorage.read<any>(formEditKey).catch(() => null);
    if (!editData) continue;

    const { solutionId } = editData;
    const formId = solutionId || parseFormIdFromStorageKey(formEditKey);
    if (!formId) continue;

    const formData = await offlineStorage
      .read<ObservationFormData>(PARTICIPANT_KEYS.form(userId, participantId, formId))
      .catch(() => null);

    if (!formData?.entityId || !formData?.observationId) continue;

    // Extract evidenceCode from the cached schema; fall back to common defaults.
    const evidenceCode: string =
      formData.schema?.assessment?.evidences?.[0]?.code ??
      formData.schema?.evidenceMethod?.code ??
      'OB';

    const onlineObs = await fetchObservationOnline(
      formData.observationId,
      formData.entityId,
      formData.submissionNumber,
      evidenceCode,
      cache,
    );

    if (!onlineObs) continue;

    const onlineSubmission = onlineObs.submission ?? onlineObs;
    const onlineObsStatus: string = onlineSubmission?.status ?? 'notStarted';

    // Rule 4: already completed online → offer removal
    if (onlineObsStatus === 'completed') {
      plan.formResults.push({ formId, outcome: 'remove', submissionId: formData.submissionId });
      continue;
    }

    const offlineObsPri = getPriority(OBSERVATION_STATUS_PRIORITY, formData.status);
    const onlineObsPri  = getPriority(OBSERVATION_STATUS_PRIORITY, onlineObsStatus);

    if (onlineObsPri > offlineObsPri) {
      plan.formResults.push({ formId, outcome: 'blocked' });
      continue;
    }

    if (onlineObsPri === offlineObsPri) {
      const onlineUpdatedAt: string | undefined = onlineSubmission?.updatedAt;
      if (hasTimestampConflict(downloadedAt, formData.updatedAt, onlineUpdatedAt)) {
        plan.formResults.push({ formId, outcome: 'conflict', submissionId: formData.submissionId });
        continue;
      }
    }

    plan.formResults.push({ formId, outcome: 'allowed' });
  }

  return plan;
}

/**
 * Converts a `ParticipantValidationPlan` into sets of IDs to skip when calling
 * `startSync`.  Items in the skip sets are not sent to the server this session.
 *
 * Rules:
 *   - Blocked projects  → skipProjectIds (entire project's tasks skipped)
 *   - Blocked tasks     → skipTaskIds
 *   - Blocked/remove forms → skipFormIds (data may already have been removed by UI)
 *   - Conflict forms    → allowed (equal status, sync proceeds)
 *   - Allowed forms     → allowed
 */
export function buildSkipSets(
  plan: ParticipantValidationPlan,
): { skipFormIds: Set<string>; skipTaskIds: Set<string>; skipProjectIds: Set<string> } {
  const skipFormIds = new Set<string>();
  const skipTaskIds = new Set<string>();
  const skipProjectIds = new Set<string>();

  for (const projectId of plan.blockedProjectIds) {
    skipProjectIds.add(projectId);
  }

  for (const t of plan.taskResults) {
    if (t.outcome === 'blocked') skipTaskIds.add(t.taskId);
  }

  for (const f of plan.formResults) {
    if (f.outcome === 'blocked' || f.outcome === 'remove' || f.outcome === 'conflict') {
      skipFormIds.add(f.formId);
    }
    // 'allowed' → sync normally
  }

  return { skipFormIds, skipTaskIds, skipProjectIds };
}
