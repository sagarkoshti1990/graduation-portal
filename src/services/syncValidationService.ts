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
import { getObservationSubmissions } from './solutionService';

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

/** Detailed conflict data shown in the per-task conflict dialog. */
export interface TaskConflictDetails {
  taskName: string;
  taskExternalId?: string;
  /** Set when the conflicting task is a child task — names the parent for dialog context. */
  parentTaskName?: string;
  offlineStatus: string;
  onlineStatus: string;
  offlineUpdatedAt?: string;
  onlineUpdatedAt?: string;
  offlineEvidenceCount: number;
  onlineEvidenceCount: number;
  offlineFileNames: string[];
  onlineFileNames: string[];
  /** One or more reasons explaining why the conflict was detected. */
  conflictReasons: Array<'status-ahead' | 'timestamp-conflict' | 'evidence-differs'>;
}

export interface TaskValidationResult {
  taskId: string;
  /** The project this task belongs to — needed for targeted removal in the UI. */
  projectId: string;
  outcome: 'conflict' | 'allowed';
  /** Present when outcome is 'conflict' — drives the rich comparison dialog. */
  conflictDetails?: TaskConflictDetails;
}

/** Rich comparison data for the 'form-conflict' dialog — mirrors TaskConflictDetails for observations. */
export interface ObservationConflictDetails {
  observationName: string;
  observationId: string;
  submissionNumber: number;
  submissionId: string;
  offlineStatus: string;
  offlineUpdatedAt?: string;
  onlineStatus: string;
  onlineUpdatedAt?: string;
  offlineAnsweredCount: number;
  offlineUnansweredCount: number;
  onlineAnsweredCount: number;
  onlineUnansweredCount: number;
  offlineEvidenceCount: number;
  offlineFileNames: string[];
  onlineEvidenceCount: number;
  onlineFileNames: string[];
  /** Why the conflict was detected. */
  conflictReasons: Array<'draft-ahead' | 'timestamp' | 'completed' | 'status-ahead'>;
}

export interface FormValidationResult {
  formId: string;
  outcome: ObservationOutcome;
  submissionId?: string;
  /** Distinguishes observation conflict sub-types for appropriate dialog messaging. */
  conflictSubType?: 'draft-ahead' | 'status-ahead' | 'timestamp';
  /** Rich comparison data for the 'form-conflict' dialog. */
  conflictDetails?: ObservationConflictDetails;
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
  /** Key pattern: `${observationId}:${entityId}` → full submissions list for that observation. */
  observations: Map<string, any[]>;
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

// ── Observation conflict detail helpers ─────────────────────────────────────

/**
 * Extracts total question count from an observation schema.
 * Tries common schema structures; returns 0 if the structure is unrecognised.
 */
function extractTotalQuestions(schema: any): number {
  const evidences: any[] = schema?.assessment?.evidences ?? [];
  let total = 0;
  for (const ev of evidences) {
    // Some schemas have ev.questions[], others have ev.sections[].questions[]
    const qs: any[] = ev.questions ?? ev.sections?.flatMap((s: any) => s.questions ?? []) ?? [];
    total += qs.length;
  }
  return total;
}

/**
 * Counts answered questions and extracts file references from an answers object.
 *
 * A "question" is answered when its value is a non-empty primitive, array, or
 * object.  File references are detected by the presence of a data URL prefix
 * (`data:`) or a string that looks like an https URL to a hosted file.
 */
function countAnsweredAndFiles(answers: any): { answered: number; fileNames: string[] } {
  if (!answers || typeof answers !== 'object') return { answered: 0, fileNames: [] };
  let answered = 0;
  const fileNames: string[] = [];

  function scan(obj: any): void {
    if (!obj || typeof obj !== 'object') return;
    for (const [key, val] of Object.entries(obj)) {
      if (val === null || val === undefined || val === '') continue;
      if (typeof val === 'string') {
        answered++;
        if (val.startsWith('data:')) {
          const ext = val.match(/^data:([^;]+)/)?.[1]?.split('/')[1] ?? 'bin';
          fileNames.push(`${key}.${ext}`);
        } else if (val.startsWith('https://') || val.startsWith('http://')) {
          const name = val.split('/').pop()?.split('?')[0];
          if (name) fileNames.push(name);
        }
      } else if (typeof val === 'boolean' || typeof val === 'number') {
        answered++;
      } else if (Array.isArray(val)) {
        if (val.length > 0) answered++;
      } else if (typeof val === 'object') {
        scan(val);
      }
    }
  }

  scan(answers);
  return { answered, fileNames };
}

/**
 * Builds the rich `ObservationConflictDetails` object shown in the conflict
 * dialog.  Counts offline answers from stored edits and fetches online answers
 * via `getObservationSubmissions` with `getAnswers: true` (best-effort — the
 * dialog still shows if the online fetch fails, with online counts set to 0).
 */
async function buildObservationConflictDetails(
  formData: ObservationFormData,
  editData: any,
  onlineStatus: string,
  onlineUpdatedAt: string | undefined,
  conflictSubType: 'draft-ahead' | 'timestamp' | 'completed' | 'status-ahead',
): Promise<ObservationConflictDetails> {
  const totalQuestions = extractTotalQuestions(formData.schema);
  const offlineAnswers = editData?.answers ?? formData.data ?? {};
  const { answered: offlineAnswered, fileNames: offlineFiles } = countAnsweredAndFiles(offlineAnswers);

  let onlineAnswered = 0;
  let onlineFiles: string[] = [];
  try {
    const res = await getObservationSubmissions({
      observationId: formData.observationId,
      entityId: formData.entityId,
      getAnswers: true,
    });
    const fullSub = (res?.result ?? []).find((s: any) => s._id === formData.submissionId);
    if (fullSub?.answers) {
      const onlineCount = countAnsweredAndFiles(fullSub.answers);
      onlineAnswered = onlineCount.answered;
      onlineFiles = onlineCount.fileNames;
    }
  } catch (err) {
    logger.warn('SyncValidation: buildObservationConflictDetails — online answers fetch failed', err);
  }

  const observationName: string =
    formData.schema?.assessment?.name ??
    formData.schema?.solution?.name ??
    formData.schema?.name ??
    formData.observationId;

  return {
    observationName,
    observationId: formData.observationId,
    submissionNumber: formData.submissionNumber,
    submissionId: formData.submissionId,
    offlineStatus: formData.status,
    offlineUpdatedAt: formData.updatedAt,
    onlineStatus,
    onlineUpdatedAt,
    offlineAnsweredCount: offlineAnswered,
    offlineUnansweredCount: Math.max(0, totalQuestions - offlineAnswered),
    onlineAnsweredCount: onlineAnswered,
    onlineUnansweredCount: Math.max(0, totalQuestions - onlineAnswered),
    offlineEvidenceCount: offlineFiles.length,
    offlineFileNames: offlineFiles,
    onlineEvidenceCount: onlineFiles.length,
    onlineFileNames: onlineFiles,
    conflictReasons: [conflictSubType],
  };
}

/**
 * Fetches the specific online submission record for an offline observation.
 *
 * Calls `getObservationSubmissions` (the same API used elsewhere in the app),
 * caches the full submissions list by `${observationId}:${entityId}`, then
 * filters to the entry whose `_id` matches the offline `submissionId`.
 *
 * Returns: the matched submission object (with `status` and `updatedAt`), or
 * null if the API call fails or the submission is not found.
 */
async function fetchObservationSubmission(
  observationId: string,
  entityId: string,
  submissionId: string,
  cache?: SyncValidationCache,
): Promise<any | null> {
  const listKey = `${observationId}:${entityId}`;

  let submissions: any[];
  if (cache?.observations.has(listKey)) {
    submissions = cache.observations.get(listKey) ?? [];
  } else {
    try {
      const res = await getObservationSubmissions({ observationId, entityId });
      submissions = res?.result ?? [];
      cache?.observations.set(listKey, submissions);
    } catch (err) {
      logger.warn('SyncValidation: fetchObservationSubmission failed', err);
      return null;
    }
  }

  return submissions.find((s: any) => s._id === submissionId) ?? null;
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

    // Validation 3: per-task conflict detection (skip observation-type tasks).
    // Supports two levels: parent tasks and their children.  Exactly two levels
    // are supported; no recursive descent beyond children is performed.
    if (!plan.blockedProjectIds.includes(projectId) && projectEdits?.tasks?.length) {
      const onlineTaskMap = buildOnlineTaskMap(onlineProject);
      const offlineSnapshotTaskMap = buildOnlineTaskMap(offlineProject);

      // Validate a single task (parent or child).  parentTaskName is provided
      // only when the task is a child, so the conflict dialog can show context.
      function validateOneTask(editTask: any, parentTaskName?: string): void {
        const onlineTask = onlineTaskMap.get(editTask._id);
        if (!onlineTask) return;
        // Observation form tasks are handled by the Observation Sync Queue — skip.
        if (onlineTask.type === 'observation') return;

        const offlineSnapshotTask = offlineSnapshotTaskMap.get(editTask._id);

        // Rule 1: online task status is ahead of what the user edited offline
        const editStatus = editTask.status ?? offlineSnapshotTask?.status ?? '';
        const offlineTaskPri = getPriority(PROJECT_TASK_STATUS_PRIORITY, editStatus);
        const onlineTaskPri  = getPriority(PROJECT_TASK_STATUS_PRIORITY, onlineTask.status ?? '');
        const statusConflict = onlineTaskPri > offlineTaskPri;

        // Rule 2: online task was modified after the offline download
        const tsConflict = hasTimestampConflict(
          downloadedAt,
          offlineSnapshotTask?.updatedAt,
          onlineTask.updatedAt,
        );

        if (!statusConflict && !tsConflict) {
          plan.taskResults.push({ taskId: editTask._id, projectId, outcome: 'allowed' });
          return;
        }

        // Build evidence comparison for the conflict dialog
        const offlineAtts: any[] = editTask.attachments ?? offlineSnapshotTask?.attachments ?? [];
        const onlineAtts: any[]  = onlineTask.attachments ?? [];
        const offlineNames = offlineAtts.map((a: any) => a.originalName ?? a.name ?? '');
        const onlineNames  = onlineAtts.map((a: any) => a.originalName ?? a.name ?? '');
        const evidenceDiffers =
          offlineAtts.length !== onlineAtts.length ||
          offlineNames.some((f: string) => !onlineNames.includes(f));

        const conflictReasons: TaskConflictDetails['conflictReasons'] = [];
        if (statusConflict)  conflictReasons.push('status-ahead');
        if (tsConflict)      conflictReasons.push('timestamp-conflict');
        if (evidenceDiffers) conflictReasons.push('evidence-differs');

        plan.taskResults.push({
          taskId: editTask._id,
          projectId,
          outcome: 'conflict',
          conflictDetails: {
            taskName: onlineTask.name ?? offlineSnapshotTask?.name ?? editTask._id,
            taskExternalId: onlineTask.externalId ?? offlineSnapshotTask?.externalId,
            parentTaskName,
            offlineStatus: editStatus,
            onlineStatus: onlineTask.status ?? '',
            offlineUpdatedAt: offlineSnapshotTask?.updatedAt,
            onlineUpdatedAt: onlineTask.updatedAt,
            offlineEvidenceCount: offlineAtts.length,
            onlineEvidenceCount: onlineAtts.length,
            offlineFileNames: offlineNames,
            onlineFileNames: onlineNames,
            conflictReasons,
          },
        });
      }

      for (const editTask of projectEdits.tasks) {
        if (editTask.children?.length) {
          // Parent has children → validate each child; skip the parent itself.
          // Resolve the parent name from the online or offline snapshot for dialog context.
          const onlineParent = onlineTaskMap.get(editTask._id);
          const offlineParent = offlineSnapshotTaskMap.get(editTask._id);
          const parentName: string =
            onlineParent?.name ?? offlineParent?.name ?? editTask._id;
          for (const editChild of editTask.children) {
            validateOneTask(editChild, parentName);
          }
        } else {
          // No children → validate the parent task directly.
          validateOneTask(editTask);
        }
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

    if (!formData?.entityId || !formData?.observationId || !formData?.submissionId) continue;

    // Fetch the specific online submission by submissionId using getObservationSubmissions.
    const onlineSubmission = await fetchObservationSubmission(
      formData.observationId,
      formData.entityId,
      formData.submissionId,
      cache,
    );

    if (!onlineSubmission) continue;

    const onlineObsStatus: string = onlineSubmission.status ?? 'notStarted';
    const onlineUpdatedAt: string | undefined = onlineSubmission.updatedAt;

    // Rule 1: already completed online → offer removal (no sync allowed)
    if (onlineObsStatus === 'completed') {
      plan.formResults.push({
        formId,
        outcome: 'remove',
        submissionId: formData.submissionId,
        conflictDetails: await buildObservationConflictDetails(
          formData, editData, onlineObsStatus, onlineUpdatedAt, 'completed',
        ),
      });
      continue;
    }

    const offlineObsPri = getPriority(OBSERVATION_STATUS_PRIORITY, formData.status);
    const onlineObsPri  = getPriority(OBSERVATION_STATUS_PRIORITY, onlineObsStatus);

    if (onlineObsPri > offlineObsPri) {
      // Rule 2: online is ahead but NOT completed (Rule 1 handles completed).
      // Always offer Override & Sync — the user decides whether to overwrite the
      // online progress rather than silently blocking the sync.
      plan.formResults.push({
        formId,
        outcome: 'conflict',
        submissionId: formData.submissionId,
        conflictSubType: 'status-ahead',
        conflictDetails: await buildObservationConflictDetails(
          formData, editData, onlineObsStatus, onlineUpdatedAt, 'status-ahead',
        ),
      });
      continue;
    }

    // Rule 4: offline status priority > online → allow sync directly (fall through to 'allowed').

    // Rule 3: same status → check timestamp divergence
    if (onlineObsPri === offlineObsPri) {
        continue;

      // if (hasTimestampConflict(formData.downloadedAt ?? downloadedAt, formData.updatedAt, onlineUpdatedAt)) {
      //   plan.formResults.push({
      //     formId,
      //     outcome: 'conflict',
      //     submissionId: formData.submissionId,
      //     conflictSubType: 'timestamp',
      //     conflictDetails: await buildObservationConflictDetails(
      //       formData, editData, onlineObsStatus, onlineUpdatedAt, 'timestamp',
      //     ),
      //   });
      //   continue;
      // }
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
    if (t.outcome === 'conflict') skipTaskIds.add(t.taskId);
  }

  for (const f of plan.formResults) {
    if (f.outcome === 'blocked' || f.outcome === 'remove' || f.outcome === 'conflict') {
      skipFormIds.add(f.formId);
    }
    // 'allowed' → sync normally
  }

  return { skipFormIds, skipTaskIds, skipProjectIds };
}
