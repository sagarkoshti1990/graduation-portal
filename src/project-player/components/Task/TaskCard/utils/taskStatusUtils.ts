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
}): { iconName: string; checkColor: string } {
  const {
    isOnboardingTask, isChildOfProject, isCompleted,
    isOptional, isPreview, isAddedToPlan, isRejected,
  } = params;

  if (isOnboardingTask) {
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

/** Derives the file-upload constraints from task metadata + onboarding context. */
export function getUploadConfig(task: Task, isOnboardingTask: boolean) {
  let maxFiles: number | undefined;
  let allowedFileTypes: string[] | undefined;

  if (isOnboardingTask) {
    const slaConsentTasks = [
      process.env.UPLOAD_CONSENT_TASK_ID,
      process.env.UPLOAD_SLA_TASK_ID,
    ];
    if (slaConsentTasks.includes(task?.referenceId)) {
      maxFiles = 1;
      allowedFileTypes = ['pdf'];
    }
  }

  return {
    maxFiles: task?.metaInformation?.maxFiles || maxFiles,
    allowedFileTypes:
      (task?.metaInformation?.allowedFileTypes as string[] | undefined) || allowedFileTypes,
  };
}
