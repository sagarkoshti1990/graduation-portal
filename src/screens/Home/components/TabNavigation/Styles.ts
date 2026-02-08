export const tabNavigationStyles = {
  container: {
    gap: '$2',
    mb: '$6',
  },
  tab: {
    px: '$4',
    py: '$2',
    borderRadius: '$lg',
    borderWidth: 0,
  },
  activeTab: {
    bg: '$primary500',
  },
  inactiveTab: {
    bg: 'transparent',
  },
  tabText: {
    fontSize: '$md',
    fontWeight: '$medium',
  },
  activeTabText: {
    color: '$white',
  },
  inactiveTabText: {
    color: '$textSecondary',
  },
} as const;

