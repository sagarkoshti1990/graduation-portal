import { TASK_STATUS } from '../../../../constants/app.constant';

/**
 * Calculate UI configuration for task card rendering
 */
export const getTaskCardUIConfig = (
  isChildOfProject: boolean,
  isPreview: boolean,
  isEdit: boolean,
  isUploading: boolean,
  // taskType: Task['type'],
) => ({
  showAsCard: isChildOfProject && !isPreview,
  showAsInline: !isChildOfProject || isPreview,
  showCheckbox: isChildOfProject && !isPreview,
  showActionButton: isEdit,
  isInteractive: isEdit && !isUploading,
});

/**
 * Validate file size
 */
export const validateFileSize = (
  files: FileList | null,
  maxSizeMB: number,
): { isValid: boolean; invalidFiles: File[] } => {
  if (!files || files.length === 0) {
    return { isValid: false, invalidFiles: [] };
  }

  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  const invalidFiles = Array.from(files).filter(
    file => file.size > maxSizeBytes,
  );

  return {
    isValid: invalidFiles.length === 0,
    invalidFiles,
  };
};

/**
 * Get status circle color based on task state
 */
export const getStatusCircleColor = (
  isChildOfProject: boolean,
  isCompleted: boolean,
): string => {
  if (isChildOfProject) return '$primary500';
  if (isCompleted) return '$accent200';
  return '$textMuted';
};

/**
 * Get text style for completed tasks
 */
const COMPLETED_TEXT_STYLE = Object.freeze({
  textDecorationLine: 'none' as const,
  opacity: 0.6,
});
const ACTIVE_TEXT_STYLE = Object.freeze({
  textDecorationLine: 'none' as const,
  opacity: 1,
});

export const getCompletedTaskTextStyle = (isCompleted: boolean) =>
  isCompleted ? COMPLETED_TEXT_STYLE : ACTIVE_TEXT_STYLE;

/**
 * Check if task is completed
 */
export const isTaskCompleted = (status?: string): boolean =>
  status === TASK_STATUS.COMPLETED;
