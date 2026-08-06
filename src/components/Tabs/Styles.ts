import { theme } from '@config/theme';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';

export const tabButtonStyles = {
  // Default variant unchanged
  defaultContainer: (isActive: boolean) => ({
    paddingHorizontal: '$6',
    paddingVertical: '$3',
    borderBottomWidth: 2,
    borderBottomColor: isActive
      ? theme.tokens.colors.primary500
      : 'transparent',
  }),

  defaultText: (isActive: boolean) => ({
    textAlign: 'center' as const,
    ...TYPOGRAPHY.label,
    color: isActive
      ? theme.tokens.colors.primary500
      : theme.tokens.colors.mutedForeground,
  }),

  // ---------------------------------------------
  // BUTTON TAB VARIANT (UPDATED: inactive is grey)
  // ---------------------------------------------
  buttonTabContainer: (isActive: boolean) => ({
    flex: 1,
    paddingVertical: '$0.5',
    paddingHorizontal: '$4',
  
    // Active = white pill, Inactive = transparent over blue bg
    bg: isActive ? '$white' : 'transparent',
  
    // Full rounded pill for active tab
    borderRadius: isActive ? 50 : 0,
  
    alignItems: 'center',
    justifyContent: 'center',
  
    $web: {
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
  }),
  
  

  buttonTabText: (isActive: boolean) => ({
    fontSize: 14,
    fontWeight: isActive ? '$medium' : '$normal',
    color: theme.tokens.colors.textForeground,
    textAlign: 'center',
  }),
 
  buttonTabIconColor: theme.tokens.colors.textForeground,

  badgeContainer: (isActive: boolean) => ({
    minWidth: 20,
    h: 20,
    borderRadius: '$full' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    bg: isActive ? '$primary500' : '$accent200',
    px: '$1.5' as const,
    ml: '$1.5' as const,
  }),

  badgeText: (isActive: boolean) => ({
    fontSize: '$xs' as const,
    fontWeight: '$semibold' as const,
    color: isActive ? '$white' : '$mutedForeground',
    lineHeight: '$xs' as const,
  }),

  tabRow: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: '$2',
    p: '$1',
  } as const,

  pressableOpacity: (isDisabled: boolean) => ({
    opacity: isDisabled ? 0.5 : 1,
  }),
} as const;