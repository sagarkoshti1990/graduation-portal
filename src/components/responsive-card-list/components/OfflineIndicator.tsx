/**
 * OfflineIndicator Component
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface OfflineIndicatorProps {
  isOnline: boolean;
  storageInfo: { count: number; lastUpdated: string | null };
  style?: any;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  isOnline,
  storageInfo,
  style,
}) => {
  if (isOnline) {
    return null;
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown';

    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.indicator} />
      <View style={styles.textContainer}>
        <Text style={styles.title}>Offline Mode</Text>
        <Text style={styles.subtitle}>
          Showing {storageInfo.count} cached items
        </Text>
        {storageInfo.lastUpdated && (
          <Text style={styles.timestamp}>
            Last updated: {formatDate(storageInfo.lastUpdated)}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF9800',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E65100',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: '#F57C00',
  },
  timestamp: {
    fontSize: 10,
    color: '#FF9800',
    marginTop: 2,
  },
});

export default OfflineIndicator;
