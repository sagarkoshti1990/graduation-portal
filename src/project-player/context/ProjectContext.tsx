import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { ProjectData, Task } from '../types/project.types';
import {
  ProjectContextValue,
  ProjectProviderProps,
} from '../types/components.types';
import { setApiConfig } from '../utils/api';
import { updateTask as updateTaskAPI } from '../services/projectPlayerService';
import { MODE } from '@constants/PROJECTDATA';

const ProjectContext = createContext<ProjectContextValue | undefined>(
  undefined,
);

function isApiErrorResult(
  result: unknown,
): result is { error: string; data: null } {
  return (
    typeof result === 'object' &&
    result !== null &&
    'error' in result &&
    typeof (result as { error?: unknown }).error === 'string' &&
    'data' in result &&
    (result as { data: unknown }).data === null
  );
}

function findPillarForAddTask(
  prev: ProjectData,
  pillarId: string,
): Task | null {
  const walk = (tasks: Task[]): Task | null => {
    for (const t of tasks) {
      if (t._id === pillarId) return t;
      if (t.tasks?.length) {
        const found = walk(t.tasks);
        if (found) return found;
      }
    }
    return null;
  };
  const source = prev.tasks?.length ? prev.tasks : prev.children || [];
  return walk(source);
}

function mergeTaskIntoProject(
  prev: ProjectData,
  pillarId: string,
  task: Task,
): ProjectData {
  const addTaskToPillar = (tasks: Task[]): Task[] => {
    return tasks.map(t => {
      if (t._id === pillarId) {
        if (t?.children && t?.children.length) {
          return {
            ...t,
            children: [...(t.children || []), task],
          };
        }
        return {
          ...t,
          tasks: [...(t.tasks || []), task],
        };
      }
      if (t.tasks && t.tasks.length > 0) {
        return {
          ...t,
          tasks: addTaskToPillar(t.tasks),
        };
      }
      return t;
    });
  };

  if (prev.tasks?.length) {
    return {
      ...prev,
      tasks: addTaskToPillar(prev.tasks),
    };
  }
  return {
    ...prev,
    children: addTaskToPillar(prev?.children || []),
  };
}

function findTaskForDelete(
  prev: ProjectData,
  taskId: string,
): {
  deletedTask: Task;
  parentId: string | null;
  parentName: string | null;
} | null {
  let deletedTask: Task | null = null;
  let parentId: string | null = null;
  let parentName: string | null = null;

  const findTaskInfo = (tasks: Task[], parent?: Task) => {
    for (const task of tasks) {
      if (task._id === taskId) {
        deletedTask = task;
        parentId = parent?._id || null;
        parentName = parent?.name || null;
        return true;
      }
      if (task.tasks?.length && findTaskInfo(task.tasks, task)) return true;
      if (task.children?.length && findTaskInfo(task.children, task))
        return true;
    }
    return false;
  };

  findTaskInfo(prev.tasks || prev.children || []);

  if (!deletedTask) return null;
  return { deletedTask, parentId, parentName };
}

function removeTaskFromProject(prev: ProjectData, taskId: string): ProjectData {
  const deleteRecursive = (tasks: Task[]): Task[] =>
    tasks
      .filter(task => task._id !== taskId)
      .map(task => ({
        ...task,
        tasks: task.tasks ? deleteRecursive(task.tasks) : task.tasks,
        children: task.children
          ? deleteRecursive(task.children)
          : task.children,
      }));

  if (prev?.tasks?.some(task => task.children?.length)) {
    return {
      ...prev,
      tasks: prev.tasks.map(task => ({
        ...task,
        children: task.children
          ? deleteRecursive(task.children)
          : task.children,
      })),
    };
  }

  if (prev.children?.length) {
    return {
      ...prev,
      children: deleteRecursive(prev.children),
    };
  }

  return {
    ...prev,
    tasks: deleteRecursive(prev.tasks || []),
  };
}

export const ProjectProvider: React.FC<ProjectProviderProps> = ({
  children,
  config,
  initialData,
  onTaskUpdate,
}) => {
  const [projectData, setProjectData] = useState<ProjectData | null>(
    initialData,
  );
  const projectDataRef = useRef<ProjectData | null>(initialData);
  const [isLoading] = useState(false);
  const [error] = useState<Error | null>(null);
  const [addedToPlanTaskIds, setAddedToPlanTaskIds] = useState<string[]>([]);
  const [taskPlanActionPerformedIds, setTaskPlanActionPerformedIds] = useState<
    string[]
  >([]);

  const isEditMode = config.mode === MODE.editMode.mode;

  useEffect(() => {
    projectDataRef.current = projectData;
  }, [projectData]);

  // Initialize API configuration
  useEffect(() => {
    if (config.baseUrl || config.accessToken) {
      setApiConfig({
        baseUrl: config.baseUrl,
        accessToken: config.accessToken,
      });
    }
  }, [config.baseUrl, config.accessToken]);

  useEffect(() => {
    if (
      !projectData ||
      addedToPlanTaskIds.length > 0 ||
      taskPlanActionPerformedIds.length > 0
    )
      return;

    const collectAddedToPlanIds = (tasks: Task[] = []): string[] =>
      tasks.flatMap(task => {
        const nested = [
          ...(task?.children ? collectAddedToPlanIds(task.children) : []),
          ...(task?.tasks ? collectAddedToPlanIds(task.tasks) : []),
        ];
        const isAdded = task?.metaInformation?.addedToPlan === true;
        return [...(isAdded ? [task._id] : []), ...nested];
      });

    const initialIds = collectAddedToPlanIds([
      ...(projectData.children || []),
      ...(projectData.tasks || []),
    ]);

    if (initialIds.length > 0) {
      setAddedToPlanTaskIds(initialIds);
      setTaskPlanActionPerformedIds(initialIds);
    }
  }, [projectData, addedToPlanTaskIds.length, taskPlanActionPerformedIds.length]);

  const updateTask = useCallback(
    async (taskId: string, updates: Partial<Task>): Promise<void> => {
      const mergedRef: { task: Task | null; projectId: string | null } = {
        task: null,
        projectId: null,
      };

      setProjectData(prev => {
        if (!prev) return null;

        mergedRef.projectId = prev._id;

        const updateTaskRecursive = (tasks: Task[]): Task[] => {
          return tasks.map(task => {
            if (task._id === taskId) {
              const newTask = { ...task, ...updates };
              mergedRef.task = newTask;
              return newTask;
            }
            if (task.tasks && task.tasks.length > 0) {
              return {
                ...task,
                tasks: updateTaskRecursive(task.tasks),
              };
            }
            return task;
          });
        };

        if (prev.children?.length) {
          return {
            ...prev,
            children: updateTaskRecursive(prev.children),
          };
        } else if (prev?.tasks?.some(task => task.children?.length)) {
          return {
            ...prev,
            tasks: prev.tasks.map(task => ({
              ...task,
              children: task.children
                ? updateTaskRecursive(task.children)
                : task.children,
            })),
          };
        }

        return {
          ...prev,
          tasks: updateTaskRecursive(prev.tasks || []),
        };
      });

      const updatedTaskObj = mergedRef.task;
      const currentProjectId = mergedRef.projectId;

      if (onTaskUpdate && updatedTaskObj) {
        const taskForCallback = updatedTaskObj;
        setTimeout(() => onTaskUpdate(taskForCallback), 0);
      }

      if (!currentProjectId) return;
      if (!updatedTaskObj) return;

      if (updatedTaskObj.isCustomTask && !isEditMode) {
        return;
      }

      const pillarName = (updates as { pillarName?: string }).pillarName;

      let result: unknown;
      if (
        (updatedTaskObj.isCustomTask || updatedTaskObj.parentId) &&
        isEditMode
      ) {
        result = await updateTaskAPI(currentProjectId, {
          tasks: [
            {
              _id: updatedTaskObj.parentId,
              name: pillarName,
              children: [
                { _id: taskId, name: updatedTaskObj.name, ...updates },
              ],
            },
          ],
        });
      } else {
        result = await updateTaskAPI(currentProjectId, {
          tasks: [
            {
              _id: taskId,
              name: updatedTaskObj.name,
              ...updates,
            },
          ],
        });
      }

      if (isApiErrorResult(result)) {
        throw new Error(result.error || 'Failed to update task');
      }
    },
    [onTaskUpdate, isEditMode],
  );

  const updateProjectInfo = useCallback((updates: Partial<ProjectData>) => {
    setProjectData(prev => (prev ? { ...prev, ...updates } : null));
  }, []);

  const addTask = useCallback(async (pillarId: string, task: Task) => {
    const prev = projectDataRef.current;
    if (!prev) {
      throw new Error('No project data');
    }

    const pillar = findPillarForAddTask(prev, pillarId);
    if (!pillar) {
      throw new Error('Pillar not found');
    }

    const currentProjectId = prev._id;
    const needsApi = !!(pillar.children?.length && currentProjectId);

    if (needsApi) {
      const result = await updateTaskAPI(currentProjectId, {
        tasks: [
          {
            _id: pillarId,
            name: pillar.name,
            children: [task],
          },
        ],
      });
      if (isApiErrorResult(result)) {
        throw new Error(result.error || 'Failed to add task');
      }
    }

    setProjectData(p => {
      if (!p) return null;
      return mergeTaskIntoProject(p, pillarId, task);
    });
  }, []);

  const deleteTask = useCallback(
    async (taskId: string): Promise<void> => {
      const prev = projectDataRef.current;
      if (!prev) throw new Error('No project data');

      const info = findTaskForDelete(prev, taskId);
      if (!info) throw new Error('Task not found');

      const { deletedTask, parentId, parentName } = info;
      const currentProjectId = prev._id;
      const needsApi = !!(
        currentProjectId &&
        parentId &&
        isEditMode
      );

      if (needsApi) {
        const result = await updateTaskAPI(currentProjectId, {
          tasks: [
            {
              _id: parentId,
              name: parentName,
              children: [{ _id: deletedTask._id, isDeleted: true }],
            },
          ],
        });
        if (isApiErrorResult(result)) {
          throw new Error(result.error || 'Failed to delete task');
        }
      }

      setProjectData(p => {
        if (!p) return null;
        return removeTaskFromProject(p, taskId);
      });
    },
    [isEditMode],
  );

  const saveLocal = useCallback(() => {
    // TODO: Implement local save logic
    console.log('saveLocal');
  }, []);

  const syncToServer = useCallback(async () => {
    // TODO: Implement sync logic
    console.log('syncToServer');
  }, []);

  const setTaskAddedToPlan = useCallback(
    (taskId: string, added: boolean) => {
      setAddedToPlanTaskIds(prev => {
        if (added) {
          return prev.includes(taskId) ? prev : [...prev, taskId];
        }
        return prev.filter(id => id !== taskId);
      });
    },
    [],
  );

  const setTaskPlanActionPerformed = useCallback((taskId: string) => {
    setTaskPlanActionPerformedIds(prev =>
      prev.includes(taskId) ? prev : [...prev, taskId],
    );
  }, []);

  const value: ProjectContextValue = {
    projectData,
    isLoading,
    error,
    mode: config.mode,
    config, // Provide full config to child components
    updateTask,
    updateProjectInfo,
    addTask,
    deleteTask,
    saveLocal,
    syncToServer,
    addedToPlanTaskIds,
    setTaskAddedToPlan,
    taskPlanActionPerformedIds,
    setTaskPlanActionPerformed,
    onTaskUpdate,
  };

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
};

export const useProjectContext = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjectContext must be used within a ProjectProvider');
  }
  return context;
};
