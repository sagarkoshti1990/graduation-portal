import { useMemo } from 'react';
import { TASK_TYPE } from '../../../../../constants/app.constant';
import { useTaskAddedToPlan } from '../../../../context/ProjectContext';
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
 * Subscribes to this task's plan state only (fine-grained external store).
 * Does NOT re-render when projectData changes (task status updates), nor
 * when some OTHER task's plan state changes — only when THIS task's added-
 * to-plan flag changes.
 */
export function useTaskStatus(task: Task, isOnboardingTask: boolean): TaskStatusResult {
  const taskId = task?._id ?? '';
  const planState = useTaskAddedToPlan(taskId);

  const isAddedToPlan = planState === true;
  const isRejected = planState === false;

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
