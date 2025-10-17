/**
 * UserStorageService
 * Another example showing how to create a service for users
 */

import { CommonStorageService } from '../../CommonStorageService';
import { StorageConfig } from '../types';

// Example User interface
export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'user' | 'guest';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * UserStorageService with custom validation
 */
export class UserStorageService extends CommonStorageService<User> {
  constructor() {
    const config: StorageConfig<User> = {
      key_name: 'users',
      idField: 'id',
      timestampFields: {
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
      },
    };
    super(config);
  }

  /**
   * Validate user data
   */
  protected async validate(
    item: User,
  ): Promise<{ success: boolean; error?: string }> {
    // Username validation
    if (!item.username || item.username.trim().length === 0) {
      return { success: false, error: 'Username is required' };
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!item.email || !emailRegex.test(item.email)) {
      return { success: false, error: 'Valid email is required' };
    }

    // Check for duplicate username (exclude current user in updates)
    const existingUser = await this.getByField('username', item.username);
    if (existingUser && existingUser.id !== item.id) {
      return { success: false, error: 'Username already exists' };
    }

    // Check for duplicate email (exclude current user in updates)
    const existingEmail = await this.getByField('email', item.email);
    if (existingEmail && existingEmail.id !== item.id) {
      return { success: false, error: 'Email already exists' };
    }

    return { success: true };
  }

  /**
   * Custom method: Get active users
   */
  async getActiveUsers(): Promise<User[]> {
    return this.getAll({
      where: { isActive: true },
      orderBy: 'username',
      order: 'asc',
    });
  }

  /**
   * Custom method: Get users by role
   */
  async getUsersByRole(role: User['role']): Promise<User[]> {
    return this.getAllByField('role', role);
  }

  /**
   * Custom method: Get user by username
   */
  async getByUsername(username: string): Promise<User | null> {
    return this.getByField('username', username);
  }

  /**
   * Custom method: Get user by email
   */
  async getByEmail(email: string): Promise<User | null> {
    return this.getByField('email', email);
  }

  /**
   * Custom method: Deactivate user
   */
  async deactivateUser(id: string): Promise<void> {
    await this.patch(id, { isActive: false });
  }

  /**
   * Custom method: Activate user
   */
  async activateUser(id: string): Promise<void> {
    await this.patch(id, { isActive: true });
  }

  /**
   * Custom method: Update user role
   */
  async updateRole(id: string, role: User['role']): Promise<void> {
    await this.patch(id, { role });
  }
}

// Export singleton instance
export const userStorage = new UserStorageService();
