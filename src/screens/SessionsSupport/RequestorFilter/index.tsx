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
  pillarOptions?: any[];
  typeOptions?: any[];
  statusOptions?: any[];
  formatOptions: any[];
  hideProvince?: boolean;
  initialValue?: Record<string, any>;
  shouldDisableSite?: boolean;
  shouldDisableType?: boolean;
}

export const RequestorFilter: React.FC<RequestorFilterProps> = ({
  filters,
  onFilterChange,
  provinceOptions,
  siteOptions,
  pillarOptions,
  typeOptions,
  statusOptions,
  formatOptions,
  hideProvince,
  initialValue,
  shouldDisableSite,
  shouldDisableType,
}) => {
  const [dropdownFilters, setDropdownFilters] = useState<Record<string, any>>({});
  const [searchQuery, setSearchQuery] = useState(filters.search || '');
  const isInitialMount = useRef(true);

  // Map dynamic data into static filter configuration
  const configData = useMemo(() => {
    return REQUESTOR_FILTERS.filter((item) => !(hideProvince && item.attr === 'province')).map((item) => {
      if (item.attr === 'province') {
        return { ...item, data: provinceOptions };
      }
      if (item.attr === 'site') {
        return { ...item, data: siteOptions, disabled: shouldDisableSite };
      }
      if (item.attr === 'pillar') {
        return { ...item, data: pillarOptions || item.data };
      }
      if (item.attr === 'type') {
        return { ...item, data: typeOptions || item.data, disabled: shouldDisableType };
      }
      if (item.attr === 'status') {
        return { ...item, data: statusOptions || item.data };
      }
      if (item.attr === 'format') {
        return { ...item, data: formatOptions };
      }
      return item;
    });
  }, [provinceOptions, siteOptions, pillarOptions, typeOptions, statusOptions, formatOptions, hideProvince, shouldDisableSite, shouldDisableType,]);

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
        initialValue={initialValue}
        hideTitleHeader={true}
        showClearButton={false}
        _container={styles.requestorFilterButton}
        _input={styles.requestorFilterInput}
      />
    </VStack>
  );
};
