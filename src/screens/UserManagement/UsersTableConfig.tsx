import React from 'react';
import { HStack, Text, Pressable, Progress, ProgressFilledTrack } from '@ui';
import { ColumnDef } from '@app-types/components';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';
import { LucideIcon, Menu } from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import { theme } from '@config/theme';
import { AdminUserManagementData } from '@app-types/Users';
import { styles as dataTableStyles } from '@components/DataTable/Styles';
import { MenuItemData } from '@components/ui/Menu';
import { styles } from './Styles';
import { useAuth } from '@contexts/AuthContext';

/**
 * Helper function to extract role label from user object
 * Extracts role label from nested user_organizations structure
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const useRole = (user: any): string => {
  return user?.user_organizations?.[0]?.organization?.roles?.[0]?.role?.label ||
    user?.role ||
    '-';
};

/**
 * Helper function to extract province from user object
 * Extracts province from API response, returns "-" if not found
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getProvince = (user: any): string => {
  return user?.province || user?.province_name || user?.location?.province || '-';
};

/**
 * Helper function to extract site from user object
 * Extracts site from API response, returns "-" if not found
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getSite = (user: any): string => {
  return user?.site || user?.site_name || user?.location?.site || '-';
};

/**
 * Role Badge Component
 */
export const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
  const isParticipant = role === 'Participant';

  return (
    <HStack
      bg={styles.roleColors[role as keyof typeof styles.roleColors] || '$textSecondary'}
      {...(isParticipant ? styles.roleBadgeParticipant : styles.roleBadge)}
    >
      <Text
        {...TYPOGRAPHY.bodySmall}
        {...(isParticipant ? styles.roleBadgeParticipantColor : styles.roleBadgeText)}

      >
        {role}
      </Text>
    </HStack>
  );
};

/**
 * Status Badge Component
 */
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const isActive = status?.toLowerCase() === 'active';

  return (
    <HStack
      {...(isActive ? styles.statusBadgeActive : styles.statusBadgeInactive)}
      {...styles.statusBadge}
    >
      <Text
        {...TYPOGRAPHY.bodySmall}
        {...styles.statusBadgeText}
      >
        {status?.toLowerCase() === 'active' ? 'Active' : 'Deactivated'}
      </Text>
    </HStack>
  );
};

/**
 * Details Component
 * Shows either assigned count or progress bar
 */
const DetailsCell: React.FC<{ details: AdminUserManagementData['details'] }> = ({ details }) => {
  if (!details) {
    return null;
  }

  if (details.type === 'assigned') {
    return (
      <Text
        {...TYPOGRAPHY.bodySmall}
        {...styles.districtText}
      >
        {details.value} assigned
      </Text>
    );
  }

  // Progress type
  return (
    <HStack {...styles.detailsProgressContainer}>
      <Progress value={details.value} flex={1} size="sm" bg="$progressBarBackground">
        <ProgressFilledTrack bg="$progressBarFillColor" />
      </Progress>
      <Text
        {...TYPOGRAPHY.bodySmall}
        {...styles.detailsProgressText}
      >
        {details.value}%
      </Text>
    </HStack>
  );
};

/**
 * Custom trigger for actions menu
 */
const getCustomTrigger = (triggerProps: any) => (
  <Pressable {...triggerProps} {...dataTableStyles.customTrigger}>
    <LucideIcon
      name="MoreVertical"
      size={20}
      color={theme.tokens.colors.textForeground}
    />
  </Pressable>
);

/**
 * Get User Menu Items
 */
const getUserMenuItems = (
  _t: (key: string) => string,
  canDeactivate: boolean
): MenuItemData[] => {
  const items: MenuItemData[] = [
    {
      key: 'view-profile',
      label: 'admin.users.actionMenu.viewProfile',
      textValue: 'View Profile',
      iconName: 'Eye',
      iconColor: theme.tokens.colors.textForeground,
      iconSizeValue: 20,
    },
    {
      key: 'edit',
      label: 'admin.users.actionMenu.edit',
      textValue: 'Edit',
      iconName: 'Pencil',
      iconColor: theme.tokens.colors.textForeground,
      iconSizeValue: 20,
    },
    // {
    //   key: 'reset-password',
    //   label: 'admin.users.actionMenu.resetPassword',
    //   textValue: 'Reset Password',
    //   iconName: 'RotateCcw',
    //   iconColor: theme.tokens.colors.textForeground,
    //   iconSizeValue: 20,
    // },
  ];

  if (canDeactivate) {
    items.push({
      key: 'deactivate',
      label: 'admin.users.actionMenu.deactivate',
      textValue: 'Deactivate',
      iconName: 'UserX',
      iconColor: theme.tokens.colors.error600,
      iconSizeValue: 20,
      color: theme.tokens.colors.error600,
    });
  }

  return items;
};

/**
 * Actions Column Component
 */
const ActionsColumn: React.FC<{
  user: AdminUserManagementData;
  onViewProfile?: (user: AdminUserManagementData) => void;
  onEdit?: (user: AdminUserManagementData) => void;
  onResetPassword?: (user: AdminUserManagementData) => void;
  onDeactivate?: (user: AdminUserManagementData) => void;
}> = ({ user, onViewProfile, onEdit, onResetPassword, onDeactivate }) => {
  const { t } = useLanguage();
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'Admin';

  // Check if the target user has Admin role
  const isTargetUserAdmin = (() => {
    // Check role labels from user_organizations
    const roleLabels = (user as any)?.user_organizations?.[0]?.roles?.map(
      (role: any) => role?.role?.label?.toLowerCase()
    ) || [];
    
    // Check if any role label is "admin" or "brac admin"
    const hasAdminLabel = roleLabels.some(
      (label: string) => 
        label === 'admin' || 
        label === 'brac admin' || 
        label?.includes('admin')
    );
    
    // Also check role.title for 'admin'
    const roleTitles = (user as any)?.user_organizations?.[0]?.roles?.map(
      (role: any) => role?.role?.title?.toLowerCase()
    ) || [];
    
    const hasAdminTitle = roleTitles.some(
      (title: string) => title === 'admin'
    );
    
    // Check direct role property as fallback
    const directRole = (user as any)?.role?.toLowerCase();
    const hasDirectAdminRole = directRole === 'admin' || directRole === 'brac admin' || directRole?.includes('admin');
    
    return hasAdminLabel || hasAdminTitle || hasDirectAdminRole;
  })();

  const handleMenuSelect = (key: string) => {
    switch (key) {
      case 'view-profile':
        onViewProfile?.(user);
        break;
      case 'edit':
        onEdit?.(user);
        break;
      case 'reset-password':
        // Prevent event propagation to avoid triggering other elements
        onResetPassword?.(user);
        break;
      case 'deactivate':
        onDeactivate?.(user);
        break;
      default:
        console.log('Action:', key, 'for user:', user.id);
    }
  };

  // Only show Deactivate if current user is Admin AND target user is NOT Admin
  const canDeactivate = isAdmin && !isTargetUserAdmin;
  const menuItems = getUserMenuItems(t, canDeactivate);

  return (
    <Menu
      items={menuItems}
      placement="bottom right"
      offset={5}
      trigger={getCustomTrigger}
      onSelect={handleMenuSelect}
    />
  );
};

/**
 * All possible columns for Users Table
 */
export const getUsersColumns = (handlers?: {
  onViewProfile?: (user: AdminUserManagementData) => void;
  onEdit?: (user: AdminUserManagementData) => void;
  onResetPassword?: (user: AdminUserManagementData) => void;
  onDeactivate?: (user: AdminUserManagementData) => void;
}): ColumnDef<AdminUserManagementData>[] => [
  {
    key: 'id',
    label: 'admin.users.id',
    flex: 1.5,
    render: (user) => (
      <Text {...TYPOGRAPHY.paragraph} {...styles.nameText}>
        {user.id}
      </Text>
    ),
    mobileConfig: {
      leftRank: 1,
      showLabel: false,
    },
  },
  {
    key: 'name',
    label: 'admin.users.name',
    flex: 1.5,
    render: (user) => (
      <Text {...TYPOGRAPHY.paragraph} {...styles.nameText}>
        {user.name}
      </Text>
    ),
    mobileConfig: {
      rightRank: 1,
      showLabel: false,
    },
  },
  {
    key: 'email',
    label: 'admin.users.email',
    flex: 2.5,
    render: (user) => (
      <Text {...TYPOGRAPHY.paragraph} {...styles.emailText}>
        {user.email}
      </Text>
    ),
    mobileConfig: {
      fullWidthRank: 1,
      showLabel: false,
    },
  },
  {
    key: 'role',
    label: 'admin.users.role',
    flex: 1.2,
    render: (user: any) => {
      // Extract all roles from user_organizations
      const roles = user?.user_organizations?.[0]?.roles?.map((role: any) => role.role.label) || [];

      // If no roles found, show "-"
      if (roles.length === 0) {
        return (
          <Text {...TYPOGRAPHY.paragraph}>
            -
          </Text>
        );
      }

      // Render separate badges for each role
      return (
        <HStack space="xs" flexWrap="wrap">
          {roles.map((roleLabel: string, index: number) => (
            <RoleBadge key={`${roleLabel}-${index}`} role={roleLabel} />
          ))}
        </HStack>
      );
    },
    mobileConfig: {
      rightRank: 1,
      showLabel: false,
    },
  },
  {
    key: 'status',
    label: 'admin.users.status',
    flex: 1.2,
    render: (user) => <StatusBadge status={user.status} />,
    mobileConfig: {
      rightRank: 2,
      showLabel: false,
    },
  },
  {
    key: 'province',
    label: 'admin.users.province',
    flex: 1.2,
    render: (user: any) => (
      <Text {...TYPOGRAPHY.paragraph} {...styles.provinceText}>
        {user?.province?.label || '-'}
      </Text>
    ),
    mobileConfig: {
      leftRank: 3,
      showLabel: false,
    },
  },
  {
    key: 'site',
    label: 'admin.users.site',
    flex: 1.2,
    render: (user: any) => (
      <Text {...TYPOGRAPHY.paragraph} {...styles.districtText}>
        {user?.site?.label || user?.site || '-'}
      </Text>
    ),
    mobileConfig: {
      rightRank: 3,
      showLabel: false,
    },
  },
  // {
  //   key: 'lastLogin',
  //   label: 'admin.users.lastLogin',
  //   flex: 1.2,
  //   render: (user) => (
  //     <Text {...TYPOGRAPHY.paragraph} {...styles.lastLoginText}>
  //       -
  //     </Text>
  //   ),
  //   mobileConfig: {
  //     leftRank: 5,
  //     showLabel: false,
  //   },
  // },
  {
    key: 'details',
    label: 'admin.users.details',
    flex: 1.5,
    render: (user: any) =>
      user?.details ? (
        <DetailsCell details={user.details} />
      ) : (
        <Text {...TYPOGRAPHY.paragraph} {...styles.lastLoginText}>
          -
        </Text>
      ),
    mobileConfig: {
      leftRank: 4,
      showLabel: false,
    },
  },
  {
    key: 'actions',
    label: 'admin.users.actions',
    flex: 0.8,
    render: (user) => (
      <ActionsColumn 
        user={user} 
        onViewProfile={handlers?.onViewProfile}
        onEdit={handlers?.onEdit}
        onResetPassword={handlers?.onResetPassword}
        onDeactivate={handlers?.onDeactivate}
      />
    ),
    mobileConfig: {
      fullWidthRank: 2,
      showLabel: false,
    },
  },
];

