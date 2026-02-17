import React from 'react';
import TaskCard from '../Task/TaskCard';
import ProjectAsTaskComponent from './ProjectAsTaskComponent';
import { TaskComponentProps } from '../../types/components.types';

const TaskComponent: React.FC<TaskComponentProps> = ({
  task,
  level = 0,
  isLastTask = false,
  isChildOfProject = false,
  isOnboardingTask = false,
  showAccordionWrapper,
}) => {
  // If task is a project type with children, render as ProjectAsTaskComponent
if (
  task?.tasks ||
  (task?.children && task.children.length > 0)
) {
    return (
      <ProjectAsTaskComponent
        task={task}
        level={level}
        showAccordionWrapper={showAccordionWrapper}
      />
    );
  }

if (task?.isDeleted) return null;
  // Otherwise render as a regular task card
  return (
    <TaskCard
      task={task}
      level={level}
      isLastTask={isLastTask}
      isChildOfProject={isChildOfProject}
      isOnboardingTask={isOnboardingTask}
    />
  );
};

export default TaskComponent;
