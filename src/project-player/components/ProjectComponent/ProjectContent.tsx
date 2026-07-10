import React, {
  memo,
  useCallback,
  useMemo,
  useState,
} from 'react';
import {
  Box,
  VStack,
  Card,
  Button,
  ButtonIcon,
  ButtonText,
} from '@gluestack-ui/themed';
import { useProjectContext, useProjectStable } from '../../context/ProjectContext';
import ProjectInfoCard from './ProjectInfoCard';
import TaskComponent from './TaskComponent';
import AddCustomTaskModal from '../Task/AddCustomTaskModal';
import { projectComponentStyles } from './Styles';
import { useLanguage } from '@contexts/LanguageContext';
import { LucideIcon } from '@ui';
import { PLAYER_MODE } from '@constants/app.constant';

interface ProjectContentProps {
  hasChildren: boolean;
  showPillarFeatures: boolean;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
}

const ProjectContent = memo<ProjectContentProps>(({
  hasChildren,
  showPillarFeatures,
  isModalOpen,
  setIsModalOpen,
}) => {
  const { projectData,oldProjectData, mode, config } = useProjectContext();
  const { projectDataRef } = useProjectStable();
  const { t } = useLanguage();
  const isPreviewMode = useMemo(() => mode === PLAYER_MODE.PREVIEW, [mode]);

  // Pass the actual ref (not live projectData) so task-level components read
  // it at action time via .current instead of subscribing to every update.
  const projectContext = useMemo(
    () => ({ mode, config, projectDataRef }),
    [mode, config, projectDataRef],
  );

  const pillars = useMemo(() => {
    if (!projectData || !hasChildren) return [];
   
    if(oldProjectData?._id && isPreviewMode && projectData.children?.length) {
      return projectData.children.filter((item:any)=> item?.templateData?.metaInformation?.isReplaceable);
    }
    
    return (
      projectData.children?.length
        ? [...projectData.children]
        : projectData.tasks?.filter((task: any) => task.children?.length) ?? []
    );
  }, [projectData,isPreviewMode,oldProjectData?._id, hasChildren]);

  const socialProtectionPillarIds = useMemo(
    () =>
      pillars
        .filter((pillar: any) => pillar.tasks?.find((task: any) => task.isDeletable))
        .map((pillar: any) => pillar._id as string),
    [pillars],
  );

  const onboardingTasks = useMemo(
    () => (!projectData || hasChildren ? [] : projectData.tasks ?? []),
    [projectData, hasChildren],
  );

  // Single-select expand state across pillars (replaces @gluestack-ui/themed
  // Accordion's type="single" behavior — that component was a candidate
  // trigger for a native Fabric/Yoga crash on this screen, RN 0.82,
  // facebook/react-native#52349).
  const [expandedPillarId, setExpandedPillarId] = useState<string | undefined>(
    () => socialProtectionPillarIds[0],
  );

  // Stable per-pillar toggle callbacks — only recreated when `pillars` itself
  // changes, so passing them down doesn't force every pillar to re-render
  // whenever some other pillar is expanded/collapsed.
  const toggleHandlersByPillarId = useMemo(() => {
    const handlers: Record<string, () => void> = {};
    pillars.forEach((task: any) => {
      handlers[task._id] = () =>
        setExpandedPillarId(prev => (prev === task._id ? undefined : task._id));
    });
    return handlers;
  }, [pillars]);

  const handleOpenModal = useCallback(() => setIsModalOpen(true), [setIsModalOpen]);
  const handleCloseModal = useCallback(() => setIsModalOpen(false), [setIsModalOpen]);

  if (!projectData) return null;

  // ── Onboarding layout (flat task list, no pillars) ─────────────────────────
  if (!hasChildren) {
    return (
      <Card {...projectComponentStyles.card} {...projectComponentStyles.onboardingCard}>
        <VStack p="$0" space="md">
          <ProjectInfoCard project={projectData} />
          <Box paddingHorizontal="$5" paddingTop="$2" paddingBottom="$4">
            {onboardingTasks.map((task, index) => (
              <TaskComponent
                key={task._id}
                task={task}
                parentIndex={index}
                isLastTask={index === onboardingTasks.length - 1}
                isOnboardingTask={true}
                projectContext={projectContext}
              />
            ))}
          </Box>
        </VStack>
      </Card>
    );
  }

  // ── Pillar layout (preview or edit) ────────────────────────────────────────
  return (
    <VStack p={isPreviewMode ? '$4' : '$0'} space="md">
      {isPreviewMode && <ProjectInfoCard project={projectData} />}

      {isPreviewMode ? (
        <VStack {...projectComponentStyles.pillarContainer}>
          <VStack {...projectComponentStyles.pillarContainer}>
            {pillars.map(task => (
              <TaskComponent
                key={task._id}
                task={task}
                isChildOfProject={true}
                showAccordionWrapper={false}
                projectContext={projectContext}
                isExpanded={expandedPillarId === task._id}
                onToggleExpand={toggleHandlersByPillarId[task._id]}
              />
            ))}
          </VStack>
        </VStack>
      ) : (
        pillars.map((task,index) => (
          <TaskComponent key={task._id} task={task} parentIndex={index} isChildOfProject={true} projectContext={projectContext}/>
        ))
      )}

      {showPillarFeatures && (
        <Box>
          {/* @ts-ignore */}
          <Button variant="outlineghost" onPress={handleOpenModal}>
            <ButtonIcon as={LucideIcon} name="Plus" />
            <ButtonText>{t('projectPlayer.addCustomTask')}</ButtonText>
          </Button>
          <AddCustomTaskModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            mode="add"
          />
        </Box>
      )}
    </VStack>
  );
});

ProjectContent.displayName = 'ProjectContent';

export default ProjectContent;
