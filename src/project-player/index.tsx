import React, { useEffect, useRef, useMemo, memo } from 'react';
import { ProjectProvider, useProjectContext } from './context/ProjectContext';
import { useProjectLoader } from './hooks/useProjectLoader';
import ProjectComponent from './components/ProjectComponent';
import { Box, Spinner } from '@gluestack-ui/themed';
import {
  ProjectPlayerProps,
  ProjectPlayerConfig,
  ProjectPlayerData,
} from './types/components.types';
import { areAllTasksCompleted } from './utils/taskCompletionUtils';
import { TASK_STATUS } from '../constants/app.constant';

export type { ProjectPlayerConfig, ProjectPlayerData };

/**
 * Internal component that tracks task completion and calls callback
 */
const TaskCompletionTracker: React.FC<{
  onTaskCompletionChange?: (areAllCompleted: boolean) => void;
  onProgressChange?: (progress: number) => void;
}> = ({ onTaskCompletionChange, onProgressChange }) => {
  const { projectData } = useProjectContext();

  const onTaskCompletionChangeRef = useRef(onTaskCompletionChange);
  const onProgressChangeRef = useRef(onProgressChange);
  useEffect(() => { onTaskCompletionChangeRef.current = onTaskCompletionChange; });
  useEffect(() => { onProgressChangeRef.current = onProgressChange; });

  const allCompleted = useMemo(
    () => (projectData?.tasks ? areAllTasksCompleted(projectData.tasks) : false),
    [projectData?.tasks],
  );

  useEffect(() => {
    if (!projectData) return;

    if (onTaskCompletionChangeRef.current && projectData?.tasks) {
      onTaskCompletionChangeRef.current(allCompleted);
    }

    if (onProgressChangeRef.current) {
      const topLevelTasks = projectData.children?.length
        ? projectData.children
        : projectData.tasks || [];
      let totalChildTasks = 0;
      let completedChildTasks = 0;

      topLevelTasks.forEach(task => {
        const childTasks = task.children || task.tasks || [];
        if (!childTasks.length) return;

        const validChildren = childTasks.filter(
          (childTask: any) => !childTask.isDeleted,
        );

        totalChildTasks += validChildren.length;
        completedChildTasks += validChildren.filter(
          (childTask: any) => childTask.status === TASK_STATUS.COMPLETED,
        ).length;
      });

      const progress =
        totalChildTasks > 0
          ? Math.round((completedChildTasks / totalChildTasks) * 100)
          : 0;

      onProgressChangeRef.current(progress);
    }
  }, [projectData, allCompleted]);

  return null;
};

const ProjectPlayer: React.FC<ProjectPlayerProps> = ({
  config,
  data,
  onTaskUpdate,
  onTaskCompletionChange,
  onProgressChange,
  getProjectData,
}) => {
  const {
    projectData: loadedProject,
    oldProjectData,
    isLoading,
    error,
  } = useProjectLoader(config, data ?? {});

  const getProjectDataRef = useRef(getProjectData);
  useEffect(() => { getProjectDataRef.current = getProjectData; });

  useEffect(() => {
    if (getProjectDataRef.current && loadedProject) {
      getProjectDataRef.current(loadedProject);
    }
  }, [loadedProject]);

  if (isLoading) {
    return (
      <Box flex={1} alignItems="center" justifyContent="center">
        <Spinner size="large" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box flex={1} alignItems="center" justifyContent="center">
        {/* TODO: Add error component */}
      </Box>
    );
  }
  return (
    <ProjectProvider
      config={config}
      initialData={loadedProject}
      oldProjectData={oldProjectData}
      onTaskUpdate={onTaskUpdate}
    >
      <TaskCompletionTracker
        onTaskCompletionChange={onTaskCompletionChange}
        onProgressChange={onProgressChange}
      />
      <ProjectComponent />
    </ProjectProvider>
  );
};

export default memo(ProjectPlayer);
