/**
 * DataService — Centralized offline-aware data access layer.
 *
 * All read functions return OfflineServiceResponse<T>.
 * Components check response flags (isOffline, offlineSupported, offlineDataAvailable)
 * to decide what UI to render — no offline logic belongs in components.
 *
 * Write operations (saveTaskEdit, saveFormEdits) do NOT use withOfflineFirst.
 * When offline → persist locally for sync later; when online → call API.
 */

import offlineStorage, { getOfflineParticipantIds } from './offlineStorage';
import { isNetworkOffline } from '@utils/networkStatus';
import { PARTICIPANT_KEYS, OFFLINE_KEYS, OFFLINE_API_CONFIG } from '@constants/STORAGE_KEYS';
import {
  getParticipantsList,
  getEntityDetails as getEntityDetailsAPI,
} from './participantService';
import { getProjectDetails } from '../project-player/services/projectPlayerService';
import { getTargetedSolutions } from './solutionService';
import { getProjectCategoryList } from './projectService';
import { withOfflineFirst } from './offlineFirst';
import {
  buildOfflineNoData,
  buildFromCache,
  buildOnlineSuccess,
} from './offlineTypes';
import type { OfflineServiceResponse } from './offlineTypes';
import type { TargetedSolutionsParams } from './solutionService';
import logger from '@utils/logger';
import type { Participant } from '@app-types/screens';
import type { ParticipantOverview, AssessmentSurveyCardData } from '@app-types/participant';
import type { ObservationFormData, ObservationFormEdits } from '@app-types/offline';

// ---------------------------------------------------------------------------
// Network detection — re-exported so existing callers (useProjectLoader,
// useTaskActions, TaskCard, OfflineSyncContext) need no import changes.
// ---------------------------------------------------------------------------

export { isNetworkOffline };

// ---------------------------------------------------------------------------
// Backward-compat sentinel (deprecated — use OfflineServiceResponse flags)
// ---------------------------------------------------------------------------

export interface OfflineFallback {
  __isOfflineFallback: true;
  message: string;
}

export const OFFLINE_UNAVAILABLE: OfflineFallback = {
  __isOfflineFallback: true,
  message: 'offlineSync.dataUnavailable',
};

export function isOfflineFallback(v: any): v is OfflineFallback {
  return v != null && (v as OfflineFallback).__isOfflineFallback === true;
}

// ---------------------------------------------------------------------------
// Pending-sync check — per participant
// ---------------------------------------------------------------------------

async function hasPendingForParticipant(userId: string, participantId: string): Promise<boolean> {
  try {
    const allKeys = await offlineStorage.getParticipantKeys(userId, participantId);
    // Check for any pending task edits across all projects
    const hasTaskEdits = allKeys.some((k: string) => k.includes(':projectEdits:'));
    if (hasTaskEdits) return true;
    // Check for any pending form edits
    return allKeys.some((k: string) => k.endsWith(':edits') && k.includes(':form:'));
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Participant List
// ---------------------------------------------------------------------------

export interface ParticipantListParams {
  userId: string;
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface ParticipantListResult {
  participants: Participant[];
  total: number;
  overview: ParticipantOverview | null;
  fromCache: boolean;
}

/**
 * Load participant list from offline storage with support for search, filter,
 * and pagination (Issue 7). All reads are scoped to the given userId.
 */
async function loadOfflineParticipantList(
  userId: string,
  search?: string,
  status?: string,
  page?: number,
  limit?: number,
): Promise<ParticipantListResult | null> {
  try {
    const ids = await getOfflineParticipantIds(userId);
    if (ids.length === 0) return null; // no participants downloaded

    const snapshots = await Promise.all(
      ids.map((id: string) => offlineStorage.read<any>(PARTICIPANT_KEYS.listSnapshot(userId, id))),
    );
    // Keep all non-null snapshots for overview count computation
    const allParticipants = snapshots.filter((p): p is Participant => p !== null);

    // Apply search filter
    let filtered = [...allParticipants];
    if (search?.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter((p: any) => {
        const name = (p.name ?? '').toLowerCase();
        const externalId = (p.externalId ?? p.userId ?? '').toLowerCase();
        return name.includes(q) || externalId.includes(q);
      });
    }

    // Apply status filter
    if (status && status !== 'all') {
      filtered = filtered.filter(
        (p: any) => (p.status ?? p.accountUserStatus ?? '').toLowerCase() === status.toLowerCase(),
      );
    }

    const filteredTotal = filtered.length;

    // Apply pagination when both page and limit are specified
    if (page && limit && limit > 0) {
      const startIndex = (page - 1) * limit;
      filtered = filtered.slice(startIndex, startIndex + limit);
    }

    return {
      participants: filtered,
      total: filteredTotal,
      overview: computeOfflineOverview(allParticipants),
      fromCache: true,
    };
  } catch {
    return null;
  }
}

// Maps raw status values (lowercased) to the API overview key shape read by ParticipantsList
const STATUS_TO_OVERVIEW_KEY: Record<string, string> = {
  'not_onboarded': 'notonboarded',
  'onboarded':     'onboarded',
  'in_progress':   'inprogress',
  'dropped_out':   'droppedout',
  'graduated':     'graduated',
  'completed':     'completed',
};

function computeOfflineOverview(participants: any[]): ParticipantOverview {
  const counts: Record<string, number> = {};
  for (const p of participants) {
    const raw = (p.status ?? p.accountUserStatus ?? 'unknown').toLowerCase();
    const key = STATUS_TO_OVERVIEW_KEY[raw] ?? raw;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return {
    total:         participants.length,
    notonboarded:  counts['notonboarded']  ?? 0,
    onboarded:     counts['onboarded']     ?? 0,
    inprogress:    counts['inprogress']    ?? 0,
    droppedout:    counts['droppedout']    ?? 0,
    graduated:     counts['graduated']     ?? 0,
    completed:     counts['completed']     ?? 0,
  } as unknown as ParticipantOverview;
}

export async function getParticipantList(
  params: ParticipantListParams,
): Promise<OfflineServiceResponse<ParticipantListResult>> {
  const emptyValue: ParticipantListResult = { participants: [], total: 0, overview: null, fromCache: false };

  if (isNetworkOffline()) {
    const cached = await loadOfflineParticipantList(params.userId, params.search, params.status, params.page, params.limit);
    if (cached !== null) return buildFromCache(cached, true);
    return buildOfflineNoData(emptyValue);
  }

  try {
    const response = await getParticipantsList(params);
    const participants = response.result?.data ?? [];
    const overview = response.result?.overview ?? null;
    const total = response.total ?? 0;
    const result: ParticipantListResult = { participants, total, overview, fromCache: false };

    return buildOnlineSuccess(result, OFFLINE_API_CONFIG.PARTICIPANTS_LIST.supported);
  } catch (err) {
    logger.warn('dataService.getParticipantList: API failed — falling back to offline', err);
    const cached = await loadOfflineParticipantList(params.userId, params.search, params.status, params.page, params.limit);
    if (cached !== null) return buildFromCache(cached, false);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Participant Details
// ---------------------------------------------------------------------------

export async function getParticipantDetails(
  participantId: string,
  userId: string,
): Promise<OfflineServiceResponse<any>> {
  return withOfflineFirst(
    async () => {
      const response = await getParticipantsList({ entityId: participantId, userId });
      const row = response?.result?.data?.[0];
      if (!row) throw new Error('no participant row returned');
      const { userDetails, ...rest } = row;
      const participantData = {
        ...(userDetails || {}),
        ...rest,
        accountUserStatus: userDetails?.status,
      };
      await offlineStorage
        .create(PARTICIPANT_KEYS.listSnapshot(userId, participantId), participantData)
        .catch(() => {});
      return participantData;
    },
    {
      offlineSupported: OFFLINE_API_CONFIG.PARTICIPANT_DETAILS.supported,
      cacheReader: async () => {
        const details = await offlineStorage.read<any>(PARTICIPANT_KEYS.details(userId, participantId));
        const snapshot = await offlineStorage.read<any>(
          PARTICIPANT_KEYS.listSnapshot(userId, participantId),
        );
        return details ?? snapshot ?? null;
      },
      hasPendingSyncFn: () => hasPendingForParticipant(userId, participantId),
      emptyValue: null,
    },
  );
}

// ---------------------------------------------------------------------------
// Project + Tasks
// ---------------------------------------------------------------------------

/**
 * Builds a flat lookup map of all edited tasks (including children) from the
 * projectEdits task array so they can be applied to the cached project tree.
 */
function buildEditMap(editedTasks: any[]): Map<string, any> {
  const map = new Map<string, any>();
  for (const task of editedTasks) {
    map.set(task._id, task);
    if (task.children?.length) {
      for (const child of task.children) {
        map.set(child._id, child);
      }
    }
  }
  return map;
}

/**
 * Applies completion state from projectEdits onto the project's task tree.
 *
 * Rules:
 *  - ONLY `status` and `attachments` are taken from the edit record.
 *    Structural fields (name, type, description, dependencies, etc.) always
 *    come from the cached project — never from projectEdits.
 *  - Default status for every task comes from PARTICIPANT_KEYS.project.
 *    projectEdits overrides status only when an edit record exists for that task.
 */
function applyEditMapToTasks(tasks: any[], editMap: Map<string, any>): any[] {
  return tasks.map(task => {
    const edit = editMap.get(task._id);
    // Edit wins; otherwise keep the status already in the cached project.
    const status: string = edit?.status ?? task.status;
    // Attachments: use edit value when present, otherwise preserve project value.
    const attachments = edit?.attachments !== undefined ? edit.attachments : task.attachments;
    const merged = { ...task, status, attachments };
    if (merged.tasks?.length) merged.tasks = applyEditMapToTasks(merged.tasks, editMap);
    if (merged.children?.length) merged.children = applyEditMapToTasks(merged.children, editMap);
    return merged;
  });
}

async function applyPendingEditsToProject<T>(
  userId: string,
  participantId: string,
  projectId: string,
  project: T,
): Promise<T> {
  try {
    const edits = await offlineStorage.read<{ tasks: any[] }>(
      PARTICIPANT_KEYS.projectEdits(userId, participantId, projectId),
    );
    // No pending edits — project cache is already the correct source of truth.
    if (!edits?.tasks?.length) return project;
    const editMap = buildEditMap(edits.tasks);
    const proj = project as any;
    return {
      ...proj,
      ...(proj.tasks    ? { tasks:    applyEditMapToTasks(proj.tasks,    editMap) } : {}),
      ...(proj.children ? { children: applyEditMapToTasks(proj.children, editMap) } : {}),
    } as T;
  } catch {
    return project;
  }
}

export async function getProject<T = any>(
  participantId: string,
  projectId: string,
  userId: string,
): Promise<OfflineServiceResponse<T | null>> {
  const offline = isNetworkOffline();
  const hasPending =
    !offline && projectId ? await hasPendingForParticipant(userId, participantId) : false;

  if (offline || hasPending) {
    const cached = await offlineStorage.read<T>(PARTICIPANT_KEYS.project(userId, participantId, projectId));
    if (cached) {
      // Merge any pending offline task edits so the UI reflects the correct state
      const withEdits = await applyPendingEditsToProject(userId, participantId, projectId, cached);
      return buildFromCache(withEdits, offline);
    }
    if (offline) return buildOfflineNoData<T | null>(null);
    // hasPending but no local project yet — fall through to API
  }

  if (!projectId) {
    return buildOnlineSuccess<T | null>(null, OFFLINE_API_CONFIG.PROJECT.supported);
  }

  try {
    const res = await getProjectDetails(projectId, userId);
    const project = res.data as T;
    if (!project) return buildOnlineSuccess<T | null>(null, OFFLINE_API_CONFIG.PROJECT.supported);
    offlineStorage.create(PARTICIPANT_KEYS.project(userId, participantId, projectId), project).catch(() => {});
    return buildOnlineSuccess(project, OFFLINE_API_CONFIG.PROJECT.supported);
  } catch (err) {
    logger.warn('dataService.getProject: API failed — falling back to cached project', err);
    const cached = await offlineStorage.read<T>(PARTICIPANT_KEYS.project(userId, participantId, projectId));
    if (cached) {
      const withEdits = await applyPendingEditsToProject(userId, participantId, projectId, cached);
      return buildFromCache(withEdits, false);
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Observation Forms
// ---------------------------------------------------------------------------

export async function getObservationForm(
  participantId: string,
  formId: string,
  userId: string,
): Promise<OfflineServiceResponse<ObservationFormData | null>> {
  const offline = isNetworkOffline();

  let hasPendingEdits = false;
  if (!offline) {
    try {
      const edits = await offlineStorage.read<any>(
        PARTICIPANT_KEYS.formEdits(userId, participantId, formId),
      );
      hasPendingEdits = !!(edits && Object.keys(edits).length > 0);
    } catch { /* non-fatal */ }
  }

  if (offline || hasPendingEdits) {
    const cached = await offlineStorage.read<ObservationFormData>(
      PARTICIPANT_KEYS.form(userId, participantId, formId),
    );
    if (cached) return buildFromCache(cached, offline);
    if (offline) return buildOfflineNoData<ObservationFormData | null>(null);
  }

  // Online + no pending: web form component handles the API fetch
  return buildOnlineSuccess<ObservationFormData | null>(
    null,
    OFFLINE_API_CONFIG.OBSERVATION_FORM.supported,
  );
}

// ---------------------------------------------------------------------------
// Solutions (targeted solutions list)
// ---------------------------------------------------------------------------

export async function getSolutions(
  params: TargetedSolutionsParams,
): Promise<OfflineServiceResponse<AssessmentSurveyCardData[]>> {
  return withOfflineFirst(() => getTargetedSolutions(params), {
    offlineSupported: OFFLINE_API_CONFIG.TARGETED_SOLUTIONS.supported,
    cacheKey: OFFLINE_API_CONFIG.TARGETED_SOLUTIONS.cacheKey(params.type),
    emptyValue: [],
  });
}

// ---------------------------------------------------------------------------
// Project Categories
// ---------------------------------------------------------------------------

export async function getProjectCategories(): Promise<OfflineServiceResponse<any[]>> {
  return withOfflineFirst(() => getProjectCategoryList(), {
    offlineSupported: OFFLINE_API_CONFIG.PROJECT_CATEGORIES.supported,
    cacheKey: OFFLINE_API_CONFIG.PROJECT_CATEGORIES.cacheKey(),
    emptyValue: [],
  });
}

// ---------------------------------------------------------------------------
// Entity Details
// ---------------------------------------------------------------------------

export async function getEntityDetails(
  participantId: string,
  userId: string,
): Promise<OfflineServiceResponse<any>> {
  return withOfflineFirst(
    async () => {
      const res = await getEntityDetailsAPI(participantId);
      return res.data ?? null;
    },
    {
      offlineSupported: OFFLINE_API_CONFIG.ENTITY_DETAILS.supported,
      cacheReader: async () => {
        const details = await offlineStorage.read<any>(PARTICIPANT_KEYS.details(userId, participantId));
        const snapshot = await offlineStorage.read<any>(
          PARTICIPANT_KEYS.listSnapshot(userId, participantId),
        );
        return details ?? snapshot ?? null;
      },
      cacheWriter: async (data: any) => {
        await offlineStorage.create(PARTICIPANT_KEYS.details(userId, participantId), data);
      },
      hasPendingSyncFn: () => hasPendingForParticipant(userId, participantId),
      emptyValue: null,
    },
  );
}
export const mergeTasks = (oldData: any, newData: any) => {
  const taskMap = new Map();

  [...(oldData?.tasks || []), ...(newData?.tasks || [])].forEach(
    (task: any) => {
      if (!taskMap.has(task._id)) {
        taskMap.set(task._id, {
          ...task,
          children: [],
        });
      }

      const existingTask = taskMap.get(task._id);

      const childMap = new Map(
        existingTask.children.map((child: any) => [child._id, child])
      );

      task?.children?.forEach((child: any) => {
        if (!childMap.has(child._id)) {
          childMap.set(child._id, child);
        } else {
          childMap.set(child._id, {
            ...(childMap.get(child._id) ?? {}),
            ...child,
          });
        }
      });

      existingTask.children = Array.from(childMap.values());
    }
  );

  return {
    ...oldData,
    ...newData,
    tasks: Array.from(taskMap.values()),
  };
};
// ---------------------------------------------------------------------------
// Write Operations
// ---------------------------------------------------------------------------

export async function saveTaskEdit(
  participantId: string,
  projectId: string,
  taskEdit: { tasks: any[] },
  userId: string,
): Promise<void> {
  const existing =
    (await offlineStorage.read<{ tasks: any[] }>(PARTICIPANT_KEYS.projectEdits(userId, participantId, projectId))) ??
    { tasks: [] };
  const newDaya = mergeTasks(existing, taskEdit);
  await offlineStorage.create(PARTICIPANT_KEYS.projectEdits(userId, participantId, projectId), newDaya);
}

export async function saveFormEdits(
  participantId: string,
  formId: string,
  edits: ObservationFormEdits,
  userId: string,
): Promise<void> {
  await offlineStorage.create(PARTICIPANT_KEYS.formEdits(userId, participantId, formId), edits);
}

// ---------------------------------------------------------------------------
// Pending Sync Breakdown
// ---------------------------------------------------------------------------

export interface PendingBreakdown {
  files: number;
  forms: number;
  tasks: number;
  failed: number;
  total: number;
}

/** Per-participant pending sync info used by the redesigned SyncOverviewModal (Issue 4). */
export interface ParticipantPendingEntry {
  participantId: string;
  name: string;
  externalId: string;
  files: number;
  forms: number;
  tasks: number;
  total: number;
}

export async function getPendingBreakdown(userId: string, participantIds?: string[]): Promise<PendingBreakdown> {
  const ids = participantIds ?? (await getOfflineParticipantIds(userId));
  if (ids.length === 0) return { files: 0, forms: 0, tasks: 0, failed: 0, total: 0 };

  let files = 0,
    forms = 0,
    tasks = 0,
    failed = 0;

  for (const id of ids) {
    try {
      const filesPending = await offlineStorage.read<any[]>(PARTICIPANT_KEYS.filesPending(userId, id));
      if (filesPending?.length) files += filesPending.length;

      const allKeys = await offlineStorage.getParticipantKeys(userId, id);
      forms += allKeys.filter((k: string) => k.endsWith(':edits') && k.includes(':form:')).length;

      const projectEditKeys = allKeys.filter((k: string) => k.includes(':projectEdits:'));
      for (const key of projectEditKeys) {
        const edits = await offlineStorage.read<any>(key);
        if (edits?.tasks?.length) tasks += edits.tasks.length;
      }
    } catch { /* non-fatal */ }
  }

  try {
    const syncFailed = await offlineStorage.read<string[]>(OFFLINE_KEYS.SYNC_FAILED(userId));
    if (syncFailed?.length) failed = syncFailed.length;
  } catch { /* non-fatal */ }

  return { files, forms, tasks, failed, total: files + forms + tasks };
}

/**
 * Returns a per-participant breakdown of pending sync items for the given user.
 * Only includes participants that have at least one pending item.
 * Used by the redesigned SyncOverviewModal to show participant-wise sync info (Issue 4).
 */
export async function getPerParticipantPendingBreakdown(userId: string): Promise<ParticipantPendingEntry[]> {
  const ids = await getOfflineParticipantIds(userId);
  if (ids.length === 0) return [];

  const entries: ParticipantPendingEntry[] = [];

  for (const id of ids) {
    try {
      let files = 0, forms = 0, tasks = 0;

      const filesPending = await offlineStorage.read<any[]>(PARTICIPANT_KEYS.filesPending(userId, id));
      if (filesPending?.length) files = filesPending.length;

      const allKeys = await offlineStorage.getParticipantKeys(userId, id);
      forms = allKeys.filter((k: string) => k.endsWith(':edits') && k.includes(':form:')).length;

      const projectEditKeys = allKeys.filter((k: string) => k.includes(':projectEdits:'));
      for (const key of projectEditKeys) {
        const edits = await offlineStorage.read<any>(key);
        if (edits?.tasks?.length) tasks += edits.tasks.length;
      }

      const total = files + forms + tasks;
      if (total === 0) continue; // skip participants with no pending items

      // Read snapshot for display name / external ID
      const snapshot = await offlineStorage.read<any>(PARTICIPANT_KEYS.listSnapshot(userId, id));
      const name =
        snapshot?.name ||
        `${snapshot?.firstName ?? ''} ${snapshot?.lastName ?? ''}`.trim() ||
        id;
      const externalId = snapshot?.externalId ?? snapshot?.userId ?? id;

      entries.push({ participantId: id, name, externalId, files, forms, tasks, total });
    } catch { /* non-fatal — skip this participant */ }
  }

  return entries;
}

// ---------------------------------------------------------------------------
// Default export
// ---------------------------------------------------------------------------

const dataService = {
  getParticipantList,
  getParticipantDetails,
  getProject,
  saveTaskEdit,
  getObservationForm,
  saveFormEdits,
  getSolutions,
  getProjectCategories,
  getEntityDetails,
  getPendingBreakdown,
  getPerParticipantPendingBreakdown,
  isOfflineFallback,
  isNetworkOffline,
  OFFLINE_UNAVAILABLE,
};

export default dataService;
