import React, { memo } from 'react';
import { Box, Card, HStack, Text, VStack } from '@ui';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';
import { taskCardStyles } from '../styles';
import type { Task } from '../../../../types/project.types';

export interface MainContentProps {
  isOnboardingTask: boolean; isLastTask: boolean; isMobile: boolean; isWeb: boolean;
  task: Task; onboardingTextStyle: any; onboardingDescStyle: any;
  showAsCard: boolean; isEdit: boolean; isPreview: boolean;
  isAddedToPlan: boolean; isRejected: boolean; isInterventionPlanEditMode: boolean; isChildOfProject: boolean;
  statusIndicator: React.ReactNode; taskInfo: React.ReactNode;
  actionButton: React.ReactNode; extraActions?: React.ReactNode;
}

const MainContent = memo<MainContentProps>(({
  isOnboardingTask, isLastTask, isMobile, isWeb, task, onboardingTextStyle, onboardingDescStyle,
  showAsCard, isEdit, isPreview, isAddedToPlan, isRejected, isInterventionPlanEditMode, isChildOfProject,
  statusIndicator, taskInfo, actionButton, extraActions,
}) => {

  if (isOnboardingTask) {
    const titleStyle = isWeb ? ([taskCardStyles.webTextWrap, onboardingTextStyle] as any) : onboardingTextStyle;
    const descStyle = isWeb ? ([taskCardStyles.webTextWrap, onboardingDescStyle] as any) : onboardingDescStyle;
    return (
      <Box {...taskCardStyles.onboardingStepCard} paddingVertical="$4"
        marginBottom={isLastTask ? 0 : isMobile ? taskCardStyles.onboardingCardMarginBottomMobile : taskCardStyles.onboardingCardMarginBottomDesktop}>
        {isMobile ? (
          <VStack {...taskCardStyles.onboardingMobileContainer}>
            <HStack {...taskCardStyles.onboardingMobileRow}>
              <Box {...taskCardStyles.onboardingMobileCircleBox}>{statusIndicator}</Box>
              <VStack {...taskCardStyles.onboardingMobileTextContainer}>
                <Text {...TYPOGRAPHY.h4} {...taskCardStyles.onboardingTitleText} {...onboardingTextStyle} style={titleStyle}>{task?.name}</Text>
                {!!task?.description && (
                  <Text {...TYPOGRAPHY.bodySmall} {...taskCardStyles.onboardingDescriptionText} {...onboardingDescStyle} style={descStyle}>{task.description}</Text>
                )}
              </VStack>
            </HStack>
            <Box><HStack space="xs" alignItems="center">{actionButton}{extraActions}</HStack></Box>
          </VStack>
        ) : (
          <HStack {...taskCardStyles.onboardingDesktopContainer}>
            <Box {...taskCardStyles.onboardingDesktopCircleBox}>{statusIndicator}</Box>
            <VStack {...taskCardStyles.onboardingDesktopTextContainer}>
              <Text {...TYPOGRAPHY.h4} {...taskCardStyles.onboardingTitleText} {...onboardingTextStyle} style={titleStyle}>{task?.name}</Text>
              {!!task?.description && (
                <Text {...TYPOGRAPHY.bodySmall} {...taskCardStyles.onboardingDescriptionText} {...onboardingDescStyle} style={descStyle}>{task.description}</Text>
              )}
            </VStack>
            <Box {...taskCardStyles.onboardingDesktopButtonBox}><HStack space="xs" alignItems="center">{actionButton}{extraActions}</HStack></Box>
          </HStack>
        )}
      </Box>
    );
  }

  if (showAsCard) {
    const cardBg = isEdit && !isPreview && task.type === 'observation' ? '$observationTaskBg'
      : isPreview && task?.isDeletable ? (isAddedToPlan ? '$optionalTaskGreenBg' : isRejected ? '$socialProtectionAccordionBg' : '$optionalTaskYellowBg')
      : isInterventionPlanEditMode ? '$stylesCardBg' : taskCardStyles.childCard?.bg;
    const cardBorderColor = isEdit && !isPreview && task.type === 'observation' ? '$observationTaskBorder'
      : isPreview && task?.isDeletable ? (isAddedToPlan ? '$optionalTaskGreenBorder' : isRejected ? '$error200' : '$optionalTaskYellowBorder')
      : taskCardStyles.childCard?.borderColor;
    return (
      <Card {...taskCardStyles.childCard} bg={cardBg} borderRadius={taskCardStyles.childCard?.borderRadius as any} borderColor={cardBorderColor}>
        <HStack alignItems="flex-start" space="md" flexDirection={isMobile ? 'column' : 'row'}>
          {isMobile ? (
            <VStack space="sm" width="100%">
              <HStack alignItems="flex-start" space={isPreview ? 'md' : 'sm'} width="100%">
                <Box flexShrink={0}>{statusIndicator}</Box>
                <Box flex={1}>{taskInfo}</Box>
                <Box flexShrink={0}>{isPreview ? <HStack space="xs" alignItems="center">{actionButton}{extraActions}</HStack> : extraActions}</Box>
              </HStack>
              {!isPreview && <Box width="100%">{actionButton}</Box>}
            </VStack>
          ) : (
            <>
              <Box flexShrink={0} mt="$1">{statusIndicator}</Box>
              <Box flex={1} minWidth="$0">{taskInfo}</Box>
              <Box flexShrink={0}><HStack space="xs" alignItems="center">{actionButton}{extraActions}</HStack></Box>
            </>
          )}
        </HStack>
      </Card>
    );
  }

  if (isChildOfProject && isPreview) {
    return (
      <HStack {...taskCardStyles.previewInlineContainer} padding={isWeb ? '$4' : '$0'}
        bg={isAddedToPlan ? '$addedToPlanBg' : isRejected ? '$error50' : '$warning50'}
        borderColor={isAddedToPlan ? '$addedToPlanBorder' : isRejected ? '$error200' : '$warning200'}
        borderWidth={1} borderRadius="$lg" marginBottom="$2" alignItems="flex-start" space={isWeb ? 'md' : 'xs'}>
        <Box flexShrink={0} mt="$1">{statusIndicator}</Box>
        <Box flex={1} minWidth={isWeb ? '$0' : undefined}>{taskInfo}</Box>
        <Box flexShrink={0}><HStack space="xs" alignItems="center">{actionButton}{extraActions}</HStack></Box>
      </HStack>
    );
  }

  return (
    <Box {...taskCardStyles.regularTaskContainer} paddingVertical={isMobile ? '$5' : '$2'}>
      <HStack alignItems="flex-start" space={isWeb ? 'md' : 'sm'} flexDirection={isMobile ? 'column' : 'row'}>
        {isMobile ? (
          <Box flexDirection="row">
            <Box flexShrink={0} mt="$1">{statusIndicator}</Box>
            <Box flex={1} marginLeft="$1">{taskInfo}</Box>
          </Box>
        ) : (
          <>
            <Box flexShrink={0} mt="$1">{statusIndicator}</Box>
            <Box flex={1} minWidth="$0">{taskInfo}</Box>
          </>
        )}
        <Box flexShrink={0} width={isMobile ? '100%' : 'auto'}>
          <HStack space="xs" alignItems="center">{actionButton}{extraActions}</HStack>
        </Box>
      </HStack>
    </Box>
  );
});

MainContent.displayName = 'MainContent';
export default MainContent;
