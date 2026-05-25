import { useCallback } from 'react';
import { useProjectContext } from '../context/ProjectContext';
import { Attachment, TaskStatus } from '../types/project.types';
import { uploadFiles } from '../services/projectPlayerService';
import dataService from '../../../src/services/dataService';
import offlineStorage from '../../../src/services/offlineStorage';
import { PARTICIPANT_KEYS } from '../../../src/constants/STORAGE_KEYS';
import type { PendingFile } from '../../../src/types/offline';
import { NormalizedFile } from '../types';

/** Converts a browser File to a base64 data-URL for persistent offline storage. */
export async function fileToBase64(file: NormalizedFile): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // WEB FILE
      if (typeof File !== "undefined" && file instanceof File) {
        const reader = new FileReader();

        reader.onload = () => {
          resolve(reader.result as string);
        };

        reader.onerror = (error) => {
          reject(error);
        };

        reader.readAsDataURL(file);
        return;
      }

      // ALREADY BASE64
      if (file?.base64) {
        resolve(file.base64);
        return;
      }

      reject(new Error("Unsupported file type"));
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

export const useTaskActions = () => {
  const { updateTask, mode, setTaskAddedToPlan, setTaskPlanActionPerformed, projectData } =
    useProjectContext();

  const canEdit = mode === 'edit';
  // externalId is the participant ID stored in the project
  const participantId = (projectData as any)?.entityInformation?.externalId as string | undefined;

  const handleStatusChange = useCallback(
    async (taskId: string, status: TaskStatus, files1: NormalizedFile[] = [], excludedFiles: Attachment[] = []) => {
      if (!canEdit || !participantId) return;

      const files = normalizeFiles(files1);
      const isOffline = dataService.isNetworkOffline();
      let attachments: Attachment[] = [...excludedFiles];

      if (files.length > 0) {
        if (isOffline) {
          // Store file content as base64 and queue a structured PendingFile entry so
          // syncService can upload the real bytes and patch the server URL after sync.
          if (participantId) {
            try {
              const existing = await offlineStorage.read<PendingFile[]>(
                PARTICIPANT_KEYS.filesPending(participantId),
              ) ?? [];
              const existingNames = new Set(existing.map(p => p.fileName));

              const newEntries: PendingFile[] = [];

              for (const file of files) {
                if (existingNames.has(file.name)) continue;
                // Unique key: timestamp + original name avoids collisions on re-upload
                const storageKey = PARTICIPANT_KEYS.fileBlob(
                  participantId,
                  `${Date.now()}_${file.name}`,
                );
                // Persist content for deferred upload
                try {
                  const base64 = await fileToBase64(file);
                  await offlineStorage.create(storageKey, base64);
                } catch { /* non-fatal: sync will skip if blob is missing */ }

                newEntries.push({
                  taskId,
                  fileName: file.name,       // original name preserved
                  fileType: file.type ?? '',
                  storageKey,                // timestamped blob key
                });
              }

              if (newEntries.length > 0) {
                await offlineStorage.create(
                  PARTICIPANT_KEYS.filesPending(participantId),
                  [...existing, ...newEntries],
                );
              }
            } catch { /* non-fatal */ }
          }
          // Local stubs — url is empty until sync uploads the real file
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
          }
        }
      }

      try {
        const updateData: any = { status };
        if(!isOffline && files.length > 0) {
          const data = await uploadFiles(taskId, files);
          if(data.data.length > 0) {
            updateData.attachments = [...attachments,...data.data];
            await updateTask(taskId,participantId, updateData);
            return { success: true, data: updateData };
          } else {
            return { success: false, data: undefined };
          }
        } else {
          updateData.attachments = attachments;
          await updateTask(taskId,participantId, updateData);
          return { success: true, data: updateData };
        }
      } catch {
        return { success: false, data: undefined };
      }
    },
    [canEdit, updateTask, participantId],
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
      setTaskPlanActionPerformed(taskId);
    },
    [setTaskAddedToPlan, setTaskPlanActionPerformed],
  );

  return {
    canEdit,
    handleStatusChange,
    handleFileUpload,
    handleOpenForm,
    handleAddToPlan,
  };
};
