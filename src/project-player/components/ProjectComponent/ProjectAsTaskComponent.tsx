import React from 'react';
import TaskAccordion from '../Task/TaskAccordion';
import { ProjectAsTaskComponentProps } from '../../types/components.types';

const ProjectAsTaskComponent: React.FC<ProjectAsTaskComponentProps> = ({
  task,
  level = 0,
  showAccordionWrapper,
}) => {
  // Render the project as an accordion
  return (
    <TaskAccordion
      task={task}
      level={level}
      showAccordionWrapper={showAccordionWrapper}
    />
  );
};

export default ProjectAsTaskComponent;
