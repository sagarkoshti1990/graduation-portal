export const myRequestsStyles = {
  cardContainer: {
    bg: '$white',
    borderRadius: '$2xl',
    borderWidth: 1,
    borderColor: '$borderLight200',
    p: '$5',
    shadowColor: '$black',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
    width: '100%',
  },
  cardHeaderHStack: {
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    mb: '$3',
    width: '100%',
  },
  cardInfoVStack: {
    space: 'xs' as const,
    flex: 1,
    mr: '$3',
  },
  cardTitleText: {
    fontSize: '$md',
    fontWeight: '$bold' as const,
    color: '$textPrimary',
  },
  cardMentorText: {
    fontSize: '$sm',
    color: '$textSecondary',
  },
  cardDateText: {
    fontSize: '$xs',
    color: '$textSecondary',
    mt: '$1',
  },
  cardBadge: {
    borderWidth: 1,
    borderRadius: '$full' as const,
  },
  cardBadgeText: {
    fontSize: '$xs',
    fontWeight: '$medium' as const,
    textTransform: 'none' as const,
  },
  cardBadgesHStack: {
    space: 'xs' as const,
    alignItems: 'center' as const,
    flexWrap: 'wrap' as const,
  },
  infoRequestedBadge: {
    bg: '$blue50',
    borderColor: '$blue200',
  },
  infoRequestedBadgeText: {
    color: '$blue600',
  },
  cardDescriptionBox: {
    bg: '#F8FAFC',
    borderRadius: '$lg' as const,
    px: '$5',
    py: '$4',
    mb: '$3',
    width: '100%',
  },
  cardDescriptionText: {
    fontSize: '$sm',
    color: '$textSecondary',
  },
  cardFooterHStack: {
    justifyContent: 'flex-end' as const,
    width: '100%',
  },
  viewDetailsButton: {
    height: 32 as const,
    minHeight: 32 as const,
    paddingLeft: 12 as const,
    paddingRight: 12 as const,
    paddingTop: 0 as const,
    paddingBottom: 0 as const,
    borderRadius: 10 as const,
    bg: '$primary500' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: '$1.5' as const,
    sx: {
      ':hover': { opacity: 0.9 } as const,
      ':active': { opacity: 0.9 } as const,
    },
  },
  viewDetailsButtonText: {
    fontSize: '$xs !important' as const,
    lineHeight: 14 as const,
    fontWeight: '$semibold' as const,
    color: '$white !important' as const,
  },
  loadMoreContainer: {
    alignItems: 'center' as const,
    mt: '$4',
    width: '100%',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    py: '$12',
  },
  emptyStateVStack: {
    space: 'md' as const,
    alignItems: 'center' as const,
  },
  emptyStateIconContainer: {
    width: 64,
    height: 64,
    borderRadius: '$full' as const,
    bg: '$backgroundLight50',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  emptyStateTitle: {
    fontSize: '$lg',
    fontWeight: '$bold' as const,
    color: '$textPrimary',
    textAlign: 'center' as const,
  },
  emptyStateDescription: {
    fontSize: '$sm',
    color: '$textSecondary',
    textAlign: 'center' as const,
  },
} as const;

export default myRequestsStyles;
