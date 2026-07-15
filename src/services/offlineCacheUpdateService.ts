/**
 * Offline cache consistency helpers.
 *
 * After every successful online action, call the appropriate helper here to
 * keep the participant's offline copy in sync with the server.  Each helper:
 *   1. Checks whether the participant is currently in offline storage.
 *   2. Skips silently if they are not (no download has been performed yet).
 *   3. Updates only the affected data key — never re-downloads the entire participant.
 *
 * Eligibility rule (ALLOWOFFLINESTATUS from app.constant):
 *   Eligible   : NOT_ONBOARDED, IN_PROGRESS  → may retain offline data
 *   Ineligible : ONBOARDED, GRADUATED, …     → offline data must be removed
 */

import offlineStorage, { isParticipantOffline } from './offlineStorage';
import { PARTICIPANT_KEYS } from '@constants/STORAGE_KEYS';
import { ALLOWOFFLINESTATUS } from '@constants/app.constant';
import { deleteParticipantOfflineData } from './offlineCleanupService';
import { getProjectDetails } from '../project-player/services/projectPlayerService';
import logger from '@utils/logger';

// ── Eligibility ───────────────────────────────────────────────────────────────

/** Returns true when a participant with this status may retain offline data. */
export function isOfflineEligible(status: string): boolean {
  return (ALLOWOFFLINESTATUS as string[]).includes(status);
}

// ── Participant profile ───────────────────────────────────────────────────────

/**
 * Patch the stored participant entity-details record with `updates`.
 * Only the provided fields are merged in; all other stored fields are
 * left untouched.
 */
export async function updateOfflineParticipantDetails(
  userId: string,
  participantId: string,
  updates: Record<string, any>,
): Promise<void> {
  if (!userId || !participantId || !updates) return;
  try {
    const offline = await isParticipantOffline(userId, participantId);
    if (!offline) return;
    const key = PARTICIPANT_KEYS.details(userId, participantId);
    const existing = await offlineStorage.read<any>(key);
    if (!existing) return;
    await offlineStorage.create(key, { ...existing, ...updates });
  } catch (err) {
    logger.warn('offlineCacheUpdateService: failed to patch participant details', err);
  }
}

// ── Project ───────────────────────────────────────────────────────────────────

/**
 * Replace the stored project snapshot with `updatedProject` after a successful
 * online task update, add-task, or delete-task call.
 *
 * Skips silently when:
 *  • the participant is not in offline storage, OR
 *  • the project key does not exist (project was never cached for offline use).
 */
export async function updateOfflineProject(
  userId: string,
  participantId: string,
  projectId: string,
  updatedProject: any,
): Promise<void> {
  if (!userId || !participantId || !projectId || !updatedProject) return;
  try {
    const offline = await isParticipantOffline(userId, participantId);
    if (!offline) return;
    const key = PARTICIPANT_KEYS.project(userId, participantId, projectId);
    const exists = await offlineStorage.exists(key);
    if (!exists) return;
    await offlineStorage.create(key, updatedProject);
  } catch (err) {
    logger.warn('offlineCacheUpdateService: failed to update offline project', err);
  }
}

/**
 * Re-fetches a project via the Project Details API and overwrites the offline
 * snapshot with the fresh server response — used after an online project
 * action (task completion, custom task create/update/delete, file upload/
 * delete) succeeds, so the offline copy never drifts from server truth.
 *
 * Skips the network call entirely (not just the write) when there's nothing
 * to overwrite: not offline-downloaded, or this project was never cached.
 * The actual write is delegated to `updateOfflineProject`, which re-checks
 * the same eligibility and stores the response's own `updatedAt` as-is — no
 * separate timestamp bookkeeping needed.
 */
export async function refreshOfflineProjectFromServer(
  userId: string,
  participantId: string,
  projectId: string,
): Promise<void> {
  if (!userId || !participantId || !projectId) return;
  try {
    const offline = await isParticipantOffline(userId, participantId);
    if (!offline) return;
    const exists = await offlineStorage.exists(PARTICIPANT_KEYS.project(userId, participantId, projectId));
    if (!exists) return;

    const response = await getProjectDetails(projectId, userId);
    if (response?.data) {
      await updateOfflineProject(userId, participantId, projectId, response.data);
    }
  } catch (err) {
    logger.warn('offlineCacheUpdateService: failed to refresh offline project from server', err);
  }
}

// ── Status-driven cleanup ─────────────────────────────────────────────────────

/**
 * If `newStatus` is not offline-eligible AND the participant is currently
 * stored in offline storage, delete all their offline data.
 *
 * Returns true when data was removed, false when nothing was changed.
 *
 * Callers that showed a confirmation dialog should call this AFTER the user
 * confirms.  Callers without a dialog can call it after a successful API call.
 */
export async function removeOfflineDataIfIneligible(
  userId: string,
  participantId: string,
  newStatus: string,
): Promise<boolean> {
  if (!userId || !participantId || isOfflineEligible(newStatus)) return false;
  try {
    const offline = await isParticipantOffline(userId, participantId);
    if (!offline) return false;
    await deleteParticipantOfflineData(userId, [participantId]);
    return true;
  } catch (err) {
    logger.warn('offlineCacheUpdateService: failed to remove ineligible offline data', err);
    return false;
  }
}
