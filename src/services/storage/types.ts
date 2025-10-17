/**
 * Storage Service Types and Interfaces
 * Provides type definitions for generic storage operations
 */

/**
 * Configuration for storage service
 */
export interface StorageConfig<T> {
  key_name: string; // Storage key (like table name)
  schema?: SchemaDefinition<T>; // Optional schema definition
  idField?: keyof T; // Field to use as ID (default: 'id')
  timestampFields?: {
    createdAt?: keyof T;
    updatedAt?: keyof T;
  };
}

/**
 * Schema definition for type validation
 */
export type SchemaDefinition<T> = {
  [K in keyof T]: {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'date';
    required?: boolean;
    default?: T[K];
  };
};

/**
 * Filter options for querying data
 */
export interface FilterOptions<T> {
  where?: Partial<T> | ((item: T) => boolean);
  orderBy?: keyof T;
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * Pagination result
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Update operation types
 */
export type UpdateType = 'PUT' | 'PATCH';

/**
 * Storage operation result
 */
export interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Bulk operation result
 */
export interface BulkStorageResult<T> {
  success: boolean;
  data?: T[];
  errors?: Array<{ index: number; error: string }>;
}
