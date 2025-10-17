/**
 * CardItemField Component
 * Renders individual field in a card based on field type
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ItemKeyMapConfig } from '../types';
import { getNestedValue } from '../utils/filtering';

interface CardItemFieldProps {
  item: any;
  config: ItemKeyMapConfig;
  style?: any;
}

export const CardItemField: React.FC<CardItemFieldProps> = ({
  item,
  config,
  style,
}) => {
  if (config.hidden) {
    return null;
  }

  const value = getNestedValue(item, config.key);

  // Use custom component if provided
  if (config.component) {
    return (
      <View style={[styles.fieldContainer, style]}>
        <Text style={styles.label}>{config.label}:</Text>
        <View style={styles.componentWrapper}>{config.component(item)}</View>
      </View>
    );
  }

  // Use custom render function if provided
  if (config.render) {
    return (
      <View style={[styles.fieldContainer, style]}>
        <Text style={styles.label}>{config.label}:</Text>
        <View style={styles.componentWrapper}>
          {config.render(value, item)}
        </View>
      </View>
    );
  }

  // Render based on type
  const renderValue = () => {
    if (value === null || value === undefined) {
      return <Text style={styles.emptyValue}>N/A</Text>;
    }

    switch (config.type) {
      case 'boolean':
        return (
          <Text
            style={[styles.value, value ? styles.trueValue : styles.falseValue]}
          >
            {value ? 'Yes' : 'No'}
          </Text>
        );

      case 'number':
        return (
          <Text style={styles.value}>{Number(value).toLocaleString()}</Text>
        );

      case 'date':
        const date = value instanceof Date ? value : new Date(value);
        return <Text style={styles.value}>{date.toLocaleDateString()}</Text>;

      case 'string':
      default:
        return <Text style={styles.value}>{String(value)}</Text>;
    }
  };

  return (
    <View style={[styles.fieldContainer, style]}>
      <Text style={styles.label}>{config.label}:</Text>
      {renderValue()}
    </View>
  );
};

const styles = StyleSheet.create({
  fieldContainer: {
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    color: '#333',
  },
  emptyValue: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  trueValue: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  falseValue: {
    color: '#F44336',
    fontWeight: '600',
  },
  componentWrapper: {
    marginTop: 4,
  },
});

export default CardItemField;
