/**
 * DataService — Centralized offline-aware data access layer.
 *
 * 3-tier decision tree applied to every read:
 *   1. Device offline  → read from storage; return OFFLINE_UNAVAILABLE if nothing cached
 *   2. Device online + participant has pending unsynced changes
 *                      → serve local data to protect those edits
 *   3. Device online + no pending changes
 *                      → call API, cache result, return live data
 *
 * Screens and hooks NEVER call navigator.onLine, isParticipantOffline, or
 * touch offlineStorage directly. They call dataService and check
 * isOfflineFallback(result) to render the standard offline message.
 */

import { Platform } from 'react-native';
import offlineStorage, {
  getOfflineParticipantIds,
} from './offlineStorage';
import { PARTICIPANT_KEYS, OFFLINE_KEYS } from '@constants/STORAGE_KEYS';
import { getParticipantsList } from './participantService';
import { getProjectDetails } from '../project-player/services/projectPlayerService';
import logger from '@utils/logger';
import type { Participant } from '@app-types/screens';
import type { ParticipantOverview } from '@app-types/participant';
import type { ObservationFormData, ObservationFormEdits } from '@app-types/offline';

// ---------------------------------------------------------------------------
// OfflineFallback sentinel
// ---------------------------------------------------------------------------

export interface OfflineFallback {
  __isOfflineFallback: true;
  message: string; // i18n key — translate at the call site
}

/** Single consistent offline-unavailable response. */
export const OFFLINE_UNAVAILABLE: OfflineFallback = {
  __isOfflineFallback: true,
  message: 'offlineSync.dataUnavailable',
};

/** Type-guard: true when v is the offline-unavailable sentinel. */
export function isOfflineFallback(v: any): v is OfflineFallback {
  return v != null && (v as OfflineFallback).__isOfflineFallback === true;
}

// ---------------------------------------------------------------------------
// Network detection
// ---------------------------------------------------------------------------

export function isNetworkOffline(): boolean {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return !window.navigator.onLine;
  }
  return false; // native: API-error is the offline signal
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
  isOfflineFallback?: boolean;
}

async function loadOfflineParticipantList(): Promise<ParticipantListResult> {
  try {
    const ids = await getOfflineParticipantIds();
    if (ids.length === 0) {
      return { participants: [], total: 0, overview: null, fromCache: true, isOfflineFallback: true };
    }
    const snapshots = await Promise.all(
      ids.map((id: string) => offlineStorage.read<Participant>(PARTICIPANT_KEYS.listSnapshot(id))),
    );
    const participants = snapshots.filter((p): p is Participant => p !== null);
    const overview = await offlineStorage
      .read<ParticipantOverview>(`${OFFLINE_KEYS.PARTICIPANTS_LIST}:overview`)
      .catch(() => null);
    return { participants, total: participants.length, overview, fromCache: true };
  } catch {
    return { participants: [], total: 0, overview: null, fromCache: true, isOfflineFallback: true };
  }
}

/**
 * Participant list — offline: all downloaded snapshots (no status filter).
 * Online: live API call, caches first-page no-search results.
 */
export async function getParticipantList(
  params: ParticipantListParams,
): Promise<ParticipantListResult> {
  if (isNetworkOffline()) {
    logger.info('dataService.getParticipantList: offline — loading from listSnapshot');
    return loadOfflineParticipantList();
  }
  try {
    const response = await getParticipantsList(params);
    const participants = response.result?.data ?? [];
    const overview = response.result?.overview ?? null;
    const total = response.total ?? 0;

    if (!params.search && (!params.page || params.page === 1)) {
      const cacheKey = `${OFFLINE_KEYS.PARTICIPANTS_LIST}:${params.status || 'all'}`;
      await offlineStorage.create(cacheKey, { data: participants, total }).catch(() => {});
      if (overview) {
        await offlineStorage
          .create(`${OFFLINE_KEYS.PARTICIPANTS_LIST}:overview`, overview)
          .catch(() => {});
      }
    }
    return { participants, total, overview, fromCache: false };
  } catch (err) {
    logger.warn('dataService.getParticipantList: API failed — falling back to offline', err);
    return loadOfflineParticipantList();
  }
}

// ---------------------------------------------------------------------------
// Participant Details
// ---------------------------------------------------------------------------

/**
 * Loads full participant details.
 * Online: calls API, caches result.
 * Offline / API error: reads from stored details or listSnapshot.
 * Returns OFFLINE_UNAVAILABLE if offline and no cached data exists.
 */
export async function getParticipantDetails(
  participantId: string,
  userId: string,
): Promise<any | OfflineFallback> {
  const offline = isNetworkOffline();

  if (offline) {
    const details = await offlineStorage.read<any>(PARTICIPANT_KEYS.details(participantId));
    const snapshot = await offlineStorage.read<any>(PARTICIPANT_KEYS.listSnapshot(participantId));
    return (details ?? snapshot) ?? OFFLINE_UNAVAILABLE;
  }

  try {
    const response = await getParticipantsList({ entityId: participantId, userId });
    const row = response?.result?.data?.[0];
    if (!row) return OFFLINE_UNAVAILABLE;
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
  } catch (err) {
    logger.warn('dataService.getParticipantDetails: API failed — falling back to cached data', err);
    const details = await offlineStorage.read<any>(PARTICIPANT_KEYS.details(participantId));
    const snapshot = await offlineStorage.read<any>(PARTICIPANT_KEYS.listSnapshot(participantId));
    return (details ?? snapshot) ?? OFFLINE_UNAVAILABLE;
  }
}

// ---------------------------------------------------------------------------
// Project + Tasks
// ---------------------------------------------------------------------------

/**
 * Loads the participant's project.
 *
 * Returns:
 *   T               — project data (from cache or API)
 *   null            — no projectId; caller should create the project
 *   OfflineFallback — offline and no cached data
 *
 * When pending task edits exist the cached project is served to protect edits.
 * When online and no pending edits the API is called and the result is cached.
 */
export async function getProject<T = any>(
  participantId: string,
  projectId?: string,
): Promise<T | null | OfflineFallback> {
  const offline = isNetworkOffline();
  const hasPending = !offline && projectId
    ? await hasPendingForParticipant(participantId)
    : false;

  if (offline || hasPending) {
    const cached = await offlineStorage.read<T>(PARTICIPANT_KEYS.project(participantId));
    if (cached) return cached;
    if (offline) return OFFLINE_UNAVAILABLE;
    // hasPending but no local project — fall through to API
  }

  if (!projectId) return null; // no project yet — caller handles creation

  try {
    const res = await getProjectDetails(projectId);
    const project = res.data as T;
    if (!project) return null;
    const tasks = (project as any).tasks ?? (project as any).children ?? [];
    await offlineStorage.create(PARTICIPANT_KEYS.project(participantId), project).catch(() => {});
    await offlineStorage.create(PARTICIPANT_KEYS.tasks(participantId), tasks).catch(() => {});
    return project;
  } catch (err) {
    logger.warn('dataService.getProject: API failed — falling back to cached project', err);
    const cached = await offlineStorage.read<T>(PARTICIPANT_KEYS.project(participantId));
    if (cached) return cached;
    throw err;
  }
}

export async function getTasks<T = any>(
  participantId: string,
): Promise<T[] | null | OfflineFallback> {
  const offline = isNetworkOffline();
  const hasPending = !offline ? await hasPendingForParticipant(participantId) : false;

  if (offline || hasPending) {
    const tasks = await offlineStorage.read<T[]>(PARTICIPANT_KEYS.tasks(participantId));
    if (tasks) return tasks;
    if (offline) return OFFLINE_UNAVAILABLE;
  }

  return null; // online + no pending: tasks are embedded in project
}

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

// ---------------------------------------------------------------------------
// Observation Forms
// ---------------------------------------------------------------------------

/**
 * Returns the cached observation form.
 *
 * Returns:
 *   ObservationFormData  — cached (offline or pending form edits)
 *   null                 — online, no pending; web component handles the fetch
 *   OfflineFallback      — offline and no cached form data
 */
export async function getObservationForm(
  participantId: string,
  formId: string,
): Promise<ObservationFormData | null | OfflineFallback> {
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
    if (cached) return cached;
    if (offline) return OFFLINE_UNAVAILABLE;
  }

  return null; // online + no pending: web component handles the API fetch
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

export async function getPendingBreakdown(
  participantIds?: string[],
): Promise<PendingBreakdown> {
  const ids = participantIds ?? (await getOfflineParticipantIds());
  if (ids.length === 0) return { files: 0, forms: 0, tasks: 0, failed: 0, total: 0 };

  let files = 0, forms = 0, tasks = 0, failed = 0;

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
  getPendingBreakdown,
  isOfflineFallback,
  isNetworkOffline,
  OFFLINE_UNAVAILABLE,
};

export default dataService;
