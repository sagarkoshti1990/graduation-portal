import { useState, useMemo, useCallback } from 'react';
import { TASK_TYPE } from '../../../../../constants/app.constant';
import { useProjectStable, useProjectData } from '../../../../context/ProjectContext';
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
  setIsAddedToPlan: (v: boolean) => void;
  isRejected: boolean;
  setIsRejected: (v: boolean) => void;
  isSyncTaskId?: boolean
}

/**
 * Subscribes to stable context for callbacks and data context for plan state.
 * Does NOT re-render when projectData changes (task status updates) — only
 * re-renders when addedToPlanTaskIds changes (plan actions, which are rare).
 */
export function useTaskStatus(task: Task, isOnboardingTask: boolean): TaskStatusResult {
  // Stable: setTaskAddedToPlan never changes reference.
  const { setTaskAddedToPlan } = useProjectStable();
  // Data: only re-renders when plan state changes, not on task status changes.
  const { addedToPlanTaskIds } = useProjectData();

  const isAddedToPlan = useMemo(
    () => addedToPlanTaskIds.includes(task?._id ?? ''),
    [addedToPlanTaskIds, task?._id],
  );
  const setIsAddedToPlan = useCallback(
    (v: boolean) => setTaskAddedToPlan(task._id, v),
    [setTaskAddedToPlan, task._id],
  );
  const [isRejected, setIsRejected] = useState(false);

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
    () => task?.metaInformation?.syncTaskIds?.length,
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
    setIsAddedToPlan,
    isRejected,
    setIsRejected,
    isSyncTaskId
  };
}
