import { theme } from '@config/theme';
import { FeatureCardData } from '@app-types/components';

export const WELCOME_CARDS: FeatureCardData[] = [
  {
    id: 'my-participants',
    color: theme.tokens.colors.primary500,
    icon: 'Users',
    title: 'welcome.myParticipants',
    description: 'welcome.myParticipantsDescription',
    navigationUrl: 'participants',
    isDisabled: false,
    pressableActionText: 'welcome.getStarted',
  },
  {
    id: 'connect-experts',
    color: theme.tokens.colors.info100,
    icon: 'TrendingUp',
    title: 'welcome.dashboard',
    description: 'welcome.dashboardDescription',
    navigationUrl: 'dashboard',
    isDisabled: false,
    pressableActionText: 'welcome.getStarted',
    isComingSoon: true,
  },
  {
    id: 'learning-progress',
    color: theme.tokens.colors.accent400,
    icon: 'ChartColumn',
    title: 'welcome.myLearningProgress',
    description: 'welcome.myLearningProgressDescription',
    navigationUrl: 'learning-progress',
    isDisabled: false,
    pressableActionText: 'welcome.getStarted',
    isComingSoon: true,
  },
  
];
