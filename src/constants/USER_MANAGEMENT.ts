/**
 * User Management Filter Configurations
 * Data-driven filter definitions for the User Management screen
 * All filter logic integrated with API
 */

import { useState, useEffect, useMemo } from 'react';
import {
  getRolesList,
  getProvincesList,
  getSitesByProvince,
} from '../services/usersService';
import type { Role, ProvinceEntity, SiteEntity } from '@app-types/Users';
import { useIsSupervisor } from '../contexts/AuthContext';
import logger from '@utils/logger';

// Type definition for filter configuration
export type FilterConfig = {
  name?: string; // Fallback if nameKey is not provided
  nameKey?: string; // Translation key for the filter name
  attr: string;
  type: 'search' | 'select';
  data: Array<
    string | { label?: string; labelKey?: string; value: string | null }
  >;
  placeholder?: string; // Fallback if placeholderKey is not provided
  placeholderKey?: string; // Translation key for the placeholder
  disabled?: boolean; // Disable the filter (e.g., district when no province selected)
};

// Status filter configuration - Static filter
export const StatusFilter: FilterConfig = {
    nameKey: 'admin.filters.status',
    attr: 'status',
    type: 'select',
  data: [
    { labelKey: 'admin.filters.allStatus', value: 'all-status' },
    { labelKey: 'admin.filters.active', value: 'Active' },
    { labelKey: 'admin.filters.deactivated', value: 'Deactivated' },
  ],
};

/**
 * Map filter status labels to API status format
 * Maps display labels to API format (e.g., "Active" → "ACTIVE")
 */
export const mapStatusLabelToAPI = (statusLabel: string): string => {
  const statusMap: Record<string, string> = {
    'Active': 'ACTIVE',
    'Deactivated': 'INACTIVE',
  };
  return statusMap[statusLabel] || statusLabel;
};

/**
 * Custom hook to manage user management filters with API integration
 * Fetches roles and provinces from API and builds filter options dynamically
 */
export const useUserManagementFilters = (filters: Record<string, any>) => {
  // Check if user is a supervisor using the reusable hook
  const isSupervisor = useIsSupervisor();

  // State for API data
  const [roles, setRoles] = useState<Role[]>([]);
  const [provinces, setProvinces] = useState<ProvinceEntity[]>([]);
  const [sites, setSites] = useState<SiteEntity[]>([]);

  // Fetch roles and provinces from API on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
      // Fetch roles
      try {
        const rolesResponse = await getRolesList({ page: 1, limit: 100 });
        const allRoles = rolesResponse.result?.data || [];
        // Filter only ACTIVE roles for the dropdown
        let activeRoles = allRoles.filter((role: Role) => role.status === 'ACTIVE');
        
        // If logged-in user is Supervisor, exclude "BRAC admin" and "Supervisor" roles
        // Check role label (what's displayed in dropdown) to filter out these roles
        if (isSupervisor) {
          activeRoles = activeRoles.filter((role: Role) => {
            const roleLabel = role.label?.toLowerCase() || '';
            
            // Exclude "BRAC admin" and "Supervisor" roles based on label
            // These are the display labels shown in the dropdown
            const isBRACAdmin = roleLabel === 'brac admin' || roleLabel.includes('brac admin');
            const isSupervisorRole = roleLabel === 'supervisor';
            
            return !isBRACAdmin && !isSupervisorRole;
          });
        }
        
        setRoles(activeRoles);
      } catch (error) {
        setRoles([]);
      }

      // Fetch provinces
      const provincesData = await getProvincesList();
      setProvinces(provincesData);
    };

    fetchInitialData();
  }, [isSupervisor]);

  // Fetch sites when province filter changes
  useEffect(() => {
    const fetchSites = async () => {
      const selectedProvince = filters.province;
      
      // Only fetch sites if a specific province is selected (not "all-provinces")
      if (!selectedProvince || selectedProvince === 'all-provinces') {
        setSites([]);
        return;
      }

      try {
        // Fetch sites for the selected province
        const sitesResponse = await getSitesByProvince({
          provinceId: selectedProvince,
          page: 1,
          limit: 100,
        });
        const sitesData = sitesResponse.result?.data || [];
        setSites(sitesData);
      } catch (error) {
        logger.error('Error fetching sites:', error);
        setSites([]);
      }
    };

    fetchSites();
  }, [filters.province]); // Re-fetch when province filter changes

  // Build dynamic filter options with API data
  const filterOptions = useMemo(() => {
    // Build role filter from API roles
    const roleFilterOptions = [
      { labelKey: 'admin.filters.allRoles', value: 'all-roles' },
      ...roles.map((role: Role) => ({
        label: role.label, // Display label in dropdown
        value: role.title, // Use title as value for filtering (unique identifier)
      })),
    ];

    // Build province filter from API provinces
    const provinceFilterOptions = [
      { labelKey: 'admin.filters.allProvinces', value: 'all-provinces' },
      ...provinces.map((province: ProvinceEntity) => ({
        label: province.name,
        value: province._id,
      })),
    ];

    // Determine if site filter should be disabled
    const selectedProvince = filters.province;
    const isProvinceSelected = selectedProvince &&
                               selectedProvince !== 'all-provinces';
    const shouldDisableSiteFilter = !isProvinceSelected; // Disable until a province is selected

    // Build site filter from API sites
    const siteFilterOptions = [
      { labelKey: 'admin.filters.allSites', value: 'all-sites' },
      ...sites.map((site: SiteEntity) => ({
        label: site.name,
        value: site._id, // Use _id as value for filtering
      })),
    ];

    return [
      {
        nameKey: 'common.search',
        attr: 'search',
        type: 'search' as const,
        data: [],
        placeholderKey: 'admin.filters.searchPlaceholder',
      },
      {
        nameKey: 'admin.filters.role',
        attr: 'role',
        type: 'select' as const,
        data: roleFilterOptions,
      },
      {
        nameKey: 'admin.filters.status',
        attr: 'status',
        type: 'select' as const,
    data: [
      { labelKey: 'admin.filters.allStatus', value: 'all-status' },
      { labelKey: 'admin.filters.active', value: 'Active' },
      { labelKey: 'admin.filters.deactivated', value: 'Deactivated' },
    ],
  },
  {
    nameKey: 'admin.filters.province',
    attr: 'province',
        type: 'select' as const,
        data: provinceFilterOptions,
      },
      {
        nameKey: 'admin.filters.site',
        attr: 'site',
        type: 'select' as const,
        data: siteFilterOptions,
        disabled: shouldDisableSiteFilter, // Disable until province is selected
      },
    ];
  }, [roles, provinces, sites, filters.province]);

  return {
    filters: filterOptions,
    roles,
    provinces,
    sites,
  };
};

export const PAGE_SIZE_OPTIONS = [5, 10, 25, 50,100, 200];