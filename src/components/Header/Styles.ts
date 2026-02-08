export const stylesHeader = {
  container: {
    px: '$4' as const,
    py: '$3' as const,
    justifyContent: 'center' as const,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 3,
    borderBottomWidth: '$1' as const,
    borderBottomColor: '$borderDark200' as const,
    zIndex: 1,
  },
  title: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  right: {
    alignItems: 'center',
    gap: '$4',
  },
  rightColorModeIcon: {
    size: 'lg',
  },
  titleText: {
    size: 'lg',
    bold: true,
  },
  hStack: {
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    space: 'md' as const,
    flex: 1,
  },
  searchContainer: {
    flex: 1,
    maxWidth: 300,
    mx: '$4' as const,
  },
  searchInput: {
    variant: 'outline' as const,
    size: 'md' as const,
    borderRadius: '$xl' as const,
    bg: '$backgroundLight50' as const,
    borderColor: '$borderLight300' as const,
  },
  searchIconContainer: {
    position: 'absolute' as const,
    left: '$3' as const,
    zIndex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  searchIcon: {
    color: '$textLight400' as const,
    size: 'xl' as const,
  },
  searchInputField: {
    placeholderTextColor: '$textLight400' as const,
  },
  rightActionsContainer: {
    marginLeft: 'auto',
    alignItems: 'center' as const,
    space: 'lg' as const,
  },
  notificationBadge: {
    position: 'absolute' as const,
    top: 0,
    right: 0,
    bg: '$error600' as const,
    rounded: '$full' as const,
    minWidth: 20,
    height: 20,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  notificationBadgeText: {
    fontSize: '$2xs' as const,
    color: '$white' as const,
    fontWeight: '$bold' as const,
  },
  userMenuTrigger: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    space: 'sm' as const,
    gap: '$2' as const,
  },
  userAvatar: {
    bg: '$primary600' as const,
    size: 'sm' as const,
  },
  userInfoContainer: {
    space: 'xs' as const,
  },
  // Updated typography for LC header: fontSize $sm → $md, fontWeight $semibold → $normal, color $textLight900 → $textForegroundColor
  userNameText: {
    fontSize: '$md' as const,
    fontWeight: '$normal' as const,
    color: '$textForegroundColor' as const,
  },
  userRoleContainer: {
    alignItems: 'center' as const,
    space: 'xs' as const,
  },
  userRoleText: {
    fontSize: '$xs' as const,
    color: '$textLight500' as const,
  },
  chevronIcon: {
    color: '$textLight500' as const,
    size: 'lg' as const,
  },
  notificationIcon: {
    color: '$textLight900' as const,
    size: 'xl' as const,
    p: '$3' as const,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: '$full' as const,
    bg: '$primary500' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
} as const;
