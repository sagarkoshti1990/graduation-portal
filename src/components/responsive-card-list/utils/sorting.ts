/**
 * Sorting utility functions
 */

import { SortConfig } from '../types';
import { getNestedValue } from './filtering';

/**
 * Sort data based on sort configuration
 */
export function sortData<T>(data: T[], sortConfig: SortConfig | null): T[] {
  if (!sortConfig) {
    return data;
  }

  const { field, order } = sortConfig;
  const sorted = [...data];

  sorted.sort((a, b) => {
    const aValue = getNestedValue(a, field);
    const bValue = getNestedValue(b, field);

    // Handle null/undefined values
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    // Compare values based on type
    let comparison = 0;

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      comparison = aValue - bValue;
    } else if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
      comparison = aValue === bValue ? 0 : aValue ? 1 : -1;
    } else if (aValue instanceof Date && bValue instanceof Date) {
      comparison = aValue.getTime() - bValue.getTime();
    } else {
      // String comparison
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      comparison = aStr.localeCompare(bStr);
    }

    return order === 'desc' ? -comparison : comparison;
  });

  return sorted;
}

/**
 * Toggle sort order
 */
export function toggleSortOrder(
  currentConfig: SortConfig | null,
  field: string,
): SortConfig {
  if (!currentConfig || currentConfig.field !== field) {
    return { field, order: 'asc' };
  }

  return {
    field,
    order: currentConfig.order === 'asc' ? 'desc' : 'asc',
  };
}

/**
 * Get sort icon name based on sort state
 */
export function getSortIcon(
  currentConfig: SortConfig | null,
  field: string,
): 'sort' | 'sort-up' | 'sort-down' {
  if (!currentConfig || currentConfig.field !== field) {
    return 'sort';
  }
  return currentConfig.order === 'asc' ? 'sort-up' : 'sort-down';
}
