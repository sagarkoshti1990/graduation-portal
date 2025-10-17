/**
 * CardListHeader Component
 * Header with title, search, filter, and sort controls
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ItemKeyMap, SortConfig } from '../types';
import SearchBar from './SearchBar';
import SortDropdown from './SortDropdown';
import FilterBar from './FilterBar';

interface CardListHeaderProps {
  title: string;
  itemKeyMap: ItemKeyMap;

  // Search
  enableSearch?: boolean;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSearchClear: () => void;

  // Sort
  enableSort?: boolean;
  sortConfig: SortConfig | null;
  onSort: (field: string) => void;
  onSortClear: () => void;

  // Filter
  enableFilter?: boolean;
  filters: Record<string, any>;
  onClearFilter: (key: string) => void;
  onClearAllFilters: () => void;

  // Stats
  resultCount: number;
  totalCount: number;

  style?: any;
}

export const CardListHeader: React.FC<CardListHeaderProps> = ({
  title,
  itemKeyMap,
  enableSearch = true,
  searchTerm,
  onSearchChange,
  onSearchClear,
  enableSort = true,
  sortConfig,
  onSort,
  onSortClear,
  enableFilter = true,
  filters,
  onClearFilter,
  onClearAllFilters,
  resultCount,
  totalCount,
  style,
}) => {
  const showingFiltered = resultCount !== totalCount;

  return (
    <View style={[styles.container, style]}>
      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.count}>
          {showingFiltered
            ? `${resultCount} of ${totalCount}`
            : `${totalCount} items`}
        </Text>
      </View>

      {/* Search and Sort Controls */}
      {(enableSearch || enableSort) && (
        <View style={styles.controlsRow}>
          {enableSearch && (
            <View style={styles.searchContainer}>
              <SearchBar
                value={searchTerm}
                onChangeText={onSearchChange}
                onClear={onSearchClear}
                placeholder="Search..."
              />
            </View>
          )}

          {enableSort && (
            <View style={styles.sortContainer}>
              <SortDropdown
                itemKeyMap={itemKeyMap}
                sortConfig={sortConfig}
                onSort={onSort}
                onClear={onSortClear}
              />
            </View>
          )}
        </View>
      )}

      {/* Active Filters */}
      {enableFilter && (
        <FilterBar
          filters={filters}
          onClearFilter={onClearFilter}
          onClearAll={onClearAllFilters}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  count: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  searchContainer: {
    flex: 1,
  },
  sortContainer: {
    minWidth: 140,
  },
});

export default CardListHeader;
