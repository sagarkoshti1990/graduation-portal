import React, { useState } from 'react';
import {
  Box,
  VStack,
  Card,
  ScrollView,
  Button,
  ButtonText,
  HStack,
  Text,
  Pressable,
  Accordion,
} from '@gluestack-ui/themed';
import { useProjectContext } from '../../context/ProjectContext';
import ProjectInfoCard from './ProjectInfoCard';
import TaskComponent from './TaskComponent';
import AddCustomTaskModal from '../Task/AddCustomTaskModal';
import { projectComponentStyles } from './Styles';
import { taskAccordionStyles } from '../Task/Styles';
import { useLanguage } from '@contexts/LanguageContext';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';
import Container from '@ui/Container';
import { LucideIcon, Modal, useAlert } from '@ui';
import { theme } from '@config/theme';
import { submitInterventionPlan } from '../../services/projectPlayerService';
import { addCustomTaskStyles } from '../Task/Styles';
import { PLAYER_MODE } from '@constants/app.constant';
import { PILLAR_NAMES } from '@constants/app.constant';

const ProjectComponent: React.FC = () => {
  const {
    projectData,
    mode,
    config,
    addedToPlanTaskIds,
    taskPlanActionPerformedIds,
  } =
    useProjectContext();
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isChangePathwayOpen, setIsChangePathwayOpen] = useState(false);
  const { showAlert } = useAlert();

  const hasChildren = !!projectData?.children?.length || projectData?.tasks?.some(task => !!task.children?.length);

  const isEditMode =
    mode === 'edit' && config.showAddCustomTaskButton !== false;

  // Only show progress bar and +Add Custom Task for projects with pillars (Intervention Plan), not flat tasks (Onboarding)
  const showPillarFeatures = isEditMode && hasChildren;

  const shouldShowSubmitButton = config.showSubmitButton && mode === 'preview';

  const getPillarOrderIndex = (name = ''): number => {
    const normalized = name.toLowerCase();
    const order = [
      PILLAR_NAMES.SOCIAL_EMPOWERMENT,
      PILLAR_NAMES.LIVELIHOOD,
      PILLAR_NAMES.FINANCIAL_INCLUSION,
      PILLAR_NAMES.SOCIAL_PROTECTION,
    ];
    const index = order.findIndex(pillar => normalized.includes(pillar));
    return index === -1 ? order.length : index;
  };

  const getExcludedTaskIds = (
    tasks: any[] = [],
    addedToPlanSet: Set<string>,
  ): string[] => {
    return tasks.flatMap(task => {
      const nested = [
        ...(task.name === 'Social Protection' && task.tasks
          ? getExcludedTaskIds(task.tasks, addedToPlanSet)
          : []),
      ];
      const isOptional = task?.isDeletable === true;
      const isAddedToPlan = addedToPlanSet.has(task._id);
      const excluded = isOptional && !isAddedToPlan ? [task._id] : [];
      return [...excluded, ...nested];
    });
  };

  const getDeletableTaskIds = (tasks: any[] = []): string[] => {
    return tasks.flatMap(task => {
      const nested = [
        ...(task.name === 'Social Protection' && task.tasks
          ? getDeletableTaskIds(task.tasks)
          : []),
      ];
      const isDeletable = task?.isDeletable === true;
      return [...(isDeletable ? [task._id] : []), ...nested];
    });
  };

  const onSubmitInterventionPlan = async () => {
    if (!projectData) return;

    try {
      // Collect all custom tasks grouped by template/pillar
      const templates: Array<{
        templateId: string;
        targetTaskName?: string;
        targetProjectName?: string;
        customTasks: Array<{
          name: string;
          description: string;
          type: string;
        }>;
      }> = [];

      const excludedTaskIds = Array.from(
        new Set(
          getExcludedTaskIds(
            [
              ...(projectData.children || []),
            ],
            new Set(addedToPlanTaskIds),
          ),
        ),
      );
      // Process children (templates/pillars)
      if (projectData.children && projectData.children.length > 0) {
        projectData.children.forEach((pillar: any) => {
          // Get custom tasks from this pillar (check both tasks and children properties)
          const pillarTasks = pillar.tasks || pillar.children || [];
          const customTasks = pillarTasks
            .filter((task: any) => task.isCustomTask === true)
            .map((task: any) => ({
              name: task.name,
              description: task.description || '',
              type: 'simple',
            }));

          // Determine if this is a task or project based on type
          const isProject = pillar.type === 'project';
          const isSocialProtectionPillar = pillar.name === 'Social Protection';

          const templatePayload: any = {
            templateId: pillar.templateId,
            ...(isProject
              ? { targetProjectName: pillar.name }
              : { targetTaskName: pillar.name }),
            customTasks,
          };

          // ONLY attach excludedTaskIds to Social Protection pillar
          if (isSocialProtectionPillar) {
            templatePayload.excludedTaskIds = excludedTaskIds;
          }

          templates.push(templatePayload);
        });
      }

      // Format the payload
      const userId = config.profileInfo?.id?.toString();
      if (!userId) {
        showAlert('error', t('projectPlayer.error.participantIdMissing'));
        return;
      }

      const reqBody = {
        templates,
        userId,
        entityId: config.profileInfo?.entityId || userId, // Fallback to userId if entityId not available
        projectConfig: { referenceFrom: process.env.GLOBAL_LC_PROGRAM_ID },
      };

      // Call API to submit intervention plan
      const response  = await submitInterventionPlan(reqBody);
      const newProjectId = response?.data?.projectId
      if (!response.error) {
        showAlert('success', t('template.IdpCreationSuccess'));

        // Call the config callback if provided (this will update status to IN_PROGRESS)
        if (config.onSubmitInterventionPlan) {
          config.onSubmitInterventionPlan(newProjectId);
        }
      } else {
        showAlert(
          'error',
          response.error || t('projectPlayer.error.submitFailed'));
      }
    } catch (error) {
      console.error('Error submitting intervention plan:', error);
      showAlert('error', t('projectPlayer.error.submitFailed'));
    }
  };

  if (!projectData) {
    return null;
  }

  return (
    <Container {...projectComponentStyles.container}>
      <VStack flex={1}>
        <ScrollView flex={1}
          {...projectComponentStyles.scrollView}
          contentContainerStyle={{ paddingBottom: 40 }}
        >

          {/* Shared content logic - pillars or onboarding tasks */}
          {(() => {
            const pillarContent = hasChildren ? (
              // Render pillars
              <>
                {(() => {
                  const sortedPillars = (projectData?.children?.length
                  ? [...projectData.children]
                  : projectData?.tasks?.filter(task => task.children?.length) || []
                  ).sort(
                        (a, b) =>
                          getPillarOrderIndex(a?.name) -
                          getPillarOrderIndex(b?.name),
                      );

                  if (mode !== PLAYER_MODE.PREVIEW) {
                    return sortedPillars.map(task => (
                      <TaskComponent
                        key={task?._id}
                        task={task}
                        isChildOfProject={true}
                      />
                    ));
                  }

                  const socialProtectionPillar = sortedPillars.find(
                    pillar =>
                      pillar.name.toLowerCase() === PILLAR_NAMES.SOCIAL_PROTECTION,
                  );

                  return (
                    <VStack {...projectComponentStyles.pillarContainer}>
                      <Accordion
                        {...taskAccordionStyles.accordion}
                        type="single"
                        isCollapsible={true}
                        defaultValue={socialProtectionPillar ? [socialProtectionPillar._id] : undefined}
                      >
                        <VStack {...projectComponentStyles.pillarContainer}>
                          {sortedPillars.map(task => (
                            <TaskComponent
                              key={task?._id}
                              task={task}
                              isChildOfProject={true}
                              showAccordionWrapper={false}
                            />
                          ))}
                        </VStack>
                      </Accordion>
                    </VStack>
                  );
                })()}

                {/* Pillar features only: +Add Custom Task button */}
                {showPillarFeatures && (
                  <Box {...projectComponentStyles.addCustomTaskContainer}>
                    <Pressable onPress={() => setIsModalOpen(true)}>
                      {(state: any) => {
                        const isHovered =
                          state?.hovered || state?.pressed || false;
                        return (
                          <Box
                            {...addCustomTaskStyles.buttonBox}
                            bg={isHovered ? '$primary100' : '$accent100'}
                            borderColor={
                              isHovered ? '$primary500' : '$mutedBorder'
                            }
                          >
                            <HStack {...addCustomTaskStyles.buttonContent}>
                              <LucideIcon
                                name="Plus"
                                size={18}
                                color={
                                  isHovered
                                    ? theme.tokens.colors.primary700
                                    : theme.tokens.colors.primary500
                                }
                                strokeWidth={2.5}
                              />
                              <Text
                                {...TYPOGRAPHY.button}
                                color={isHovered ? '$primary700' : '$primary500'}
                                fontWeight="$semibold"
                              >
                                {t('projectPlayer.addTaskToPillar')}
                              </Text>
                            </HStack>
                          </Box>
                        );
                      }}
                    </Pressable>
                    <AddCustomTaskModal
                      isOpen={isModalOpen}
                      onClose={() => setIsModalOpen(false)}
                      mode="add"
                    />
                  </Box>
                )}
              </>
            ) : (
              // Render onboarding tasks
              <Box paddingHorizontal="$5" paddingTop="$2" paddingBottom="$4">
                {projectData?.tasks?.map((task, index) => (
                  <TaskComponent
                    key={task._id}
                    task={task}
                    isLastTask={
                      index === (projectData.tasks?.length || 0) - 1
                    }
                    isOnboardingTask={true}
                  />
                ))}
              </Box>
            );

            // Render ProjectInfoCard (only for onboarding or preview top-level)
            // Remove from edit mode as per user request (Image 2 feedback)
            const header = !hasChildren || mode === PLAYER_MODE.PREVIEW ? (
              <ProjectInfoCard project={projectData} />
            ) : null;

            const isSingleContainer = !hasChildren;

            const content = (
              <VStack
                paddingHorizontal={
                  isSingleContainer ? 0 : '$1'
                }
                paddingTop={isSingleContainer ? 0 : '$4'}
                space="md"
              >
                {header}
                {pillarContent}
              </VStack>
            );

            return isSingleContainer ? (
              <Card {...projectComponentStyles.card} {...projectComponentStyles.onboardingCard}>
                {content}
              </Card>
            ) : content;
          })()}
        </ScrollView>

        {/* Footer with Change Pathway and Submit Intervention Plan Buttons */}
        {shouldShowSubmitButton && (
          <VStack
            space="md"
            padding="$4"
            bg={mode === PLAYER_MODE.PREVIEW ? 'transparent' : '$white'}
            borderTopWidth={1}
            borderTopColor="$borderLight300"
          >
            {(() => {
              const deletableTaskIds = getDeletableTaskIds(
                projectData.children || [],
              );
              const allActionsCompleted = deletableTaskIds.every(id =>
                taskPlanActionPerformedIds.includes(id),
              );
              const isSubmitDisabled =
                config.isSubmitDisabled || !allActionsCompleted;

              return (
                <>
                  {/* Warning Banner - Show when Submit is disabled */}
                  <Box
                    bg="$warning50"
                    borderWidth={1}
                    borderColor="$warning300"
                    borderRadius="$md"
                    padding="$3"
                  >
                    <HStack space="sm" alignItems="center">
                      <LucideIcon
                        name="AlertCircle"
                        size={18}
                        color="#ca8a04"
                      />
                      <Text fontSize="$sm" color="$warning700">
                        {t('participantDetail.interventionPlan.warningMsg')}
                      </Text>
                    </HStack>
                  </Box>

                  {/* Responsive Button Container - stacks on mobile, row on web */}
                  <Box {...projectComponentStyles.footerButtonContainer}>
                    {/* Change Pathway Button */}
                    <Button
                      borderRadius="$md"
                      paddingHorizontal="$4"
                      paddingVertical="$2"
                      onPress={() => {
                        setIsChangePathwayOpen(true);
                      }}
                      $hover-borderColor="$primary500"
                      $hover-bg="$error50"
                      {...projectComponentStyles.changePathwayButton}
                    >
                      <ButtonText
                        color="$textPrimary"
                        {...TYPOGRAPHY.button}
                        fontWeight="$medium"
                      >
                        {t('participantDetail.interventionPlan.changePathway')}
                      </ButtonText>
                    </Button>

                    {/* Submit Intervention Plan Button */}
                    <Button
                      bg="$primary500"
                      borderRadius="$md"
                      paddingHorizontal="$6"
                      paddingVertical="$2"
                      onPress={onSubmitInterventionPlan}
                      isDisabled={isSubmitDisabled}
                      opacity={isSubmitDisabled ? 0.5 : 1}
                      $hover-bg="$primary600"
                      $web-cursor="pointer"
                      {...projectComponentStyles.submitButton}
                    >
                      <ButtonText
                        color="$backgroundPrimary.light"
                        {...TYPOGRAPHY.button}
                        fontWeight="$semibold"
                      >
                        {t(
                          'participantDetail.interventionPlan.submitInterventionPlan',
                        )}
                      </ButtonText>
                    </Button>
                  </Box>
                  <Modal
                    isOpen={isChangePathwayOpen}
                    onClose={() => setIsChangePathwayOpen(false)}
                    headerTitle={t('participantDetail.interventionPlan.changePathway')}
                    confirmButtonText="common.confirm"
                    cancelButtonText="common.cancel"
                    onConfirm={() => {
                      setIsChangePathwayOpen(false);
                      if (config.onChangePathway) {
                        config.onChangePathway();
                      }
                    }}
                  >
                    <Text {...TYPOGRAPHY.paragraph} color="$textSecondary">
                      {t(
                        'participantDetail.interventionPlan.changePathwayCofirmationMsg',
                      )}
                    </Text>
                  </Modal>
                </>
              );
            })()}
          </VStack>
        )}
      </VStack>
    </Container>
  );
};
export default ProjectComponent;
