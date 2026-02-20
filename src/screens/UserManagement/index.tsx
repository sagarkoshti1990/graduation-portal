import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { VStack, HStack, Button, Text, Box, Pressable, Card, Modal, useAlert, ButtonIcon, ButtonText, Badge, BadgeText, Divider } from '@ui';
import { Platform } from 'react-native';
import { LucideIcon } from '@ui/index';
import { useLanguage } from '@contexts/LanguageContext';
import { useUserManagementFilters, mapStatusLabelToAPI, PAGE_SIZE_OPTIONS } from '@constants/USER_MANAGEMENT';
import FilterButton from '@components/Filter';
import TitleHeader from '@components/TitleHeader';
// import { titleHeaderStyles } from '@components/TitleHeader/Styles';
import DataTable from '@components/DataTable';
import { getUsersColumns, RoleBadge } from './UsersTableConfig';
import { AdminUserManagementData } from '@app-types/Users';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';
import { usePlatform } from '@utils/platform';
import { styles } from './Styles';
import { getUsersList } from '../../services/usersService';
import type { 
  // UserSearchParams,
   Role
} from '@app-types/Users';
import { getSignedUrl, uploadFileToSignedUrl, bulkUserCreate } from '../../services/bulkUploadService';
import { theme } from '@config/theme';
import { getUserProfile } from '../../services/authenticationService';
import { TabButton } from '@components/Tabs';
import { STORAGE_KEYS } from '@constants/STORAGE_KEYS';
import offlineStorage from '../../services/offlineStorage';
import logger from '@utils/logger';

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
    <HStack space="sm" alignItems="center">
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
    <HStack alignItems="center" justifyContent="space-between" flex={1} flexShrink={1}>
      <VStack space="xs" flex={1}>
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
  const [users, setUsers] = useState<AdminUserManagementData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | null>(null);

  // File upload state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // View Profile modal state
  type ProfileTab = 'DETAILS' | 'ACTIVITY' | 'PERMISSIONS';
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileTab, setProfileTab] = useState<ProfileTab>('DETAILS');
  const [profileLoading, setProfileLoading] = useState(false);
  const [selectedUserBase, setSelectedUserBase] = useState<AdminUserManagementData | null>(null);
  const [selectedUserProfile, setSelectedUserProfile] = useState<any | null>(null);

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

  const columns = useMemo(
    () => getUsersColumns({ onViewProfile: openProfileModal }),
    [openProfileModal]
  );

  // Ref to track previous roles length to detect when roles are first loaded
  const prevRolesLengthRef = useRef(0);

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

  // Use custom hook for filter management - handles all API calls for roles, provinces
  const { filters: filterOptions, roles, provinces } = useUserManagementFilters(filters);

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
        let usersData = response.result?.data || [];

        // Get total count from API response (if available), otherwise use data length
        const apiTotalCount = response.result?.count ?? response.result?.total ?? usersData.length;

        setUsers(usersData);
        // Use API total count
        setTotalCount(apiTotalCount);
      } catch (error) {
        setUsers([]);
        setTotalCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    if (pageSize) {
      fetchUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, roles.length, currentPage, pageSize]); // Depend on filters, roles, currentPage, and pageSize

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: Record<string, any>) => {
    setFilters(newFilters);
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
            {/* <Button variant={"solid" as any}
              onPress={() => {
                // Handle create user
              }}
              isDisabled={isUploading}
            >
              <ButtonIcon as={LucideIcon} name="SquarePen" size={16} />
              <ButtonText {...TYPOGRAPHY.bodySmall}>{t('admin.actions.createUser')}</ButtonText>
            </Button> */}
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
                  count: users.length,
                  total: totalCount || users.length,
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
        <DataTable
          minWidth={1000}
          data={users}
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
            _table:{
              borderRadius: '$md',
              borderWidth: 0,
            },
            _header:{
              _tableHeader:{
              borderBottomWidth: 1,
                borderBottomColor: '$borderLight300' as const,
                bg: '#fff' as const,
                borderTopLeftRadius: '$md' as const,
                borderTopRightRadius: '$md' as const,
              },
              _thText:{
                fontWeight: '$medium',
              
              },
            
            }
          }}
        />
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
            <VStack space="lg"  alignItems="stretch">
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
            <Button variant={"solid" as any}
              onPress={() => showAlert('info', t('common.comingSoon'))}
            >
              <ButtonText {...TYPOGRAPHY.bodySmall}>{t('admin.users.profileModal.editUser')}</ButtonText>
            </Button>
          </HStack>
        </VStack>
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
