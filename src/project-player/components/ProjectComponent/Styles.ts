export const projectComponentStyles = {
  container: {
    flex: 1,
  },
  scrollView: {
    showsVerticalScrollIndicator: true,
    // paddingTop: '$7',
  },
  card: {
    size: 'lg' as const,
    variant: 'elevated' as const,
    bg: '$white',
    borderRadius: '$3xl',
    borderWidth: 1,
    borderColor: '$borderLight300',
    maxWidth: 1200,
    width: '$full',
    alignSelf: 'center' as const,
    overflow: 'hidden' as const,
    shadowColor: '$gray600',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  // Main container stays white; padding for Onboarding Participants
  onboardingCard: {
    padding: '$1',
  },
  addTaskButtonContainer: {
    padding: '$3',
    paddingTop: '$3',
  },
  // Progress card section
  progressCardContainer: {
    paddingHorizontal: '$5',
    paddingVertical: '$4',
  },
  progressCard: {
    borderWidth: 1,
    borderColor: '$borderLight200',
    borderRadius: '$lg',
    padding: '$4',
    bg: '$white',
  },
  progressHeader: {
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: '$2',
  },
  progressBarBackground: {
    height: '$1.5',
    bg: '$progressBarBackground',
    borderRadius: '$full',
    overflow: 'hidden' as const,
  },
  progressBarFill: {
    height: '$full',
    bg: '$progressBarFillColor',
    borderRadius: '$full',
  },
  previousProgressText: {
    marginTop: '$1',
  },
  // Save Progress button
  saveProgressButton: {
    marginTop: '$4',
  },
  saveProgressButtonInner: {
    bg: '$primary500',
    paddingHorizontal: '$4',
    paddingVertical: '$3',
    borderRadius: '$lg',
    alignItems: 'center' as const,
    space: 'sm' as const,
    alignSelf: 'flex-start' as const,
  },
  // Add Custom Task button
  addCustomTaskContainer: {
    paddingHorizontal: '$5',
    paddingVertical: '$4',
  },
  addCustomTaskButton: {
    borderWidth: 1,
    borderStyle: 'dashed' as const,
    borderColor: '$mutedBorder',
    borderRadius: '$md',
    padding: '$3',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    bg: '$accent100',
  },
  addCustomTaskButtonHovered: {
    borderColor: '$primary500',
    bg: '$primary100',
  },
  toast: {
    bg: '$backgroundLight100',
    borderRadius: '$lg',
    marginBottom: '$4',
    marginRight: '$4',
  },
  toastContent: {
    space: 'sm' as const,
    alignItems: 'center' as const,
    padding: '$2',
  },
  // Footer button container - responsive layout
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
  // Change Pathway button - responsive
  changePathwayButton: {
    width: '$full',
    sx: {
      '@md': {
        width: 'auto',
      },
    },
  },
  // Submit button - responsive
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
    bg: '$backgroundPrimary.light',
    paddingTop: '$6',
    paddingLeft: '$6',
    paddingRight: '$6',
    paddingBottom: 0,
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
    bg: '$mutedForeground',
    borderRadius: '$full',
    paddingHorizontal: '$3',
    paddingVertical: '$1',
    shadowColor: '$backgroundLight900',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginLeft: '$8',
  },
  stepsCompleteText: {
    space: 'xs' as const,
    alignItems: 'center' as const,
  },
  taskCountPreview: {
    // Simple text container
  },
  progressContainer: {
    space: 'lg' as const,
    marginLeft: '$4',
    width: 120,
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
} as const;
