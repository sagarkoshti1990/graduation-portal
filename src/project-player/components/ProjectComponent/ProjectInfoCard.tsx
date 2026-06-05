import React, { memo, useMemo } from 'react';
import { Box, VStack, Text, HStack, Pressable } from '@gluestack-ui/themed';
import { ProjectInfoCardProps } from '../../types/components.types';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';
import { useProjectContext } from '../../context/ProjectContext';
import { useLanguage } from '@contexts/LanguageContext';
import { projectInfoCardStyles } from './Styles';
import { PLAYER_MODE, TASK_STATUS, ONBOARDING_PROJECT_TITLES, PATHWAY_TAGS } from '@constants/app.constant';
import { usePlatform } from '@utils/platform';
import { LucideIcon } from '@ui';
import { theme } from '@config/theme';

const ProjectInfoCard = memo<ProjectInfoCardProps>(({ project }) => {
  const { mode } = useProjectContext();
  const { t } = useLanguage();
  const { isMobile } = usePlatform();

  const completedTasks = useMemo(
    () => project?.tasks?.filter(task => task.status === TASK_STATUS.COMPLETED).length ?? 0,
    [project?.tasks],
  );
  const totalTasks = project.tasks?.length || 0;

  const hasChildren = useMemo(
    () => !!project?.children?.length || project?.tasks?.some(task => !!task?.children?.length),
    [project?.children, project?.tasks],
  );
  const totalPillars = project?.children?.length || 0;

  const totalChildTasks = useMemo(
    () =>
      project?.children?.reduce((acc, pillar) => {
        return acc + (pillar.children?.length || pillar.tasks?.length || 0);
      }, 0) ?? 0,
    [project?.children],
  );

  const isPreview = mode === PLAYER_MODE.PREVIEW;
  const isNaked = !hasChildren && !isPreview;

  return (
    <Box
      {...(isPreview
        ? projectInfoCardStyles.previewContainer
        : isNaked
          ? projectInfoCardStyles.onboardingContainer
          : projectInfoCardStyles.container)}
      marginBottom={0}
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
                <Text {...TYPOGRAPHY.h4} color="$textPrimary" fontWeight="$normal">
                  {t('projectPlayer.onboarding')} {t('projectPlayer.participant')}
                </Text>

                {/* Description */}
                <Text
                  {...TYPOGRAPHY.bodySmall}
                  color="$textSecondary"
                  lineHeight="$lg"
                >
                  {t('projectPlayer.onboardingDescription')}
                </Text>

                {/* Badge - positioned on right side */}
                <Pressable
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
                </Pressable>
              </VStack>
            ) : (
              // Web: Title with badge inline, description below
              <VStack space="sm" flex={1}>
                {/* Title row with badge */}
                <HStack space="md" alignItems="center" justifyContent="space-between">
                  <Text {...TYPOGRAPHY.h4} color="$textPrimary" fontWeight="$normal">
                    {t('projectPlayer.onboarding')} {t('projectPlayer.participant')}
                  </Text>

                  {/* Badge - to the right of title */}
                  <Pressable
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
                  </Pressable>
                </HStack>

                {/* Description */}
                <Text
                  {...TYPOGRAPHY.bodySmall}
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
              <VStack space="xs">
                <HStack space="sm" alignItems="center">
                  <LucideIcon
                    name="ClipboardList"
                    size={20}
                    color={theme.tokens.colors.error600}
                  />
                  <Text {...TYPOGRAPHY.h4} color="$textPrimary" fontWeight="$medium">
                    {project?.title || project?.name}
                  </Text>
                </HStack>
              </VStack>
            )
          )}

          {!hasChildren ? null : (
            // Only show description in preview mode when there are children/pillars
            isPreview && project?.description && (
              <VStack space="lg">
                <Text
                  {...TYPOGRAPHY.bodySmall}
                  color="$textSecondary"
                  display={'none'}
                  $md-display={'flex'}
                >
                  {project?.description}
                </Text>
                {/* Pathway Tag + Version below description */}
                <HStack space="sm" alignItems="center">
                  {(() => {
                    const title = (project?.title || project?.name || '').toLowerCase();
                    const isEntrepreneurship = title.includes(PATHWAY_TAGS.ENTREPRENEURSHIP.toLowerCase());
                    return (
                      <Box
                        {...projectInfoCardStyles.pathwayTag}
                        bg={isEntrepreneurship ? '$badgeSuccessBg' : '$blue50'}
                        borderColor={isEntrepreneurship ? '$badgeSuccessText' : '$blue200'}
                      >
                        <Text
                          {...projectInfoCardStyles.pathwayTagText}
                          color={isEntrepreneurship ? '$badgeSuccessText' : '$blue600'}
                        >
                          {isEntrepreneurship ? PATHWAY_TAGS.ENTREPRENEURSHIP : PATHWAY_TAGS.EMPLOYMENT}
                        </Text>
                      </Box>
                    );
                  })()}
                  {/* <Text {...projectInfoCardStyles.versionText}>v2.1</Text> */}
                </HStack>
              </VStack>
            )
          )}
        </VStack>

        {/* ✅ Steps Complete Badge - only for non-onboarding projects now */}
        {!hasChildren && !(ONBOARDING_PROJECT_TITLES.includes(project?.title || '') || ONBOARDING_PROJECT_TITLES.includes(project?.name || '')) && (
          <Pressable
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
          </Pressable>
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
            <Text {...projectInfoCardStyles.pillarCountText}>
              {totalPillars} {t('projectPlayer.pillars')}
            </Text>
            <Text {...projectInfoCardStyles.taskCountText}>
              {totalChildTasks} {t('projectPlayer.tasks')}
            </Text>
          </VStack>
        )}
      </HStack>
    </Box>
  );
});

ProjectInfoCard.displayName = 'ProjectInfoCard';
export default ProjectInfoCard;
