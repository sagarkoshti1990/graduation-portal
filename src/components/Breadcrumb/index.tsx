import React from 'react';
import { HStack, Text, Pressable } from '@ui';
import { LucideIcon } from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import { BreadcrumbProps, BreadcrumbItem as BreadcrumbItemType } from './types';
import { breadcrumbStyles } from './Styles';
import BreadcrumbItem from './BreadcrumbItem';

/**
 * Breadcrumb Component
 * 
 * A reusable breadcrumb component that supports:
 * - URL-based navigation
 * - Hierarchical card navigation
 * - Clickable segments
 * - Back arrow functionality
 * 
 * @example
 * ```tsx
 * <Breadcrumb
 *   items={[
 *     { id: 'home', label: 'Home', path: '/' },
 *     { id: 'dashboard', label: 'Dashboard', path: '/dashboard' },
 *     { id: 'users', label: 'Users' },
 *   ]}
 *   onItemClick={(item, index) => {
 *     if (item.path) {
 *       navigation.navigate(item.path);
 *     }
 *   }}
 *   onBackClick={() => {
 *     // Handle back navigation
 *   }}
 * />
 * ```
 */
const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  onItemClick,
  showBackArrow = true,
  onBackClick,
  separator = '/',
  maxItems,
  className,
}) => {
  const { t } = useLanguage();

  // Handle back arrow click
  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else if (items.length > 1 && onItemClick) {
      // Default: go back to previous item
      const previousIndex = items.length - 2;
      onItemClick(items[previousIndex], previousIndex);
    }
  };

  // Handle item click
  const handleItemClick = (item: BreadcrumbItemType, index: number) => {
    if (onItemClick) {
      onItemClick(item, index);
    }
  };

  // Determine which items to show (if maxItems is set)
  const getVisibleItems = () => {
    if (!maxItems || items.length <= maxItems) {
      return items;
    }

    // Show first item, ellipsis, and last N items
    const firstItem = items[0];
    const lastItems = items.slice(-(maxItems - 1));
    return [firstItem, { id: 'ellipsis', label: '...' } as any, ...lastItems];
  };

  const visibleItems = getVisibleItems();

  // Don't render if no items
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <HStack 
      {...breadcrumbStyles.container}
      className={className}
      accessibilityRole="navigation"
      accessibilityLabel="Breadcrumb navigation"
    >
      {/* Back Arrow Button */}
      {showBackArrow && items.length > 1 && (
        <Pressable
          onPress={handleBackClick}
          {...breadcrumbStyles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <LucideIcon 
            name="ChevronLeft" 
            size={16} 
            color="$textMutedForeground"
          />
        </Pressable>
      )}

      {/* Breadcrumb Items */}
      <HStack {...breadcrumbStyles.itemContainer}>
        {visibleItems.map((item, index) => {
          const isLastItem = index === visibleItems.length - 1;
          const isEllipsis = item.id === 'ellipsis';

          if (isEllipsis) {
            return (
              <Text key={`ellipsis-${index}`} {...breadcrumbStyles.ellipsis}>
                ...
              </Text>
            );
          }

          return (
            <React.Fragment key={item.id}>
              <BreadcrumbItem
                item={item}
                isActive={isLastItem}
                onPress={isLastItem ? undefined : () => {
                  // Find actual index in original items array
                  const actualIndex = items.findIndex(i => i.id === item.id);
                  if (actualIndex !== -1) {
                    handleItemClick(item, actualIndex);
                  }
                }}
                useTranslation={!!item.labelKey}
                t={t}
              />
              {!isLastItem && (
                <Text {...breadcrumbStyles.separator}>
                  {separator}
                </Text>
              )}
            </React.Fragment>
          );
        })}
      </HStack>
    </HStack>
  );
};

export default Breadcrumb;
export type { BreadcrumbProps, BreadcrumbItem } from './types';
