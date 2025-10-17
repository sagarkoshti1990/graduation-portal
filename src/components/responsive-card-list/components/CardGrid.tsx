/**
 * CardGrid Component
 * Grid container for cards with responsive columns
 */

import React from 'react';
import { View, StyleSheet, FlatList, Text } from 'react-native';
import { ItemKeyMap } from '../types';
import CardItem from './CardItem';

interface CardGridProps {
  data: any[];
  itemKeyMap: ItemKeyMap;
  columns: number;
  showDownload?: boolean;
  storageKey?: string;
  onItemClick?: (item: any) => void;
  onDownload?: (item: any) => void;
  onRefresh?: () => Promise<void>;
  emptyMessage?: string;
  style?: any;
}

export const CardGrid: React.FC<CardGridProps> = ({
  data,
  itemKeyMap,
  columns,
  showDownload = true,
  storageKey,
  onItemClick,
  onDownload,
  onRefresh,
  emptyMessage = 'No items to display',
  style,
}) => {
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    if (!onRefresh) return;

    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const columnWidth = 100 / columns;

    return (
      <View style={{ width: `${columnWidth}%`, padding: 8 }}>
        <CardItem
          item={item}
          itemKeyMap={itemKeyMap}
          showDownload={showDownload}
          storageKey={storageKey}
          onItemClick={onItemClick}
          onDownload={onDownload}
        />
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>{emptyMessage}</Text>
    </View>
  );

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={(item, index) => item.id || `item-${index}`}
      numColumns={columns}
      key={columns} // Force re-render when columns change
      contentContainerStyle={[styles.gridContainer, style]}
      ListEmptyComponent={renderEmpty}
      refreshing={refreshing}
      onRefresh={onRefresh ? handleRefresh : undefined}
    />
  );
};

const styles = StyleSheet.create({
  gridContainer: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});

export default CardGrid;
