export const taskCardStyles = {
  // File input (hidden)
  hiddenInput: {
    display: 'none' as const,
  },

  // Card style for children of project tasks
  childCard: {
    size: 'md' as const,
    variant: 'outline' as const,
    bg: '#F6F7FB',
    borderRadius: '$xl',
    // marginBottom: '$0.5',
    borderWidth: 1,
    borderColor: '$borderColor',
  },
  childCardContent: {
    padding: '$0.5',
    paddingVertical: '$0.5',
  },

  // Inline style for preview mode with project children
  previewInlineContainer: {
    alignItems: 'center' as const,
    space: 'md' as const,
    paddingVertical: '$0.5',
    paddingHorizontal: '$0.5',
  },

  // Default inline style for regular tasks
  regularTaskContainer: {
    bg: '$backgroundPrimary.light',
    padding: '$2',
  },
  statusIndicatorContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },

  // Status circle
  statusCircle: {
    width: '$4',
    height: '$4',
    borderRadius: '$full',
    borderWidth: 1,
    borderStyle: 'solid' as const,
    borderColor: '$borderColor',
    bg: '$white',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    shadowColor: '$shadowColor',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 1,
  },

  // Tooltip styles
  tooltipContent: {
    bg: '$tooltipBg',
    px: '$3',
    py: '$2',
    borderRadius: '$md',
  },
  tooltipText: {
    color: '$white',
    fontSize: '$xs',
  },

  // Primary filled circle (reusable for completed/mandatory tasks)
  primaryFilledCircle: {
    width: 20,
    height: 20,
    borderRadius: '$full',
    borderWidth: 2,
    borderColor: '$primary500',
    bg: '$primary500',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },

  // Divider
  divider: {
    height: 1,
    bg: '$inputBorder',
  },

  // Action button styles
  actionButton: {
    size: 'xs' as const,
    variant: 'outline' as const,
    bg: '$backgroundPrimary.light',
    ml: '$3',
    height: 32,
  },
  actionButtonCard: {
    borderColor: '$mutedBorder',
    hoverBg: '$primary100' as const,
  },
  actionButtonInline: {
    borderColor: '$inputBorder',
    hoverBg: '$primary100' as const,
  },
  actionButtonText: {
    color: '$textPrimary',
  },
  actionButtonTextHover: {
    color: '$primary500' as const,
  },

  // Custom task actions (edit/delete)
  customActionsContainer: {
    space: 'xs' as const,
    ml: '$2',
  },
  editActionBox: {
    padding: '$1',
    borderRadius: '$sm',
    hoverBg: '$primary100' as const,
  },
  deleteActionBox: {
    padding: '$1',
    borderRadius: '$sm',
    hoverBg: '$error200' as const,
  },

  // Success toast styles
  successToast: {
    bg: '$white',
    borderRadius: '$lg',
    marginBottom: '$4',
    marginRight: '$4',
    borderWidth: 1,
    borderColor: '$borderLight200',
    shadowColor: '$backgroundLight900',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  successToastContent: {
    space: 'sm' as const,
    alignItems: 'center' as const,
    padding: '$3',
    paddingHorizontal: '$4',
  },
  successToastIcon: {
    width: 24,
    height: 24,
    borderRadius: '$full',
    bg: '$primary500',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  successToastIconSize: 14,
  successToastTitle: {
    color: '$textPrimary',
    fontSize: '$sm',
    fontWeight: '$medium',
  },
  // Web text styles
  webTextWrap: {
    wordBreak: 'normal',
    overflowWrap: 'break-word',
    whiteSpace: 'normal',
  } as const,

  // Onboarding step card - very light grey box with gradient
  onboardingStepCard: {
    bg: '$gray50',
    borderRadius: '$xl',
    borderWidth: 1,
    borderStyle: 'solid' as const,
    borderColor: '$borderColor',
    padding: '$4',
    marginBottom: '$2',
    marginTop: 0,
    marginLeft: 0,
    marginRight: 0,
    gap: '$3',
  },
  // First onboarding task (Capture Consent) - simple outline button
  onboardingPrimaryButton: {
    bg: '$backgroundPrimary.light',
    borderColor: '$mutedBorder',
    borderRadius: '$lg',
    borderWidth: 1,
    height: '$8',
    paddingHorizontal: '$3',
    hoverBg: '$primary100',
    hoverBorderColor: '$primary500',
    textColor: '$textPrimary',
  },
  // Other onboarding tasks - simple outline button
  onboardingActionButton: {
    bg: '$backgroundPrimary.light',
    borderColor: '$mutedBorder',
    borderRadius: '$lg',
    borderWidth: 1,
    height: '$8',
    paddingHorizontal: '$3',
    hoverBg: '$primary100',
    hoverBorderColor: '$primary500',
    textColor: '$textPrimary',
  },
  // Onboarding card responsive padding
  onboardingCardPaddingMobile: '$4',
  onboardingCardPaddingDesktop: '$4',
  onboardingCardMarginBottomMobile: '$3',
  onboardingCardMarginBottomDesktop: '$3',

  // Status Badge (Done/To Do)
  statusBadge: {
    paddingHorizontal: '$2',
    paddingVertical: '$0.5',
    borderRadius: '$full',
    alignSelf: 'flex-start' as const,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  statusBadgeDone: {
    bg: '$accent200', // Subtle grey/blue
    borderColor: '$borderColor',
  },
  statusBadgeDoneHover: {
    bg: '$primary100', // Light pink/red from theme
    borderColor: '$primary500',
  },
  statusBadgeDoneText: {
    color: '$textPrimary',
    fontSize: '$sm',
    fontWeight: '$semibold',
  },
  statusBadgeDoneTextHover: {
    color: '$primary500',
    fontSize: '$sm',
    fontWeight: '$semibold',
  },
  statusBadgeToDo: {
    bg: '$textSecondary',
    borderColor: '$textSecondary',
  },
  statusBadgeToDoText: {
    color: '$white',
    fontSize: '$sm',
    fontWeight: '$semibold',
  },

  // File Count Tag
  fileCountTag: {
    paddingHorizontal: '$2',
    paddingVertical: '$0.5',
    borderRadius: '$full',
    borderWidth: 1,
    borderColor: '$borderColor',
    bg: '$accent200', // Subtle grey/blue
    $web: {
      cursor: 'pointer' as const,
      transition: 'all 0.2s',
    },
  },
  fileCountTagHover: {
    bg: '$primary100', // Light pink/red from theme
    borderColor: '$primary500',
  },
  fileCountIcon: {
    size: 14,
  },
  fileCountText: {
    fontSize: '$sm',
    color: '$textPrimary',
    fontWeight: '$semibold',
  },
  fileCountTextHover: {
    color: '$primary500',
    fontSize: '$xs',
  },

  // Onboarding mobile layout
  onboardingMobileContainer: {
    space: 'sm' as const,
  },
  onboardingMobileRow: {
    alignItems: 'flex-start' as const,
    space: 'sm' as const,
  },
  onboardingMobileCircleBox: {
    flexShrink: 0,
    mt: '$0.5',
  },
  onboardingMobileTextContainer: {
    flex: 1,
    minWidth: '$0',
    space: 'xs' as const,
  },
  // Onboarding desktop layout
  onboardingDesktopContainer: {
    alignItems: 'flex-start' as const,
    space: 'md' as const,
  },
  onboardingDesktopCircleBox: {
    flexShrink: 0,
    mt: '$1',
  },
  onboardingDesktopTextContainer: {
    flex: 1,
    minWidth: '$0',
    space: 'xs' as const,
  },
  onboardingDesktopButtonBox: {
    flexShrink: 0,
  },
  // Onboarding text styles
  onboardingTitleText: {
    color: '$textPrimary',
    fontWeight: '$normal' as const,
    fontSize: '$md',
  },
  onboardingDescriptionText: {
    color: '$textSecondary',
    fontWeight: '$normal' as const,
    fontSize: '$sm',
    lineHeight: '$lg',
  },
} as const;
