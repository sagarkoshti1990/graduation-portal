/**
 * SortDropdown Component
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { SortConfig, ItemKeyMap } from '../types';

interface SortDropdownProps {
  itemKeyMap: ItemKeyMap;
  sortConfig: SortConfig | null;
  onSort: (field: string) => void;
  onClear: () => void;
  style?: any;
}

export const SortDropdown: React.FC<SortDropdownProps> = ({
  itemKeyMap,
  sortConfig,
  onSort,
  onClear,
  style,
}) => {
  const [visible, setVisible] = useState(false);

  const sortableFields = itemKeyMap.filter(
    config => config.sortable !== false && config.type !== 'component',
  );

  const getSortLabel = () => {
    if (!sortConfig) return 'Sort By';

    const field = sortableFields.find(f => f.key === sortConfig.field);
    if (!field) return 'Sort By';

    const arrow = sortConfig.order === 'asc' ? '↑' : '↓';
    return `${field.label} ${arrow}`;
  };

  const handleSort = (field: string) => {
    onSort(field);
    setVisible(false);
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity style={styles.button} onPress={() => setVisible(true)}>
        <Text style={styles.buttonText}>{getSortLabel()}</Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sort By</Text>
              {sortConfig && (
                <TouchableOpacity
                  onPress={() => {
                    onClear();
                    setVisible(false);
                  }}
                >
                  <Text style={styles.clearLink}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>

            <ScrollView style={styles.optionsList}>
              {sortableFields.map(field => {
                const isActive = sortConfig?.field === field.key;
                const arrow = isActive
                  ? sortConfig?.order === 'asc'
                    ? '↑'
                    : '↓'
                  : '';

                return (
                  <TouchableOpacity
                    key={field.key}
                    style={[styles.option, isActive && styles.optionActive]}
                    onPress={() => handleSort(field.key)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        isActive && styles.optionTextActive,
                      ]}
                    >
                      {field.label} {arrow}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    minWidth: 120,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  buttonText: {
    fontSize: 14,
    color: '#333',
    marginRight: 8,
  },
  arrow: {
    fontSize: 10,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    width: '80%',
    maxWidth: 300,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  clearLink: {
    fontSize: 14,
    color: '#007AFF',
  },
  optionsList: {
    maxHeight: 300,
  },
  option: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  optionActive: {
    backgroundColor: '#E3F2FD',
  },
  optionText: {
    fontSize: 14,
    color: '#333',
  },
  optionTextActive: {
    fontWeight: '600',
    color: '#007AFF',
  },
});

export default SortDropdown;
