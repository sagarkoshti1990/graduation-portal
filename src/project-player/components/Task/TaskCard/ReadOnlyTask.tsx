import React, { memo, useCallback, useMemo, useState } from 'react';
import { useAlert } from '@ui';
import { usePlatform } from '@utils/platform';
import { useLanguage } from '@contexts/LanguageContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { TASK_TYPE } from '../../../../constants/app.constant';
import { isTaskCompleted } from '../shared/helpers';
import { getActionIconName } from './utils/taskStatusUtils';
import { getSolutionDetails } from '../../../services/projectPlayerService';
import { isNetworkOffline } from '../../../../services/dataService';
import MainContent from './simpleObservationTask/MainContent';
import EvidencePreviewModal from '../FileEvidence/EvidencePreviewModal';
import type { Task } from '../../../types/project.types';
import type { EvidenceAttachment } from '../../../types/components.types';

// ─────────────────────────────────────────────────────────────────────────────

export interface ReadOnlyTaskProps {
  task: Task;
  isLastTask?: boolean;
  isChildOfProject?: boolean;
  isOnboardingTask?: boolean;
  /** Passed by TaskListRenderer; used only for observation-form navigation. */
  projectContext?: any;
  parentIndex?: number;
  index?: number;
}

const ReadOnlyTask = memo<ReadOnlyTaskProps>(({
  task,
  isLastTask = false,
  isChildOfProject = false,
  isOnboardingTask = false,
  projectContext,
}) => {
  const { isMobile, isWeb } = usePlatform();
  const { t } = useLanguage();
  const route = useRoute();
  const navigation = useNavigation();
  const { showAlert } = useAlert();

  const { projectDataRef: proData } = projectContext || {};
  const projectDataRef = (proData as any)?.current || proData;
  const participantId = (route.params as any)?.id;

  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);

  const handleOpenPreviewModal = useCallback(() => setShowPreviewModal(true), []);
  const handleClosePreviewModal = useCallback(() => setShowPreviewModal(false), []);

  // ── Derived read-only state ────────────────────────────────────────────────
  const isCompleted = useMemo(() => isTaskCompleted(task?.status), [task?.status]);

  const isObservationTask = useMemo(
    () => task.type === TASK_TYPE.OBSERVATION,
    [task.type],
  );

  const hasUploadedFiles = useMemo(
    () => !!(task.attachments && task.attachments.length > 0),
    [task.attachments],
  );

  const isEvidenceRequired = useMemo(
    () => !!(
      (task.noOfEvidenceRequired && task.noOfEvidenceRequired > 0) ||
      (task.metaInformation?.noOfEvidencesRequired &&
        task.metaInformation.noOfEvidencesRequired > 0)
    ),
    [task.noOfEvidenceRequired, task.metaInformation?.noOfEvidencesRequired],
  );

  const isOnboardingCompletedUI = useMemo(
    () => isOnboardingTask && (task.isDeletable ? hasUploadedFiles : isCompleted),
    [isOnboardingTask, task.isDeletable, hasUploadedFiles, isCompleted],
  );

  const isManualToggleDisabled = useMemo(
    () => isObservationTask || isEvidenceRequired,
    [isObservationTask, isEvidenceRequired],
  );

  const actionIconName = useMemo(() => getActionIconName(task), [task]);

  // ── Observation-form navigation (read-only view of the submitted form) ─────
  const handleTaskClick = useCallback(async () => {
    if (!isObservationTask) return;
    const projectTemplateId = projectDataRef?._id;
    if (!participantId || !projectTemplateId) return;
    if (isNetworkOffline()) {
      const offlineSolutionId: string =
        task.solutionDetails?._id ??
        (task.solutionDetails as any)?.observationId ??
        (task.solutionDetails as any)?.id ?? '';
      if (offlineSolutionId) {
        // @ts-ignore
        navigation.navigate('observation', { id: participantId, solutionId: offlineSolutionId, submissionNumber: 1, taskId: task._id });
      } else {
        showAlert('error', t('projectPlayer.unableToLoadObservation'));
      }
      return;
    }
    setIsStatusUpdating(true);
    try {
      const solutionDetails = await getSolutionDetails(projectTemplateId, task._id);
      if (solutionDetails?.data?._id) {
        // @ts-ignore
        navigation.navigate('observation', { id: participantId, solutionId: solutionDetails.data._id, submissionNumber: 1, taskId: task._id });
      } else {
        showAlert('error', t('projectPlayer.unableToLoadObservation'));
      }
    } catch {
      showAlert('error', t('projectPlayer.unableToLoadObservation'));
    } finally {
      setIsStatusUpdating(false);
    }
  }, [isObservationTask, participantId, projectDataRef, task._id, task.solutionDetails, navigation, showAlert, t]);

  // NOPs for mutation handlers — all write operations are hidden in read-only mode.
  const noop = useCallback(() => {}, []);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <MainContent
        task={task}
        isReadOnly={true}
        isLastTask={isLastTask}
        isMobile={isMobile}
        isWeb={isWeb}
        isOnboardingTask={isOnboardingTask}
        isChildOfProject={isChildOfProject}
        isOnboardingCompletedUI={isOnboardingCompletedUI}
        isEdit={false}
        isPreview={false}
        isInterventionPlanEditMode={false}
        isCompleted={isCompleted}
        isObservationTask={isObservationTask}
        isEvidenceRequired={isEvidenceRequired}
        isStatusUpdating={isStatusUpdating}
        isManualToggleDisabled={isManualToggleDisabled}
        isAddedToPlan={false}
        isRejected={false}
        showCheckbox={isChildOfProject}
        showActionButton={true}
        actionIconName={actionIconName}
        onCheckboxChange={noop}
        handleTaskClick={handleTaskClick}
        handleTitlePress={noop}
        handleOpenPreviewModal={handleOpenPreviewModal}
        handleAcceptTask={noop}
        handleRejectTask={noop}
        t={t}
      />
      <EvidencePreviewModal
        isOpen={showPreviewModal}
        onClose={handleClosePreviewModal}
        taskName={task?.name ?? ''}
        attachments={(task.attachments ?? []) as EvidenceAttachment[]}
      />
    </>
  );
});

ReadOnlyTask.displayName = 'ReadOnlyTask';
export default ReadOnlyTask;
