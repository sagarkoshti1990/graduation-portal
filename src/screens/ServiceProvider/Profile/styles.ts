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
    mb: '$5',
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
    size: 'sm' as const,
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
} as const;