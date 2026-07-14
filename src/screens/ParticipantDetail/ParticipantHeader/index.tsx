import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Linking, Platform } from 'react-native';
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
  USER_STATUS,
  ENTITY_STATUS,
} from '@constants/app.constant';
import { User } from '@contexts/AuthContext';
import { ParticipantHeaderProps } from '@app-types/screens';
import type { ParticipantStatus } from '@app-types/participant';
import { PageHeader } from '@components/PageHeader';
import { usePlatform } from '@utils/platform';
import {
  getCategoryList,
  // completeProject,
  // getProjectDetails,
  updateTask
} from '../../../project-player/services/projectPlayerService';
import { ENDLINE_KEYWORD } from '@constants/LOG_VISIT_CARDS';
import { updateEntityDetails } from '../../../services/participantService';
import { useAuth, useIsdminPanalAccess } from '@contexts/AuthContext';
import { getProjectCategoryList } from '../../../services/projectService';
import { isNetworkOffline } from '@utils/networkStatus';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';

const getCategoryData = (categories: any[], data: any[]) => {
  let categoryData = {};
  categories?.forEach((category: any) => {
    const template = data?.find((item: any) => {
      return category._id === item._id
    })
    if (template && !Object.keys(categoryData).length) {
      categoryData = template
    }
  });

  return categoryData
}

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
  solutions,
  isHideSecondButton
}) => {
  const navigation = useNavigation();
  const { t } = useLanguage();
  const { isWeb, isMobile } = usePlatform();
  const { showAlert } = useAlert();
  const { user } = useAuth();
  const canAccessAdmin = useIsdminPanalAccess();
  const [status, setStatus] = useState(participantProp?.status || '')
  const [graduationProgress, setGraduationProgress] = useState(0)
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false)
  const [isCompletingProject, setIsCompletingProject] = useState(false)
  const [pathwayAndCategory, setPathwayAndCategory] = useState<string[]>([]);
  const [shouldShowCompletionButton, setShouldShowCompletionButton] =
    useState(false)
  const showSuccess = (message: string) => {
    showAlert('success', message);
  };
  const offline = isNetworkOffline();

  // Update status when participant prop changes
  useEffect(() => {
    if (participantProp?.status) {
      setStatus(participantProp.status);
    }
  }, [participantProp?.status, onStatusUpdate]);

  useEffect(() => {
    const fetchTemplates = async () => {
      const titleArr: string[] = []
      const templatesData = await getProjectCategoryList();
      let templateData: { children?: any[], _id?: string, name?: string } = getCategoryData(projectData?.categories || [], templatesData)
      if (templateData._id) {
        titleArr.push(templateData.name || "");
        const pillar = templateData?.children?.find((category: any) => category.hasChildCategories);
        if (pillar?._id) {
          const categoryData = await getCategoryList(pillar?._id)
          const result: { _id?: string, name?: string } = getCategoryData(projectData?.categories || [], categoryData?.data || [])
          if (result?._id) {
            titleArr.push(result.name || "");
          }
        }
      }
      setPathwayAndCategory(titleArr);
    }
    if (projectData) {
      fetchTemplates();
    }
  }, [projectData]);

  useEffect(() => {
    const fetchProjectProgress = async () => {
      if (participantProp?.idpProjectId) {
        try {
          if (participantProp?.idpProjectId) {
            const tasks = projectData?.tasks || [];
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
    if(projectData) {
      fetchProjectProgress();
    }
  }, [participantProp?.idpProjectId,projectData]);

  const handleBackPress = () => {
    const role = user?.role?.toLowerCase();
    if (role === 'admin' || role === 'supervisor') {
      // @ts-ignore
      navigation.navigate('user-management');
    } else {
      // @ts-ignore
      navigation.navigate('participants');
    }
  };

  const handleEnrollParticipant = async () => {
    const entityId = (participantProp as User)?.entityId;
    if (!entityId) return;

    try {
      const [projResult] = await Promise.all([
        updateTask((participantProp as any)?.onBoardedProjectId, { status: TASK_STATUS.COMPLETED }),
        updateEntityDetails({
          userId: `${user?.id}`,
          entityId: (participantProp as User)?.entityId,
          entityUpdates: {
            status: STATUS.ENROLLED,
          },
        }),
      ]);

      if (!(projResult as any)?._id) {
        return showAlert('error', t('participantDetail.header.taskStatusUpdateFailed'));
      }
      showSuccess(t('projectPlayer.enrolledParticiapantSucess'));

      // Notify parent component about status update
      if (onStatusUpdate) {
        onStatusUpdate(STATUS.ENROLLED);
      }
    } catch (error) {
      showAlert('error', t('common.somethingWentWrong'));
    }
  };

  const handleLogVisitPress = (link:string) => {
    const participantId = (participantProp as User)?.id || (participantProp as any)?.id;
    const resolvedCoachId = (participantProp as any)?.hierarchy?.[0] || (participantProp as any)?.extra?.hierarchy?.find((item: any) => item.level === 0)?.id;
    const params: any = { id: participantId };
    if (user?.role?.toLowerCase() === 'supervisor') {
      params.coachId = resolvedCoachId;
    }
    // @ts-ignore
    navigation.push(link, params);
  };

  const handleCompleteProject = async (solution: any) => {
    if (!participantProp?.idpProjectId || isCompletingProject) return;
    const participantId = (participantProp as User)?.id || (participantProp as any)?.id;

    try {
      // setIsCompletingProject(true);
      // if(participantProp?.idpProgress?.projectStatus !== PROJECT_STATUS.COMPLETED && participantProp?.idpProgress?.projectStatus !== PROJECT_STATUS.SUBMITTED) {
      //   await completeProject(participantProp.idpProjectId);
      // }
      // setStatus(STATUS.COMPLETED);
      // onStatusUpdate?.(STATUS.COMPLETED);
      // showAlert('success',t('participantDetail.header.projectCompleteSuccess'));
      // @ts-ignore
      navigation.push('observation', { id: participantId, solutionId: solution.solutionId, submissionNumber: 1 });
    } catch (error) {
      showAlert('error', t('participantDetail.header.projectCompleteFailure'))
      console.log('error', error);
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
    if (solutions?.length && solutions?.length > 0) {
      const endlineSolution = solutions?.find((solution: any) => solution.keywords.includes(ENDLINE_KEYWORD));
      setShouldShowCompletionButton(
        status === STATUS.IN_PROGRESS &&
        participantProp?.accountUserStatus !== USER_STATUS.INACTIVE &&
        !!participantProp?.idpProjectId &&
        effectiveProgress >= GRADUATION_READINESS_PROGRESS_THRESHOLD
        // && participantProp?.idpProgress?.projectStatus !== PROJECT_STATUS.SUBMITTED,
        && !((endlineSolution?.entity?.submissionsCount === 1 && endlineSolution?.entity?.status === ENTITY_STATUS.COMPLETED) || endlineSolution?.entity?.submissionsCount > 1)
      );
    }
    // participantProp?.idpProgress?.projectStatus,
    // @ts-ignore
  }, [effectiveProgress, participantProp?.idpProjectId, status, solutions?.length]);

  const renderStatusBadge = () => {
    if (status === STATUS.NOT_ELIGIBLE || status === STATUS.DROPOUT || participantProp?.accountUserStatus === USER_STATUS.INACTIVE) {
      return (
        <Box {...participantHeaderStyles.statusBadge}>
          <Text {...participantHeaderStyles.statusBadgeText}>
            {participantProp?.accountUserStatus === USER_STATUS.INACTIVE ? t('participantDetail.header.inactiveAccount') : status === STATUS.NOT_ELIGIBLE ? t('participantDetail.header.notEligible') : t('participantDetail.header.droppedOut')}
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
    <Button variant="outlineghost" onPress={onViewProfile} size="sm">
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
    // Dropout: No second button
    if (isHideSecondButton || status === STATUS.DROPOUT || status === STATUS.NOT_ELIGIBLE || status === STATUS.GRADUATED || participantProp?.accountUserStatus === USER_STATUS.INACTIVE) {
      return null;
    }
    // Not Enrolled: Enroll Participant (enabled only if all tasks are completed)
    if (status === STATUS.NOT_ENROLLED && !offline && !canAccessAdmin ) {
      return (
        <Button
          onPress={handleEnrollParticipant}
          isDisabled={!areAllTasksCompleted}
          {...participantHeaderStyles.solidButtonPrimary}
          $md-width="auto"
          size="sm"
        >
          <ButtonIcon as={LucideIcon} name="User" />
          <ButtonText {...participantHeaderStyles.solidButtonText}>
            {t('participantDetail.header.enrollParticipant')}
          </ButtonText>
        </Button>
      );
    }

    if (canAccessAdmin ) {
      // @ts-ignore
      return <Button variant="outlineghost" onPress={() => {
        handleLogVisitPress("check-ins-list")
      }}>
        <ButtonIcon as={LucideIcon} name="History" size={16} />
        <ButtonText {...TYPOGRAPHY.bodySmall}>{t('logVisit.viewCheckIns')}</ButtonText>
      </Button>
    }

    // Enrolled, In Progress, Completed: Log Visit
    return (
      <Button variant="solid" size="sm"
        onPress={() => handleLogVisitPress('log-visit')}
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
    // const svgUrl = certificate?.svgUrl;
    const pdfUrl = certificate?.pdfUrl;
    if (!certificate) return null;
    const certificatePreviewStyle = { maxWidth: '100%', height: '410px', objectFit: 'contain' as const };
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
        <VStack space="md" width="$full" >
          {pdfUrl ? (
            <Box width="$full" alignItems="center" justifyContent="center">
              {Platform.OS === 'web' ? (
                // Use <object> for PDF preview in web, fallback to download link if not supported
                <iframe
                  src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                  width="100%"
                  height="410"
                  style={certificatePreviewStyle}
                  aria-label={t('participantDetail.header.viewCertificate')}
                  frameBorder="0"
                  title={t('participantDetail.header.viewCertificate')}
                />
              ) : (
                // On native, open PDF with a download/open button, or render a message
                <VStack space="md" alignItems="center" width="$full">
                  <Text color="$textMutedForeground" textAlign="center">
                    {t('participantDetail.header.downloadCertificate')}
                  </Text>
                  <Button
                    variant="solid"
                    onPress={() => {
                      // Open the PDF in external browser/pdf handler (native only)
                      // Platform/Linking already imported in this file's context
                      // Use openExternalLink if available, else fallback to Linking.openURL
                      if (typeof openExternalLink === 'function') {
                        openExternalLink(pdfUrl);
                      } else if (Linking?.openURL) {
                        Linking.openURL(pdfUrl);
                      }
                    }}
                  >
                    <ButtonIcon as={LucideIcon} name="Download" size={16} />
                    <ButtonText>{t('participantDetail.header.downloadCertificate')}</ButtonText>
                  </Button>
                </VStack>
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
  const renderCompleteProjectButton = () => {
    const certificateSolution = solutions?.find((solution: any) => solution.keywords.includes(ENDLINE_KEYWORD));
    return shouldShowCompletionButton && certificateSolution ? (
      <Button
        mt="$3"
        variant="solid"
        size="sm"
        onPress={() => handleCompleteProject(certificateSolution)}
        isDisabled={isCompletingProject || canAccessAdmin}
      >
        {isCompletingProject ? (
          <Spinner size="small" color="$white" />
        ) : (
          <ButtonIcon as={LucideIcon} name="Check" />
        )}
        <ButtonText>
          {t('participantDetail.header.complete')} {certificateSolution?.name}
        </ButtonText>
      </Button>
    ) : null;
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
            px: "$4",
            pt: "$6",
          }
        }
        // Remove shadow + bottom border for this screen
        _css={{
          shadowOpacity: 0,
          shadowRadius: 0,
          elevation: 0,
          borderBottomWidth: 0,
        }}
        _backButton={{ ml: "-$2" }}
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
                pathwayAndCategory.map((item, index) =>
                  <React.Fragment key={`${item}-${index}`}>
                    <Text {...participantHeaderStyles.pathwaySeparator}>•</Text>
                    <Text {...participantHeaderStyles.pathway}>
                      {item}
                    </Text>
                  </React.Fragment>
                )
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
            participantName={participantProp?.name}
            accountUserStatus={participantProp?.accountUserStatus}
            status={status as ParticipantStatus}
            graduationProgress={graduationProgressProp ?? graduationProgress}
            updatedProgress={updatedProgress}
            graduationDate={graduationDate}
          />
          {renderCompleteProjectButton()}
        </Container>
      </Box>
      {renderCertificateModal()}
    </>
  );
};

export default ParticipantHeader;
