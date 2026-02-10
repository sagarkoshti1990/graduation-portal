import { useCallback } from 'react';
import { useProjectContext } from '../context/ProjectContext';
import { Attachment, TaskStatus } from '../types/project.types';
import { uploadFiles } from '../services/projectPlayerService';

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
      if(attachments.length < 0) {
        return updateTask(taskId, { status, attachments });
      } else {
        return {
          success: false,
          message: "No attachments uploaded",
        };
      }
    },
    [canEdit, updateTask],
  );

  const handleFileUpload = useCallback(
    (taskId: string, files: File[]) => {
      if (!canEdit) return;
      // TODO: Implement file upload logic
      console.log('Upload files:', taskId, files);
    },
    [canEdit],
  );

  const handleOpenForm = useCallback(
    (taskId: string) => {
      if (!canEdit) return;
      // TODO: Implement form opening logic
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
    handleAddToPlan
  };
};
