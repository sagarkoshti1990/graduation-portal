/**
 * Hook for card data management
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { CardDataState, SortConfig, ItemKeyMap } from '../types';
import { filterBySearch, applyFilters } from '../utils/filtering';
import { sortData } from '../utils/sorting';

interface UseCardDataOptions {
  initialData: any[];
  itemKeyMap?: ItemKeyMap;
  enableSearch?: boolean;
  enableFilter?: boolean;
  enableSort?: boolean;
}

interface UseCardDataReturn {
  // Data
  displayData: any[];
  originalData: any[];

  // Search
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  clearSearch: () => void;

  // Filters
  filters: Record<string, any>;
  setFilter: (key: string, value: any) => void;
  clearFilter: (key: string) => void;
  clearAllFilters: () => void;

  // Sort
  sortConfig: SortConfig | null;
  setSortConfig: (config: SortConfig | null) => void;
  sortBy: (field: string) => void;
  clearSort: () => void;

  // State
  isFiltered: boolean;
  isSearching: boolean;
  isSorted: boolean;
  resultCount: number;

  // Actions
  resetAll: () => void;
  refreshData: (newData: any[]) => void;
}

/**
 * Hook for managing card list data with search, filter, and sort
 */
export function useCardData(options: UseCardDataOptions): UseCardDataReturn {
  const {
    initialData,
    itemKeyMap,
    enableSearch = true,
    enableFilter = true,
    enableSort = true,
  } = options;

  const [state, setState] = useState<CardDataState>({
    originalData: initialData,
    filteredData: initialData,
    searchTerm: '',
    filters: {},
    sortConfig: null,
    isOffline: false,
  });

  // Get searchable fields from itemKeyMap
  const searchableFields = useMemo(() => {
    if (!itemKeyMap || itemKeyMap.length === 0) {
      return [];
    }
    return itemKeyMap
      .filter(config => config.type !== 'component')
      .map(config => config.key);
  }, [itemKeyMap]);

  // Update original data when initialData changes
  useEffect(() => {
    setState(prev => ({
      ...prev,
      originalData: initialData,
    }));
  }, [initialData]);

  // Process data: search -> filter -> sort
  const displayData = useMemo(() => {
    let result = [...state.originalData];

    // Apply search
    if (enableSearch && state.searchTerm) {
      result = filterBySearch(result, state.searchTerm, searchableFields);
    }

    // Apply filters
    if (enableFilter && Object.keys(state.filters).length > 0) {
      result = applyFilters(result, state.filters);
    }

    // Apply sort
    if (enableSort && state.sortConfig) {
      result = sortData(result, state.sortConfig);
    }

    return result;
  }, [
    state.originalData,
    state.searchTerm,
    state.filters,
    state.sortConfig,
    searchableFields,
    enableSearch,
    enableFilter,
    enableSort,
  ]);

  // Computed states
  const isSearching = Boolean(state.searchTerm);
  const isFiltered = Object.keys(state.filters).length > 0;
  const isSorted = state.sortConfig !== null;
  const resultCount = displayData.length;

  // Search functions
  const setSearchTerm = useCallback((term: string) => {
    setState(prev => ({ ...prev, searchTerm: term }));
  }, []);

  const clearSearch = useCallback(() => {
    setState(prev => ({ ...prev, searchTerm: '' }));
  }, []);

  // Filter functions
  const setFilter = useCallback((key: string, value: any) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, [key]: value },
    }));
  }, []);

  const clearFilter = useCallback((key: string) => {
    setState(prev => {
      const newFilters = { ...prev.filters };
      delete newFilters[key];
      return { ...prev, filters: newFilters };
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setState(prev => ({ ...prev, filters: {} }));
  }, []);

  // Sort functions
  const setSortConfig = useCallback((config: SortConfig | null) => {
    setState(prev => ({ ...prev, sortConfig: config }));
  }, []);

  const sortBy = useCallback((field: string) => {
    setState(prev => {
      const currentConfig = prev.sortConfig;

      // Toggle sort order if same field
      if (currentConfig && currentConfig.field === field) {
        return {
          ...prev,
          sortConfig: {
            field,
            order: currentConfig.order === 'asc' ? 'desc' : 'asc',
          },
        };
      }

      // New field, default to ascending
      return {
        ...prev,
        sortConfig: { field, order: 'asc' },
      };
    });
  }, []);

  const clearSort = useCallback(() => {
    setState(prev => ({ ...prev, sortConfig: null }));
  }, []);

  // Reset all filters, search, and sort
  const resetAll = useCallback(() => {
    setState(prev => ({
      ...prev,
      searchTerm: '',
      filters: {},
      sortConfig: null,
    }));
  }, []);

  // Refresh data with new data
  const refreshData = useCallback((newData: any[]) => {
    setState(prev => ({
      ...prev,
      originalData: newData,
    }));
  }, []);

  return {
    // Data
    displayData,
    originalData: state.originalData,

    // Search
    searchTerm: state.searchTerm,
    setSearchTerm,
    clearSearch,

    // Filters
    filters: state.filters,
    setFilter,
    clearFilter,
    clearAllFilters,

    // Sort
    sortConfig: state.sortConfig,
    setSortConfig,
    sortBy,
    clearSort,

    // State
    isFiltered,
    isSearching,
    isSorted,
    resultCount,

    // Actions
    resetAll,
    refreshData,
  };
}

export default useCardData;
