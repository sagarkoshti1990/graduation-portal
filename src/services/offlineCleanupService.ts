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
import type { ObservationFormData } from '@app-types/offline';

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
 *   - Any filesPending entries (and their blobs) belonging to this project's tasks
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
    // Collect this project's task ids (top-level + children) before removing
    // its edit queue, so we can also clean up any pending files that belong
    // to them — mirrors deleteTaskOfflineData's file-cleanup below.
    const editKey = PARTICIPANT_KEYS.projectEdits(userId, participantId, projectId);
    const projectEdits = await offlineStorage.read<{ tasks: any[] }>(editKey).catch(() => null);
    const projectTaskIds = new Set<string>();
    for (const task of projectEdits?.tasks ?? []) {
      projectTaskIds.add(task._id);
      for (const child of task.children ?? []) {
        projectTaskIds.add(child._id);
      }
    }

    if (projectTaskIds.size > 0) {
      const filesPendingKey = PARTICIPANT_KEYS.filesPending(userId, participantId);
      const pending = await offlineStorage.read<any[]>(filesPendingKey).catch(() => null);
      if (pending?.length) {
        const projectFiles = pending.filter((f: any) => f.taskId && projectTaskIds.has(f.taskId));
        const otherFiles = pending.filter((f: any) => !(f.taskId && projectTaskIds.has(f.taskId)));

        await Promise.all(
          projectFiles.map(async (f: any) => {
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
    }

    await offlineStorage.removeMultiple([
      PARTICIPANT_KEYS.project(userId, participantId, projectId),
      editKey,
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
 * Remove ALL offline data for a single observation form.
 *
 * Removed data includes:
 *   - Form schema / submission snapshot
 *   - Pending form edit queue entry
 *   - filesPending entries whose taskId matches this observation's submissionId
 *   - Corresponding fileBlob entries for those files
 *   - The observation's entry in the participant solutions list
 *   - Questionnaire player IndexedDB record (web only, best-effort)
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
    // Read form snapshot first so we can find files linked by submissionId.
    const formData = await offlineStorage
      .read<ObservationFormData>(PARTICIPANT_KEYS.form(userId, participantId, formId))
      .catch(() => null);

    const submissionId = formData?.submissionId;

    // Keys that will be deleted in a single batch at the end.
    const keysToRemove: string[] = [
      PARTICIPANT_KEYS.form(userId, participantId, formId),
      PARTICIPANT_KEYS.formEdits(userId, participantId, formId),
    ];

    // ObservationContent.handleOfflineData writes formEdits keyed by submissionId
    // (not solutionId), so we must delete both variants to guarantee nothing is left.
    if (submissionId) {
      keysToRemove.push(PARTICIPANT_KEYS.formEdits(userId, participantId, submissionId));
    }

    // Remove filesPending entries that belong to this observation. Observation
    // PendingFile entries never set `taskId` — ObservationContent.tsx queues
    // them with `submissionId` directly — so match on that field, not taskId.
    if (submissionId) {
      const filesPendingKey = PARTICIPANT_KEYS.filesPending(userId, participantId);
      const pending = await offlineStorage.read<any[]>(filesPendingKey).catch(() => null);
      if (pending?.length) {
        const obsFiles = pending.filter((f: any) => f.submissionId === submissionId);
        const remaining = pending.filter((f: any) => f.submissionId !== submissionId);

        for (const f of obsFiles) {
          const blobKey = f.storageKey ?? PARTICIPANT_KEYS.fileBlob(userId, participantId, f.fileName);
          keysToRemove.push(blobKey);
        }

        if (remaining.length === 0) {
          keysToRemove.push(filesPendingKey);
        } else {
          await offlineStorage.create(filesPendingKey, remaining).catch(() => {});
        }
      }
    }

    // Remove the observation entry from the participant's solutions list.
    const solutionsKey = PARTICIPANT_KEYS.solutions(userId, participantId);
    const solutions = await offlineStorage.read<any[]>(solutionsKey).catch(() => null);
    if (solutions?.length) {
      const filtered = solutions.filter((s: any) => s.solutionId !== formId);
      if (filtered.length !== solutions.length) {
        if (filtered.length === 0) {
          keysToRemove.push(solutionsKey);
        } else {
          await offlineStorage.create(solutionsKey, filtered).catch(() => {});
        }
      }
    }

    await offlineStorage.removeMultiple(keysToRemove);

    // Web only: remove the submission record from the questionnaire player's IndexedDB.
    if (submissionId && typeof window !== 'undefined' && typeof indexedDB !== 'undefined') {
      try {
        await new Promise<void>(resolve => {
          const openReq = indexedDB.open('questionnairePlayer', 1);
          openReq.onerror = () => resolve();
          openReq.onsuccess = () => {
            const db = openReq.result;
            if (!db.objectStoreNames.contains('questionnaire')) { resolve(); return; }
            const tx = db.transaction('questionnaire', 'readwrite');
            tx.objectStore('questionnaire').delete(submissionId);
            tx.oncomplete = () => resolve();
            tx.onerror = () => resolve();
          };
        });
      } catch {
        // Questionnaire player DB may not exist — skip silently.
      }
    }
  } catch (err) {
    logger.warn(
      `offlineCleanupService: failed to delete observation "${formId}" data`,
      err,
    );
  }
}
