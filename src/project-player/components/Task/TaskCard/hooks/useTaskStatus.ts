import { useMemo } from 'react';
import { TASK_TYPE } from '../../../../../constants/app.constant';
import { useProjectData } from '../../../../context/ProjectContext';
import { isTaskCompleted } from '../../shared/helpers';
import type { Task } from '../../../../types/project.types';

export interface TaskStatusResult {
  isCompleted: boolean;
  isObservationTask: boolean;
  hasUploadedFiles: boolean;
  isEvidenceRequired: boolean;
  isTaskDone: boolean;
  isOnboardingCompletedUI: boolean;
  isManualToggleDisabled: boolean;
  isAddedToPlan: boolean;
  isRejected: boolean;
  isSyncTaskId: boolean;
}

/**
 * Subscribes to data context for plan state only.
 * Does NOT re-render when projectData changes (task status updates) — only
 * re-renders when addedToPlanTasks changes (plan actions, which are rare).
 */
export function useTaskStatus(task: Task, isOnboardingTask: boolean): TaskStatusResult {
  // Data: only re-renders when plan state changes, not on task status changes.
  const { addedToPlanTasks } = useProjectData();

  const taskId = task?._id ?? '';

  const isAddedToPlan = useMemo(
    () => addedToPlanTasks[taskId] === true,
    [addedToPlanTasks, taskId],
  );

  const isRejected = useMemo(
    () => addedToPlanTasks[taskId] === false,
    [addedToPlanTasks, taskId],
  );

  const isCompleted = useMemo(() => isTaskCompleted(task?.status), [task?.status]);

  const isObservationTask = useMemo(
    () => task.type === TASK_TYPE.OBSERVATION,
    [task.type],
  );

  const hasUploadedFiles = useMemo(
    () => !!(task.attachments && task.attachments.length > 0),
    [task.attachments],
  );

  const isEvidenceRequired = useMemo(
    () =>
      !!(
        (task.noOfEvidenceRequired && task.noOfEvidenceRequired > 0) ||
        (task.metaInformation?.noOfEvidencesRequired &&
          task.metaInformation.noOfEvidencesRequired > 0)
      ),
    [task.noOfEvidenceRequired, task.metaInformation?.noOfEvidencesRequired],
  );

  const isTaskDone = useMemo(
    () => isCompleted || (isEvidenceRequired && hasUploadedFiles),
    [isCompleted, isEvidenceRequired, hasUploadedFiles],
  );

  const isOnboardingCompletedUI = useMemo(
    () => isOnboardingTask && (task.isDeletable ? hasUploadedFiles : isCompleted),
    [isOnboardingTask, task.isDeletable, hasUploadedFiles, isCompleted],
  );

  const isManualToggleDisabled = useMemo(
    () => isObservationTask || isEvidenceRequired,
    [isObservationTask, isEvidenceRequired],
  );

  const isSyncTaskId = useMemo(
    () => !!(task?.metaInformation?.syncTaskIds?.length),
    [task?.metaInformation?.syncTaskIds],
  );

  return {
    isCompleted,
    isObservationTask,
    hasUploadedFiles,
    isEvidenceRequired,
    isTaskDone,
    isOnboardingCompletedUI,
    isManualToggleDisabled,
    isAddedToPlan,
    isRejected,
    isSyncTaskId,
  };
}
