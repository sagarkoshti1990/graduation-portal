import React, { memo, useCallback, useMemo } from 'react';
import { PROJECT_MODES } from '../../../../constants/app.constant';
import ReadOnlyTask from './ReadOnlyTask';
import SimpleObservationTask from './simpleObservationTask/SimpleObservationTask';
import CustomTaskManager from './CustomTaskManager';
import type { Task } from '../../../types/project.types';

export interface TaskListRendererProps {
  task: Task;
  isLastTask?: boolean;
  isChildOfProject?: boolean;
  isOnboardingTask?: boolean;
  parentIndex?:number;
  index?:number;
  projectContext?:any;
}

type RenderVariant = 'readonly' | 'custom' | 'simple';

const TaskListRenderer : React.FC<TaskListRendererProps> = ({
  task,
  projectContext,
  isLastTask = false,
  isChildOfProject = false,
  isOnboardingTask = false,
  parentIndex,
  index
}) => {
  const {mode} = projectContext
  const variant = useMemo<RenderVariant>(() => {
    if (mode === PROJECT_MODES.READ_ONLY) return 'readonly';
    if (task.isCustomTask && mode === PROJECT_MODES.EDIT) return 'custom';
    return 'simple';
  }, [mode, task.isCustomTask]);

  const commonProps = { task, isLastTask, isChildOfProject, isOnboardingTask, parentIndex, index, projectContext };

  // Stable render prop — only recreated when task identity or layout flags
  // change. Prevents CustomTaskManager from re-rendering when the parent
  // re-renders for unrelated reasons (e.g. sibling task update).
  const renderWithCustomActions = useCallback(
    (customActions: React.ReactNode) => (
      <SimpleObservationTask
        task={task}
        isLastTask={isLastTask}
        isChildOfProject={isChildOfProject}
        isOnboardingTask={isOnboardingTask}
        parentIndex={parentIndex}
        index={index}
        projectContext={projectContext}
        extraActions={customActions}
      />
    ),
    [task, isLastTask, isChildOfProject, isOnboardingTask, parentIndex, index, projectContext],
  );

  if (variant === 'readonly') {
    return <ReadOnlyTask {...commonProps} />;
  }

  if (variant === 'custom') {
    return (
      <CustomTaskManager {...commonProps}>
        {renderWithCustomActions}
      </CustomTaskManager>
    );
  }

  return <SimpleObservationTask {...commonProps} />;
};

TaskListRenderer.displayName = 'TaskListRenderer';

export default memo(TaskListRenderer);
