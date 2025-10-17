/**
 * ResponsiveCardList Component
 * Main container component that brings together all features
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { ResponsiveCardListProps } from './types';
import { useCardData } from './hooks/useCardData';
import { useOfflineStorage } from './hooks/useOfflineStorage';
import { useResponsiveColumns } from './hooks/useResponsiveColumns';
import CardListHeader from './components/CardListHeader';
import CardGrid from './components/CardGrid';
import OfflineIndicator from './components/OfflineIndicator';

/**
 * ResponsiveCardList - Main Component
 *
 * Features:
 * - Responsive grid layout (xs, sm, md, lg, xl breakpoints)
 * - Search functionality
 * - Filter functionality
 * - Sort functionality
 * - Offline storage support
 * - Download individual cards
 * - Customizable field mapping
 */
export const ResponsiveCardList: React.FC<ResponsiveCardListProps> = ({
  // Data
  data,
  itemKeyMap,

  // Storage
  storage_key_name,
  enableOfflineMode = true,

  // Display
  card_title = 'List of User',
  showDownload = true,

  // Grid configuration
  columnsConfig,

  // Features
  enableSearch = true,
  enableFilter = true,
  enableSort = true,

  // Styling
  cardStyle,
  containerStyle,

  // Callbacks
  onItemClick,
  onDownload,
  onRefresh,
}) => {
  // Generate itemKeyMap or auto-detect from data
  const generatedItemKeyMap = React.useMemo(() => {
    // If itemKeyMap is provided, use it
    if (itemKeyMap && itemKeyMap.length > 0) {
      return itemKeyMap;
    }

    // Auto-detect from first data item
    if (data && Array.isArray(data) && data.length > 0) {
      const firstItem = data[0];
      if (firstItem && typeof firstItem === 'object') {
        return Object.keys(firstItem).map(key => ({
          key,
          label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
          type: 'string' as const,
          sortable: true,
          filterable: true,
        }));
      }
    }

    return [];
  }, [itemKeyMap, data]);

  // Hooks
  const { columns, screenSize } = useResponsiveColumns(columnsConfig);

  const {
    isOnline,
    saveToStorage,
    loadFromStorage,
    hasStoredData,
    storageInfo,
  } = useOfflineStorage({
    storageKeyName: storage_key_name,
    enableOfflineMode,
    autoSave: true,
  });

  const {
    displayData,
    originalData,
    searchTerm,
    setSearchTerm,
    clearSearch,
    filters,
    clearFilter,
    clearAllFilters,
    sortConfig,
    sortBy,
    clearSort,
    resultCount,
    refreshData,
  } = useCardData({
    initialData: data || [],
    itemKeyMap: generatedItemKeyMap,
    enableSearch,
    enableFilter,
    enableSort,
  });

  // Save to storage when data changes (if online)
  useEffect(() => {
    if (
      enableOfflineMode &&
      isOnline &&
      data &&
      Array.isArray(data) &&
      data.length > 0
    ) {
      saveToStorage(data).catch(error => {
        console.error('Failed to save to storage:', error);
      });
    }
  }, [data, isOnline, enableOfflineMode, saveToStorage]);

  // Load from storage when offline
  useEffect(() => {
    if (enableOfflineMode && !isOnline && hasStoredData) {
      loadFromStorage()
        .then(storedData => {
          if (storedData.length > 0) {
            refreshData(storedData);
          }
        })
        .catch(error => {
          console.error('Failed to load from storage:', error);
        });
    }
  }, [
    isOnline,
    hasStoredData,
    enableOfflineMode,
    loadFromStorage,
    refreshData,
  ]);

  // Update data when data prop changes
  useEffect(() => {
    refreshData(data || []);
  }, [data, refreshData]);

  const handleRefresh = async () => {
    if (onRefresh) {
      await onRefresh();
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Offline indicator */}
      {enableOfflineMode && !isOnline && (
        <OfflineIndicator isOnline={isOnline} storageInfo={storageInfo} />
      )}

      {/* Header with search, filter, sort */}
      <CardListHeader
        title={card_title}
        itemKeyMap={generatedItemKeyMap}
        enableSearch={enableSearch}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onSearchClear={clearSearch}
        enableSort={enableSort}
        sortConfig={sortConfig}
        onSort={sortBy}
        onSortClear={clearSort}
        enableFilter={enableFilter}
        filters={filters}
        onClearFilter={clearFilter}
        onClearAllFilters={clearAllFilters}
        resultCount={resultCount}
        totalCount={originalData.length}
      />

      {/* Card grid */}
      <CardGrid
        data={displayData}
        itemKeyMap={generatedItemKeyMap}
        columns={columns}
        showDownload={showDownload}
        storageKey={storage_key_name}
        onItemClick={onItemClick}
        onDownload={onDownload}
        onRefresh={onRefresh ? handleRefresh : undefined}
        emptyMessage={
          searchTerm || Object.keys(filters).length > 0
            ? 'No results found. Try adjusting your search or filters.'
            : isOnline
            ? 'No items to display'
            : 'No offline data available'
        }
        style={cardStyle}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
});

export default ResponsiveCardList;
