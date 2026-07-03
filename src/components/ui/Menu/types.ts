import type React from 'react';

/**
 * Menu Component - Enhanced with Icon and Divider Support
 *
 * - Added `showDividerAfter` property to MenuItemData for visual menu organization
 * - Added icon support: `iconElement` (custom ReactNode), `iconName` (LucideIcon name), `icon` (Gluestack Icon)
 * - Added `iconColor` and `iconSizeValue` for fine-grained icon styling control
 */
export interface MenuItemData {
  key: string;
  label: string;
  textValue: string;
  icon?: any;
  iconSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  iconElement?: React.ReactNode; // Custom ReactNode for icon (e.g., React.createElement pattern)
  iconName?: string; // LucideIcon name (e.g., 'Home', 'User', 'LogOut')
  iconColor?: string; // Icon color value
  iconSizeValue?: number; // Icon size in pixels
  color?: string;
  showDividerAfter?: boolean; // Render divider after this menu item
  route?: string; // Navigation route name for menu items that navigate
  href?: string; // External URL for menu items that open outside the app
  isComingSoon?: boolean; // Render coming soon badge if true
}

export interface CustomMenuProps {
  items: MenuItemData[];
  placement?:
    | 'top'
    | 'bottom'
    | 'left'
    | 'right'
    | 'top left'
    | 'top right'
    | 'bottom left'
    | 'bottom right'
    | 'left top'
    | 'left bottom'
    | 'right top'
    | 'right bottom';
  offset?: number;
  disabledKeys?: string[];
  triggerLabel?: string;
  trigger?: (triggerProps: any) => React.ReactElement;
  onSelect?: (key: string) => void;
  menuProps?: any;
  triggerProps?: any;
}
