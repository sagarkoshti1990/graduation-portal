import type { Task } from '../../../../types/project.types';

/**
 * Filters the new files selected by the user, removing any that already
 * have a matching URL in the existing attachments list.
 */
export function filterNewFiles(
  selectedFiles: any[],
  existingAttachments: Task['attachments'],
) {
  const newFiles: any[] = [];
  const existingFiles: any[] = [];
  if (!selectedFiles?.length) return { newFiles, existingFiles };
  selectedFiles.forEach(file => {
    if (
      existingAttachments?.find(
        existing => file?.url && existing?.url && file.url === existing.url,
      )
    ) {
      newFiles.push(file);
    } else {
      existingFiles.push(file);
    }
  });

  return { newFiles, existingFiles };
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
