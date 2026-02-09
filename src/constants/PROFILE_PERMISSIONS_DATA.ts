import { theme } from '@config/theme';

// Type definitions
export type PermissionType = 'edit' | 'view';
export type ApprovalType = 'supervisor' | 'siteDataChange' | null;

export interface ProfileField {
    field: string;
    admin: PermissionType;
    supervisor: PermissionType;
    lc: PermissionType;
    participant: PermissionType;
    approval: ApprovalType;
}

// Profile permissions data - maps to translation keys in en.json
export const PROFILE_PERMISSIONS_FIELDS: ProfileField[] = [
    { field: 'firstName', admin: 'edit', supervisor: 'view', lc: 'view', participant: 'edit', approval: null },
    { field: 'lastName', admin: 'edit', supervisor: 'view', lc: 'view', participant: 'edit', approval: null },
    { field: 'email', admin: 'edit', supervisor: 'view', lc: 'view', participant: 'view', approval: null },
    { field: 'idNumber', admin: 'edit', supervisor: 'view', lc: 'view', participant: 'view', approval: null },
    { field: 'phoneNumber', admin: 'edit', supervisor: 'edit', lc: 'edit', participant: 'edit', approval: null },
    { field: 'role', admin: 'edit', supervisor: 'view', lc: 'view', participant: 'view', approval: null },
    { field: 'province', admin: 'edit', supervisor: 'view', lc: 'view', participant: 'view', approval: null },
    { field: 'district', admin: 'edit', supervisor: 'view', lc: 'view', participant: 'view', approval: null },
    { field: 'siteLocation', admin: 'edit', supervisor: 'view', lc: 'view', participant: 'view', approval: 'supervisor' },
    { field: 'address', admin: 'edit', supervisor: 'edit', lc: 'edit', participant: 'edit', approval: 'siteDataChange' },
    { field: 'assignedSupervisor', admin: 'edit', supervisor: 'edit', lc: 'view', participant: 'view', approval: null },
    { field: 'assignedLC', admin: 'edit', supervisor: 'edit', lc: 'view', participant: 'view', approval: null },
    { field: 'status', admin: 'edit', supervisor: 'view', lc: 'view', participant: 'view', approval: null },
    { field: 'password', admin: 'edit', supervisor: 'edit', lc: 'view', participant: 'edit', approval: null },
];

// Legend items for the permissions table
export const LEGEND_ITEMS = [
    { icon: 'Pencil' as const, color: theme.tokens.colors.success600, labelKey: 'admin.profilePermissionsPage.legend.canEdit' },
    { icon: 'Eye' as const, color: theme.tokens.colors.textSecondary, labelKey: 'admin.profilePermissionsPage.legend.viewOnly' },
];

// Key rules for the permissions table
export const KEY_RULES = [
    'admin.profilePermissionsPage.keyRules.rule1',
    'admin.profilePermissionsPage.keyRules.rule2',
    'admin.profilePermissionsPage.keyRules.rule3',
    'admin.profilePermissionsPage.keyRules.rule4',
];