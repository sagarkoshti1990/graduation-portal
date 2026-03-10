// Sidebar Styles
export const sidebarStyles = {
  container: {
    bg: '$bgSidebar' as const,
    borderRightWidth: 1,
    borderRightColor: '$borderLight300' as const,
    width: '$64' as const,
    height: '$full' as const,
  },
  scrollContent: {
    flex: 1,
    space: 'md' as const,
    px: '$4' as const,
    py: '$3' as const,
  },
  sectionTitle: {
    fontSize: '$xs' as const,
    fontWeight: '$medium' as const,
    color: '$textLight500' as const,
    textTransform: 'uppercase' as const,
    //px: '$4' as const,
    mb: '$2' as const,
    letterSpacing: 1,
    height: '$8' as const,
    display: 'flex' as const,
    alignItems: 'center' as const,
  },
  quickActionsHeader: {
    px: '$4' as const,
    py: '$2' as const,
  },
  quickActionsTitle: {
    fontSize: '$xs' as const,
    fontWeight: '$medium' as const,
    color: '$textLight500' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  quickActionsTitleContainer: {
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  quickActionsChevron: {
    color: '$textLight500' as const,
    size: 'sm' as const,
  },
  quickActionsContent: {
    space: 'xs' as const,
    mt: '$2' as const,
  },
  bottomSection: {
    borderTopWidth: 1,
    borderTopColor: '$borderLight300' as const,
    px: '$4' as const,
    py: '$4' as const,
    mt: 'auto' as const,
  },
  bottomContent: {
    space: 'md' as const,
  },
  languageSelectorContainer: {
    alignItems: 'center' as const,
    space: 'md' as const,
    justifyContent: 'space-between' as const,
    width: '$full' as const,
  },
  languageIcon: {
    color: '$textLight600' as const,
    size: 'md' as const,
  },
  languageText: {
    fontSize: '$sm' as const,
    color: '$textLight900' as const,
    flex: 1,
  },
  languageChevron: {
    color: '$textLight500' as const,
    size: 'sm' as const,
  },
  statusContainer: {
    alignItems: 'center' as const,
    space: 'sm' as const,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: '$full' as const,
    bg: '$success600' as const,
  },
  statusText: {
    fontSize: '$xs' as const,
    color: '$textLight500' as const,
  },
  drawerContent: {
    width: 280,
    bg: '$backgroundLight50' as const,
    borderRightWidth: 1,
    borderRightColor: '$borderLight300' as const,
    height: '$full' as '$full',
  },
  drawerHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '$borderLight300' as const,
    px: '$4' as const,
    py: '$3' as const,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  drawerTitle: {
    fontSize: '$lg' as const,
    fontWeight: '$bold' as const,
    color: '$textLight900' as const,
  },
  drawerBody: {
    flex: 1,
    height: '$full' as '$full',
  },

  menuButton: {
    p: '$2' as const,
    mr: '$2' as const,
    borderRadius: '$md' as const,
  },
  menuIcon: {
    color: '$textLight900' as const,
    size: 'lg' as const,
  },
  logoContainer: {
    alignItems: 'center' as const,
    space: 'md' as const,
  },
  logoImage: {
    width: 48,
    height: 48,
  },
  brandContainer: {
  
  },
  brandRow: {
    alignItems: 'center' as const,
    space: 'xs' as const,
  },
  brandTextPrimary: {
    fontSize: '$lg' as const,
    fontWeight: '$bold' as const,
    color: '$primary600' as const,
  },
  brandTextSecondary: {
    fontSize: '$md' as const,
    fontWeight: '$bold' as const,
    color: '$textLight900' as const,
    lineHeight: '$md' as const,
  },
  versionText: {
    fontSize: '$xs' as const,
    color: '$textLight500' as const,
    //lineHeight: '13', // 15px
  },
  mobileMenuButton: {
    alignItems: 'center' as const,
    space: 'sm' as const,
    py: '$2' as const,
    px: '$6' as const,
    minHeight: 64,
  },
  closeButton: {
    p: '$2' as const,
    borderRadius: '$md' as const,
  },
  mainSection: {
    p: '$2' as const,
    mb: '$6' as const,
  },

  // Collapsed sidebar
  collapsedScroll: {
    flex: 1,
    px: '$2' as const,
    py: '$3' as const,
  },
  collapsedScrollContentContainer: {
    alignItems: 'center' as const,
    paddingBottom: 16,
  },
};

// Sidebar Item Styles
export const sidebarItemStyles = {
  container: (isChild: boolean, isActive: boolean) => ({
    px: '$3' as const,
    py: '$2' as const,
    borderRadius: '$md' as const,
    bg: isActive ? '$accent200' : 'transparent',
    ...(isChild
      ? {
          ml: '$6' as const,
          px: '$3' as const,
        }
      : null),
  }),
  itemContainer: {
    alignItems: 'center' as const,
    space: 'md' as const,
    justifyContent: 'space-between' as const,
    gap: '$1' as const,
  },
  itemContent: {
    alignItems: 'center' as const,
    space: 'sm' as const,
    flex: 1,
    // background/padding handled by the outer Pressable container
  },
  itemIcon: (isActive: boolean) => ({
    color: isActive ? '$textForeground' : '$textLight600',
    size: 'md' as const,
  }),
  itemText: (isActive: boolean) => ({
    fontSize: '$sm' as const,
    fontWeight: isActive ? ('$medium' as const) : ('$normal' as const),
    color: isActive ? '$textForeground' : '$textLight900',
  }),
  chevronIcon: {
    color: '$textLight500' as const,
    size: 'sm' as const,
  },
  childContainer: {
    space: 'xs' as const,
    mt: '$1' as const,
  },
  pressableHover: {
    bg: '$accent200' as const,
  },
  // active background handled in container()

  // Collapsed item icon wrapper
  collapsedIconContainer: (bg: any) => ({
    width: 40,
    height: 40,
    borderRadius: '$md' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    bg,
    '$web-cursor': 'pointer' as const,
  }),
};
