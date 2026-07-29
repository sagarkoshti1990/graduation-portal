import { ProjectData, Task, TaskStatus } from '../types/project.types';
import { TASK_STATUS } from '../../constants/app.constant';

// Find a task by ID in a nested structure
export const findTaskById = (
  tasks: Task[],
  taskId: string,
): Task | undefined => {
  for (const task of tasks) {
    if (task._id === taskId) {
      return task;
    }
    if (task.children) {
      const found = findTaskById(task.children, taskId);
      if (found) return found;
    }
  }
  return undefined;
};

// Update a task in a nested structure
export const updateTaskInTree = (
  tasks: Task[],
  taskId: string,
  updates: Partial<Task>,
): Task[] => {
  return tasks.map(task => {
    if (task._id === taskId) {
      return { ...task, ...updates };
    }
    if (task.children) {
      return {
        ...task,
        children: updateTaskInTree(task.children, taskId, updates),
      };
    }
    return task;
  });
};

// Calculate overall project completion
export const calculateProjectCompletion = (tasks: Task[]): number => {
  if (!tasks || tasks.length === 0) return 0;

  let totalTasks = 0;
  let completedTasks = 0;

  const countTasks = (taskList: Task[]) => {
    taskList.forEach(task => {
      totalTasks++;
      if (task.status === TASK_STATUS.COMPLETED) {
        completedTasks++;
      }
      if (task.children) {
        countTasks(task.children);
      }
    });
  };

  countTasks(tasks);
  return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
};

// Get tasks by status
export const getTasksByStatus = (tasks: Task[], status: TaskStatus): Task[] => {
  const result: Task[] = [];

  const filterTasks = (taskList: Task[]) => {
    taskList.forEach(task => {
      if (task.status === status) {
        result.push(task);
      }
      if (task.children) {
        filterTasks(task.children);
      }
    });
  };

  filterTasks(tasks);
  return result;
};

// Validate task completion
export const canCompleteTask = (task: Task): boolean => {
  // Check if task has required fields completed
  if (task.type === 'file') {
    const minFiles = task?.metaInformation?.minFiles ?? 1; // Default to 1 if not specified
    return (task.attachments?.length ?? 0) >= minFiles;
  }
  if (task.type === 'observation') {
    return task?.metaInformation?.formCompleted === true;
  }
  if (task.type === 'project') {
    // All children must be completed
    return (
      task.children?.every(child => child.status === TASK_STATUS.COMPLETED) ??
      false
    );
  }
  return true;
};
export const formatFileSize = (bytes: number) => {
  if (!bytes) return '';

  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;

  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;

  const gb = mb / 1024;
  return `${gb.toFixed(1)} GB`;
};

interface UpdateTaskParams {
  data: ProjectData | null;
  taskId: string;
  updatedData: Partial<Task>;
}

export const updateTaskStatus = ({
  data,
  taskId,
  updatedData,
}: UpdateTaskParams): { project: ProjectData; task: Task | null; parentTaskId?: string } => {
  let updatedTask: Task | null = null;
  // The top-level ancestor's id when the match is found nested inside a
  // children/tasks array, at any depth — undefined when the match is itself
  // top-level. Regular (non-custom) child tasks from the API don't reliably
  // carry their own `parentId`, so this is the only way callers can know a
  // match was nested and build the correctly-wrapped save payload for it.
  let parentTaskId: string | undefined;

  const updateTaskRecursive = (tasks: Task[], ancestorId?: string): Task[] => {
    return tasks.map((task) => {
      // Match found
      if (task._id === taskId) {
        updatedTask = {
          ...task,
          ...updatedData,
        };
        parentTaskId = ancestorId;

        return updatedTask;
      }

      if (task.children?.length) {
        return {
          ...task,
          children: updateTaskRecursive(task.children, ancestorId ?? task._id),
        };
      }

      if (task.tasks?.length) {
        return {
          ...task,
          tasks: updateTaskRecursive(task.tasks, ancestorId ?? task._id),
        };
      }

      return task;
    });
  };

  const updatedProject = {
    ...data,
    tasks: updateTaskRecursive(data?.tasks || []),
  };

  return {
    project: updatedProject as ProjectData,
    task: updatedTask,
    parentTaskId,
  };
};