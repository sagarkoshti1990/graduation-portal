export const passwordPolicyStyles = {
  container: {
    flex: 1,
    bg: '$white' as const,
  },
  headerContainer: {
    mb: '$8' as const,
    w: '$full' as const,
    alignSelf: 'center' as const,
  },
  headerRow: {
    alignItems: 'center' as const,
    space: 'sm' as const,
    mb: '$2' as const,
  },
  pageTitle: {
    size: 'xl' as const,
    fontWeight: '$bold' as const,
    color: '$textPrimary' as const,
  },
  pageSubtitle: {
    size: 'sm' as const,
    color: '$textSecondary' as const,
  },
  innerSectionContainer: {
    borderWidth: 1,
    borderColor: '$gray300' as const,
    borderRadius: '$md' as const,
    p: '$4' as const,
    '$md-p': '$6' as const,
    mt: '$5' as const,
    w: '$full' as const,
  },
  sectionHeader: {
    mb: '$6' as const,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: '$2' as const,
  },
  sectionTitle: {
    fontWeight: '$semibold' as const,
    size: 'md' as const,
    color: '$textPrimary' as const,
  },

  // Permission Blocks
  permissionBlock: {
    p: '$4' as const,
    borderRadius: '$md' as const,
    mb: '$3' as const,
    borderWidth: 1,
  },
  permissionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: '$2' as const,
    mb: '$2' as const,
  },
  permissionTitle: {
    fontWeight: '$bold' as const,
    color: '$textPrimary' as const,
    fontSize: '$sm' as const,
  },
  listContainer: {
    gap: '$1' as const,
    pl: '$1' as const,
  },
  listItem: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: '$2' as const,
  },
  listItemText: {
    flex: 1,
    fontSize: '$sm' as const,
    color: '$textSecondary' as const,
  },
  bullet: {
    w: '$1' as const,
    h: '$1' as const,
    borderRadius: '$full' as const,
    bg: '$textSecondary' as const,
    mt: '$1.5' as const,
  },

  // Section 2: Requirements
  requirementsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: '$8' as const,
    mt: '$4' as const,
  },
  requirementColumn: {
    flex: 1,
    minWidth: 200,
  },
  columnTitle: {
    mb: '$3' as const,
    fontWeight: '$semibold' as const,
    color: '$textPrimary' as const,
  },
} as const;
