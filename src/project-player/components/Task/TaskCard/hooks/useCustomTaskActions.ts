import { useState, useCallback, useRef, useEffect } from 'react';
import { useProjectStable } from '../../../../context/ProjectContext';
import { useLanguage } from '@contexts/LanguageContext';
import { useAlert } from '@ui';
import type { Task } from '../../../../types/project.types';

type ModalType = 'edit' | 'delete' | null;

export interface ModalState {
  type: ModalType;
  task?: Task;
}

export interface CustomTaskActionsResult {
  modalState: ModalState;
  openEditModal: () => void;
  openDeleteModal: () => void;
  closeModal: () => void;
  handleConfirmDelete: () => Promise<void>;
  confirmDeleteLoading: boolean;
}

// Uses useProjectStable() so custom task cards don't re-render on projectData changes.
export function useCustomTaskActions(task: Task): CustomTaskActionsResult {
  const { deleteTask } = useProjectStable();
  const { t } = useLanguage();
  const { showAlert } = useAlert();

  const [modalState, setModalState] = useState<ModalState>({ type: null });
  const [confirmDeleteLoading, setConfirmDeleteLoading] = useState(false);

  const taskRef = useRef(task);
  useEffect(() => { taskRef.current = task; });

  const openEditModal = useCallback(
    () => setModalState({ type: 'edit', task: taskRef.current }),
    [],
  );
  const openDeleteModal = useCallback(() => setModalState({ type: 'delete' }), []);
  const closeModal = useCallback(() => setModalState({ type: null }), []);

  const handleConfirmDelete = useCallback(async () => {
    if (!task?._id) return;
    setConfirmDeleteLoading(true);
    try {
      await deleteTask(task._id);
      closeModal();
      showAlert('success', t('projectPlayer.taskDeleted'));
    } catch (e) {
      showAlert('error', e instanceof Error ? e.message : t('common.serverError500'));
    } finally {
      setConfirmDeleteLoading(false);
    }
  }, [task?._id, deleteTask, closeModal, showAlert, t]);

  return {
    modalState,
    openEditModal,
    openDeleteModal,
    closeModal,
    handleConfirmDelete,
    confirmDeleteLoading,
  };
}
