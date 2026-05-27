/**
 * Assign Users Filter Configurations
 * Data-driven filter definitions for the Assign Users screen
 * All filter logic for assigning LCs to Supervisors and Participants to LCs
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { getProvincesList, getSitesByProvince } from '../services/usersService';
import { getSupervisorsByProvince } from '../services/assignUsersService';
import type { FilterConfig, PaginatedSelectFetchParams, PaginatedSelectFetchResult } from './USER_MANAGEMENT';
import type { ProvinceEntity, AdminUserManagementData, SiteEntity } from '@app-types/Users';

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
 * Hook to get supervisor filter options.
 * Returns a province (regular select) + supervisor (paginated-select that queries the API
 * on demand, filtered by the currently selected province).
 *
 * The supervisor list is no longer pre-fetched; PaginatedSelect handles lazy loading.
 */
export const useSupervisorFilterOptions = (
  filters: Record<string, any> = {},
  enabled = true
): {
  filters: ReadonlyArray<FilterConfig>;
} => {
  const [provinces, setProvinces] = useState<ProvinceEntity[]>([]);

  useEffect(() => {
    if (!enabled) {
      setProvinces([]);
      return;
    }
    const fetchProvinces = async () => {
      const provincesData = await getProvincesList();
      setProvinces(provincesData);
    };
    fetchProvinces();
  }, [enabled]);

  // Fetch function for the supervisor PaginatedSelect — closes over current province
  const supervisorFetchFn = useCallback(
    async ({ page, limit, search }: PaginatedSelectFetchParams): Promise<PaginatedSelectFetchResult> => {
      const selectedProvince = filters.filterByProvince;
      const response = await getSupervisorsByProvince({
        provinceId:
          selectedProvince &&
          selectedProvince !== 'all-provinces' &&
          selectedProvince !== 'all-Provinces'
            ? selectedProvince
            : undefined,
        page,
        limit,
        search
      });
      const data = response.result?.data || [];
      return {
        data: data.map((s: any) => ({
          label: s.name || s.full_name || s.email || 'Unknown',
          value: String(s.id || s._id || s.email || ''),
          // Spread raw fields so the screen can access province/site info on selection
          ...s,
        })),
        total:
          response.result?.total ??
          response.result?.count ??
          data.length,
      };
    },
    // Regenerate when province changes so the new fetch closes over the new province value
    [filters.filterByProvince],
  );

  return useMemo(() => {
    const provinceFilterOptions = [
      { labelKey: 'admin.filters.allProvinces', value: 'all-provinces' },
      ...provinces.map((province: ProvinceEntity) => ({
        label: province.name,
        value: province._id,
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
          nameKey: 'admin.filters.selectSupervisor',
          attr: 'selectSupervisor',
          type: 'paginated-select' as const,
          placeholderKey: 'admin.filters.chooseSupervisor',
          fetchFn: supervisorFetchFn,
          // Clear supervisor list when province changes
          dependencyAttr: 'filterByProvince',
          dependencyKey: filters.filterByProvince ?? null,
          pageSize: 20,
          showSearch: true,
        },
      ],
    };
  }, [provinces, supervisorFetchFn, filters.filterByProvince]);
};

/**
 * Hook to get site filter options
 * Fetches all sites initially, filtered by province when selected
 * 
 * @param selectedProvinceId - Province ID selected in Step 1 (from supervisorFilterValues.filterByProvince)
 * @returns Object containing site filter configuration
 */
export const useSiteFilterOptions = (
  selectedProvinceId?: string,
  enabled = true
): {
  filters: ReadonlyArray<FilterConfig>;
  sites: SiteEntity[];
} => {
  // State for API data
  const [sites, setSites] = useState<SiteEntity[]>([]);

  // Fetch sites - all sites initially, filtered by province when selected
  useEffect(() => {
    if (!enabled) {
      setSites([]);
      return;
    }

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
        console.error('Error fetching sites:', error);
        setSites([]);
      }
    };

    fetchSites();
  }, [enabled, selectedProvinceId]); // Re-fetch when province changes

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
  }, [sites, selectedProvinceId]);
};

/**
 * Hook to get participant filter options (Province and Site)
 * Similar to useSiteFilterOptions but for participants
 * 
 * @param selectedProvinceId - Province ID selected in filter
 * @returns Object containing filter configuration
 */
export const useParticipantFilterOptions = (
  selectedProvinceId?: string,
  enabled = true
): {
  filters: ReadonlyArray<FilterConfig>;
  sites: SiteEntity[];
} => {
  // State for API data
  const [provinces, setProvinces] = useState<ProvinceEntity[]>([]);
  const [sites, setSites] = useState<SiteEntity[]>([]);

  // Fetch provinces from API on component mount
  useEffect(() => {
    if (!enabled) {
      setProvinces([]);
      return;
    }

    const fetchProvinces = async () => {
      const provincesData = await getProvincesList();
      setProvinces(provincesData);
    };
    fetchProvinces();
  }, [enabled]);

  // Fetch sites - all sites initially, filtered by province when selected
  useEffect(() => {
    if (!enabled) {
      setSites([]);
      return;
    }

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
        console.error('Error fetching sites:', error);
        setSites([]);
      }
    };

    fetchSites();
  }, [enabled, selectedProvinceId]); // Re-fetch when province changes

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
  }, [provinces, sites, selectedProvinceId]);
};

// NOTE: Participant filters are now provided by `useParticipantFilterOptions`.
