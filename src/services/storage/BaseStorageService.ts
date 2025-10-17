/**
 * BaseStorageService
 * Generic CRUD storage service that can be inherited
 * Provides common operations: getAll, create, view, edit (put, patch), delete
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  StorageConfig,
  FilterOptions,
  PaginatedResult,
  UpdateType,
  StorageResult,
  BulkStorageResult,
} from './types';

export abstract class BaseStorageService<T extends Record<string, any>> {
  protected config: StorageConfig<T>;

  constructor(config: StorageConfig<T>) {
    this.config = {
      idField: 'id' as keyof T,
      timestampFields: {
        createdAt: 'createdAt' as keyof T,
        updatedAt: 'updatedAt' as keyof T,
      },
      ...config,
    };
  }

  /**
   * Get storage key name
   */
  protected getKeyName(): string {
    return this.config.key_name;
  }

  /**
   * Get ID field name
   */
  protected getIdField(): keyof T {
    return this.config.idField || ('id' as keyof T);
  }

  /**
   * Generate unique ID
   */
  protected generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Add timestamps to item
   */
  protected addTimestamps(item: Partial<T>, isNew: boolean = true): Partial<T> {
    const result = { ...item };
    const { createdAt, updatedAt } = this.config.timestampFields || {};

    if (isNew && createdAt) {
      (result as any)[createdAt] = new Date().toISOString();
    }
    if (updatedAt) {
      (result as any)[updatedAt] = new Date().toISOString();
    }

    return result;
  }

  /**
   * Read all data from storage
   */
  protected async readStorage(): Promise<T[]> {
    try {
      const data = await AsyncStorage.getItem(this.getKeyName());
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Error reading ${this.getKeyName()}:`, error);
      return [];
    }
  }

  /**
   * Write all data to storage
   */
  protected async writeStorage(data: T[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.getKeyName(), JSON.stringify(data));
    } catch (error) {
      console.error(`Error writing ${this.getKeyName()}:`, error);
      throw error;
    }
  }

  /**
   * Apply filters to data
   */
  protected applyFilters(data: T[], options?: FilterOptions<T>): T[] {
    let result = [...data];

    // Apply where clause
    if (options?.where) {
      if (typeof options.where === 'function') {
        result = result.filter(options.where);
      } else {
        result = result.filter(item => {
          return Object.entries(options.where as Partial<T>).every(
            ([key, value]) => item[key as keyof T] === value,
          );
        });
      }
    }

    // Apply ordering
    if (options?.orderBy) {
      result.sort((a, b) => {
        const aVal = a[options.orderBy!];
        const bVal = b[options.orderBy!];
        const order = options.order === 'desc' ? -1 : 1;

        if (aVal < bVal) return -1 * order;
        if (aVal > bVal) return 1 * order;
        return 0;
      });
    }

    // Apply pagination
    if (options?.offset !== undefined) {
      result = result.slice(options.offset);
    }
    if (options?.limit !== undefined) {
      result = result.slice(0, options.limit);
    }

    return result;
  }

  // ==================== CRUD OPERATIONS ====================

  /**
   * Get all items (READ)
   */
  async getAll(options?: FilterOptions<T>): Promise<T[]> {
    try {
      const data = await this.readStorage();
      return options ? this.applyFilters(data, options) : data;
    } catch (error) {
      console.error('Error in getAll:', error);
      return [];
    }
  }

  /**
   * Get paginated items
   */
  async getPaginated(
    page: number = 1,
    pageSize: number = 10,
    options?: FilterOptions<T>,
  ): Promise<PaginatedResult<T>> {
    try {
      const allData = await this.readStorage();
      const filteredData = options
        ? this.applyFilters(allData, options)
        : allData;

      const offset = (page - 1) * pageSize;
      const data = filteredData.slice(offset, offset + pageSize);

      return {
        data,
        total: filteredData.length,
        page,
        pageSize,
        hasMore: offset + pageSize < filteredData.length,
      };
    } catch (error) {
      console.error('Error in getPaginated:', error);
      return {
        data: [],
        total: 0,
        page,
        pageSize,
        hasMore: false,
      };
    }
  }

  /**
   * Get single item by ID (VIEW)
   */
  async getById(id: string | number): Promise<T | null> {
    try {
      const data = await this.readStorage();
      const idField = this.getIdField();
      return data.find(item => item[idField] === id) || null;
    } catch (error) {
      console.error('Error in getById:', error);
      return null;
    }
  }

  /**
   * Get single item by custom field
   */
  async getByField(field: keyof T, value: any): Promise<T | null> {
    try {
      const data = await this.readStorage();
      return data.find(item => item[field] === value) || null;
    } catch (error) {
      console.error('Error in getByField:', error);
      return null;
    }
  }

  /**
   * Get multiple items by custom field
   */
  async getAllByField(field: keyof T, value: any): Promise<T[]> {
    try {
      const data = await this.readStorage();
      return data.filter(item => item[field] === value);
    } catch (error) {
      console.error('Error in getAllByField:', error);
      return [];
    }
  }

  /**
   * Create new item (CREATE)
   */
  async create(item: Omit<T, 'id'> | T): Promise<StorageResult<T>> {
    try {
      const data = await this.readStorage();
      const idField = this.getIdField();

      // Generate ID if not provided
      let newItem = { ...item } as T;
      if (!(idField in newItem)) {
        (newItem as any)[idField] = this.generateId();
      }

      // Add timestamps
      newItem = this.addTimestamps(newItem, true) as T;

      // Validate before saving (can be overridden)
      const validation = await this.validate(newItem);
      if (!validation.success) {
        return { success: false, error: validation.error };
      }

      data.push(newItem);
      await this.writeStorage(data);

      // Call post-create hook
      await this.afterCreate(newItem);

      return { success: true, data: newItem };
    } catch (error) {
      console.error('Error in create:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Create multiple items in bulk
   */
  async createBulk(
    items: Array<Omit<T, 'id'> | T>,
  ): Promise<BulkStorageResult<T>> {
    try {
      const data = await this.readStorage();
      const idField = this.getIdField();
      const newItems: T[] = [];
      const errors: Array<{ index: number; error: string }> = [];

      for (let i = 0; i < items.length; i++) {
        try {
          let newItem = { ...items[i] } as T;

          if (!(idField in newItem)) {
            (newItem as any)[idField] = this.generateId();
          }

          newItem = this.addTimestamps(newItem, true) as T;

          const validation = await this.validate(newItem);
          if (!validation.success) {
            errors.push({
              index: i,
              error: validation.error || 'Validation failed',
            });
            continue;
          }

          newItems.push(newItem);
        } catch (error) {
          errors.push({ index: i, error: String(error) });
        }
      }

      if (newItems.length > 0) {
        data.push(...newItems);
        await this.writeStorage(data);
      }

      return {
        success: errors.length === 0,
        data: newItems,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      console.error('Error in createBulk:', error);
      return { success: false, errors: [{ index: -1, error: String(error) }] };
    }
  }

  /**
   * Update item - PUT (full replacement)
   */
  async put(id: string | number, item: T): Promise<StorageResult<T>> {
    try {
      const data = await this.readStorage();
      const idField = this.getIdField();
      const index = data.findIndex(i => i[idField] === id);

      if (index === -1) {
        return { success: false, error: 'Item not found' };
      }

      // Full replacement but preserve ID
      let updatedItem = { ...item };
      (updatedItem as any)[idField] = id;
      updatedItem = this.addTimestamps(updatedItem, false) as T;

      // Validate before saving
      const validation = await this.validate(updatedItem);
      if (!validation.success) {
        return { success: false, error: validation.error };
      }

      data[index] = updatedItem;
      await this.writeStorage(data);

      // Call post-update hook
      await this.afterUpdate(updatedItem);

      return { success: true, data: updatedItem };
    } catch (error) {
      console.error('Error in put:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Update item - PATCH (partial update)
   */
  async patch(
    id: string | number,
    updates: Partial<T>,
  ): Promise<StorageResult<T>> {
    try {
      const data = await this.readStorage();
      const idField = this.getIdField();
      const index = data.findIndex(i => i[idField] === id);

      if (index === -1) {
        return { success: false, error: 'Item not found' };
      }

      // Merge with existing data
      let updatedItem = {
        ...data[index],
        ...updates,
      };
      (updatedItem as any)[idField] = id; // Preserve ID
      updatedItem = this.addTimestamps(updatedItem, false) as T;

      // Validate before saving
      const validation = await this.validate(updatedItem);
      if (!validation.success) {
        return { success: false, error: validation.error };
      }

      data[index] = updatedItem;
      await this.writeStorage(data);

      // Call post-update hook
      await this.afterUpdate(updatedItem);

      return { success: true, data: updatedItem };
    } catch (error) {
      console.error('Error in patch:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Generic update method (supports both PUT and PATCH)
   */
  async update(
    id: string | number,
    updates: Partial<T> | T,
    type: UpdateType = 'PATCH',
  ): Promise<StorageResult<T>> {
    return type === 'PUT'
      ? this.put(id, updates as T)
      : this.patch(id, updates);
  }

  /**
   * Delete item by ID
   */
  async delete(id: string | number): Promise<StorageResult<boolean>> {
    try {
      const data = await this.readStorage();
      const idField = this.getIdField();
      const index = data.findIndex(i => i[idField] === id);

      if (index === -1) {
        return { success: false, error: 'Item not found' };
      }

      const deletedItem = data[index];
      data.splice(index, 1);
      await this.writeStorage(data);

      // Call post-delete hook
      await this.afterDelete(deletedItem);

      return { success: true, data: true };
    } catch (error) {
      console.error('Error in delete:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Delete multiple items by IDs
   */
  async deleteBulk(
    ids: Array<string | number>,
  ): Promise<BulkStorageResult<boolean>> {
    try {
      const data = await this.readStorage();
      const idField = this.getIdField();
      const errors: Array<{ index: number; error: string }> = [];
      const deletedItems: T[] = [];

      const remainingData = data.filter((item, index) => {
        const itemId = item[idField];
        const shouldDelete = ids.includes(itemId);

        if (shouldDelete) {
          deletedItems.push(item);
        }

        return !shouldDelete;
      });

      await this.writeStorage(remainingData);

      return {
        success: true,
        data: [true],
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      console.error('Error in deleteBulk:', error);
      return { success: false, errors: [{ index: -1, error: String(error) }] };
    }
  }

  /**
   * Delete all items matching criteria
   */
  async deleteWhere(
    criteria: Partial<T> | ((item: T) => boolean),
  ): Promise<StorageResult<number>> {
    try {
      const data = await this.readStorage();
      let deletedCount = 0;

      const remainingData = data.filter(item => {
        const shouldDelete =
          typeof criteria === 'function'
            ? criteria(item)
            : Object.entries(criteria).every(
                ([key, value]) => item[key as keyof T] === value,
              );

        if (shouldDelete) deletedCount++;
        return !shouldDelete;
      });

      await this.writeStorage(remainingData);
      return { success: true, data: deletedCount };
    } catch (error) {
      console.error('Error in deleteWhere:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Clear all data
   */
  async clear(): Promise<StorageResult<boolean>> {
    try {
      await this.writeStorage([]);
      return { success: true, data: true };
    } catch (error) {
      console.error('Error in clear:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Count total items
   */
  async count(options?: FilterOptions<T>): Promise<number> {
    try {
      const data = await this.readStorage();
      const filteredData = options ? this.applyFilters(data, options) : data;
      return filteredData.length;
    } catch (error) {
      console.error('Error in count:', error);
      return 0;
    }
  }

  /**
   * Check if item exists
   */
  async exists(id: string | number): Promise<boolean> {
    const item = await this.getById(id);
    return item !== null;
  }

  // ==================== HOOKS (can be overridden) ====================

  /**
   * Validate item before save (override in subclass)
   */
  protected async validate(
    item: T,
  ): Promise<{ success: boolean; error?: string }> {
    return { success: true };
  }

  /**
   * Hook called after create
   */
  protected async afterCreate(item: T): Promise<void> {
    // Override in subclass if needed
  }

  /**
   * Hook called after update
   */
  protected async afterUpdate(item: T): Promise<void> {
    // Override in subclass if needed
  }

  /**
   * Hook called after delete
   */
  protected async afterDelete(item: T): Promise<void> {
    // Override in subclass if needed
  }
}
