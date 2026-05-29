export const taskAccordionStyles = {
  container: {

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
    px: '$3',
    "$sm-px": '$4',
    "$md-px": '$5',
    "$lg-px": '$5',
    "$xl-px": '$5',
    py: '$4',
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
    borderWidth: 1,
    borderColor: 'transparent',
  },
  accordion: {
    type: 'single' as const,
    variant: 'unfilled' as const,
    shadowColor: '$backgroundLight900',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    paddingHorizontal: '$1',
  },
  accordionPreview: {
    type: 'single' as const,
    variant: 'unfilled' as const,
    shadowColor: 'transparent',
    elevation: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: '$1',
  },
  accordionItem: {
    bg: '$white',
    borderRadius: '$lg',
    borderWidth: 1,
    borderColor: '$mutedBorder',
  },
  accordionTrigger: {
    padding: '$4',
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
    px: '$4',
    pt: '$0',
    pb: '$4',
    mt: '$0',
  },
  accordionContentStack: {
    space: 'md' as const
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
  // Action required badge
  actionRequiredBadge: {
    space: 'xs' as const,
    alignItems: 'center' as const,
    bg: '$evidenceRequiredBg',
    borderWidth: 1,
    borderColor: '$evidenceRequiredBorder',
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
