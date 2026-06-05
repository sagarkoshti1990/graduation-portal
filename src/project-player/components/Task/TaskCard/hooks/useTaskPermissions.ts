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
export function useTaskPermissions(isChildOfProject: boolean): TaskPermissions {
  const { mode } = useProjectStable();

  return useMemo(() => {
    const isReadOnly = mode === PROJECT_MODES.READ_ONLY;
    const isPreview  = mode === PROJECT_MODES.PREVIEW;
    const isEdit     = mode === PROJECT_MODES.EDIT;
    return {
      isReadOnly,
      isPreview,
      isEdit,
      isInterventionPlanEditMode: isEdit && !isPreview && isChildOfProject,
    };
  }, [mode, isChildOfProject]);
}
