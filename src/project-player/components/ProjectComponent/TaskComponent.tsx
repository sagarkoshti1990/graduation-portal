import React, { memo } from 'react';
import TaskCard from '../Task/TaskCard';
import ProjectAsTaskComponent from './ProjectAsTaskComponent';
import { TaskComponentProps } from '../../types/components.types';

/**
 * Uses useProjectStable() instead of useProjectContext() so this component
 * does NOT re-render when projectData changes (task status updates).
 *
 * The custom memo comparator on task reference equality ensures that when
 * ProjectContent re-maps the task list, only the task whose reference
 * changed (the updated one) causes a re-render here.
 *
 * projectData is intentionally excluded from the projectContext prop —
 * it is only needed inside callbacks at action time and is accessed via
 * projectDataRef in the relevant hooks.
 */
const TaskComponent = memo<TaskComponentProps>(
  ({
    task,
    level = 0,
    isLastTask = false,
    isChildOfProject = false,
    isOnboardingTask = false,
    showAccordionWrapper,
    index,
    parentIndex,
    projectContext
  }) => {
    if (
      task?.tasks ||
      (task?.children && task.children.length > 0)
    ) {
      return (
        <ProjectAsTaskComponent
          task={task}
          parentIndex={parentIndex}
          level={level}
          showAccordionWrapper={showAccordionWrapper}
        />
      );
    }

    if (task?.isDeleted) return null;

    return (
      <TaskCard
        parentIndex={parentIndex}
        index={index}
        task={task}
        isLastTask={isLastTask}
        isChildOfProject={isChildOfProject}
        isOnboardingTask={isOnboardingTask}
        projectContext={projectContext}
      />
    );
  },
  (prev, next) =>
    prev.task === next.task &&
    prev.isLastTask === next.isLastTask &&
    prev.isChildOfProject === next.isChildOfProject &&
    prev.showAccordionWrapper === next.showAccordionWrapper,
);

TaskComponent.displayName = 'TaskComponent';
export default TaskComponent;
