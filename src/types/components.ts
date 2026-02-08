import { ReactNode, ComponentProps } from 'react';
import type { Modal as GluestackModalType } from '@gluestack-ui/themed';
export interface FeatureCardData {
  id?: string;
  color: string;
  icon: string; // Updated to accept any Lucide icon name
  title: string;
  description: string;
  navigationUrl?: string;
  isDisabled?: boolean;
  pressableActionText?: string;
  isComingSoon?: boolean;
}

export interface FeatureCardProps {
  card: FeatureCardData;
}

export interface SearchBarProps {
  placeholder?: string;
  onSearch: (searchText: string) => void;
  debounceMs?: number;
  defaultValue?: string;
}

export interface TabData {
  key: string;
  label: string;
  isDisabled?: boolean;
  icon?: string; // Optional Lucide icon name
}

export interface TabButtonProps {
  tab: TabData;
  isActive: boolean;
  onPress: (tabKey: string) => void;
  variant?: 'default' | 'ButtonTab'; // Variant to control styling
}

export interface MobileConfig {
  leftRank?: number;        // Field appears in the left column
  rightRank?: number;       // Field appears in the right column
  fullWidthRank?: number;   // Field appears as full width
  showLabel?: boolean;      // Override showLabel for mobile (optional, uses common config if not specified)
  showColumn?: boolean;     // Override showColumn for mobile (optional, uses common config if not specified)
}

export interface DesktopConfig {
  showLabel?: boolean;      // Override showLabel for desktop (optional, uses common config if not specified)
  showColumn?: boolean;     // Override showColumn for desktop (optional, uses common config if not specified)
}

/**
 * Column definition for DataTable
 * Generic column configuration for table display
 */
export interface ColumnDef<T> {
  key: string;
  label: string;
  flex?: number;
  width?: number;
  render?: (item: T) => ReactNode;
  align?: 'left' | 'center' | 'right';
  // Device-specific configuration
  mobileConfig?: MobileConfig; // Mobile-specific layout and visibility configuration
  desktopConfig?: DesktopConfig; // Desktop-specific visibility configuration
}

export interface PaginationConfig {
  enabled?: boolean;           // Enable/disable pagination (default: false)
  pageSize?: number;           // Items per page (default: 10)
  showPageSizeSelector?: boolean; // Show page size dropdown (default: false)
  pageSizeOptions?: number[];  // Available page sizes [10, 25, 50, 100]
  showPageNumbers?: boolean;   // Show page number buttons (default: true)
  maxPageNumbers?: number;     // Max page number buttons to show (default: 5)
  // Server-side pagination props (when provided, overrides client-side calculation)
  serverSide?: {
    count: number;
    total: number;
  };
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
  showHeader?: boolean; // Default: true. Set to false to hide table header row (desktop/table view)
  emptyMessage?: string;
  loadingMessage?: string;
  getRowKey: (item: T) => string;
  // Pagination props
  pagination?: PaginationConfig;
  onPageChange?: (page: number) => void;  // Optional callback when page changes
  onPageSizeChange?: (size: number) => void;  // Optional callback when page size changes
  // Responsive props
  responsive?: boolean;  // Enable responsive card view on mobile (default: true)
  minWidth?: number;  // Minimum width of the table
  _css?: any; // Additional styling props
}

export interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  config: PaginationConfig;
}

/**
 * Modal Props - Single unified modal component that extends Gluestack Modal
 * Header supports: title, description, and icon section
 * Footer is optional (only shows if footerContent or button texts are provided)
 * Body is flexible and accepts children - this is the only part that changes per requirement
 * 
 * Extends all Gluestack Modal props (isOpen, onClose, size, closeOnOverlayClick, etc.)
 * 
 * Usage: Pass header props and body content from where you use it
 */
export interface ModalProps extends Omit<ComponentProps<typeof GluestackModalType>, 'children'> {
  // Header props
  headerTitle?: string | ReactNode; // Title (string will be translated, ReactNode for custom content)
  headerDescription?: string | ReactNode; // Description (string will be translated, ReactNode for custom content)
  headerIcon?: ReactNode; // Icon section (can be any ReactNode)
  showCloseButton?: boolean; // Default: true
  headerAlignment?: 'center' | 'flex-start' | 'flex-end' | 'baseline'; // Alignment for header items
  // Body props - This is the only part that changes per requirement
  children: ReactNode; // Flexible body content
  // Footer props - Either use footerContent (custom) or button texts (simple buttons)
  footerContent?: ReactNode; // Optional custom footer - only shows if provided
  // Simple footer buttons (if provided, footer will be shown with these buttons)
  cancelButtonText?: string | ReactNode; // Cancel button text (if provided, cancel button will be shown)
  confirmButtonText?: string | ReactNode; // Confirm button text (if provided, confirm button will be shown)
  onCancel?: () => void; // Cancel button handler (defaults to onClose if not provided)
  onConfirm?: () => void; // Confirm button handler
  confirmButtonColor?: string; // Confirm button color (defaults to primary500)
  confirmButtonVariant?: 'solid' | 'outline' | 'link'; // Confirm button variant
  // Additional styling
  maxWidth?: number;
  contentProps?: any; // Additional props for ModalContent
  bodyProps?: any; // Additional props for ModalBody
  headerProps?: any; // Additional props for ModalHeader
}

export type ToastPlacement =
  | 'top'
  | 'top-right'
  | 'top-left'
  | 'bottom'
  | 'bottom-right'
  | 'bottom-left';

export interface AlertOptions {
  variant?: 'solid' | 'outline' | 'accent';
  placement?: ToastPlacement;
  duration?: number;
}
