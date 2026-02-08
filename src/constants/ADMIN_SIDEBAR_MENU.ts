interface SidebarItem {
  key: string;
  label: string;
  icon: string; // Lucide icon name
  route?: string;
  children?: SidebarItem[];
}

export const MAIN_MENU_ITEMS: SidebarItem[] = [
  // {
  //   key: 'dashboard',
  //   label: 'admin.dashboard',
  //   icon: 'LayoutDashboard', // Lucide icon name
  //   route: 'admin-dashboard',
  // },
  {
    key: 'user-management',
    label: 'admin.menu.userManagement',
    icon: 'Users', // Lucide icon name
    route: 'user-management',
  },
  {
    key: 'assign-users',
    label: 'admin.menu.assignUsers',
    icon: 'UserCheck', // Lucide icon name - distinct from Users icon
    route: 'assign-users',
  },
  // {
  //   key: 'template-management',
  //   label: 'admin.menu.templateManagement',
  //   icon: 'FileText', // Lucide icon name
  //   route: 'template-management',
  // },
  // {
  //   key: 'audit-log',
  //   label: 'admin.menu.auditLog',
  //   icon: 'Activity', // Lucide icon name for activity log
  //   route: 'audit-log',
  // },
];

export const QUICK_ACTION_MENU_ITEMS: SidebarItem[] = [
  {
    key: 'upload-users',
    label: 'admin.menu.uploadUsers',
    icon: 'Upload', // Lucide icon name
    route: 'UploadUsers',
  },
  // {
  //   key: 'new-lc',
  //   label: 'admin.menu.createUser',
  //   icon: 'UserPlus', // Lucide icon name
  //   route: 'NewLC',
  // },
];

export const MORE_INFORMATION_MENU_ITEMS: SidebarItem[] = [
  {
    key: 'csv-templates',
    label: 'admin.menu.csvImportTemplates',
    icon: 'FileDown', // Lucide icon name
    route: 'csv-templates',
  },
  {
    key: 'password-policy',
    label: 'admin.menu.passwordManagementPolicy',
    icon: 'Lock', // Lucide icon name
    route: 'PasswordPolicy', // Placeholder route
  },
  {
    key: 'profile-permissions',
    label: 'admin.menu.profileFieldEditPermissions',
    icon: 'FilePenLine', // Lucide icon name
    route: 'ProfilePermissions', // Placeholder route
  },
];
