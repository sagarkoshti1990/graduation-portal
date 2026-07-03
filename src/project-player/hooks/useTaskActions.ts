import { useCallback } from 'react';
import { Platform } from 'react-native';
import { useProjectStable } from '../context/ProjectContext';
import { Attachment, TaskStatus } from '../types/project.types';
import { uploadFiles } from '../services/projectPlayerService';
import dataService from '../../../src/services/dataService';
import offlineStorage from '../../../src/services/offlineStorage';
import { PARTICIPANT_KEYS } from '../../../src/constants/STORAGE_KEYS';
import type { PendingFile } from '../../../src/types/offline';
import { NormalizedFile } from '../types';
import { useAuth } from '../../../src/contexts/AuthContext';

/**
 * Converts a NormalizedFile to a base64 data-URL string suitable for offline storage.
 *
 * Resolution order (first match wins):
 *  1. NormalizedFile.base64 already set (e.g. camera image with includeBase64:true,
 *     copied from source by normalizeFiles).
 *  2. Browser File object → FileReader.readAsDataURL (web only).
 *  3. originalFile.base64 raw string → add data: prefix if missing (camera fallback).
 *  4. data: URI in file.uri (rare edge case).
 *  5. Native file:// or content:// URI → react-native-blob-util readFile('base64')
 *     (gallery images, document picker on both iOS and Android).
 */
export async function fileToBase64(file: NormalizedFile): Promise<string> {
  // 1. Already have a base64 data URL (fastest path — set by normalizeFiles)
  if (file?.base64) {
    return file.base64;
  }

  // 2. Web: browser File object → FileReader
  const webFile = file?.file;
  if (typeof File !== 'undefined' && webFile instanceof File) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(webFile);
    });
  }

  // 3. Camera image: originalFile carries the raw base64 from react-native-image-picker
  //    (asset.base64 is a raw string — no data: prefix). Add the prefix here.
  const rawB64 = file?.originalFile?.base64;
  if (rawB64) {
    if (rawB64.startsWith('data:')) return rawB64;
    const mime = file?.type || file?.originalFile?.type || 'application/octet-stream';
    return `data:${mime};base64,${rawB64}`;
  }

  // 4. URI that is already a data URL
  if (file?.uri?.startsWith('data:')) {
    return file.uri;
  }

  // 5. Native file:// or content:// URI (gallery, document picker).
  //    react-native-blob-util handles both URI schemes on iOS and Android.
  const nativeUri = file?.uri || file?.originalFile?.uri;
  if (nativeUri && Platform.OS !== 'web') {
    // Dynamic require keeps react-native-blob-util out of the web bundle.
    const RNBlobUtil = require('react-native-blob-util').default;
    try {
      const b64: string = await RNBlobUtil.fs.readFile(nativeUri, 'base64');
      const mime = file?.type || file?.originalFile?.type || 'application/octet-stream';
      return `data:${mime};base64,${b64}`;
    } catch (err: any) {
      throw new Error(`fileToBase64: failed to read "${nativeUri}" — ${err?.message ?? err}`);
    }
  }

  throw new Error(
    `fileToBase64: no readable source for file "${file?.name ?? '(unknown)'}". ` +
    `Checked: base64, File object, originalFile.base64, data: URI, native URI.`
  );
}

/**
 * Maps raw file objects from any picker (camera, gallery, document picker, web)
 * into the uniform NormalizedFile shape used throughout the upload pipeline.
 *
 * base64 is copied from the source when already available (camera with includeBase64:true)
 * so fileToBase64 can short-circuit without re-reading from disk.
 */
export const normalizeFiles = (files: any[] = []): NormalizedFile[] => {
  return files.map((file) => ({
    name: file?.name || file?.fileName || '',
    size: file?.size || file?.fileSize || 0,
    type: file?.type || '',
    uri: file?.uri || file?.path || '',
    file: file instanceof File ? file : undefined,
    originalFile: file,
    // Preserve pre-built base64 so the offline path avoids a redundant disk read.
    // Camera images include this when launchCamera/launchImageLibrary is called with
    // includeBase64:true; gallery and document picker files will not have it.
    base64: file?.base64 ?? undefined,
  }));
};

/**
 * Returns a unique file name by appending a timestamp before the extension.
 * e.g. "invoice.pdf" → "invoice_1751023456789.pdf"
 */
function generateUniqueFileName(originalName: string): string {
  const lastDot = originalName.lastIndexOf('.');
  if (lastDot === -1) return `${originalName}_${Date.now()}`;
  const base = originalName.slice(0, lastDot);
  const ext = originalName.slice(lastDot);
  return `${base}_${Date.now()}${ext}`;
}

/**
 * Uses useProjectStable() so this hook (and every component that calls it)
 * never re-renders purely because projectData changed.
 *
 * participantId is read from projectDataRef.current inside callbacks —
 * it is only needed at action time, not during render, so reading from a ref
 * is safe and avoids stale-closure issues.
 */
export const useTaskActions = () => {
  const {
    updateTask,
    mode,
    setTaskAddedToPlan,
    projectDataRef,
  } = useProjectStable();
  const { user } = useAuth();
  const userId = user?.id ?? '';

  const canEdit = mode === 'edit';

  const handleStatusChange = useCallback(
    async (
      {taskId, referenceId, isOnboardingTask}: {
        taskId: string;
        parentIndex?: number;
        index?: number;
        referenceId?: string;
        isOnboardingTask?: boolean;
      },
      status: TaskStatus,
      files1?: NormalizedFile[],
      excludedFiles?: Attachment[],
    ) => {
      // Read participantId at call time from the ref (stable, no subscription).
      const participantId = (projectDataRef.current as any)?.entityInformation?.externalId as string | undefined;
      if (!canEdit || !participantId) return;

      const isFileAction = files1 !== undefined || excludedFiles !== undefined;
      // Assign each file a unique generated name while preserving the original
      // for display. `file.name` is used for upload/storage; `file.originalName`
      // is shown in the UI and stored alongside the attachment.
      const files = normalizeFiles(files1).map(f => ({
        ...f,
        originalName: f.name,
        name: generateUniqueFileName(f.name),
      }));
      const isOffline = dataService.isNetworkOffline();
      let attachments: Attachment[] = excludedFiles ? [...excludedFiles] : [];

      if (files.length > 0) {
        if (isOffline) {
          if (participantId) {
            try {
              const existing = await offlineStorage.read<PendingFile[]>(
                PARTICIPANT_KEYS.filesPending(userId, participantId),
              ) ?? [];
              // Dedup by (taskId + originalName) so the same file can be queued
              // for different tasks independently, but a re-submission of the
              // same file to the same task while it is still pending is skipped.
              // Fall back to fileName for legacy entries without originalName.
              const existingTaskFileKeys = new Set(
                existing.map(p => `${p.taskId}:${p.originalName ?? p.fileName}`),
              );

              const newEntries: PendingFile[] = [];
              for (const file of files) {
                if (existingTaskFileKeys.has(`${taskId}:${file.originalName}`)) continue;
                // Use the unique fileName as the blob storage key to avoid
                // collisions when the same original name is uploaded again later.
                const storageKey = PARTICIPANT_KEYS.fileBlob(
                  userId,
                  participantId,
                  file.name,
                );
                try {
                  const base64 = await fileToBase64(file);
                  await offlineStorage.create(storageKey, base64);
                } catch (e: any) { console.log("error", e.message) }

                newEntries.push({
                  taskId,
                  originalName: file.originalName!,
                  fileName: file.name,
                  fileType: file.type ?? '',
                  storageKey,
                  isOnboardingTask: isOnboardingTask ?? false,
                  taskReferenceId: referenceId,
                });
              }

              if (newEntries.length > 0) {
                await offlineStorage.create(
                  PARTICIPANT_KEYS.filesPending(userId, participantId),
                  [...existing, ...newEntries],
                );
              }
            } catch { /* non-fatal */ }
          }
          const localStubs: Attachment[] = files.map(f => ({
            name: f.originalName,      // original name for display
            originalName: f.originalName,
            fileName: f.name,          // unique name for sync matching
            type: f.type,
            size: f.size,
            url: '',
            sourcePath: '',
          } as unknown as Attachment));
          attachments = [...attachments, ...localStubs];
        } else {
          const uploaded = await uploadFiles(taskId, files);
          if (uploaded.data?.length > 0) {
            attachments = [...attachments, ...uploaded.data];
          } else {
            return { success: false, data: undefined };
          }
        }
      }

      try {
        const updateData: any = { status };

        if (isFileAction) {
          updateData.attachments = attachments;
        }

        await updateTask(taskId, participantId, updateData);
        return { success: true, data: updateData };
      } catch {
        return { success: false, data: undefined };
      }
    },
    [canEdit, updateTask, projectDataRef],
  );

  const handleFileUpload = useCallback(
    (taskId: string, files: File[]) => {
      if (!canEdit) return;
      console.log('Upload files:', taskId, files);
    },
    [canEdit],
  );

  const handleOpenForm = useCallback(
    (taskId: string) => {
      if (!canEdit) return;
      console.log('Open form:', taskId);
    },
    [canEdit],
  );

  const handleAddToPlan = useCallback(
    (taskId: string, added: boolean) => {
      setTaskAddedToPlan(taskId, added);
    },
    [setTaskAddedToPlan],
  );

  return {
    canEdit,
    handleStatusChange,
    handleFileUpload,
    handleOpenForm,
    handleAddToPlan,
  };
};
