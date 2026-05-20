import { useCallback } from 'react';
import { useProjectContext } from '../context/ProjectContext';
import { Attachment, TaskStatus } from '../types/project.types';
import { uploadFiles } from '../services/projectPlayerService';
import dataService from '../../../src/services/dataService';
import offlineStorage from '../../../src/services/offlineStorage';
import { PARTICIPANT_KEYS } from '../../../src/constants/STORAGE_KEYS';
import type { PendingFile } from '../../../src/types/offline';

/** Converts a browser File to a base64 data-URL for persistent offline storage. */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const useTaskActions = () => {
  const { updateTask, mode, setTaskAddedToPlan, setTaskPlanActionPerformed, projectData } =
    useProjectContext();

  const canEdit = mode === 'edit';
  // externalId is the participant ID stored in the project
  const participantId = (projectData as any)?.entityInformation?.externalId as string | undefined;

  const handleStatusChange = useCallback(
    async (taskId: string, status: TaskStatus, files: File[] = [], excludedFiles: Attachment[] = []) => {
      if (!canEdit) return;

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

              for (const file of files) {
                if (existingNames.has(file.name)) continue;
                // Persist content for deferred upload
                try {
                  const base64 = await fileToBase64(file);
                  await offlineStorage.create(
                    PARTICIPANT_KEYS.fileBlob(participantId, file.name),
                    base64,
                  );
                } catch { /* non-fatal: sync will skip if blob is missing */ }
              }

              const newEntries: PendingFile[] = files
                .filter(f => !existingNames.has(f.name))
                .map(f => ({ taskId, fileName: f.name, fileType: f.type ?? '' }));

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

      const updateData: any = { status };
      if (attachments.length > 0) {
        updateData.attachments = attachments;
      }

      try {
        await updateTask(taskId,participantId, updateData);
        return { success: true, data: updateData };
      } catch (err) {
        // API failed — persist locally so the change isn't lost
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
