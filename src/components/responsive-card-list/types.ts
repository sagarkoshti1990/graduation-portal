/**
 * Types and Interfaces for ResponsiveCardList Component
 */

import { ReactNode } from 'react';

/**
 * Screen breakpoints
 */
export type ScreenSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Field type in itemKeyMap
 */
export type FieldType = 'string' | 'number' | 'boolean' | 'component' | 'date';

/**
 * Item key mapping configuration
 */
export interface ItemKeyMapConfig {
  key: string; // Field key in the data object
  label: string; // Display label
  type: FieldType; // Type of the field
  component?: (item: any) => ReactNode; // Custom component for rendering
  render?: (value: any, item: any) => ReactNode; // Custom render function
  sortable?: boolean; // Whether this field is sortable
  filterable?: boolean; // Whether this field is filterable
  hidden?: boolean; // Hide this field
}

/**
 * Item key map - array of field configurations
 */
export type ItemKeyMap = ItemKeyMapConfig[];

/**
 * Filter configuration
 */
export interface FilterConfig {
  key: string;
  label: string;
  type: 'text' | 'select' | 'boolean' | 'date' | 'number';
  options?: Array<{ label: string; value: any }>; // For select type
}

/**
 * Sort configuration
 */
export interface SortConfig {
  field: string;
  order: 'asc' | 'desc';
}

/**
 * Main component props
 */
export interface ResponsiveCardListProps {
  // Data
  data: any[]; // Array of data objects
  itemKeyMap?: ItemKeyMap; // Field mapping configuration

  // Storage
  storage_key_name: string; // Storage key for offline data
  enableOfflineMode?: boolean; // Enable offline functionality (default: true)

  // Display
  card_title?: string; // Card title (default: "List of User")
  showDownload?: boolean; // Show download button (default: true)

  // Grid configuration
  columnsConfig?: {
    xs?: number; // Columns for extra small screens
    sm?: number; // Columns for small screens
    md?: number; // Columns for medium screens
    lg?: number; // Columns for large screens
    xl?: number; // Columns for extra large screens
  };

  // Features
  enableSearch?: boolean; // Enable search (default: true)
  enableFilter?: boolean; // Enable filter (default: true)
  enableSort?: boolean; // Enable sort (default: true)

  // Filter configuration
  filterConfig?: FilterConfig[];

  // Styling
  cardStyle?: any; // Custom card style
  containerStyle?: any; // Custom container style

  // Callbacks
  onItemClick?: (item: any) => void; // Called when card is clicked
  onDownload?: (item: any) => void; // Called when download button is clicked
  onRefresh?: () => Promise<void>; // Called when pull to refresh
}

/**
 * Card data state
 */
export interface CardDataState {
  originalData: any[];
  filteredData: any[];
  searchTerm: string;
  filters: Record<string, any>;
  sortConfig: SortConfig | null;
  isOffline: boolean;
}

/**
 * Download options
 */
export interface DownloadOptions {
  format?: 'json' | 'csv';
  fileName?: string;
}

/**
 * Responsive columns configuration
 */
export interface ResponsiveColumnsConfig {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
}
