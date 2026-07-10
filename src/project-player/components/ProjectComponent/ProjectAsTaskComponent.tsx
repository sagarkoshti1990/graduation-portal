import React, { memo } from 'react';
import TaskAccordion from '../Task/TaskAccordion';
import { ProjectAsTaskComponentProps } from '../../types/components.types';

const ProjectAsTaskComponent = memo<ProjectAsTaskComponentProps>(({
  task,
  level = 0,
  showAccordionWrapper,
  parentIndex,
  isExpanded,
  onToggleExpand,
}) => (
  <TaskAccordion
    parentIndex={parentIndex}
    task={task}
    level={level}
    showAccordionWrapper={showAccordionWrapper}
    isExpanded={isExpanded}
    onToggleExpand={onToggleExpand}
  />
));

ProjectAsTaskComponent.displayName = 'ProjectAsTaskComponent';
export default ProjectAsTaskComponent;
