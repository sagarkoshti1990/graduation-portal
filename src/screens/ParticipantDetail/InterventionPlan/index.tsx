import React, { useState, useMemo, useEffect, useCallback, memo } from 'react';
import { Box, VStack, Text, Button, ButtonText, LucideIcon } from '@ui';
import { Spinner } from '@gluestack-ui/themed';
import { useLanguage } from '@contexts/LanguageContext';
import { interventionPlanStyles } from './Styles';
import ProjectPlayer, {
  ProjectPlayerData,
  ProjectPlayerConfig,
} from '../../../project-player/index';
import { Task, ProjectData } from '../../../project-player/types/project.types';
import { MODE, PROJECT_PLAYER_CONFIGS } from '@constants/PROJECTDATA';
import { STATUS } from '@constants/app.constant';
import type { InterventionPlanProps, StatusType } from '../../../types/screens';
import { useNavigation } from '@react-navigation/native';
import dataService from '../../../services/dataService';

const InterventionPlan: React.FC<InterventionPlanProps> = ({
  participantStatus,
  participantId,
  participantProfile,
  onIdpCreation,
  onProgressChange,
  getProjectData,
  onTaskCompletionChange
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
  // Project details fetched inside InterventionPlan (online: API; offline: IndexedDB cache)
  const [fetchedProjectData, setFetchedProjectData] = useState<ProjectData | null>(null);
  const [isProjectLoading, setIsProjectLoading] = useState(true);

  // Update local status when prop changes
  useEffect(() => {
    setLocalStatus(participantStatus);
  }, [participantStatus]);

  // Define required optional tasks IDs needed for submission
  const REQUIRED_OPTIONAL_TASKS = ['subtask-sp-003', 'subtask-sp-004'];
  const areAllOptionalTasksAdded = REQUIRED_OPTIONAL_TASKS.every(id =>
    addedTasks.has(id),
  );

  const resolvedProjectId = (localStatus === STATUS.NOT_ONBOARDED && participantProfile.onBoardedProjectId) ? participantProfile.onBoardedProjectId : projectId || participantProfile?.idpProjectId;
  const entityId = participantProfile?.entityId;
  const userId = participantProfile.userId;

  // Handle project details fetch — supports online and offline.
  // Online: fetches latest from API via dataService.
  // Offline: reads from IndexedDB cache; no failing network call is triggered.
  useEffect(() => {    
    let cancelled = false;
    const fun = async () => {
      if (!resolvedProjectId) {
        setFetchedProjectData(null);
        setIsProjectLoading(false);
        return;
      }
      setIsProjectLoading(true);
      const response = await dataService.getProject<ProjectData>(userId, resolvedProjectId)
      if (response?.data) {
        setFetchedProjectData(response.data);
        getProjectData?.(response.data);
        setIsProjectLoading(false)
      } else if (!cancelled) {setIsProjectLoading(false)}
    }
    fun();
    return () => {
      cancelled = true;
    };
  }, [resolvedProjectId, userId, getProjectData]);

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
    if (newProjectId) {
      setProjectId(newProjectId);
    }
    if (onIdpCreation) {
      onIdpCreation(newProjectId);
    }

  }, [onIdpCreation]);

  // Memoize ProjectPlayer config based on status and edit mode
  const config: ProjectPlayerConfig = useMemo(() => {
    if (!localStatus) {
      return MODE.previewMode;
    }

    const status = localStatus;

    if (status === STATUS.NOT_ONBOARDED) {
      // Determine ProjectPlayer config and data based on participant status
      const configData = PROJECT_PLAYER_CONFIGS;
      const selectedMode = MODE.editMode;
  
      return {
        ...configData,
        ...selectedMode,
        showAddCustomTaskButton: false,
        profileInfo: participantProfile,
      };
    }
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
      [STATUS.COMPLETED]: MODE.readOnlyMode,
      [STATUS.DROPOUT]: MODE.readOnlyMode,
      [STATUS.GRADUATED]: MODE.readOnlyMode,
    };

    return statusConfigMap[status];
  }, [localStatus, isEditMode, areAllOptionalTasksAdded, t, participantProfile, handleIdpCreationSuccess]);
  
  // Inject fetched project details into data.data so ProjectPlayer uses them directly,
  const projectPlayerData: ProjectPlayerData = useMemo(
    () => ({
      projectId: resolvedProjectId,
      entityId,
      userStatus: participantProfile?.status,
      pillarCategoryRelation: undefined,
      data: fetchedProjectData ?? undefined,
      province: participantProfile?.province?.value
    }),
    [resolvedProjectId, entityId, participantProfile?.status,participantProfile?.province?.value, fetchedProjectData],
  );
  
  if(!config?.mode){
    console.log('config is not defined',config);
    return;
  }
  // Show empty state for ENROLLED status when player is not shown yet
  if (localStatus === STATUS.ENROLLED) {
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

// Show loading spinner while fetching project details
  if (isProjectLoading) {
    return (
      <Box flex={1} alignItems="center" justifyContent="center">
        <Spinner size="large" />
      </Box>
    );
  }
  // Show ProjectPlayer for IN_PROGRESS, COMPLETED, and other statuses
  if (
    localStatus === STATUS.NOT_ONBOARDED ||
    localStatus === STATUS.IN_PROGRESS ||
    localStatus === STATUS.COMPLETED ||
    localStatus === STATUS.DROPOUT
  ) {
    return (
      <Box flex={1} mt="$1">
        <ProjectPlayer
          config={config}
          data={projectPlayerData}
          onTaskUpdate={handleTaskUpdate}
          onProgressChange={onProgressChange}
          onTaskCompletionChange={onTaskCompletionChange}
        />
      </Box>
    );
  }
  // Fallback: render ProjectPlayer for any other status
  return <Text>{t("projectPlayer.failToLoad")}</Text>;
};

export default memo(InterventionPlan);
