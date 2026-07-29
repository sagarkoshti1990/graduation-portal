import React, { useState, useMemo, useEffect, useCallback, memo } from 'react';
import { Box, VStack, Text, Button, ButtonText, LucideIcon } from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import { useAuth } from '@contexts/AuthContext';
import { interventionPlanStyles } from './Styles';
import ProjectPlayer, {
  ProjectPlayerData,
  ProjectPlayerConfig,
} from '../../../project-player/index';
import { ProjectData, Task } from '../../../project-player/types/project.types';
import { MODE, PROJECT_PLAYER_CONFIGS } from '@constants/PROJECTDATA';
import { MAX_FILE_SIZE, STATUS } from '@constants/app.constant';
import type { InterventionPlanProps, StatusType } from '../../../types/screens';
import { useNavigation } from '@react-navigation/native';
import { sortTasksWithChildren } from '@utils/helper';
import { useOfflineSync } from '@contexts/OfflineSyncContext';
import { refreshOfflineProjectFromServer } from '../../../services/offlineCacheUpdateService';

const InterventionPlan: React.FC<InterventionPlanProps> = ({
  mode,
  projectData,
  projectUnavailableOffline,
  participantProfile,
  onIdpCreation,
  onProgressChange,
  onTaskCompletionChange,
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigation = useNavigation();
  const { isOffline } = useOfflineSync();
  const [isEditMode] = useState(true);
  const [addedTasks, setAddedTasks] = useState<Set<string>>(new Set());
  const [projectSortData,setProjectSortData] = useState<ProjectData>();
  // Local state to track if IDP was just created successfully
  const [localStatus, setLocalStatus] = useState<StatusType | undefined>(
    participantProfile?.status,
  );

  // Update local status when prop changes
  useEffect(() => {
    setLocalStatus(participantProfile?.status);
    if(projectData) {
      const sortedTasks = sortTasksWithChildren(projectData.tasks);
      setProjectSortData({...projectData,tasks:sortedTasks});
    }
  }, [participantProfile?.status,projectData]);


  // Define required optional tasks IDs needed for submission
  const REQUIRED_OPTIONAL_TASKS = ['subtask-sp-003', 'subtask-sp-004'];
  const areAllOptionalTasksAdded = REQUIRED_OPTIONAL_TASKS.every(id =>
    addedTasks.has(id),
  );

  // Handle task update callback from ProjectPlayer — fired only after the
  // triggering action (task update, custom task create/update/delete) has
  // actually succeeded (see ProjectContext.tsx's fireOnTaskUpdate), so it's
  // safe to treat this as "an online action just succeeded" below.
  const handleTaskUpdate = async (task: Task) => {
    if (task.metaInformation?.addedToPlan) {
      setAddedTasks(prev => new Set(prev).add(task._id));
    } else {
      setAddedTasks(prev => {
        const next = new Set(prev);
        next.delete(task._id);
        return next;
      });
    }

    if (isOffline) return; // nothing to refresh from — the server wasn't touched

    const participantId = (participantProfile as any)?.userId ?? '';
    const projectId = projectSortData?._id || '';
    const userId = user?.id || '';
    if (!participantId || !projectId || !userId) return;

    await refreshOfflineProjectFromServer(userId, participantId, projectId);
  };

  // Handle successful IDP creation
  const handleIdpCreationSuccess = useCallback((newProjectId: string) => {
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
          maxFileSize: MAX_FILE_SIZE,
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
        maxFileSize: MAX_FILE_SIZE,
        profileInfo: participantProfile,
        showAddCustomTaskButton,
      };
    }
    else if(status === STATUS.IN_PROGRESS){
       const baseConfig =  MODE.editMode;
      const showAddCustomTaskButton = status === STATUS.IN_PROGRESS;
      return {
        ...baseConfig,
        maxFileSize: MAX_FILE_SIZE,
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
      [STATUS.NOT_ELIGIBLE]: MODE.readOnlyMode,
      [STATUS.GRADUATED]: MODE.readOnlyMode,
    };

    return statusConfigMap[status];
  }, [localStatus, isEditMode, areAllOptionalTasksAdded, t, participantProfile, handleIdpCreationSuccess]);
  
  // Inject fetched project details into data.data so ProjectPlayer uses them directly,
  const projectPlayerData: ProjectPlayerData = useMemo(
    () => ({
      projectId: projectSortData?._id,
      entityId: participantProfile?.entityId,
      userStatus: participantProfile?.status,
      pillarCategoryRelation: undefined,
      data: projectSortData ?? undefined,
      province: participantProfile?.province?.value,
      offlineKeyPrefix: user?.id ?? '',
      participantId: (participantProfile as any)?.userId ?? '',
    }),
    [ participantProfile?.entityId, participantProfile?.status, participantProfile?.province?.value, projectSortData, user?.id, (participantProfile as any)?.userId],
  );
  
  // Offline and this project was never downloaded via the Offline Download flow —
  // there's no cached data to show, so tell the user why instead of rendering an
  // empty/broken ProjectPlayer.
  if (!projectData && projectUnavailableOffline) {
    return (
      <Box {...interventionPlanStyles.container} mt="$7">
        <VStack {...interventionPlanStyles.content}>
          <Box {...interventionPlanStyles.iconContainer}>
            <LucideIcon
              name="WifiOff"
              size={48}
              color={interventionPlanStyles.iconColor}
            />
          </Box>
          <Text {...interventionPlanStyles.title}>
            {t('participantDetail.interventionPlan.projectUnavailableOfflineTitle')}
          </Text>
          <Text {...interventionPlanStyles.description}>
            {t('participantDetail.interventionPlan.projectUnavailableOfflineDescription')}
          </Text>
        </VStack>
      </Box>
    );
  }

  if(projectData && (!config?.mode || !projectSortData)){
    if(!config?.mode) {
      console.log(`config is not defined`,config);
    }
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
            isDisabled={mode === MODE.readOnlyMode?.mode}
            onPress={() => {
              // @ts-ignore
              navigation.navigate('template', { id: participantProfile?.userId  });
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
    localStatus === STATUS.NOT_ONBOARDED ||
    localStatus === STATUS.IN_PROGRESS ||
    localStatus === STATUS.COMPLETED ||
    localStatus === STATUS.DROPOUT ||
    localStatus === STATUS.NOT_ELIGIBLE
  ) {
    return (
      <Box flex={1} mt="$1">
        <ProjectPlayer
          config={mode ? {...config,mode} : config}
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

export default memo(
  InterventionPlan,
  (prevProps, nextProps) => {
    return (
      prevProps.participantProfile?.idpProjectId ===
        nextProps.participantProfile?.idpProjectId &&
      prevProps.participantProfile?.status ===
        nextProps.participantProfile?.status &&
      prevProps.projectData === nextProps.projectData &&
      prevProps.projectUnavailableOffline === nextProps.projectUnavailableOffline
    );
  },
);
