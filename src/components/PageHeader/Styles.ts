/**
 * PageHeader Component Styles
 * Reusable styles for the PageHeader component
 */

export const pageHeaderStyles = {
  container: {
    width: '$full' as const,
    bg: '$white' as const,
    shadowColor: '$shadowColor' as const,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 3,
    borderBottomWidth: '$1',
    borderBottomColor: '$borderDark200',
  },
  content: {
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    '$md-alignItems': 'flex-start' as const,
    flexWrap: 'wrap' as const,
    px: '$4' as const,
    py: '$4' as const,
    '$md-px': '$6' as const,
    gap: '$2' as const,
  },
  leftSection: {
    alignItems: 'center' as const,
    gap: '$3' as const,
    width: '$full' as const,
    '$md-width': 'auto' as const,
    '$md-flex': 1 as const,
  },
  textSection: {
    flex: 1 as const,
  },
  rightSection: {
    width: '$full' as const,
    mt: '$2' as const,
    '$md-width': 'auto' as const,
    '$md-mt': '$0' as const,
  },
} as const;

