import { useMemo } from 'react';
import { PROJECT_MODES } from '../../../../../constants/app.constant';
import { useProjectStable } from '../../../../context/ProjectContext';

export interface TaskPermissions {
  isReadOnly: boolean;
  isPreview: boolean;
  isEdit: boolean;
  isInterventionPlanEditMode: boolean;
}

// Uses useProjectStable() so task cards don't re-render on projectData changes.
export function useTaskPermissions(isChildOfProject: boolean, taskId?: string): TaskPermissions {
  const { mode, allowEditTaskIds } = useProjectStable();

  return useMemo(() => {
    // A task explicitly allowed via allowEditTaskIds stays editable even in
    // read-only mode — every other task keeps the existing mode-based behavior.
    const isAllowedException =
      mode === PROJECT_MODES.READ_ONLY && !!taskId && !!allowEditTaskIds?.includes(taskId);
    const isReadOnly = mode === PROJECT_MODES.READ_ONLY && !isAllowedException;
    const isPreview  = mode === PROJECT_MODES.PREVIEW;
    const isEdit     = mode === PROJECT_MODES.EDIT || isAllowedException;
    return {
      isReadOnly,
      isPreview,
      isEdit,
      isInterventionPlanEditMode: isEdit && !isPreview && isChildOfProject,
    };
  }, [mode, isChildOfProject, taskId, allowEditTaskIds]);
}
