import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  ButtonText,
  Checkbox,
  CheckboxIndicator,
  CheckboxIcon,
} from '@ui';
import { Pressable } from 'react-native';
import { LucideIcon } from '@ui/index';
import {
  RenderActionButtonProps,
  RenderCustomTaskActionsProps,
  RenderDividerProps,
  RenderFileInputProps,
  RenderModalsProps,
  RenderStatusIndicatorProps,
  RenderTaskInfoProps,
} from '../../../types/project.types';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';
import { theme } from '@config/theme';
import { taskCardStyles } from '../TaskCard/styles';
import { getStatusCircleColor, getCompletedTaskTextStyle } from './helpers';
import Modal from '@ui/Modal';
import AddCustomTaskModal from '../CustomTask/AddCustomTaskModal';

export const renderFileInput = ({
  fileInputRef,
  taskType,
  isWeb,
  handleFileSelect,
  isEdit,
  isUploading,
}: RenderFileInputProps): React.ReactElement | null => {
  if (taskType !== 'file') return null;
  if (!isWeb) return null;
  return (
    <input
      ref={fileInputRef}
      type="file"
      multiple
      onChange={handleFileSelect}
      style={taskCardStyles.hiddenInput}
      accept="*/*"
      disabled={!isEdit || isUploading}
    />
  );
};

/**
 * Render task status indicator (circle or checkbox)
 */
export const renderStatusIndicator = ({
  showCheckbox,
  taskId,
  isCompleted,
  handleCheckboxChange,
  isReadOnly,
  isChildOfProject,
}: RenderStatusIndicatorProps): React.ReactElement => {
  if (showCheckbox) {
    return (
      <Checkbox
        value={taskId}
        isChecked={isCompleted}
        onChange={handleCheckboxChange}
        isDisabled={isReadOnly}
        size="md"
        aria-label={`Mark task as ${isCompleted ? 'incomplete' : 'complete'}`}
        opacity={isReadOnly ? 0.6 : 1}
      >
        <CheckboxIndicator
          borderColor={isCompleted ? '$primary500' : '$textMuted'}
          bg={isCompleted ? '$primary500' : '$backgroundPrimary.light'}
        >
          <CheckboxIcon color="$backgroundPrimary.light">
            <LucideIcon
              name="Check"
              size={12}
              color={theme.tokens.colors.backgroundPrimary.light}
              strokeWidth={3}
            />
          </CheckboxIcon>
        </CheckboxIndicator>
      </Checkbox>
    );
  }

  // Simple status circle
  const circleSize = 24;
  const checkSize = 14;
  const circleColor = getStatusCircleColor(isChildOfProject, isCompleted);

  return (
    <Box
      width={circleSize}
      height={circleSize}
      {...taskCardStyles.statusCircle}
      borderColor={circleColor}
      bg={
        isCompleted && !isChildOfProject
          ? '$accent200'
          : '$backgroundPrimary.light'
      }
    >
      {(isCompleted || isChildOfProject) && (
        <LucideIcon
          name="Check"
          size={checkSize}
          color={
            isChildOfProject
              ? theme.tokens.colors.primary500
              : theme.tokens.colors.backgroundPrimary.light
          }
          strokeWidth={3}
        />
      )}
    </Box>
  );
};

/**
 * Render task information (name and description)
 */
export const renderTaskInfo = ({
  showCheckbox,
  isCompleted,
  showAsCard,
  taskName,
  taskDescription,
}: RenderTaskInfoProps): React.ReactElement => {
  const textStyle = showCheckbox ? getCompletedTaskTextStyle(isCompleted) : {};
  const titleTypography = showAsCard ? TYPOGRAPHY.h4 : TYPOGRAPHY.h3;

  return (
    <VStack flex={1} space="xs">
      <Text {...titleTypography} color="$textPrimary" {...textStyle}>
        {taskName}
      </Text>
      {taskDescription && (
        <Text
          {...(showAsCard ? TYPOGRAPHY.bodySmall : TYPOGRAPHY.paragraph)}
          color="$textSecondary"
          lineHeight="$lg"
          {...textStyle}
        >
          {taskDescription}
        </Text>
      )}
    </VStack>
  );
};

/**
 * Render action button
 */
export const renderActionButton = ({
  showActionButton,
  showAsCard,
  isUploading,
  handleTaskClick,
  isReadOnly,
  isEdit,
  metaInfo,
}: RenderActionButtonProps): React.ReactElement | null => {
  if (!showActionButton) return null;

  const buttonStyles = showAsCard
    ? taskCardStyles.actionButtonCard
    : taskCardStyles.actionButtonInline;

  const iconName = metaInfo?.icon;

  return (
    <Button
      {...taskCardStyles.actionButton}
      onPress={handleTaskClick}
      isDisabled={isReadOnly || isUploading}
      borderRadius={showAsCard ? undefined : 10}
      borderColor={buttonStyles.borderColor}
      opacity={isReadOnly || isUploading ? 0.5 : 1}
      sx={{
        ':hover': {
          bg: isEdit ? buttonStyles.hoverBg : 'transparent',
          borderColor: '$primary500',
        },
      }}
    >
      <HStack space="xs" alignItems="center">
        {iconName && (
          <LucideIcon
            name={iconName}
            size={16}
            color={theme.tokens.colors.textSecondary}
          />
        )}
        <ButtonText
          {...TYPOGRAPHY.button}
          {...taskCardStyles.actionButtonText}
          fontSize={showAsCard ? '$sm' : undefined}
          sx={{
            ':hover': {
              color: taskCardStyles.actionButtonTextHover.color,
            },
          }}
        >
          {metaInfo.buttonLabel}
        </ButtonText>
      </HStack>
    </Button>
  );
};

/**
 * Render divider
 */
export const renderDivider = ({
  isLastTask,
  isChildOfProject,
  isPreview,
}: RenderDividerProps): React.ReactElement | null => {
  if (isLastTask) return null;

  return (
    <Box
      {...taskCardStyles.divider}
      marginVertical={isChildOfProject && isPreview ? '$1' : undefined}
      marginHorizontal={!isChildOfProject ? '$5' : undefined}
    />
  );
};

/**
 * Render edit/delete actions for custom tasks
 */
export const renderCustomTaskActions = ({
  isCustomTask,
  onEdit,
  onDelete,
}: RenderCustomTaskActionsProps): React.ReactElement | null => {
  if (!isCustomTask) return null;

  return (
    <HStack {...taskCardStyles.customActionsContainer}>
      {/* Edit Icon */}
      <Pressable onPress={onEdit}>
        <Box
          {...taskCardStyles.editActionBox}
          sx={{
            ':hover': {
              bg: taskCardStyles.editActionBox.hoverBg,
            },
          }}
        >
          <LucideIcon
            name="Pencil"
            size={16}
            color={theme.tokens.colors.primary500}
          />
        </Box>
      </Pressable>

      {/* Delete Icon */}
      <Pressable onPress={onDelete}>
        <Box
          {...taskCardStyles.deleteActionBox}
          sx={{
            ':hover': {
              bg: taskCardStyles.deleteActionBox.hoverBg,
            },
          }}
        >
          <LucideIcon
            name="Trash2"
            size={16}
            color={theme.tokens.colors.primary500}
          />
        </Box>
      </Pressable>
    </HStack>
  );
};

/**
 * Render modals (edit and delete confirmation)
 */
export const renderModals = ({
  modalState,
  onCloseModal,
  onConfirmDelete,
  confirmDeleteLoading = false,
  taskName,
  t,
}: RenderModalsProps): React.ReactElement => {
  return (
    <>
      {/* Edit Task Modal */}
      {modalState.type === 'edit' && modalState.task && (
        <AddCustomTaskModal
          isOpen={true}
          onClose={onCloseModal}
          task={modalState.task}
          mode="edit"
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Modal
        isOpen={modalState.type === 'delete'}
        onClose={onCloseModal}
        headerTitle={t('projectPlayer.deleteTask')}
        confirmButtonText={t('common.delete')}
        cancelButtonText={t('common.cancel')}
        onConfirm={onConfirmDelete}
        confirmLoading={confirmDeleteLoading}
        confirmButtonColor={theme.tokens.colors.primary500}
      >
        <Text {...TYPOGRAPHY.paragraph} color="$textSecondary">
          {t('projectPlayer.confirmDeleteTask', { taskName })}
        </Text>
      </Modal>
    </>
  );
};
