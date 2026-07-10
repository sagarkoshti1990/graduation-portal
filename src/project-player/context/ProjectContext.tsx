import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
  useSyncExternalStore,
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
import { updateOfflineProject } from '../../services/offlineCacheUpdateService';

// ─── Context value shapes ──────────────────────────────────────────────────────

/**
 * Stable context — only changes when config / mode changes (rare).
 * Task-level hooks should subscribe to THIS to avoid re-rendering on task
 * status updates.
 */
type ProjectStableContextValue = Omit<
  ProjectContextValue,
  'projectData' | 'addedToPlanTasks'
> & {
  /** Ref to the current projectData. Read in callbacks without subscribing. */
  projectDataRef: React.RefObject<ProjectData | null>;
  /** Fine-grained per-task subscription store — see AddedToPlanStore below. */
  addedToPlanStore: AddedToPlanStore;
  setTasksAddedToPlan: (taskIds: string[], added: boolean) => void;
};

/**
 * Per-task subscription store for plan-accept/reject state.
 *
 * addedToPlanTasks used to live only in ProjectDataContext, so every task
 * card in the whole tree (via useTaskStatus -> useProjectData) re-rendered
 * whenever ANY single task's plan status changed. Accepting/rejecting one
 * task (or bulk-updating synced sibling tasks) forced the entire task tree —
 * including tasks inside collapsed accordion sections — to re-layout in a
 * single commit, which was tripping a Fabric/Yoga native crash
 * (`YGNodeGetOwner(childYogaNode) == &yogaNode_`, SIGABRT) under the New
 * Architecture. This store lets each task subscribe to only its own taskId,
 * so a plan action only re-renders the task(s) that actually changed.
 */
interface AddedToPlanStore {
  getSnapshot: (taskId: string) => boolean | undefined;
  getAll: () => Record<string, boolean>;
  subscribe: (listener: () => void) => () => void;
  set: (taskId: string, added: boolean) => void;
  setMany: (taskIds: string[], added: boolean) => void;
  setAll: (next: Record<string, boolean>) => void;
}

function createAddedToPlanStore(initial: Record<string, boolean>): AddedToPlanStore {
  let state = initial;
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach(listener => listener());

  return {
    getSnapshot: taskId => state[taskId],
    getAll: () => state,
    subscribe: listener => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    set: (taskId, added) => {
      state = { ...state, [taskId]: added };
      notify();
    },
    setMany: (taskIds, added) => {
      const next = { ...state };
      taskIds.forEach(id => { next[id] = added; });
      state = next;
      notify();
    },
    setAll: next => {
      state = next;
      notify();
    },
  };
}

/**
 * Data context — changes whenever task data or plan state changes.
 * Only list-level components (ProjectContent, ProjectComponent) should
 * subscribe to this.
 */
type ProjectDataContextValue = {
  projectData: ProjectData | null;
  oldProjectData:ProjectData | null;
  addedToPlanTasks: Record<string, boolean>;
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
  offlineKeyPrefix = '',
  participantId = '',
  initialAddedToPlanTasks = {},
}) => {
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  const [projectData, setProjectData] = useState<ProjectData | null>(
    initialData,
  );

  const projectDataRef = useRef<ProjectData | null>(initialData);
  const [isLoading] = useState(false);
  const [error] = useState<Error | null>(null);
  const [addedToPlanTasks, setAddedToPlanTasks] = useState<Record<string, boolean>>(initialAddedToPlanTasks);

  const addedToPlanStoreRef = useRef<AddedToPlanStore | null>(null);
  if (addedToPlanStoreRef.current === null) {
    addedToPlanStoreRef.current = createAddedToPlanStore(initialAddedToPlanTasks);
  }

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
    if (!projectData || Object.keys(addedToPlanTasks).length > 0) return;

    const collectAddedToPlanTasks = (tasks: Task[] = []): Record<string, boolean> =>
      tasks.reduce<Record<string, boolean>>((acc, task) => {
        const nested = {
          ...(task?.children ? collectAddedToPlanTasks(task.children) : {}),
          ...(task?.tasks ? collectAddedToPlanTasks(task.tasks) : {}),
        };
        if (task?.metaInformation?.addedToPlan === true) {
          acc[task._id] = true;
        }
        return { ...acc, ...nested };
      }, {});

    const initialTasks = collectAddedToPlanTasks([
      ...(projectData.children || []),
      ...(projectData.tasks || []),
    ]);

    if (Object.keys(initialTasks).length > 0) {
      addedToPlanStoreRef.current!.setAll(initialTasks);
      setAddedToPlanTasks(initialTasks);
    }
  }, [projectData, addedToPlanTasks]);

  const updateTask = useCallback(
    async (taskId: string, callerParticipantId: string, updates: Partial<Task>): Promise<void> => {
      const current = projectDataRef.current;
      const {task, project} = updateTaskStatus({
        taskId,
        data: current,
        updatedData: updates,
      });
      setProjectData(project);
      let updatedTaskObj = task;
      const currentProjectId = current?._id;

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
          callerParticipantId,
          currentProjectId,
          payloadTask,
          offlineKeyPrefix,
        );
      } else {
        result = await updateTaskAPI(currentProjectId, payloadTask);
        // After online success, keep offline snapshot in sync.
        // Use callerParticipantId when provided, fall back to provider-level participantId.
        const pid = callerParticipantId || participantId;
        if (!isApiErrorResult(result) && pid && offlineKeyPrefix && project && currentProjectId) {
          updateOfflineProject(offlineKeyPrefix, pid, currentProjectId, project).catch(() => {});
        }
      }

      if (isApiErrorResult(result)) {
        throw new Error(result.error || 'Failed to update task');
      }
    },
    [onTaskUpdate, isEditMode, offlineKeyPrefix, participantId],
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
      if (dataService.isNetworkOffline()) {
        // Offline: queue the create for later sync and persist it into the
        // offline snapshot immediately so it survives app restart.
        await dataService.saveTaskEdit(
          participantId,
          currentProjectId,
          {
            tasks: [
              {
                _id: pillarId,
                name: pillar.name,
                children: [{ ...task, _pendingOp: 'create' }],
              },
            ],
          },
          offlineKeyPrefix,
        );
        if (participantId && offlineKeyPrefix) {
          const updatedProject = mergeTaskIntoProject(prev, pillarId, task);
          updateOfflineProject(offlineKeyPrefix, participantId, currentProjectId, updatedProject).catch(() => {});
        }
      } else {
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
        // After online success, reflect the new task in the offline snapshot.
        if (participantId && offlineKeyPrefix && currentProjectId) {
          const updatedProject = mergeTaskIntoProject(prev, pillarId, task);
          updateOfflineProject(offlineKeyPrefix, participantId, currentProjectId, updatedProject).catch(() => {});
        }
      }
    }

    setProjectData(p => {
      if (!p) return null;
      return mergeTaskIntoProject(p, pillarId, task);
    });
  }, [participantId, offlineKeyPrefix]);

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
        if (dataService.isNetworkOffline()) {
          // Offline: queue the delete for later sync and persist the removal
          // into the offline snapshot immediately so it survives app restart.
          await dataService.saveTaskEdit(
            participantId,
            currentProjectId,
            {
              tasks: [
                {
                  _id: parentId,
                  name: parentName,
                  children: [{ _id: deletedTask._id, isDeleted: true, _pendingOp: 'delete' }],
                },
              ],
            },
            offlineKeyPrefix,
          );
          if (participantId && offlineKeyPrefix) {
            const updatedProject = removeTaskFromProject(prev, taskId);
            updateOfflineProject(offlineKeyPrefix, participantId, currentProjectId, updatedProject).catch(() => {});
          }
        } else {
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
          // After online success, reflect the deletion in the offline snapshot.
          if (participantId && offlineKeyPrefix && currentProjectId) {
            const updatedProject = removeTaskFromProject(prev, taskId);
            updateOfflineProject(offlineKeyPrefix, participantId, currentProjectId, updatedProject).catch(() => {});
          }
        }
      }

      setProjectData(p => {
        if (!p) return null;
        return removeTaskFromProject(p, taskId);
      });
    },
    [isEditMode, participantId, offlineKeyPrefix],
  );

  const saveLocal = useCallback(() => {
    console.log('saveLocal');
  }, []);

  const syncToServer = useCallback(async () => {
    console.log('syncToServer');
  }, []);

  const setTaskAddedToPlan = useCallback(
    (taskId: string, added: boolean) => {
      addedToPlanStoreRef.current!.set(taskId, added);
      setAddedToPlanTasks(prev => ({ ...prev, [taskId]: added }));
    },
    [],
  );

  const setTasksAddedToPlan = useCallback(
    (taskIds: string[], added: boolean) => {
      addedToPlanStoreRef.current!.setMany(taskIds, added);
      setAddedToPlanTasks(prev => {
        const next = { ...prev };
        taskIds.forEach(id => { next[id] = added; });
        return next;
      });
    },
    [],
  );

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
      setTasksAddedToPlan,
      addedToPlanStore: addedToPlanStoreRef.current!,
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
      setTasksAddedToPlan,
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
      addedToPlanTasks,
    }),
    [projectData, oldProjectData, addedToPlanTasks],
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
 * Subscribe to a single task's added-to-plan state.
 * Re-renders only when THIS taskId's entry changes — not on every
 * accept/reject action elsewhere in the tree. Use in task-level hooks
 * instead of reading addedToPlanTasks off useProjectData().
 */
export const useTaskAddedToPlan = (taskId: string): boolean | undefined => {
  const { addedToPlanStore } = useProjectStable();
  return useSyncExternalStore(
    addedToPlanStore.subscribe,
    () => addedToPlanStore.getSnapshot(taskId),
  );
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
    addedToPlanTasks:          data.addedToPlanTasks,
    setTaskAddedToPlan:        stable.setTaskAddedToPlan,
    setTasksAddedToPlan:       stable.setTasksAddedToPlan,
    onTaskUpdate:              stable.onTaskUpdate,
  };
};
