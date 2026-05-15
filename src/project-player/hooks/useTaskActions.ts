import { useCallback } from 'react';
import { useProjectContext } from '../context/ProjectContext';
import { Attachment, TaskStatus } from '../types/project.types';
import { uploadFiles } from '../services/projectPlayerService';
import dataService from '../../../src/services/dataService';
import offlineStorage from '../../../src/services/offlineStorage';
import { PARTICIPANT_KEYS } from '../../../src/constants/STORAGE_KEYS';

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
          // Queue file names for later upload; build local attachment stubs so the
          // task card can display the pending files without a real URL yet.
          if (participantId) {
            try {
              const existing = await offlineStorage.read<string[]>(
                PARTICIPANT_KEYS.filesPending(participantId),
              ) ?? [];
              const toAdd = files.map(f => f.name).filter(n => !existing.includes(n));
              if (toAdd.length > 0) {
                await offlineStorage.create(
                  PARTICIPANT_KEYS.filesPending(participantId),
                  [...existing, ...toAdd],
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

      if (isOffline && participantId) {
        // Save locally; sync later
        await dataService.saveTaskEdit(participantId, { _id: taskId, ...updateData });
        return { success: true, data: updateData };
      }

      try {
        await updateTask(taskId, updateData);
        return { success: true, data: updateData };
      } catch (err) {
        // API failed — persist locally so the change isn't lost
        if (participantId) {
          await dataService.saveTaskEdit(participantId, { _id: taskId, ...updateData }).catch(() => {});
        }
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
