/**
 * Download utility functions
 */

import { Platform, Alert } from 'react-native';
import { DownloadOptions } from '../types';

/**
 * Convert data to JSON string
 */
export function toJSON(data: any): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Convert data to CSV format
 */
export function toCSV(data: any[], headers?: string[]): string {
  if (data.length === 0) {
    return '';
  }

  // Get headers from first object if not provided
  const csvHeaders = headers || Object.keys(data[0]);

  // Create CSV header row
  const headerRow = csvHeaders.join(',');

  // Create data rows
  const dataRows = data.map(item => {
    return csvHeaders
      .map(header => {
        const value = item[header];
        // Escape quotes and wrap in quotes if contains comma
        const stringValue = String(value ?? '');
        if (stringValue.includes(',') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      })
      .join(',');
  });

  return [headerRow, ...dataRows].join('\n');
}

/**
 * Download data (web implementation)
 */
function downloadWeb(data: string, fileName: string, mimeType: string): void {
  if (typeof window === 'undefined' || !window.document) {
    console.warn('Download not supported in this environment');
    return;
  }

  const blob = new Blob([data], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Download data (React Native implementation)
 * Note: This is a simplified version. For full functionality,
 * consider using react-native-fs or expo-file-system
 */
async function downloadNative(data: string, fileName: string): Promise<void> {
  // For now, just show an alert with the data
  // In production, integrate with file system module
  Alert.alert(
    'Download',
    'File download feature requires additional setup for mobile. Data has been logged to console.',
    [{ text: 'OK' }],
  );
  console.log('Download data:', data);
  console.log('File name:', fileName);
}

/**
 * Download single item
 */
export async function downloadItem(
  item: any,
  options: DownloadOptions = {},
): Promise<void> {
  const format = options.format || 'json';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const defaultFileName = `item_${timestamp}.${format}`;
  const fileName = options.fileName || defaultFileName;

  try {
    let data: string;
    let mimeType: string;

    if (format === 'json') {
      data = toJSON(item);
      mimeType = 'application/json';
    } else {
      data = toCSV([item]);
      mimeType = 'text/csv';
    }

    if (Platform.OS === 'web') {
      downloadWeb(data, fileName, mimeType);
    } else {
      await downloadNative(data, fileName);
    }
  } catch (error) {
    console.error('Error downloading item:', error);
    Alert.alert('Error', 'Failed to download item');
  }
}

/**
 * Download multiple items
 */
export async function downloadItems(
  items: any[],
  options: DownloadOptions = {},
): Promise<void> {
  const format = options.format || 'json';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const defaultFileName = `items_${timestamp}.${format}`;
  const fileName = options.fileName || defaultFileName;

  try {
    let data: string;
    let mimeType: string;

    if (format === 'json') {
      data = toJSON(items);
      mimeType = 'application/json';
    } else {
      data = toCSV(items);
      mimeType = 'text/csv';
    }

    if (Platform.OS === 'web') {
      downloadWeb(data, fileName, mimeType);
    } else {
      await downloadNative(data, fileName);
    }
  } catch (error) {
    console.error('Error downloading items:', error);
    Alert.alert('Error', 'Failed to download items');
  }
}

/**
 * Format download file name
 */
export function formatFileName(baseName: string, format: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const cleanName = baseName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  return `${cleanName}_${timestamp}.${format}`;
}
