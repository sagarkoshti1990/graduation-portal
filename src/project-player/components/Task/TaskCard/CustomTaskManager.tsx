import React, { memo } from 'react';
import { HStack, Pressable, Box } from '@ui';
import { Text } from '@ui';
import Modal from '@ui/Modal';
import { LucideIcon } from '@ui/index';
import { theme } from '@config/theme';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';
import { useLanguage } from '@contexts/LanguageContext';
import { useCustomTaskActions } from './hooks/useCustomTaskActions';
import CustomTaskForm from './CustomTaskForm';
import { taskCardStyles } from './styles';
import type { Task } from '../../../types/project.types';

interface CustomTaskManagerProps {
  task: Task;
  isLastTask?: boolean;
  isChildOfProject?: boolean;
  isOnboardingTask?: boolean;
  /** The task display rendered by the parent (SimpleObservationTask). */
  children: (customActions: React.ReactNode) => React.ReactNode;
}

function renderCustomTaskActions({ isCustomTask, onEdit, onDelete }: { isCustomTask: boolean; onEdit: () => void; onDelete: () => void; }): React.ReactElement | null {
  if (!isCustomTask) return null;
  return (
    <HStack {...taskCardStyles.customActionsContainer}>
      <Pressable onPress={onEdit}>
        <Box {...taskCardStyles.editActionBox} sx={{ ':hover': { bg: taskCardStyles.editActionBox.hoverBg } }}>
          <LucideIcon name="Pencil" size={16} color={theme.tokens.colors.primary500} />
        </Box>
      </Pressable>
      <Pressable onPress={onDelete}>
        <Box {...taskCardStyles.deleteActionBox} sx={{ ':hover': { bg: taskCardStyles.deleteActionBox.hoverBg } }}>
          <LucideIcon name="Trash2" size={16} color={theme.tokens.colors.primary500} />
        </Box>
      </Pressable>
    </HStack>
  );
}

/**
 * Manages edit/delete lifecycle for custom tasks.
 * Renders the task via the `children` render prop, passing in the
 * edit/delete action buttons so they can be placed at the correct
 * position inside the task layout.
 */
const CustomTaskManager = memo<CustomTaskManagerProps>(
  ({ task, children }) => {
    const { t } = useLanguage();
    const {
      modalState,
      openEditModal,
      openDeleteModal,
      closeModal,
      handleConfirmDelete,
      confirmDeleteLoading,
    } = useCustomTaskActions(task);

    const customActions = renderCustomTaskActions({
      isCustomTask: true,
      onEdit: openEditModal,
      onDelete: openDeleteModal,
    });

    return (
      <>
        {children(customActions)}

        {/* Edit form — isolated so its state doesn't cause list re-renders */}
        <CustomTaskForm
          isOpen={modalState.type === 'edit' && !!modalState.task}
          task={modalState.task ?? task}
          onClose={closeModal}
        />

        {/* Delete confirmation */}
        <Modal
          isOpen={modalState.type === 'delete'}
          onClose={closeModal}
          headerTitle={t('projectPlayer.deleteTask')}
          confirmButtonText={t('common.delete')}
          cancelButtonText={t('common.cancel')}
          onConfirm={handleConfirmDelete}
          confirmLoading={confirmDeleteLoading}
          confirmButtonColor={theme.tokens.colors.primary500}
        >
          <Text {...TYPOGRAPHY.paragraph} color="$textSecondary">
            {t('projectPlayer.confirmDeleteTask', { taskName: task?.name })}
          </Text>
        </Modal>
      </>
    );
  },
);

CustomTaskManager.displayName = 'CustomTaskManager';
export default CustomTaskManager;
