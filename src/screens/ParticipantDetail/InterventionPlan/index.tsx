import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Box, VStack, Text, Button, ButtonText, LucideIcon } from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import { interventionPlanStyles } from './Styles';
import ProjectPlayer, {
  ProjectPlayerData,
  ProjectPlayerConfig,
} from '../../../project-player/index';
import { Task } from '../../../project-player/types/project.types';
import { MODE } from '@constants/PROJECTDATA';
import { STATUS } from '@constants/app.constant';
import type { InterventionPlanProps, StatusType } from '../../../types/screens';
import { useNavigation } from '@react-navigation/native';
import logger from '@utils/logger';

const InterventionPlan: React.FC<InterventionPlanProps> = ({
  participantStatus,
  participantId,
  participantProfile,
  onIdpCreation,
  onProgressChange,
}) => {
  const { t } = useLanguage();
  const navigation = useNavigation();
  const [isEditMode] = useState(true);
  const [addedTasks, setAddedTasks] = useState<Set<string>>(new Set());
  // Local state to track if IDP was just created successfully
  const [localStatus, setLocalStatus] = useState<StatusType | undefined>(
    participantStatus,
  );
  // State to store the projectId from IDP creation
  const [projectId, setProjectId] = useState<string | undefined>(undefined);

  // Update local status when prop changes
  useEffect(() => {
    setLocalStatus(participantStatus);
  }, [participantStatus]);

  // Use local status for rendering logic
  const currentStatus = localStatus || participantStatus;

  // Define required optional tasks IDs needed for submission
  const REQUIRED_OPTIONAL_TASKS = ['subtask-sp-003', 'subtask-sp-004'];
  const areAllOptionalTasksAdded = REQUIRED_OPTIONAL_TASKS.every(id =>
    addedTasks.has(id),
  );

  // Handle task update callback from ProjectPlayer
  const handleTaskUpdate = (task: Task) => {
    if (task.metaInformation?.addedToPlan) {
      setAddedTasks(prev => new Set(prev).add(task._id));
    } else {
      setAddedTasks(prev => {
        const next = new Set(prev);
        next.delete(task._id);
        return next;
      });
    }
  };

  // Handle successful IDP creation
  const handleIdpCreationSuccess = useCallback((newProjectId: string) => {
    logger.log('IDP created with project ID:', newProjectId);
    if (newProjectId) {
      setProjectId(newProjectId);
    }
    if (onIdpCreation) {
      onIdpCreation(newProjectId);
    }

  }, [onIdpCreation]);

  // Memoize ProjectPlayer config based on status and edit mode
  const config: ProjectPlayerConfig = useMemo(() => {
    if (!currentStatus) {
      return MODE.previewMode;
    }

    const status = currentStatus;

    if (status === STATUS.ENROLLED) {
      const baseConfig = isEditMode ? MODE.editMode : MODE.previewMode;
      const showAddCustomTaskButton =
        status === STATUS.ENROLLED || status === STATUS.IN_PROGRESS;
      if (!isEditMode) {
        return {
          ...baseConfig,
          profileInfo: participantProfile,
          showSubmitButton: true,
          onSubmitInterventionPlan: handleIdpCreationSuccess,
          isSubmitDisabled: !areAllOptionalTasksAdded,
          submitWarningMessage: t(
            'participantDetail.interventionPlan.socialProtectionWarning',
          ),
        };
      }

      return {
        ...baseConfig,
        profileInfo: participantProfile,
        showAddCustomTaskButton,
      };
    }
    else if(status === STATUS.IN_PROGRESS){
       const baseConfig =  MODE.editMode;
      const showAddCustomTaskButton = status === STATUS.IN_PROGRESS;
      
        return {
          ...baseConfig,
          profileInfo: participantProfile,
          showSubmitButton: true,
          onSubmitInterventionPlan: handleIdpCreationSuccess,
          isSubmitDisabled: !areAllOptionalTasksAdded,
          showAddCustomTaskButton
        };
    
    }

    // Map other statuses to their respective configs
    const statusConfigMap: Record<string, ProjectPlayerConfig> = {
      [STATUS.IN_PROGRESS]: MODE.editMode,
      [STATUS.COMPLETED]: MODE.editMode,
      [STATUS.DROPOUT]: MODE.readOnlyMode,
    };

    return statusConfigMap[status];
  }, [currentStatus, isEditMode, areAllOptionalTasksAdded, t, participantProfile, handleIdpCreationSuccess]);

  const projectPlayerData: ProjectPlayerData = useMemo(
    () => ({
      projectId: projectId || participantProfile?.idpProjectId,
      pillarCategoryRelation: undefined,
    }),
    [projectId, participantProfile?.idpProjectId],
  );

  // Show empty state for ENROLLED status when player is not shown yet
  if (currentStatus === STATUS.ENROLLED) {
    return (
      <Box {...interventionPlanStyles.container} mt="$7">
        <VStack {...interventionPlanStyles.content}>
          <Box {...interventionPlanStyles.iconContainer}>
            <LucideIcon
              name="FileText"
              size={48}
              color={interventionPlanStyles.iconColor}
            />
          </Box>
          <Text {...interventionPlanStyles.title}>
            {t('participantDetail.interventionPlan.noPlanAssigned')}
          </Text>
          <Text {...interventionPlanStyles.description}>
            {t('participantDetail.interventionPlan.noPlanDescription')}
          </Text>
          <Button
            {...interventionPlanStyles.button}
            onPress={() => {
              navigation.navigate('template', { id: participantId  });
            }}
          >
            <ButtonText {...interventionPlanStyles.buttonText}>
              {t('participantDetail.interventionPlan.developPlan')}
            </ButtonText>
          </Button>
        </VStack>
      </Box>
    );
  }

  // Show ProjectPlayer for IN_PROGRESS, COMPLETED, and other statuses
  if (
    currentStatus === STATUS.IN_PROGRESS ||
    currentStatus === STATUS.COMPLETED ||
    currentStatus === STATUS.DROPOUT
  ) {
    return (
      <Box flex={1} mt="$1">
        <ProjectPlayer
          config={config}
          data={projectPlayerData}
          onTaskUpdate={handleTaskUpdate}
          onProgressChange={onProgressChange}
        />
      </Box>
    );
  }

  // Fallback: render ProjectPlayer for any other status
  return (
    <Box flex={1} mt="$1">
      <ProjectPlayer
        config={config}
        data={projectPlayerData}
        onTaskUpdate={handleTaskUpdate}
        onProgressChange={onProgressChange}
      />
    </Box>
  );
};

export default InterventionPlan;
