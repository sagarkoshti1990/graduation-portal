import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Button,
  ButtonText,
  ButtonSpinner,
  HStack,
  VStack,
  Text,
  Input,
  InputField,
  Textarea,
  TextareaInput,
} from '@gluestack-ui/themed';
import { LucideIcon, Modal, useAlert } from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';
import Select from '@ui/Inputs/Select';
import { useProjectContext } from '../../../context/ProjectContext';
import { Task } from '../../../types/project.types';
import { TASK_STATUS } from '../../../../constants/app.constant';
import { addCustomTaskModalStyles } from './styles';
import { AddCustomTaskModalProps } from 'src/project-player/types';
import { theme } from '@config/theme';
import { usePlatform } from '@utils/platform';
import { SERVICE_PROVIDER_LIST } from '@constants/PROFILE_MENU_OPTIONS';

// The Pillar select (rendered above Task Name) and the Instructions/Service
// Provider fields (rendered below Task Name) are heavy, non-memoized
// dropdown/portal components (`@ui/Inputs/Select`). Typing a single character
// into Task Name previously re-rendered all of them too via the shared
// `formData` object, which was slow enough to make the controlled Task Name
// TextInput drop keystrokes. Split out and memoized so a Task Name keystroke
// (which doesn't change any of these props) bails out of re-rendering them.
const PillarField = React.memo(function PillarField({
  t,
  pillars,
  shouldShowDropdown,
  selectedPillar,
  parentPillarName,
  propPillarId,
  onPillarChange,
}: {
  t: (key: string) => string;
  pillars: Array<{ label: string; value: string }>;
  shouldShowDropdown: boolean;
  selectedPillar?: string;
  parentPillarName?: string;
  propPillarId?: string;
  onPillarChange: (value: string) => void;
}) {
  return (
    <VStack {...addCustomTaskModalStyles.fieldStack}>
      {/* Label */}
      <Text {...TYPOGRAPHY.label} color="$textPrimary" fontWeight="$medium">
        {shouldShowDropdown && (
          <>
            {t('projectPlayer.selectPillar')}
            <Text color="$error500">*</Text>
          </>
        )}
      </Text>

      {shouldShowDropdown ? (
        <Select
          options={pillars}
          value={
            selectedPillar ??
            (parentPillarName
              ? {
                  label: parentPillarName,
                  value: propPillarId,
                }
              : undefined)
          }
          onChange={onPillarChange}
          placeholder={t('projectPlayer.selectPillarPlaceholder')}
          {...addCustomTaskModalStyles.select}
        />
      ) : (
        <HStack space="xs">
          <Text
            {...TYPOGRAPHY.paragraph}
            color="$textPrimary"
            fontWeight="$medium"
          >
            {t('projectPlayer.pillar')}:
          </Text>
          <Text {...TYPOGRAPHY.paragraph} color="$textPrimary">
            {parentPillarName}
          </Text>
        </HStack>
      )}
    </VStack>
  );
});

const TrailingFields = React.memo(function TrailingFields({
  t,
  fieldKey,
  instructionsDefaultValue,
  onInstructionsChangeText,
  serviceProvider,
  onServiceProviderChange,
}: {
  t: (key: string) => string;
  fieldKey: string;
  instructionsDefaultValue: string;
  onInstructionsChangeText: (value: string) => void;
  serviceProvider: string;
  onServiceProviderChange: (value: string) => void;
}) {
  return (
    <>
      {/* Instructions */}
      <VStack {...addCustomTaskModalStyles.fieldStack}>
        <Text {...TYPOGRAPHY.label} color="$textPrimary" fontWeight="$medium">
          {t('projectPlayer.instructions')}
        </Text>
        <Textarea {...addCustomTaskModalStyles.textarea} key={fieldKey}>
          <TextareaInput
            placeholder={t('projectPlayer.instructionsPlaceholder')}
            defaultValue={instructionsDefaultValue}
            onChangeText={onInstructionsChangeText}
            placeholderTextColor="$textMuted"
          />
        </Textarea>
      </VStack>

      {/* Service Provider Selection (Optional) */}
      <VStack {...addCustomTaskModalStyles.serviceProviderSection}>
        <HStack {...addCustomTaskModalStyles.serviceProviderHeader}>
          <LucideIcon
            name="Building2"
            size={16}
            color={theme.tokens.colors.primary500}
          />
          <Text
            {...TYPOGRAPHY.label}
            color="$textPrimary"
            fontWeight="$medium"
          >
            {t('projectPlayer.serviceProviderSelection')}
          </Text>
        </HStack>
        <Text {...TYPOGRAPHY.bodySmall} color="$textSecondary">
          {t('projectPlayer.serviceProvider')}
        </Text>
        <Select
          options={SERVICE_PROVIDER_LIST}
          value={serviceProvider}
          onChange={onServiceProviderChange}
          placeholder={t('projectPlayer.selectServiceProvider')}
          {...addCustomTaskModalStyles.select}
        />
      </VStack>
    </>
  );
});

export const AddCustomTaskModal: React.FC<AddCustomTaskModalProps> = ({
  isOpen,
  onClose,
  task,
  templateId: propPillarId,
  templateName: propPillarName,
  mode = 'add',
}) => {
  const { t } = useLanguage();
  const { showAlert } = useAlert();
  const {
    projectData,
    addTask,
    updateTask,
    mode: playerMode,
  } = useProjectContext();
  const { isMobile } = usePlatform();

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state — only the two dropdowns now. Task Name and Instructions are
  const [formData, setFormData] = useState({
    selectedPillar: undefined as string | undefined,
    serviceProvider: '',
  });

  // this is the only reset hook).
  const [formInstanceKey, setFormInstanceKey] = useState(0);

  const isEditMode = mode === 'edit' && !!task;
  const isPreviewMode = playerMode === 'preview';

  // refs (no re-render) so handleSubmit can read the latest value.
  const taskNameRef = useRef('');
  const instructionsRef = useRef('');
  // update for every other keystroke because the value didn't change.
  const [hasTaskName, setHasTaskName] = useState(false);
  // THIS render, before any effect from this render has had a chance to fire.
  const lastFieldKeyRef = useRef<string | null>(null);

  const handleTaskNameChangeText = useCallback((value: string) => {
    taskNameRef.current = value;
    setHasTaskName(!!value.trim());
  }, []);
  const handleInstructionsChangeText = useCallback((value: string) => {
    instructionsRef.current = value;
  }, []);

  // modal closes (formInstanceKey bump) or is aimed at a different task/pillar.
  const fieldKey = `${formInstanceKey}-${isEditMode ? task?._id ?? '' : propPillarId ?? ''}`;

  // change" render-time pattern.
  if (lastFieldKeyRef.current !== fieldKey) {
    lastFieldKeyRef.current = fieldKey;
    const initialTaskName = isEditMode && task ? task.name : '';
    const initialInstructions = isEditMode && task ? task.description || '' : '';
    taskNameRef.current = initialTaskName;
    instructionsRef.current = initialInstructions;
    const nonEmpty = !!initialTaskName.trim();
    if (hasTaskName !== nonEmpty) {
      setHasTaskName(nonEmpty);
    }
  }

  // Helper to update a dropdown field
  const updateFormField = useCallback(
    (field: keyof typeof formData, value: string) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    },
    [],
  );
  const handlePillarChange = useCallback(
    (value: string) => updateFormField('selectedPillar', value),
    [updateFormField],
  );
  const handleServiceProviderChange = useCallback(
    (value: string) => updateFormField('serviceProvider', value),
    [updateFormField],
  );

  // Get all pillars (project type tasks) for the dropdown - memoized
  const pillars = useMemo(() => {
    const source = projectData?.children?.length
      ? projectData.children
      : projectData?.tasks || [];

    return source.map((pillar: any) => ({
      label: `${pillar.name} (${pillar.children?.length || 0} ${t(
        'projectPlayer.tasks',
      )})`,
      value: pillar._id,
    }));
  }, [projectData?.tasks, projectData?.children, t]);

  // Find parent pillar for a task
  const findParentPillar = useCallback(
    (taskId: string): Task | undefined => {
      return pillars?.find(pillar => pillar.value === taskId);
    },
    [pillars],
  );
  // Populate the two dropdowns when editing, set pillar when adding, or reset
  useEffect(() => {
    if (isEditMode && task) {
      // Edit mode: populate with existing task data
      const parentPillar = findParentPillar(task._id);
      setFormData({
        selectedPillar: parentPillar?._id || '',
        serviceProvider: task.serviceProvider || '',
      });
    } else if (propPillarId) {
      // Add mode: set pillar if provided, reset other fields
      setFormData({
        selectedPillar: propPillarId,
        serviceProvider: '',
      });
    } else {
      // Reset everything if no pillar provided
      setFormData({ selectedPillar: '', serviceProvider: '' });
    }
  }, [isEditMode, task, propPillarId, findParentPillar, formInstanceKey]);

  const handleCloseModal = useCallback(() => {
    if (isSubmitting) return;
    // this same modal instance is reopened for the same task/pillar.
    setFormInstanceKey(k => k + 1);
    onClose();
  }, [isSubmitting, onClose]);

  const handleSubmit = useCallback(async () => {
    // from state — they were never written to formData while typing.
    const taskName = taskNameRef.current;
    const instructions = instructionsRef.current;
    const { serviceProvider, selectedPillar } = formData;
    const pillarIdToUse = propPillarId || selectedPillar;

    if (isEditMode && task) {
      // Update is always clickable (not gated on change detection) — apply the
      // same "name required" validation that used to disable the button here instead.
      if (!taskName.trim()) return;

      setIsSubmitting(true);
      try {
        await updateTask(task._id,projectData?.userProfile?.id , {
          name: taskName,
          description: instructions,
          serviceProvider: serviceProvider,
          parentId: task?.parentId,
          // pillarName: findParentPillar(task?.parentId || '')?.name,
        });
        showAlert("success",t('projectPlayer.customTaskUpdateSuccess'))
        handleCloseModal();
      } catch (e) {
        showAlert(
          'error',
          e instanceof Error ? e.message : t('common.serverError500'),
        );
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    const newTask: Task = {
      _id: uuidv4(),
      name: taskName,
      description: instructions,
      type: 'simple',
      externalId: uuidv4(),
      status: TASK_STATUS.TO_DO,
      isCustomTask: true,
      serviceProvider: serviceProvider || undefined,
      parentId: pillarIdToUse,
    };

    setIsSubmitting(true);
    try {
      await addTask(pillarIdToUse!, newTask);
      showAlert("success",t('projectPlayer.customTaskAddSuccess'));
      handleCloseModal();
    } catch (e) {
      showAlert(
        'error',
        e instanceof Error ? e.message : t('common.serverError500'),
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    formData,
    isEditMode,
    task,
    propPillarId,
    updateTask,
    addTask,
    handleCloseModal,
    // findParentPillar,
    t,
    showAlert,
    projectData?.userProfile?.id
  ]);

  const parentPillarName =
    propPillarName || findParentPillar(task?.parentId || '')?.label;

  const shouldShowDropdown = !isPreviewMode && !isEditMode;

  // Form validation: In preview mode, pillar is always provided. In edit mode, need to select pillar.
  const isFormValid = useMemo(
    () =>
      (isPreviewMode || propPillarId || formData.selectedPillar || parentPillarName) &&
      hasTaskName,
    [isPreviewMode, propPillarId, formData.selectedPillar, parentPillarName, hasTaskName],
  );

  // Update (edit mode) is always clickable — invalid input is caught inside
  // handleSubmit instead of disabling the button. Add mode keeps the existing
  // disable-until-valid behavior.
  const isSubmitDisabled = isEditMode ? isSubmitting : !isFormValid || isSubmitting;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCloseModal}
      confirmLoading={isSubmitting}
      headerTitle={
        isEditMode
          ? 'projectPlayer.editCustomTask'
          : 'projectPlayer.addCustomTask'
      }
      headerDescription={
        isEditMode
          ? 'projectPlayer.editCustomTaskSubtitle'
          : 'projectPlayer.addCustomTaskSubtitle'
      }
      headerAlignment="baseline"
      maxWidth={480}
      size="lg"
      footerContent={
        <HStack
          {...addCustomTaskModalStyles.footerButtons}
          flexDirection={isMobile ? 'column' : 'row'}
          space={isMobile ? 'sm' : 'md'} // spacing between buttons
          width="100%"
        >
          <Button
            {...addCustomTaskModalStyles.cancelButton}
            onPress={handleCloseModal}
            isDisabled={isSubmitting}
            width={isMobile ? '100%' : 'auto'}
          >
            <ButtonText color="$textPrimary" {...TYPOGRAPHY.button}>
              {t('common.cancel')}
            </ButtonText>
          </Button>

          {/* Submit Button */}
          <Button
            {...addCustomTaskModalStyles.submitButton}
            onPress={handleSubmit}
            isDisabled={isSubmitDisabled}
            opacity={isSubmitDisabled ? 0.5 : 1}
            width={isMobile ? '100%' : 'auto'}
          >
            <HStack {...addCustomTaskModalStyles.submitButtonContent}>
              {isSubmitting ? (
                <ButtonSpinner />
              ) : (
                <LucideIcon
                  name={isEditMode ? 'Check' : 'Plus'}
                  size={16}
                  color={theme.tokens.colors.backgroundPrimary.light}
                />
              )}
              <ButtonText
                color="$backgroundPrimary.light"
                {...TYPOGRAPHY.button}
              >
                {isEditMode
                  ? t('projectPlayer.updateTask')
                  : t('projectPlayer.addCustomTask')}
              </ButtonText>
            </HStack>
          </Button>
        </HStack>
      }
    >
      {/* Modal Body - Form Fields */}
      <VStack {...addCustomTaskModalStyles.formStack}>
        <PillarField
          t={t}
          pillars={pillars}
          shouldShowDropdown={shouldShowDropdown}
          selectedPillar={formData.selectedPillar}
          parentPillarName={parentPillarName}
          propPillarId={propPillarId}
          onPillarChange={handlePillarChange}
        />

        {/* Task Name */}
        <VStack {...addCustomTaskModalStyles.fieldStack}>
          <Text {...TYPOGRAPHY.label} color="$textPrimary" fontWeight="$medium">
            {t('projectPlayer.taskName')} <Text color="$error500">*</Text>
          </Text>
          <Input {...addCustomTaskModalStyles.input} key={fieldKey}>
            <InputField
              placeholder={t('projectPlayer.taskNamePlaceholder')}
              defaultValue={taskNameRef.current}
              onChangeText={handleTaskNameChangeText}
              placeholderTextColor="$textMuted"
            />
          </Input>
        </VStack>

        <TrailingFields
          t={t}
          fieldKey={fieldKey}
          instructionsDefaultValue={instructionsRef.current}
          onInstructionsChangeText={handleInstructionsChangeText}
          serviceProvider={formData.serviceProvider}
          onServiceProviderChange={handleServiceProviderChange}
        />
      </VStack>
    </Modal>
  );
};

export default AddCustomTaskModal;
