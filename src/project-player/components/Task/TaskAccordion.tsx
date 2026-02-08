import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionTrigger,
  AccordionContent,
  Card,
} from '@gluestack-ui/themed';
import { LucideIcon } from '@ui/index';
import { useLanguage } from '@contexts/LanguageContext';
import { useProjectContext } from '../../context/ProjectContext';
import TaskComponent from '../ProjectComponent/TaskComponent';
import AddCustomTask from './AddCustomTask';
import { TaskAccordionProps } from '../../types/components.types';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';
import {
  PILLAR_NAMES,
  PILLAR_CATEGORIES,
  TASK_STATUS,
} from '@constants/app.constant';
import { theme } from '../../../config/theme';
import { taskAccordionStyles } from './Styles';
import { usePlatform } from '@utils/platform';

const TaskAccordion: React.FC<TaskAccordionProps> = ({ task }) => {
  const { t } = useLanguage();
  const { mode } = useProjectContext();
  const { isWeb, isMobile } = usePlatform();

  const isPreview = mode === 'preview';
  const isSocialProtection =
    task?.metaInformation?.category === PILLAR_CATEGORIES.PROTECTION ||
    task.name.toLowerCase().includes(PILLAR_NAMES.SOCIAL_PROTECTION);

  // Helper function to get pillar icon and color
  const getPillarIcon = (
    pillarName: string,
  ): { icon: string; color: string } => {
    const lowerName = pillarName.toLowerCase();
    if (
      lowerName.includes(PILLAR_NAMES.SOCIAL_EMPOWERMENT) ||
      lowerName.includes(PILLAR_NAMES.EMPOWERMENT)
    ) {
      return {
        icon: 'Users',
        color: theme.tokens.colors.pillarSocialEmpowerment,
      };
    }
    if (lowerName.includes(PILLAR_NAMES.LIVELIHOOD)) {
      return {
        icon: 'Briefcase',
        color: theme.tokens.colors.pillarLivelihoods,
      };
    }
    if (
      lowerName.includes(PILLAR_NAMES.FINANCIAL_INCLUSION) ||
      lowerName.includes(PILLAR_NAMES.FINANCIAL)
    ) {
      return {
        icon: 'DollarSign',
        color: theme.tokens.colors.pillarFinancialInclusion,
      };
    }
    if (
      lowerName.includes(PILLAR_NAMES.SOCIAL_PROTECTION) ||
      lowerName.includes(PILLAR_NAMES.PROTECTION)
    ) {
      return {
        icon: 'Shield',
        color: theme.tokens.colors.pillarSocialProtection,
      };
    }
    return { icon: 'Folder', color: theme.tokens.colors.textSecondary }; // Default
  };

  const pillarIconData = getPillarIcon(task.name);

  // For Edit/Read-Only modes: Show as Card (always expanded)
  if (!isPreview) {
    // Calculate pillar progress percentage
    const validChildren =
      task.children?.filter(child => !child.isDeleted) || [];

    const completedTasks = validChildren.filter(
      child => child.status === TASK_STATUS.COMPLETED,
    ).length;

    const totalTasks = validChildren.length;

    const progressPercent =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return (
      <Box {...taskAccordionStyles.container}>
       <Card {...taskAccordionStyles.card} p={0} overflow="hidden">
         {/* Card Header with Progress on right */}
         <Box {...taskAccordionStyles.cardHeader}>
           <Box {...taskAccordionStyles.cardHeaderInner}>
            {isMobile ? (
              <VStack space="sm">
                <HStack {...taskAccordionStyles.pillarHeaderRow}>
                  <LucideIcon
                    name={pillarIconData.icon}
                    size={15}
                    color={pillarIconData.color}
                  />
                  <Text {...TYPOGRAPHY.h4} color="$textPrimary">
                    {task.name}
                  </Text>
                </HStack>
                <HStack space="md" alignItems="center" maxWidth={150}>
                  <Text {...taskAccordionStyles.progressText} minWidth={40}>
                    {progressPercent}%
                  </Text>
                  <Box
                    height={8}
                    width={100}
                    bg="$backgroundLight200"
                    borderRadius="$full"
                    overflow="hidden"
                  >
                    <Box
                      height="$full"
                      width={`${progressPercent}%`}
                      bg="$progressBarFillColor"
                      borderRadius="$full"
                    />
                  </Box>
                </HStack>
              </VStack>
            ) : (
              <HStack
                {...taskAccordionStyles.cardHeaderContent}
                justifyContent="space-between"
              >
                <HStack {...taskAccordionStyles.pillarHeaderRow}>
                  <LucideIcon
                    name={pillarIconData.icon}
                    size={20}
                    color={pillarIconData.color}
                  />
                  <Text {...TYPOGRAPHY.h4} color="$textPrimary">
                    {task.name}
                  </Text>
                </HStack>
                {/* Pillar progress percentage and bar on right */}
                <HStack space="md" alignItems="center" minWidth={150}>
                  <Text {...taskAccordionStyles.progressText} minWidth={40}>
                    {progressPercent}%
                  </Text>
                  <Box
                    height={8}
                    flex={1}
                    bg="$backgroundLight200"
                    borderRadius="$full"
                    overflow="hidden"
                  >
                    <Box
                      height="$full"
                      width={`${progressPercent}%`}
                      bg="$progressBarFillColor"
                      borderRadius="$full"
                    />
                  </Box>
                </HStack>
              </HStack>
            )}
            </Box>
          </Box>

          {/* Card Content - Always visible (no accordion) */}
          <Box
            {...taskAccordionStyles.cardContent}
          >
            <VStack {...taskAccordionStyles.cardContentStack}>
              {(task?.children?.length ? task.children : task.tasks)?.map(
                (childTask, index, arr) => (
                  <TaskComponent
                    key={childTask?._id}
                    task={childTask}
                    level={1}
                    isLastTask={index === arr.length - 1}
                    isChildOfProject={true}
                  />
                ),
              )}
            </VStack>
          </Box>
        </Card>
      </Box>
    );
  }

  // For Preview mode: Show as Accordion
  return (
    <Box {...taskAccordionStyles.container}>
      <Accordion {...taskAccordionStyles.accordion}>
        <AccordionItem
          value={task._id}
          {...taskAccordionStyles.accordionItem}
          bg={
            isSocialProtection
              ? '$socialProtectionBg'
              : taskAccordionStyles.accordionItem.bg
          }
          borderColor={
            isSocialProtection
              ? '$primary500'
              : taskAccordionStyles.accordionItem.borderColor
          }
        >
          {/* Accordion Header */}
          <AccordionHeader>
            <AccordionTrigger
              {...taskAccordionStyles.accordionTrigger}
              padding={isWeb ? '$5' : '$1'}
            >
              {({ isExpanded }: { isExpanded: boolean }) => (
                <>
                  <HStack {...taskAccordionStyles.accordionHeaderContent}>
                    <VStack flex={1} space="xs">
                      <HStack alignItems="center" space="sm" flexWrap="wrap">
                        <Text
                          {...TYPOGRAPHY.paragraph}
                          color="$textPrimary"
                          sx={
                            isWeb
                              ? {
                                  ':hover': {
                                    textDecorationLine: 'underline',
                                    cursor: 'pointer',
                                  },
                                }
                              : undefined
                          }
                        >
                          {task.name}
                        </Text>
                        <Box {...taskAccordionStyles.taskBadge}>
                          <Text {...taskAccordionStyles.taskBadgeText}>
                            {task.tasks?.length || 0} {t('projectPlayer.tasks')}
                          </Text>
                        </Box>
                        {isSocialProtection && (
                          <HStack {...taskAccordionStyles.actionRequiredBadge}>
                            <LucideIcon
                              name="AlertCircle"
                              size={taskAccordionStyles.warningIconSize}
                              color={theme.tokens.colors.warningIconColor}
                            />
                            <Text {...taskAccordionStyles.actionRequiredText}>
                              {t(
                                'participantDetail.interventionPlan.actionRequired',
                              )}
                            </Text>
                          </HStack>
                        )}
                      </HStack>
                    </VStack>

                    {/* Custom Lucide Icon */}
                    <Box {...taskAccordionStyles.accordionIconContainer}>
                      <LucideIcon
                        name={isExpanded ? 'ChevronUp' : 'ChevronDown'}
                        size={20}
                        color={theme.tokens.colors.textSecondary}
                      />
                    </Box>
                  </HStack>
                </>
              )}
            </AccordionTrigger>
          </AccordionHeader>

          {/* Accordion Content - Collapsible in preview mode */}
          <AccordionContent
            {...taskAccordionStyles.accordionContent}
            paddingHorizontal={isWeb ? '$5' : '$2'}
          >
            {/* Info Banner - Always show for Social Protection in Preview Mode */}
            {isSocialProtection && (
              <Box {...taskAccordionStyles.infoBanner}>
                <HStack {...taskAccordionStyles.infoBannerContent}>
                  <LucideIcon
                    name="Info"
                    size={taskAccordionStyles.infoIconSize}
                    color={theme.tokens.colors.infoIconColor}
                  />
                  <VStack flex={1}>
                    <Text {...taskAccordionStyles.infoBannerTitle}>
                      {t('projectPlayer.important')}
                    </Text>
                    <Text {...taskAccordionStyles.infoBannerMessage}>
                      {task?.metaInformation?.warningMessage ||
                        t('projectPlayer.socialProtectionPreviewInfo')}
                    </Text>
                  </VStack>
                </HStack>
              </Box>
            )}

            <VStack {...taskAccordionStyles.accordionContentStack}>
              {(task?.children?.length ? task.children : task?.tasks)?.map(
                (childTask, index, arr) => (
                  <TaskComponent
                    key={childTask?._id}
                    task={childTask}
                    level={1}
                    isLastTask={index === arr.length - 1}
                    isChildOfProject={true}
                  />
                ),
              )}

              {/* Add Custom Task Button */}
              <AddCustomTask templateId={task._id} templateName={task.name} />
              {/* <AddCustomTaskModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                mode="add"
              /> */}
            </VStack>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Box>
  );
};

export default TaskAccordion;
