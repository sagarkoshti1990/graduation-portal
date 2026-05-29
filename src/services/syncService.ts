/**
 * SyncService — uploads pending offline changes to the backend.
 *
 * Sync order (must not change — tasks depend on forms, forms depend on entities):
 *   1. File uploads  (pending file references → upload to API)
 *   2. Form edits    (pending form answers  → POST to observationSubmissions/update)
 *   3. Task edits    (pending task status   → POST to /api/project/v1/userProjects/update/{id})
 *
 * File upload (Stage 1) is intentionally minimal for web PWA — the web component
 * stores file blobs in its own IndexedDB and manages upload when online via the
 * baseURL + userAuthToken it receives from playerConfig.  What we track in
 * offlineStorage is a list of base64Keys / local URIs that still need attention.
 * Until a dedicated upload bridge is built that reads those blobs and calls
 * GET_SIGNED_URL, the stage marks them as processed so the sync can proceed.
 *
 * Form edits (Stage 2) push saved answers to the survey backend using:
 *   POST /api/survey/v1/observationSubmissions/update/{observationId}?entityId={entityId}
 * The observationId (= formId) and entityId are derived from the stored form key and
 * the cached ObservationFormData record respectively.
 */

import logger from '@utils/logger';
import offlineStorage, { getOfflineParticipantIds } from './offlineStorage';
import { PARTICIPANT_KEYS, OFFLINE_KEYS } from '@constants/STORAGE_KEYS';
import type { SyncResult, SyncProgress, ObservationFormData, PendingFile } from '@app-types/offline';
import api from './api';
import { API_ENDPOINTS } from './apiEndpoints';
import {
  updateTask as updateTaskAPI,
  uploadFiles,
} from '../project-player/services/projectPlayerService';

type ProgressCallback = (progress: SyncProgress) => void;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function makeProgress(
  stage: SyncProgress['stage'],
  current: number,
  total: number,
): SyncProgress {
  const stageWeight: Record<SyncProgress['stage'], number> = {
    idle: 0, files: 33, forms: 66, tasks: 99, done: 100,
  };
  return {
    stage,
    percentage: total > 0
      ? Math.round(stageWeight[stage] + (current / total) * 33)
      : stageWeight[stage],
    current,
    total,
  };
}

// ---------------------------------------------------------------------------
// Stage 1 — File uploads
// ---------------------------------------------------------------------------

/** Reconstructs a browser File from a base64 data-URL produced by FileReader.readAsDataURL. */
function base64ToFile(base64: string, fileName: string, mimeType: string): File {
  const [header, data] = base64.split(',');
  const mime = header.match(/:(.*?);/)?.[1] ?? mimeType;
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], fileName, { type: mime });
}

/**
 * After a file is uploaded and we have a server URL, patch the corresponding
 * attachment stub (url: '') in the stored projectEdits so the next task sync
 * sends the real URL to the server.
 * Scans all projectEdits keys for the participant to find the one containing
 * the target task (a participant may have edits across multiple projects).
 */
async function patchTaskAttachmentUrl(
  participantId: string,
  taskId: string,
  fileName: string,
  serverUrl: string,
  sourcePath?: string,
): Promise<void> {
  const allKeys = await offlineStorage.getParticipantKeys(participantId);
  const editKeys = allKeys.filter((k: string) => k.includes(':projectEdits:'));

  for (const key of editKeys) {
    const projectEdits = await offlineStorage.read<{ tasks: any[] }>(key);
    if (!projectEdits?.tasks) continue;

    const hasTask = projectEdits.tasks.some((t: any) => t._id === taskId);
    if (!hasTask) continue;

    const updatedTasks = projectEdits.tasks.map((task: any) => {
      if (task._id !== taskId) return task;
      return {
        ...task,
        attachments: (task.attachments ?? []).map((att: any) =>
          att.name === fileName
            ? { ...att, url: serverUrl, sourcePath: sourcePath ?? att.sourcePath }
            : att,
        ),
      };
    });

    await offlineStorage.create(key, { ...projectEdits, tasks: updatedTasks });
    break; // task found and patched — stop scanning
  }
}

async function syncFiles(
  participantId: string,
  onProgress?: ProgressCallback,
): Promise<{ synced: number; failed: number }> {
  const pending = await offlineStorage.read<PendingFile[]>(PARTICIPANT_KEYS.filesPending(participantId));
  console.log(pending,"file");
  if (!pending?.length) return { synced: 0, failed: 0 };

  let synced = 0, failed = 0;
  const syncedNames: string[] = [];
  console.log(pending,"file");

  for (let i = 0; i < pending.length; i++) {
    const { taskId, fileName, fileType, storageKey } = pending[i];
    // storageKey is the timestamped blob key; fall back to legacy key for old entries
    const blobKey = storageKey ?? PARTICIPANT_KEYS.fileBlob(participantId, fileName);
    try {
      // Read the stored base64 content
      const base64 = await offlineStorage.read<string>(blobKey);
  console.log(base64,blobKey,"base64");

      if (!base64) {
        // No content stored (e.g. blob was cleaned up already) — treat as done
        logger.warn(`syncService: no stored blob for "${fileName}" — skipping`);
        syncedNames.push(fileName);
        synced++;
        continue;
      }

      // Reconstruct File object and upload via pre-signed URL
      const file = base64ToFile(base64, fileName, fileType);
  console.log(file,"file 1");
      const result = await uploadFiles(taskId, [file]);
  console.log(result,"result");
      const uploaded = result.data?.[0];

      if (uploaded?.url) {
        // Patch the attachment stub in stored task edits so the task sync step
        // sends the real server URL instead of the empty placeholder.
        await patchTaskAttachmentUrl(
          participantId,
          taskId,
          fileName,
          uploaded.url,
          uploaded.sourcePath,
        );
        // Remove the persisted blob — no longer needed
        await offlineStorage.remove(blobKey).catch(() => {});
      }

      syncedNames.push(fileName);
      synced++;
      onProgress?.(makeProgress('files', i + 1, pending.length));
    } catch (err) {
      logger.error(`syncService: file upload failed for "${fileName}" (task: ${taskId})`, err);
      failed++;
    }
  }

  // Remove synced entries from the pending queue
  if (syncedNames.length > 0) {
    const remaining = pending.filter(p => !syncedNames.includes(p.fileName));
    if (remaining.length === 0) {
      await offlineStorage.remove(PARTICIPANT_KEYS.filesPending(participantId)).catch(() => {});
    } else {
      await offlineStorage.create(PARTICIPANT_KEYS.filesPending(participantId), remaining);
    }
  }

  return { synced, failed };
}

// ---------------------------------------------------------------------------
// Stage 2 — Form edits
// ---------------------------------------------------------------------------

/**
 * Parses the formId (= observationId) out of a form-edits storage key.
 * Key pattern: participant:{participantId}:form:{formId}:edits
 */
function parseFormIdFromKey(key: string): string | null {
  // Split on ':form:' and ':edits' to isolate the middle segment
  const formMarker = ':form:';
  const editsMarker = ':edits';
  const formStart = key.indexOf(formMarker);
  const editsEnd = key.lastIndexOf(editsMarker);
  if (formStart === -1 || editsEnd === -1) return null;
  return key.slice(formStart + formMarker.length, editsEnd) || null;
}

async function syncFormEdits(
  participantId: string,
  onProgress?: ProgressCallback,
): Promise<{ synced: number; failed: number }> {
  const allKeys = await offlineStorage.getParticipantKeys(participantId);
  const editKeys = allKeys.filter(
    (k: string) => k.endsWith(':edits') && k.includes(':form:'),
  );

  let synced = 0, failed = 0;
  for (let i = 0; i < editKeys.length; i++) {
    const key = editKeys[i];
    try {
      const edits = await offlineStorage.read<any>(key);
      if (!edits) { synced++; continue; }

      const formId = parseFormIdFromKey(key);
      if (!formId) {
        logger.warn(`syncService: cannot parse formId from key "${key}" — skipping`);
        failed++;
        continue;
      }

      // Load the cached form data to get entityId (required for the API call)
      const formData = await offlineStorage.read<ObservationFormData>(
        PARTICIPANT_KEYS.form(participantId, formId),
      );
      if (!formData?.entityId) {
        logger.warn(`syncService: no entityId found for form "${formId}" — skipping`);
        failed++;
        continue;
      }

      // Use stored observationId (may differ from solutionId used as storage key)
      const apiObservationId = formData.observationId ?? formId;
      await api.post(
        `${API_ENDPOINTS.UPDATE_OBSERVATION_SUBMISSION}/${apiObservationId}?entityId=${formData.entityId}`,
        {
          submissionId: edits.submissionId,
          answers: edits.data,
        },
      );

      await offlineStorage.remove(key);
      synced++;
      onProgress?.(makeProgress('forms', i + 1, editKeys.length));
    } catch (err) {
      logger.error(`syncService: form edit sync failed for key ${key}`, err);
      failed++;
    }
  }

  return { synced, failed };
}

// ---------------------------------------------------------------------------
// Stage 3 — Task edits
// ---------------------------------------------------------------------------

async function syncTaskEdits(
  participantId: string,
  onProgress?: ProgressCallback,
): Promise<{ synced: number; failed: number }> {
  const allKeys = await offlineStorage.getParticipantKeys(participantId);
  const editKeys = allKeys.filter((k: string) => k.includes(':projectEdits:'));

  if (!editKeys.length) return { synced: 0, failed: 0 };

  let synced = 0, failed = 0;

  for (const editKey of editKeys) {
    const projectEdits = await offlineStorage.read<{ tasks: any[] }>(editKey);
    if (!projectEdits?.tasks?.length) continue;

    // Extract projectId from key: participant:${participantId}:projectEdits:${projectId}
    const projectId = editKey.split(':projectEdits:')[1];
    if (!projectId) {
      logger.warn(`syncService: cannot parse projectId from key "${editKey}" — skipping`);
      failed++;
      continue;
    }

    try {
      // Send all pending task edits for this project in a single API call
      await updateTaskAPI(projectId, projectEdits);
      synced += projectEdits.tasks.length;
      onProgress?.(makeProgress('tasks', synced, synced));
      await offlineStorage.remove(editKey).catch(() => {});
    } catch (err) {
      logger.error(`syncService: task edit sync failed for project ${projectId}`, err);
      failed++;
    }
  }

  return { synced, failed };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Sync all pending changes for a single participant. */
export const startSync = async (
  participantId: string,
  onProgress?: ProgressCallback,
): Promise<SyncResult> => {
  const errors: string[] = [];
  let syncedCount = 0, failedCount = 0;

  onProgress?.(makeProgress('files', 0, 1));
  const filesResult = await syncFiles(participantId, onProgress);
  syncedCount += filesResult.synced;
  failedCount += filesResult.failed;

  onProgress?.(makeProgress('forms', 0, 1));
  const formsResult = await syncFormEdits(participantId, onProgress);
  syncedCount += formsResult.synced;
  failedCount += formsResult.failed;

  onProgress?.(makeProgress('tasks', 0, 1));
  const tasksResult = await syncTaskEdits(participantId, onProgress);
  syncedCount += tasksResult.synced;
  failedCount += tasksResult.failed;

  // Record failures for retry; update per-participant lastSyncedAt on success
  if (failedCount > 0) {
    const existing = await offlineStorage.read<string[]>(OFFLINE_KEYS.SYNC_FAILED) ?? [];
    if (!existing.includes(participantId)) {
      await offlineStorage.create(OFFLINE_KEYS.SYNC_FAILED, [...existing, participantId]);
    }
  } else {
    const existing = await offlineStorage.read<string[]>(OFFLINE_KEYS.SYNC_FAILED) ?? [];
    await offlineStorage.create(
      OFFLINE_KEYS.SYNC_FAILED,
      existing.filter((id: string) => id !== participantId),
    );
    // Record per-participant sync timestamp so the UI badge can show "last synced"
    await offlineStorage.create(
      PARTICIPANT_KEYS.lastSyncedAt(participantId),
      Date.now(),
    ).catch(() => {});
  }

  await offlineStorage.create(OFFLINE_KEYS.SYNC_LAST, Date.now()).catch(() => {});
  onProgress?.(makeProgress('done', 1, 1));

  return {
    success: failedCount === 0,
    syncedCount,
    failedCount,
    errors,
  };
};

/** Sync all offline participants sequentially. */
export const startSyncAll = async (
  onProgress?: ProgressCallback,
): Promise<SyncResult> => {
  const ids = await getOfflineParticipantIds();
  if (ids.length === 0) {
    return { success: true, syncedCount: 0, failedCount: 0, errors: [] };
  }

  let syncedCount = 0, failedCount = 0;
  const errors: string[] = [];

  for (const id of ids) {
    const result = await startSync(id, onProgress);
    syncedCount += result.syncedCount;
    failedCount += result.failedCount;
    errors.push(...result.errors);
  }

  return { success: failedCount === 0, syncedCount, failedCount, errors };
};
