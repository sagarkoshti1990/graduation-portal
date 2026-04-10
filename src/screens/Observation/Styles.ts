export const observationStyles = {
  backButton: {
    alignItems: 'center' as const,
    space: 'xs' as const,
  },
  title: {
    fontSize: '$xl' as const,
    fontWeight: '$semibold' as const,
    color: '$textPrimary' as const,
    flex: 1 as const,
  },
  titleAndProgressContainer: {
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    width: '$full' as const,
    marginTop: '$4' as const,
  },
  progressBarContainer: {
    width: '$full' as const,
    marginTop: '$2' as const,
  },
  progressBar: {
    width: '$full' as const,
    size: 'sm' as const,
    bg:"$blue100" as const,
  },
  progressBarFill: {
    bg: '$blue600' as const,
  },
  participantInfoText: {
    fontSize: '$sm' as const,
    color: '$textSecondary' as const,
    marginTop: '$2' as const,
  },
  loadingContainer: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: '$white' as const,
    zIndex: 1,
  },
  contentContainer: {
    flex: 1 as const,
    backgroundColor: '$accent100' as const,
  },
  webComponentPlayerContainer: {
    flex: 1 as const,
    justifyContent: 'center' as const,
    '$md-px': '$6' as const,
    px: '$4' as const, // padding like container padding
    py: '$6' as const,
  },
} as const;
