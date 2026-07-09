import { Task } from '../types/project.types';
import { TASK_STATUS, TASK_TYPE } from '../../constants/app.constant';
import offlineStorage from '../../services/offlineStorage';
import { PARTICIPANT_KEYS } from '../../constants/STORAGE_KEYS';

/**
 * Online, the server mirrors a completed observation-form submission onto
 * task.metaInformation.formCompleted (see canCompleteTask in taskUtils.ts).
 * Offline, submitting the form only writes PARTICIPANT_KEYS.formEdits — it
 * never touches task.status/projectEdits — so that must be checked directly.
 */
async function isObservationTaskComplete(
  task: Task,
  userId: string,
  participantId: string,
): Promise<boolean> {
  if (task.metaInformation?.formCompleted === true) return true;

  const solutionId =
    task.solutionDetails?._id ??
    task.solutionDetails?.observationId ??
    task.solutionDetails?.id;
  if (!solutionId) return false;

  const edits = await offlineStorage
    .read<{ isSubmitted?: boolean }>(PARTICIPANT_KEYS.formEdits(userId, participantId, solutionId))
    .catch(() => null);
  return edits?.isSubmitted === true;
}

/**
 * Recursively checks that every onboarding task (and nested children) is
 * complete, the same way taskCompletionUtils.areAllTasksCompleted does for
 * the Enroll button — but also treats an offline-submitted observation form
 * as complete, since dataService.getProject()'s projectEdits merge does not
 * cover observation-task completion (see file header comment above).
 */
export async function isOnboardingComplete(
  tasks: Task[] | undefined,
  userId: string,
  participantId: string,
): Promise<boolean> {
  if (!tasks || tasks.length === 0) return false;

  for (const task of tasks) {
    const selfComplete =
      task.type === TASK_TYPE.OBSERVATION
        ? await isObservationTaskComplete(task, userId, participantId)
        : task.status === TASK_STATUS.COMPLETED;

    const childrenComplete = task.children?.length
      ? await isOnboardingComplete(task.children, userId, participantId)
      : true;

    if (!selfComplete || !childrenComplete) return false;
  }

  return true;
}
