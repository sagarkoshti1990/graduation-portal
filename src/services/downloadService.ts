import logger from '@utils/logger';
import offlineStorage, { addOfflineParticipantId } from './offlineStorage';
import { PARTICIPANT_KEYS } from '@constants/STORAGE_KEYS';
import type {
  DownloadConfig,
  DownloadStatus,
  DownloadModuleKey,
  ObservationFormData,
  OfflineSolutionEntry,
} from '@app-types/offline';
import type { Task } from '../project-player/types';
import { getProjectDetails } from '../project-player/services/projectPlayerService';
import {
  getObservationEntities,
  updateObservationEntities,
  searchObservationEntities,
  getObservationSubmissions,
  createObservationSubmission,
  getObservationSolution,
} from './solutionService';
import { getParticipantsList } from './participantService';
import { getTargetedSolutions } from './solutionService';
import { FILTER_KEYWORDS } from '@constants/LOG_VISIT_CARDS';

/** Called by the download pipeline as each module starts and finishes. */
export type DownloadProgressCallback = (
  key: string,
  state: 'loading' | 'completed' | 'failed',
) => void;

export interface StartDownloadParams {
  participantId: string;
  projectId: string;
  downloadConfig: DownloadConfig;
  /** LC's own userId — needed to call the programUsers/entities API correctly */
  lcUserId: string;
  /** The participant's list-row data, saved as listSnapshot for offline list rendering */
  participantSnapshot?: any;
  /** Optional callback for real-time per-step progress reporting to the UI. */
  onProgress?: DownloadProgressCallback;
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

async function markComplete(participantId: string, module: string): Promise<void> {
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

async function markFailed(participantId: string, module: string): Promise<void> {
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

interface ResolvedFormIds {
  entityId: string;
  submissionId: string;
  submissionNumber: number;
  observationId: string;
}

/**
 * Fetches fresh participant details from the programUsers/entities API
 * (same endpoint used by the participant list) and stores them offline.
 * Requires the LC's own userId so the API can scope results to their program.
 */
async function fetchAndStoreParticipant(participantId: string, lcUserId: string): Promise<any> {
  const response = await getParticipantsList({
    userId: lcUserId,
    entityId: participantId,
    page: 1,
    limit: 1,
  });
  const participant = response?.result?.data?.[0];
  if (!participant) throw new Error(`Participant "${participantId}" not found via programUsers API`);

  // Flatten userDetails into the top-level object so cached data matches the
  // shape that components expect (participant.phone_code, participant.email, etc.)
  const { userDetails, ...rest } = participant;
  const mappedParticipant = {
    ...(userDetails || {}),
    ...rest,
    accountUserStatus: userDetails?.status,
  };

  await offlineStorage.create(PARTICIPANT_KEYS.details(participantId), mappedParticipant);
  logger.info(`DownloadService: Stored participant "${participantId}"`);
  return mappedParticipant;
}

async function fetchAndStoreProject(participantId: string, projectId: string): Promise<Task[]> {
  const response = await getProjectDetails(projectId);
  if (!response.data) throw new Error(`Project "${projectId}" returned no data`);
  const project = response.data;
  // Flatten children[].tasks[] for pillar-structured projects; fall back to root tasks[]
  const tasks: Task[] = project.tasks
    ?? (project.children ?? []).flatMap((c: any) => c.tasks ?? []);
  // Store the full project only — tasks are extracted from it when needed (no separate key)
  await offlineStorage.create(PARTICIPANT_KEYS.project(participantId,projectId), project);
  logger.info(`DownloadService: Stored project "${projectId}" with ${tasks.length} tasks`);
  return tasks;
}

/**
 * Core form download: resolves the entity, ensures a submission exists, fetches the
 * assessment schema, and persists everything under PARTICIPANT_KEYS.form(participantId, solutionId).
 * Shared by the project-task path (HH) and the targeted-solutions path (all others).
 */
async function processObservationForm(
  participantId: string,
  participantName: string,
  solutionId: string,
): Promise<ResolvedFormIds> {
  // Step 1: Resolve entity. result._id = real observationId (may differ from solutionId).
  let entityId: string | undefined;
  const entitiesResp = await withRetry(
    () => getObservationEntities({ solutionId, profileData: {} }),
    `entities:${solutionId}`,
  );
  const observationId: string = entitiesResp?.result?._id ?? solutionId;
  const entities: any[] = entitiesResp?.result?.entities ?? entitiesResp?.result?.data ?? entitiesResp?.result ?? [];
  const matched = entities.find((e: any) => e.externalId === participantId || e._id === participantId);
  if (matched) entityId = matched._id;

  // Step 2: If not found, search by name then register
  if (!entityId) {
    const searchResp = await withRetry(
      () => searchObservationEntities({ observationId, search: participantName }),
      `searchEntities:${observationId}`,
    );
    const searchEntities: any[] = searchResp?.result?.[0]?.data ?? [];
    const searchMatched = searchEntities.find((e: any) => e.externalId === participantId);
    if (searchMatched) {
      const foundEntityId: string = searchMatched._id;
      await withRetry(
        () => updateObservationEntities({ observationId, data: [foundEntityId] }),
        `updateEntities:${observationId}`,
      );
      entityId = foundEntityId;
    }
  }

  if (!entityId) throw new Error(`Could not resolve entityId for observation "${observationId}"`);

  // Step 3: Ensure a submission exists; re-fetch after creation for a fresh evidenceCode
  let submissions: any[] = [];
  const subsResp = await withRetry(
    () => getObservationSubmissions({ observationId, entityId: entityId! }),
    `submissions:${observationId}`,
  );
  submissions = subsResp?.result ?? [];
  let submissionId: string | undefined = submissions[0]?._id;

  if (!submissionId) {
    await withRetry(
      () => createObservationSubmission({ observationId, entityId: entityId! }),
      `createSubmission:${observationId}`,
    );
    const freshResp = await withRetry(
      () => getObservationSubmissions({ observationId, entityId: entityId! }),
      `submissions-recheck:${observationId}`,
    );
    submissions = freshResp?.result ?? [];
    submissionId = submissions[0]?._id;
  }

  if (!submissionId) throw new Error(`Could not resolve submissionId for observation "${observationId}"`);

  const evidenceCode: string = submissions[0]?.evidencesStatus?.[0]?.code ?? 'OB';

  // Step 4: Fetch assessment schema + existing answers
  const assessmentResp = await withRetry(
    () => getObservationSolution({ observationId, entityId: entityId!, submissionNumber: 1, evidenceCode }),
    `assessment:${observationId}`,
  );
  const schema = assessmentResp?.result ?? assessmentResp ?? null;

  if (!schema || typeof schema !== 'object' || Object.keys(schema).length === 0) {
    throw new Error(`Empty or invalid schema returned for observation "${observationId}"`);
  }
  if (!schema.assessment?.evidences?.length) {
    throw new Error(`Schema missing evidences for observation "${observationId}" — cannot render form offline`);
  }

  const formData: ObservationFormData = {
    entityId: entityId!,
    submissionId,
    submissionNumber: 1,
    observationId,
    schema,
    data: schema?.submission?.answers ?? assessmentResp?.result?.submission?.answers ?? {},
    status: 'started',
    updatedAt: new Date().toISOString(),
  };

  // Keyed by solutionId — matches what ObservationContent passes to getObservationForm()
  await offlineStorage.create(PARTICIPANT_KEYS.form(participantId, solutionId), formData);
  logger.info(`DownloadService: Stored form for solution "${solutionId}" (obs: "${observationId}")`);
  return { entityId: entityId!, submissionId, submissionNumber: 1, observationId };
}

/** Thin wrapper used by the project-task (HH) path to extract solutionId from a task. */
async function processObservationTask(
  participantId: string,
  participantName: string,
  task: Task,
): Promise<(ResolvedFormIds & { solutionId: string }) | null> {
  const solutionId: string | undefined =
    task.solutionDetails?._id ??
    task.solutionDetails?.observationId ??
    task.solutionDetails?.id;
  if (!solutionId) {
    logger.warn(`DownloadService: No solutionId on task "${task._id}" — skipping`);
    return null;
  }
  const resolved = await processObservationForm(participantId, participantName, solutionId);
  return { ...resolved, solutionId };
}

/**
 * Calls the targeted solutions API with the given keywords, stores each matching
 * solution's form data offline, and returns the resolved IDs for the solutions mapping.
 * Per-solution failures are logged and skipped so one bad form doesn't fail the whole module.
 */
async function fetchAndStoreSolutionForms(
  participantId: string,
  participantName: string,
  keywords: string[],
  moduleKey: string,
): Promise<Array<ResolvedFormIds & { solutionId: string; keyword: string; keywords:string[] }>> {
  const results: Array<ResolvedFormIds & { solutionId: string; keyword: string, keywords:string[] }> = [];
  const solutions = await getTargetedSolutions({
    type: 'observation',
    'filter[keywords]': keywords.join(','),
  });
  if (!solutions.length) {
    logger.warn(`DownloadService: No solutions found for keywords [${keywords.join(', ')}]`);
    return results;
  }
  for (const solution of solutions) {
    if (!solution.solutionId) continue;
    try {
      const resolved = await withRetry(
        () => processObservationForm(participantId, participantName, solution.solutionId),
        `solutionForm:${solution.solutionId}`,
      );
      results.push({ ...resolved, solutionId: solution.solutionId, keyword: moduleKey,keywords });
    } catch (err) {
      logger.error(`DownloadService: Failed to store form for solution "${solution.solutionId}"`, err);
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Module map — drives both project-task (HH) and targeted-solutions paths
// ---------------------------------------------------------------------------

interface ObservationModuleSpec {
  configKey: keyof DownloadConfig['observation'];
  moduleKey: DownloadModuleKey;
  /** API filter keywords passed to getTargetedSolutions (ignored when useProjectTasks). */
  keywords: string[];
  /** true = HH: discover forms from project tasks; false = call targeted solutions API. */
  useProjectTasks: boolean;
}

const OBSERVATION_SOLUTION_DOWNLOAD_MAP: ObservationModuleSpec[] = [
  { configKey: 'logVisit',         moduleKey: 'observation:logVisit',         keywords: FILTER_KEYWORDS.PARTICIPANT_LOG_VISIT, useProjectTasks: false },
  { configKey: 'householdProfile', moduleKey: 'observation:householdProfile', keywords: [],                                    useProjectTasks: true  },
  { configKey: 'individualVisit',  moduleKey: 'observation:individualVisit',  keywords: FILTER_KEYWORDS.LOG_VISIT,             useProjectTasks: false },
  { configKey: 'midline',          moduleKey: 'observation:midline',          keywords: FILTER_KEYWORDS.MIDLINE,               useProjectTasks: false },
  { configKey: 'interventionPlan', moduleKey: 'observation:interventionPlan', keywords: FILTER_KEYWORDS.INTERVENTION_PLAN,     useProjectTasks: false },
  { configKey: 'endline',          moduleKey: 'observation:endline',          keywords: FILTER_KEYWORDS.ENDLINE,               useProjectTasks: false },
];

// Used only to identify HH tasks within the fetched project task list.
const OBSERVATION_KEYWORD_MAP: Record<string, string[]> = {
  'observation:householdProfile': ['household', 'house hold'],
};

function resolveObservationModuleKey(task: Task): DownloadModuleKey | null {
  const nameLower = (task.name ?? '').toLowerCase();
  for (const [key, keywords] of Object.entries(OBSERVATION_KEYWORD_MAP)) {
    if (keywords.some(kw => nameLower.includes(kw))) return key as DownloadModuleKey;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const startDownload = async ({
  participantId,
  projectId,
  downloadConfig,
  lcUserId,
  participantSnapshot,
  onProgress,
}: StartDownloadParams): Promise<DownloadResult> => {
  await initStatus(participantId);

  try {
    if (downloadConfig.participant) {
      onProgress?.('participant', 'loading');
      try {
        await withRetry(() => fetchAndStoreParticipant(participantId, lcUserId), 'participant');
        await markComplete(participantId, 'participant');
        onProgress?.('participant', 'completed');
      } catch (err) {
        onProgress?.('participant', 'failed');
        throw err; // participant is critical — abort entire download
      }
    }

    // Always save the list-row snapshot so offline participant list can render
    if (participantSnapshot) {
      await offlineStorage.create(PARTICIPANT_KEYS.listSnapshot(participantId), participantSnapshot);
    }

    // Fetch the project when explicitly selected OR when householdProfile is selected.
    // HH forms are discovered from project tasks; all other observation modules use the
    // targeted solutions API and do not require the project task list.
    const needsProject =
      downloadConfig.project || downloadConfig.tasks || downloadConfig.observation.householdProfile;
    let tasks: Task[] = [];
    if (needsProject) {
      if (downloadConfig.project) onProgress?.('project', 'loading');
      try {
        tasks = await withRetry(() => fetchAndStoreProject(participantId, projectId), 'project');
        if (downloadConfig.project) {
          await markComplete(participantId, 'project');
          onProgress?.('project', 'completed');
        }
        if (downloadConfig.tasks) await markComplete(participantId, 'tasks');
      } catch (err) {
        if (downloadConfig.project) onProgress?.('project', 'failed');
        throw err; // project is required for HH and task progress
      }
    }

    const participantName: string =
      participantSnapshot?.name ??
      `${participantSnapshot?.firstName ?? ''} ${participantSnapshot?.lastName ?? ''}`.trim() ??
      participantId;

    // Process each selected observation module via the unified module map.
    // HH (householdProfile): matched from the project task list.
    // All others: fetched via the targeted solutions API using their FILTER_KEYWORDS constants.
    // Collect resolved IDs for each form so we can save the solutions mapping at the end.
    const solutionEntries: OfflineSolutionEntry[] = [];

    for (const module of OBSERVATION_SOLUTION_DOWNLOAD_MAP) {
      if (!downloadConfig.observation[module.configKey]) continue;
      onProgress?.(module.moduleKey, 'loading');
      try {
        if (module.useProjectTasks) {
          const hhTasks = tasks.filter(
            (t: Task) => t.type?.toLowerCase() === 'observation' && resolveObservationModuleKey(t) === module.moduleKey,
          );
          for (const task of hhTasks) {
            const resolved = await processObservationTask(participantId, participantName, task);
            if (resolved) {
              solutionEntries.push({
                keyword: module.moduleKey,
                keywords: module.keywords,
                solutionId: resolved.solutionId,
                submissionId: resolved.submissionId,
                submissionNumber: resolved.submissionNumber,
                observationId: resolved.observationId,
                entityId: resolved.entityId,
              });
            }
          }
        } else {
          const resolved = await fetchAndStoreSolutionForms(
            participantId,
            participantName,
            module.keywords,
            module.moduleKey,
          );
          
          for (const r of resolved) {
            solutionEntries.push({
              keyword: r.keyword,
              keywords: r.keywords,
              solutionId: r.solutionId,
              submissionId: r.submissionId,
              submissionNumber: r.submissionNumber,
              observationId: r.observationId,
              entityId: r.entityId,
            });
          }
        }
        await markComplete(participantId, module.moduleKey);
        onProgress?.(module.moduleKey, 'completed');
      } catch (err) {
        logger.error(`DownloadService: Failed module "${module.moduleKey}"`, err);
        await markFailed(participantId, module.moduleKey);
        onProgress?.(module.moduleKey, 'failed');
      }
    }

    // Save solutions mapping — must happen AFTER all schemas are downloaded so the
    // mapping and the form data are always in sync.
    if (solutionEntries.length > 0) {
      await offlineStorage.create(PARTICIPANT_KEYS.solutions(participantId), solutionEntries);
      logger.info(`DownloadService: Saved ${solutionEntries.length} solution entries for "${participantId}"`);
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
