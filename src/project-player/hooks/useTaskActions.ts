import { useCallback } from 'react';
import { useProjectContext } from '../context/ProjectContext';
import { Attachment, TaskStatus } from '../types/project.types';
import { uploadFiles } from '../services/projectPlayerService';
import dataService from '../../../src/services/dataService';

export const useTaskActions = () => {
  const { updateTask, mode, setTaskAddedToPlan, setTaskPlanActionPerformed, projectData } =
    useProjectContext();

  const canEdit = mode === 'edit';
  // externalId is the participant ID stored in the project
  const participantId = (projectData as any)?.entityInformation?.externalId as string | undefined;

  const handleStatusChange = useCallback(
    async (taskId: string, status: TaskStatus, files: File[] = [], excludedFiles: Attachment[] = []) => {
      if (!canEdit) return;
      let attachments: Attachment[] = excludedFiles;
      if (files.length > 0) {
        const uploaded = await uploadFiles(taskId, files);
        if (uploaded.data.length > 0) {
          attachments = [...attachments, ...uploaded.data];
        }
      }
      const updateData: any = { status };
      if (attachments.length > 0) {
        updateData.attachments = attachments;
      }

      const isOffline = dataService.isNetworkOffline();

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
