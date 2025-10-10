import { NetworkStatus } from '../types';
import NetInfo from '@react-native-community/netinfo';

export class NetworkService {
  static async getNetworkStatus(): Promise<NetworkStatus> {
    try {
      const state = await NetInfo.fetch();
      return {
        isConnected: state.isConnected ?? false,
        type: state.type || 'unknown',
      };
    } catch (error) {
      console.error('Error getting network status:', error);
      return { isConnected: false, type: 'unknown' };
    }
  }

  static subscribeToNetworkChanges(callback: (status: NetworkStatus) => void) {
    return NetInfo.addEventListener(state => {
      callback({
        isConnected: state.isConnected ?? false,
        type: state.type || 'unknown',
      });
    });
  }

  // Mock API endpoint - replace with your actual API URL
  private static API_BASE_URL = 'https://jsonplaceholder.typicode.com'; // Using JSONPlaceholder as mock API

  // Sync projects with actual HTTP request
  static async syncProjects(
    projects: any[],
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Syncing projects via API:', projects);

      const response = await fetch(`${this.API_BASE_URL}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'projects',
          data: projects,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Projects sync response:', result);

      return { success: true };
    } catch (error) {
      console.error('Error syncing projects:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Sync tasks with actual HTTP request
  static async syncTasks(
    tasks: any[],
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Syncing tasks via API:', tasks);

      const response = await fetch(`${this.API_BASE_URL}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'tasks',
          data: tasks,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Tasks sync response:', result);

      return { success: true };
    } catch (error) {
      console.error('Error syncing tasks:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Sync evidence with actual HTTP request
  static async syncEvidence(
    evidence: any[],
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Syncing evidence via API:', evidence);

      const response = await fetch(`${this.API_BASE_URL}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'evidence',
          data: evidence,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Evidence sync response:', result);

      return { success: true };
    } catch (error) {
      console.error('Error syncing evidence:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
