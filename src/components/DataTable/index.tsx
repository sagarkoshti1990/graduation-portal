/**
 * DataTable Component

 */

import React, { useState, useEffect, useMemo, ReactNode } from 'react';
import { Box, HStack, Text, Pressable, VStack, Card } from '@ui';
import { ScrollView } from 'react-native';
import { theme } from '@config/theme';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';
import { useLanguage } from '@contexts/LanguageContext';
import { DataTableProps, ColumnDef } from '@app-types/components';
import { usePlatform } from '@utils/platform';
import PaginationControls from './PaginationControls';
import { styles } from './Styles';

/**
 * Pre-computed header column data for TableHeader component.
 * All calculations (filtering, translation, showLabel) are done in parent DataTable.
 */
interface TableHeaderProps<T> {
  columns: ColumnDef<T>[];
  minWidth?: number;
  _tableHeader?: any;
  _th?: any;
  _thText?: any;
}

interface TableRowProps<T> {
  item: T;
  columns: ColumnDef<T>[];
  onRowClick?: (item: T) => void;
  minWidth?: number;
  isLast?: boolean;
}

interface CardLayoutRow<T> {
  type: 'fullWidth' | 'leftRight';
  columns: (CardColumn<T> | null)[];
}

interface CardColumn<T> {
  key: string;
  label: string; // Pre-translated label
  showLabel: boolean;
  render?: (item: T) => ReactNode;
  defaultValue?: string;
  isRightColumn?: boolean;
}

interface CardViewProps<T> {
  item: T;
  layout: CardLayoutRow<T>[];
  onRowClick?: (item: T) => void;
}

interface EmptyStateProps {
  message: string; // Pre-translated message
}

interface LoadingStateProps {
  message: string; // Pre-translated message
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Prepares card layout for mobile view by categorizing and organizing columns.
 * Pure function that can be used outside the component.
 */
function prepareCardLayout<T>(
  columns: ColumnDef<T>[],
  translate: (key: string) => string
): CardLayoutRow<T>[] {
  const left: ColumnDef<T>[] = [];
  const right: ColumnDef<T>[] = [];
  const full: ColumnDef<T>[] = [];

  // Filter columns that should be shown on mobile
  const visibleColumns = columns.filter(col => {
    const mobileConfig = col.mobileConfig || {};
    return mobileConfig.showColumn !== undefined ? mobileConfig.showColumn : true;
  });

  // Categorize columns based on priority: fullWidthRank > leftRank > rightRank
  visibleColumns.forEach(col => {
    const c = col.mobileConfig || {};
    if (c.fullWidthRank !== undefined) {
      full.push(col);
    } else if (c.leftRank !== undefined) {
      left.push(col);
    } else if (c.rightRank !== undefined) {
      right.push(col);
    }
  });

  // Sort each array by its respective rank
  left.sort((a, b) => (a.mobileConfig?.leftRank || 0) - (b.mobileConfig?.leftRank || 0));
  right.sort((a, b) => (a.mobileConfig?.rightRank || 0) - (b.mobileConfig?.rightRank || 0));
  full.sort((a, b) => (a.mobileConfig?.fullWidthRank || 0) - (b.mobileConfig?.fullWidthRank || 0));

  const rows: CardLayoutRow<T>[] = [];

  // Create horizontal rows (left + right pairs)
  const maxRows = Math.max(left.length, right.length);
  for (let i = 0; i < maxRows; i++) {
    const leftCol = left[i];
    const rightCol = right[i];
    
    const cardColumns: (CardColumn<T> | null)[] = [];
    if (leftCol) {
      const mobileConfig = leftCol.mobileConfig || {};
      const showLabel = mobileConfig.showLabel !== undefined ? mobileConfig.showLabel : true;
      cardColumns.push({
        key: leftCol.key,
        label: translate(leftCol.label),
        showLabel,
        render: leftCol.render,
        isRightColumn: false,
      });
    } else {
      cardColumns.push(null);
    }
    
    if (rightCol) {
      const mobileConfig = rightCol.mobileConfig || {};
      const showLabel = mobileConfig.showLabel !== undefined ? mobileConfig.showLabel : true;
      cardColumns.push({
        key: rightCol.key,
        label: translate(rightCol.label),
        showLabel,
        render: rightCol.render,
        isRightColumn: true,
      });
    } else {
      cardColumns.push(null);
    }
    
    rows.push({
      type: 'leftRight',
      columns: cardColumns,
    });
  }

  // Add full-width fields at the end
  if (full.length > 0) {
    const fullWidthColumns: CardColumn<T>[] = full.map(col => {
      const mobileConfig = col.mobileConfig || {};
      const showLabel = mobileConfig.showLabel !== undefined ? mobileConfig.showLabel : true;
      return {
        key: col.key,
        label: translate(col.label),
        showLabel,
        render: col.render,
      };
    });
    rows.push({
      type: 'fullWidth',
      columns: fullWidthColumns,
    });
  }

  return rows;
}

// ============================================================================
// CHILD COMPONENTS - Pure Presentational Components
// ============================================================================

/**
 * TableHeader Component
 * Pure presentational component that renders pre-computed column headers.
 */
const TableHeader = <T,>({ columns, minWidth,_tableHeader,_th,_thText}: TableHeaderProps<T>) => {
  const { t } = useLanguage();
  
  return (
    <HStack
      {...styles.tableHeader}
      minWidth={minWidth}
      {..._tableHeader}
    >
      {columns.map(column => {
        const showLabel = column.desktopConfig?.showLabel ?? true;
        return (
          <Box
            {..._th}
            key={column.key}
            flex={column.flex}
            width={column.width}
            alignItems={
              column.align === 'center'
                ? 'center'
                : column.align === 'right'
                  ? 'flex-end'
                  : 'flex-start'
            }
          >
            {showLabel && (
              <Text {...TYPOGRAPHY.label} color="$textForeground" {..._thText}>
                {t(column.label)}
              </Text>
            )}
          </Box>
        );
      })}
    </HStack>
  );
};

/**
 * TableRow Component
 * Pure presentational component that renders a single table row with pre-computed columns.
 */
const TableRow = <T,>({
  item,
  columns,
  onRowClick,
  minWidth,
  isLast = false,
}: TableRowProps<T>) => {
  // Only wrap in Pressable if onRowClick is provided
  return (
    <TableRowWrapper
      onRowClick={() => onRowClick?.(item)}
    >
      <HStack
        {...styles.tableRow}
        borderBottomWidth={isLast ? styles.tableRowLast.borderBottomWidth : styles.tableRowNotLast.borderBottomWidth}
        minWidth={minWidth}
      >
        {columns.map(column => (
          <Box
            key={column.key}
            flex={column.flex}
            width={column.width}
            alignItems={
              column.align === 'center'
                ? 'center'
                : column.align === 'right'
                  ? 'flex-end'
                  : 'flex-start'
            }
          >
            {column.render ? (
              column.render(item)
            ) : (
              <Text
                {...TYPOGRAPHY.paragraph}
                color="$textMutedForeground"
              >
                {String((item as any)[column.key] ?? '-')}
              </Text>
            )}
          </Box>
        ))}
      </HStack>
    </TableRowWrapper>
  );
};

const TableRowWrapper = ({ children, onRowClick }: { children: ReactNode, onRowClick: () => void }) => {
  if (onRowClick) {
    return (
      <Pressable
        onPress={onRowClick}
        $web-cursor="pointer"
      >
        {children}
      </Pressable>
    );
  }
  return children;
};

/**
 * CardView Component
 * Pure presentational component that renders data in card format for mobile view.
 * Layout is pre-computed in parent DataTable.
 */
const CardView = <T,>({
  item,
  layout,
  onRowClick,
}: CardViewProps<T>) => {
  return (
    <Pressable
      onPress={() => onRowClick?.(item)}
      $web-cursor={onRowClick ? 'pointer' : 'auto'}
    >
      <Card {...styles.cardContainer}>
        <VStack {...styles.cardContent}>
          {layout.map((row, rowIndex) => {
            // Full width rows
            if (row.type === 'fullWidth') {
              return (
                <VStack key={rowIndex} {...styles.cardFullWidthRow}>
                  {row.columns.map((col, colIndex) => {
                    if (!col) return null;
                    return (
                      <VStack key={col.key || colIndex} {...styles.cardColumn}>
                        {col.showLabel && (
                          <Text
                            {...TYPOGRAPHY.label}
                            color="$textMutedForeground"
                            fontSize="$xs"
                          >
                            {col.label}
                          </Text>
                        )}
                        <Box>
                          {col.render ? (
                            col.render(item)
                          ) : (
                            <Text {...TYPOGRAPHY.paragraph}>
                              {col.defaultValue ?? String((item as any)[col.key] ?? '')}
                            </Text>
                          )}
                        </Box>
                      </VStack>
                    );
                  })}
                </VStack>
              );
            }

            // Left + Right rows
            return (
              <HStack
                key={rowIndex}
                {...styles.cardLeftRightRow}
                justifyContent="space-between"
              >
                {row.columns.map((col, pos) => {
                  if (!col) return <Box key={pos} flex={1} />;
                  return (
                    <VStack
                      key={col.key || pos}
                      flex={1}
                      space="xs"
                      alignItems={col.isRightColumn ? 'flex-end' : 'flex-start'}
                    >
                      {col.showLabel && (
                        <Text
                          {...TYPOGRAPHY.label}
                          fontSize="$xs"
                        >
                          {col.label}
                        </Text>
                      )}
                      <Box>
                        {col.render ? (
                          col.render(item)
                        ) : (
                          <Text {...TYPOGRAPHY.paragraph}>
                            {col.defaultValue ?? String((item as any)[col.key] ?? '')}
                          </Text>
                        )}
                      </Box>
                    </VStack>
                  );
                })}
              </HStack>
            );
          })}
        </VStack>
      </Card>
    </Pressable>
  );
};

/**
 * EmptyState Component
 * Pure presentational component that displays empty state message.
 */
const EmptyState = ({ message }: EmptyStateProps) => {
  return (
    <Box {...styles.emptyState}>
      <Text
        {...TYPOGRAPHY.paragraph}
        color="$textMutedForeground"
      >
        {message}
      </Text>
    </Box>
  );
};

/**
 * LoadingState Component
 * Pure presentational component that displays loading message.
 */
const LoadingState = ({ message }: LoadingStateProps) => {
  return (
    <Box {...styles.loadingState}>
      <Text
        {...TYPOGRAPHY.paragraph}
        color="$textMutedForeground"
      >
        {message}
      </Text>
    </Box>
  );
};

// ============================================================================
// MAIN COMPONENT - DataTable
// ============================================================================

/**
 * DataTable Component
 * 
 * Main component that handles all business logic, calculations, and data processing.
 * Child components are pure presentational and only receive pre-computed props.
 */
const DataTable = <T,>({
  data,
  columns,
  onRowClick,
  isLoading = false,
  showHeader = true,
  emptyMessage,
  loadingMessage,
  getRowKey,
  pagination,
  onPageChange,
  onPageSizeChange,
  responsive = true,
  minWidth,
  _css,
}: DataTableProps<T>) => {
  // ========================================================================
  // HOOKS & INITIAL STATE
  // ========================================================================
  const { isMobile, isWeb } = usePlatform();
  const { t } = useLanguage();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => Math.max(1, pagination?.pageSize ?? 10));
  const [isPaginationEnabled, setIsPaginationEnabled] = useState(pagination?.enabled ?? false);

  // Sync pagination enabled state from props
  useEffect(() => {
    setIsPaginationEnabled(pagination?.enabled ?? false);
  }, [pagination?.enabled]);

  // ========================================================================
  // PAGINATION LOGIC
  // ========================================================================
  
  // Optimized pagination calculations - memoized to prevent recalculation on every render
  const paginationConfig = useMemo(() => {
    const safePageSize = Math.max(1, pageSize);

    // Use server-side pagination if provided, otherwise calculate from data
    const isServerSide = pagination?.serverSide !== undefined;
    const totalItems = isServerSide
      ? pagination.serverSide!.total
      : data.length;
    const totalPages = isServerSide
      ? Math.max(1, Math.ceil(totalItems / safePageSize))
      : (isPaginationEnabled ? Math.max(1, Math.ceil(data.length / safePageSize)) : 1);
    const serverCurrentPage = isServerSide
      ? pagination.serverSide!.count
      : currentPage;

    // For server-side pagination, don't slice data (it's already paginated)
    // For client-side pagination, slice the data
    const startIndex = isServerSide
      ? (serverCurrentPage - 1) * safePageSize
      : (isPaginationEnabled ? (currentPage - 1) * safePageSize : 0);
    const endIndex = isServerSide
      ? Math.min(startIndex + safePageSize, totalItems)
      : (isPaginationEnabled ? startIndex + safePageSize : data.length);
    const paginatedData = isServerSide || !isPaginationEnabled
      ? data
      : data.slice(startIndex, endIndex);

    return {
      isEnabled: isPaginationEnabled,
      isServerSide,
      safePageSize,
      totalPages,
      totalItems,
      startIndex,
      endIndex,
      paginatedData,
      currentPage: isServerSide ? serverCurrentPage : currentPage,
    };
  }, [isPaginationEnabled, pageSize, currentPage, data, pagination?.serverSide]);

  // Sync pageSize from props and reset to page 1 when data changes
  useEffect(() => {
    if (!isPaginationEnabled) return;

    if (pagination?.pageSize && pagination.pageSize !== pageSize) {
      setPageSize(Math.max(1, pagination.pageSize));
      setCurrentPage(1);
    }
  }, [isPaginationEnabled, pagination?.pageSize, pageSize]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= paginationConfig.totalPages) {
      if (!paginationConfig.isServerSide) {
        setCurrentPage(newPage);
      }
      onPageChange?.(newPage);
    }
  };

  // Handle page size change with validation
  const handlePageSizeChange = (newPageSize: number) => {
    if (!Number.isFinite(newPageSize) || newPageSize <= 0) return;
    if (!paginationConfig.isServerSide) {
      setPageSize(newPageSize);
      setCurrentPage(1); // Reset to first page
    }
    onPageSizeChange?.(newPageSize);
  };

  // ========================================================================
  // COLUMN PROCESSING & LAYOUT PREPARATION
  // ========================================================================

  // Filter columns visible on desktop (reusable logic)
  const visibleDesktopColumns = useMemo(() => {
    return columns.filter(column => {
      const desktopConfig = column.desktopConfig || {};
      return desktopConfig.showColumn !== undefined ? desktopConfig.showColumn : true;
    });
  }, [columns]);


  // Prepare card layout for mobile view
  const cardLayout = useMemo(
    () => prepareCardLayout(columns, t),
    [columns, t]
  );

  // ========================================================================
  // TRANSLATIONS & MESSAGES
  // ========================================================================

  const emptyStateMessage = useMemo(() => {
    return emptyMessage ? t(emptyMessage) : t('common.noDataFound');
  }, [emptyMessage, t]);

  const loadingStateMessage = useMemo(() => {
    return loadingMessage ? t(loadingMessage) : t('common.loading');
  }, [loadingMessage, t]);

  // ========================================================================
  // VIEW CONFIGURATION
  // ========================================================================

  const minTableWidth = isMobile && !responsive ? 800 : minWidth;
  const shouldShowCardView = responsive && isMobile;

  // ========================================================================
  // RENDER
  // ========================================================================

  // Common data rendering logic - handles loading, empty, and data states
  const renderDataContent = (renderItem: (item: T, index: number) => ReactNode) => {
    if (isLoading) {
      return <LoadingState message={loadingStateMessage} />;
    }
    if (paginationConfig.paginatedData.length === 0) {
      return <EmptyState message={emptyStateMessage} />;
    }
    return paginationConfig.paginatedData.map((item, index) => renderItem(item, index));
  };

  // Table content for desktop or when responsive is disabled
  const tableContent = (
    <VStack {...styles.tableContentContainer} minWidth={minTableWidth}>
      {showHeader && (
        <TableHeader columns={visibleDesktopColumns} minWidth={minTableWidth} {..._css?._header} />
      )}
      <Box>
        {renderDataContent((item, index) => (
          <TableRow
            key={getRowKey(item)}
            item={item}
            columns={visibleDesktopColumns}
            onRowClick={onRowClick}
            minWidth={minTableWidth}
            isLast={index === paginationConfig.paginatedData.length - 1}
          />
        ))}
      </Box>
    </VStack>
  );

  // Card view content for mobile when responsive is enabled
  const cardContent = (
    <VStack {...styles.cardContentContainer}>
      {renderDataContent((item) => (
        <CardView
          key={getRowKey(item)}
          item={item}
          layout={cardLayout}
          onRowClick={onRowClick}
        />
      ))}
    </VStack>
  );

  return (
    <Box {...styles.mainContainer}>
      <Box
        bg={theme.tokens.colors.backgroundPrimary.light}
        {...styles.tableWrapper}
        {...(!isMobile ? styles.tableWrapperWeb : {})}
        overflow={shouldShowCardView ? 'hidden' : isMobile ? 'hidden' : 'visible'}
        {..._css?._table}
      >
        {shouldShowCardView ? (
          // Mobile: Show card view when responsive is enabled
          cardContent
        ) : isMobile ? (
          // Mobile: Wrap table in horizontal ScrollView when responsive is disabled
          <ScrollView horizontal showsHorizontalScrollIndicator>
            {tableContent}
          </ScrollView>
        ) : isWeb ? (
          // Desktop Web: Use Box with overflow-x for better web scrolling
          <Box {...styles.desktopScrollContainer}>
            {tableContent}
          </Box>
        ) : (
          // Desktop Native: Use ScrollView for native platforms
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator
          >
            {tableContent}
          </ScrollView>
        )}
      </Box>
      {paginationConfig.isEnabled && paginationConfig.totalPages > 1 && pagination && (
        <PaginationControls
          currentPage={paginationConfig.currentPage}
          totalPages={paginationConfig.totalPages}
          pageSize={paginationConfig.safePageSize}
          totalItems={paginationConfig.totalItems}
          startIndex={paginationConfig.startIndex}
          endIndex={paginationConfig.endIndex}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          config={pagination}
        />
      )}
    </Box>
  );
};

export default DataTable;
