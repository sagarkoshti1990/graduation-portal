import { Task, Evidence } from '../types';
import { StorageService } from '../services/StorageService';

/**
 * Utility to generate sample tasks and evidence with various sync statuses
 * for testing the sync functionality
 */
export class SampleDataGenerator {
  static async generateSampleSyncData(): Promise<void> {
    console.log('Generating sample sync data...');

    // Create sample tasks with different sync statuses
    const sampleTasks: Task[] = [
      {
        id: 'task-1',
        projectId: '1',
        title: 'Complete project documentation',
        description: 'Write comprehensive documentation for the project',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        needsSync: true,
        syncStatus: 'pending',
      },
      {
        id: 'task-2',
        projectId: '2',
        title: 'Submit final report',
        description: 'Prepare and submit the final project report',
        status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date(),
        needsSync: false,
        syncStatus: 'synced',
        lastSyncedAt: new Date(Date.now() - 3600000), // 1 hour ago
      },
      {
        id: 'task-3',
        projectId: '3',
        title: 'Review code changes',
        description: 'Review and approve pending code changes',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        needsSync: true,
        syncStatus: 'failed',
        syncError: 'Network timeout',
      },
      {
        id: 'task-4',
        projectId: '1',
        title: 'Update test cases',
        description: 'Add new test cases for recent features',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        needsSync: true,
        syncStatus: 'pending',
      },
    ];

    // Create sample evidence with different sync statuses
    const sampleEvidence: Evidence[] = [
      {
        id: 'evidence-1',
        taskId: 'task-1',
        type: 'photo',
        fileName: 'project-screenshot.jpg',
        filePath: '/storage/photos/screenshot.jpg',
        uploadedAt: new Date(),
        needsSync: true,
        syncStatus: 'pending',
      },
      {
        id: 'evidence-2',
        taskId: 'task-2',
        type: 'document',
        fileName: 'final-report.pdf',
        filePath: '/storage/documents/report.pdf',
        uploadedAt: new Date(),
        needsSync: false,
        syncStatus: 'synced',
        lastSyncedAt: new Date(Date.now() - 7200000), // 2 hours ago
      },
      {
        id: 'evidence-3',
        taskId: 'task-3',
        type: 'photo',
        fileName: 'code-review.png',
        filePath: '/storage/photos/code.png',
        uploadedAt: new Date(),
        needsSync: true,
        syncStatus: 'failed',
        syncError: 'File too large',
      },
    ];

    // Save to storage
    await StorageService.saveTasks(sampleTasks);
    
    // Save evidence items individually to maintain existing storage structure
    for (const evidence of sampleEvidence) {
      await StorageService.addEvidence(evidence);
    }

    console.log('Sample sync data generated successfully!');
    console.log(`Created ${sampleTasks.length} tasks and ${sampleEvidence.length} evidence items`);
  }

  static async clearAllSyncData(): Promise<void> {
    console.log('Clearing all sync data...');
    await StorageService.saveTasks([]);
    await StorageService.clearSyncQueue();
    console.log('All sync data cleared!');
  }
}
