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

async function hasPendingForParticipant(participantId: string): Promise<boolean> {
  try {
    const edits = await offlineStorage.read<any>(PARTICIPANT_KEYS.projectEdits(participantId));
    if (edits?.tasks?.length > 0) return true;
    const allKeys = await offlineStorage.getParticipantKeys(participantId);
    return allKeys.some((k: string) => k.endsWith(':edits'));
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

async function loadOfflineParticipantList(
  search?: string,
  status?: string,
): Promise<ParticipantListResult | null> {
  try {
    const ids = await getOfflineParticipantIds();
    if (ids.length === 0) return null; // no participants downloaded

    const snapshots = await Promise.all(
      ids.map((id: string) => offlineStorage.read<any>(PARTICIPANT_KEYS.listSnapshot(id))),
    );
    let participants = snapshots.filter((p): p is Participant => p !== null);

    if (search?.trim()) {
      const q = search.trim().toLowerCase();
      participants = participants.filter((p: any) => {
        const name = ((p.firstName ?? '') + ' ' + (p.lastName ?? '')).toLowerCase();
        const externalId = (p.externalId ?? p.userId ?? '').toLowerCase();
        return name.includes(q) || externalId.includes(q);
      });
    }

    if (status && status !== 'all') {
      participants = participants.filter(
        (p: any) => (p.status ?? p.accountUserStatus ?? '').toLowerCase() === status.toLowerCase(),
      );
    }

    const allParticipants = snapshots.filter((p): p is Participant => p !== null);
    return {
      participants,
      total: participants.length,
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
    const cached = await loadOfflineParticipantList(params.search, params.status);
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
    const cached = await loadOfflineParticipantList(params.search, params.status);
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
        .create(PARTICIPANT_KEYS.listSnapshot(participantId), participantData)
        .catch(() => {});
      return participantData;
    },
    {
      offlineSupported: OFFLINE_API_CONFIG.PARTICIPANT_DETAILS.supported,
      cacheReader: async () => {
        const details = await offlineStorage.read<any>(PARTICIPANT_KEYS.details(participantId));
        const snapshot = await offlineStorage.read<any>(
          PARTICIPANT_KEYS.listSnapshot(participantId),
        );
        return details ?? snapshot ?? null;
      },
      hasPendingSyncFn: () => hasPendingForParticipant(participantId),
      emptyValue: null,
    },
  );
}

// ---------------------------------------------------------------------------
// Project + Tasks
// ---------------------------------------------------------------------------

export async function getProject<T = any>(
  participantId: string,
  projectId: string,
): Promise<OfflineServiceResponse<T | null>> {
  const offline = isNetworkOffline();
  const hasPending =
    !offline && projectId ? await hasPendingForParticipant(participantId) : false;

  if (offline || hasPending) {
    const cached = await offlineStorage.read<T>(PARTICIPANT_KEYS.project(participantId,projectId));
    if (cached) return buildFromCache(cached, offline);
    if (offline) return buildOfflineNoData<T | null>(null);
    // hasPending but no local project yet — fall through to API
  }

  if (!projectId) {
    return buildOnlineSuccess<T | null>(null, OFFLINE_API_CONFIG.PROJECT.supported);
  }

  try {
    const res = await getProjectDetails(projectId);
    const project = res.data as T;
    if (!project) return buildOnlineSuccess<T | null>(null, OFFLINE_API_CONFIG.PROJECT.supported);
    offlineStorage.create(PARTICIPANT_KEYS.project(participantId,projectId), project).catch(() => {});
    return buildOnlineSuccess(project, OFFLINE_API_CONFIG.PROJECT.supported);
  } catch (err) {
    logger.warn('dataService.getProject: API failed — falling back to cached project', err);
    const cached = await offlineStorage.read<T>(PARTICIPANT_KEYS.project(participantId,projectId));
    if (cached) return buildFromCache(cached, false);
    throw err;
  }
}

export async function getTasks<T = any>(
  participantId: string,
): Promise<OfflineServiceResponse<T[]>> {
  const offline = isNetworkOffline();
  const hasPending = !offline ? await hasPendingForParticipant(participantId) : false;

  if (offline || hasPending) {
    const project = await offlineStorage.read<any>(PARTICIPANT_KEYS.project(participantId,"123"));
    if (project) {
      const tasks: T[] = project.tasks ?? project.children ?? [];
      return buildFromCache(tasks, offline);
    }
    if (offline) return buildOfflineNoData<T[]>([]);
  }

  // Online + no pending: tasks are embedded in the project returned by getProject
  return buildOnlineSuccess<T[]>([], OFFLINE_API_CONFIG.PROJECT.supported);
}

// ---------------------------------------------------------------------------
// Observation Forms
// ---------------------------------------------------------------------------

export async function getObservationForm(
  participantId: string,
  formId: string,
): Promise<OfflineServiceResponse<ObservationFormData | null>> {
  const offline = isNetworkOffline();

  let hasPendingEdits = false;
  if (!offline) {
    try {
      const edits = await offlineStorage.read<any>(
        PARTICIPANT_KEYS.formEdits(participantId, formId),
      );
      hasPendingEdits = !!(edits && Object.keys(edits).length > 0);
    } catch { /* non-fatal */ }
  }

  if (offline || hasPendingEdits) {
    const cached = await offlineStorage.read<ObservationFormData>(
      PARTICIPANT_KEYS.form(participantId, formId),
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
): Promise<OfflineServiceResponse<any>> {
  return withOfflineFirst(
    async () => {
      const res = await getEntityDetailsAPI(participantId);
      return res.data ?? null;
    },
    {
      offlineSupported: OFFLINE_API_CONFIG.ENTITY_DETAILS.supported,
      cacheReader: async () => {
        const details = await offlineStorage.read<any>(PARTICIPANT_KEYS.details(participantId));
        const snapshot = await offlineStorage.read<any>(
          PARTICIPANT_KEYS.listSnapshot(participantId),
        );
        return details ?? snapshot ?? null;
      },
      cacheWriter: async (data: any) => {
        await offlineStorage.create(PARTICIPANT_KEYS.details(participantId), data);
      },
      hasPendingSyncFn: () => hasPendingForParticipant(participantId),
      emptyValue: null,
    },
  );
}

// ---------------------------------------------------------------------------
// Write Operations
// ---------------------------------------------------------------------------

export async function saveTaskEdit(
  participantId: string,
  taskEdit: { _id: string; [key: string]: any },
): Promise<void> {
  const existing =
    (await offlineStorage.read<{ tasks: any[] }>(PARTICIPANT_KEYS.projectEdits(participantId))) ??
    { tasks: [] };
  const deduped = existing.tasks.filter((t: any) => t._id !== taskEdit._id);
  await offlineStorage.create(PARTICIPANT_KEYS.projectEdits(participantId), {
    tasks: [...deduped, taskEdit],
  });
}

export async function saveFormEdits(
  participantId: string,
  formId: string,
  edits: ObservationFormEdits,
): Promise<void> {
  await offlineStorage.create(PARTICIPANT_KEYS.formEdits(participantId, formId), edits);
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

export async function getPendingBreakdown(participantIds?: string[]): Promise<PendingBreakdown> {
  const ids = participantIds ?? (await getOfflineParticipantIds());
  if (ids.length === 0) return { files: 0, forms: 0, tasks: 0, failed: 0, total: 0 };

  let files = 0,
    forms = 0,
    tasks = 0,
    failed = 0;

  for (const id of ids) {
    try {
      const filesPending = await offlineStorage.read<string[]>(PARTICIPANT_KEYS.filesPending(id));
      if (filesPending?.length) files += filesPending.length;

      const allKeys = await offlineStorage.getParticipantKeys(id);
      forms += allKeys.filter((k: string) => k.endsWith(':edits') && k.includes(':form:')).length;

      const projectEdits = await offlineStorage.read<any>(PARTICIPANT_KEYS.projectEdits(id));
      if (projectEdits?.tasks?.length) tasks += projectEdits.tasks.length;
    } catch { /* non-fatal */ }
  }

  try {
    const syncFailed = await offlineStorage.read<string[]>(OFFLINE_KEYS.SYNC_FAILED);
    if (syncFailed?.length) failed = syncFailed.length;
  } catch { /* non-fatal */ }

  return { files, forms, tasks, failed, total: files + forms + tasks };
}

// ---------------------------------------------------------------------------
// Default export
// ---------------------------------------------------------------------------

const dataService = {
  getParticipantList,
  getParticipantDetails,
  getProject,
  getTasks,
  saveTaskEdit,
  getObservationForm,
  saveFormEdits,
  getSolutions,
  getProjectCategories,
  getEntityDetails,
  getPendingBreakdown,
  isOfflineFallback,
  isNetworkOffline,
  OFFLINE_UNAVAILABLE,
};

export default dataService;
