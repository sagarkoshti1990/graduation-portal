/**
 * Storage utility using CommonStorageService
 */

import { CommonStorageService } from '../../../services/CommonStorageService';

/**
 * Create a storage service for card list data
 */
export class CardListStorageService<
  T extends Record<string, any>,
> extends CommonStorageService<T> {
  constructor(keyName: string) {
    super({ key_name: keyName });
  }

  /**
   * Save list data to storage
   */
  async saveList(data: T[]): Promise<void> {
    try {
      // Clear existing and save new
      await this.clear();
      if (data.length > 0) {
        await this.createBulk(data);
      }
    } catch (error) {
      console.error('Error saving list to storage:', error);
      throw error;
    }
  }

  /**
   * Get list data from storage
   */
  async getList(): Promise<T[]> {
    try {
      return await this.getAll({
        orderBy: 'createdAt' as keyof T,
        order: 'desc',
      });
    } catch (error) {
      console.error('Error getting list from storage:', error);
      return [];
    }
  }

  /**
   * Check if storage has data
   */
  async hasData(): Promise<boolean> {
    const count = await this.count();
    return count > 0;
  }

  /**
   * Get storage info
   */
  async getStorageInfo(): Promise<{
    count: number;
    lastUpdated: string | null;
  }> {
    const data = await this.getAll();
    const count = data.length;

    let lastUpdated: string | null = null;
    if (data.length > 0 && 'updatedAt' in data[0]) {
      const sorted = [...data].sort((a: any, b: any) => {
        const dateA = new Date(a.updatedAt).getTime();
        const dateB = new Date(b.updatedAt).getTime();
        return dateB - dateA;
      });
      lastUpdated = (sorted[0] as any).updatedAt;
    }

    return { count, lastUpdated };
  }
}

/**
 * Create storage service instance
 */
export function createCardListStorage<T extends Record<string, any>>(
  keyName: string,
): CardListStorageService<T> {
  return new CardListStorageService<T>(keyName);
}
