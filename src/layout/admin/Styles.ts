// Layout Styles
export const layoutStyles = {
  container: {
    bg: '$backgroundLight0' as const,
    minHeight: '$full' as '$full',
    flexDirection: 'row' as const,
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentContainer: {
    flex: 1,
    width: '$full' as const,
    flexDirection: 'column' as const,
  },
  mainContent: {
    flex: 1,
    width: '$full' as const,
    bg: '$backgroundLight0' as const,
    padding: '$6',
  },
  headerContent: {
    bg: '$backgroundLight0' as const,
    minHeight: '$16',
    width: '$full' as const,
  },

  // Desktop sidebar toggle (circular chevron at sidebar edge)
  desktopSidebarToggleWrapper: (isDrawerOpen: boolean): any => ({
    position: 'absolute' as const,
    // Position it slightly below the header area
    top: 60,
    // Sidebar widths:
    // - Expanded: $64 (~256px)
    // - Collapsed rail: 56px
    // Center the button on the sidebar edge.
    left: isDrawerOpen ? 256 - 14 : 56 - 14,
    zIndex: 1000,
  }),
  desktopSidebarToggleButton: (isHovered: boolean): any => ({
    width: '$6' as const,
    height: '$6' as const,
    borderRadius: 999,
    bg: '$white' as const,
    borderWidth: 1,
    borderColor: isHovered ? '$primary600' : '$borderLight300',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    shadowColor: '$black' as const,
    shadowOffset: { width: 0, height: 2 } as any,
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
    '$web-cursor': 'pointer' as const,
  }),
};
