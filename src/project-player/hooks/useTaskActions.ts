import { useCallback } from 'react';
import { useProjectStable } from '../context/ProjectContext';
import { Attachment, TaskStatus } from '../types/project.types';
import { uploadFiles } from '../services/projectPlayerService';
import dataService from '../../../src/services/dataService';
import offlineStorage from '../../../src/services/offlineStorage';
import { PARTICIPANT_KEYS } from '../../../src/constants/STORAGE_KEYS';
import type { PendingFile } from '../../../src/types/offline';
import { NormalizedFile } from '../types';
import { useAuth } from '../../../src/contexts/AuthContext';

export async function fileToBase64(
  file: NormalizedFile
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      if (file?.base64) {
        resolve(file.base64);
        return;
      }

      const webFile = file?.file || file;

      if (
        typeof File !== "undefined" &&
        webFile instanceof File
      ) {
        const reader = new FileReader();
        reader.onload = () => { resolve(reader.result as string); };
        reader.onerror = (error) => { reject(error); };
        reader.readAsDataURL(webFile);
        return;
      }

      if (file?.originalFile?.base64) {
        resolve(file.originalFile.base64);
        return;
      }

      if (file?.uri && file.uri.startsWith("data:")) {
        resolve(file.uri);
        return;
      }

      reject(new Error("Unsupported file type or base64 not available"));
    } catch (error) {
      reject(error);
    }
  });
}

export const normalizeFiles = (
  files: any[] = []
): NormalizedFile[] => {
  return files.map((file) => ({
    name: file?.name || file?.fileName || "",
    size: file?.size || file?.fileSize || 0,
    type: file?.type || "",
    uri: file?.uri || file?.path || "",
    file: file instanceof File ? file : undefined,
    originalFile: file,
  }));
};

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
      {taskId}: {taskId: string; parentIndex?: number; index?: number},
      status: TaskStatus,
      files1: NormalizedFile[] = [],
      excludedFiles: Attachment[] = [],
    ) => {
      // Read participantId at call time from the ref (stable, no subscription).
      const participantId = (projectDataRef.current as any)?.entityInformation?.externalId as string | undefined;
      if (!canEdit || !participantId) return;

      const files = normalizeFiles(files1);
      const isOffline = dataService.isNetworkOffline();
      let attachments: Attachment[] = [...excludedFiles];

      if (files.length > 0) {
        if (isOffline) {
          if (participantId) {
            try {
              const existing = await offlineStorage.read<PendingFile[]>(
                PARTICIPANT_KEYS.filesPending(userId, participantId),
              ) ?? [];
              const existingNames = new Set(existing.map(p => p.fileName));

              const newEntries: PendingFile[] = [];
              for (const file of files) {
                if (existingNames.has(file.name)) continue;
                const storageKey = PARTICIPANT_KEYS.fileBlob(
                  userId,
                  participantId,
                  `${Date.now()}_${file.name}`,
                );
                try {
                  const base64 = await fileToBase64(file);
                  await offlineStorage.create(storageKey, base64);
                } catch (e: any) { console.log("error", e.message) }

                newEntries.push({
                  taskId,
                  fileName: file.name,
                  fileType: file.type ?? '',
                  storageKey,
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
            name: f.name,
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
        const updateData: any = { status, attachments };
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
