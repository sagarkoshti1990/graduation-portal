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
