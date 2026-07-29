import type { Task } from '../../../../types/project.types';
import { getComparableFileKey } from '../../FileEvidence/FileUploadModal';

/**
 * Filters the new files selected by the user, removing any that already
 * have a matching URL in the existing attachments list.
 */
export function filterNewFiles(
  selectedFiles: any[],
  existingAttachments: Task['attachments'],
): { newFiles: any[]; existingToSend: any[] } {
  const files = selectedFiles ?? [];
  const existing = existingAttachments ?? [];

  const newFiles = files.filter(
    file => !existing.some(item => getComparableFileKey(file) === getComparableFileKey(item)),
  );

  const existingToSend = existing.filter(item =>
    files.some(file => getComparableFileKey(file) === getComparableFileKey(item)),
  );

  return { newFiles, existingToSend };
}

/**
 * Normalises onboarding task update payloads for SLA / consent file uploads.
 * Returns undefined when the task is not an SLA/consent task.
 */
export function buildOnboardingFileUpdate(
  task: Task,
  attachedFiles: any[],
  uploadedAt: string,
): Record<string, any> | undefined {
  const slaConsentTasks = [
    process.env.UPLOAD_CONSENT_TASK_ID,
    process.env.UPLOAD_SLA_TASK_ID,
  ];

  if (!slaConsentTasks.includes(task?.referenceId)) return undefined;

  if (task?.referenceId === process.env.UPLOAD_CONSENT_TASK_ID) {
    return { consentFiles: attachedFiles, consentUpdloadedAt: uploadedAt };
  }
  if (task?.referenceId === process.env.UPLOAD_SLA_TASK_ID) {
    return { slaFiles: attachedFiles, slaUpdloadedAt: uploadedAt };
  }

  return undefined;
}
