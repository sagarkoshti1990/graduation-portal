// Sidebar Styles
export const sidebarStyles = {
  container: {
    bg: '$bgSidebar' as const,
    borderRightWidth: 1,
    borderRightColor: '$borderLight300' as const,
    width: '$64',
    height: '$full',
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
    height: "$8",
    display: 'flex',
    alignItems: 'center',
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
    lineHeight: '$md',
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
};

// Sidebar Item Styles
export const sidebarItemStyles = {
  container: (isChild: boolean) => ({
  
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
    p: '$2' as const,
    bg: '#f1f5f9'
  },
  itemIcon: (isActive: boolean) => ({
    color: (isActive ? '$primary600' : '$textLight600') as const,
    size: 'md' as const,
  }),
  itemText: (isActive: boolean) => ({
    fontSize: '$sm' as const,
    fontWeight: isActive ? ('$medium' as const) : ('$normal' as const),
    color: (isActive ? '$primary600' : '$textLight900') as const,
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
    bg: '$backgroundLight100' as const,
  },
  activeBackground: {
    bg: '$primary100' as const,
  },
};
