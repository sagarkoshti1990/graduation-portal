import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { VStack, HStack, Button, Text, Box, Pressable, Card, Modal, useAlert, ButtonIcon, ButtonText } from '@ui';
import { Platform } from 'react-native';
import { LucideIcon } from '@ui/index';
import { useLanguage } from '@contexts/LanguageContext';
import { useUserManagementFilters, mapStatusLabelToAPI } from '@constants/USER_MANAGEMENT_FILTERS';
import FilterButton from '@components/Filter';
import TitleHeader from '@components/TitleHeader';
import { titleHeaderStyles } from '@components/TitleHeader/Styles';
import DataTable from '@components/DataTable';
import { getUsersColumns } from './UsersTableConfig';
import { AdminUserManagementData } from '@app-types/Users';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';
import { usePlatform } from '@utils/platform';
import { styles } from './Styles';
import { getUsersList } from '../../services/usersService';
import type { UserSearchParams, Role } from '@app-types/Users';
import { getSignedUrl, uploadFileToSignedUrl, bulkUserCreate } from '../../services/bulkUploadService';
import { theme } from '@config/theme';

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
  const [pageSize, setPageSize] = useState(10);

  // File upload state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const columns = useMemo(() => getUsersColumns(), []);

  // Ref to track previous roles length to detect when roles are first loaded
  const prevRolesLengthRef = useRef(0);

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

    fetchUsers();
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
  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when page size changes
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
            pageSizeOptions: [5, 10, 25, 50],
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
        size="md"
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
                    color={theme.tokens.colors.textMutedForeground}
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
                    color={theme.tokens.colors.textMutedForeground}
                  >
                    {t('admin.actions.addUserDescription')}
                  </Text>
                </VStack>
              </HStack>
            </Card>
          </Pressable>
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
