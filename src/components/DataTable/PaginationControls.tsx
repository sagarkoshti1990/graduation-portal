import React from 'react';
import { Box, HStack, Text, Pressable, VStack, Select } from '@ui';
import { theme } from '@config/theme';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';
import { useLanguage } from '@contexts/LanguageContext';
import { PaginationControlsProps } from '@app-types/components';
import { LucideIcon } from '@components/ui';
import { styles } from './Styles';

const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  startIndex,
  endIndex,
  onPageChange,
  onPageSizeChange,
  config,
}) => {
  const { t } = useLanguage();
  
  // Generate page numbers to display
  const getPageNumbers = () => {
    // Clamp maxPageNumbers to minimum 3 to ensure valid pagination logic
    // (first + last + at least 1 middle page = 3 minimum)
    const maxPages = Math.max(3, config?.maxPageNumbers ?? 5);
    const pages: (number | string)[] = [];
    
    if (totalPages <= maxPages) {
      // Show all pages if total is less than max
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page
      pages.push(1);
      
      // Calculate start and end of middle pages
      let start = Math.max(2, currentPage - Math.floor(maxPages / 2));
      let end = Math.min(totalPages - 1, start + maxPages - 3);
      
      // Adjust if we're near the end
      if (end === totalPages - 1) {
        start = Math.max(2, totalPages - maxPages + 2);
      }
      
      // Add ellipsis if needed
      if (start > 2) {
        pages.push('...');
      }
      
      // Add middle pages
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      // Add ellipsis if needed
      if (end < totalPages - 1) {
        pages.push('...');
      }
      
      // Show last page
      pages.push(totalPages);
    }
    
    return pages;
  };
  
  return (
    <VStack {...styles.paginationContainer}>
      <HStack {...styles.paginationMainRow} $md-justifyContent="space-between">
        {/* @ts-ignore: Left Side: Page Info and Page Size Selector */}
        <HStack {...styles.paginationLeftSide}>
          <Text {...TYPOGRAPHY.bodySmall} color="$textMutedForegroundColor">
            {t('table.showing', {
              start: startIndex + 1,
              end: Math.min(endIndex, totalItems),
              total: totalItems,
            })}
          </Text>
          
          {/* Page Size Selector (if enabled) */}
          {config?.showPageSizeSelector && onPageSizeChange && (
            <HStack {...styles.paginationPageSizeContainer}>
              <Text {...TYPOGRAPHY.bodySmall} color="$textMutedForeground">
                {t('table.limit')}:
              </Text>
              <Box {...styles.paginationPageSizeSelect}>
                <Select
                  value={pageSize?.toString() || ""}
                  onChange={(value) => onPageSizeChange(Number(value))}
                  options={config.pageSizeOptions?.map(size => ({
                    label: size.toString(),
                    value: size.toString(),
                  })) || []}
                />
              </Box>
            </HStack>
          )}
        </HStack>
        
        {/* Right Side: Pagination Controls */}
        <HStack {...styles.paginationRightSide}>
        {/* Start/First Button */}
        <Pressable
          onPress={() => onPageChange(1)}
          disabled={currentPage === 1}
          {...styles.paginationButton}
          {...(currentPage === 1 ? styles.paginationButtonDisabled : styles.paginationButtonEnabled)}
        >
          <LucideIcon
            name="ChevronsLeft"
            size={20}
            color={currentPage === 1 ? "$mutedForegroundColor" : "$foregroundColor"}
          />
        </Pressable>
        
        {/* Previous Button */}
        <Pressable
          onPress={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          {...styles.paginationButton}
          {...(currentPage === 1 ? styles.paginationButtonDisabled : styles.paginationButtonEnabled)}
        >
          <LucideIcon
            name="ChevronLeft"
            size={20}
            color={currentPage === 1 ? theme.tokens.colors.mutedForeground : theme.tokens.colors.foreground}
          />
        </Pressable>
        
        {/* Page Numbers */}
        {config?.showPageNumbers !== false && (
          <HStack {...styles.paginationPageNumbers}>
            {getPageNumbers().map((page, index) => {
              if (page === '...') {
                return (
                  <Text key={`ellipsis-${index}`} {...styles.paginationEllipsis} color="$textMutedForeground"> 
                    ...
                  </Text>
                );
              }
              
              const pageNum = page as number;
              const isActive = pageNum === currentPage;
              
              return (
                <Pressable
                  key={pageNum}
                  onPress={() => onPageChange(pageNum)}
                  {...styles.paginationPageNumber}
                  {...(isActive ? styles.paginationPageNumberActive : styles.paginationPageNumberInactive)}
                >
                  <Text
                    {...TYPOGRAPHY.bodySmall}
                    color={isActive ? '$white' : "$textForeground"}
                    fontWeight={isActive ? '$semibold' : '$normal'}
                  >
                    {pageNum}
                  </Text>
                </Pressable>
              );
            })}
          </HStack>
        )}
        
        {/* Next Button */}
        <Pressable
          onPress={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          {...styles.paginationButton}
          {...(currentPage === totalPages ? styles.paginationButtonDisabled : styles.paginationButtonEnabled)}
        >
          <LucideIcon
            name="ChevronRight"
            size={20}
            color={currentPage === totalPages ? theme.tokens.colors.mutedForeground : theme.tokens.colors.foreground}
          />
        </Pressable>
        
        {/* End/Last Button */}
        <Pressable
          onPress={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          {...styles.paginationButton}
          {...(currentPage === totalPages ? styles.paginationButtonDisabled : styles.paginationButtonEnabled)}
        >
          <LucideIcon
            name="ChevronsRight"
            size={20}
            color={currentPage === totalPages ? theme.tokens.colors.mutedForeground : theme.tokens.colors.foreground}
          />
        </Pressable>
        </HStack>
      </HStack>
    </VStack>
  );
};

export default PaginationControls;