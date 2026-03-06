import { PLAYER_MODE } from '@constants/app.constant';

export const projectComponentStyles = {
  container: {
    flex: 1,
    bg: 'transparent',
  },
  scrollView: {
    paddingBottom: '$10',
  },
  scrollViewContent: {
    paddingBottom: 40,
  },
  card: {
    size: 'lg' as const,
    variant: 'elevated' as const,
    bg: '$white',
    borderRadius: '$3xl',
    borderWidth: 1,
    borderColor: '$borderColor',
    maxWidth: 1200,
    width: '$full',
    alignSelf: 'center' as const,
    overflow: 'hidden' as const,
    marginVertical: '$4',
  },
  onboardingCard: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  title: {
    color: '$textPrimary',
    fontWeight: '$semibold',
  },
  divider: {
    height: 1,
    bg: '$inputBorder',
    marginVertical: '$4',
  },
  pillarContainer: {
    space: 'xs' as const, // Reduced spacing between accordions
  },
  taskContainer: {
    padding: '$4',
  },
  footer: {
    padding: '$4',
    borderTopWidth: 1,
    borderTopColor: '$borderColor',
    bg: '$white',
  },
  footerWarning: {
    bg: '$warning50',
    borderColor: '$warning200',
    borderWidth: 1,
    borderRadius: '$lg',
    padding: '$3',
    marginBottom: '$4',
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: '$2',
  },
  footerWarningText: {
    color: '$warning700',
    fontSize: '$sm',
    flex: 1,
  },
  footerButtonContainer: {
    flexDirection: 'column-reverse' as const,
    gap: '$3',
    width: '$full',
    sx: {
      '@md': {
        flexDirection: 'row',
        justifyContent: 'space-between',
      },
    },
  },
  changePathwayButton: {
    variant: 'outline' as const,
    borderColor: '$borderColor',
    width: '$full',
    sx: {
      '@md': {
        width: 'auto',
      },
    },
  },
  submitButtonBox: {
    flex: 1,
    justifyContent: 'flex-end' as const,
    flexDirection: 'row' as const,
    width: '$full',
    sx: {
      '@md': {
        width: 'auto',
      },
    },
  },
  addCustomTaskContainer: {
    paddingHorizontal: '$5',
    paddingVertical: '$4',
  },
  submitButton: {
    width: '$full',
    sx: {
      '@md': {
        width: 'auto',
      },
    },
  },
} as const;

export const projectInfoCardStyles = {
  container: {
    bg: '$white',
    paddingTop: '$6',
    paddingLeft: '$6',
    paddingRight: '$6',
    paddingBottom: '$6',
    borderWidth: 1,
    borderColor: '$borderColor',
    borderRadius: '$2xl',
  },
  previewContainer: {
    bg: '$white',
    paddingTop: '$4',
    paddingLeft: '$6',
    paddingRight: '$6',
    paddingBottom: '$4',
    marginBottom: '$6',
    borderWidth: 2,
    borderColor: '$error200',
    borderRadius: '$2xl',
  },
  onboardingContainer: {
    bg: 'transparent',
    paddingTop: '$5',
    paddingLeft: '$5',
    paddingRight: '$5',
    paddingBottom: '$0',
    borderWidth: 0,
  },
  pathwayTag: {
    paddingHorizontal: '$3',
    paddingVertical: '$0.5',
    borderRadius: '$full',
    borderWidth: 1,
  },
  pathwayTagText: {
    fontSize: '$xs',
    fontWeight: '$medium',
  },
  versionText: {
    fontSize: '$xs',
    color: '$textMuted',
    marginLeft: '$2',
  },
  header: {
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    width: '100%',
    marginBottom: '$3.5',
  },
  leftSection: {
    space: 'md' as const,
    flex: 1,
  },
  rightSection: {
    marginLeft: '$4',
  },
  stepsCompleteBadge: {
    bg: '$badgeColor',
    borderRadius: '$full',
    paddingHorizontal: '$2',
    paddingVertical: '$0.5',
    shadowColor: '$backgroundLight900',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginLeft: '$8',
    '$hover-bg': '$badgeBackground',
    '$hover-opacity': 0.8,
  },
  stepsCompleteText: {
    space: 'xs' as const,
    alignItems: 'center' as const,
  },
  taskCountPreview: {
    // Simple text container
  },
  progressContainer: {
    width: '100%',
    marginTop: '$2',
  },
  progressPercentage: {
    textAlign: 'right' as const,
  },
  progressBar: {
    size: 'sm' as const,
    bg: '$inputBorder',
  },
  progressFilledTrack: {
    bg: '$primary500',
  },
  pillarsCountContainer: {
    space: 'xs' as const,
    marginLeft: '$4',
    alignItems: 'flex-end' as const,
  },
  pillarCountText: {
    color: '$primary500',
    fontSize: '$sm',
    fontWeight: '$medium',
  },
  taskCountText: {
    color: '$primary500',
    fontSize: '$sm',
    fontWeight: '$medium',
  },
  // Blue variant for pathway tags (Employment)
  pathwayTagBlue: {
    bg: '$blue50',
    borderColor: '$blue200',
  },
  pathwayTagBlueText: {
    color: '$blue600',
  },
  // Red/Gold variant for Action Required
  actionRequiredPillar: {
    bg: '$error50',
    borderColor: '$error200',
  },
} as const;
