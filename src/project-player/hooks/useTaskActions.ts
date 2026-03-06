import { useCallback } from 'react';
import { useProjectContext } from '../context/ProjectContext';
import { Attachment, TaskStatus } from '../types/project.types';
import { uploadFiles } from '../services/projectPlayerService';
import logger from '@utils/logger';

export const useTaskActions = () => {
  const { updateTask, mode, setTaskAddedToPlan, setTaskPlanActionPerformed } =
    useProjectContext();

  const canEdit = mode === 'edit';

  const handleStatusChange = useCallback(
    async (taskId: string, status: TaskStatus, files: File[] = []) => {
      if (!canEdit) return;
      let attachments: Attachment[] = [];
      if(files.length > 0) {
        const data = await uploadFiles(taskId, files);
        if(data.data.length > 0) {
          attachments = data.data;
        }
      }
      // Always update if we have a status change, regardless of files
      const updateData: any = { status };
      if (attachments.length > 0) {
        updateData.attachments = attachments;
      }

      const response = await updateTask(taskId, updateData);
      return {success: true, data: response};
    },
    [canEdit, updateTask],
  );

  const handleFileUpload = useCallback(
    (taskId: string, files: File[]) => {
      if (!canEdit) return;
      // TODO: Implement file upload logic
      logger.log('Upload files:', taskId, files);
    },
    [canEdit],
  );

  const handleOpenForm = useCallback(
    (taskId: string) => {
      if (!canEdit) return;
      // TODO: Implement form opening logic
      logger.log('Open form:', taskId);
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
    handleAddToPlan
  };
};
