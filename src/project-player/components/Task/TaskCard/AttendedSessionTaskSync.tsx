import { useEffect, useRef } from 'react';
import { useRoute } from '@react-navigation/native';
import { useProjectContext } from '../../../context/ProjectContext';
import { fetchMenteeSessionIds } from './hooks/useTaskSessionStatus';
import { SUPPORT_OFFERING_TYPE_VALUES } from '@constants/SUPPORT_PROVIDER_CARDS';
import { TASK_STATUS, TASK_TYPE } from '../../../../constants/app.constant';
import type { Task } from '../../../types/project.types';

const SESSION_TYPES = Object.values(SUPPORT_OFFERING_TYPE_VALUES) as string[];

const collectSessionTasks = (tasks: Task[] = [], acc: Task[] = []): Task[] => {
  tasks.forEach((task) => {
    const meta = task.metaInformation;
    if (
      task.type !== TASK_TYPE.OBSERVATION &&
      meta?.sessionId !== undefined && meta?.sessionId !== null &&
      SESSION_TYPES.includes(meta?.support_offering_type)
    ) {
      acc.push(task);
    }
    collectSessionTasks(task.children, acc);
    collectSessionTasks(task.tasks, acc);
  });
  return acc;
};

/**
 * Renders nothing. Finds session-type tasks whose mapped session the participant attended and
 * that are not yet completed, and marks them all completed in ONE project-update request.
 * Tasks that are already completed (e.g. ticked manually) are never touched, and each task is
 * attempted once per mount.
 */
const AttendedSessionTaskSync = () => {
  const { projectData, updateTasks, mode } = useProjectContext();
  const participantId = (useRoute().params as any)?.id;
  const attemptedRef = useRef(new Set<string>());

  useEffect(() => {
    if (mode !== 'edit' || !participantId || !projectData) return;
    const pending = collectSessionTasks([...(projectData.children || []), ...(projectData.tasks || [])])
      .filter((t) => t.status !== TASK_STATUS.COMPLETED && !attemptedRef.current.has(t._id));
    if (pending.length === 0) return;

    let cancelled = false;
    fetchMenteeSessionIds(String(participantId))
      .then(({ attended }) => {
        if (cancelled) return;
        const toComplete = pending.filter(
          (t) => attended.has(String(t.metaInformation?.sessionId)) && !attemptedRef.current.has(t._id),
        );
        if (toComplete.length === 0) return;
        toComplete.forEach((t) => attemptedRef.current.add(t._id));
        const entityId = (projectData as any)?.entityInformation?.externalId ?? participantId;
        return updateTasks(
          toComplete.map((t) => ({ taskId: t._id, updates: { status: TASK_STATUS.COMPLETED } })),
          entityId,
        );
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [mode, participantId, projectData, updateTasks]);

  return null;
};

export default AttendedSessionTaskSync;
