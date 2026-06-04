import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from 'react';
import { ProjectData, Task } from '../types/project.types';
import {
  ProjectContextValue,
  ProjectProviderProps,
} from '../types/components.types';
import { setApiConfig } from '../utils/api';
import { updateTask as updateTaskAPI } from '../services/projectPlayerService';
import { MODE } from '@constants/PROJECTDATA';
import dataService from '../../services/dataService';
import { updateTaskStatus } from '../utils/taskUtils';

// ─── Context value shapes ──────────────────────────────────────────────────────

/**
 * Stable context — only changes when config / mode changes (rare).
 * Task-level hooks should subscribe to THIS to avoid re-rendering on task
 * status updates.
 */
type ProjectStableContextValue = Omit<
  ProjectContextValue,
  'projectData' | 'addedToPlanTaskIds' | 'taskPlanActionPerformedIds'
> & {
  /** Ref to the current projectData. Read in callbacks without subscribing. */
  projectDataRef: React.RefObject<ProjectData | null>;
};

/**
 * Data context — changes whenever task data or plan state changes.
 * Only list-level components (ProjectContent, ProjectComponent) should
 * subscribe to this.
 */
type ProjectDataContextValue = {
  projectData: ProjectData | null;
  oldProjectData:ProjectData | null;
  addedToPlanTaskIds: string[];
  taskPlanActionPerformedIds: string[];
};

const ProjectStableContext = createContext<ProjectStableContextValue | undefined>(undefined);
const ProjectDataContext   = createContext<ProjectDataContextValue   | undefined>(undefined);

// ─── Helper functions ──────────────────────────────────────────────────────────

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

// ─── Provider ─────────────────────────────────────────────────────────────────

export const ProjectProvider: React.FC<ProjectProviderProps> = ({
  children,
  config,
  initialData,
  oldProjectData,
  onTaskUpdate,
}) => {
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

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
    async ({taskId, parentIndex, index}: {taskId: string; parentIndex?: number; index?: number}, participantId: string, updates: Partial<Task>): Promise<void> => {
      // Use functional updater to avoid stale projectData closure.
      setProjectData(prev => {
        if (!prev) return prev;
        return updateTaskStatus({
          data: prev,
          taskIndex: parentIndex || 0,
          childIndex: index,
          updatedData: updates,
        });
      });

      // NOTE: API sync logic below is unreachable in the current flow
      // (kept for future restoration). projectDataRef is used to read current
      // data without adding it to the dependency array.
      let updatedTaskObj;
      const parentTask = projectData?.tasks?.[parentIndex||0];
      if(index && parentTask?.children && parentTask?.children?.length > 0) {
        updatedTaskObj = projectData?.tasks?.[parentIndex||0]?.children?.[index];
      } else {
        updatedTaskObj = projectData?.tasks?.[parentIndex||0];
      }
      const currentProjectId = projectData?._id;

      if (onTaskUpdate && updatedTaskObj) {
        const taskForCallback = updatedTaskObj;
        setTimeout(() => { if (mountedRef.current) onTaskUpdate(taskForCallback); });
      }

      if (!currentProjectId || !updatedTaskObj) {
        return;
      }

      if ((updatedTaskObj as any).isCustomTask && !isEditMode) {
        return;
      }

      const pillarName = (updates as { pillarName?: string }).pillarName;

      const isCustomOrChild =
        ((updatedTaskObj as any).isCustomTask || (updatedTaskObj as any).parentId) && isEditMode;

      const payloadTask = isCustomOrChild
        ? {
            tasks: [
              {
                _id: (updatedTaskObj as any).parentId,
                name: pillarName,
                children: [
                  {
                    _id: taskId,
                    name: (updatedTaskObj as any).name,
                    ...updates,
                  },
                ],
              },
            ],
          }
        : {
            tasks: [
              {
                _id: taskId,
                name: (updatedTaskObj as any).name,
                ...updates,
              },
            ],
          };

      const isOffline = dataService.isNetworkOffline();
      let result: unknown;
      
      if (isOffline) {
        await dataService.saveTaskEdit(
          participantId,
          currentProjectId,
          payloadTask,
        );
      } else {
        result = await updateTaskAPI(currentProjectId, payloadTask);
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
    console.log('saveLocal');
  }, []);

  const syncToServer = useCallback(async () => {
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

  // Stable value — only recreated when config or callbacks change.
  // Task-level hooks subscribe here so they never re-render from task updates.
  const stableValue = useMemo<ProjectStableContextValue>(
    () => ({
      isLoading,
      error,
      mode: config.mode,
      config,
      updateTask,
      updateProjectInfo,
      addTask,
      deleteTask,
      saveLocal,
      syncToServer,
      setTaskAddedToPlan,
      setTaskPlanActionPerformed,
      onTaskUpdate,
      projectDataRef,
      oldProjectData
    }),
    [
      isLoading,
      error,
      config,
      updateTask,
      updateProjectInfo,
      addTask,
      deleteTask,
      saveLocal,
      syncToServer,
      setTaskAddedToPlan,
      setTaskPlanActionPerformed,
      onTaskUpdate,
      oldProjectData
    ],
  );

  // Data value — recreated on every task/plan state change.
  // Only list-level components that render the task tree subscribe here.
  const dataValue = useMemo<ProjectDataContextValue>(
    () => ({
      projectData,
      oldProjectData,
      addedToPlanTaskIds,
      taskPlanActionPerformedIds,
    }),
    [projectData,oldProjectData, addedToPlanTaskIds, taskPlanActionPerformedIds],
  );

  return (
    <ProjectStableContext.Provider value={stableValue}>
      <ProjectDataContext.Provider value={dataValue}>
        {children}
      </ProjectDataContext.Provider>
    </ProjectStableContext.Provider>
  );
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Subscribe to stable context only (mode, config, callbacks).
 * Use in task-level hooks/components to avoid re-renders on task updates.
 */
export const useProjectStable = (): ProjectStableContextValue => {
  const ctx = useContext(ProjectStableContext);
  if (!ctx) throw new Error('useProjectStable must be used within a ProjectProvider');
  return ctx;
};

/**
 * Subscribe to data context only (projectData, plan state).
 * Use in list-level components that need to react to task changes.
 */
export const useProjectData = (): ProjectDataContextValue => {
  const ctx = useContext(ProjectDataContext);
  if (!ctx) throw new Error('useProjectData must be used within a ProjectProvider');
  return ctx;
};

/**
 * Combined context hook for backward compatibility.
 * Subscribes to BOTH contexts — only use in components that genuinely
 * need both stable config and live projectData (e.g. ProjectContent).
 */
export const useProjectContext = (): ProjectContextValue => {
  const stable = useProjectStable();
  const data   = useProjectData();
  return {
    projectData:               data.projectData,
    oldProjectData:            data.oldProjectData,
    isLoading:                 stable.isLoading,
    error:                     stable.error,
    mode:                      stable.mode,
    config:                    stable.config,
    updateTask:                stable.updateTask,
    updateProjectInfo:         stable.updateProjectInfo,
    addTask:                   stable.addTask,
    deleteTask:                stable.deleteTask,
    saveLocal:                 stable.saveLocal,
    syncToServer:              stable.syncToServer,
    addedToPlanTaskIds:        data.addedToPlanTaskIds,
    setTaskAddedToPlan:        stable.setTaskAddedToPlan,
    taskPlanActionPerformedIds: data.taskPlanActionPerformedIds,
    setTaskPlanActionPerformed: stable.setTaskPlanActionPerformed,
    onTaskUpdate:              stable.onTaskUpdate,
  };
};
