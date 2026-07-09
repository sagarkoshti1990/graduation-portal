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
import { findEmbeddedFiles, setAtPath } from '@utils/helper';
import offlineStorage, { getOfflineParticipantIds } from './offlineStorage';
import fileStorageService from './fileStorageService';
import { PARTICIPANT_KEYS, OFFLINE_KEYS } from '@constants/STORAGE_KEYS';
import type { SyncResult, SyncProgress, ObservationFormData, ObservationFormEdits, PendingFile } from '@app-types/offline';
import api from './api';
import { API_ENDPOINTS } from './apiEndpoints';
import {
  updateTask as updateTaskAPI,
  uploadFiles,
  submitInterventionPlan,
  updateInterventionPlan,
} from '../project-player/services/projectPlayerService';
import {
  updateEntityDetails,
  createOrUpdateProgramUserMapping,
} from './participantService';
import { buildOnboardingFileUpdate } from '../project-player/components/Task/TaskCard/utils/taskTransformers';
import {
  runValidationForParticipant,
  buildSkipSets,
  createSyncValidationCache,
} from './syncValidationService';
import { deleteParticipantOfflineData } from './offlineCleanupService';
import { updateOfflineParticipantDetails } from './offlineCacheUpdateService';
import { STATUS } from '@constants/app.constant';

/**
 * Controls which items the sync engine should skip.
 * Produced by syncValidationService.buildSkipSets() after user decisions are
 * collected; passed into startSync so the service layer stays UI-free.
 */
export interface SyncSkipOptions {
  /** FormIds (solutionIds) whose edits must not be sent to the server. */
  skipFormIds?: Set<string>;
  /** TaskIds whose status edits must not be sent to the server. */
  skipTaskIds?: Set<string>;
  /** ProjectIds whose task edits must not be sent to the server. */
  skipProjectIds?: Set<string>;
}

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
    idle: 0, files: 25, forms: 50, tasks: 75, idp: 95, done: 100,
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


/**
 * After a file is uploaded and we have a server URL, patch the corresponding
 * attachment stub (url: '') in the stored projectEdits so the next task sync
 * sends the real URL to the server.
 * Scans all projectEdits keys for the participant to find the one containing
 * the target task (a participant may have edits across multiple projects).
 */
async function patchTaskAttachmentUrl(
  userId: string,
  participantId: string,
  taskId: string,
  fileName: string,
  serverUrl: string,
  sourcePath?: string,
): Promise<void> {
  const allKeys = await offlineStorage.getParticipantKeys(userId, participantId);
  const editKeys = allKeys.filter((k: string) => k.includes(':projectEdits:'));

  // Match by `fileName` (unique generated name) for new entries, fall back to
  // `name` for legacy attachment stubs written before `fileName` was added.
  const matchesFileName = (att: any): boolean =>
    att.fileName ? att.fileName === fileName : att.name === fileName;

  const patchAttachments = (attachments: any[]): any[] =>
    (attachments ?? []).map((att: any) =>
      matchesFileName(att)
        ? { ...att, url: serverUrl, sourcePath: sourcePath ?? att.sourcePath }
        : att,
    );

  for (const key of editKeys) {
    const projectEdits = await offlineStorage.read<{ tasks: any[] }>(key);
    if (!projectEdits?.tasks) continue;

    // Search top-level tasks first (Type 1 — direct task), then children (Type 2 — child task)
    const hasTopLevel = projectEdits.tasks.some((t: any) => t._id === taskId);
    const hasChild = !hasTopLevel && projectEdits.tasks.some(
      (t: any) => t.children?.some((c: any) => c._id === taskId),
    );
    if (!hasTopLevel && !hasChild) continue;
    const updatedTasks = projectEdits.tasks.map((task: any) => {
      if (hasTopLevel && task._id === taskId) {
        // Type 1: attachment lives on the task itself
        return { ...task, attachments: patchAttachments(task.attachments) };
      }
      if (hasChild && task.children?.some((c: any) => c._id === taskId)) {
        // Type 2: attachment lives on the matching child
        return {
          ...task,
          children: task.children.map((child: any) =>
            child._id === taskId
              ? { ...child, attachments: patchAttachments(child.attachments) }
              : child,
          ),
        };
      }
      return task;
    });

    await offlineStorage.create(key, { ...projectEdits, tasks: updatedTasks });
    break; // task found and patched — stop scanning
  }
}

/**
 * After an observation file is uploaded and we have a server URL, patch the
 * corresponding file entry (added offline, still pointing at local/placeholder
 * data) in the stored form edits so the next form sync sends the real URL.
 * Mirrors patchTaskAttachmentUrl's read-modify-write pattern, but the form
 * edits key is known directly (keyed by submissionId, not solutionId) so no
 * key-scanning is needed.
 */
async function patchFormAttachmentUrl({
  userId,
  participantId,
  submissionId,
  fieldId,
  fileName,
  originalName,
  storageKey,
  serverUrl,
  sourcePath,
}:{
  userId: string,
  participantId: string,
  submissionId: string,
  fieldId: string,
  fileName: string,
  originalName?: string,
  storageKey?: string,
  serverUrl: string,
  sourcePath?: string,
}): Promise<void> {
  console.log("sagar",{
  userId,
  participantId,
  submissionId,
  fieldId,
  fileName,
  originalName,
  storageKey,
  serverUrl,
  sourcePath,
})
  const key = PARTICIPANT_KEYS.formEdits(userId, participantId, submissionId);
  const form = await offlineStorage.read<ObservationFormEdits>(key);
  if (!form?.answers) return;

  // Locate the answer by qid — the object key under `answers` is not
  // necessarily the fieldId, so search by value rather than index.
  const answerEntry = Object.entries(form.answers).find(
    ([, answer]) => (answer as any)?.qid === fieldId,
  );
  if (!answerEntry) {
    logger.warn(`syncService: no answer with qid "${fieldId}" found in form "${submissionId}" — skipping attachment patch`);
    return;
  }
  const [answerKey, answer] = answerEntry as [string, any];

  // Match by generated fileName/storageKey first (unique), fall back to
  // originalName for entries that only carry the display name.
  const matchesUploadedFile = (entry: any): boolean =>
    !!(
      entry?.fileName === fileName ||
      entry?.name === fileName ||
      (storageKey && entry?.fileName === storageKey) ||
      (originalName && entry?.originalName === originalName)
    );

  const patchFileEntry = (entry: any) =>
    matchesUploadedFile(entry)
      ? {
          ...entry,
          url: serverUrl,
          previewUrl: serverUrl,
          sourcePath: sourcePath ?? entry.sourcePath,
          isUploaded: true,
        }
      : entry;

  const patchFileList = (list: any): any =>
    Array.isArray(list) ? list.map(patchFileEntry) : patchFileEntry(list);

  const updatedAnswer = {
    ...answer,
    ...(answer.value !== undefined ? { value: patchFileList(answer.value) } : {}),
    ...(answer.fileName !== undefined ? { fileName: patchFileList(answer.fileName) } : {}),
  };

  await offlineStorage.create(key, {
    ...form,
    answers: { ...form.answers, [answerKey]: updatedAnswer },
  });
}


async function syncFiles(
  userId: string,
  participantId: string,
  onProgress?: ProgressCallback,
): Promise<{ synced: number; failed: number }> {
  const pending = await offlineStorage.read<PendingFile[]>(PARTICIPANT_KEYS.filesPending(userId, participantId));
  if (!pending?.length) return { synced: 0, failed: 0 };

  let synced = 0, failed = 0;
  const syncedNames: string[] = [];
  
  for (let i = 0; i < pending.length; i++) {
    const { taskId, fieldId, submissionId, originalName, fileName, fileType, storageKey, localFilePath, mimeType, isOnboardingTask, taskReferenceId } = pending[i];
    // storageKey is the unique blob key; fall back to legacy key for old entries
    const blobKey = storageKey ?? PARTICIPANT_KEYS.fileBlob(userId, participantId, fileName);
    const uid = taskId || fieldId || "";
    try {
      // localFilePath (native) means the content was written to the
      // filesystem, not AsyncStorage — read it back from there instead.
      let base64; 
      if(localFilePath) {
        base64 = await fileStorageService.readBase64FileAtPath(localFilePath).then(b64 => b64 ? `data:${mimeType};base64,${b64}` : null);
      } else {
        base64 = await offlineStorage.read<string>(blobKey);
      }
      
      if (!base64 || !uid) {
        // No content stored (e.g. blob was cleaned up already) — treat as done
        logger.warn(`syncService: no stored blob for "${fileName}" — skipping`);
        syncedNames.push(fileName);
        synced++;
        continue;
      }

      // `name` is the unique generated fileName used for the S3 upload key.
      // `originalName` is carried through so uploadFiles can populate the
      // attachment's display name on the returned object.
      const result = await uploadFiles(uid, [{
        name: fileName,
        originalName: originalName ?? fileName,
        size: 0,
        type: fileType,
        uri: '',
        base64 : base64 || "",
      }]);
      const uploaded = result.data?.[0];

      if (uploaded?.url) {
        // Patch the attachment stub in stored task edits so the task sync step
        // sends the real server URL instead of the empty placeholder.
        if(taskId) {
          await patchTaskAttachmentUrl(
            userId,
            participantId,
            taskId,
            fileName,
            uploaded.url,
            uploaded.sourcePath,
          );

          // Mirror the online updateEntityFile call: update participant entity
          // fields (consent / SLA) when the file belongs to an onboarding task.
          if (isOnboardingTask && taskReferenceId) {
            try {
              const updates = buildOnboardingFileUpdate(
                { referenceId: taskReferenceId } as any,
                [uploaded],
                new Date().toISOString(),
              );
              if (updates) {
                await updateEntityDetails({ userId, entityId: participantId, entityUpdates: updates });
                // @ts-ignore
                // await createOrUpdateProgramUserMapping({
                //   userId: participantId,
                //   programId: process.env.GLOBAL_LC_PROGRAM_ID,
                //   metaInformation: updates,
                //   status: STATUS.NOT_ONBOARDED,
                // });
              }
            } catch (err) {
              logger.warn(`syncService: onboarding entity update failed for task "${taskId}"`, err);
            }
          }
        } else if(fieldId && submissionId) {
           patchFormAttachmentUrl({
            userId,
            participantId,
            fieldId: fieldId || "",
            submissionId: submissionId || "",
            fileName,
            serverUrl: uploaded.url,
            sourcePath: uploaded.sourcePath,
          })
        }

        // Remove the persisted content — no longer needed
        if (localFilePath) {
          await fileStorageService.deleteFileAtPath(localFilePath);
        } else {
          await offlineStorage.remove(blobKey).catch(() => {});
        }
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
      await offlineStorage.remove(PARTICIPANT_KEYS.filesPending(userId, participantId)).catch(() => {});
    } else {
      await offlineStorage.create(PARTICIPANT_KEYS.filesPending(userId, participantId), remaining);
    }
  }

  return { synced, failed };
}

// ---------------------------------------------------------------------------
// Stage 2 — Form edits (including offline file extraction)
// ---------------------------------------------------------------------------

/**
 * Recursively scans a form-answers object for embedded data-URL file content
 * (base64 strings produced when a user uploads a file while offline).
 *
 * For each data URL found, uploads the file via the presigned-URL mechanism
 * and replaces the data URL in the (deep-cloned) answers object with the
 * returned server URL, so the observation submission reaches the server with
 * real file URLs rather than large base64 payloads.
 *
 * On the web platform the function also reads from the questionnaire player's
 * own IndexedDB (`questionnairePlayer` / `questionnaire` store) in case the
 * web component stored additional file blobs there that were not forwarded
 * through the QUESTIONNAIRE_SAVE bridge.
 *
 * The function is best-effort: upload failures are logged and skipped so they
 * never block the form-answers sync.
 *
 * @returns The (possibly mutated clone of) answers with data URLs replaced.
 */
async function prepareObservationAnswers(
  answers: any,
  submissionId: string,
  userId: string,
  participantId: string,
): Promise<any> {
  if (!answers || typeof answers !== 'object') return answers;

  // Deep-clone so we never mutate the stored record until all uploads succeed.
  const patched = JSON.parse(JSON.stringify(answers));

  const namePrefix = `obs-${submissionId}`;
  const fileEntries = findEmbeddedFiles(patched, namePrefix);

  // On web: also scan the questionnaire player's own IndexedDB for any file
  // blobs that the web component stored separately (not forwarded in answers).
  if (typeof window !== 'undefined') {
    try {
      const playerData = await offlineStorage.read<any>(submissionId, {
        dbName: 'questionnairePlayer',
        storeName: 'questionnaire',
      });
      if (playerData) {
        // startIndex continues the counter so generated fileNames from this
        // second pass never collide with ones already found in `patched`.
        fileEntries.push(...findEmbeddedFiles(playerData, namePrefix, fileEntries.length).map(
          entry => ({ ...entry, path: ['_player', ...entry.path] }),
        ));
      }
    } catch {
      // Questionnaire player DB may not exist yet — skip silently.
    }
  }

  if (fileEntries.length === 0) return patched;

  // Upload each discovered file and patch the URL back into the answers.
  // Use submissionId as the group key for the presigned-URL request.
  for (const entry of fileEntries) {
    try {
      // "blob" entries were already extracted to the filesystem at save time
      // (native — see ObservationContent.handleOfflineData) and only carry
      // metadata in answers; "inline" entries still have the raw data URL
      // (web, or any record saved before extraction existed).
      const dataUrl = entry.kind === 'blob'
        ? await fileStorageService.readBase64FileAtPath(entry.localPath).then(b64 => b64 ? `data:${entry.mimeType};base64,${b64}` : null)
        : entry.dataUrl;
      if (!dataUrl) {
        logger.warn(`syncService: offline file "${entry.fileName}" not found — skipping`);
        continue;
      }

      const result = await uploadFiles(submissionId, [{
        name: entry.fileName,
        originalName: entry.kind === 'stored' ? (entry.originalName ?? entry.fileName) : entry.fileName,
        base64: dataUrl,
        type: entry.mimeType,
        size: 0,
        uri: '',
      }]);
      const uploaded = result.data?.[0];
      const serverUrl: string | undefined =
        typeof uploaded?.url === 'string' ? uploaded.url : undefined;

      if (serverUrl) {
        if (entry.kind === 'stored') {
          // Web-component file answers use a richer object shape than the
          // plain-URL replacement used for inline/blob entries — patch the
          // whole answer entry so it matches what the player expects post-upload.
          setAtPath(patched, entry.path, {
            isUploaded: true,
            file: {},
            url: serverUrl,
            previewUrl: serverUrl,
            sourcePath: uploaded?.sourcePath,
            submissionId: entry.fieldId,
            name: entry.fileName,
            originalName: entry.originalName ?? entry.fileName,
            type: entry.mimeType,
          });
        } else {
          setAtPath(patched, entry.path, serverUrl);
        }

        if (entry.kind === 'blob') {
          await fileStorageService.deleteFileAtPath(entry.localPath);
        }

        // Also persist the uploaded file reference in filesPending so the
        // normal file-sync accounting stays consistent.
        // const filesPendingKey = PARTICIPANT_KEYS.filesPending(userId, participantId);
        // const existingPending = await offlineStorage.read<PendingFile[]>(filesPendingKey) ?? [];
        // const alreadyQueued = existingPending.some(f => f.fileName === entry.fileName);
        // if (!alreadyQueued) {
        //   await offlineStorage.create(filesPendingKey, [
        //     ...existingPending,
        //     {
        //       taskId: submissionId,
        //       originalName: entry.fileName,
        //       fileName: entry.fileName,
        //       fileType: entry.mimeType,
        //     } as PendingFile,
        //   ]).catch(() => {});
        // }
      }
    } catch (err) {
      logger.warn(
        `syncService: observation file upload failed (submission: "${submissionId}", path: ${entry.path.join('.')})`,
        err,
      );
    }
  }

  return patched;
}

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
  userId: string,
  participantId: string,
  onProgress?: ProgressCallback,
  skipFormIds?: Set<string>,
): Promise<{ synced: number; failed: number }> {
  const allKeys = await offlineStorage.getParticipantKeys(userId, participantId);
  const editKeys = allKeys.filter(
    (k: string) => k.endsWith(':edits') && k.includes(':form:'),
  );

  let synced = 0, failed = 0;
  for (let i = 0; i < editKeys.length; i++) {
    const key = editKeys[i];
    try {
      const {solutionId,...edits} = await offlineStorage.read<any>(key);
      if (!edits) { synced++; continue; }
      const formId = solutionId || parseFormIdFromKey(key);
      if (!formId) {
        logger.warn(`syncService: cannot parse formId from key "${key}" — skipping`);
        failed++;
        continue;
      }

      // Skip forms that were blocked or not confirmed by the validation phase.
      if (skipFormIds?.has(formId)) {
        logger.info(`syncService: form "${formId}" skipped by validation`);
        continue;
      }

      // Load the cached form data to get entityId (required for the API call)
      const formData = await offlineStorage.read<ObservationFormData>(
        PARTICIPANT_KEYS.form(userId, participantId, formId),
      );

      if (!formData?.submissionId) {
        logger.warn(`syncService: no entityId found for form "${formId}" — skipping`);
        failed++;
        continue;
      }

      // Extract any offline file uploads (data URLs) from the answers and upload
      // them to the server before posting the form evidence, so the submission
      // arrives with real file URLs instead of base64 payloads.
      // const patchedAnswers = await prepareObservationAnswers(
      //   edits.answers,
      //   formData.submissionId,
      //   userId,
      //   participantId,
      // );
      const evidencePayload = edits 
      // patchedAnswers !== edits.answers
      //   ? { ...edits, answers: patchedAnswers }
      //   : edits;

      await api.post(`${API_ENDPOINTS.UPDATE_OBSERVATION_SUBMISSION}/${formData.submissionId}`, { evidence: evidencePayload });

      // Remove edit queue entry and form snapshot — both are now on the server.
      await offlineStorage.remove(key);
      await offlineStorage.remove(PARTICIPANT_KEYS.form(userId, participantId, formId)).catch(() => {});
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

/**
 * After a successful task-edit sync, merges the uploaded attachment URLs
 * (from the now-patched projectEdits) back into the cached project so the
 * local cache reflects the server state without needing a fresh API fetch.
 *
 * Only `status` and `attachments` are merged — structural fields always come
 * from the cached project (mirrors the rule in dataService.applyEditMapToTasks).
 */
async function applyEditsToCachedProject(
  userId: string,
  participantId: string,
  projectId: string,
  editedTasks: any[],
): Promise<void> {
  const projectKey = PARTICIPANT_KEYS.project(userId, participantId, projectId);
  const cached = await offlineStorage.read<any>(projectKey);
  if (!cached) return;

  // Build id → edit record map covering both top-level tasks and their children
  const editMap = new Map<string, any>();
  for (const task of editedTasks) {
    editMap.set(task._id, task);
    if (task.children?.length) {
      for (const child of task.children) {
        editMap.set(child._id, child);
      }
    }
  }

  const applyToTasks = (tasks: any[]): any[] =>
    tasks.map(task => {
      const edit = editMap.get(task._id);
      const status = edit?.status ?? task.status;
      const attachments = edit?.attachments !== undefined ? edit.attachments : task.attachments;
      const merged = { ...task, status, attachments };
      if (merged.tasks?.length)    merged.tasks    = applyToTasks(merged.tasks);
      if (merged.children?.length) merged.children = applyToTasks(merged.children);
      return merged;
    });

  const updatedProject = {
    ...cached,
    ...(cached.tasks    ? { tasks:    applyToTasks(cached.tasks)    } : {}),
    ...(cached.children ? { children: applyToTasks(cached.children) } : {}),
  };

  await offlineStorage.create(projectKey, updatedProject).catch(() => {});
}

/**
 * Strips the internal `_pendingOp` bookkeeping tag (used only to identify
 * queued custom-task create/delete operations pre-sync) from the payload
 * sent to the backend — it is not part of the UPDATE_TASK API contract.
 */
function stripPendingOpFields(tasks: any[]): any[] {
  return tasks.map(({ _pendingOp, children, ...rest }: any) => ({
    ...rest,
    ...(children ? { children: stripPendingOpFields(children) } : {}),
  }));
}

async function syncTaskEdits(
  userId: string,
  participantId: string,
  onProgress?: ProgressCallback,
  skipTaskIds?: Set<string>,
  skipProjectIds?: Set<string>,
): Promise<{ synced: number; failed: number }> {
  const allKeys = await offlineStorage.getParticipantKeys(userId, participantId);
  const editKeys = allKeys.filter((k: string) => k.includes(':projectEdits:'));

  if (!editKeys.length) return { synced: 0, failed: 0 };

  let synced = 0, failed = 0;

  for (const editKey of editKeys) {
    const projectEdits = await offlineStorage.read<{ tasks: any[] }>(editKey);
    if (!projectEdits?.tasks?.length) continue;

    // Extract projectId from key: participant:{userId}:{participantId}:projectEdits:{projectId}
    const projectId = editKey.split(':projectEdits:')[1];
    if (!projectId) {
      logger.warn(`syncService: cannot parse projectId from key "${editKey}" — skipping`);
      failed++;
      continue;
    }

    // Skip entire project if blocked by validation.
    if (skipProjectIds?.has(projectId)) {
      logger.info(`syncService: project "${projectId}" skipped by validation`);
      continue;
    }

    // Filter out tasks (and their children) that were skipped by the validation phase.
    const tasksToSync = skipTaskIds?.size
      ? projectEdits.tasks
          .filter((t: any) => !skipTaskIds.has(t._id))
          .map((t: any) => {
            if (!t.children?.length) return t;
            const allowed = t.children.filter((c: any) => !skipTaskIds.has(c._id));
            return allowed.length === t.children.length ? t : { ...t, children: allowed };
          })
      : projectEdits.tasks;

    if (!tasksToSync.length) {
      logger.info(`syncService: all tasks for project "${projectId}" skipped by validation`);
      continue;
    }

    const payload = tasksToSync.length === projectEdits.tasks.length
      ? projectEdits
      : { ...projectEdits, tasks: tasksToSync };

    try {
      // Send all pending task edits for this project in a single API call.
      // Strip internal bookkeeping fields (_pendingOp) before it hits the API.
      const apiPayload = { ...payload, tasks: stripPendingOpFields(payload.tasks) };
      await updateTaskAPI(projectId, apiPayload);
      synced += tasksToSync.length;
      onProgress?.(makeProgress('tasks', synced, synced));
      // Merge the uploaded URLs back into the cached project so the local cache
      // reflects the server state without needing a fresh fetch.
      await applyEditsToCachedProject(userId, participantId, projectId, tasksToSync);
      // If some tasks were skipped (user chose Cancel), preserve only those tasks
      // so they can be retried next session.  Also handles skipped children: if a
      // parent has skipped children, preserve the parent with only those children.
      const skippedTasks = skipTaskIds?.size
        ? projectEdits.tasks.flatMap((t: any) => {
            if (skipTaskIds.has(t._id)) return [t];
            if (t.children?.length) {
              const skippedChildren = t.children.filter((c: any) => skipTaskIds.has(c._id));
              if (skippedChildren.length > 0) return [{ ...t, children: skippedChildren }];
            }
            return [];
          })
        : [];
      if (skippedTasks.length > 0) {
        await offlineStorage.create(editKey, { ...projectEdits, tasks: skippedTasks }).catch(() => {});
      } else {
        await offlineStorage.remove(editKey).catch(() => {});
        await offlineStorage.remove(PARTICIPANT_KEYS.project(userId, participantId, projectId)).catch(() => {});
      }
    } catch (err) {
      logger.error(`syncService: task edit sync failed for project ${projectId}`, err);
      failed++;
    }
  }

  return { synced, failed };
}

// ---------------------------------------------------------------------------
// Stage 4 — Intervention Plan submissions
//
// Replays a queued createProjectPlan/updateProjectPlan call (built offline by
// ProjectComponent) once back online, then mirrors the same status-update
// calls the online success path makes (Template/index.tsx handleIdpCreation):
// updateEntityDetails + createOrUpdateProgramUserMapping, plus a local cache
// patch so the participant's cached status/idpProjectId reflect the change
// without a full re-download.
// ---------------------------------------------------------------------------

async function syncInterventionPlanSubmissions(
  userId: string,
  participantId: string,
  onProgress?: ProgressCallback,
): Promise<{ synced: number; failed: number }> {
  const key = PARTICIPANT_KEYS.idpSubmissionPending(userId, participantId);
  const pending = await offlineStorage.read<{
    reqBody: any;
    isReplace: boolean;
    oldProjectId?: string;
  }>(key);
  if (!pending) return { synced: 0, failed: 0 };

  onProgress?.(makeProgress('idp', 0, 1));
  try {
    const response = pending.isReplace
      ? await updateInterventionPlan(pending.oldProjectId!, pending.reqBody)
      : await submitInterventionPlan(pending.reqBody);

    if (response.error) throw new Error(response.error);

    const newProjectId = response?.data?.projectId;
    const thisDate = new Date().toISOString();

    await updateEntityDetails({
      userId,
      entityId: participantId,
      entityUpdates: {
        idpProjectId: newProjectId,
        idpProjectCreatedAt: thisDate,
        status: STATUS.IN_PROGRESS,
      },
    });
    await createOrUpdateProgramUserMapping({
      userId: participantId,
      programId: process.env.GLOBAL_LC_PROGRAM_ID as string,
      metaInformation: {
        idpProjectId: newProjectId,
        idpProjectCreatedAt: thisDate,
      },
      status: STATUS.IN_PROGRESS,
    });

    // Reflect the new status/project locally too, without a full re-download.
    await updateOfflineParticipantDetails(userId, participantId, {
      status: STATUS.IN_PROGRESS,
      idpProjectId: newProjectId,
      idpProjectCreatedAt: thisDate,
    });

    await offlineStorage.remove(key);
    onProgress?.(makeProgress('idp', 1, 1));
    return { synced: 1, failed: 0 };
  } catch (err) {
    logger.error(`syncService: failed to sync IDP submission for "${participantId}"`, err);
    onProgress?.(makeProgress('idp', 0, 1));
    return { synced: 0, failed: 1 };
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Sync all pending changes for a single participant. userId scopes all storage
 * keys.  Pass `skipOptions` (produced by syncValidationService.buildSkipSets)
 * to omit items that failed pre-sync validation.
 */
export const startSync = async (
  participantId: string,
  userId: string,
  onProgress?: ProgressCallback,
  skipOptions?: SyncSkipOptions,
): Promise<SyncResult> => {
  const errors: string[] = [];
  let syncedCount = 0, failedCount = 0;

  onProgress?.(makeProgress('files', 0, 1));
  const filesResult = await syncFiles(userId, participantId, onProgress);
  syncedCount += filesResult.synced;
  failedCount += filesResult.failed;

  onProgress?.(makeProgress('forms', 0, 1));
  const formsResult = await syncFormEdits(userId, participantId, onProgress, skipOptions?.skipFormIds);
  syncedCount += formsResult.synced;
  failedCount += formsResult.failed;

  onProgress?.(makeProgress('tasks', 0, 1));
  const tasksResult = await syncTaskEdits(userId, participantId, onProgress, skipOptions?.skipTaskIds, skipOptions?.skipProjectIds);
  syncedCount += tasksResult.synced;
  failedCount += tasksResult.failed;

  onProgress?.(makeProgress('idp', 0, 1));
  const idpResult = await syncInterventionPlanSubmissions(userId, participantId, onProgress);
  syncedCount += idpResult.synced;
  failedCount += idpResult.failed;

  // Record failures for retry; update per-participant lastSyncedAt on success
  if (failedCount > 0) {
    const existing = await offlineStorage.read<string[]>(OFFLINE_KEYS.SYNC_FAILED(userId)) ?? [];
    if (!existing.includes(participantId)) {
      await offlineStorage.create(OFFLINE_KEYS.SYNC_FAILED(userId), [...existing, participantId]);
    }
  } else {
    const existing = await offlineStorage.read<string[]>(OFFLINE_KEYS.SYNC_FAILED(userId)) ?? [];
    await offlineStorage.create(
      OFFLINE_KEYS.SYNC_FAILED(userId),
      existing.filter((id: string) => id !== participantId),
    );

    // Auto-cleanup: when all records synced (no failures, no remaining edits)
    // remove the participant's offline data so they don't appear as offline anymore.
    const remainingKeys = await offlineStorage.getParticipantKeys(userId, participantId).catch(() => [] as string[]);
    const hasPendingEdits = remainingKeys.some((k: string) =>
      (k.endsWith(':edits') && k.includes(':form:')) ||
      k.includes(':projectEdits:') ||
      k.endsWith(':filesPending'),
    );
    if (!hasPendingEdits) {
      await deleteParticipantOfflineData(userId, [participantId]).catch(() => {});
    } else {
      // Some items were skipped — record last-synced timestamp for the items that did sync.
      await offlineStorage.create(
        PARTICIPANT_KEYS.lastSyncedAt(userId, participantId),
        Date.now(),
      ).catch(() => {});
    }
  }

  await offlineStorage.create(OFFLINE_KEYS.SYNC_LAST(userId), Date.now()).catch(() => {});
  onProgress?.(makeProgress('done', 1, 1));

  return {
    success: failedCount === 0,
    syncedCount,
    failedCount,
    errors,
  };
};

/**
 * Sync all offline participants for the given user sequentially.
 *
 * Runs the full validation flow for each participant before syncing, using a
 * shared cache so participant / project / observation data is fetched at most
 * once across the entire session.  Items that are blocked by validation or have
 * unresolved timestamp conflicts are automatically skipped — conflicts are not
 * shown interactively here because this function is called without UI context.
 * For interactive conflict resolution use `startSync` via `SyncOverviewModal`.
 */
export const startSyncAll = async (
  userId: string,
  onProgress?: ProgressCallback,
): Promise<SyncResult> => {
  const ids = await getOfflineParticipantIds(userId);
  if (ids.length === 0) {
    return { success: true, syncedCount: 0, failedCount: 0, errors: [] };
  }

  let syncedCount = 0, failedCount = 0;
  const errors: string[] = [];

  // Shared cache: avoids duplicate API calls when multiple participants share the same project.
  const validationCache = createSyncValidationCache();

  for (const id of ids) {
    let skipOptions: SyncSkipOptions | undefined;
    try {
      const plan = await runValidationForParticipant(id, userId, validationCache);
      if (plan.participantBlocked) {
        logger.info(`startSyncAll: skipping "${id}" — participant blocked by validation`);
        continue;
      }
      skipOptions = buildSkipSets(plan);
    } catch (err) {
      logger.warn(`startSyncAll: validation failed for "${id}" — proceeding without skip filter`, err);
    }

    const result = await startSync(id, userId, onProgress, skipOptions);
    syncedCount += result.syncedCount;
    failedCount += result.failedCount;
    errors.push(...result.errors);
  }

  return { success: failedCount === 0, syncedCount, failedCount, errors };
};
