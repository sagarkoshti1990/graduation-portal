import { useCallback, useState } from 'react';
import { getEnrolledMentees } from '../services/mentoringService';
import type { ParticipantAttendanceItem } from '../types/supportOfferingsTypes';

const mapMentees = (mentees: any[]): ParticipantAttendanceItem[] =>
  (mentees || []).map((mentee: any) => ({
    id: String(mentee.id),
    name: mentee.name || '',
    lcName: mentee.organization?.name || '',
    isPresent: !!mentee.is_attended,
  }));

/**
 * Enrolled participants + attendance of a session, shared by the Support Provider and LC cards.
 * The list is fetched on demand (when the attendance modal opens); counts shown on the cards come
 * from the sessions list API (`enrolled_mentees_count` / `present_mentees_count`).
 */
export function useSessionAttendance(sessionId: string | number | undefined) {
  const [participants, setParticipants] = useState<ParticipantAttendanceItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    if (!sessionId) return;
    setIsLoading(true);
    try {
      setParticipants(mapMentees(await getEnrolledMentees(sessionId)));
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // Opening the modal reuses the loaded list instead of fetching again
  const ensureLoaded = useCallback(async () => {
    if (participants === null && !isLoading) await load();
  }, [participants, isLoading, load]);

  const applyPresent = useCallback((presentIds: string[]) => {
    setParticipants((prev) => (prev ? prev.map((p) => ({ ...p, isPresent: presentIds.includes(p.id) })) : prev));
  }, []);

  return { participants, isLoading, ensureLoaded, applyPresent };
}
