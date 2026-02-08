import React from 'react';
import { Box, VStack, Text, HStack } from '@gluestack-ui/themed';
import { ProjectInfoCardProps } from '../../types/components.types';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';
import { useProjectContext } from '../../context/ProjectContext';
import { useLanguage } from '@contexts/LanguageContext';
import { projectInfoCardStyles } from './Styles';
import { PLAYER_MODE, TASK_STATUS, ONBOARDING_PROJECT_TITLES } from '@constants/app.constant';
import { usePlatform } from '@utils/platform';

const ProjectInfoCard: React.FC<ProjectInfoCardProps> = ({ project }) => {
  const { mode } = useProjectContext();
  const { t } = useLanguage();
  const { isMobile } = usePlatform();

  // For onboarding tasks, count based on file uploads (attachments), not completion status
  const completedTasks =
    project?.tasks?.filter(task => {
      // Check if task has uploaded files
      return task.attachments && task.attachments.length > 0;
    }).length || 0;
  const totalTasks = project.tasks?.length || 0;

  // Check if any task is a project type (has children)
const hasChildren =
  !!project?.children?.length ||
  project?.tasks?.some(task => task?.children?.length);
  // Count total pillars (project type tasks)
  const totalPillars = project?.children?.length || 0;

  // Count total child tasks across all pillars
  const totalChildTasks =
    project?.children?.reduce((acc, pillar) => {
      return acc + (pillar.children?.length || pillar.tasks?.length || 0);
    }, 0) || 0;

  const isPreview = mode === PLAYER_MODE.PREVIEW;

  return (
    <Box
      {...projectInfoCardStyles.container}
      borderWidth={hasChildren && isPreview ? 1 : 0}
      borderColor={hasChildren && isPreview ? '$primary500' : 'transparent'}
      borderRadius={hasChildren && isPreview ? '$2xl' : 0}
      marginBottom={hasChildren && isPreview ? '$4' : 0}
    >
      <HStack {...projectInfoCardStyles.header}
        alignItems="flex-start"
        justifyContent="space-between"
        gap="$3">

        {/* ✅ Title + Description Section */}
        <VStack
          {...projectInfoCardStyles.leftSection}
          flex={1}
        >
          {!hasChildren &&
            (ONBOARDING_PROJECT_TITLES.includes(project?.title || '') ||
              ONBOARDING_PROJECT_TITLES.includes(project?.name || '')) ? (
            isMobile ? (
              // Mobile: Vertical layout with badge at bottom right
              <VStack space="sm" flex={1}>
                {/* Title */}
                <Text {...TYPOGRAPHY.h3} color="$textPrimary">
                  {t('projectPlayer.onboarding')} {t('projectPlayer.participant')}
                </Text>

                {/* Description */}
                <Text
                  {...TYPOGRAPHY.paragraph}
                  color="$textSecondary"
                  lineHeight="$lg"
                >
                  {t('projectPlayer.onboardingDescription')}
                </Text>

                {/* Badge - positioned on right side */}
                <Box
                  {...projectInfoCardStyles.stepsCompleteBadge}
                  marginLeft="$0"
                  alignSelf="flex-end"
                >
                  <HStack {...projectInfoCardStyles.stepsCompleteText}>
                    <Text
                      {...TYPOGRAPHY.caption}
                      color="$modalBackground"
                      fontWeight="$semibold"
                    >
                      {completedTasks} of {totalTasks}{' '}
                      {t('projectPlayer.stepsComplete')}
                    </Text>
                  </HStack>
                </Box>
              </VStack>
            ) : (
              // Web: Title with badge inline, description below
              <VStack space="sm" flex={1}>
                {/* Title row with badge */}
                <HStack space="md" alignItems="center" justifyContent="space-between">
                  <Text {...TYPOGRAPHY.h3} color="$textPrimary">
                    {t('projectPlayer.onboarding')} {t('projectPlayer.participant')}
                  </Text>

                  {/* Badge - to the right of title */}
                  <Box
                    {...projectInfoCardStyles.stepsCompleteBadge}
                    marginLeft="$4"
                  >
                    <HStack {...projectInfoCardStyles.stepsCompleteText}>
                      <Text
                        {...TYPOGRAPHY.caption}
                        color="$modalBackground"
                        fontWeight="$semibold"
                      >
                        {completedTasks} of {totalTasks}{' '}
                        {t('projectPlayer.stepsComplete')}
                      </Text>
                    </HStack>
                  </Box>
                </HStack>

                {/* Description */}
                <Text
                  {...TYPOGRAPHY.paragraph}
                  color="$textSecondary"
                  lineHeight="$lg"
                >
                  {t('projectPlayer.onboardingDescription')}
                </Text>
              </VStack>
            )
          ) : (
            // Only show title in preview mode when there are children/pillars
            isPreview && (
              <Text {...TYPOGRAPHY.h3} color="$textPrimary">
                {project?.title || project?.name}
              </Text>
            )
          )}

          {!hasChildren ? null : (
            // Only show description in preview mode when there are children/pillars
            isPreview && project?.description && (
              <Text
                {...TYPOGRAPHY.paragraph}
                color="$textSecondary"
                lineHeight="$lg"
                mt="$1"
              >
                {project?.description}
              </Text>
            )
          )}
        </VStack>

        {/* ✅ Steps Complete Badge - only for non-onboarding projects now */}
        {!hasChildren && !(ONBOARDING_PROJECT_TITLES.includes(project?.title || '') || ONBOARDING_PROJECT_TITLES.includes(project?.name || '')) && (
          <Box
            {...projectInfoCardStyles.stepsCompleteBadge}
            alignSelf={isMobile ? 'flex-end' : 'auto'}
          >
            <HStack {...projectInfoCardStyles.stepsCompleteText}>
              <Text
                {...TYPOGRAPHY.caption}
                color="$modalBackground"
                fontWeight="$semibold"
              >
                {completedTasks} of {totalTasks}{' '}
                {t('projectPlayer.stepsComplete')}
              </Text>
            </HStack>
          </Box>
        )}
        {!hasChildren && isPreview && (
          <Box {...projectInfoCardStyles.taskCountPreview}>
            <Text {...TYPOGRAPHY.caption} color="$primary500">
              {totalTasks} {t('projectPlayer.tasks')}
            </Text>
          </Box>
        )}

        {hasChildren && isPreview && (
          <VStack {...projectInfoCardStyles.pillarsCountContainer}>
            <Text {...TYPOGRAPHY.caption} color="$primary500">
              {totalPillars} {t('projectPlayer.pillars')}
            </Text>
            <Text {...TYPOGRAPHY.caption} color="$primary500">
              {totalChildTasks} {t('projectPlayer.tasks')}
            </Text>
          </VStack>
        )}
      </HStack>
    </Box>
  );
};
export default ProjectInfoCard;
