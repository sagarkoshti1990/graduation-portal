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
import {
  getProjectDetails,
  createProjectForEntity,
  getSolutionDetails,
} from '../project-player/services/projectPlayerService';
import {
  getObservationEntities,
  updateObservationEntities,
  searchObservationEntities,
  getObservationSubmissions,
  createObservationSubmission,
  getObservationSolution,
} from './solutionService';
import {
  getParticipantsList,
  updateEntityDetails,
  createOrUpdateProgramUserMapping,
} from './participantService';
import { getTargetedSolutions } from './solutionService';
import { FILTER_KEYWORDS } from '@constants/LOG_VISIT_CARDS';
import { CARD_STATUS, STATUS } from '@constants/app.constant';

/** Called by the download pipeline as each module starts and finishes. */
export type DownloadProgressCallback = (
  key: string,
  state: 'loading' | 'completed' | 'failed',
) => void;

export interface StartDownloadParams {
  participantId: string;
  /** IDP / onboarding project ID. Optional — resolved automatically when missing for NOT_ONBOARDED participants. */
  projectId?: string;
  downloadConfig: DownloadConfig;
  /** LC's own userId — needed to call the programUsers/entities API correctly */
  lcUserId: string;
  /** The participant's list-row data, saved as listSnapshot for offline list rendering */
  participantSnapshot?: any;
  /** Optional callback for real-time per-step progress reporting to the UI. */
  onProgress?: DownloadProgressCallback;
  /**
   * Province value (e.g. participantSnapshot?.province?.value).
   * Required when onboarding project creation is needed.
   */
  province?: string;
  /**
   * Participant entity ID for programUsers API calls during project creation
   * (e.g. participantSnapshot?.entityId).
   */
  participantEntityId?: string;
}

export interface DownloadResult {
  success: boolean;
  status: DownloadStatus;
  error?: string;
  /** Set to the newly created project ID when an onboarding project was created during this run. */
  createdOnboardingProjectId?: string;
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

async function initStatus(userId: string, participantId: string): Promise<void> {
  const status: DownloadStatus = {
    status: 'in_progress',
    completedModules: [],
    failedModules: [],
    lastStep: 'start',
    startedAt: Date.now(),
  };
  await offlineStorage.create(PARTICIPANT_KEYS.downloadStatus(userId, participantId), status);
}

async function patchStatus(userId: string, participantId: string, patch: Partial<DownloadStatus>): Promise<void> {
  const current = await offlineStorage.read<DownloadStatus>(PARTICIPANT_KEYS.downloadStatus(userId, participantId));
  await offlineStorage.create(PARTICIPANT_KEYS.downloadStatus(userId, participantId), { ...(current ?? {}), ...patch });
}

async function markComplete(userId: string, participantId: string, module: string): Promise<void> {
  const current = await offlineStorage.read<DownloadStatus>(PARTICIPANT_KEYS.downloadStatus(userId, participantId));
  if (!current) return;
  await offlineStorage.create(PARTICIPANT_KEYS.downloadStatus(userId, participantId), {
    ...current,
    completedModules: current.completedModules.includes(module)
      ? current.completedModules
      : [...current.completedModules, module],
    failedModules: current.failedModules.filter(m => m !== module),
    lastStep: module,
  });
}

async function markFailed(userId: string, participantId: string, module: string): Promise<void> {
  const current = await offlineStorage.read<DownloadStatus>(PARTICIPANT_KEYS.downloadStatus(userId, participantId));
  if (!current) return;
  await offlineStorage.create(PARTICIPANT_KEYS.downloadStatus(userId, participantId), {
    ...current,
    failedModules: current.failedModules.includes(module)
      ? current.failedModules
      : [...current.failedModules, module],
    lastStep: module,
  });
}

// ---------------------------------------------------------------------------
// Onboarding project creation
// ---------------------------------------------------------------------------

/**
 * Creates the onboarding project for a participant who does not yet have one,
 * then persists the new project ID on both the entity and the program-user mapping.
 *
 * Mirrors the flow in useProjectLoader so both paths stay consistent:
 *   1. createProjectForEntity  → API creates the project
 *   2. updateEntityDetails     → stamps onBoardedProjectId on the entity record
 *   3. createOrUpdateProgramUserMapping → stamps onBoardedProjectId on the program-user record
 *
 * Returns the newly created project ID.
 */
async function ensureOnboardingProject({
  participantId,
  entityId,
  province,
  lcUserId,
  currentStatus,
}: {
  participantId: string;
  entityId: string;
  province: string;
  lcUserId: string;
  currentStatus?: string;
}): Promise<string> {
  // Guard: re-read from cache in case a previous download already created the project
  const cachedDetails = await offlineStorage
    .read<any>(PARTICIPANT_KEYS.details(lcUserId, participantId))
    .catch(() => null);
  if (cachedDetails?.onBoardedProjectId) {
    logger.info(`DownloadService: Onboarding project already in cache for "${participantId}" — skipping creation`);
    return cachedDetails.onBoardedProjectId as string;
  }

  logger.info(`DownloadService: Creating onboarding project for entity "${entityId}", province "${province}"`);

  // createProjectForEntity returns response.data.result on success or
  // handleApiError({ data: null, error: '...' }) on failure — it never throws.
  const projectData = await createProjectForEntity(entityId, province) as any;

  if (!projectData?._id) {
    // Prefer the API-level error message over a generic fallback
    const apiMsg: string = projectData?.error ?? 'No project ID returned from onboarding creation API';
    throw new Error(apiMsg);
  }

  const createdProjectId: string = projectData._id;
  logger.info(`DownloadService: Onboarding project "${createdProjectId}" created for participant "${participantId}"`);

  const createdDate = new Date().toISOString();

  // Re-check cache (concurrent creation guard — e.g. two simultaneous download attempts)
  const recheckDetails = await offlineStorage
    .read<any>(PARTICIPANT_KEYS.details(lcUserId, participantId))
    .catch(() => null);
  if (recheckDetails?.onBoardedProjectId) {
    logger.info(`DownloadService: Concurrent creation detected for "${participantId}" — using existing project`);
    return recheckDetails.onBoardedProjectId as string;
  }

  // Stamp the new project ID on the entity profile — non-fatal: project is already created
  try {
    await updateEntityDetails({
      userId: lcUserId,
      entityId,
      entityUpdates: {
        onBoardedProjectId: createdProjectId,
        onBoardingProjectCreatedAt: createdDate,
      },
    });
    logger.info(`DownloadService: Updated entity "${entityId}" with onBoardedProjectId`);
  } catch (err) {
    logger.warn(`DownloadService: updateEntityDetails failed for "${entityId}" — continuing with download`, err);
  }

  // Stamp the new project ID on the participant program-user mapping — non-fatal
  try {
    // Prefer the participant ID from the created project (mirrors useProjectLoader pattern)
    const mappingUserId: string =
      (projectData.entityInformation?.externalId as string | undefined) ?? participantId;
    await createOrUpdateProgramUserMapping({
      userId: mappingUserId,
      // @ts-ignore
      programId: process.env.GLOBAL_LC_PROGRAM_ID as string,
      metaInformation: {
        onBoardedProjectId: createdProjectId,
        onBoardingProjectCreatedAt: createdDate,
      },
      status: currentStatus ?? STATUS.NOT_ONBOARDED,
    });
    logger.info(`DownloadService: Updated program-user mapping for "${mappingUserId}"`);
  } catch (err) {
    logger.warn(`DownloadService: createOrUpdateProgramUserMapping failed for "${participantId}" — continuing with download`, err);
  }

  return createdProjectId;
}

// ---------------------------------------------------------------------------
// Pipeline steps
// ---------------------------------------------------------------------------

interface ResolvedFormIds {
  entityId: string;
  submissionId: string;
  submissionNumber: number;
  observationId: string;
  name:string;
  keywords:string[];
  solutionId: string;
  keyword: string;
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

  await offlineStorage.create(PARTICIPANT_KEYS.details(lcUserId, participantId), mappedParticipant);
  logger.info(`DownloadService: Stored participant "${participantId}"`);
  return mappedParticipant;
}

async function fetchAndStoreProject(userId: string, participantId: string, projectId: string): Promise<Task[]> {
  const response = await getProjectDetails(projectId, userId);
  if (!response.data) throw new Error(`Project "${projectId}" returned no data`);
  const project = response.data;
  // Flatten children[].tasks[] for pillar-structured projects; fall back to root tasks[]
  const tasks: Task[] = project.tasks
    ?? (project.children ?? []).flatMap((c: any) => c.tasks ?? []);
  // Store the full project only — tasks are extracted from it when needed (no separate key)
  await offlineStorage.create(PARTICIPANT_KEYS.project(userId, participantId, projectId), project);
  logger.info(`DownloadService: Stored project "${projectId}" with ${tasks.length} tasks`);
  return tasks;
}
const getSubmissionInfo = (
  submissions: {
    submissionNumber?: number;
    status?: string;
  }[] = []
): {
  submissionNumber: number;
  status: string;
} => {
  if (!submissions.length) {
    return {
      submissionNumber: 1,
      status: CARD_STATUS.STARTED,
    };
  }

  const highestSubmission = submissions.reduce((prev, current) =>
    (current.submissionNumber || 0) > (prev.submissionNumber || 0)
      ? current
      : prev
  );

  if (highestSubmission.status === CARD_STATUS.COMPLETED) {
    return {
      submissionNumber: (highestSubmission.submissionNumber || 0) + 1,
      status: CARD_STATUS.STARTED,
    };
  }

  return {
    submissionNumber: highestSubmission.submissionNumber || 1,
    status: highestSubmission.status || CARD_STATUS.STARTED,
  };
};

/**
 * Core form download: resolves the entity, ensures a submission exists, fetches the
 * assessment schema, and persists everything under PARTICIPANT_KEYS.form(participantId, solutionId).
 * Shared by the project-task path (HH) and the targeted-solutions path (all others).
 */
async function processObservationForm(
  userId: string,
  participantId: string,
  participantName: string,
  solutionId: string,
): Promise<any> {
  // Step 1: Resolve entity. result._id = real observationId (may differ from solutionId).
  let entityId: string | undefined;
  const entitiesResp = await withRetry(
    () => getObservationEntities({ solutionId, profileData: {} }),
    `entities:${solutionId}`,
  );
  const allowMultipleAssessemts: boolean = entitiesResp?.result?.allowMultipleAssessemts || false
  let submissionNumber:number = 1;
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
  let status: string = ""
  const subsResp = await withRetry(
    () => getObservationSubmissions({ observationId, entityId: entityId! }),
    `submissions:${observationId}`,
  );
  submissions = subsResp?.result ?? [];
  let submissionId: string | undefined = submissions[0]?._id;
  status = submissions[0]?.status;

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
    status = submissions[0]?.status;
  }

  if (!submissionId) throw new Error(`Could not resolve submissionId for observation "${observationId}"`);
  
  if(allowMultipleAssessemts) {
    const subData = getSubmissionInfo(submissions);
    submissionNumber = subData?.submissionNumber
    status = subData?.status
  }
  
  const evidenceCode: string = submissions[0]?.evidencesStatus?.[0]?.code ?? 'OB';

  // Step 4: Fetch assessment schema + existing answers
  const assessmentResp = await withRetry(
    () => getObservationSolution({ observationId, entityId: entityId!, submissionNumber, evidenceCode }),
    `assessment:${observationId}`,
  );
  const schema = assessmentResp?.result ?? assessmentResp ?? null;
  submissionId = schema?.assessment?.submissionId

  if (!schema || typeof schema !== 'object' || Object.keys(schema).length === 0) {
    throw new Error(`Empty or invalid schema returned for observation "${observationId}"`);
  }
  if (!schema.assessment?.evidences?.length) {
    throw new Error(`Schema missing evidences for observation "${observationId}" — cannot render form offline`);
  }

  const formData: ObservationFormData = {
    entityId: entityId!,
    submissionId: submissionId || "",
    submissionNumber,
    observationId,
    schema,
    data: schema?.submission?.answers ?? assessmentResp?.result?.submission?.answers ?? {},
    status: status || 'started',
    updatedAt: new Date().toISOString(),
    downloadedAt: Date.now(),
  };

  // Keyed by solutionId — matches what ObservationContent passes to getObservationForm()
  await offlineStorage.create(PARTICIPANT_KEYS.form(userId, participantId, solutionId), formData);
  logger.info(`DownloadService: Stored form for solution "${solutionId}" (obs: "${observationId}")`);
  return { entityId: entityId!, submissionId: submissionId || "", submissionNumber: submissionNumber, observationId, solutionId };
}

/** Thin wrapper used by the project-task (HH) path to extract solutionId from a task. */
async function processObservationTask(
  userId: string,
  participantId: string,
  participantName: string,
  task: Task,
  projectId: string,
): Promise<(ResolvedFormIds & { solutionId: string }) | null> {
  // Call getSolutionDetails first to obtain the authoritative solutionId and name.
  // Response shape: { data: result.solutionDetails } where solutionDetails._id is the solutionId.
  // Mirrors the UI components (SimpleObservationTask, ReadOnlyTask) which do the same
  // before navigating to the observation form.
  let solutionId: string | undefined;
  let solutionName: string | undefined;
  try {
    const detailsResp = await getSolutionDetails(projectId, task._id);
    // detailsResp.data = response.result.solutionDetails
    solutionId = detailsResp?.data?._id;
    solutionName = detailsResp?.data?.name;
  } catch (err) {
    logger.warn(`DownloadService: getSolutionDetails failed for task "${task._id}" — falling back to task data`, err);
  }

  // Fallback: read from the embedded task.solutionDetails when the API call fails or returns no _id
  if (!solutionId) {
    solutionId =
      task.solutionDetails?._id ??
      task.solutionDetails?.observationId ??
      task.solutionDetails?.id;
  }
  if (!solutionName) {
    solutionName = task?.solutionDetails?.name;
  }

  if (!solutionId) {
    logger.warn(`DownloadService: No solutionId resolved for task "${task._id}" — skipping`);
    return null;
  }

  const resolved = await processObservationForm(userId, participantId, participantName, solutionId);
  return { ...resolved, solutionId, name: solutionName };
}

/**
 * Calls the targeted solutions API with the given keywords, stores each matching
 * solution's form data offline, and returns the resolved IDs for the solutions mapping.
 * Per-solution failures are logged and skipped so one bad form doesn't fail the whole module.
 */
async function fetchAndStoreSolutionForms(
  userId: string,
  participantId: string,
  participantName: string,
  keywords: string[],
  moduleKey: string,
): Promise<Array<ResolvedFormIds>> {
  const results: Array<ResolvedFormIds> = [];
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
        () => processObservationForm(userId, participantId, participantName, solution.solutionId),
        `solutionForm:${solution.solutionId}`,
      );
      results.push({ ...solution,...resolved, keyword: moduleKey });
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
  // { configKey: 'interventionPlan', moduleKey: 'observation:interventionPlan', keywords: FILTER_KEYWORDS.INTERVENTION_PLAN,     useProjectTasks: false },
  // { configKey: 'endline',          moduleKey: 'observation:endline',          keywords: FILTER_KEYWORDS.ENDLINE,               useProjectTasks: false },
];

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
  province,
  participantEntityId,
}: StartDownloadParams): Promise<DownloadResult> => {
  let createdOnboardingProjectId: string | undefined;

  try {
    // initStatus is inside the try block so any storage failure is caught and returned
    // as a DownloadResult rather than propagating out of startDownload.
    await initStatus(lcUserId, participantId);

    // ── Step 0: Resolve project ID — create onboarding project when not yet set ──
    //
    // A participant whose onBoardedProjectId is missing has not had their onboarding
    // project created yet.  We create it here (before saving any offline data) so the
    // rest of the pipeline can use a valid project ID.  Dependent offline storage
    // (project data, solutions mapping, etc.) will reference this newly created ID.
    let resolvedProjectId = projectId;

    if (!resolvedProjectId) {
      // entityId: try top-level fields, then userDetails, then fall back to participantId
      // (the list API is filtered with entityId=participantId, so they are the same value)
      const entityId =
        participantEntityId ??
        participantSnapshot?.entityId ??
        (participantSnapshot as any)?.entity_id ??
        participantSnapshot?.userDetails?.entityId ??
        participantId;

      // province: raw list rows store it in userDetails.province as { value, label };
      // detail/flattened data has it at the top level (string or object)
      const rawProvince =
        province ??
        participantSnapshot?.province ??
        participantSnapshot?.userDetails?.province;
      const resolvedProvince: string | undefined =
        typeof rawProvince === 'string'
          ? rawProvince
          : rawProvince?.value ?? rawProvince?.label;

      if (!entityId || !resolvedProvince) {
        logger.error(
          `DownloadService: Cannot create onboarding project for "${participantId}" — missing entityId or province`,
        );
        await patchStatus(lcUserId, participantId, { status: 'failed' });
        return {
          success: false,
          status: (await offlineStorage.read<DownloadStatus>(
            PARTICIPANT_KEYS.downloadStatus(lcUserId, participantId),
          ))!,
          error: 'Province and entity ID are required to create the onboarding project',
        };
      }

      onProgress?.('onboarding', 'loading');
      try {
        resolvedProjectId = await withRetry(
          () =>
            ensureOnboardingProject({
              participantId,
              entityId,
              province: resolvedProvince,
              lcUserId,
              currentStatus:
                participantSnapshot?.status ?? participantSnapshot?.accountUserStatus,
            }),
          'onboardingProject',
        );
        createdOnboardingProjectId = resolvedProjectId;
        await markComplete(lcUserId, participantId, 'onboarding');
        onProgress?.('onboarding', 'completed');
      } catch (err: any) {
        logger.error(`DownloadService: Failed to create onboarding project for "${participantId}"`, err);
        await markFailed(lcUserId, participantId, 'onboarding');
        onProgress?.('onboarding', 'failed');
        await patchStatus(lcUserId, participantId, { status: 'failed' });
        return {
          success: false,
          status: (await offlineStorage.read<DownloadStatus>(
            PARTICIPANT_KEYS.downloadStatus(lcUserId, participantId),
          ))!,
          error: err?.message ?? 'Failed to create onboarding project',
        };
      }
    }

    if (downloadConfig.participant) {
      onProgress?.('participant', 'loading');
      try {
        await withRetry(() => fetchAndStoreParticipant(participantId, lcUserId), 'participant');
        await markComplete(lcUserId, participantId, 'participant');
        onProgress?.('participant', 'completed');
      } catch (err) {
        onProgress?.('participant', 'failed');
        throw err; // participant is critical — abort entire download
      }
    }

    // Always save the list-row snapshot so offline participant list can render
    if (participantSnapshot) {
      await offlineStorage.create(PARTICIPANT_KEYS.listSnapshot(lcUserId, participantId), participantSnapshot);
    }

    // observations matched from the project task list.
    let solutionEntries: OfflineSolutionEntry[] = [];

    const participantName: string =
      participantSnapshot?.name ??
      `${participantSnapshot?.firstName ?? ''} ${participantSnapshot?.lastName ?? ''}`.trim() ??
      participantId;

    // Fetch the project when explicitly selected OR when householdProfile is selected.
    // HH forms are discovered from project tasks; all other observation modules use the
    // targeted solutions API and do not require the project task list.
    const needsProject = downloadConfig.project;
    let tasks: Task[] = [];
    if (needsProject) {
      if (downloadConfig.project) onProgress?.('project', 'loading');
      try {
        tasks = await withRetry(
          () => fetchAndStoreProject(lcUserId, participantId, resolvedProjectId!),
          'project',
        );
        if (downloadConfig.project) {
          await markComplete(lcUserId, participantId, 'project');
          onProgress?.('project', 'completed');
        }
        // Collect observation tasks from both top-level tasks and their direct children.
        // Task.children holds sub-tasks one level deep; the flat tasks[] returned by
        // fetchAndStoreProject only contains top-level entries, so children are invisible
        // to a simple .filter(). Dedup by _id in case a parent and child both happen to
        // be observation tasks (avoids double-downloading the same form).
        const seenTaskIds = new Set<string>();
        const hhTasks = tasks
          .flatMap((t: Task) => [t, ...(t.children ?? [])])
          .filter((t: Task) => {
            if (t.type?.toLowerCase() !== 'observation') return false;
            if (seenTaskIds.has(t._id)) return false;
            seenTaskIds.add(t._id);
            return true;
          });
        for (const task of hhTasks) {
          const resolved = await processObservationTask(lcUserId, participantId, participantName, task, resolvedProjectId!);
          if (resolved) {
            solutionEntries.push({
              name:resolved.name,
              keyword: resolved.keywords?.[0],
              keywords: resolved.keywords,
              solutionId: resolved.solutionId,
              submissionId: resolved.submissionId,
              submissionNumber: resolved.submissionNumber,
              observationId: resolved.observationId,
              entityId: resolved.entityId,
            });
          }
        }
      } catch (err) {
        if (downloadConfig.project) onProgress?.('project', 'failed');
        throw err; // project is required for HH and task progress
      }
    }

    // Process each selected observation module via the unified module map.
    // All others: fetched via the targeted solutions API using their FILTER_KEYWORDS constants.
    // Collect resolved IDs for each form so we can save the solutions mapping at the end.
    for (const module of OBSERVATION_SOLUTION_DOWNLOAD_MAP) {
      if (!downloadConfig.observation[module.configKey]) continue;
      onProgress?.(module.moduleKey, 'loading');
      try {
        const resolved = await fetchAndStoreSolutionForms(
          lcUserId,
          participantId,
          participantName,
          module.keywords,
          module.moduleKey,
        );
        solutionEntries = [...solutionEntries,...resolved];
        await markComplete(lcUserId, participantId, module.moduleKey);
        onProgress?.(module.moduleKey, 'completed');
      } catch (err) {
        logger.error(`DownloadService: Failed module "${module.moduleKey}"`, err);
        await markFailed(lcUserId, participantId, module.moduleKey);
        onProgress?.(module.moduleKey, 'failed');
      }
    }

    // Save solutions mapping — must happen AFTER all schemas are downloaded so the
    // mapping and the form data are always in sync.
    if (solutionEntries.length > 0) {
      await offlineStorage.create(PARTICIPANT_KEYS.solutions(lcUserId, participantId), solutionEntries);
      logger.info(`DownloadService: Saved ${solutionEntries.length} solution entries for "${participantId}"`);
    }

    await addOfflineParticipantId(lcUserId, participantId);

    const finalStatus = await offlineStorage.read<DownloadStatus>(PARTICIPANT_KEYS.downloadStatus(lcUserId, participantId));
    const resolvedStatus = (finalStatus?.failedModules ?? []).length > 0 ? 'partial' : 'completed';
    await patchStatus(lcUserId, participantId, { status: resolvedStatus, completedAt: Date.now() });

    logger.info(`DownloadService: "${resolvedStatus}" for participant "${participantId}"`);
    return {
      success: true,
      status: (await offlineStorage.read<DownloadStatus>(PARTICIPANT_KEYS.downloadStatus(lcUserId, participantId)))!,
      createdOnboardingProjectId,
    };
  } catch (err: any) {
    logger.error(`DownloadService: Fatal error for participant "${participantId}"`, err);
    await patchStatus(lcUserId, participantId, { status: 'failed' });
    return {
      success: false,
      status: (await offlineStorage.read<DownloadStatus>(PARTICIPANT_KEYS.downloadStatus(lcUserId, participantId)))!,
      error: err?.message ?? 'Unknown error',
      createdOnboardingProjectId,
    };
  }
};

export const getDownloadStatus = async (userId: string, participantId: string): Promise<DownloadStatus | null> =>
  offlineStorage.read<DownloadStatus>(PARTICIPANT_KEYS.downloadStatus(userId, participantId));
