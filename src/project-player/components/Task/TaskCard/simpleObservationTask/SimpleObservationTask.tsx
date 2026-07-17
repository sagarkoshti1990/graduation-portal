import React, {
  memo,
  useState,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import {
  Modal,
  Text,
  useAlert,
} from '@ui';
import { useTaskActions } from '../../../../hooks/useTaskActions';
import { useLanguage } from '@contexts/LanguageContext';
import {
  TASK_STATUS,
  STATUS,
} from '../../../../../constants/app.constant';
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
import { useTaskPermissions } from '../hooks/useTaskPermissions';
import { useTaskStatus } from '../hooks/useTaskStatus';
import {
  getActionIconName,
  getUploadConfig,
} from '../utils/taskStatusUtils';
import { filterNewFiles, buildOnboardingFileUpdate } from '../utils/taskTransformers';
import type { Task } from '../../../../types/project.types';
import MainContent from './MainContent';
import { getComparableFileKey } from '../../FileEvidence/FileUploadModal';

// ─────────────────────────────────────────────────────────────────────────────

export interface SimpleObservationTaskProps {
  task: Task;
  isLastTask?: boolean;
  isChildOfProject?: boolean;
  isOnboardingTask?: boolean;
  /** Edit/delete action buttons injected by CustomTaskManager. */
  extraActions?: React.ReactNode;
  parentIndex?: number;
  index?: number;
  projectContext?: any;
}

const SimpleObservationTask: React.FC<SimpleObservationTaskProps> = ({
  task,
  projectContext,
  isLastTask = false,
  isChildOfProject = false,
  isOnboardingTask = false,
  extraActions,
  parentIndex,
  index,
}) => {
  // config comes from the prop; projectData._id is read from the ref at
  // action time only (handleTaskClick) — no subscription to live projectData.
  const { config, projectDataRef: proData } = projectContext;
  const projectDataRef = proData?.current || proData;
  const route = useRoute();
  const navigation = useNavigation();
  const { handleStatusChange, handleAddToPlanBulk } = useTaskActions();
  const { isWeb, isMobile } = usePlatform();
  const { t } = useLanguage();
  const { showAlert } = useAlert();
  const { user } = useAuth();

  const participantId = (route.params as any)?.id;

  const { isReadOnly, isPreview, isEdit, isInterventionPlanEditMode } =
    useTaskPermissions(isChildOfProject);

  const {
    isCompleted, isObservationTask, isEvidenceRequired,
    isOnboardingCompletedUI, isManualToggleDisabled,
    isAddedToPlan, isRejected, isSyncTaskId,
  } = useTaskStatus(task, isOnboardingTask);

  // ── Local state ──────────────────────────────────────────────────────────
  const handleTitlePressRef = useRef<((args: { checkFirstTaskComplete?: any }) => void) | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean | {name:string,fun: ((data:{checkFirstTaskComplete: boolean}) => Promise<void>)}>(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);

  // ── Derived values ────────────────────────────────────────────────────────

  const showCheckbox = useMemo(
    () => isChildOfProject && !isPreview,
    [isChildOfProject, isPreview],
  );

  const showActionButton = useMemo(
    () => !isPreview || !!task?.isDeletable,
    [isPreview, task],
  );

  const actionIconName = useMemo(
    () => getActionIconName(task),
    [task.metaInformation?.icon, task.type],
  );

  const uploadConfig = useMemo(
    () => getUploadConfig(task, isOnboardingTask),
    [isOnboardingTask, task?.referenceId, task?.metaInformation?.maxFiles, task?.metaInformation?.allowedFileTypes],
  );

  // ── Callbacks ─────────────────────────────────────────────────────────────

  const showSuccess = useCallback((msg: string) => showAlert('success', msg), [showAlert]);
  const showError = useCallback((msg: string) => showAlert('error', msg), [showAlert]);

  const updateAddToPlan = useCallback(
    (added: boolean) => {
      // Resolve the ref at call-time so we always read the latest data.
      const data: any = proData?.current ?? proData;
      const parentTasks: any[] = data?.children || data?.tasks || [];
      const parentData = parentTasks.find((item: any) => item?.tasks?.find((item2: any) => item2._id === task._id));
      const siblingTasks: any[] = parentData?.children || parentData?.tasks || [];
      const taskIdsToUpdate = [
        task._id,
        ...siblingTasks
          .filter((item: any) => item?.metaInformation?.syncTaskIds?.includes(task._id))
          .map((item: any) => item._id),
      ];
      handleAddToPlanBulk(taskIdsToUpdate, added);
    },
    [handleAddToPlanBulk, task._id, proData],
  );
  const handleAcceptTask = useCallback(() => updateAddToPlan(true), [updateAddToPlan]);
  const handleRejectTask = useCallback(() => updateAddToPlan(false), [updateAddToPlan]);

// check pathway confirmation befor any task compeltion first time
  const handleCheckFirstTaskComplete = useCallback((canChangePathway: boolean | ((checkFirstTaskComplete?: any) => Promise<void>)) => {
    if (task.parentId !== undefined && typeof canChangePathway !== "boolean") {
      // Read the ref at call time so we always see the latest projectData,
      // even when this component hasn't re-rendered since a sibling completed.
      const liveData = proData?.current || proData;
      const parentData = liveData?.tasks?.find((item: any) => item._id === task.parentId);
      if (parentData?.projectTemplateDetails?.metaInformation?.isReplaceable) {
        const data = parentData?.children?.find((item: any) => item.status === TASK_STATUS.COMPLETED);
        if (!data?.name) {
          const value = 'GBL_PATH';
          const pathway = liveData?.categories?.find((item: any) => item?.externalId?.includes(value));
          setShowConfirmModal({name:pathway.name, fun:canChangePathway});
          return false;
        }
      }
    }
    return true
  },[task.parentId, proData])

  const handleTaskClick = useCallback(async ({checkFirstTaskComplete}:{checkFirstTaskComplete:boolean}) => {
    if(!handleCheckFirstTaskComplete(checkFirstTaskComplete === false ? false : handleTaskClick)) return;
    if (!isObservationTask) {
      if (!isEdit) return;
      setShowUploadModal(true);
      return;
    }
    // Observation tasks: allow navigation in edit mode (fill) and read-only mode (view).
    // Block in preview mode where neither flag is set.
    if (!isEdit && !isReadOnly) return;
    const projectTemplateId = projectDataRef?._id;
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
  }, [isEdit, isReadOnly, isObservationTask, task._id, task.solutionDetails, participantId, projectDataRef, navigation, showAlert, t, setIsStatusUpdating,handleCheckFirstTaskComplete]);

  const handleCheckboxChange = useCallback(async (checked: boolean, checkFirstTaskComplete?: any) => {
    if (!isEdit) return;
    if(!handleCheckFirstTaskComplete(checkFirstTaskComplete === false ? checkFirstTaskComplete : handleTitlePressRef.current)) return;

    setIsStatusUpdating(true);
    try {
      await handleStatusChange({ taskId: task._id, parentIndex, index }, checked ? TASK_STATUS.COMPLETED : TASK_STATUS.TO_DO);
    } finally {
      setIsStatusUpdating(false);
    }
  }, [isEdit, task._id, parentIndex, index, handleStatusChange, handleCheckFirstTaskComplete]);

  const handleTitlePress = useCallback(async ({ checkFirstTaskComplete }: { checkFirstTaskComplete?: any }) => {
    if (!isManualToggleDisabled) handleCheckboxChange(!isCompleted, checkFirstTaskComplete);
  }, [isManualToggleDisabled, handleCheckboxChange, isCompleted]);

  handleTitlePressRef.current = handleTitlePress;

  const updateEntityFile = useCallback(async (data: any) => {
    if (data?.success) {
      const attachedFiles = data?.data?.attachments?.map((f: any) => f) ?? [];
      const thisDate = new Date().toISOString();
      if (isOnboardingTask) {
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
    if (!files) return;
    setIsStatusUpdating(true);
    try {
      const {newFiles, existingToSend} = filterNewFiles(files, task?.attachments);
      const data = await handleStatusChange(
        { taskId: task._id, parentIndex, index, referenceId: task.referenceId, isOnboardingTask },
        TASK_STATUS.COMPLETED, newFiles,
        (uploadConfig.maxFiles === undefined || (uploadConfig.maxFiles && uploadConfig.maxFiles > 1)) ? existingToSend : [],
      );
      if (!isNetworkOffline()) await updateEntityFile(data);
    } finally { setIsStatusUpdating(false); }
  }, [task._id, task.referenceId, parentIndex, index, task?.attachments, isOnboardingTask, handleStatusChange, uploadConfig.maxFiles, updateEntityFile]);

  const handleCloseUploadModal = useCallback(() => setShowUploadModal(false), []);
  const handleClosePreviewModal = useCallback(() => setShowPreviewModal(false), []);
  const handleOpenPreviewModal = useCallback(() => setShowPreviewModal(true), []);
  const handleUploadMethodSelect = useCallback((method: any) => logger.info('Upload method:', method), []);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <MainContent
        task={task}
        isReadOnly={isReadOnly}
        isLastTask={isLastTask}
        isMobile={isMobile}
        isWeb={isWeb}
        isOnboardingTask={isOnboardingTask}
        isChildOfProject={isChildOfProject}
        isOnboardingCompletedUI={isOnboardingCompletedUI}
        isEdit={isEdit}
        isPreview={isPreview}
        isInterventionPlanEditMode={isInterventionPlanEditMode}
        isCompleted={isCompleted}
        isObservationTask={isObservationTask}
        isEvidenceRequired={isEvidenceRequired}
        isStatusUpdating={isStatusUpdating}
        isManualToggleDisabled={isManualToggleDisabled}
        isAddedToPlan={isAddedToPlan}
        isRejected={isRejected}
        showCheckbox={showCheckbox}
        showActionButton={showActionButton}
        actionIconName={actionIconName}
        onCheckboxChange={handleCheckboxChange}
        handleTaskClick={() => handleTaskClick({checkFirstTaskComplete: true})}
        handleTitlePress={handleTitlePress}
        handleOpenPreviewModal={handleOpenPreviewModal}
        handleAcceptTask={handleAcceptTask}
        handleRejectTask={handleRejectTask}
        isSyncTaskId={isSyncTaskId}
        t={t}
        extraActions={extraActions}
      />
      <FileUploadModal
        isOpen={showUploadModal} onClose={handleCloseUploadModal}
        taskName={task?.name}
        participantName={!isChildOfProject ? config.profileInfo?.name : undefined}
        existingAttachments={task?.attachments}
        maxFileUploadCount={uploadConfig.maxFiles}
        allowedFileTypes={uploadConfig.allowedFileTypes}
        maxFileSize={config.maxFileSize}
        onUpload={handleUploadMethodSelect}
        onConfirm={handleUploadConfirm}
      />
      <EvidencePreviewModal
        isOpen={showPreviewModal} onClose={handleClosePreviewModal}
        taskName={task?.name} attachments={task?.attachments || []}
      />
      <Modal
        isOpen={!!showConfirmModal}
        onClose={setShowConfirmModal}
        headerTitle={`${t('projectPlayer.confirmPathwaySelection')}`}
        headerAlignment="baseline"
        size="lg"
        confirmButtonText={t('projectPlayer.continue')}
        onConfirm={() => {
          setShowConfirmModal((pre) => {
            if (typeof pre !== 'boolean') {
              pre?.fun?.({checkFirstTaskComplete:false});
            }
            return false;
          });
        }}
        {...(!isNetworkOffline() ? {
          cancelButtonText:t('projectPlayer.changeIt'),
          onCancel: () => {
            // @ts-ignore
            navigation.navigate('template', { id: projectDataRef?.userProfile?.id, projectId: projectDataRef?._id })
          }
        } : {})}
      >
        <Text>{t('projectPlayer.confirmPathwaySelectionSubtitle', { pathwayName: showConfirmModal?.name })}</Text>
      </Modal>
    </>
  );
};

SimpleObservationTask.displayName = 'SimpleObservationTask';

export default memo(SimpleObservationTask);
