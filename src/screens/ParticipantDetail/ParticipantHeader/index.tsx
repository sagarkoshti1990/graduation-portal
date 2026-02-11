import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  HStack,
  VStack,
  Text,
  Box,
  Button,
  ButtonText,
  LucideIcon,
  showSuccessToast,
  useToast,
  useAlert,
  ButtonIcon,
} from '@ui';
import { participantHeaderStyles } from './Styles';
import { useLanguage } from '@contexts/LanguageContext';
import ParticipantProgressCard from './ParticipantProgressCard';
import { STATUS, TASK_STATUS } from '@constants/app.constant';
import { updateEntityDetails } from '../../../services/participantService';
import { useAuth, User } from '@contexts/AuthContext';
import { ParticipantHeaderProps } from '@app-types/screens';
import type { ParticipantStatus } from '@app-types/participant';
import { PageHeader } from '@components/PageHeader';
import { getProjectDetails } from '../../../project-player/services/projectPlayerService';

const ParticipantHeader: React.FC<ParticipantHeaderProps> = ({
  participant: participantProp,
  pathway,
  graduationDate,
  graduationProgress: graduationProgressProp,
  onViewProfile,
  areAllTasksCompleted = false,
  onStatusUpdate,
  updatedProgress
}) => {
  const navigation = useNavigation();
  const { t } = useLanguage();
  const { user } = useAuth()
  const toast = useToast();
  const { showAlert } = useAlert();

  const [status, setStatus] = useState(participantProp?.status || '')
  const [graduationProgress, setGraduationProgress] = useState(0)
  const showSuccess = (message: string) => {
    showSuccessToast(toast, message);
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
      await updateEntityDetails({
        userId: `${user?.id}`,
        entityId: entityId,
        entityUpdates: {
          status: STATUS.ENROLLED,
        },
      });
      showSuccess(t('projectPlayer.enrolledParticiapantSucess'));
      // Reload page
      window.location.reload();
      // Notify parent component about status update
      if (onStatusUpdate) {
        onStatusUpdate(STATUS.ENROLLED);
      }
    } catch (error) {
      showAlert('error', 'Something Went Wrong');
    }
  };

  const handleLogVisitPress = () => {
    const participantId = (participantProp as User)?.id || (participantProp as any)?.id;
    // @ts-ignore
    navigation.push('log-visit', { id: participantId });
  };

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
    if (status === STATUS.DROPOUT) {
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
   * Render Action Buttons
   * Displays action buttons based on participant status
   *
   * @returns Action buttons JSX based on status
   */
  const renderActionButtons = () => {
    const secondButton = renderSecondButton();

    // If there's a second button, wrap both in HStack
    if (secondButton) {
      return (
        <HStack
          {...participantHeaderStyles.actionButtonsContainer}
          $md-flexDirection="row"
          $md-width="auto"
        >
          {renderViewProfileButton()}
          {secondButton}
        </HStack>
      );
    }

    // Otherwise, just render View Profile button
    return renderViewProfileButton();
  };

  return (
    <PageHeader
      onBackPress={handleBackPress}
      backButtonText={t('participantDetail.header.backToCaseload')}
      _content={participantHeaderStyles.backLinkContainer}
      _container={participantHeaderStyles.container}
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

      {/* Participant Status Card/Warning */}
      <ParticipantProgressCard
        status={status as ParticipantStatus}
        graduationProgress={graduationProgressProp ?? graduationProgress}
        updatedProgress={updatedProgress}
        graduationDate={graduationDate}
      />
    </PageHeader>
  );
};

export default ParticipantHeader;
