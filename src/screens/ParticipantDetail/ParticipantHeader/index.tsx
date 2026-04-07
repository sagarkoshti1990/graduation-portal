import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Linking, Platform, Image } from 'react-native';
import {
  HStack,
  VStack,
  Text,
  Box,
  Button,
  ButtonText,
  LucideIcon,
  useAlert,
  ButtonIcon,
  Container,
  Modal,
  Spinner,
} from '@ui';
import { participantHeaderStyles } from './Styles';
import { useLanguage } from '@contexts/LanguageContext';
import ParticipantProgressCard from './ParticipantProgressCard';
import {
  STATUS,
  TASK_STATUS,
  PROJECT_STATUS,
  GRADUATION_READINESS_PROGRESS_THRESHOLD,
} from '@constants/app.constant';
import { User } from '@contexts/AuthContext';
import { ParticipantHeaderProps } from '@app-types/screens';
import type { ParticipantStatus } from '@app-types/participant';
import { PageHeader } from '@components/PageHeader';
import { usePlatform } from '@utils/platform';
import {
  completeProject,
  getProjectDetails,
  updateTask
} from '../../../project-player/services/projectPlayerService';

const ParticipantHeader: React.FC<ParticipantHeaderProps> = ({
  participant: participantProp,
  pathway,
  graduationDate,
  graduationProgress: graduationProgressProp,
  onViewProfile,
  areAllTasksCompleted = false,
  onStatusUpdate,
  updatedProgress,
  projectData,
  onParticipantRefresh,
}) => {
  const navigation = useNavigation();
  const { t } = useLanguage();
  const { isWeb, isMobile } = usePlatform();
  const { showAlert } = useAlert();

  const [status, setStatus] = useState(participantProp?.status || '')
  const [graduationProgress, setGraduationProgress] = useState(0)
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false)
  const [isCompletingProject, setIsCompletingProject] = useState(false)
  const [shouldShowCompletionButton, setShouldShowCompletionButton] =
    useState(false)
  const showSuccess = (message: string) => {
    showAlert('error',message,{
      duration: 100000,
    });
  };

  // Update status when participant prop changes
  useEffect(() => {
    if (participantProp?.status) {
      setStatus(participantProp.status);
    }
  }, [participantProp?.status, onStatusUpdate]);

  useEffect(() => {
    const fetchProjectProgress = async () => {
      if (participantProp?.idpProjectId) {
        try {
          if (participantProp?.idpProjectId) {
            const res = await getProjectDetails(participantProp?.idpProjectId);
            const tasks = res.data?.tasks || [];
            let totalChildTasks = 0;
            let completedChildTasks = 0;

            tasks.forEach((task: any) => {
              if (task?.children?.length) {
                const validChildren = task.children.filter(
                  (childTask: any) => !childTask.isDeleted,
                );

                totalChildTasks += validChildren.length;

                completedChildTasks += validChildren.filter(
                  (childTask: any) =>
                    childTask.status === TASK_STATUS.COMPLETED,
                ).length;
              }
            });

            const progress =
              totalChildTasks > 0
                ? Math.round((completedChildTasks / totalChildTasks) * 100)
                : 0;

            setGraduationProgress(progress);
          }
        } catch (error) {
          console.log(error);
        }
      }
    };
    fetchProjectProgress();
  }, [participantProp?.idpProjectId]);

  const handleBackPress = () => {
    // @ts-ignore
    navigation.navigate('participants');
  };

  const handleEnrollParticipant = async () => {
    const entityId = (participantProp as User)?.entityId;
    if (!entityId) return;

    try {
      const projResult = await updateTask((participantProp as any)?.onBoardedProjectId, {status: TASK_STATUS.COMPLETED});
      if (!(projResult as any)?._id) {
        return showAlert('error', t('participantDetail.header.taskStatusUpdateFailed'));
      }
      showSuccess(t('projectPlayer.enrolledParticiapantSucess'));
      // Reload page
      window.location.reload();
      // Notify parent component about status update
      if (onStatusUpdate) {
        onStatusUpdate(STATUS.ENROLLED);
      }
    } catch (error) {
      showAlert('error', t('common.somethingWentWrong'));
    }
  };

  const handleLogVisitPress = () => {
    const participantId = (participantProp as User)?.id || (participantProp as any)?.id;
    // @ts-ignore
    navigation.push('log-visit', { id: participantId });
  };

  const handleCompleteProject = async () => {
    if (!participantProp?.idpProjectId || isCompletingProject) return;

    try {
      setIsCompletingProject(true);
      await completeProject(participantProp.idpProjectId);
      setStatus(STATUS.COMPLETED);
      onStatusUpdate?.(STATUS.COMPLETED);
      await onParticipantRefresh?.();
      showAlert('success',t('participantDetail.header.projectCompleteSuccess'));
    } catch (error) {
      showAlert('error', t('participantDetail.header.projectCompleteFailure'))
    } finally {
      setIsCompletingProject(false);
    }
  };

  const handleCertificateDownload = () => {
    const pdfUrl = (projectData as any)?.certificate?.pdfUrl;
    if (!pdfUrl) return;
    if (Platform.OS === 'web') {
      window.open(pdfUrl, '_blank');
    } else {
      Linking.openURL(pdfUrl);
    }
  };

  const openCertificateModal = () => {
    setIsCertificateModalOpen(true);
  };

  const effectiveProgress =
    updatedProgress ?? graduationProgressProp ?? graduationProgress;

  useEffect(() => {
    setShouldShowCompletionButton(
      status === STATUS.IN_PROGRESS &&
        !!participantProp?.idpProjectId &&
        effectiveProgress >= GRADUATION_READINESS_PROGRESS_THRESHOLD,
    );
  }, [effectiveProgress, participantProp?.idpProjectId, status]);

  const renderStatusBadge = () => {
    if (status === STATUS.DROPOUT) {
      return (
        <Box {...participantHeaderStyles.statusBadge}>
          <Text {...participantHeaderStyles.statusBadgeText}>
            {t('participantDetail.header.droppedOut')}
          </Text>
        </Box>
      );
    }
    return null;
  };

  /**
   * Render View Profile Button
   * Common button rendered for all statuses
   */
  const renderViewProfileButton = () => (
    // @ts-ignore
    <Button variant="outlineghost" onPress={onViewProfile}>
      <ButtonIcon as={LucideIcon} name="User" size={16} />
      <ButtonText {...participantHeaderStyles.outlineButtonText}>
        {t('participantDetail.header.viewProfile')}
      </ButtonText>
    </Button>
  );

  /**
   * Render Second Action Button
   * Conditionally renders based on participant status
   */
  const renderSecondButton = () => {
    // Not Enrolled: Enroll Participant (enabled only if all tasks are completed)
    if (status === STATUS.NOT_ENROLLED) {
      return (
        <Button
          onPress={handleEnrollParticipant}
          isDisabled={!areAllTasksCompleted}
          {...participantHeaderStyles.solidButtonPrimary}
          $md-width="auto"
        >
          <ButtonIcon as={LucideIcon} name="User" />
          <ButtonText {...participantHeaderStyles.solidButtonText}>
            {t('participantDetail.header.enrollParticipant')}
          </ButtonText>
        </Button>
      );
    }

    // Dropout: No second button
    if (status === STATUS.DROPOUT || status === STATUS.GRADUATED) {
      return null;
    }

    // Enrolled, In Progress, Completed: Log Visit
    return (
      <Button variant="solid" size="sm"
        onPress={handleLogVisitPress}
      >
        <ButtonIcon as={LucideIcon} name="FileText" />
        <ButtonText>{t('participantDetail.header.logVisit')}</ButtonText>
      </Button>
    );
  };

  /**
   * Render Certificate View Button
   * Shows when projectData status is submitted and certificate (svgUrl or pdfUrl) exists
   */
  const renderCertificateDownloadButton = () => {
    const isSubmitted = projectData?.status === PROJECT_STATUS.SUBMITTED;
    const certificate = (projectData as any)?.certificate;
    const svgUrl = certificate?.svgUrl;
    const pdfUrl = certificate?.pdfUrl;
    if (!isSubmitted || (!svgUrl && !pdfUrl)) return null;
    return (
      <Button variant="solid" size="sm" onPress={openCertificateModal}>
        <ButtonIcon as={LucideIcon} name="FileCheck" size={16} />
        <ButtonText {...participantHeaderStyles.outlineButtonText}>
          {t('participantDetail.header.viewCertificate')}
        </ButtonText>
      </Button>
    );
  };

  /**
   * Certificate preview modal: shows SVG preview and Download button
   */
  const renderCertificateModal = () => {
    const certificate = (projectData as any)?.certificate;
    const svgUrl = certificate?.svgUrl;
    const pdfUrl = certificate?.pdfUrl;
    if (!certificate) return null;
    const certificatePreviewStyle = { maxWidth: '100%', height: 'auto', objectFit: 'contain' as const };
    const certificateImageStyle = { width: '100%' as const, aspectRatio: 1.4 };
    return (
      <Modal
        isOpen={isCertificateModalOpen}
        onClose={() => setIsCertificateModalOpen(false)}
        headerTitle={t('participantDetail.header.viewCertificate')}
        size="lg"
        footerContent={
          <HStack space="md" width="$full" justifyContent="flex-end">
            <Button variant={"outlineghost" as any} onPress={() => setIsCertificateModalOpen(false)}>
              <ButtonText>{t('common.cancel')}</ButtonText>
            </Button>
            <Button variant="solid" onPress={handleCertificateDownload}>
              <ButtonIcon as={LucideIcon} name="Download" size={16} />
              <ButtonText>{t('participantDetail.header.downloadCertificate')}</ButtonText>
            </Button>
          </HStack>
        }
      >
        <VStack space="md" width="$full">
          {svgUrl ? (
            <Box width="$full" maxHeight={500} alignItems="center" justifyContent="center">
              {Platform.OS === 'web' ? (
                <img
                  src={svgUrl}
                  alt={t('participantDetail.header.viewCertificate')}
                  style={certificatePreviewStyle}
                />
              ) : (
                <Image
                  source={{ uri: svgUrl }}
                  style={certificateImageStyle}
                  resizeMode="contain"
                />
              )}
            </Box>
          ) : (
            <Text color="$textMutedForeground">
              {pdfUrl
                ? t('participantDetail.header.downloadCertificate')
                : t('participantDetail.header.viewCertificate')}
            </Text>
          )}
        </VStack>
      </Modal>
    );
  };

  /**
   * Render Action Buttons
   * Displays action buttons based on participant status
   *
   * @returns Action buttons JSX based on status
   */
  const renderActionButtons = () => {
    const secondButton = renderSecondButton();
    const certificateButton = renderCertificateDownloadButton();

    // If there's a second button or certificate button, wrap in HStack
    if (secondButton || certificateButton) {
      return (
        <HStack
          {...participantHeaderStyles.actionButtonsContainer}
          $md-flexDirection="row"
          $md-width="auto"
        >
          {renderViewProfileButton()}
          {secondButton}
          {certificateButton}
        </HStack>
      );
    }

    // Otherwise, just render View Profile button
    return renderViewProfileButton();
  };

  return (
    <>
      <PageHeader
        onBackPress={handleBackPress}
        backButtonText={t('participantDetail.header.backToCaseload')}
        _content={participantHeaderStyles.backLinkContainer}
        _container={
          {
            pb: 0,
            px:"$4",
            pt:"$6",
          }
        }
        // Remove shadow + bottom border for this screen
        _css={{
          shadowOpacity: 0,
          shadowRadius: 0,
          elevation: 0,
          borderBottomWidth: 0,
        }}
      >
        {/* Participant Info and Actions Row */}
        <HStack
          {...participantHeaderStyles.participantInfoRow}
          // Responsive: stack on mobile, row on desktop
          $md-flexDirection="row"
          $md-justifyContent="space-between"
        >
          {/* Left: Participant Name and ID */}
          <VStack {...participantHeaderStyles.participantInfoContainer}>
            <HStack {...participantHeaderStyles.participantNameRow}>
              <Text {...participantHeaderStyles.participantName}>
                {participantProp?.name}
              </Text>
              {renderStatusBadge()}
            </HStack>

            <HStack {...participantHeaderStyles.participantIdRow}>
              <Text {...participantHeaderStyles.participantId}>
                {(participantProp as User)?.id || (participantProp as any)?.id}
              </Text>
              {status === STATUS.IN_PROGRESS && pathway && (
                <>
                  <Text {...participantHeaderStyles.pathwaySeparator}>•</Text>
                  <Text {...participantHeaderStyles.pathway}>
                    {t(`participantDetail.pathways.${pathway}`)}
                  </Text>
                </>
              )}
            </HStack>
          </VStack>

          {/* Right: Action Buttons */}
          <Box width="$full" $md-width="auto">
            {renderActionButtons()}
          </Box>
        </HStack>
      </PageHeader>

      {/* Participant Status Card/Warning (after PageHeader) */}
      <Box
        {...participantHeaderStyles.progressStickyContainer}
        style={
          isWeb && isMobile
            ? ({ position: 'sticky', top: 0, zIndex: 10 } as any)
            : undefined
        }
      >
        <Container px="$4" pb="$4">
          <ParticipantProgressCard
            status={status as ParticipantStatus}
            graduationProgress={graduationProgressProp ?? graduationProgress}
            updatedProgress={updatedProgress}
            graduationDate={graduationDate}
          />
          {shouldShowCompletionButton && (
            <Button
              mt="$3"
              variant="solid"
              size="sm"
              onPress={handleCompleteProject}
              isDisabled={isCompletingProject}
            >
              {isCompletingProject ? (
                <Spinner size="small" color="$white" />
              ) : (
                <ButtonIcon as={LucideIcon} name="Check" />
              )}
              <ButtonText>
                {t('participantDetail.header.completeGraduationReadinessForm')}
              </ButtonText>
            </Button>
          )}
        </Container>
      </Box>
      {renderCertificateModal()}
    </>
  );
};

export default ParticipantHeader;
