/**
 * Hook for offline storage operations
 */

import { useState, useEffect, useCallback } from 'react';
import {
  createCardListStorage,
  CardListStorageService,
} from '../utils/storage';
import NetInfo from '@react-native-community/netinfo';

interface UseOfflineStorageOptions {
  storageKeyName: string;
  enableOfflineMode?: boolean;
  autoSave?: boolean;
}

interface UseOfflineStorageReturn<T> {
  isOnline: boolean;
  saveToStorage: (data: T[]) => Promise<void>;
  loadFromStorage: () => Promise<T[]>;
  clearStorage: () => Promise<void>;
  hasStoredData: boolean;
  storageInfo: { count: number; lastUpdated: string | null };
  isLoading: boolean;
}

/**
 * Hook for managing offline storage
 */
export function useOfflineStorage<T extends Record<string, any>>(
  options: UseOfflineStorageOptions,
): UseOfflineStorageReturn<T> {
  const { storageKeyName, enableOfflineMode = true, autoSave = true } = options;

  const [isOnline, setIsOnline] = useState(true);
  const [hasStoredData, setHasStoredData] = useState(false);
  const [storageInfo, setStorageInfo] = useState<{
    count: number;
    lastUpdated: string | null;
  }>({
    count: 0,
    lastUpdated: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [storageService] = useState<CardListStorageService<T>>(() =>
    createCardListStorage<T>(storageKeyName),
  );

  // Monitor network status
  useEffect(() => {
    if (!enableOfflineMode) return;

    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? true);
    });

    // Check initial status
    NetInfo.fetch().then(state => {
      setIsOnline(state.isConnected ?? true);
    });

    return () => {
      unsubscribe();
    };
  }, [enableOfflineMode]);

  // Check if storage has data on mount
  useEffect(() => {
    if (!enableOfflineMode) return;

    const checkStorage = async () => {
      const hasData = await storageService.hasData();
      setHasStoredData(hasData);

      if (hasData) {
        const info = await storageService.getStorageInfo();
        setStorageInfo(info);
      }
    };

    checkStorage();
  }, [enableOfflineMode, storageService]);

  /**
   * Save data to storage
   */
  const saveToStorage = useCallback(
    async (data: T[]): Promise<void> => {
      if (!enableOfflineMode) return;

      setIsLoading(true);
      try {
        await storageService.saveList(data);
        setHasStoredData(data.length > 0);

        const info = await storageService.getStorageInfo();
        setStorageInfo(info);
      } catch (error) {
        console.error('Error saving to storage:', error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [enableOfflineMode, storageService],
  );

  /**
   * Load data from storage
   */
  const loadFromStorage = useCallback(async (): Promise<T[]> => {
    if (!enableOfflineMode) return [];

    setIsLoading(true);
    try {
      const data = await storageService.getList();
      return data;
    } catch (error) {
      console.error('Error loading from storage:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [enableOfflineMode, storageService]);

  /**
   * Clear storage
   */
  const clearStorage = useCallback(async (): Promise<void> => {
    if (!enableOfflineMode) return;

    setIsLoading(true);
    try {
      await storageService.clear();
      setHasStoredData(false);
      setStorageInfo({ count: 0, lastUpdated: null });
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [enableOfflineMode, storageService]);

  return {
    isOnline,
    saveToStorage,
    loadFromStorage,
    clearStorage,
    hasStoredData,
    storageInfo,
    isLoading,
  };
}

export default useOfflineStorage;
