export default {
  container: {
    px: '$4',
    py: '$6',
    '$md-px': '$8',
    bg: '$background50',
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    pb: '$12',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '$textForeground',
  },

  // Card section styling
  sectionCard: {
    bg: '$white',
    borderRadius: '$2xl',
    p: '$6',
    mb: '$6',
    borderWidth: 1,
    borderColor: '$borderColor',
    shadowColor: '$black',
    shadowOffset: { width: 0, height: 2 } as const,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: '$3',
    mb: '$2',
  },
  sectionIconContainer: {
    p: 0,
    bg: 'transparent',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '$textForeground',
    p: 0,
    m: 0,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '$textMutedForeground',
    mt: '$0.5',
    p: 0,
  },
  sectionContainer: {
    borderWidth: 0,
    p: 0,
    m: 0,
  },

  // Field/Input styling
  input: {
    variant: 'outline' as const,
    size: 'md' as const,
    bg: '$white',
    borderColor: '#d1d5db',
    borderWidth: 1,
    borderRadius: '$md',
    px: '$3',
    h: 40,
  },
  textInput: {
    variant: 'outline' as const,
    size: 'sm' as const,
    bg: '$white',
    borderColor: '#d1d5db',
    borderWidth: 1,
    borderRadius: '$md',
    h: 40,
  },
  label: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '$textMutedForeground',
    mb: '$1',
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '$textForeground',
    mt: '$4',
    mb: '$1',
  },

  // Coverage Card & Badge styling
  coverageCard: {
    p: '$4',
    bg: '$white',
    borderRadius: '$lg',
    borderWidth: 1,
    borderColor: '$borderColor',
    mb: '$2',
    shadowColor: '$black',
    shadowOffset: { width: 0, height: 2 } as const,
    shadowOpacity: 0.02,
    shadowRadius: 4,
  },

  // Custom design-parity badge styles
  blueBadge: {
    bg: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 9999,
    px: '$3',
    py: '$0.5',
    mr: '$1.5',
    mb: '$1.5',
  },
  blueBadgeText: {
    color: '#1d4ed8',
    fontSize: 12,
    fontWeight: '600' as const,
    textTransform: 'none' as const,
  },

  greyBadge: {
    bg: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 9999,
    px: '$3',
    py: '$0.5',
    mr: '$1.5',
    mb: '$1.5',
  },
  greyBadgeText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '500' as const,
    textTransform: 'none' as const,
  },

  redBadge: {
    bg: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 9999,
    px: '$3',
    py: '$0.5',
    mr: '$1.5',
    mb: '$1.5',
  },
  redBadgeText: {
    color: '#b91c1c',
    fontSize: 12,
    fontWeight: '600' as const,
    textTransform: 'none' as const,
  },

  greenBadge: {
    bg: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 9999,
    px: '$3',
    py: '$0.5',
    mr: '$1.5',
    mb: '$1.5',
  },
  greenBadgeText: {
    color: '#15803d',
    fontSize: 12,
    fontWeight: '600' as const,
    textTransform: 'none' as const,
  },

  purpleBadge: {
    bg: '#faf5ff',
    borderWidth: 1,
    borderColor: '#e9d5ff',
    borderRadius: 9999,
    px: '$3',
    py: '$0.5',
    mr: '$1.5',
    mb: '$1.5',
  },
  purpleBadgeText: {
    color: '#6d28d9',
    fontSize: 12,
    fontWeight: '600' as const,
    textTransform: 'none' as const,
  },

  // Coverage Add Section styling
  coverageAddSection: {
    mt: '$3',
    p: '$4',
    bg: '#f9fafb',
    borderRadius: '$md',
    borderStyle: 'dashed' as const,
    borderWidth: 1,
    borderColor: '$borderColor',
  },
  addButton: {
    mt: '$2',
  },
  addButtonText: {
    fontSize: 13,
  },

  // Category card styles
  categoryCard: {
    p: '$4',
    bg: '$white',
    borderRadius: '$lg',
    borderWidth: 1,
    borderColor: '$borderColor',
    mb: '$2',
    shadowColor: '$black',
    shadowOffset: { width: 0, height: 2 } as const,
    shadowOpacity: 0.02,
    shadowRadius: 4,
  },
  cardSectionHeading: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '$textForeground',
    mt: '$2',
    mb: '$1',
  },
  cardFieldLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '$textMutedForeground',
    mb: '$1',
  },
  pillBadge: {
    bg: '$background100',
    borderRadius: '$sm',
    px: '$2',
    py: '$0.5',
    mr: '$1',
    mb: '$1',
  },
  pillBadgeText: {
    color: '$textForeground',
    fontSize: 11,
    textTransform: 'none' as const,
  },

  // Newly added style classes for component cleanup
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    bg: '$background50',
  },
  root: {
    flex: 1,
  },
  editButton: {
    variant: 'solid' as const,
    style: {
      borderRadius: 6,
      height: 40,
      paddingHorizontal: 16,
    },
  },
  editButtonIcon: {
    mr: '$2',
  },
  headerActions: {
    space: 'sm' as const,
  },
  cancelButton: {
    variant: 'outline' as const,
    borderColor: '$borderColor',
    style: {
      borderRadius: 10,
      height: 40,
      paddingHorizontal: 16,
      backgroundColor: 'transparent',
    },
  },
  cancelButtonIcon: {
    color: '#6b7280',
    mr: '$2',
  },
  cancelButtonText: {
    color: '#4b5563',
    fontWeight: '600' as const,
  },
  saveButton: {
    variant: 'solid' as const,
    bg: '$success600',
    borderColor: '$success600',
    style: {
      borderRadius: 10,
      height: 40,
      paddingHorizontal: 16,
    },
  },
  saveSpinner: {
    size: 'small' as const,
    color: '$white',
    mr: '$2',
  },
  saveButtonIcon: {
    color: '$white',
    mr: '$2',
  },
  saveButtonText: {
    color: '$white',
    fontWeight: '600' as const,
  },
  sectionIcon: {
    size: 20,
    color: '$primary500',
  },
  alignCenterRow: {
    alignItems: 'center' as const,
  },
  requiredAsterisk: {
    color: '$red500',
    fontSize: 16,
    fontWeight: '700' as const,
  },

  // ProvinceCoverage custom styles
  coverageContainer: {
    space: 'md' as const,
    width: '100%',
  },
  titleContainer: {
    space: 'xs' as const,
  },
  addedCardsContainer: {
    space: 'sm' as const,
  },
  noCoverageText: {
    color: '$textMutedForeground',
    fontSize: 12,
  },
  cardHeader: {
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    width: '100%',
  },
  cardHeaderLeft: {
    space: 'sm' as const,
    alignItems: 'center' as const,
    flex: 1,
  },
  mapPinIcon: {
    size: 16,
    color: '$primary500',
  },
  cardTitleText: {
    fontWeight: '700' as const,
    color: '$textForeground',
    fontSize: 14,
  },
  cardBadge: {
    bg: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 9999,
    px: '$3',
    py: '$0.5',
    mr: 0,
    mb: 0,
  },
  trashIcon: {
    size: 16,
    color: '$error600',
  },
  siteBadgeContainer: {
    space: 'xs' as const,
    flexWrap: 'wrap' as const,
    mt: '$2',
  },
  coverageAddTitle: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '$primary500',
    letterSpacing: 0.5,
  },
  coverageAddInputs: {
    space: 'md' as const,
    width: '100%',
  },
  inputCol: {
    flex: 1,
    space: 'xs' as const,
  },
  labelCol: {
    alignItems: 'center' as const,
  },
  redAsteriskSmall: {
    color: '$red500',
    fontSize: 12,
  },
  actionButtonRow: {
    justifyContent: 'flex-end' as const,
    width: '100%',
    mt: '$4',
  },
  addButtonActive: {
    variant: 'solid' as const,
    action: 'primary' as const,
    bg: '#7a1f2d',
    style: {
      borderRadius: 6,
      height: 40,
    },
  },
  addButtonDisabled: {
    variant: 'solid' as const,
    action: 'primary' as const,
    bg: '#cca3a9',
    style: {
      borderRadius: 6,
      height: 40,
    },
  },
  plusIconSmall: {
    mr: '$1',
  },

  // SupportCategories custom styles
  supportCategoryHeader: {
    alignItems: 'center' as const,
  },
  offeredBadge: {
    bg: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 9999,
    px: '$3',
    py: '$0.5',
    ml: '$2',
    mr: 0,
    mb: 0,
  },
  specificTrainingTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '$textForeground',
    mt: '$2',
  },
  subCategoriesContainer: {
    space: 'sm' as const,
    mt: '$2',
  },
  subCategoryCol: {
    space: 'xs' as const,
  },
  badgeRow: {
    space: 'xs' as const,
    flexWrap: 'wrap' as const,
    marginTop: '$3',
  },
  detailsCol: {
    space: 'xs' as const,
    mt: '$2',
  },
  detailsText: {
    color: '$textForeground',
    fontSize: 12,
  },
  addSupportCategoryTitle: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '$primary500',
    letterSpacing: 0.5,
  },
  categorySelectCol: {
    space: 'xs' as const,
  },
  trainingAreaBox: {
    space: 'md' as const,
    p: '$4',
    bg: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: '$lg',
    mt: '$3',
  },
  trainingAreaTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#1d4ed8',
    mb: '$1',
  },
  trainingAreaFieldCol: {
    space: 'xs' as const,
  },
  trainingAreaLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '$textMutedForeground',
    mb: 0,
  },
  linkageAreaBox: {
    space: 'md' as const,
    p: '$4',
    bg: '#faf5ff',
    borderWidth: 1,
    borderColor: '#e9d5ff',
    borderRadius: '$lg',
    mt: '$3',
  },
  linkageAreaFieldCol: {
    space: 'xs' as const,
  },
  linkageAreaLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '$textMutedForeground',
    mb: 0,
  },
  assetsAreaBox: {
    space: 'md' as const,
    p: '$4',
    bg: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: '$lg',
    mt: '$3',
  },
  assetsAreaLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '$success800',
  },
  othersAreaCol: {
    space: 'xs' as const,
    mt: '$3',
  },
  othersAreaLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '$textMutedForeground',
    mb: '$1',
  },
  addCategoryButtonActive: {
    variant: 'solid' as const,
    bg: '$primary500',
    borderColor: '$primary500',
    size: 'sm' as const,
    style: {
      borderRadius: 8,
      height: 38,
    },
  },
  addCategoryButtonDisabled: {
    variant: 'solid' as const,
    bg: '$background100',
    borderColor: '$background100',
    size: 'sm' as const,
    style: {
      borderRadius: 8,
      height: 38,
    },
  },
  addCategoryButtonTextActive: {
    color: '$white',
    fontWeight: '600' as const,
  },
  addCategoryButtonTextDisabled: {
    color: '$textMuted',
    fontWeight: '600' as const,
  },
  addCategoryButtonIconActive: {
    mr: '$2',
    color: '$white',
  },
  addCategoryButtonIconDisabled: {
    mr: '$2',
    color: '$textMuted',
  },
} as const;