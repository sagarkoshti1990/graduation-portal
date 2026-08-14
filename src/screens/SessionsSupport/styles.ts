export const sessionsSupportStyles = {
  container: {
    flex: 1,
  },
  pageHeaderCss: {
    zIndex: 10,
    position: 'relative' as const,
  },
  headerTitleHStack: {
    alignItems: 'center',
    space: 'sm',
  },
  headerTitleText: {
    fontSize: '$2xl',
    lineHeight: '$2xl',
    fontWeight: '600',
    color: '$textForeground',
  },
  rightSectionBox: {
    position: 'relative',
    zIndex: 100,
  },
  rightSectionHStack: {
    space: 'md',
    alignItems: 'center',
  },
  createSessionBtn: {
    variant: 'outline' as const,
    bg: '$white',
    borderColor: '$borderColor',
    px: '$4',
    py: '$2.5',
    borderRadius: '$lg',
  },
  createSessionBtnText: {
    color: '$textForegroundColor',
    fontWeight: '$medium',
    fontSize: '$sm',
  },
  requestSupportBtn: {
    variant: 'solid' as const,
    bg: '#8B2842',
    px: '$4',
    py: '$2.5',
    borderRadius: '$lg',
  },
  requestSupportBtnText: {
    color: '$white',
    fontWeight: '$medium',
    fontSize: '$sm',
  },
  backdropPressable: {
    position: 'absolute' as any,
    top: -500,
    left: -1000,
    right: -1000,
    bottom: -1000,
    zIndex: 90,
  },
  dropdownBox: {
    position: 'absolute',
    top: '100%',
    right: 0,
    mt: '$2',
    width: 230,
    bg: '$white',
    borderRadius: '$xl',
    borderWidth: 1,
    borderColor: '$borderLight200',
    shadowColor: '$shadowColor',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    zIndex: 100,
    overflow: 'hidden',
  },
  dropdownItemPressable: {
    px: '$3.5',
    py: '$3',
    $hover: { bg: '$accent100' },
    $active: { bg: '$primary50' },
  },
  dropdownItemHStack: {
    space: 'sm',
    alignItems: 'flex-start',
  },
  dropdownItemIconBox: {
    mt: '$0.5',
  },
  dropdownItemVStack: {
    space: 'xs',
    flex: 1,
  },
  dropdownItemTitle: {
    fontSize: '$sm',
    fontWeight: '600',
    color: '#1E293B',
  },
  dropdownItemDescription: {
    fontSize: '$xs',
    color: '#64748B',
    lineHeight: '$xs',
  },
  contentContainer: {
    py: '$6',
  },
  contentVStack: {
    space: 'md',
  },
  comingSoonText: {
    fontSize: '$sm',
    color: '$textSecondary',
  },
  headerBadgeBox: {
    bg: '#FEE2E2',
    px: '$2.5',
    py: '$0.5',
    borderRadius: '$full',
  },
  headerBadgeText: {
    fontSize: '$xs',
    fontWeight: '500',
    color: '#8B2842',
  },
  headerSubTitleText: {
    fontSize: '$xl',
    fontWeight: '600',
    color: '$textForeground',
  },
} as const;

export default sessionsSupportStyles;
