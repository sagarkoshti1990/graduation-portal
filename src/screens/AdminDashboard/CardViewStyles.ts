/**
 * CardView Styles
 * Centralized styles for CardView component
 */

export const cardViewStyles = {
  container: {
    space: 'md' as const,
    width: '100%' as const,
  },
  insightsCard: {
    p: '$6' as const,
    borderRadius: '$lg' as const,
    borderWidth: 1,
    borderColor: '$borderLight200' as const,
    bg: '$white' as const,
    mt: '$4' as const,
  },
  insightsTitle: {
    fontSize: '$lg' as const,
    fontWeight: '$semibold' as const,
    color: '$textForeground' as const,
  },
  insightItem: {
    fontSize: '$sm' as const,
    color: '$textForeground' as const,
    lineHeight: '$md' as const,
  },
  graphsContainer: {
    p: '$6' as const,
    borderRadius: '$lg' as const,
    borderWidth: 1,
    borderColor: '$borderLight200' as const,
    bg: '$white' as const,
    minHeight: 400,
    alignItems: 'stretch' as const,
    justifyContent: 'flex-start' as const,
  },
};
