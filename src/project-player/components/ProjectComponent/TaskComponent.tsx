import React, { memo } from 'react';
import TaskCard from '../Task/TaskCard';
import ProjectAsTaskComponent from './ProjectAsTaskComponent';
import { TaskComponentProps } from '../../types/components.types';
import { useTaskAddedToPlan } from '../../context/ProjectContext';

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
    projectContext,
    isExpanded,
    onToggleExpand,
  }) => {
    // Accepting/rejecting this task (isDeletable) flips its plan status,
    // which restyles its card in place. That in-place Fabric update has been
    // observed to trip a native Yoga/Fabric assertion crash (RN 0.82, open
    // upstream bug — no fix available). Keying on the plan status forces a
    // full unmount+remount of the leaf TaskCard instead, sidestepping the
    // in-place shadow-node update path that crashes.
    const planState = useTaskAddedToPlan(task?._id ?? '');

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
          isExpanded={isExpanded}
          onToggleExpand={onToggleExpand}
        />
      );
    }

    if (task?.isDeleted) return null;

    return (
      <TaskCard
        key={`${task._id}-${planState}`}
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
    prev.showAccordionWrapper === next.showAccordionWrapper &&
    prev.isExpanded === next.isExpanded &&
    prev.onToggleExpand === next.onToggleExpand,
);

TaskComponent.displayName = 'TaskComponent';
export default TaskComponent;
