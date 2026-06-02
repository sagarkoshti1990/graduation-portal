import { useMemo } from 'react';
import { PROJECT_MODES } from '../../../../../constants/app.constant';
import { useProjectContext } from '../../../../context/ProjectContext';

export interface TaskPermissions {
  isReadOnly: boolean;
  isPreview: boolean;
  isEdit: boolean;
  isInterventionPlanEditMode: boolean;
}

export function useTaskPermissions(isChildOfProject: boolean): TaskPermissions {
  const { mode } = useProjectContext();

  const isReadOnly = useMemo(() => mode === PROJECT_MODES.READ_ONLY, [mode]);
  const isPreview = useMemo(() => mode === PROJECT_MODES.PREVIEW, [mode]);
  const isEdit = useMemo(() => mode === PROJECT_MODES.EDIT, [mode]);
  const isInterventionPlanEditMode = useMemo(
    () => isEdit && !isPreview && isChildOfProject,
    [isEdit, isPreview, isChildOfProject],
  );

  return { isReadOnly, isPreview, isEdit, isInterventionPlanEditMode };
}
