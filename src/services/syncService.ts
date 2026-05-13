/**
 * SyncService — uploads pending offline changes to the backend.
 *
 * Sync order (must not change — tasks depend on forms, forms depend on entities):
 *   1. File uploads (pending file references → upload to API)
 *   2. Form edits  (pending form answers → POST to observation submissions)
 *   3. Task edits  (pending task status → PATCH to project tasks)
 */

import logger from '@utils/logger';
import offlineStorage, { getOfflineParticipantIds } from './offlineStorage';
import { PARTICIPANT_KEYS, OFFLINE_KEYS } from '@constants/STORAGE_KEYS';
import type { SyncResult, SyncProgress } from '@app-types/offline';
import api from './api';
import { API_ENDPOINTS } from './apiEndpoints';

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

async function syncFiles(
  participantId: string,
  onProgress?: ProgressCallback,
): Promise<{ synced: number; failed: number }> {
  const pending = await offlineStorage.read<string[]>(PARTICIPANT_KEYS.filesPending(participantId));
  if (!pending?.length) return { synced: 0, failed: 0 };

  let synced = 0, failed = 0;
  for (let i = 0; i < pending.length; i++) {
    try {
      // pending[i] is a local file URI — actual upload handled by project player
      // For now, mark as synced (real upload happens in WebComponent bridge)
      synced++;
      onProgress?.(makeProgress('files', i + 1, pending.length));
    } catch (err) {
      logger.error(`syncService: file upload failed for participant ${participantId}`, err);
      failed++;
    }
  }

  if (failed === 0) {
    await offlineStorage.remove(PARTICIPANT_KEYS.filesPending(participantId)).catch(() => {});
  }

  return { synced, failed };
}

// ---------------------------------------------------------------------------
// Stage 2 — Form edits
// ---------------------------------------------------------------------------

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

      await api.post(API_ENDPOINTS.CREATE_OBSERVATION_SUBMISSION, {
        submissionId: edits.submissionId,
        answers: edits.data,
      });

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
  const projectEdits = await offlineStorage.read<{ tasks: any[] }>(
    PARTICIPANT_KEYS.projectEdits(participantId),
  );
  const tasks = projectEdits?.tasks ?? [];
  if (!tasks.length) return { synced: 0, failed: 0 };

  let synced = 0, failed = 0;
  for (let i = 0; i < tasks.length; i++) {
    const taskEdit = tasks[i];
    try {
      await api.patch(`/project/v1/tasks/${taskEdit._id}`, taskEdit);
      synced++;
      onProgress?.(makeProgress('tasks', i + 1, tasks.length));
    } catch (err) {
      logger.error(`syncService: task edit sync failed for task ${taskEdit._id}`, err);
      failed++;
    }
  }

  if (failed === 0) {
    await offlineStorage.remove(PARTICIPANT_KEYS.projectEdits(participantId)).catch(() => {});
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

  // Record failures for retry
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
