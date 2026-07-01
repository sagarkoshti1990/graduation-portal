/**
 * Centralized offline data cleanup utilities.
 *
 * All offline removal logic lives here so it is reused consistently across
 * services and components rather than duplicated in each call site.
 *
 * Three scopes are provided:
 *   - Participant-level  (everything belonging to one or more participants)
 *   - Project-level     (one project's data only)
 *   - Observation-level (one observation form only)
 *
 * Usage from a component:
 *   import { deleteParticipantOfflineData, deleteProjectOfflineData,
 *            deleteObservationOfflineData } from '../../services/offlineCleanupService';
 */

import logger from '@utils/logger';
import offlineStorage from './offlineStorage';
import { removeOfflineParticipantId } from './offlineStorage';
import { PARTICIPANT_KEYS } from '@constants/STORAGE_KEYS';

// ── Participant-level ─────────────────────────────────────────────────────────

/**
 * Remove ALL offline data belonging to the given participants.
 *
 * Removed data includes:
 *   - Participant profile / entity details
 *   - Download status and metadata
 *   - Cached projects and project edit queues
 *   - Observation form schemas, submissions, and edit queues
 *   - Pending file upload lists and stored file blobs
 *   - Solutions / keyword maps
 *   - lastSyncedAt timestamps
 *
 * The participant IDs are also removed from the offline participant registry
 * so the participant no longer appears in the offline list.
 *
 * Pass all affected IDs together so the registry update is a single write.
 */
export async function deleteParticipantOfflineData(
  userId: string,
  participantIds: string[],
): Promise<void> {
  await Promise.all(
    participantIds.map(async participantId => {
      try {
        const allKeys = await offlineStorage.getParticipantKeys(userId, participantId);
        if (allKeys.length) {
          await offlineStorage.removeMultiple(allKeys);
        }
        await removeOfflineParticipantId(userId, participantId);
      } catch (err) {
        logger.warn(
          `offlineCleanupService: failed to delete all data for participant "${participantId}"`,
          err,
        );
      }
    }),
  );
}

// ── Project-level ─────────────────────────────────────────────────────────────

/**
 * Remove offline data for a single project belonging to a participant.
 *
 * Removed data includes:
 *   - Cached project snapshot
 *   - Project task edit queue
 *
 * Does NOT remove the participant profile, other projects, or unrelated
 * observation forms.
 */
export async function deleteProjectOfflineData(
  userId: string,
  participantId: string,
  projectId: string,
): Promise<void> {
  try {
    await offlineStorage.removeMultiple([
      PARTICIPANT_KEYS.project(userId, participantId, projectId),
      PARTICIPANT_KEYS.projectEdits(userId, participantId, projectId),
    ]);
  } catch (err) {
    logger.warn(
      `offlineCleanupService: failed to delete project "${projectId}" data`,
      err,
    );
  }
}

// ── Task-level ────────────────────────────────────────────────────────────────

/**
 * Remove offline data for a single project task.
 *
 * Actions:
 *   - Removes the task entry from the project's edit queue (projectEdits).
 *     If no tasks remain, the entire edit queue key and project snapshot are
 *     also removed so the project no longer appears pending.
 *   - Removes any file blobs and filesPending entries that belong to this task.
 *
 * Does NOT touch participant profile data, other projects, or observation forms.
 */
export async function deleteTaskOfflineData(
  userId: string,
  participantId: string,
  projectId: string,
  taskId: string,
): Promise<void> {
  try {
    const editKey = PARTICIPANT_KEYS.projectEdits(userId, participantId, projectId);
    const projectEdits = await offlineStorage.read<{ tasks: any[] }>(editKey).catch(() => null);

    if (projectEdits?.tasks?.length) {
      const isTopLevel = projectEdits.tasks.some((t: any) => t._id === taskId);
      let remaining: any[];
      if (isTopLevel) {
        remaining = projectEdits.tasks.filter((t: any) => t._id !== taskId);
      } else {
        // Remove the child from its parent's children array.
        // If a parent then has no children and no own edits, remove it too.
        remaining = projectEdits.tasks
          .map((t: any) => {
            if (!t.children?.some((c: any) => c._id === taskId)) return t;
            return { ...t, children: t.children.filter((c: any) => c._id !== taskId) };
          })
          .filter((t: any) => {
            const hasOwnEdits = t.status !== undefined || (t.attachments?.length ?? 0) > 0;
            const hasChildren = (t.children?.length ?? 0) > 0;
            return hasOwnEdits || hasChildren;
          });
      }
      if (remaining.length === 0) {
        await offlineStorage.remove(editKey).catch(() => {});
        await offlineStorage.remove(PARTICIPANT_KEYS.project(userId, participantId, projectId)).catch(() => {});
      } else {
        await offlineStorage.create(editKey, { ...projectEdits, tasks: remaining }).catch(() => {});
      }
    }

    // Remove pending file entries and their blobs for this task
    const filesPendingKey = PARTICIPANT_KEYS.filesPending(userId, participantId);
    const pending = await offlineStorage.read<any[]>(filesPendingKey).catch(() => null);
    if (pending?.length) {
      const taskFiles = pending.filter((f: any) => f.taskId === taskId);
      const otherFiles = pending.filter((f: any) => f.taskId !== taskId);

      await Promise.all(
        taskFiles.map(async (f: any) => {
          const blobKey = f.storageKey ?? PARTICIPANT_KEYS.fileBlob(userId, participantId, f.fileName);
          await offlineStorage.remove(blobKey).catch(() => {});
        }),
      );

      if (otherFiles.length === 0) {
        await offlineStorage.remove(filesPendingKey).catch(() => {});
      } else {
        await offlineStorage.create(filesPendingKey, otherFiles).catch(() => {});
      }
    }
  } catch (err) {
    logger.warn(`offlineCleanupService: failed to delete task "${taskId}" data`, err);
  }
}

// ── Observation-level ─────────────────────────────────────────────────────────

/**
 * Remove offline data for a single observation form.
 *
 * Removed data includes:
 *   - Form schema / submission snapshot
 *   - Pending form edit queue entry
 *
 * Does NOT remove the participant profile, projects, other forms, or any
 * unrelated data.
 */
export async function deleteObservationOfflineData(
  userId: string,
  participantId: string,
  formId: string,
): Promise<void> {
  try {
    await Promise.all([
      offlineStorage.remove(PARTICIPANT_KEYS.form(userId, participantId, formId)).catch(() => {}),
      offlineStorage.remove(PARTICIPANT_KEYS.formEdits(userId, participantId, formId)).catch(() => {}),
    ]);
  } catch (err) {
    logger.warn(
      `offlineCleanupService: failed to delete observation "${formId}" data`,
      err,
    );
  }
}
