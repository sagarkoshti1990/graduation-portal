import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Box, VStack } from '@ui';
import SearchBar from '@components/SearchBar';
import FilterButton from '@components/Filter';
import { REQUESTOR_FILTERS } from '../../../constants/REQUESTOR_CONSTANTS';
import styles from '../styles';

interface RequestorFilterProps {
  filters: Record<string, any>;
  onFilterChange: (filters: Record<string, any>) => void;
  provinceOptions: any[];
  siteOptions: any[];
  pathwayOptions: any[];
  formatOptions: any[];
  shouldDisableSite?: boolean;
}

export const RequestorFilter: React.FC<RequestorFilterProps> = ({
  filters,
  onFilterChange,
  provinceOptions,
  siteOptions,
  pathwayOptions,
  formatOptions,
  shouldDisableSite,
}) => {
  const [dropdownFilters, setDropdownFilters] = useState<Record<string, any>>({});
  const [searchQuery, setSearchQuery] = useState(filters.search || '');
  const isInitialMount = useRef(true);

  // Map dynamic data into static filter configuration
  const configData = useMemo(() => {
    return REQUESTOR_FILTERS.map((item) => {
      if (item.attr === 'province') {
        return { ...item, data: provinceOptions };
      }
      if (item.attr === 'site') {
        return { ...item, data: siteOptions, disabled: shouldDisableSite };
      }
      if (item.attr === 'pathway') {
        return { ...item, data: pathwayOptions };
      }
      if (item.attr === 'format') {
        return { ...item, data: formatOptions };
      }
      return item;
    });
  }, [provinceOptions, siteOptions, pathwayOptions, formatOptions, shouldDisableSite]);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  const handleDropdownChange = (newDropdownFilters: Record<string, any>) => {
    setDropdownFilters(newDropdownFilters);
  };

  // Combine search query and dropdown filters, notify parent component
  useEffect(() => {
    // Avoid double initial triggers on mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    onFilterChange({
      search: searchQuery,
      ...dropdownFilters,
    });
  }, [searchQuery, dropdownFilters]);

  return (
    <VStack {...styles.requestorFilterContainer}>
      <SearchBar
        placeholder="participants.searchByNameOrId"
        onSearch={handleSearch}
        defaultValue={filters.search || ''}
      />
      <FilterButton
        data={configData}
        onFilterChange={handleDropdownChange}
        hideTitleHeader={true}
        showClearButton={false}
        _container={styles.requestorFilterButton}
        _input={styles.requestorFilterInput}
      />
    </VStack>
  );
};
