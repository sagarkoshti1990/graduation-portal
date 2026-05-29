import { useState, useMemo, useEffect } from 'react';
import { TASK_TYPE } from '../../../../../constants/app.constant';
import { useProjectContext } from '../../../../context/ProjectContext';
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
}

export function useTaskStatus(task: Task, isOnboardingTask: boolean): TaskStatusResult {
  const { addedToPlanTaskIds } = useProjectContext();

  const [isAddedToPlan, setIsAddedToPlan] = useState(Boolean(!task?.isDeletable));
  const [isRejected, setIsRejected] = useState(false);

  useEffect(() => {
    setIsAddedToPlan(addedToPlanTaskIds.includes(task?._id));
  }, [addedToPlanTaskIds, task?._id]);

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
  };
}
