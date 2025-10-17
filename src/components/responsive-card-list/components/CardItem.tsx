/**
 * CardItem Component
 * Displays a single card with item data
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ItemKeyMap } from '../types';
import CardItemField from './CardItemField';
import DownloadButton from './DownloadButton';

interface CardItemProps {
  item: any;
  itemKeyMap: ItemKeyMap;
  showDownload?: boolean;
  storageKey?: string;
  onItemClick?: (item: any) => void;
  onDownload?: (item: any) => void;
  style?: any;
}

export const CardItem: React.FC<CardItemProps> = ({
  item,
  itemKeyMap,
  showDownload = true,
  storageKey,
  onItemClick,
  onDownload,
  style,
}) => {
  const handlePress = () => {
    if (onItemClick) {
      onItemClick(item);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={handlePress}
      disabled={!onItemClick}
      activeOpacity={onItemClick ? 0.7 : 1}
    >
      <View style={styles.content}>
        {/* Render all fields */}
        {itemKeyMap.map(config => (
          <CardItemField key={config.key} item={item} config={config} />
        ))}
      </View>

      {/* Save Offline button */}
      {showDownload && (
        <View style={styles.footer}>
          <DownloadButton
            item={item}
            storageKey={storageKey}
            onDownload={onDownload}
          />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  content: {
    marginBottom: 12,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
    alignItems: 'flex-start',
  },
});

export default CardItem;
