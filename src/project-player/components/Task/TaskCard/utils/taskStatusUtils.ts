import { TASK_STATUS, TASK_TYPE } from '../../../../../constants/app.constant';
import type { Task } from '../../../../types/project.types';

/** Returns true when the task status is COMPLETED. */
export function isTaskDone(status?: string): boolean {
  return status === TASK_STATUS.COMPLETED;
}

/**
 * Resolves the icon name and color for the status circle/icon
 * when the task is NOT using a checkbox (pillar tasks in preview/onboarding).
 */
export function getStatusIconConfig(params: {
  isOnboardingTask: boolean;
  isChildOfProject: boolean;
  isCompleted: boolean;
  isOptional: boolean;
  isPreview: boolean;
  isAddedToPlan: boolean;
  isRejected: boolean;
  isReadOnly: boolean;
}): { iconName: string; checkColor: string } {
  const {
    isOnboardingTask, isChildOfProject, isCompleted,
    isOptional, isPreview, isAddedToPlan, isRejected,isReadOnly
  } = params;

  if (isOnboardingTask || isReadOnly) {
    return {
      checkColor: isCompleted ? '$success500' : '$textMuted',
      iconName: isCompleted ? 'CheckCircle' : 'Circle',
    };
  }

  if (isChildOfProject) {
    if (isOptional) {
      if (isPreview) {
        if (isAddedToPlan) return { checkColor: '$success500', iconName: 'CheckCircle' };
        if (isRejected)   return { checkColor: '$error500',   iconName: 'X' };
        return { checkColor: '$warning500', iconName: 'Circle' };
      }
      if (isAddedToPlan) return { checkColor: '$success500', iconName: 'CheckCircle' };
      return { checkColor: '$textMuted', iconName: 'CheckCircle' };
    }
    return { checkColor: '$success500', iconName: 'CheckCircle' };
  }

  return {
    checkColor: isCompleted ? '$success500' : '$textMuted',
    iconName: isCompleted ? 'CheckCircle' : 'Circle',
  };
}

/** Derives the icon name for the primary action button from task metadata. */
export function getActionIconName(task: Task): string {
  if (task.metaInformation?.icon === 'Edit2') return 'Pencil';
  if (task.metaInformation?.icon) return task.metaInformation.icon as string;
  if (task.type === TASK_TYPE.OBSERVATION) return 'Pencil';
  return 'Upload';
}

const SLA_CONSENT_TASK_IDS = new Set<string | undefined>([
  process.env.UPLOAD_CONSENT_TASK_ID,
  process.env.UPLOAD_SLA_TASK_ID,
]);

/** Derives the file-upload constraints from task metadata + onboarding context. */
export function getUploadConfig(task: Task, isOnboardingTask: boolean) {
  let maxFiles: number | undefined;
  let allowedFileTypes: string[] | undefined;

  if (isOnboardingTask) {
    maxFiles = 1;
    if (SLA_CONSENT_TASK_IDS.has(task?.referenceId)) {
      allowedFileTypes = ['pdf'];
    }
  } else {
    maxFiles = task?.metaInformation?.maxFiles;
  }

  return {
    maxFiles,
    allowedFileTypes:
      (task?.metaInformation?.allowedFileTypes as string[] | undefined) || allowedFileTypes,
  };
}