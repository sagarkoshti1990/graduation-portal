/**
 * Centralized offline data cleanup utilities.
 *
 * All offline removal logic lives here so it is reused consistently across
 * services and components rather than duplicated in each call site.
 *
 * Three scopes are provided:
 *   - Participant-level  (everything belonging to one or more participants)
 *   - Project-level     (one project's data only)
 *   - Observation-level (one observation form only)
 *
 * Usage from a component:
 *   import { deleteParticipantOfflineData, deleteProjectOfflineData,
 *            deleteObservationOfflineData } from '../../services/offlineCleanupService';
 */

import logger from '@utils/logger';
import offlineStorage from './offlineStorage';
import { removeOfflineParticipantId } from './offlineStorage';
import { PARTICIPANT_KEYS } from '@constants/STORAGE_KEYS';

// ── Participant-level ─────────────────────────────────────────────────────────

/**
 * Remove ALL offline data belonging to the given participants.
 *
 * Removed data includes:
 *   - Participant profile / entity details
 *   - Download status and metadata
 *   - Cached projects and project edit queues
 *   - Observation form schemas, submissions, and edit queues
 *   - Pending file upload lists and stored file blobs
 *   - Solutions / keyword maps
 *   - lastSyncedAt timestamps
 *
 * The participant IDs are also removed from the offline participant registry
 * so the participant no longer appears in the offline list.
 *
 * Pass all affected IDs together so the registry update is a single write.
 */
export async function deleteParticipantOfflineData(
  userId: string,
  participantIds: string[],
): Promise<void> {
  await Promise.all(
    participantIds.map(async participantId => {
      try {
        const allKeys = await offlineStorage.getParticipantKeys(userId, participantId);
        if (allKeys.length) {
          await offlineStorage.removeMultiple(allKeys);
        }
        await removeOfflineParticipantId(userId, participantId);
      } catch (err) {
        logger.warn(
          `offlineCleanupService: failed to delete all data for participant "${participantId}"`,
          err,
        );
      }
    }),
  );
}

// ── Project-level ─────────────────────────────────────────────────────────────

/**
 * Remove offline data for a single project belonging to a participant.
 *
 * Removed data includes:
 *   - Cached project snapshot
 *   - Project task edit queue
 *
 * Does NOT remove the participant profile, other projects, or unrelated
 * observation forms.
 */
export async function deleteProjectOfflineData(
  userId: string,
  participantId: string,
  projectId: string,
): Promise<void> {
  try {
    await offlineStorage.removeMultiple([
      PARTICIPANT_KEYS.project(userId, participantId, projectId),
      PARTICIPANT_KEYS.projectEdits(userId, participantId, projectId),
    ]);
  } catch (err) {
    logger.warn(
      `offlineCleanupService: failed to delete project "${projectId}" data`,
      err,
    );
  }
}

// ── Observation-level ─────────────────────────────────────────────────────────

/**
 * Remove offline data for a single observation form.
 *
 * Removed data includes:
 *   - Form schema / submission snapshot
 *   - Pending form edit queue entry
 *
 * Does NOT remove the participant profile, projects, other forms, or any
 * unrelated data.
 */
export async function deleteObservationOfflineData(
  userId: string,
  participantId: string,
  formId: string,
): Promise<void> {
  try {
    await Promise.all([
      offlineStorage.remove(PARTICIPANT_KEYS.form(userId, participantId, formId)).catch(() => {}),
      offlineStorage.remove(PARTICIPANT_KEYS.formEdits(userId, participantId, formId)).catch(() => {}),
    ]);
  } catch (err) {
    logger.warn(
      `offlineCleanupService: failed to delete observation "${formId}" data`,
      err,
    );
  }
}
