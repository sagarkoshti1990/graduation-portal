import { theme } from '@config/theme';

export const interventionPlanStyles = {
  container: {
    bg: '$white',
    borderWidth: 1,
    borderColor: '$borderLight300',
    borderRadius: '$2xl',
    p: '$6',
  },
  content: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    space: 'xs' as const,
  },
  iconContainer: {
    mb: '$2',
  },
  iconColor: theme.tokens.colors.textMutedForeground,
  title: {
    fontSize: '$md',
    fontWeight: '$normal',
    color: '$textForeground',
    textAlign: 'center' as const,
    mb: '$1',
  },
  description: {
    fontSize: '$md',
    color: '$textMutedForeground',
    textAlign: 'center' as const,
    mb: '$2',
  },
  button: {
    bg: '$btnPrimary',
    borderRadius: '$xl',
    px: '$4',
    py: '$2',
    mt: '$2',
  },
  buttonText: {
    color: '$white',
    fontSize: '$sm',
    fontWeight: '$medium',
  },
} as const;
