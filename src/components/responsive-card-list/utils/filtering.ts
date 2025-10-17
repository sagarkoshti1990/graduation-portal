/**
 * Filtering utility functions
 */

/**
 * Filter data by search term
 */
export function filterBySearch<T>(
  data: T[],
  searchTerm: string,
  searchableFields: string[],
): T[] {
  if (!searchTerm || searchTerm.trim() === '') {
    return data;
  }

  const term = searchTerm.toLowerCase().trim();

  return data.filter(item => {
    return searchableFields.some(field => {
      const value = getNestedValue(item, field);
      if (value === null || value === undefined) return false;
      return String(value).toLowerCase().includes(term);
    });
  });
}

/**
 * Apply filters to data
 */
export function applyFilters<T>(data: T[], filters: Record<string, any>): T[] {
  if (Object.keys(filters).length === 0) {
    return data;
  }

  return data.filter(item => {
    return Object.entries(filters).every(([key, value]) => {
      // Skip empty filters
      if (value === null || value === undefined || value === '') {
        return true;
      }

      const itemValue = getNestedValue(item, key);

      // Handle different filter types
      if (typeof value === 'boolean') {
        return itemValue === value;
      }

      if (typeof value === 'number') {
        return itemValue === value;
      }

      if (typeof value === 'string') {
        return String(itemValue).toLowerCase().includes(value.toLowerCase());
      }

      if (Array.isArray(value)) {
        return value.includes(itemValue);
      }

      return itemValue === value;
    });
  });
}

/**
 * Get nested value from object using dot notation
 */
export function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current?.[key];
  }, obj);
}

/**
 * Get unique values for a field (useful for filter options)
 */
export function getUniqueValues<T>(data: T[], field: string): any[] {
  const values = data.map(item => getNestedValue(item, field));
  return Array.from(new Set(values)).filter(v => v !== null && v !== undefined);
}

/**
 * Create filter options from data
 */
export function createFilterOptions<T>(
  data: T[],
  field: string,
  labelFormatter?: (value: any) => string,
): Array<{ label: string; value: any }> {
  const uniqueValues = getUniqueValues(data, field);
  return uniqueValues.map(value => ({
    label: labelFormatter ? labelFormatter(value) : String(value),
    value,
  }));
}
