/**
 * DownloadButton Component
 * Saves individual items to offline storage
 */

import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface DownloadButtonProps {
  item: any;
  storageKey?: string;
  onDownload?: (item: any) => void;
  style?: any;
}

export const DownloadButton: React.FC<DownloadButtonProps> = ({
  item,
  storageKey = 'offline_items',
  onDownload,
  style,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);

      // Call custom callback if provided
      if (onDownload) {
        onDownload(item);
      }

      // Save item to offline storage
      const itemStorageKey = `${storageKey}_${item.id || Date.now()}`;
      await AsyncStorage.setItem(itemStorageKey, JSON.stringify(item));

      // Also add to index for tracking
      const indexKey = `${storageKey}_index`;
      const existingIndex = await AsyncStorage.getItem(indexKey);
      const index = existingIndex ? JSON.parse(existingIndex) : [];

      if (!index.includes(itemStorageKey)) {
        index.push(itemStorageKey);
        await AsyncStorage.setItem(indexKey, JSON.stringify(index));
      }

      // Show success message
      Alert.alert('Success', 'Item saved offline successfully');
    } catch (error) {
      console.error('Save offline error:', error);
      Alert.alert('Error', 'Failed to save item offline');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handleDownload}
      disabled={isDownloading}
    >
      {isDownloading ? (
        <ActivityIndicator size="small" color="#007AFF" />
      ) : (
        <Text style={styles.buttonText}>💾 Save Offline</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  buttonText: {
    color: '#1976D2',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default DownloadButton;
