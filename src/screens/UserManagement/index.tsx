import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { VStack, HStack, Button, Text, Box, Pressable, Card, Modal, useAlert, ButtonIcon, ButtonText, Badge, BadgeText, Divider, Input, InputField } from '@ui';
import { Platform } from 'react-native';
import { LucideIcon } from '@ui/index';
import { useLanguage } from '@contexts/LanguageContext';
import { useUserManagementFilters, mapStatusLabelToAPI, PAGE_SIZE_OPTIONS } from '@constants/USER_MANAGEMENT';
import { COUNTRY_CODES } from '@constants/COUNTRY_CODES';
import FilterButton from '@components/Filter';
import TitleHeader from '@components/TitleHeader';
// import { titleHeaderStyles } from '@components/TitleHeader/Styles';
import DataTable from '@components/DataTable';
import { getUsersColumns, RoleBadge } from './UsersTableConfig';
import Select from '@components/ui/Inputs/Select';
import { AdminUserManagementData } from '@app-types/Users';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';
import { usePlatform } from '@utils/platform';
import { styles } from './Styles';
import { CreateUserForm } from './CreateUserForm';
import { validateSchema } from '@components/SchemaFormRenderer';
import { CREATE_USER_FORM_SCHEMA } from '@constants/CREATE_USER_FORM_SCHEMA';
import { deactivateUser, getUsersList, resetPassword, updateOrgAdminUser, createUser, getSitesByProvince } from '../../services/usersService';
import { getParticipants } from '../../services/assignUsersService';
import type {
  // UserSearchParams,
  Role
} from '@app-types/Users';
import { getSignedUrl, uploadFileToSignedUrl, bulkUserCreate } from '../../services/bulkUploadService';
import { theme } from '@config/theme';
import { getUserProfile } from '../../services/authenticationService';
import { TabButton } from '@components/Tabs';
import { STORAGE_KEYS } from '@constants/STORAGE_KEYS';

// Custom wrapper to prevent cursor jumping during fast typing on heavy screens
export const FastInputField = ({ value, defaultValue, onChangeText, ...props }: any) => {
  const initialValue = value !== undefined ? value : (defaultValue || '');
  const [localValue, setLocalValue] = useState(initialValue);
  const isTyping = useRef(false);
  const timeoutRef = useRef<any>(null);

  useEffect(() => {
    if (!isTyping.current && value !== undefined && localValue !== value) {
      setLocalValue(value);
    }
  }, [value]);

  const handleChange = (text: string) => {
    setLocalValue(text);
    isTyping.current = true;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      isTyping.current = false;
    }, 500);

    if (onChangeText) onChangeText(text);
  };

  return <InputField {...props} value={localValue} onChangeText={handleChange} />;
};
import offlineStorage from '../../services/offlineStorage';
import logger from '@utils/logger';

const programParticipantRowKey = (p: any): string => {
  const raw = p?.userId ?? p?.userDetails?.id ?? p?.id ?? p?._id;
  return raw != null && raw !== '' ? String(raw) : '';
};

const getPrimaryRoleTitle = (u: any): string | undefined => {
  const t = u?.user_organizations?.[0]?.roles?.[0]?.role?.title;
  return typeof t === 'string' ? t.toLowerCase() : undefined;
};

/**
 * Details column: supervisors/LCs show assigned user count; participants with IDP show completion %.
 */
const buildDetailsForUserAndProgramRow = (
  userRow: any,
  programRow: any
): any | null => {
  if (!programRow) {
    return null;
  }
  const roleTitle = getPrimaryRoleTitle(userRow);

  if (roleTitle === 'tenant_admin' || roleTitle === 'org_admin') {
    const count = programRow?.overview?.assigned ?? 0;
    return count !== undefined ? { type: 'assigned', value: count } : null;
  }

  if (roleTitle === 'user') {
    if (programRow?.status === 'IN_PROGRESS') {
      const pct = programRow?.metaInformation?.idpProgress?.completionPercentage || 0;
      if (typeof pct === 'number' && !Number.isNaN(pct)) {
        return { type: 'progress', value: Math.round(Math.min(100, Math.max(0, pct))) };
      }
    }
    return { type: 'progress', value: 0 };
  }

  return null;
};

const programParticipantsArrayToMap = (rows: any[]): Record<string, any> => {
  const map: Record<string, any> = {};
  for (const row of rows) {
    const k = programParticipantRowKey(row);
    if (k) {
      map[k] = row;
    }
  }
  return map;
};

const mergeUsersWithProgramParticipantMap = (
  usersData: any[],
  byUserId: Record<string, any>
): any[] =>
  usersData.map((u) => {
    const extra = byUserId[String(u.id)];
    if (!extra) {
      return { ...u, extra };
    }

    const details = buildDetailsForUserAndProgramRow(u, extra);
    return {
      ...u,
      ...(details ? { details } : {}),
      extra
    };
  });

/**
 * ProfileModalHeader - Header component for the profile modal
 */
interface ProfileModalHeaderProps {
  selectedUserBase: AdminUserManagementData | null;
  selectedUserProfile: any | null;
  isMobile: boolean;
  t: (key: string) => string;
}

const ProfileModalHeader: React.FC<ProfileModalHeaderProps> = ({
  selectedUserBase,
  selectedUserProfile,
  isMobile,
  t,
}) => {
  const roles =
    (selectedUserBase as any)?.user_organizations?.[0]?.roles
      ?.map((r: any) => r?.role?.label)
      .filter(Boolean) || [];

  // Ensure we never render an object as text (prevents React error #31)
  const profileRole =
    typeof (selectedUserProfile as any)?.role === 'string'
      ? (selectedUserProfile as any)?.role
      : (selectedUserProfile as any)?.role?.label;

  const roleLabel =
    roles[0] ||
    profileRole ||
    selectedUserBase?.role ||
    t('admin.users.profileModal.defaultRole');

  const badges = (
    <HStack space="sm" alignItems="center" justifyContent="flex-end" flexShrink={0}>
      <RoleBadge role={roleLabel} />
      <Badge
        bg={(String(selectedUserBase?.status || selectedUserProfile?.status || '').toLowerCase() === 'active')
          ? '$success600'
          : '$textMutedForeground'}
        borderRadius="$md"
        px="$2"
        py="$0.5"
      >
        <BadgeText color="$white" fontSize="$xs" textTransform="none">
          {(String(selectedUserBase?.status || selectedUserProfile?.status || '').toLowerCase() === 'active')
            ? t('admin.filters.active')
            : t('admin.filters.deactivated')}
        </BadgeText>
      </Badge>
    </HStack>
  );

  // Mobile: stack name/email above badges
  if (isMobile) {
    return (
      <VStack space="sm" flex={1} flexShrink={1}>
        <VStack space="xs">
          <Text {...TYPOGRAPHY.h1} color="$textForeground">
            {selectedUserProfile?.name || selectedUserBase?.name || '-'}
          </Text>
          <HStack space="xs" alignItems="center">
            <LucideIcon name="Mail" size={14} color="$textMutedForeground" />
            <Text {...TYPOGRAPHY.bodySmall} color="$textMutedForeground">
              {selectedUserProfile?.email || selectedUserBase?.email || '-'}
            </Text>
          </HStack>
        </VStack>
        {badges}
      </VStack>
    );
  }

  // Desktop: left/right layout
  return (
    <HStack alignItems="center" justifyContent="space-between" flex={1} flexShrink={1} pr="$8" gap="$2">
      <VStack space="xs" flex={1} flexShrink={1}>
        <Text {...TYPOGRAPHY.h1} color="$textForeground" numberOfLines={1}>
          {selectedUserProfile?.name || selectedUserBase?.name || '-'}
        </Text>
        <HStack space="xs" alignItems="center">
          <LucideIcon name="Mail" size={14} color="$textMutedForeground" />
          <Text {...TYPOGRAPHY.bodySmall} color="$textMutedForeground" numberOfLines={1}>
            {selectedUserProfile?.email || selectedUserBase?.email || '-'}
          </Text>
        </HStack>
      </VStack>
      {badges}
    </HStack>
  );
};

/**
 * UserManagementScreen - Layout is automatically applied by navigation based on user role
 */
const UserManagementScreen = () => {
  const { t } = useLanguage();
  const { isMobile } = usePlatform();
  const { showAlert } = useAlert();

  // API state management
  const [filters, setFilters] = useState<Record<string, any>>({});

  // Use custom hook for filter management - handles all API calls for roles, provinces
  const { filters: filterOptions, roles, provinces, genders, organisations, positions, isFiltersLoading } = useUserManagementFilters(filters);

  // const [displayUsers, setDisplayUsers] = useState<AdminUserManagementData[]>([]);
  const [users, setUsers] = useState<AdminUserManagementData[]>([]);
  /** Program-user search rows keyed by user id; applied async after the main user list loads. */
  const [programParticipantByUserId, setProgramParticipantByUserId] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | null>(null);
  const [refetchKey, setRefetchKey] = useState(0);

  // File upload state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // View Profile modal state
  type ProfileTab = 'DETAILS' | 'ACTIVITY' | 'PERMISSIONS';
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileTab, setProfileTab] = useState<ProfileTab>('DETAILS');
  const [editTab, setEditTab] = useState<ProfileTab>('DETAILS');
  const [profileLoading, setProfileLoading] = useState(false);
  const [selectedUserBase, setSelectedUserBase] = useState<AdminUserManagementData | null>(null);
  const [selectedUserProfile, setSelectedUserProfile] = useState<any | null>(null);
  const [editable, setEditable] = useState(false);
  // Reset Password modal state
  const [resetPasswordState, setResetPasswordState] = useState({
    user: null as AdminUserManagementData | null,
    password: '',
    showPassword: false,
    isSubmitting: false,
    error: '',
  });

  // Deactivate confirmation modal state
  const [deactivateState, setDeactivateState] = useState({
    user: null as AdminUserManagementData | null,
    isSubmitting: false,
  });

  // Edit User modal state (only editable fields should live here)
  const [editUserState, setEditUserState] = useState({
    user: null as AdminUserManagementData | null,
    userProfile: null as any | null,
    name: '',
    isSubmitting: false,
    isLoading: false,
  });

  // Create User modal state (Array of JSON)
  const initialCreateUserFields = useMemo(() => [
    { id: 'name', value: '', error: '' },
    { id: 'email', value: '', error: '' },
    { id: 'address', value: '', error: '' },
    { id: 'countryCode', value: '+27', error: '' },
    { id: 'phoneNumber', value: '', error: '' },
    { id: 'alternativePhoneCode', value: '+27', error: '' },
    { id: 'alternativePhone', value: '', error: '' },
    { id: 'nationalId', value: '', error: '' },
    { id: 'gender', value: '', error: '' },
    { id: 'dob', value: '', error: '' },
    { id: 'username', value: '', error: '' },
    { id: 'password', value: '', error: '' },
    { id: 'confirmPassword', value: '', error: '' },
    { id: 'roleId', value: '', error: '' },
    { id: 'provinceId', value: '', error: '' },
    { id: 'siteId', value: '', error: '' },
    { id: 'organisationId', value: '', error: '' },
    { id: 'positionId', value: '', error: '' },
    { id: 'employeeId', value: '', error: '' },
  ], []);

  const [createUserFields, setCreateUserFields] = useState(initialCreateUserFields);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [isCreateUserSubmitting, setIsCreateUserSubmitting] = useState(false);
  const [formSites, setFormSites] = useState<any[]>([]);

  const getCreateField = useCallback((id: string) => createUserFields.find(f => f.id === id)?.value || '', [createUserFields]);
  const getCreateError = useCallback((id: string) => createUserFields.find(f => f.id === id)?.error || '', [createUserFields]);

  // Derived maps consumed by SchemaFormRenderer
  const createUserValues = useMemo<Record<string, string>>(
    () => Object.fromEntries(createUserFields.map(f => [f.id, f.value])),
    [createUserFields]
  );
  const createUserErrors = useMemo<Record<string, string>>(
    () => Object.fromEntries(createUserFields.map(f => [f.id, f.error]).filter(([, v]) => !!v)),
    [createUserFields]
  );

  // Compute role-based visibility flags
  const createUserFlags = useMemo(() => {
    const roleId = getCreateField('roleId');
    const selRole = roles.find((r: any) => r.id.toString() === roleId);
    const roleTitle = (selRole?.title?.toLowerCase() || '');
    const roleLabel = (selRole?.label?.toLowerCase() || '');
    const isSupervisorOrLC = ['supervisor', 'org_admin', 'lc', 'linkage champion'].some(
      (k: string) => roleTitle.includes(k) || roleLabel.includes(k)
    );
    return { isSupervisorOrLC };
  }, [getCreateField, roles]);

  // Build normalized options map for SchemaFormRenderer
  const createUserOptionsMap = useMemo(() => ({
    roles: roles
      .filter((r: any) => !['admin', 'brac admin'].includes((r.label || r.title)?.toLowerCase() ?? ''))
      .map((r: any) => ({ value: r.id.toString(), label: r.label || r.title || '' })),
    genders: genders.map((g: any) => ({ value: g._id, label: g.name })),
    provinces: provinces.map((p: any) => ({ value: p._id, label: p.name })),
    sites: formSites.map((s: any) => ({ value: s._id, label: s.name })),
    organisations: organisations.map((o: any) => ({ value: o._id, label: o.name })),
    positions: positions.map((p: any) => ({ value: p._id, label: p.name })),
    countryCodes: COUNTRY_CODES.map((c: any) => ({ value: c.value ?? c.dial_code ?? c, label: c.label ?? c.name ?? c })),
  }), [roles, genders, provinces, formSites, organisations, positions]);

  const selectedFormProvince = getCreateField('provinceId');
  useEffect(() => {
    const fetchFormSites = async () => {
      if (!selectedFormProvince) {
        setFormSites([]);
        return;
      }
      try {
        const sitesResponse = await getSitesByProvince({
          provinceId: selectedFormProvince,
          page: 1,
          limit: 100,
        });
        setFormSites(sitesResponse.result?.data || []);
      } catch (error) {
        setFormSites([]);
      }
    };
    fetchFormSites();
  }, [selectedFormProvince]);

  const handleCreateFieldChange = useCallback((id: string, text: string) => {
    setCreateUserFields(prev => {
      // Get current email value from prev state (before this update)
      const currentEmail = prev.find(f => f.id === 'email')?.value || '';
      const currentUsername = prev.find(f => f.id === 'username')?.value || '';
      // Auto-sync username with email only if user hasn't manually customised it
      // (i.e., username still matches the old email value or is empty)
      const shouldSyncUsername =
        id === 'email' && (currentUsername === '' || currentUsername === currentEmail);

      return prev.map(f => {
        if (f.id === id) return { ...f, value: text, error: '' };
        if (shouldSyncUsername && f.id === 'username') return { ...f, value: text, error: '' };
        if (id === 'provinceId' && f.id === 'siteId') return { ...f, value: '', error: '' };
        return f;
      });
    });
  }, []);

  const openCreateUserModal = useCallback(() => {
    setCreateUserFields(initialCreateUserFields);
    setIsCreateUserSubmitting(false);
    setIsCreateUserModalOpen(true);
  }, [initialCreateUserFields]);

  const closeCreateUserModal = useCallback(() => {
    setIsCreateUserModalOpen(false);
  }, []);

  const validateCreateUserForm = useCallback(() => {
    const errors = validateSchema(CREATE_USER_FORM_SCHEMA, createUserValues, createUserFlags);
    setCreateUserFields(prev => prev.map(f => ({ ...f, error: errors[f.id] || '' })));
    return Object.keys(errors).length === 0;
  }, [createUserValues, createUserFlags]);

  const closeDeactivateModal = useCallback(() => {
    setDeactivateState({ user: null, isSubmitting: false });
  }, []);

  const openDeactivateModal = useCallback((user: AdminUserManagementData) => {
    setDeactivateState({ user, isSubmitting: false });
  }, []);

  const handleConfirmDeactivate = useCallback(async () => {
    if (!deactivateState.user) return;
    setDeactivateState(prev => ({ ...prev, isSubmitting: true }));
    try {
      const n = Number(deactivateState.user.id);
      const idVal = Number.isFinite(n) ? n : deactivateState.user.id;
      await deactivateUser([idVal]);
      showAlert('success', t('admin.users.deactivate.success') || 'User deactivated successfully.');
      closeDeactivateModal();
      setRefetchKey(k => k + 1);
    } catch (error: any) {
      showAlert('error', error?.message || t('common.somethingWentWrong'));
      setDeactivateState(prev => ({ ...prev, isSubmitting: false }));
    }
  }, [closeDeactivateModal, deactivateState.user, showAlert, t]);

  const openEditUserModal = useCallback(async (user: AdminUserManagementData) => {
    setEditTab('DETAILS');
    setEditUserState({
      user,
      userProfile: null,
      name: user.name || '',
      isSubmitting: false,
      isLoading: true,
    });
    try {
      const profile = await getUserProfile(user.id);
      setEditUserState(prev => ({
        ...prev,
        userProfile: profile,
        isLoading: false,
      }));
    } catch (error: any) {
      showAlert('error', error?.message || t('common.somethingWentWrong'));
      setEditUserState(prev => ({ ...prev, isLoading: false }));
    }
  }, [showAlert, t]);

  const closeEditUserModal = useCallback(() => {
    setEditTab('DETAILS');
    setEditUserState({
      user: null,
      userProfile: null,
      name: '',
      isSubmitting: false,
      isLoading: false,
    });
  }, []);

  const handleSaveEditUser = useCallback(async () => {
    if (!editUserState.user) return;

    // Validate required fields
    if (!editUserState.name?.trim()) {
      showAlert('error', t('admin.users.edit.nameRequired') || 'Enter a name.');
      return;
    }

    setEditUserState(prev => ({ ...prev, isSubmitting: true }));
    try {
      await updateOrgAdminUser(editUserState.user.id, { name: editUserState.name.trim() });
      showAlert('success', t('admin.users.edit.success') || 'User updated successfully.');
      closeEditUserModal();
      setRefetchKey(k => k + 1);
    } catch (error: any) {
      showAlert('error', error?.message || t('common.somethingWentWrong'));
      setEditUserState(prev => ({ ...prev, isSubmitting: false }));
    }
  }, [closeEditUserModal, editUserState.user, editUserState.name]);

  const closeProfileModal = useCallback(() => {
    setIsProfileModalOpen(false);
    setProfileTab('DETAILS');
    setSelectedUserBase(null);
    setSelectedUserProfile(null);
    setProfileLoading(false);
  }, []);

  const openProfileModal = useCallback(async (user: AdminUserManagementData) => {
    setSelectedUserBase(user);
    setSelectedUserProfile(null);
    setProfileTab('DETAILS');
    setIsProfileModalOpen(true);
    setProfileLoading(true);
    try {
      const profile = await getUserProfile(user.id);
      setSelectedUserProfile(profile);
    } catch (error: any) {
      showAlert('error', error?.message || t('common.somethingWentWrong'));
    } finally {
      setProfileLoading(false);
    }
  }, [showAlert, t]);

  const openResetPasswordModal = useCallback((user: AdminUserManagementData) => {
    setResetPasswordState({
      user,
      password: '',
      showPassword: false,
      isSubmitting: false,
      error: '',
    });
    setEditable(false);
  }, []);

  const closeResetPasswordModal = useCallback(() => {
    setResetPasswordState({
      user: null,
      password: '',
      showPassword: false,
      isSubmitting: false,
      error: '',
    });
    setEditable(false);
  }, []);

  const handleResetPasswordSubmit = useCallback(async () => {
    // Validate password
    if (!resetPasswordState.password?.trim()) {
      setResetPasswordState(prev => ({
        ...prev,
        error: t('admin.users.resetPassword.passwordRequired') || 'Password is required',
      }));
      return;
    }

    if (!resetPasswordState.user) return;

    setResetPasswordState(prev => ({ ...prev, isSubmitting: true }));

    try {
      await resetPassword({
        username: resetPasswordState.user.name,
        email: resetPasswordState.user.email,
        password: resetPasswordState.password,
        userId: resetPasswordState.user?.id,
      });

      showAlert(
        'success',
        t('admin.users.resetPassword.success') || 'Password reset successfully',
        { placement: 'bottom' }
      );

      closeResetPasswordModal();
    } catch (error: any) {
      showAlert(
        'error',
        error?.message || t('admin.users.resetPassword.error') || 'Failed to reset password',
        { placement: 'bottom' }
      );
      setResetPasswordState(prev => ({ ...prev, isSubmitting: false }));
    }
  }, [resetPasswordState.password, resetPasswordState.user, t, showAlert, closeResetPasswordModal]);

  const columns = useMemo(
    () => getUsersColumns({
      onViewProfile: openProfileModal,
      onEdit: openEditUserModal,
      onResetPassword: openResetPasswordModal,
      onDeactivate: openDeactivateModal,
    }),
    [openProfileModal, openEditUserModal, openResetPasswordModal, openDeactivateModal]
  );

  const displayUsers = useMemo(() => mergeUsersWithProgramParticipantMap(users as any[], programParticipantByUserId),
    [users, programParticipantByUserId]
  );

  // Ref to track previous roles length to detect when roles are first loaded
  const prevRolesLengthRef = useRef(0);
  /** Bumps on each user-list fetch so late program-user responses do not apply to a stale page. */

  // Load pageSize from offline storage on mount
  useEffect(() => {
    const loadPageSize = async () => {
      try {
        const storedPageSize = await offlineStorage.read<number>(STORAGE_KEYS.USER_MANAGEMENT_PAGE_SIZE);
        if (storedPageSize && PAGE_SIZE_OPTIONS.includes(storedPageSize)) {
          setPageSize(storedPageSize);
        } else {
          setPageSize(PAGE_SIZE_OPTIONS[1]);
        }
      } catch (error) {
        logger.error('Error loading page size from storage:', error);
        setPageSize(PAGE_SIZE_OPTIONS[1]);
      }
    };
    loadPageSize();
  }, []);

  const handleCreateUserSubmit = useCallback(async () => {
    if (!validateCreateUserForm()) return;

    setIsCreateUserSubmitting(true);

    try {
      const roleId = getCreateField('roleId');
      // Find role title
      const selectedRole = roles.find(r => r.id.toString() === roleId);
      const roleTitle = selectedRole?.title || roleId;
      const roleLabel = selectedRole?.label || '';

      const requiresExtraFields = ['admin', 'supervisor', 'linkage champion', 'participant', 'org_admin', 'tenant_admin', 'lc', 'user'].some(k => roleTitle.toLowerCase().includes(k) || roleLabel.toLowerCase().includes(k));

      const payload: any = {
        name: getCreateField('name').trim(),
        username: getCreateField('username'),
        email: getCreateField('email'),
        roles: roleTitle, // Send the mapped string title (e.g. 'tenant_admin') instead of numeric ID
        password: getCreateField('password'),
      };

      // Only include optional fields when they have a value
      // API requires dob WITHOUT special characters (no / or -), so strip separators → YYYYMMDD
      const dob = getCreateField('dob');
      if (dob) {
        payload.dob = dob.replace(/[\/\-]/g, ''); // "2000/09/08" → "20000908"
      }
      const gender = getCreateField('gender');
      if (gender) payload.gender = gender;

      const site = getCreateField('siteId');
      if (site) payload.site = site;

      const province = getCreateField('provinceId');
      if (province) payload.province = province;

      const phone = getCreateField('phoneNumber');
      if (phone) payload.phone = phone;

      const phoneCode = getCreateField('countryCode').replace('+', '');
      if (phone && phoneCode) payload.phone_code = phoneCode;

      const altPhone = getCreateField('alternativePhone');
      if (altPhone) payload.alternative_phone = altPhone;

      const altPhoneCode = getCreateField('alternativePhoneCode').replace('+', '');
      if (altPhone && altPhoneCode) payload.alternative_phone_code = altPhoneCode;

      const address = getCreateField('address');
      if (address) payload.address = address;

      const nationalIdVal = getCreateField('nationalId');
      if (nationalIdVal) {
        payload.national_id = Number(nationalIdVal);
      }

      // Organisation, Position, Employee ID — only for Supervisor/LC
      const isSupervisorOrLCPayload = ['supervisor', 'org_admin', 'lc', 'linkage champion'].some(k => roleTitle.toLowerCase().includes(k) || roleLabel.toLowerCase().includes(k));
      if (isSupervisorOrLCPayload) {
        const organisationId = getCreateField('organisationId');
        if (organisationId) payload.organisation = organisationId;
        const positionId = getCreateField('positionId');
        if (positionId) payload.position = positionId;
        const employeeId = getCreateField('employeeId');
        if (employeeId) payload.employee_id = employeeId;
      }

      await createUser(payload);

      // Show alert BEFORE closing modal so it is visible to the user
      showAlert('success', t('admin.users.createUser.success') || 'User created successfully.', { placement: 'bottom' });
      setIsCreateUserSubmitting(false);
      closeCreateUserModal();
      setRefetchKey(k => k + 1);
    } catch (error: any) {
      const errMsg =
        (error as any)?.data?.message ||
        (error as any)?.message ||
        t('admin.users.createUser.error') ||
        'Failed to create user.';
      showAlert('error', errMsg, { placement: 'bottom' });
      setIsCreateUserSubmitting(false);
    }
  }, [roles, validateCreateUserForm, showAlert, t, closeCreateUserModal, getCreateField, createUserValues, createUserFlags]);

  // Fetch users from API when filters change or when roles are first loaded
  useEffect(() => {
    // Check if roles just loaded (length changed from 0 to > 0)
    const rolesJustLoaded = prevRolesLengthRef.current === 0 && roles.length > 0;
    prevRolesLengthRef.current = roles.length;

    // Don't fetch if filters are still loading
    if (isFiltersLoading) {
      return;
    }

    // Don't fetch if roles haven't loaded yet (needed for type parameter)
    // Unless a specific role filter is set or roles just loaded
    if (roles.length === 0 && !filters.role && !rolesJustLoaded) {
      return;
    }

    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        // Determine type parameter based on role filter
        // When "All Roles" is selected, use all role titles from API
        let apiType: string;
        if (filters.role && filters.role !== 'all-roles') {
          // Filter value is already the role title (not label), so use it directly
          apiType = filters.role;
        } else {
          // Build type parameter from all active roles fetched from API
          // Extract unique role titles from roles array
          const allRoleTitles = roles
            .map((role: Role) => role.title)
            .filter((title: string | undefined): title is string => !!title)
            .filter((title: string, index: number, self: string[]) => self.indexOf(title) === index); // Remove duplicates

          // Use all role titles from API, or 'all' if no roles available
          apiType = allRoleTitles.length > 0 ? allRoleTitles.join(',') : 'all';
        }

        const apiParams: any = {
          tenant_code: 'brac',
          type: apiType,
          page: currentPage,
          limit: pageSize,
        };

        // Add search parameter if present
        if (filters.search) {
          apiParams.search = filters.search;
        }

        // Add status parameter if present - map to API format (Active -> ACTIVE, Deactivated -> INACTIVE)
        if (filters.status && filters.status !== 'all-status') {
          apiParams.status = mapStatusLabelToAPI(filters.status);
        }

        // Add role parameter if present
        if (filters.role && filters.role !== 'all-roles') {
          apiParams.role = filters.role;
        }

        // Add province parameter if present
        if (filters.province && filters.province !== 'all-provinces') {
          apiParams.province = filters.province;
        }

        // Add site parameter if present
        if (filters.site && filters.site !== 'all-sites') {
          apiParams.site = filters.site;
        }

        const response = await getUsersList(apiParams);


        // Get raw API data
        const usersData = response.result?.data || [];

        // Get total count from API response (if available), otherwise use data length
        const apiTotalCount = response.result?.count ?? usersData.length;

        setProgramParticipantByUserId({});
        //setDisplayUsers(usersData);
        setUsers(usersData);
        setTotalCount(apiTotalCount);

        // @ts-ignore - process.env from DefinePlugin
        const programId = process.env.GLOBAL_LC_PROGRAM_ID;
        const userIds = usersData.map((u: any) => u.id).filter((id: any) => id != null && id !== '');

        if (programId && userIds.length > 0 && pageSize) {
          void (async () => {
            try {
              const participantsResponse = await getParticipants(programId, {
                excludeMapped: false,
                userIds,
              });

              const other = participantsResponse.result?.data || [];
              setProgramParticipantByUserId(programParticipantsArrayToMap(other));
            } catch (e) {
              logger.error('UserManagement: getParticipants enrichment failed', e);
            }
          })();
        }
      } catch (error) {
        //setDisplayUsers([]);
        setUsers([]);
        setTotalCount(0);
        setProgramParticipantByUserId({});

      } finally {
        setIsLoading(false);
      }
    };

    if (pageSize) {
      fetchUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, roles.length, currentPage, pageSize, refetchKey]); // Depend on filters, roles, currentPage, and pageSize

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: Record<string, any>) => {
    setFilters((prev) => {
      const prevProvince = prev?.province;
      const nextProvince = newFilters?.province;

      // Province -> Site is a dependent relationship.
      // If province changes (or is cleared), the previously selected site may become invalid
      // and would incorrectly keep returning "no users found".
      const provinceChanged = prevProvince !== nextProvince;
      const provinceCleared = !nextProvince || nextProvince === 'all-provinces';

      if (provinceChanged || provinceCleared) {
        const next = { ...newFilters };
        delete next.site;
        return next;
      }

      return newFilters;
    });
    setCurrentPage(1); // Reset to first page when filters change
  }, []);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Handle page size change
  const handlePageSizeChange = useCallback(async (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when page size changes
    // Save to offline storage
    try {
      await offlineStorage.create(STORAGE_KEYS.USER_MANAGEMENT_PAGE_SIZE, size);
    } catch (error) {
      logger.error('Error saving page size to storage:', error);
    }
  }, []);

  // Handle CSV upload: closes options modal and triggers native file picker
  const handleUploadCSV = () => {
    setIsUploadModalOpen(false);
    // Trigger file input click
    if (Platform.OS === 'web' && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Process selected CSV file: validates file type and handles upload
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate CSV file extension
    if (!file.name.toLowerCase().endsWith('.csv')) {
      showAlert('error', t('admin.actions.csvValidationError'));
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setIsUploading(true);

    try {
      // Step 1: Get signed URL
      const signedUrlResponse = await getSignedUrl(file.name);
      if (!signedUrlResponse.result?.signedUrl) {
        throw new Error(t('admin.actions.uploadErrorSignedUrl'));
      }

      // Step 2: Upload file to signed URL
      await uploadFileToSignedUrl(signedUrlResponse.result.signedUrl, file);

      // Step 3: Trigger bulk user creation
      const filePath = signedUrlResponse.result.filePath || signedUrlResponse.result.destFilePath;
      if (!filePath) {
        throw new Error(t('admin.actions.uploadErrorFilePathNotFound'));
      }

      await bulkUserCreate(filePath, ['name', 'email'], 'UPLOAD');

      // Show success toast
      showAlert('success', t('admin.actions.uploadSuccess'));

      // Refresh users list after successful upload
      // Trigger fetchUsers by updating a dummy filter or refetching
      setFilters((prev) => ({ ...prev, _refresh: Date.now() }));

    } catch (error: any) {
      // Use API error message if available, otherwise use generic error message
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        t('admin.actions.uploadError');

      showAlert('error', errorMessage);
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };


  return (
    <VStack space="md" width="100%">
      <TitleHeader
        title="admin.menu.userManagement"
        description="admin.userManagementDescription"
        right={
          <HStack space="md" alignItems="center">
            <Button variant={"outlineghost" as any}
              onPress={() => setIsUploadModalOpen(true)}
              isDisabled={isUploading}
            >
              <ButtonIcon as={LucideIcon} name="Upload" size={16} />
              <ButtonText {...TYPOGRAPHY.bodySmall}>{t('admin.actions.bulkUploadCSV')}</ButtonText>
            </Button>
            <Button variant={"solid" as any}
              onPress={openCreateUserModal}
              isDisabled={isUploading}
            >
              <ButtonIcon as={LucideIcon} name="SquarePen" size={16} />
              <ButtonText {...TYPOGRAPHY.bodySmall}>{t('admin.actions.createUser')}</ButtonText>
            </Button>
          </HStack>
        }
      />

      <FilterButton
        data={filterOptions}
        onFilterChange={handleFilterChange}
      />

      {/* Table Header with Title, Count, and Export Button */}
      <Box {...styles.tableContainer}>
        <HStack {...styles.tableHeader}>
          <Text {...TYPOGRAPHY.h4} color="$textForeground" fontWeight="$normal">
            {t('admin.users.allUsers')}
          </Text>
          <HStack {...styles.tableHeaderActions}>
            {!isMobile && (
              <Text {...TYPOGRAPHY.bodySmall} color="$textMutedForeground">
                {t('admin.users.showing', {
                  count: displayUsers.length,
                  total: totalCount || displayUsers.length,
                })}
              </Text>
            )}
            {/* <Button
              {...titleHeaderStyles.outlineButton}
              onPress={() => {
                // Handle Export CSV
              }}
            >
              <HStack space="xs" alignItems="center">
                <LucideIcon
                  name="Download"
                  size={16}
                />
                <Text {...TYPOGRAPHY.bodySmall} fontWeight="$medium">
                  {t('admin.actions.exportCSV')}
                </Text>
              </HStack>
            </Button> */}
          </HStack>
        </HStack>

        {/* DataTable with server-side pagination */}
        {pageSize !== null && (
          <DataTable
            minWidth={1000}
            data={displayUsers}
            columns={columns}
            getRowKey={(user) => user.id}
            isLoading={isLoading}
            pagination={{
              enabled: true,
              pageSize: pageSize,
              showPageSizeSelector: true,
              pageSizeOptions: PAGE_SIZE_OPTIONS,
              serverSide: {
                count: currentPage,
                total: totalCount,
              },
            }}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            emptyMessage="admin.users.noUsersFound"
            loadingMessage="admin.users.loadingUsers"
            _css={{
              _table: {
                borderRadius: '$md',
                borderWidth: 0,
              },
              _header: {
                _tableHeader: {
                  borderBottomWidth: 1,
                  borderBottomColor: '$borderLight300' as const,
                  bg: '#fff' as const,
                  borderTopLeftRadius: '$md' as const,
                  borderTopRightRadius: '$md' as const,
                },
                _thText: {
                  fontWeight: '$medium',

                },

              }
            }}
          />
        )}
      </Box>

      {/* Upload Users Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        headerTitle={t('admin.actions.uploadUsers')}
        headerDescription={t('admin.actions.uploadUsersDescription')}
        size="lg"
        borderRadius="$lg"
      >
        <VStack space="md" width="100%">
          {/* Upload CSV Option */}
          <Pressable
            onPress={handleUploadCSV}
          >
            <Card
              {...(styles.uploadOptionCard as any)}
              bg="$white"
            >
              <HStack space="md" alignItems="center">
                {/* Icon Container */}
                <Box
                  {...(styles.uploadCSVIconContainer as any)}
                >
                  <LucideIcon
                    name="FileUp"
                    size={16}
                    color={theme.tokens.colors.primary500}
                  />
                </Box>

                {/* Text Content */}
                <VStack flex={1} space="xs">
                  <Text
                    {...TYPOGRAPHY.bodySmall}
                    color={theme.tokens.colors.textPrimary}
                    fontWeight="$medium"
                  >
                    {t('admin.actions.uploadCSV')}
                  </Text>
                  <Text
                    {...TYPOGRAPHY.caption}
                    color="$textMutedForeground"
                  >
                    {t('admin.actions.uploadCSVDescription')}
                  </Text>
                </VStack>
              </HStack>
            </Card>
          </Pressable>

          {/* Add User Option - Disabled */}
          <Pressable disabled>
            <Card
              {...(styles.uploadOptionCardDisabled as any)}
              bg="$white"
            >
              <HStack space="md" alignItems="center">
                {/* Icon Container */}
                <Box
                  {...(styles.addUserIconContainer as any)}
                >
                  <LucideIcon
                    name="UserPlus"
                    size={16}
                    color="#6B7280"
                  />
                </Box>

                {/* Text Content */}
                <VStack flex={1} space="xs">
                  <Text
                    {...TYPOGRAPHY.bodySmall}
                    color={theme.tokens.colors.textPrimary}
                    fontWeight="$medium"
                  >
                    {t('admin.actions.addUser')}
                  </Text>
                  <Text
                    {...TYPOGRAPHY.caption}
                    color="$textMutedForeground"
                  >
                    {t('admin.actions.addUserDescription')}
                  </Text>
                </VStack>
              </HStack>
            </Card>
          </Pressable>
        </VStack>
      </Modal>

      {/* View Profile Modal */}
      <Modal
        isOpen={isProfileModalOpen}
        onClose={closeProfileModal}
        size="lg"
        showCloseButton={true}
        contentProps={{ bg: '$white' }}
        headerContent={
          <ProfileModalHeader
            selectedUserBase={selectedUserBase}
            selectedUserProfile={selectedUserProfile}
            isMobile={isMobile}
            t={t}
          />
        }
      >
        <VStack space="md" width="100%">
          {/* Tabs */}
          <HStack bg="$bgSidebar" borderRadius="$lg" p="$1" space="xs">
            {([
              { key: 'DETAILS', label: 'admin.users.details' },
              { key: 'ACTIVITY', label: 'admin.users.activity' },
              { key: 'PERMISSIONS', label: 'admin.users.permissions' },
            ] as const).map(tab => (
              <TabButton
                key={tab.key}
                tab={tab}
                isActive={profileTab === tab.key}
                onPress={(tabKey) => setProfileTab(tabKey as ProfileTab)}
                variant="ButtonTab"
              />
            ))}
          </HStack>

          {/* Content */}
          {profileLoading ? (
            <Text {...TYPOGRAPHY.bodySmall} color="$textMutedForeground">
              {t('common.loading')}
            </Text>
          ) : profileTab !== 'DETAILS' ? (
            <VStack space="sm" alignItems="center" py="$8">
              <Text {...TYPOGRAPHY.h4} color="$textForeground">
                {t('common.comingSoon')}
              </Text>
              <Text {...TYPOGRAPHY.bodySmall} color="$textMutedForeground">
                {profileTab === 'ACTIVITY'
                  ? t('admin.users.profileModal.activityComingSoonDescription')
                  : t('admin.users.profileModal.permissionsComingSoonDescription')}
              </Text>
            </VStack>
          ) : (
            <VStack space="lg" alignItems="stretch">
              {/* Personal Information */}
              <VStack space="sm">
                <HStack space="xs" alignItems="center">
                  <LucideIcon name="User" size={16} color="$textMutedForeground" />
                  <Text {...TYPOGRAPHY.bodySmall} color="$textMutedForeground" fontWeight="$medium">
                    {t('admin.users.profileModal.personalInformation')}
                  </Text>
                </HStack>
                <Card bg="$white" borderRadius="$lg" p="$4" borderWidth={0} variant="ghost">
                  <HStack space="lg" justifyContent="space-between">
                    <VStack flex={1} space="xs">
                      <Text {...TYPOGRAPHY.caption} color="$textMutedForeground">{t('admin.users.profileModal.fullName')}</Text>
                      <Text {...TYPOGRAPHY.bodySmall} color="$textForeground">
                        {selectedUserProfile?.name || selectedUserBase?.name || '-'}
                      </Text>
                    </VStack>
                    <VStack flex={1} space="xs">
                      <Text {...TYPOGRAPHY.caption} color="$textMutedForeground">{t('admin.users.email')}</Text>
                      <Text {...TYPOGRAPHY.bodySmall} color="$textForeground">
                        {selectedUserProfile?.email || selectedUserBase?.email || '-'}
                      </Text>
                    </VStack>
                  </HStack>

                  <HStack space="lg" justifyContent="space-between" mt="$4">
                    <VStack flex={1} space="xs">
                      <Text {...TYPOGRAPHY.caption} color="$textMutedForeground">{t('admin.users.profileModal.phoneNumber')}</Text>
                      <Text {...TYPOGRAPHY.bodySmall} color="$textForeground">
                        {selectedUserProfile?.phoneNumber || selectedUserProfile?.phone_number || selectedUserProfile?.phone || '-'}
                      </Text>
                    </VStack>
                    <VStack flex={1} space="xs">
                      <Text {...TYPOGRAPHY.caption} color="$textMutedForeground">{t('admin.users.profileModal.idNumber')}</Text>
                      <Text {...TYPOGRAPHY.bodySmall} color="$textForeground">
                        {selectedUserProfile?.idNumber || selectedUserProfile?.id_number || selectedUserProfile?.id || '-'}
                      </Text>
                    </VStack>
                  </HStack>
                </Card>
              </VStack>

              <Divider />

              {/* Geographic Assignment */}
              <VStack space="sm">
                <HStack space="xs" alignItems="center">
                  <LucideIcon name="MapPin" size={16} color="$textMutedForeground" />
                  <Text {...TYPOGRAPHY.bodySmall} color="$textMutedForeground" fontWeight="$medium">
                    {t('admin.users.profileModal.geographicAssignment')}
                  </Text>
                </HStack>
                <Card bg="$white" borderRadius="$lg" p="$4" borderWidth={0} variant="ghost">
                  <HStack space="lg" justifyContent="space-between">
                    <VStack flex={1} space="xs">
                      <Text {...TYPOGRAPHY.caption} color="$textMutedForeground">{t('admin.users.province')}</Text>
                      <Text {...TYPOGRAPHY.bodySmall} color="$textForeground">
                        {selectedUserProfile?.province?.label ||
                          (typeof (selectedUserProfile as any)?.province === 'string'
                            ? (selectedUserProfile as any)?.province
                            : '') ||
                          (selectedUserBase as any)?.province?.label ||
                          (typeof (selectedUserBase as any)?.province === 'string'
                            ? (selectedUserBase as any)?.province
                            : '') ||
                          '-'}
                      </Text>
                    </VStack>
                    <VStack flex={1} space="xs">
                      <Text {...TYPOGRAPHY.caption} color="$textMutedForeground">{t('admin.users.site')}</Text>
                      <Text {...TYPOGRAPHY.bodySmall} color="$textForeground">
                        {selectedUserProfile?.site?.label ||
                          (typeof (selectedUserProfile as any)?.site === 'string'
                            ? (selectedUserProfile as any)?.site
                            : '') ||
                          (selectedUserBase as any)?.site?.label ||
                          (typeof (selectedUserBase as any)?.site === 'string'
                            ? (selectedUserBase as any)?.site
                            : '') ||
                          '-'}
                      </Text>
                    </VStack>
                  </HStack>
                </Card>
              </VStack>

              <Divider />

              {/* Role & Assignment */}
              <VStack space="sm">
                <HStack space="xs" alignItems="center">
                  <LucideIcon name="Shield" size={16} color="$textMutedForeground" />
                  <Text {...TYPOGRAPHY.bodySmall} color="$textMutedForeground" fontWeight="$medium">
                    {t('admin.users.profileModal.roleAndAssignment')}
                  </Text>
                </HStack>
                <Card bg="$white" borderRadius="$lg" p="$4" borderWidth={0} variant="ghost">
                  <HStack space="lg" justifyContent="space-between">
                    <VStack flex={1} space="xs">
                      <Text {...TYPOGRAPHY.caption} color="$textMutedForeground">{t('admin.users.role')}</Text>
                      <Text {...TYPOGRAPHY.bodySmall} color="$textForeground">
                        {(() => {
                          const roles =
                            (selectedUserBase as any)?.user_organizations?.[0]?.roles
                              ?.map((r: any) => r?.role?.label)
                              .filter(Boolean) || [];

                          // Ensure we never render an object as text (prevents React error #31)
                          const profileRole =
                            typeof (selectedUserProfile as any)?.role === 'string'
                              ? (selectedUserProfile as any)?.role
                              : (selectedUserProfile as any)?.role?.label;

                          return (
                            roles[0] ||
                            profileRole ||
                            selectedUserBase?.role ||
                            '-'
                          );
                        })()}
                      </Text>
                    </VStack>
                    <VStack flex={1} space="xs">
                      <Text {...TYPOGRAPHY.caption} color="$textMutedForeground">{t('admin.users.profileModal.dateJoined')}</Text>
                      <Text {...TYPOGRAPHY.bodySmall} color="$textForeground">
                        {selectedUserProfile?.createdAt || selectedUserProfile?.created_at || '-'}
                      </Text>
                    </VStack>
                  </HStack>
                </Card>
              </VStack>
            </VStack>
          )}

          {/* Footer */}
          <HStack space="md" alignItems="center" justifyContent="flex-end" mt="$4">
            <Button variant={"outlineghost" as any}
              onPress={closeProfileModal}
            >
              <ButtonText {...TYPOGRAPHY.bodySmall}>{t('admin.users.profileModal.close')}</ButtonText>
            </Button>
            {/* <Button variant={"solid" as any}
              onPress={() => {
                if (selectedUserBase) {
                  openEditUserModal(selectedUserBase);
                  closeProfileModal();
                } else {
                  showAlert('info', t('common.comingSoon'));
                }
              }}
            >
              <ButtonText {...TYPOGRAPHY.bodySmall}>{t('admin.users.profileModal.editUser')}</ButtonText>
            </Button> */}
          </HStack>
        </VStack>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={!!resetPasswordState.user?.id}
        onClose={closeResetPasswordModal}
        headerTitle={t('admin.users.resetPassword.title') || 'Reset Password'}
        headerDescription={t('admin.users.resetPassword.description') || 'Enter a new password for the user'}
        headerAlignment="baseline"
        maxWidth={480}
        size="md"
        closeOnOverlayClick={!resetPasswordState.isSubmitting}
        footerContent={
          <HStack space="md" width="100%" justifyContent="flex-end">
            <Button variant="outline" onPress={closeResetPasswordModal} isDisabled={resetPasswordState.isSubmitting}>
              <ButtonText color="$textPrimary" {...TYPOGRAPHY.button}>
                {t('common.cancel') || 'Cancel'}
              </ButtonText>
            </Button>

            <Button variant="solid" action="primary" onPress={handleResetPasswordSubmit} isDisabled={resetPasswordState.isSubmitting}>
              <ButtonText color="$white" {...TYPOGRAPHY.button}>
                {resetPasswordState.isSubmitting
                  ? (t('common.submitting') || 'Submitting...')
                  : (t('admin.users.resetPassword.submit') || 'Reset Password')}
              </ButtonText>
            </Button>
          </HStack>
        }
      >
        <VStack key={resetPasswordState.user?.id || 'empty'} space="lg" width="100%">
          {/* Username Field - Read Only */}
          <VStack space="xs" width="100%">
            <Text {...TYPOGRAPHY.bodySmall} fontWeight="$medium" color="$textForeground">
              {t('admin.users.resetPassword.username') || 'Username'}
            </Text>
            <Input isReadOnly>
              <InputField value={resetPasswordState.user?.name || ''} />
            </Input>
          </VStack>

          <VStack space="xs" width="100%">
            <Text {...TYPOGRAPHY.bodySmall} fontWeight="$medium" color="$textForeground">
              {t('admin.users.resetPassword.email') || 'Email'}
            </Text>
            <Input isReadOnly>
              <InputField value={resetPasswordState.user?.email || ''} />
            </Input>
          </VStack>

          {/* Password Field - With Show/Hide Toggle */}
          <VStack space="xs" width="100%">
            <Text {...TYPOGRAPHY.bodySmall} fontWeight="$medium" color="$textForeground">
              {t('admin.users.resetPassword.newPassword') || 'New Password'}
              <Text color="$error600"> *</Text>
            </Text>
            <Box position="relative">
              <Input isDisabled={resetPasswordState.isSubmitting} isInvalid={!!resetPasswordState.error}>
                <FastInputField
                  placeholder={t('admin.users.resetPassword.passwordPlaceholder') || 'Enter new password'}
                  value={resetPasswordState.password}
                  onChangeText={(text: string) => {
                    setResetPasswordState(prev => ({
                      ...prev,
                      password: text,
                      error: prev.error ? '' : prev.error,
                    }));
                  }}
                  secureTextEntry={!resetPasswordState.showPassword}
                  editable={editable}
                  onFocus={() => setEditable(true)}
                  pr="$12"
                  returnKeyType="done"
                  onSubmitEditing={handleResetPasswordSubmit}
                />
              </Input>
              <Pressable
                onPress={() => setResetPasswordState(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                disabled={resetPasswordState.isSubmitting}
                style={styles.resetPasswordEyeIconButton}
              >
                <LucideIcon
                  name={resetPasswordState.showPassword ? 'EyeOff' : 'Eye'}
                  size={20}
                  color="#6B7280"
                />
              </Pressable>
            </Box>
            {resetPasswordState.error ? (
              <Text {...TYPOGRAPHY.bodySmall} color="$error600">
                {resetPasswordState.error}
              </Text>
            ) : null}
          </VStack>
        </VStack>
      </Modal>

      {/* Deactivate Confirmation Modal */}
      <Modal
        isOpen={!!deactivateState.user?.id}
        onClose={closeDeactivateModal}
        headerTitle={t('admin.users.actionMenu.confirmDeactivate') || 'Confirm deactivation'}
        headerDescription={(() => {
          const name = deactivateState.user?.name || '';
          const msg =
            t('admin.users.actionMenu.deactivateMessage', { name }) ||
            'Are you sure you want to deactivate this user?';

          if (!name || typeof msg !== 'string') {
            return (
              <Text {...TYPOGRAPHY.bodySmall} color="$textMutedForeground">
                {String(msg)}
              </Text>
            );
          }

          const idx = msg.indexOf(name);
          if (idx < 0) {
            return (
              <Text {...TYPOGRAPHY.bodySmall} color="$textMutedForeground">
                {msg}
              </Text>
            );
          }

          const before = msg.slice(0, idx);
          const after = msg.slice(idx + name.length);
          return (
            <Text {...TYPOGRAPHY.bodySmall} color="$textMutedForeground">
              {before}
              <Text color="$textForeground" fontWeight="$medium">
                {name}
              </Text>
              {after}
            </Text>
          );
        })()}
        headerAlignment="baseline"
        maxWidth={420}
        size="sm"
        closeOnOverlayClick={!deactivateState.isSubmitting}
        headerProps={{ paddingTop: '$4', paddingBottom: '$2' }}
        bodyProps={{ padding: '$4', paddingTop: '$0', paddingBottom: '$4' }}
      >
        <HStack space="md" width="100%" justifyContent="flex-end" flexWrap="wrap">
          <Button
            size="sm"
            variant="outline"
            onPress={closeDeactivateModal}
            isDisabled={deactivateState.isSubmitting}
          >
            <ButtonText color="$textPrimary" {...TYPOGRAPHY.bodySmall}>
              {t('common.cancel') || 'Cancel'}
            </ButtonText>
          </Button>

          <Button
            size="sm"
            variant="solid"
            action="primary"
            onPress={handleConfirmDeactivate}
            isDisabled={deactivateState.isSubmitting}
          >
            <ButtonText color="$white" {...TYPOGRAPHY.bodySmall}>
              {deactivateState.isSubmitting
                ? (t('common.submitting') || 'Submitting...')
                : (t('admin.users.actionMenu.deactivate') || 'Deactivate')}
            </ButtonText>
          </Button>
        </HStack>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={!!editUserState.user?.id}
        onClose={closeEditUserModal}
        size="lg"
        showCloseButton={true}
        closeOnOverlayClick={!editUserState.isSubmitting}
        contentProps={{ bg: '$white' }}
        headerContent={
          <ProfileModalHeader
            selectedUserBase={editUserState.user}
            selectedUserProfile={editUserState.userProfile}
            isMobile={isMobile}
            t={t}
          />
        }
      >
        <VStack key={editUserState.user?.id || 'empty'} space="md" width="100%">
          {/* Content */}
          {editUserState.isLoading ? (
            <Text {...TYPOGRAPHY.bodySmall} color="$textMutedForeground">
              {t('common.loading')}
            </Text>
          ) : editTab !== 'DETAILS' ? (
            <VStack space="sm" alignItems="center" py="$8">
              <Text {...TYPOGRAPHY.h4} color="$textForeground">
                {t('common.comingSoon')}
              </Text>
              <Text {...TYPOGRAPHY.bodySmall} color="$textMutedForeground">
                {editTab === 'ACTIVITY'
                  ? t('admin.users.profileModal.activityComingSoonDescription')
                  : t('admin.users.profileModal.permissionsComingSoonDescription')}
              </Text>
            </VStack>
          ) : (
            <VStack space="lg" alignItems="stretch">
              {/* Personal Information */}
              <VStack space="sm">
                <HStack space="xs" alignItems="center">
                  <LucideIcon name="User" size={16} color="$textMutedForeground" />
                  <Text {...TYPOGRAPHY.bodySmall} color="$textMutedForeground" fontWeight="$medium">
                    {t('admin.users.profileModal.personalInformation')}
                  </Text>
                </HStack>
                <Card bg="$white" borderRadius="$lg" p="$4" borderWidth={0} variant="ghost">
                  <HStack space="lg" justifyContent="space-between">
                    <VStack flex={1} space="xs">
                      <Text {...TYPOGRAPHY.caption} color="$textMutedForeground">
                        {t('admin.users.profileModal.fullName')}
                      </Text>
                      <Input {...styles.editUserEditableInput} isDisabled={editUserState.isSubmitting}>
                        <FastInputField
                          value={editUserState.name}
                          onChangeText={(text: string) => setEditUserState(prev => ({ ...prev, name: text }))}
                          placeholder={t('admin.users.profileModal.fullName')}
                          {...styles.editUserEditableInputField}
                        />
                      </Input>
                    </VStack>
                    <VStack flex={1} space="xs">
                      <Text {...TYPOGRAPHY.caption} color="$textMutedForeground">
                        {t('admin.users.email')}
                      </Text>
                      <Text {...TYPOGRAPHY.bodySmall} color="$textForeground">
                        {editUserState.userProfile?.email || editUserState.user?.email || '-'}
                      </Text>
                    </VStack>
                  </HStack>

                  <HStack space="lg" justifyContent="space-between" mt="$4">
                    <VStack flex={1} space="xs">
                      <Text {...TYPOGRAPHY.caption} color="$textMutedForeground">
                        {t('admin.users.profileModal.phoneNumber')}
                      </Text>
                      <Text {...TYPOGRAPHY.bodySmall} color="$textForeground">
                        {editUserState.userProfile?.phoneNumber ||
                          editUserState.userProfile?.phone_number ||
                          editUserState.userProfile?.phone ||
                          (editUserState.user as any)?.phoneNumber ||
                          (editUserState.user as any)?.phone_number ||
                          (editUserState.user as any)?.phone ||
                          '-'}
                      </Text>
                    </VStack>
                    <VStack flex={1} space="xs">
                      <Text {...TYPOGRAPHY.caption} color="$textMutedForeground">
                        {t('admin.users.profileModal.idNumber')}
                      </Text>
                      <Text {...TYPOGRAPHY.bodySmall} color="$textForeground">
                        {editUserState.userProfile?.idNumber ||
                          editUserState.userProfile?.id_number ||
                          editUserState.userProfile?.id ||
                          '-'}
                      </Text>
                    </VStack>
                  </HStack>
                </Card>
              </VStack>

              <Divider />

              {/* Geographic Assignment */}
              <VStack space="sm">
                <HStack space="xs" alignItems="center">
                  <LucideIcon name="MapPin" size={16} color="$textMutedForeground" />
                  <Text {...TYPOGRAPHY.bodySmall} color="$textMutedForeground" fontWeight="$medium">
                    {t('admin.users.profileModal.geographicAssignment')}
                  </Text>
                </HStack>
                <Card bg="$white" borderRadius="$lg" p="$4" borderWidth={0} variant="ghost">
                  <HStack space="lg" justifyContent="space-between">
                    <VStack flex={1} space="xs">
                      <Text {...TYPOGRAPHY.caption} color="$textMutedForeground">
                        {t('admin.users.province')}
                      </Text>
                      <Text {...TYPOGRAPHY.bodySmall} color="$textForeground">
                        {editUserState.userProfile?.province?.label ||
                          (typeof (editUserState.userProfile as any)?.province === 'string'
                            ? (editUserState.userProfile as any)?.province
                            : '') ||
                          (editUserState.user as any)?.province?.label ||
                          (typeof (editUserState.user as any)?.province === 'string'
                            ? (editUserState.user as any)?.province
                            : '') ||
                          '-'}
                      </Text>
                    </VStack>
                    <VStack flex={1} space="xs">
                      <Text {...TYPOGRAPHY.caption} color="$textMutedForeground">
                        {t('admin.users.profileModal.districtMunicipality') || t('admin.users.site')}
                      </Text>
                      <Text {...TYPOGRAPHY.bodySmall} color="$textForeground">
                        {editUserState.userProfile?.site?.label ||
                          (typeof (editUserState.userProfile as any)?.site === 'string'
                            ? (editUserState.userProfile as any)?.site
                            : '') ||
                          (editUserState.user as any)?.site?.label ||
                          (typeof (editUserState.user as any)?.site === 'string'
                            ? (editUserState.user as any)?.site
                            : '') ||
                          '-'}
                      </Text>
                    </VStack>
                  </HStack>
                </Card>
              </VStack>

              <Divider />

              {/* Role & Assignment */}
              <VStack space="sm">
                <HStack space="xs" alignItems="center">
                  <LucideIcon name="Shield" size={16} color="$textMutedForeground" />
                  <Text {...TYPOGRAPHY.bodySmall} color="$textMutedForeground" fontWeight="$medium">
                    {t('admin.users.profileModal.roleAndAssignment')}
                  </Text>
                </HStack>
                <Card bg="$white" borderRadius="$lg" p="$4" borderWidth={0} variant="ghost">
                  <HStack space="lg" justifyContent="space-between">
                    <VStack flex={1} space="xs">
                      <Text {...TYPOGRAPHY.caption} color="$textMutedForeground">
                        {t('admin.users.role')}
                      </Text>
                      <Text {...TYPOGRAPHY.bodySmall} color="$textForeground">
                        {(() => {
                          const roles =
                            (editUserState.user as any)?.user_organizations?.[0]?.roles
                              ?.map((r: any) => r?.role?.label)
                              .filter(Boolean) || [];

                          const profileRole =
                            typeof (editUserState.userProfile as any)?.role === 'string'
                              ? (editUserState.userProfile as any)?.role
                              : (editUserState.userProfile as any)?.role?.label;

                          return roles[0] || profileRole || editUserState.user?.role || '-';
                        })()}
                      </Text>
                    </VStack>
                    <VStack flex={1} space="xs">
                      <Text {...TYPOGRAPHY.caption} color="$textMutedForeground">
                        {t('admin.users.profileModal.dateJoined')}
                      </Text>
                      <Text {...TYPOGRAPHY.bodySmall} color="$textForeground">
                        {editUserState.userProfile?.createdAt ||
                          editUserState.userProfile?.created_at ||
                          '-'}
                      </Text>
                    </VStack>
                  </HStack>
                </Card>
              </VStack>
            </VStack>
          )}

          {/* Footer (match Profile modal UI) */}
          <HStack space="md" alignItems="center" justifyContent="flex-end" mt="$4">
            <Button variant={"outlineghost" as any} onPress={closeEditUserModal}>
              <ButtonText {...TYPOGRAPHY.bodySmall}>
                {t('admin.users.profileModal.close') || (t('common.close') || 'Close')}
              </ButtonText>
            </Button>
            <Button variant={"solid" as any} onPress={handleSaveEditUser}>
              <ButtonText {...TYPOGRAPHY.bodySmall}>
                {t('admin.users.profileModal.editUser')}
              </ButtonText>
            </Button>
          </HStack>
        </VStack>
      </Modal>

      {/* Create New User Modal */}
      <Modal
        isOpen={isCreateUserModalOpen}
        onClose={closeCreateUserModal}
        size="lg"
        headerTitle={t('admin.users.createUser.title') || 'Create New User'}
        headerDescription={t('admin.users.createUser.description') || 'Add a new user to the system. Required fields are marked with *.'}
        showCloseButton={true}
        closeOnOverlayClick={!isCreateUserSubmitting}
        style={{ zIndex: 9999 }}
      >
        <CreateUserForm
          isMobile={isMobile}
          t={t}
          optionsMap={createUserOptionsMap}
          flags={createUserFlags}
          values={createUserValues}
          errors={createUserErrors}
          onFieldChange={handleCreateFieldChange}
          isCreateUserSubmitting={isCreateUserSubmitting}
          isCreateUserModalOpen={isCreateUserModalOpen}
          onClose={closeCreateUserModal}
          onSubmit={handleCreateUserSubmit}
        />
      </Modal>

      {/* Hidden File Input for CSV Upload - triggers native file picker on "Upload CSV" click */}
      {Platform.OS === 'web' && (
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      )}
    </VStack>
  );
};

export default UserManagementScreen;
