import React, { memo } from 'react';
import AddCustomTaskModal from '../CustomTask/AddCustomTaskModal';
import type { Task } from '../../../types/project.types';

interface CustomTaskFormProps {
  isOpen: boolean;
  task: Task;
  onClose: () => void;
}

/**
 * Wraps AddCustomTaskModal in edit mode, isolating the form state so that
 * opening the edit form does not re-render the full task list.
 */
const CustomTaskForm = memo<CustomTaskFormProps>(({ isOpen, task, onClose }) => {
  if (!isOpen) return null;
  return (
    <AddCustomTaskModal
      isOpen={isOpen}
      onClose={onClose}
      task={task}
      mode="edit"
    />
  );
});

CustomTaskForm.displayName = 'CustomTaskForm';
export default CustomTaskForm;
