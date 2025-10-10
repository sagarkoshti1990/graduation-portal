import { StorageService } from './StorageService';
import { NetworkService } from './NetworkService';
import { Task, Evidence, SyncResult, SyncStatusData } from '../types';

export class SyncService {
  private static isSyncing = false;
  private static syncCallbacks: Array<(status: boolean) => void> = [];

  // Get comprehensive sync status
  static async getSyncStatusData(): Promise<SyncStatusData> {
    try {
      const allTasks = await StorageService.getTasks();
      const allEvidence = await StorageService.getAllEvidence();
      const networkStatus = await NetworkService.getNetworkStatus();
      const lastSyncAt = await StorageService.getLastSyncTimestamp();

      const pendingTasks = allTasks.filter(
        task => task.needsSync || task.syncStatus === 'pending' || task.syncStatus === 'failed',
      );
      const pendingEvidence = allEvidence.filter(
        evidence => evidence.needsSync || evidence.syncStatus === 'pending' || evidence.syncStatus === 'failed',
      );

      const syncedTasks = allTasks.filter(task => task.syncStatus === 'synced');
      const syncedEvidence = allEvidence.filter(
        evidence => evidence.syncStatus === 'synced',
      );

      const failedTasks = allTasks.filter(task => task.syncStatus === 'failed');
      const failedEvidence = allEvidence.filter(
        evidence => evidence.syncStatus === 'failed',
      );

      return {
        totalItems: allTasks.length + allEvidence.length,
        pendingItems: pendingTasks.length + pendingEvidence.length,
        syncedItems: syncedTasks.length + syncedEvidence.length,
        failedItems: failedTasks.length + failedEvidence.length,
        tasks: allTasks,
        evidence: allEvidence,
        isOnline: networkStatus.isConnected,
        lastSyncAt: lastSyncAt || undefined,
      };
    } catch (error) {
      console.error('Error getting sync status data:', error);
      const networkStatus = await NetworkService.getNetworkStatus();
      return {
        totalItems: 0,
        pendingItems: 0,
        syncedItems: 0,
        failedItems: 0,
        tasks: [],
        evidence: [],
        isOnline: networkStatus.isConnected,
      };
    }
  }

  // Manual sync with detailed results
  static async manualSync(): Promise<SyncResult> {
    if (this.isSyncing) {
      console.log('Sync already in progress');
      return {
        success: false,
        syncedTasks: 0,
        syncedEvidence: 0,
        failedTasks: [],
        failedEvidence: [],
        errors: ['Sync already in progress'],
      };
    }

    try {
      this.isSyncing = true;
      console.log('Starting manual sync process...');

      const networkStatus = await NetworkService.getNetworkStatus();
      if (!networkStatus.isConnected) {
        console.log('No network connection, skipping sync');
        return {
          success: false,
          syncedTasks: 0,
          syncedEvidence: 0,
          failedTasks: [],
          failedEvidence: [],
          errors: ['No network connection'],
        };
      }

      // Get all tasks and evidence that need syncing
      const { tasks: pendingTasks, evidence: pendingEvidence } =
        await StorageService.getItemsNeedingSync();

      const result: SyncResult = {
        success: true,
        syncedTasks: 0,
        syncedEvidence: 0,
        failedTasks: [],
        failedEvidence: [],
        errors: [],
      };

      // Sync tasks
      if (pendingTasks.length > 0) {
        console.log(`Syncing ${pendingTasks.length} tasks...`);

        for (const task of pendingTasks) {
          // Mark as syncing
          await StorageService.updateTask(task.id, {
            syncStatus: 'syncing',
          });
        }

        const tasksSyncResult = await NetworkService.syncTasks(pendingTasks);
        if (tasksSyncResult.success) {
          // Mark tasks as synced
          for (const task of pendingTasks) {
            await StorageService.updateTask(task.id, {
              needsSync: false,
              isOffline: false,
              syncStatus: 'synced',
              lastSyncedAt: new Date(),
              syncError: undefined,
            });
            result.syncedTasks++;
          }
          console.log('Tasks synced successfully');
        } else {
          // Mark tasks as failed
          for (const task of pendingTasks) {
            await StorageService.updateTask(task.id, {
              syncStatus: 'failed',
              syncError: tasksSyncResult.error || 'Unknown error',
            });
            result.failedTasks.push(task.id);
          }
          result.success = false;
          result.errors.push(tasksSyncResult.error || 'Failed to sync tasks');
          console.error('Failed to sync tasks');
        }
      }

      // Sync evidence
      if (pendingEvidence.length > 0) {
        console.log(`Syncing ${pendingEvidence.length} evidence items...`);

        for (const evidence of pendingEvidence) {
          // Mark as syncing
          await StorageService.updateEvidence(evidence.id, {
            syncStatus: 'syncing',
          });
        }

        const evidenceSyncResult = await NetworkService.syncEvidence(
          pendingEvidence,
        );
        if (evidenceSyncResult.success) {
          // Mark evidence as synced
          for (const evidence of pendingEvidence) {
            await StorageService.updateEvidence(evidence.id, {
              needsSync: false,
              isOffline: false,
              syncStatus: 'synced',
              lastSyncedAt: new Date(),
              syncError: undefined,
            });
            result.syncedEvidence++;
            console.log(`Evidence ${evidence.id} synced successfully`);
          }
          console.log('Evidence synced successfully');
        } else {
          // Mark evidence as failed
          for (const evidence of pendingEvidence) {
            await StorageService.updateEvidence(evidence.id, {
              syncStatus: 'failed',
              syncError: evidenceSyncResult.error || 'Unknown error',
            });
            result.failedEvidence.push(evidence.id);
          }
          result.success = false;
          result.errors.push(
            evidenceSyncResult.error || 'Failed to sync evidence',
          );
          console.error('Failed to sync evidence');
        }
      }

      if (result.success) {
        console.log('Sync completed successfully');
        await StorageService.updateLastSyncTimestamp();
      }

      // Notify callbacks
      this.syncCallbacks.forEach(callback => callback(result.success));

      return result;
    } catch (error) {
      console.error('Error during sync:', error);
      return {
        success: false,
        syncedTasks: 0,
        syncedEvidence: 0,
        failedTasks: [],
        failedEvidence: [],
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    } finally {
      this.isSyncing = false;
    }
  }

  static async syncOfflineData(): Promise<boolean> {
    const result = await this.manualSync();
    return result.success;
  }

  static async queueForSync(item: Task | Evidence): Promise<void> {
    try {
      // Mark item as needing sync
      if ('projectId' in item) {
        await StorageService.updateTask(item.id, {
          needsSync: true,
          isOffline: true,
        });
      } else {
        // For evidence, we'll add it to the sync queue
        await StorageService.addToSyncQueue(item);
      }

      console.log(`Item ${item.id} queued for sync`);
    } catch (error) {
      console.error('Error queuing item for sync:', error);
    }
  }

  static async startAutoSync(): Promise<void> {
    // Set up automatic sync when network becomes available
    NetworkService.subscribeToNetworkChanges(async status => {
      if (status.isConnected) {
        console.log('Network connected, starting auto-sync...');
        await this.syncOfflineData();
      }
    });
  }

  static getSyncStatus(): { isSyncing: boolean } {
    return { isSyncing: this.isSyncing };
  }
}

