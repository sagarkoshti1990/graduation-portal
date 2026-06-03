import React, {
  memo,
  useState,
  useMemo,
  useCallback,
} from 'react';
import {
  Box,
  Spinner,
  useAlert,
} from '@ui';
import { useProjectContext } from '../../../../context/ProjectContext';
import { useTaskActions } from '../../../../hooks/useTaskActions';
import { useLanguage } from '@contexts/LanguageContext';
import {
  TASK_STATUS,
  STATUS,
} from '../../../../../constants/app.constant';
import { taskCardStyles } from '../styles';
import FileUploadModal from '../../FileEvidence/FileUploadModal';
import EvidencePreviewModal from '../../FileEvidence/EvidencePreviewModal';
import { usePlatform } from '@utils/platform';
import { getSolutionDetails } from '../../../../services/projectPlayerService';
import { isNetworkOffline } from '../../../../../services/dataService';
import logger from '@utils/logger';
import { useAuth } from '@contexts/AuthContext';
import {
  createOrUpdateProgramUserMapping,
  updateEntityDetails,
} from '../../../../../services/participantService';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useProjectStable } from '../../../../context/ProjectContext';
import { useTaskPermissions } from '../hooks/useTaskPermissions';
import { useTaskStatus } from '../hooks/useTaskStatus';
import {
  getActionIconName,
  getUploadConfig,
} from '../utils/taskStatusUtils';
import { filterNewFiles, buildOnboardingFileUpdate } from '../utils/taskTransformers';
import type { Task } from '../../../../types/project.types';
import StatusIndicator from './StatusIndicator';
import TaskInfo from './TaskInfo';
import ActionButton from './ActionButton';
import MainContent from './MainContent';

// ─────────────────────────────────────────────────────────────────────────────

export interface SimpleObservationTaskProps {
  task: Task;
  isLastTask?: boolean;
  isChildOfProject?: boolean;
  isOnboardingTask?: boolean;
  /** Edit/delete action buttons injected by CustomTaskManager. */
  extraActions?: React.ReactNode;
  parentIndex?:number;
  index?:number;
  projectContext?:any
}

const SimpleObservationTask : React.FC<SimpleObservationTaskProps> = ({
  task,
  projectContext,
  isLastTask = false,
  isChildOfProject = false,
  isOnboardingTask = false,
  extraActions,
  parentIndex,
  index
}) => {
  // config comes from the prop; projectData._id is read from the ref at
  // action time only (handleTaskClick) — no subscription to live projectData.
  const { config,projectDataRef } = projectContext;
  const route = useRoute();
  const navigation = useNavigation();
  const { handleStatusChange, handleAddToPlan } = useTaskActions();
  const { isWeb, isMobile } = usePlatform();
  const { t } = useLanguage();
  const { showAlert } = useAlert();
  const { user } = useAuth();

  const participantId = (route.params as any)?.id;

  const { isReadOnly, isPreview, isEdit, isInterventionPlanEditMode } =
    useTaskPermissions(isChildOfProject);

  const {
    isCompleted, isObservationTask, hasUploadedFiles, isEvidenceRequired,
    isTaskDone, isOnboardingCompletedUI, isManualToggleDisabled,
    isAddedToPlan, setIsAddedToPlan, isRejected, setIsRejected,
  } = useTaskStatus(task, isOnboardingTask);

  // ── Local state ──────────────────────────────────────────────────────────
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);

  // ── Derived values ────────────────────────────────────────────────────────

  const uiConfig = useMemo(
    () => ({
      showAsCard: isChildOfProject,
      showAsInline: !isChildOfProject || isPreview,
      showCheckbox: isChildOfProject && !isPreview,
      showActionButton: !isPreview || task?.isDeletable,
      isInteractive: isEdit,
    }),
    [isChildOfProject, isPreview, isEdit, task?.isDeletable],
  );

  const onboardingTextStyle = useMemo(
    () => ({ textDecorationLine: 'none' as const, opacity: isOnboardingCompletedUI ? 0.6 : 1 }),
    [isOnboardingCompletedUI],
  );

  const onboardingDescStyle = useMemo(
    () => ({ opacity: isOnboardingCompletedUI ? 0.6 : 1 }),
    [isOnboardingCompletedUI],
  );

  const actionIconName = useMemo(() => getActionIconName(task), [task.metaInformation?.icon, task.type]);

  const uploadConfig = useMemo(
    () => getUploadConfig(task, isOnboardingTask),
    [isOnboardingTask, task?.referenceId, task?.metaInformation?.maxFiles, task?.metaInformation?.allowedFileTypes],
  );

  // ── Callbacks ─────────────────────────────────────────────────────────────

  const showSuccess = useCallback((msg: string) => showAlert('success', msg), [showAlert]);
  const showError = useCallback((msg: string) => showAlert('error', msg), [showAlert]);

  const updateAddToPlan = useCallback(
    (added: boolean) => { handleAddToPlan(task._id, added); setIsAddedToPlan(added); },
    [handleAddToPlan, task._id],
  );
  const handleAcceptTask = useCallback(() => { updateAddToPlan(true); setIsRejected(false); }, [updateAddToPlan]);
  const handleRejectTask = useCallback(() => { updateAddToPlan(false); setIsRejected(true); }, [updateAddToPlan]);

  const handleTaskClick = useCallback(async () => {
    if (!isEdit) return;
    if (isObservationTask) {
      // Read project ID from ref at action time — no subscription needed.
      const projectTemplateId = projectDataRef.current?._id;
      if (!participantId || !projectTemplateId) { console.error('Missing userId or projectTemplateId'); return; }
      if (isNetworkOffline()) {
        const offlineSolutionId: string =
          task.solutionDetails?._id ?? (task.solutionDetails as any)?.observationId ?? (task.solutionDetails as any)?.id ?? '';
        if (offlineSolutionId) {
          // @ts-ignore
          navigation.navigate('observation', { id: participantId, solutionId: offlineSolutionId, submissionNumber: 1, taskId: task._id });
        } else { showAlert('error', t('projectPlayer.unableToLoadObservation')); }
        return;
      }
      setIsStatusUpdating(true);
      try {
        const solutionDetails = await getSolutionDetails(projectTemplateId, task._id);
        if (solutionDetails?.data?._id) {
          // @ts-ignore
          navigation.navigate('observation', { id: participantId, solutionId: solutionDetails.data._id, submissionNumber: 1, taskId: task._id });
        } else { showAlert('error', t('projectPlayer.unableToLoadObservation')); }
      } catch (error) {
        console.error('getSolutionDetails API failed:', error);
        showAlert('error', t('projectPlayer.unableToLoadObservation'));
      } finally {
        setIsStatusUpdating(false);
      }
    } else {
      setShowUploadModal(true);
    }
  }, [isEdit, isObservationTask, task._id, task.solutionDetails, participantId, projectDataRef, navigation, showAlert, t, setIsStatusUpdating]);

  const handleCheckboxChange = useCallback(async (checked: boolean) => {
    if (!isEdit) return;
    setIsStatusUpdating(true);
    try {
      await handleStatusChange({taskId:task._id,parentIndex,index}, checked ? TASK_STATUS.COMPLETED : TASK_STATUS.TO_DO);
    } finally {
      setIsStatusUpdating(false);
     }
  }, [isEdit, task._id,parentIndex,index, handleStatusChange]);
  
  const handleTitlePress = useCallback(() => {
    if (!isManualToggleDisabled) handleCheckboxChange(!isCompleted);
  }, [isManualToggleDisabled, handleCheckboxChange, isCompleted]);

  const updateEntityFile = useCallback(async (data: any) => {
    if (data?.success) {
      const attachedFiles = data?.data?.attachments?.map((f: any) => f) ?? [];
      const thisDate = new Date().toISOString();
      if (isOnboardingTask && attachedFiles.length > 0) {
        const updates = buildOnboardingFileUpdate(task, attachedFiles, thisDate);
        if (updates) {
          if (!user?.id || !participantId) { showError(t('projectPlayer.evidenceUploadFailed')); return; }
          try {
            await updateEntityDetails({ userId: `${user?.id}`, entityId: participantId, entityUpdates: updates });
            await createOrUpdateProgramUserMapping({ userId: participantId, programId: process.env.GLOBAL_LC_PROGRAM_ID, metaInformation: updates, status: STATUS.NOT_ONBOARDED });
          } catch { showError(t('projectPlayer.evidenceUploadFailed')); return; }
        }
      }
      showSuccess(t('projectPlayer.evidenceUploaded'));
      setShowUploadModal(false);
    } else {
      showError(t('projectPlayer.evidenceUploadFailed'));
    }
  }, [isOnboardingTask, task, user?.id, participantId, showError, showSuccess, t]);

  const handleUploadConfirm = useCallback(async (files?: any[]) => {
    if (!files?.length) return;
    setIsStatusUpdating(true);
    try {
      const newFiles = filterNewFiles(files, task?.attachments);
      const data = await handleStatusChange(
        {taskId:task._id,parentIndex,index}, TASK_STATUS.COMPLETED, newFiles,
        uploadConfig.maxFiles && uploadConfig.maxFiles > 1 ? task?.attachments : [],
      );
      if (!isNetworkOffline()) await updateEntityFile(data);
    } finally { setIsStatusUpdating(false); }
  }, [task._id,parentIndex,index, task?.attachments, handleStatusChange, uploadConfig.maxFiles, updateEntityFile]);

  const handleCloseUploadModal = useCallback(() => setShowUploadModal(false), []);
  const handleClosePreviewModal = useCallback(() => setShowPreviewModal(false), []);
  const handleOpenPreviewModal = useCallback(() => setShowPreviewModal(true), []);
  const handleUploadMethodSelect = useCallback((method: any) => logger.info('Upload method:', method), []);

  // ── Render functions ──────────────────────────────────────────────────────

  const statusIndicator = useMemo(() => (
    <StatusIndicator
      isInterventionPlanEditMode={isInterventionPlanEditMode}
      isObservationTask={isObservationTask}
      isEvidenceRequired={isEvidenceRequired}
      isStatusUpdating={isStatusUpdating}
      isTaskDone={isTaskDone}
      showCheckbox={uiConfig.showCheckbox}
      isCompleted={isCompleted}
      onCheckboxChange={handleCheckboxChange}
      isReadOnly={isReadOnly}
      taskId={task._id}
      taskName={task?.name ?? ''}
      isOptional={!!task?.isDeletable}
      isOnboardingTask={isOnboardingTask}
      isChildOfProject={isChildOfProject}
      isPreview={isPreview}
      isAddedToPlan={isAddedToPlan}
      isRejected={isRejected}
      t={t}
    />
  ), [
    isInterventionPlanEditMode, isObservationTask, isEvidenceRequired,
    isStatusUpdating, isTaskDone, uiConfig.showCheckbox, isCompleted,
    handleCheckboxChange, isReadOnly, task._id, task?.name, task?.isDeletable,
    isOnboardingTask, isChildOfProject, isPreview, isAddedToPlan, isRejected, t,
  ]);

  const taskInfo = useMemo(() => (
    <TaskInfo
      task={task}
      isPreview={isPreview}
      isReadOnly={isReadOnly}
      isWeb={isWeb}
      isCompleted={isCompleted}
      showCheckbox={uiConfig.showCheckbox}
      showAsCard={uiConfig.showAsCard}
      isInterventionPlanEditMode={isInterventionPlanEditMode}
      isObservationTask={isObservationTask}
      isEvidenceRequired={isEvidenceRequired}
      isManualToggleDisabled={isManualToggleDisabled}
      isStatusUpdating={isStatusUpdating}
      isTaskDone={isTaskDone}
      handleTaskClick={handleTaskClick}
      handleTitlePress={handleTitlePress}
      handleOpenPreviewModal={handleOpenPreviewModal}
      doneText={t('projectPlayer.done')}
      toDoText={t('projectPlayer.toDo')}
      evidenceRequiredText={t('projectPlayer.evidenceRequired')}
      completeFormText={t('projectPlayer.completeFormToMarkDone')}
      uploadEvidenceText={t('projectPlayer.uploadEvidenceToMarkDone')}
      fileText={t('projectPlayer.file')}
      filesText={t('projectPlayer.files')}
    />
  ), [
    task, isPreview, isReadOnly, isWeb, isCompleted, uiConfig.showCheckbox, uiConfig.showAsCard,
    isInterventionPlanEditMode, isObservationTask, isEvidenceRequired,
    isManualToggleDisabled, isStatusUpdating, isTaskDone,
    handleTaskClick, handleTitlePress, handleOpenPreviewModal, t
  ]);

  const actionButton = useMemo(() => (
    <ActionButton
      showActionButton={uiConfig.showActionButton}
      isPreview={isPreview}
      isOptional={!!task?.isDeletable}
      isAddedToPlan={isAddedToPlan}
      isRejected={isRejected}
      isReadOnly={isReadOnly}
      isStatusUpdating={isStatusUpdating}
      isWeb={isWeb}
      showAsCard={uiConfig.showAsCard}
      isOnboardingTask={isOnboardingTask}
      isEdit={isEdit}
      actionIconName={actionIconName}
      handleTaskClick={handleTaskClick}
      handleAcceptTask={handleAcceptTask}
      handleRejectTask={handleRejectTask}
      buttonLabel={task.metaInformation?.buttonLabel}
      uploadText={t('projectPlayer.upload')}
    />
  ), [
    uiConfig.showActionButton, uiConfig.showAsCard, isPreview, task?.isDeletable,
    task.metaInformation?.buttonLabel, isAddedToPlan, isRejected, isReadOnly,
    isStatusUpdating, isWeb, isOnboardingTask, isEdit, actionIconName,
    handleTaskClick, handleAcceptTask, handleRejectTask, t,
  ]);

  const renderDivider = useCallback(() => {
    if (isLastTask) return null;
    return (
      <Box {...taskCardStyles.divider}
        marginVertical={!isWeb ? '$2' : isChildOfProject && isPreview ? '$1' : undefined}
        marginHorizontal={!isChildOfProject ? '$5' : undefined}
      />
    );
  }, [isLastTask, isWeb, isChildOfProject, isPreview]);
  
  return (
    <>
      <MainContent
        isOnboardingTask={isOnboardingTask}
        isLastTask={isLastTask}
        isMobile={isMobile}
        isWeb={isWeb}
        task={task}
        onboardingTextStyle={onboardingTextStyle}
        onboardingDescStyle={onboardingDescStyle}
        showAsCard={uiConfig.showAsCard}
        isEdit={isEdit}
        isPreview={isPreview}
        isAddedToPlan={isAddedToPlan}
        isRejected={isRejected}
        isInterventionPlanEditMode={isInterventionPlanEditMode}
        isChildOfProject={isChildOfProject}
        statusIndicator={statusIndicator}
        taskInfo={taskInfo}
        actionButton={actionButton}
        extraActions={extraActions}
      />
      {!uiConfig.showAsCard && !isOnboardingTask && renderDivider()}
      <FileUploadModal
        isOpen={showUploadModal} onClose={handleCloseUploadModal}
        taskName={task?.name}
        participantName={!isChildOfProject ? config.profileInfo?.name : undefined}
        existingAttachments={task?.attachments}
        maxFileUploadCount={uploadConfig.maxFiles}
        allowedFileTypes={uploadConfig.allowedFileTypes}
        onUpload={handleUploadMethodSelect}
        onConfirm={handleUploadConfirm}
      />
      <EvidencePreviewModal
        isOpen={showPreviewModal} onClose={handleClosePreviewModal}
        taskName={task?.name} attachments={task?.attachments || []}
      />
    </>
  );
}

SimpleObservationTask.displayName = 'SimpleObservationTask';

export default memo(SimpleObservationTask);