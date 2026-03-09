/**
 * Assign Users Filter Configurations
 * Data-driven filter definitions for the Assign Users screen
 * All filter logic for assigning LCs to Supervisors and Participants to LCs
 */

import { useState, useEffect, useMemo } from 'react';
import { getProvincesList, getSitesByProvince } from '../services/usersService';
import { getSupervisorsByProvince } from '../services/assignUsersService';
import type { FilterConfig } from './USER_MANAGEMENT';
import type { ProvinceEntity, AdminUserManagementData, SiteEntity } from '@app-types/Users';
import logger from '@utils/logger';

// Search filter for LC assignment
export const SearchFilter: FilterConfig = {
  nameKey: 'common.search',
  attr: 'search',
  type: 'search',
  data: [],
  placeholderKey: 'admin.filters.searchPlaceholder',
};

// Search filter for participant assignment
export const ParticipantSearchFilter: FilterConfig = {
  nameKey: 'common.search',
  attr: 'search',
  type: 'search',
  data: [],
  placeholderKey: 'admin.filters.searchPlaceholder',
};

/**
 * Hook to get supervisor filter options
 * Fetches provinces from API and supervisors based on selected province
 * 
 * @param filters - Current filter values to check if province is selected
 * @returns Object containing filter configurations and supervisors data
 */
export const useSupervisorFilterOptions = (filters: Record<string, unknown> = {}): {
  filters: ReadonlyArray<FilterConfig>;
  supervisors: AdminUserManagementData[];
} => {
  // State for API data
  const [provinces, setProvinces] = useState<ProvinceEntity[]>([]);
  const [supervisors, setSupervisors] = useState<AdminUserManagementData[]>([]);

  // Fetch provinces from API on component mount
  useEffect(() => {
    const fetchProvinces = async () => {
      const provincesData = await getProvincesList();
      setProvinces(provincesData);
    };

    fetchProvinces();
  }, []);

  // Fetch supervisors - all supervisors initially, filtered by province when selected
  useEffect(() => {
    const fetchSupervisors = async () => {
      const selectedProvince = filters.filterByProvince as string | undefined;
      
      try {
        // Fetch all supervisors if no province selected, or filtered by province if selected
        const supervisorsResponse = await getSupervisorsByProvince({
          provinceId: selectedProvince && selectedProvince !== 'all-provinces' && selectedProvince !== 'all-Provinces' 
            ? selectedProvince 
            : undefined,
          page: 1,
          limit: 100,
        });
        const supervisorsData = supervisorsResponse.result?.data || [];
        setSupervisors((supervisorsData ?? []) as AdminUserManagementData[]);
      } catch (error) {
        logger.error('Error fetching supervisors:', error);
        setSupervisors([]);
      }
    };

    fetchSupervisors();
  }, [filters.filterByProvince]);

  // Build dynamic filter options with API data
  return useMemo(() => {
    // Build province filter from API provinces
    const provinceFilterOptions = [
      { labelKey: 'admin.filters.allProvinces', value: 'all-provinces' },
      ...provinces.map((province: ProvinceEntity) => ({
        label: province.name,
        value: province._id, // Use _id as value for filtering
      })),
    ];

    // Build supervisor filter from API supervisors
    const supervisorFilterOptions = supervisors.map((supervisor: AdminUserManagementData) => {
      const name = supervisor.name ?? (supervisor as { full_name?: string }).full_name ?? supervisor.email ?? 'Unknown';
      const value = String(supervisor.id ?? (supervisor as { _id?: string })._id ?? supervisor.email ?? name);
      return {
        label: name,
        value: value,
      };
    });

    return {
      filters: [
        {
          nameKey: 'admin.filters.filterByProvince',
          attr: 'filterByProvince',
          type: 'select' as const,
          data: provinceFilterOptions,
        },
        {
          nameKey: 'admin.filters.selectSupervisor',
          attr: 'selectSupervisor',
          type: 'select' as const,
          placeholderKey: 'admin.filters.chooseSupervisor',
          data: supervisorFilterOptions,
        },
      ],
      supervisors, // Return supervisors data for accessing location and other details
    };
  }, [provinces, supervisors]);
};

/**
 * Hook to get site filter options
 * Fetches all sites initially, filtered by province when selected
 * 
 * @param selectedProvinceId - Province ID selected in Step 1 (from supervisorFilterValues.filterByProvince)
 * @returns Object containing site filter configuration
 */
export const useSiteFilterOptions = (selectedProvinceId?: string): {
  filters: ReadonlyArray<FilterConfig>;
  sites: SiteEntity[];
} => {
  // State for API data
  const [sites, setSites] = useState<SiteEntity[]>([]);

  // Fetch sites - all sites initially, filtered by province when selected
  useEffect(() => {
    const fetchSites = async () => {
      try {
        // Fetch all sites if no province selected, or filtered by province if selected
        const sitesResponse = await getSitesByProvince({
          provinceId: selectedProvinceId && selectedProvinceId !== 'all-provinces' && selectedProvinceId !== 'all-Provinces' 
            ? selectedProvinceId 
            : undefined,
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
  }, [selectedProvinceId]); // Re-fetch when province changes

  // Build dynamic filter options with API data
  return useMemo(() => {
    // Build site filter from API sites
    const siteFilterOptions = [
      { labelKey: 'admin.filters.allSites', value: 'all-sites' },
      ...sites.map((site: SiteEntity) => ({
        label: site.name,
        value: site._id, // Use _id as value for filtering
      })),
    ];

    return {
      filters: [
        {
          nameKey: 'admin.filters.site',
          attr: 'site',
          type: 'select' as const,
          placeholderKey: '',
          data: siteFilterOptions,
        },
      ],
      sites, // Return sites data for accessing details
    };
  }, [sites]);
};

/**
 * Hook to get participant filter options (Province and Site)
 * Similar to useSiteFilterOptions but for participants
 * 
 * @param selectedProvinceId - Province ID selected in filter
 * @returns Object containing filter configuration
 */
export const useParticipantFilterOptions = (selectedProvinceId?: string): {
  filters: ReadonlyArray<FilterConfig>;
  sites: SiteEntity[];
} => {
  // State for API data
  const [provinces, setProvinces] = useState<ProvinceEntity[]>([]);
  const [sites, setSites] = useState<SiteEntity[]>([]);

  // Fetch provinces from API on component mount
  useEffect(() => {
    const fetchProvinces = async () => {
      const provincesData = await getProvincesList();
      setProvinces(provincesData);
    };
    fetchProvinces();
  }, []);

  // Fetch sites - all sites initially, filtered by province when selected
  useEffect(() => {
    const fetchSites = async () => {
      try {
        // Fetch all sites if no province selected, or filtered by province if selected
        const sitesResponse = await getSitesByProvince({
          provinceId: selectedProvinceId && selectedProvinceId !== 'all-provinces' && selectedProvinceId !== 'all-Provinces' 
            ? selectedProvinceId 
            : undefined,
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
  }, [selectedProvinceId]); // Re-fetch when province changes

  // Build dynamic filter options with API data
  return useMemo(() => {
    // Build province filter from API provinces
    const provinceFilterOptions = [
      { labelKey: 'admin.filters.allProvinces', value: 'all-provinces' },
      ...provinces.map((province: ProvinceEntity) => ({
        label: province.name,
        value: province._id,
      })),
    ];

    // Build site filter from API sites
    const siteFilterOptions = [
      { labelKey: 'admin.filters.allSites', value: 'all-sites' },
      ...sites.map((site: SiteEntity) => ({
        label: site.name,
        value: site._id,
      })),
    ];

    return {
      filters: [
        {
          nameKey: 'admin.filters.filterByProvince',
          attr: 'filterByProvince',
          type: 'select' as const,
          data: provinceFilterOptions,
        },
        {
          nameKey: 'admin.filters.site',
          attr: 'site',
          type: 'select' as const,
          placeholderKey: '',
          data: siteFilterOptions,
        },
      ],
      sites,
    };
  }, [provinces, sites]);
};

// NOTE: Participant filters are now provided by `useParticipantFilterOptions`.
