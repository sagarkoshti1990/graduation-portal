import React, { useState, useMemo, useCallback } from 'react';
import {
  Box,
  VStack,
  ScrollView,
  Button,
  ButtonText,
  ButtonSpinner,
  HStack,
  Text,
  ButtonIcon,
} from '@gluestack-ui/themed';
import { useProjectContext } from '../../context/ProjectContext';
import ProjectContent from './ProjectContent';
import { projectComponentStyles } from './Styles';
import { useLanguage } from '@contexts/LanguageContext';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';
import Container from '@ui/Container';
import { LucideIcon, Modal, useAlert } from '@ui';
import { submitInterventionPlan, updateInterventionPlan } from '../../services/projectPlayerService';
import { PLAYER_MODE } from '@constants/app.constant';
import { isNetworkOffline } from '@utils/networkStatus';
import offlineStorage from '../../../services/offlineStorage';
import { PARTICIPANT_KEYS } from '@constants/STORAGE_KEYS';
import { useAuth } from '@contexts/AuthContext';

function getDeletableTaskIds(tasks: any[] = []): string[] {
  return tasks.flatMap(task => {
    const nested = [
      ...(task.tasks?.find((st: any) => st.isDeletable) as boolean
        ? getDeletableTaskIds(task.tasks)
        : []),
    ];
    const isDeletable = task?.isDeletable === true;
    return [...(isDeletable ? [task._id] : []), ...nested];
  });
}

const ProjectComponent = React.memo(() => {
  const {
    projectData,
    oldProjectData,
    mode,
    config,
    addedToPlanTasks,
  } =
    useProjectContext();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isChangePathwayOpen, setIsChangePathwayOpen] = useState(false);
  const [isSubmittingInterventionPlan, setIsSubmittingInterventionPlan] =
    useState(false);
  const { showAlert } = useAlert();

  const deletableTaskIds = useMemo(
    () => {
      let children = projectData?.children;
      if(oldProjectData?._id) {
        children = children?.filter((item:any)=> item?.templateData?.metaInformation?.isReplaceable)
      }
      return getDeletableTaskIds(children ?? [])
    },
    [projectData?.children,oldProjectData?._id],
  );
  const allActionsCompleted = useMemo(
    () => deletableTaskIds.every(id => id in addedToPlanTasks),
    [deletableTaskIds, addedToPlanTasks],
  );
  
  const isSubmitDisabled = config.isSubmitDisabled || !allActionsCompleted || !!config.isOfflineSyncing;
  const hasChildren = !!projectData?.children?.length || projectData?.tasks?.some(task => !!task.children?.length);
  const isEditMode =
    mode === 'edit' && config.showAddCustomTaskButton !== false;
  // Only show progress bar and +Add Custom Task for projects with pillars (Intervention Plan), not flat tasks (Onboarding)
  const showPillarFeatures = isEditMode && hasChildren;
  const shouldShowSubmitButton = config.showSubmitButton && mode === 'preview';

  const onSubmitInterventionPlan = useCallback(async () => {
    if (!projectData) return;

    setIsSubmittingInterventionPlan(true);
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

      // Intersect with the current tree's deletable task ids so a stale rejection carried
      // over from a resumed offline draft (recorded against a different category/pillar
      // instance) can't silently exclude an unrelated task that happens to collide by id.
      const excludedTaskIds = deletableTaskIds.filter(
        id => addedToPlanTasks[id] === false,
      );
      let keywords: string[] = [];
      // Plain, whitelisted snapshot of every custom task (across all pillars) — stored
      // alongside the queued submission so a resumed offline draft can re-inject them.
      // Whitelisted (not a raw Task spread) because web storage goes through
      // structuredClone, which throws on non-plain values.
      const draftCustomTasks: Array<Record<string, any>> = [];
      // Process children (templates/pillars)
      if (projectData.children && projectData.children.length > 0) {
        projectData.children.forEach((pillar: any) => {
          // Get custom tasks from this pillar (check both tasks and children properties)
          keywords = [...keywords,...(pillar?.projectKeywords || [])];
          const pillarTasks = pillar.tasks || pillar.children || [];
          const pillarCustomTasks = pillarTasks.filter((task: any) => task.isCustomTask === true);
          pillarCustomTasks.forEach((task: any) => {
            draftCustomTasks.push({
              _id: task._id,
              name: task.name,
              description: task.description || '',
              type: task.type || 'simple',
              status: task.status,
              isCustomTask: true,
              parentId: task.parentId,
              serviceProvider: task.serviceProvider,
              externalId: task.externalId,
              pillarId: pillar._id,
            });
          });
          const customTasks = pillarCustomTasks
            .map((task: any) => ({
              name: task.name,
              description: task.description || '',
              type: 'simple',
            }));

          // Determine if this is a task or project based on type
          const isProject = pillar.type === 'project';
          const isSocialProtectionPillar = pillar.tasks?.find((task:any) => task.isDeletable) as boolean;
          const templatePayload: any = {
            templateId: pillar.templateId,
            categoryId: pillar.categoryId,
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

      const isReplace = !!oldProjectData;
      const reqBody = isReplace
        ? { templates, keywords }
        : {
            templates,
            userId,
            entityId: config.profileInfo?.entityId || userId, // Fallback to userId if entityId not available
            projectConfig: { referenceFrom: process.env.GLOBAL_LC_PROGRAM_ID },
            baseTemplateId: process.env.CERTIFICATE_BASE_TEMPLATE_ID || '',
            keywords,
          };

      // Offline: queue the submission for later sync instead of attempting the
      // API call — there is no server-side project yet, so there is no
      // newProjectId to hand back to onSubmitInterventionPlan.
      if (isNetworkOffline()) {
        const lcUserId = user?.id ?? '';
        await offlineStorage.create(PARTICIPANT_KEYS.idpSubmissionPending(lcUserId, userId), {
          reqBody,
          isReplace,
          oldProjectId: oldProjectData?._id,
          queuedAt: Date.now(),
          draft: {
            selectedPathway: config.idpDraftMeta?.selectedPathway ?? '',
            selectionByPillar: config.idpDraftMeta?.selectionByPillar ?? {},
            pillarIdsToGetIdp: config.idpDraftMeta?.pillarIdsToGetIdp ?? [],
            addedToPlanTasks,
            customTasks: draftCustomTasks,
          },
        });
        showAlert('success', t('template.IdpQueuedOffline'));
        config.onQueueInterventionPlanOffline?.();
        return;
      }

      // Online: clear any leftover queued draft for this participant so the background
      // sync engine can't later replay a submission that was just made directly.
      const clearPendingDraft = () =>
        offlineStorage
          .remove(PARTICIPANT_KEYS.idpSubmissionPending(user?.id ?? '', userId))
          .catch(() => {});

      if (isReplace) {
        const response = await updateInterventionPlan(oldProjectData._id, reqBody);
        if(!response.error) {
          const newProjectId = response?.data?.projectId
          await clearPendingDraft();
          if (config.onSubmitInterventionPlan) {
            config.onSubmitInterventionPlan(newProjectId);
          }
          showAlert('success', t('template.IdpCreationSuccess'));
        } else {
          showAlert('error',response.error || t('projectPlayer.error.submitFailed'));
        }
      } else {
        // Call API to submit intervention plan
        const response  = await submitInterventionPlan(reqBody);
        const newProjectId = response?.data?.projectId
        if (!response.error) {
          await clearPendingDraft();
          showAlert('success', t('template.IdpCreationSuccess'));
          // Call the config callback if provided (this will update status to IN_PROGRESS)
          if (config.onSubmitInterventionPlan) {
            config.onSubmitInterventionPlan(newProjectId);
          }
        } else {
          showAlert('error',response.error || t('projectPlayer.error.submitFailed'));
        }
      }
    } catch (error) {
      console.error('Error submitting intervention plan:', error);
      showAlert('error', t('projectPlayer.error.submitFailed'));
    } finally {
      setIsSubmittingInterventionPlan(false);
    }
  }, [projectData, oldProjectData, config, addedToPlanTasks, deletableTaskIds, showAlert, t, user?.id]);

  if (!projectData) {
    return null;
  }

  return (
    <Container {...projectComponentStyles.container}>
      <VStack flex={1}>
        <ScrollView flex={1}
          {...projectComponentStyles.scrollView}
        >
          {/* Pillar features only: +Add Custom Task button */}
          {showPillarFeatures &&
            //  @ts-ignore 
            <Button variant="outlineghost" mb="$4" onPress={() => setIsModalOpen(true)}>
              <ButtonIcon as={LucideIcon} name="Plus" />
              <ButtonText>{t('projectPlayer.addCustomTask')}</ButtonText>
            </Button>
          }
          {/* Shared content logic - pillars or onboarding tasks */}
          <ProjectContent
            hasChildren={!!hasChildren}
            showPillarFeatures={!!showPillarFeatures}
            isModalOpen={isModalOpen}
            setIsModalOpen={setIsModalOpen}
          />
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
            <>
              {/* Warning Banner - Show when Submit is disabled */}
              {!oldProjectData?._id && (
                <Box
                  bg="$warning50"
                  borderWidth={1}
                  borderColor="$warning300"
                  borderRadius="$md"
                  padding="$3"
                  display={'none'}
                  $md-display={'flex'}
                >
                  <HStack space="sm" alignItems="center">
                    <LucideIcon name="AlertCircle" size={18} color="#ca8a04" />
                    <Text fontSize="$sm" color="$warning700">
                      {t('participantDetail.interventionPlan.warningMsg')}
                    </Text>
                  </HStack>
                </Box>
              )}

              {/* Responsive Button Container - stacks on mobile, row on web */}
              <Box {...projectComponentStyles.footerButtonContainer}>
                {/* Change Pathway Button */}
                <Button
                  variant="outlineghost"
                  onPress={() => {
                    setIsChangePathwayOpen(true);
                  }}
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
                  variant="solid"
                  onPress={onSubmitInterventionPlan}
                  isDisabled={
                    isSubmitDisabled || isSubmittingInterventionPlan
                  }
                  opacity={
                    isSubmitDisabled || isSubmittingInterventionPlan
                      ? 0.6
                      : 1
                  }
                  $web-cursor="pointer"
                >
                  {isSubmittingInterventionPlan && (
                    <ButtonSpinner />
                  )}
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
          </VStack>
        )}
      </VStack>
    </Container>
  );
});
ProjectComponent.displayName = 'ProjectComponent';
export default ProjectComponent;
