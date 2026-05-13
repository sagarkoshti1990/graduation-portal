import logger from '@utils/logger';
import api from './api';
import offlineStorage, { addOfflineParticipantId } from './offlineStorage';
import { API_ENDPOINTS } from './apiEndpoints';
import { PARTICIPANT_KEYS } from '@constants/STORAGE_KEYS';
import type {
  DownloadConfig,
  DownloadStatus,
  DownloadModuleKey,
  ObservationFormData,
} from '@app-types/offline';
import type { Task } from '../project-player/types';
import { getProjectDetails } from '../project-player/services/projectPlayerService';
import {
  getObservationEntities,
  updateObservationEntities,
  getObservationSubmissions,
  createObservationSubmission,
  getObservationSolution,
} from './solutionService';

export interface StartDownloadParams {
  participantId: string;
  projectId: string;
  downloadConfig: DownloadConfig;
  /** The participant's list-row data, saved as listSnapshot for offline list rendering */
  participantSnapshot?: any;
}

export interface DownloadResult {
  success: boolean;
  status: DownloadStatus;
  error?: string;
}

// ---------------------------------------------------------------------------
// Retry helper
// ---------------------------------------------------------------------------

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < 3) {
        const delay = 1000 * Math.pow(2, attempt - 1);
        logger.warn(`DownloadService: Retry ${attempt}/3 for "${label}" in ${delay}ms`);
        await sleep(delay);
      }
    }
  }
  throw lastError;
}

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

async function initStatus(participantId: string): Promise<void> {
  const status: DownloadStatus = {
    status: 'in_progress',
    completedModules: [],
    failedModules: [],
    lastStep: 'start',
    startedAt: Date.now(),
  };
  await offlineStorage.create(PARTICIPANT_KEYS.downloadStatus(participantId), status);
}

async function patchStatus(participantId: string, patch: Partial<DownloadStatus>): Promise<void> {
  const current = await offlineStorage.read<DownloadStatus>(PARTICIPANT_KEYS.downloadStatus(participantId));
  await offlineStorage.create(PARTICIPANT_KEYS.downloadStatus(participantId), { ...(current ?? {}), ...patch });
}

async function markComplete(participantId: string, module: DownloadModuleKey): Promise<void> {
  const current = await offlineStorage.read<DownloadStatus>(PARTICIPANT_KEYS.downloadStatus(participantId));
  if (!current) return;
  await offlineStorage.create(PARTICIPANT_KEYS.downloadStatus(participantId), {
    ...current,
    completedModules: current.completedModules.includes(module)
      ? current.completedModules
      : [...current.completedModules, module],
    failedModules: current.failedModules.filter(m => m !== module),
    lastStep: module,
  });
}

async function markFailed(participantId: string, module: DownloadModuleKey): Promise<void> {
  const current = await offlineStorage.read<DownloadStatus>(PARTICIPANT_KEYS.downloadStatus(participantId));
  if (!current) return;
  await offlineStorage.create(PARTICIPANT_KEYS.downloadStatus(participantId), {
    ...current,
    failedModules: current.failedModules.includes(module)
      ? current.failedModules
      : [...current.failedModules, module],
    lastStep: module,
  });
}

// ---------------------------------------------------------------------------
// Pipeline steps
// ---------------------------------------------------------------------------

async function fetchAndStoreParticipant(participantId: string): Promise<any> {
  const response = await api.get(API_ENDPOINTS.GET_ENTITY_DETAILS(participantId));
  const participant = response.data?.result ?? response.data;
  await offlineStorage.create(PARTICIPANT_KEYS.details(participantId), participant);
  logger.info(`DownloadService: Stored participant "${participantId}"`);
  return participant;
}

async function fetchAndStoreProject(participantId: string, projectId: string): Promise<Task[]> {
  const response = await getProjectDetails(projectId);
  if (!response.data) throw new Error(`Project "${projectId}" returned no data`);
  const project = response.data;
  const tasks: Task[] = project.tasks ?? project.children ?? [];
  await offlineStorage.create(PARTICIPANT_KEYS.project(participantId), project);
  await offlineStorage.create(PARTICIPANT_KEYS.tasks(participantId), tasks);
  logger.info(`DownloadService: Stored project "${projectId}" with ${tasks.length} tasks`);
  return tasks;
}

async function processObservationTask(participantId: string, task: Task): Promise<void> {
  const observationId: string | undefined =
    task.solutionDetails?._id ??
    task.solutionDetails?.observationId ??
    task.solutionDetails?.id;

  if (!observationId) {
    logger.warn(`DownloadService: No observationId on task "${task._id}" — skipping`);
    return;
  }

  let entityId: string | undefined;
  const entitiesResp = await withRetry(
    () => getObservationEntities({ solutionId: observationId, profileData: {} }),
    `entities:${observationId}`,
  );
  const entities: any[] = entitiesResp?.result?.data ?? entitiesResp?.result ?? [];
  const matched = entities.find((e: any) => e.externalId === participantId || e._id === participantId);
  if (matched) entityId = matched._id;

  if (!entityId) {
    await withRetry(
      () => updateObservationEntities({ observationId, data: [participantId] }),
      `updateEntities:${observationId}`,
    );
    const refetchResp = await getObservationEntities({ solutionId: observationId, profileData: {} });
    const refetchEntities: any[] = refetchResp?.result?.data ?? refetchResp?.result ?? [];
    const refetchMatched = refetchEntities.find((e: any) => e.externalId === participantId || e._id === participantId);
    if (refetchMatched) entityId = refetchMatched._id;
  }

  if (!entityId) throw new Error(`Could not resolve entityId for observation "${observationId}"`);

  let submissionId: string | undefined;
  const subsResp = await withRetry(
    () => getObservationSubmissions({ observationId, entityId: entityId! }),
    `submissions:${observationId}`,
  );
  const submissions: any[] = subsResp?.result?.data ?? subsResp?.result ?? [];
  if (submissions.length > 0) submissionId = submissions[0]._id;

  if (!submissionId) {
    const createResp = await withRetry(
      () => createObservationSubmission({ observationId, entityId: entityId! }),
      `createSubmission:${observationId}`,
    );
    submissionId = createResp?.result?._id ?? createResp?.result?.submissionId ?? createResp?._id;
  }

  if (!submissionId) throw new Error(`Could not resolve submissionId for observation "${observationId}"`);

  const assessmentResp = await withRetry(
    () => getObservationSolution({ observationId, entityId: entityId!, submissionNumber: 1, evidenceCode: 'OB' }),
    `assessment:${observationId}`,
  );

  const formData: ObservationFormData = {
    entityId: entityId!,
    submissionId,
    submissionNumber: 1,
    schema: assessmentResp?.result ?? assessmentResp ?? {},
    data: assessmentResp?.result?.submission?.answers ?? {},
    status: 'started',
    updatedAt: new Date().toISOString(),
  };

  await offlineStorage.create(PARTICIPANT_KEYS.form(participantId, observationId), formData);
  logger.info(`DownloadService: Stored form for task "${task._id}" (obs: "${observationId}")`);
}

// ---------------------------------------------------------------------------
// Module key resolution
// ---------------------------------------------------------------------------

const OBSERVATION_KEYWORD_MAP: Record<string, string[]> = {
  'observation:logVisit':         ['log visit', 'logvisit', 'log_visit'],
  'observation:householdProfile': ['household', 'house hold'],
  'observation:individualVisit':  ['individual visit', 'individual_visit'],
  'observation:midline':          ['midline', 'mid line'],
  'observation:interventionPlan': ['intervention plan', 'intervention_plan', 'idp'],
  'observation:endline':          ['endline', 'end line'],
};

function resolveObservationModuleKey(task: Task): DownloadModuleKey {
  const nameLower = (task.name ?? '').toLowerCase();
  for (const [key, keywords] of Object.entries(OBSERVATION_KEYWORD_MAP)) {
    if (keywords.some(kw => nameLower.includes(kw))) return key as DownloadModuleKey;
  }
  return 'observation:logVisit';
}

function isModuleSelected(key: DownloadModuleKey, config: DownloadConfig): boolean {
  const map: Partial<Record<DownloadModuleKey, boolean>> = {
    'observation:logVisit':         config.observation.logVisit,
    'observation:householdProfile': config.observation.householdProfile,
    'observation:individualVisit':  config.observation.individualVisit,
    'observation:midline':          config.observation.midline,
    'observation:interventionPlan': config.observation.interventionPlan,
    'observation:endline':          config.observation.endline,
  };
  return map[key] ?? false;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const startDownload = async ({
  participantId,
  projectId,
  downloadConfig,
  participantSnapshot,
}: StartDownloadParams): Promise<DownloadResult> => {
  await initStatus(participantId);

  try {
    if (downloadConfig.participant) {
      await withRetry(() => fetchAndStoreParticipant(participantId), 'participant');
      await markComplete(participantId, 'participant');
    }

    // Always save the list-row snapshot so offline participant list can render (Section 6.5.2)
    if (participantSnapshot) {
      await offlineStorage.create(PARTICIPANT_KEYS.listSnapshot(participantId), participantSnapshot);
    }

    let tasks: Task[] = [];
    if (downloadConfig.project || downloadConfig.tasks) {
      tasks = await withRetry(() => fetchAndStoreProject(participantId, projectId), 'project');
      await markComplete(participantId, 'project');
      await markComplete(participantId, 'tasks');
    }

    const observationTasks = tasks.filter((t: Task) => t.type === 'observation');
    for (const task of observationTasks) {
      const moduleKey = resolveObservationModuleKey(task);
      if (!isModuleSelected(moduleKey, downloadConfig)) continue;
      try {
        await processObservationTask(participantId, task);
        await markComplete(participantId, moduleKey);
      } catch (err) {
        logger.error(`DownloadService: Failed observation task "${task._id}"`, err);
        await markFailed(participantId, moduleKey);
      }
    }

    await addOfflineParticipantId(participantId);

    const finalStatus = await offlineStorage.read<DownloadStatus>(PARTICIPANT_KEYS.downloadStatus(participantId));
    const resolvedStatus = (finalStatus?.failedModules ?? []).length > 0 ? 'partial' : 'completed';
    await patchStatus(participantId, { status: resolvedStatus, completedAt: Date.now() });

    logger.info(`DownloadService: "${resolvedStatus}" for participant "${participantId}"`);
    return {
      success: true,
      status: (await offlineStorage.read<DownloadStatus>(PARTICIPANT_KEYS.downloadStatus(participantId)))!,
    };
  } catch (err: any) {
    logger.error(`DownloadService: Fatal error for participant "${participantId}"`, err);
    await patchStatus(participantId, { status: 'failed' });
    return {
      success: false,
      status: (await offlineStorage.read<DownloadStatus>(PARTICIPANT_KEYS.downloadStatus(participantId)))!,
      error: err?.message ?? 'Unknown error',
    };
  }
};

export const getDownloadStatus = async (participantId: string): Promise<DownloadStatus | null> =>
  offlineStorage.read<DownloadStatus>(PARTICIPANT_KEYS.downloadStatus(participantId));
