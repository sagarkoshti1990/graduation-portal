export const taskCardStyles = {
  // File input (hidden)
  hiddenInput: {
    display: 'none' as const,
  },

  // Card style for children of project tasks
  childCard: {
    size: 'md' as const,
    variant: 'elevated' as const,
    bg: '#F6F7FB',
    borderRadius: '$xl',
    marginBottom: '$0.5',
    borderWidth: 1,
    borderColor: '$borderLight300',
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
    backgroundImage: 'linear-gradient(to right bottom, oklch(0.984 0.003 247.858) 0%, oklab(0.984 -0.00113071 -0.00277876 / 0.5) 100%)',
    borderRadius: '$xl',
    borderWidth: 1,
    borderStyle: 'solid' as const,
    borderColor: '$gray300',
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
    space: '2xs' as const,
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
    fontWeight: '$medium' as const,
    fontSize: '$md',
  },
  onboardingDescriptionText: {
    color: '$textSecondary',
    fontWeight: '$normal' as const,
    fontSize: '$sm',
    lineHeight: '$lg',
  },
} as const;

export const taskAccordionStyles = {
  container: {
    marginBottom: '$6',
  },
  card: {
    size: 'md' as const,
    variant: 'elevated' as const,
    bg: '$backgroundPrimary.light',
    borderRadius: '$2xl',
    borderWidth: 1,
    borderColor: '$mutedBorder',
  },
  cardHeader: {
    padding: 0,
    borderBottomWidth: 1,
    borderBottomColor: '$mutedBorder',
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
  },
  cardHeaderInner: {
    padding: '$4',
  },
  cardHeaderContent: {
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  cardContent: {
    paddingHorizontal: '$5',
    paddingVertical: '$4',
  },
  cardContentStack: {
    space: 'md' as const,
    paddingTop: '$1',
  },
  taskBadge: {
    bg: '$primary100',
    paddingHorizontal: '$3',
    paddingVertical: '$1',
    borderRadius: '$full',
    borderColor: '$primary500',
  },
  accordion: {
    type: 'single' as const,
    variant: 'unfilled' as const,
    shadowColor: '$backgroundLight900',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  accordionItem: {
    bg: '$backgroundPrimary.light',
    borderRadius: '$lg',
    borderWidth: 1,
    borderColor: '$mutedBorder',
  },
  accordionTrigger: {
    padding: '$5',
  },
  accordionHeaderContent: {
    flex: 1,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  accordionIconContainer: {
    ml: '$4',
  },
  accordionContent: {
    paddingHorizontal: '$5',
    paddingBottom: '$5',
  },
  accordionContentStack: {
    space: 'md' as const,
    paddingTop: '$3',
  },
  // Progress percentage text
  progressText: {
    fontSize: '$sm',
    fontWeight: '$medium',
    color: '$textSecondary',
  },
  // Task badge text
  taskBadgeText: {
    fontSize: '$xs',
    fontWeight: '$medium',
    color: '$primary500',
  },
  // Pillar header row with title and tasks
  pillarHeaderRow: {
    alignItems: 'center' as const,
    space: 'sm' as const,
    flexWrap: 'wrap' as const,
    flex: 1,
  },
  // Action required badge (Social Protection)
  actionRequiredBadge: {
    space: 'xs' as const,
    alignItems: 'center' as const,
    bg: '$warning100',
    borderWidth: 1,
    borderColor: '$warning300',
    borderRadius: '$full',
    paddingHorizontal: '$2',
    paddingVertical: '$0.5',
  },
  actionRequiredText: {
    fontSize: '$xs',
    fontWeight: '$medium',
    color: '$warning700',
  },
  // Description text
  descriptionText: {
    color: '$textSecondary',
    lineHeight: '$lg',
  },
  // Info banner
  infoBanner: {
    bg: '$blue50',
    borderWidth: 1,
    borderColor: '$blue200',
    borderRadius: '$md',
    padding: '$3',
    marginBottom: '$4',
  },
  infoBannerContent: {
    space: 'sm' as const,
    alignItems: 'flex-start' as const,
  },
  infoBannerTitle: {
    fontSize: '$xs',
    fontWeight: '$semibold',
    color: '$info600',
    marginBottom: '$0.5',
  },
  infoBannerMessage: {
    fontSize: '$xs',
    color: '$info700',
    lineHeight: '$sm',
  },
  // Icon sizes
  accordionIconSize: 20,
  warningIconSize: 12,
  infoIconSize: 16,
} as const;

export const addCustomTaskStyles = {
  buttonBox: {
    borderRadius: '$md',
    borderWidth: 1,
    borderStyle: 'dashed' as const,
    borderColor: '$mutedBorder',
    padding: '$1',
    marginTop: '$3',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    bg: '$accent100',
    cursor: 'pointer' as const,
    sx: {
      ':hover': {
        bg: '$primary100',
        borderColor: '$primary500',
      },
    },
  },
  buttonBoxHovered: {
    bg: '$primary100',
  },
  buttonContent: {
    space: 'sm' as const,
    alignItems: 'center' as const,
  },
} as const;

export const addCustomTaskModalStyles = {
  modalBody: {
    padding: '$6',
    paddingTop: '$2',
  },
  formStack: {
    space: 'lg' as const,
  },
  fieldStack: {
    space: 'xs' as const,
  },
  input: {
    variant: 'outline' as const,
    size: 'lg' as const,
    borderWidth: 1,
    borderColor: '$inputBorder',
    borderRadius: '$md',
    bg: '$backgroundPrimary.light',
    focusBorderColor: '$primary500',
    focusBorderWidth: 2,
  },
  textarea: {
    size: 'lg' as const,
    borderWidth: 1,
    borderColor: '$inputBorder',
    borderRadius: '$md',
    bg: '$backgroundPrimary.light',
    focusBorderColor: '$primary500',
    focusBorderWidth: 2,
    minHeight: 100,
  },
  select: {
    bg: '$backgroundPrimary.light',
    borderColor: '$inputBorder',
  },
  pillarDisplayBox: {
    bg: '$mutedForeground',
    padding: '$3',
    borderRadius: '$md',
    borderWidth: 1,
    borderColor: '$inputBorder',
  },
  modalFooter: {
    borderTopWidth: 0,
    padding: '$6',
    paddingTop: '$4',
  },
  footerButtons: {
    space: 'md' as const,
    width: '$full',
    justifyContent: 'flex-end' as const,
  },
  cancelButton: {
    variant: 'outline' as const,
    borderWidth: 1,
    borderColor: '$inputBorder',
    bg: '$backgroundPrimary.light',
    paddingHorizontal: '$6',
    paddingVertical: '$2',
    borderRadius: '$md',
    hoverBg: '$hoverBackground' as const,
    cursor: 'pointer' as const,
  },
  submitButton: {
    variant: 'solid' as const,
    bg: '$primary500',
    paddingHorizontal: '$6',
    paddingVertical: '$2',
    borderRadius: '$md',
    hoverBg: '$primary500' as const,
    hoverOpacity: 0.9,
    cursor: 'pointer' as const,
  },
  submitButtonContent: {
    space: 'xs' as const,
    alignItems: 'center' as const,
  },
  // Service provider selection section
  serviceProviderSection: {
    space: 'sm' as const,
    padding: '$3',
    borderRadius: '$md',
    borderWidth: 1,
    borderColor: '$borderLight300',
    bg: '$taskCardBg',
  },
  serviceProviderHeader: {
    alignItems: 'center' as const,
    space: 'xs' as const,
  },
} as const;

export const evidencePreviewModalStyles = {
  // Modal body container
  container: {
    space: 'md' as const,
    padding: '$4',
  },
  // Description text
  descriptionText: {
    fontSize: '$sm',
    color: '$textSecondary',
  },
  // Scrollable file list
  scrollView: {
    maxHeight: 400,
  },
  fileListContainer: {
    space: 'md' as const,
  },
  // Individual file card
  fileCard: {
    borderWidth: 1,
    borderColor: '$borderLight200',
    borderRadius: '$lg',
    padding: '$4',
    bg: '$white',
  },
  // File header row
  fileHeader: {
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: '$3',
  },
  fileInfoContainer: {
    flex: 1,
    space: 'xs' as const,
  },
  fileNameRow: {
    space: 'sm' as const,
    alignItems: 'center' as const,
  },
  fileNameText: {
    fontSize: '$sm',
    fontWeight: '$semibold',
    color: '$textPrimary',
    numberOfLines: 2,
    flex: 1,
  },
  uploadInfoText: {
    fontSize: '$xs',
    color: '$textMuted',
  },
  // Download button
  downloadButton: {
    padding: '$2',
    borderRadius: '$md',
  },
  downloadButtonHover: {
    bg: '$hoverPink',
  },
  // Image preview placeholder
  imagePreviewPlaceholder: {
    bg: '$backgroundLight100',
    borderRadius: '$md',
    padding: '$6',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  imagePreviewText: {
    fontSize: '$sm',
    color: '$textMuted',
    marginTop: '$2',
  },
  imageTypeText: {
    fontSize: '$xs',
    color: '$primary500',
    marginTop: '$1',
  },
  // Empty state
  emptyStateContainer: {
    padding: '$8',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  emptyStateText: {
    fontSize: '$sm',
    color: '$textMuted',
    marginTop: '$2',
  },
  // Icon sizes
  fileIconSize: 18,
  downloadIconSize: 20,
  previewIconSize: 40,
  // Close button
  closeButton: {
    borderWidth: 1,
    borderColor: '$borderLight300',
    borderRadius: '$md',
    paddingHorizontal: '$5',  // ← Adjust padding here
    paddingVertical: '$2',
    bg: '$white',
  },
  closeButtonText: {
    color: '$textPrimary',
    fontSize: '$sm',
    fontWeight: '$medium',
  },
} as const;

export const fileUploadModalStyles = {
  // Modal container
  container: {
    space: 'md' as const,
  },
  // Upload method option box
  optionBox: {
    padding: '$4',
    borderRadius: '$lg',
    borderWidth: 1,
  },
  optionBoxDefault: {
    borderColor: '$borderLight200',
    bg: '$white',
  },
  optionBoxActive: {
    borderColor: '$primary500',
    bg: '$primary100',
  },
  optionContent: {
    space: 'md' as const,
    alignItems: 'center' as const,
  },
  // Icon container for upload method
  optionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: '$full',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  optionIconContainerDefault: {
    bg: '$backgroundLight100',
  },
  optionIconContainerActive: {
    bg: '$white',
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: '$sm',
    fontWeight: '$medium',
  },
  optionSubtitle: {
    fontSize: '$xs',
    color: '$textSecondary',
  },
  // File list section
  fileListContainer: {
    space: 'sm' as const,
  },
  fileListTitle: {
    fontSize: '$sm',
    fontWeight: '$semibold',
    color: '$textPrimary',
  },
  fileListScrollView: {
    maxHeight: 150,
  },
  fileListStack: {
    space: 'xs' as const,
  },
  // File item card
  fileItemCard: {
    padding: '$3',
    borderRadius: '$md',
    bg: '$accent200',
    borderWidth: 1,
    borderColor: '$accent200',
  },
  fileItemContent: {
    space: 'md' as const,
    alignItems: 'center' as const,
  },
  fileItemIconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  fileItemTextContainer: {
    flex: 1,
  },
  fileItemName: {
    color: '$textPrimary',
    numberOfLines: 1,
  },
  fileItemSize: {
    color: '$textSecondary',
  },
  // Footer buttons
  footerContainer: {
    space: 'md' as const,
    width: '$full',
    justifyContent: 'flex-end' as const,
  },
  cancelButton: {
    variant: 'outline' as const,
    borderWidth: 1,
    borderColor: '$borderLight300',
    borderRadius: '$md',
    paddingHorizontal: '$5',
    paddingVertical: '$2',
  },
  submitButton: {
    bg: '$primary500',
    borderRadius: '$md',
    paddingHorizontal: '$5',
    paddingVertical: '$2',
  },
  submitButtonText: {
    color: '$white',
    fontSize: '$sm',
  },
  // Note box
  noteBox: {
    bg: '$blue50',
    borderColor: '$blue200',
    borderWidth: 1,
    padding: '$3',
    borderRadius: '$md',
    marginTop: '$2',
  },
  noteText: {
    fontSize: '$sm',
    color: '$blue800',
  },
  noteBoldText: {
    fontWeight: '$bold',
    color: '$blue800',
  },
  // Icon sizes
  optionIconSize: 20,
  fileIconSize: 20,
} as const;
