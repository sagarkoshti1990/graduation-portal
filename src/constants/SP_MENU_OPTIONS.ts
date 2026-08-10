import { theme } from '@config/theme';
import { MenuItemData } from '@components/ui/Menu';

// LC menu options with icons, dividers, and i18n labels
export const SP_MENU_OPTIONS: MenuItemData[] = [
  {
    key: 'dashboard',
    textValue: 'dashboard',
    label: 'supportProvider.menu.dashboard',
    iconName: 'LayoutDashboard',
    route: 'dashboard',
  },
  {
    key: 'support_offerings',
    textValue: 'support_offerings',
    label: 'supportProvider.menu.mySupportOfferings',
    iconName: 'Package',
    route: 'opportunities',
  },
  {
    key: 'requests',
    textValue: 'requests',
    label: 'supportProvider.menu.requests',
    iconName: 'Bell',
    route: 'requests',
  },
  {
    key: 'materials_library',
    textValue: 'materials_library',
    label: 'supportProvider.menu.materialsLibrary',
    iconName: 'BookOpen',
    route: 'materials',
  },
  {
    key: 'profile',
    textValue: 'profile',
    label: 'supportProvider.menu.profile',
    iconName: 'User',
    route: 'profile',
  },
  {
    key: 'logout',
    label: 'common.logout',
    textValue: 'logout',
    iconName: 'LogOut',
    iconSizeValue: 16,
    iconColor: theme.tokens.colors.error600, // Error color indicates destructive action
    showDividerAfter: false,
    // No route for logout - handled by logout function
  },
];

// Mentoring entity type keys used to fetch dropdown options from the API
export const MENTORING_ENTITY_TYPES = {
  SESSION_CATEGORIES: 'session_categories',
  RECOMMENDED_FOR: 'recommended_for',
  DELIVERY_MODE: 'delivery_mode',
  CERTIFICATE_PROVIDED: 'certificate_provided',
} as const;
