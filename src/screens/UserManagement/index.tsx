import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { VStack, HStack, Button, Text, Box, Pressable, Card, Modal, useAlert, ButtonIcon, ButtonText, Input, InputField } from '@ui';
import { Platform } from 'react-native';
import { LucideIcon } from '@ui/index';
import { useLanguage } from '@contexts/LanguageContext';
import { useUserManagementFilters, mapStatusLabelToAPI, PAGE_SIZE_OPTIONS } from '@constants/USER_MANAGEMENT';
import FilterButton from '@components/Filter';
import TitleHeader from '@components/TitleHeader';
// import { titleHeaderStyles } from '@components/TitleHeader/Styles';
import DataTable from '@components/DataTable';
import { getUsersColumns } from './UsersTableConfig';
import { AdminUserManagementData } from '@app-types/Users';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';
import { usePlatform } from '@utils/platform';
import { styles } from './Styles';
import { CreateUserForm } from './CreateUserForm';
import { UserProfileModal } from './UserProfileModal';
import { deactivateUser, getUsersList, resetPassword } from '../../services/usersService';
import { getParticipants } from '../../services/assignUsersService';
import type { 
  // UserSearchParams,
   Role
} from '@app-types/Users';
import { getSignedUrl, uploadFileToSignedUrl, bulkUserCreate } from '../../services/bulkUploadService';
import { theme } from '@config/theme';

import { STORAGE_KEYS } from '@constants/STORAGE_KEYS';
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
      return {...u,extra};
    }

    const details = buildDetailsForUserAndProgramRow(u, extra);
    return {
      ...u,
      ...(details ? { details } : {}),
      extra
    };
  });



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
  const { filters: filterOptions, roles } = useUserManagementFilters(filters);
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

  // Modals state
  
  const [selectedUser, setSelectedUser] = useState<AdminUserManagementData | null>(null);
  const [profileMode, setProfileMode] = useState<'preview' | 'edit'>('preview');

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

  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);

  const openCreateUserModal = useCallback(() => {
    setIsCreateUserModalOpen(true);
  }, []);

  const closeCreateUserModal = useCallback(() => {
    setIsCreateUserModalOpen(false);
  }, []);

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

const openProfileModal = useCallback((user: AdminUserManagementData) => {
  setProfileMode('preview');
  setSelectedUser(user);
}, []);
const openEditUserModal = useCallback((user: AdminUserManagementData) => {
  setProfileMode('edit');
  setSelectedUser(user);
}, []);

const closeProfileModal = useCallback(() => {
  setSelectedUser(null);
}, []);

  const openResetPasswordModal = useCallback((user: AdminUserManagementData) => {
    setResetPasswordState({
      user,
      password: '',
      showPassword: false,
      isSubmitting: false,
      error: '',
    });
  }, []);

  const closeResetPasswordModal = useCallback(() => {
    setResetPasswordState({
      user: null,
      password: '',
      showPassword: false,
      isSubmitting: false,
      error: '',
    });
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



  // Fetch users from API when filters change or when roles are first loaded
  useEffect(() => {
    // Check if roles just loaded (length changed from 0 to > 0)
    const rolesJustLoaded = prevRolesLengthRef.current === 0 && roles.length > 0;
    prevRolesLengthRef.current = roles.length;

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

      {/* Edit User Modal */}
      <UserProfileModal
        isOpen={!!selectedUser}
        onClose={closeProfileModal}
        onSuccess={() => {
          closeProfileModal();
          setRefetchKey(k => k + 1);
        }}
        user={selectedUser}
        isMobile={isMobile}
        t={t}
        mode={profileMode}
        onEdit={() => setProfileMode('edit')}
      />

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
        <VStack space="lg" width="100%">
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
                <InputField
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


      {/* Create New User Modal */}
      <CreateUserForm
        isOpen={isCreateUserModalOpen}
        onClose={closeCreateUserModal}
        onSuccess={() => {
          setIsCreateUserModalOpen(false);
          setRefetchKey(k => k + 1);
        }}
        isMobile={isMobile}
        t={t}
      />

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
