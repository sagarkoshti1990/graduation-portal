import { theme } from '@config/theme';
import { MenuItemData } from '@components/ui/Menu';

/**
 * Profile Menu Options - Enhanced for LC Support
 * 
 * - Separated LC_MENU_OPTIONS from ADMIN_MENU_OPTIONS for role-specific menu configurations
 * - LC menu includes: icons (via iconName + iconColor), dividers (showDividerAfter), and i18n labels
 * - Uses React.createElement pattern in constants for icon rendering (iconElement)
 * - Dividers placed after Home and Service Providers for visual menu organization
 * - Logout item uses error color (error600) to indicate destructive action
 */
// Admin menu options (original - backward compatible)
export const ADMIN_MENU_OPTIONS: MenuItemData[] = [
  {
    key: 'profile',
    label: 'common.profile',
    textValue: 'profile',
  },
  {
    key: 'settings',
    label: 'common.settings',
    textValue: 'settings',
  },
  {
    key: 'logout',
    label: 'common.logout',
    textValue: 'logout',
  },
];

// LC menu options with icons, dividers, and i18n labels
export const LC_MENU_OPTIONS: MenuItemData[] = [
  {
    key: 'home',
    label: 'lc.menu.home',
    textValue: 'home',
    iconName: 'Home', // LucideIcon name
    iconSizeValue: 16,
    iconColor: theme.tokens.colors.textForegroundColor,
    showDividerAfter: true, // Divider after Home (separates navigation from profile actions)
    route: 'welcome', // Navigation route for home menu item
  },
  {
    key: 'dashboard',
    label: 'lc.menu.dashboard',
    textValue: 'dashboard',
    iconName: 'LayoutDashboard',
    iconSizeValue: 16,
    iconColor: theme.tokens.colors.textForegroundColor,
    showDividerAfter: false,
    route: 'dashboard', // Navigation route for dashboard menu item
    isComingSoon: true,
  },
  {
    key: 'myProfile',
    label: 'lc.menu.myProfile',
    textValue: 'myProfile',
    iconName: 'User',
    iconSizeValue: 16,
    iconColor: theme.tokens.colors.textForegroundColor,
    showDividerAfter: false,
    // route: 'myProfile', // Add route when myProfile screen is implemented
  },
  // {
  //   key: 'serviceProviders',
  //   label: 'lc.menu.serviceProviders',
  //   textValue: 'serviceProviders',
  //   iconName: 'Building2',
  //   iconSizeValue: 16,
  //   iconColor: theme.tokens.colors.textForegroundColor,
  //   showDividerAfter: true, // Divider after Service Providers (separates actions from logout)
  //   // route: 'serviceProviders', // Add route when serviceProviders screen is implemented
  //   isComingSoon: true,
  // },
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

// Default export for Admin (backward compatibility)
export default ADMIN_MENU_OPTIONS;

export const SERVICE_PROVIDER_LIST = [
  { label: 'Department of Social Development (DSD)', value: 'Department of Social Development (DSD)' },
  { label: 'National Development Agency (NDA)', value: 'National Development Agency (NDA)' },
  { label: 'Department of Education (DOE)', value: 'Department of Education (DOE)' },
  { label: 'Department of Labour (DOL)', value: 'Department of Labour (DOL)' },
  { label: 'Department of Small Business Development (DSBD)', value: 'Department of Small Business Development (DSBD)' },
  { label: 'Local Economic Development (Municipal LED)', value: 'Local Economic Development (Municipal LED)' },
  { label: 'National Youth Development Agency (NYDA)', value: 'National Youth Development Agency (NYDA)' },
  { label: 'Small Enterprise Development Finance Agency (SEDFA)', value: 'Small Enterprise Development Finance Agency (SEDFA)' },
  { label: 'Financial Sector Conduct Authority (FSCA)', value: 'Financial Sector Conduct Authority (FSCA)' },
  { label: 'Banking Association South Africa (BASA)', value: 'Banking Association South Africa (BASA)' },
  { label: 'Youth Employment Service (YES for Youth)', value: 'Youth Employment Service (YES for Youth)' },
  { label: 'Harambee Youth Employment Accelerator (Harambee)', value: 'Harambee Youth Employment Accelerator (Harambee)' },
  { label: 'Khula Youth Enterprise', value: 'Khula Youth Enterprise' },
  {
    label: 'Technical and Vocational Education and Training Colleges (TVET Colleges)',
    value: 'Technical and Vocational Education and Training Colleges (TVET Colleges)',
  },
  { label: 'Community Colleges', value: 'Community Colleges' },
  { label: 'Private Training Providers', value: 'Private Training Providers' },
  { label: 'School Governing Body (SGB)', value: 'School Governing Body (SGB)' },
  {
    label: 'DSD Funded Non-Profit Organizations (NPOs)',
    value: 'DSD Funded Non-Profit Organizations (NPOs)',
  },
  { label: 'Other Non-Profit Organizations (NPOs)', value: 'Other Non-Profit Organizations (NPOs)' },
  { label: 'HOPE Worldwide South Africa (HOPEWWSA)', value: 'HOPE Worldwide South Africa (HOPEWWSA)' },
  { label: 'Families South Africa (FAMSA)', value: 'Families South Africa (FAMSA)' },
  { label: 'Focus on the Family', value: 'Focus on the Family' },
  { label: 'Lifeline', value: 'Lifeline' },
  { label: 'Loveline', value: 'Loveline' },
  { label: 'SaveAct', value: 'SaveAct' },
  { label: 'Specialists from Various Departments', value: 'Specialists from Various Departments' },
  { label: 'Linkage Facilitator', value: 'Linkage Facilitator' },
  { label: 'Outsurance', value: 'Outsurance' },
];
