import { useState, useCallback } from 'react';
import { useProjectContext } from '../../../../context/ProjectContext';
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

export function useCustomTaskActions(task: Task): CustomTaskActionsResult {
  const { deleteTask } = useProjectContext();
  const { t } = useLanguage();
  const { showAlert } = useAlert();

  const [modalState, setModalState] = useState<ModalState>({ type: null });
  const [confirmDeleteLoading, setConfirmDeleteLoading] = useState(false);

  const showSuccess = useCallback((msg: string) => showAlert('success', msg), [showAlert]);
  const showError = useCallback((msg: string) => showAlert('error', msg), [showAlert]);

  const openEditModal = useCallback(() => setModalState({ type: 'edit', task }), [task]);
  const openDeleteModal = useCallback(() => setModalState({ type: 'delete' }), []);
  const closeModal = useCallback(() => setModalState({ type: null }), []);

  const handleConfirmDelete = useCallback(async () => {
    if (!task?._id) return;
    setConfirmDeleteLoading(true);
    try {
      await deleteTask(task._id);
      closeModal();
      showSuccess(t('projectPlayer.taskDeleted'));
    } catch (e) {
      showError(e instanceof Error ? e.message : t('common.serverError500'));
    } finally {
      setConfirmDeleteLoading(false);
    }
  }, [task?._id, deleteTask, closeModal, showSuccess, showError, t]);

  return {
    modalState,
    openEditModal,
    openDeleteModal,
    closeModal,
    handleConfirmDelete,
    confirmDeleteLoading,
  };
}
