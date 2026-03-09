import React from 'react';
import { HStack, Text, Pressable, Progress, ProgressFilledTrack } from '@ui';
import { ColumnDef } from '@app-types/components';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';
import { LucideIcon, Menu } from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import { theme } from '@config/theme';
import { AdminUserManagementData } from '@app-types/Users';
import { styles as dataTableStyles } from '@components/DataTable/Styles';

type UserTableRow = AdminUserManagementData & {
  user_organizations?: Array<{ roles?: Array<{ role?: { label?: string } }> }>;
  site?: { label?: string } | string;
  province?: { label?: string } | string;
};
import { MenuItemData } from '@components/ui/Menu';
import { styles } from './Styles';
import { useAuth } from '@contexts/AuthContext';
import logger from '@utils/logger';

/**
 * Helper function to extract role label from user object
 * Extracts role label from nested user_organizations structure
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const useRole = (user: Record<string, unknown>): string => {
  const orgs = user?.user_organizations as Array<{ organization?: { roles?: Array<{ role?: { label?: string } }> }; role?: string }> | undefined;
  const roleLabel = orgs?.[0]?.organization?.roles?.[0]?.role?.label ?? (user?.role as string | undefined);
  return roleLabel ?? '-';
};

/**
 * Helper function to extract province from user object
 * Extracts province from API response, returns "-" if not found
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getProvince = (user: Record<string, unknown>): string => {
  return (user?.province as string) || (user?.province_name as string) || (user?.location as { province?: string })?.province || '-';
};

/**
 * Helper function to extract site from user object
 * Extracts site from API response, returns "-" if not found
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getSite = (user: Record<string, unknown>): string => {
  return (user?.site as string) || (user?.site_name as string) || (user?.location as { site?: string })?.site || '-';
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
  const { t } = useLanguage();
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
        {isActive ? t('admin.filters.active') : t('admin.filters.deactivated')}
      </Text>
    </HStack>
  );
};


/**
 * Details Component
 * Shows either assigned count or progress bar
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
const getCustomTrigger = (triggerProps: Record<string, unknown>) => (
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
  isAdmin: boolean
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
    // {
    //   key: 'edit',
    //   label: 'admin.users.actionMenu.edit',
    //   textValue: 'Edit',
    //   iconName: 'Pencil',
    //   iconColor: theme.tokens.colors.textForeground,
    //   iconSizeValue: 20,
    // },
    // {
    //   key: 'reset-password',
    //   label: 'admin.users.actionMenu.resetPassword',
    //   textValue: 'Reset Password',
    //   iconName: 'RotateCcw',
    //   iconColor: theme.tokens.colors.textForeground,
    //   iconSizeValue: 20,
    // },
  ];

  if (isAdmin) {
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
  onResetPassword?: (user: AdminUserManagementData) => void;
  onDeactivate?: (user: AdminUserManagementData) => void;
}> = ({ user, onViewProfile, onResetPassword, onDeactivate }) => {
  const { t } = useLanguage();
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'Admin';

  const handleMenuSelect = (key: string) => {
    switch (key) {
      case 'view-profile':
        onViewProfile?.(user);
        break;
      case 'edit':
        logger.log('Edit user:', user.id);
        // TODO: Open edit modal or navigate to edit page
        break;
      case 'reset-password':
        // Prevent event propagation to avoid triggering other elements
        onResetPassword?.(user);
        break;
      case 'deactivate':
        onDeactivate?.(user);
        break;
      default:
        logger.log('Action:', key, 'for user:', user.id);
    }
  };

  const menuItems = getUserMenuItems(t, isAdmin);

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
    render: (user: UserTableRow) => {
      const roles = user?.user_organizations?.[0]?.roles?.map((r) => r?.role?.label) ?? [];

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
          {roles.filter((label): label is string => Boolean(label)).map((roleLabel, index) => (
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
    render: (user: UserTableRow) => (
      <Text {...TYPOGRAPHY.paragraph} {...styles.provinceText}>
        {typeof user?.province === 'object' && user?.province && 'label' in user.province
          ? (user.province as { label: string }).label
          : typeof user?.province === 'string'
            ? user.province
            : '-'}
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
    render: (user: UserTableRow) => {
      const site = user?.site;
      const label = typeof site === 'object' && site && 'label' in site ? (site as { label: string }).label : typeof site === 'string' ? site : '-';
      return (
        <Text {...TYPOGRAPHY.paragraph} {...styles.districtText}>
          {label}
        </Text>
      );
    },
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
    render: () => (
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

