import React, { memo, useMemo } from 'react';
import { useProjectContext } from '../../../context/ProjectContext';
import { PROJECT_MODES, TASK_TYPE } from '../../../../constants/app.constant';
import ReadOnlyTask from './ReadOnlyTask';
import SimpleObservationTask from './SimpleObservationTask';
import CustomTaskManager from './CustomTaskManager';
import type { Task } from '../../../types/project.types';

export interface TaskListRendererProps {
  task: Task;
  isLastTask?: boolean;
  isChildOfProject?: boolean;
  isOnboardingTask?: boolean;
}

type RenderVariant = 'readonly' | 'custom' | 'simple';

const TaskListRenderer = memo<TaskListRendererProps>(({
  task,
  isLastTask = false,
  isChildOfProject = false,
  isOnboardingTask = false,
}) => {
  const { mode } = useProjectContext();

  const variant = useMemo<RenderVariant>(() => {
    if (mode === PROJECT_MODES.READ_ONLY) return 'readonly';
    if (task.isCustomTask && mode === PROJECT_MODES.EDIT) return 'custom';
    return 'simple';
  }, [mode, task.isCustomTask]);

  const commonProps = { task, isLastTask, isChildOfProject, isOnboardingTask };

  if (variant === 'readonly') {
    return <ReadOnlyTask {...commonProps} />;
  }

  if (variant === 'custom') {
    return (
      <CustomTaskManager {...commonProps}>
        {(customActions) => (
          <SimpleObservationTask {...commonProps} extraActions={customActions} />
        )}
      </CustomTaskManager>
    );
  }

  return <SimpleObservationTask {...commonProps} />;
});

TaskListRenderer.displayName = 'TaskListRenderer';
export default TaskListRenderer;
