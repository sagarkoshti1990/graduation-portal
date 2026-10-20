export const ReviewRequestsStyles = {
  filterContainer: {
    mt: '$4',
  },
  tableWrapper: {
    mt: '$6',
  },
  statusBadgeBox: {
    borderRadius: '$full',
    borderWidth: 1,
    px: '$3',
    py: '$1',
    alignSelf: 'flex-start' as const,
  },
  statusBadgeText: {
    fontSize: '$xs',
    fontWeight: '$medium' as const,
  },
  typeBadgeBox: {
    borderRadius: '$md',
    px: '$2',
    py: '$1',
    bg: '$backgroundLight100',
    alignSelf: 'flex-start' as const,
  },
  typeBadgeText: {
    fontSize: '$xs',
    fontWeight: '$medium' as const,
    color: '$textForeground',
  },
  cellText: {
    fontSize: '$sm',
    color: '$textForeground',
    fontWeight: '$normal' as const,
  },
  cellMutedText: {
    fontSize: '$sm',
    color: '$textMutedForeground',
    fontWeight: '$normal' as const,
  },
  changeFromToText: {
    fontSize: '$sm',
    color: '$textMutedForeground',
    fontWeight: '$normal' as const,
  },
  actionsRow: {
    space: 'sm' as const,
    alignItems: 'center' as const,
  },
  approveButton: {
    size: 'sm' as const,
    variant: 'solid' as const,
    bg: '$success600',
    borderRadius: '$md',
    px: '$3',
  },
  approveButtonText: {
    fontSize: '$xs',
    color: '$white',
    fontWeight: '$medium' as const,
  },
  rejectButton: {
    size: 'sm' as const,
    variant: 'outline' as const,
    borderColor: '$error300',
    borderRadius: '$md',
    px: '$3',
  },
  rejectButtonText: {
    fontSize: '$xs',
    color: '$error600',
    fontWeight: '$medium' as const,
  },
} as const;
