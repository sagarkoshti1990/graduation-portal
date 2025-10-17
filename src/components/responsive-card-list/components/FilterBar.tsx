/**
 * FilterBar Component
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

interface FilterBarProps {
  filters: Record<string, any>;
  onClearFilter: (key: string) => void;
  onClearAll: () => void;
  style?: any;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onClearFilter,
  onClearAll,
  style,
}) => {
  const activeFilters = Object.entries(filters).filter(
    ([_, value]) => value !== null && value !== undefined && value !== '',
  );

  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {activeFilters.map(([key, value]) => (
          <View key={key} style={styles.filterChip}>
            <Text style={styles.filterText}>
              {key}: {String(value)}
            </Text>
            <TouchableOpacity
              onPress={() => onClearFilter(key)}
              style={styles.removeButton}
            >
              <Text style={styles.removeText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}

        {activeFilters.length > 1 && (
          <TouchableOpacity onPress={onClearAll} style={styles.clearAllButton}>
            <Text style={styles.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  scrollContent: {
    paddingVertical: 4,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
    paddingVertical: 6,
    paddingLeft: 12,
    paddingRight: 8,
    marginRight: 8,
  },
  filterText: {
    fontSize: 12,
    color: '#1976D2',
    marginRight: 4,
  },
  removeButton: {
    padding: 2,
  },
  removeText: {
    fontSize: 14,
    color: '#1976D2',
  },
  clearAllButton: {
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#FFF3E0',
    borderRadius: 16,
  },
  clearAllText: {
    fontSize: 12,
    color: '#F57C00',
    fontWeight: '600',
  },
});

export default FilterBar;
