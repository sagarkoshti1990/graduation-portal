import React, {
  memo,
  useCallback,
  useMemo,
} from 'react';
import {
  Box,
  VStack,
  Card,
  Accordion,
  Button,
  ButtonIcon,
  ButtonText,
} from '@gluestack-ui/themed';
import { useProjectContext } from '../../context/ProjectContext';
import ProjectInfoCard from './ProjectInfoCard';
import TaskComponent from './TaskComponent';
import AddCustomTaskModal from '../Task/AddCustomTaskModal';
import { projectComponentStyles } from './Styles';
import { taskAccordionStyles } from '../Task/Styles';
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
  const { projectData, mode, config } = useProjectContext();
  const { t } = useLanguage();

  const projectContext = useMemo(
    () => ({ mode, config, projectDataRef:projectData }),
    [mode, config, projectData],
  );

  const pillars = useMemo(() => {
    if (!projectData || !hasChildren) return [];
    return (
      projectData.children?.length
        ? [...projectData.children]
        : projectData.tasks?.filter((task: any) => task.children?.length) ?? []
    );
  }, [projectData, hasChildren]);

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

  const isPreviewMode = useMemo(() => mode === PLAYER_MODE.PREVIEW, [mode]);

  // Stable accordion default so it doesn't re-mount on unrelated renders.
  const defaultAccordionValue = useMemo(
    () => (socialProtectionPillarIds.length ? socialProtectionPillarIds : undefined),
    [socialProtectionPillarIds],
  );

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
          <Accordion
            {...taskAccordionStyles.accordionPreview}
            type="single"
            isCollapsible={true}
            defaultValue={defaultAccordionValue}
          >
            <VStack {...projectComponentStyles.pillarContainer}>
              {pillars.map(task => (
                <TaskComponent
                  key={task._id}
                  task={task}
                  isChildOfProject={true}
                  showAccordionWrapper={false}
                  projectContext={projectContext}
                />
              ))}
            </VStack>
          </Accordion>
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
