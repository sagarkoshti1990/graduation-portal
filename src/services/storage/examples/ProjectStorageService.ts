/**
 * ProjectStorageService
 * Example implementation showing how to inherit from CommonStorageService
 */

import { CommonStorageService } from '../../CommonStorageService';
import { StorageConfig } from '../types';

// Example Project interface
export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'completed' | 'archived';
  createdAt: string;
  updatedAt: string;
  ownerId?: string;
}

/**
 * ProjectStorageService extends CommonStorageService
 * with custom validation and business logic
 */
export class ProjectStorageService extends CommonStorageService<Project> {
  constructor() {
    const config: StorageConfig<Project> = {
      key_name: 'projects_v2', // Custom storage key
      idField: 'id',
      timestampFields: {
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
      },
    };
    super(config);
  }

  /**
   * Custom validation for projects
   */
  protected async validate(
    item: Project,
  ): Promise<{ success: boolean; error?: string }> {
    if (!item.name || item.name.trim().length === 0) {
      return { success: false, error: 'Project name is required' };
    }

    if (item.name.length > 100) {
      return {
        success: false,
        error: 'Project name must be less than 100 characters',
      };
    }

    if (!['active', 'completed', 'archived'].includes(item.status)) {
      return { success: false, error: 'Invalid project status' };
    }

    return { success: true };
  }

  /**
   * Hook: Log after create
   */
  protected async afterCreate(item: Project): Promise<void> {
    console.log(`Project created: ${item.name} (${item.id})`);
  }

  /**
   * Hook: Log after update
   */
  protected async afterUpdate(item: Project): Promise<void> {
    console.log(`Project updated: ${item.name} (${item.id})`);
  }

  /**
   * Hook: Log after delete
   */
  protected async afterDelete(item: Project): Promise<void> {
    console.log(`Project deleted: ${item.name} (${item.id})`);
  }

  /**
   * Custom method: Get active projects
   */
  async getActiveProjects(): Promise<Project[]> {
    return this.getAll({
      where: { status: 'active' },
      orderBy: 'updatedAt',
      order: 'desc',
    });
  }

  /**
   * Custom method: Get projects by owner
   */
  async getProjectsByOwner(ownerId: string): Promise<Project[]> {
    return this.getAllByField('ownerId', ownerId);
  }

  /**
   * Custom method: Archive project
   */
  async archiveProject(id: string): Promise<void> {
    await this.patch(id, { status: 'archived' });
  }

  /**
   * Custom method: Complete project
   */
  async completeProject(id: string): Promise<void> {
    await this.patch(id, { status: 'completed' });
  }

  /**
   * Custom method: Search projects by name
   */
  async searchProjects(searchTerm: string): Promise<Project[]> {
    const allProjects = await this.getAll();
    return allProjects.filter(project =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }
}

// Export singleton instance
export const projectStorage = new ProjectStorageService();
