import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { Platform } from 'react-native';
import { addNetworkListener } from '@utils/networkStatus';
import { getPendingBreakdown, isNetworkOffline, type PendingBreakdown } from '../services/dataService';
import { startSync, startSyncAll } from '../services/syncService';
import { useAuth } from './AuthContext';
import type { SyncProgress } from '@app-types/offline';

interface OfflineSyncContextType {
  isOffline: boolean;
  isOnline: boolean;
  isSyncing: boolean;
  syncProgress: SyncProgress | null;
  pendingSyncCount: number;
  failedSyncCount: number;
  pendingBreakdown: PendingBreakdown;
  justCameOnline: boolean;
  showSyncModal: boolean;
  openSyncModal: () => void;
  closeSyncModal: () => void;
  syncParticipant: (participantId: string) => Promise<void>;
  syncAll: () => Promise<void>;
  refreshPending: () => Promise<void>;
  /** Bumps whenever any participant's downloaded offline data changes (removed or cleaned up after sync). */
  offlineDataVersion: number;
  /** Call after deleting/cleaning up a participant's offline data so badges depending on it re-check storage. */
  notifyOfflineDataChanged: () => void;
}

const DEFAULT_BREAKDOWN: PendingBreakdown = { files: 0, forms: 0, tasks: 0, idp: 0, failed: 0, total: 0 };

const OfflineSyncContext = createContext<OfflineSyncContextType>({
  isOffline: false,
  isOnline: true,
  isSyncing: false,
  syncProgress: null,
  pendingSyncCount: 0,
  failedSyncCount: 0,
  pendingBreakdown: DEFAULT_BREAKDOWN,
  justCameOnline: false,
  showSyncModal: false,
  openSyncModal: () => {},
  closeSyncModal: () => {},
  syncParticipant: async () => {},
  syncAll: async () => {},
  refreshPending: async () => {},
  offlineDataVersion: 0,
  notifyOfflineDataChanged: () => {},
});

export const OfflineSyncProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const userId = user?.id ?? '';

  const [isOffline, setIsOffline] = useState<boolean>(isNetworkOffline());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [pendingBreakdown, setPendingBreakdown] = useState<PendingBreakdown>(DEFAULT_BREAKDOWN);
  const [justCameOnline, setJustCameOnline] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [offlineDataVersion, setOfflineDataVersion] = useState(0);
  const justCameOnlineTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notifyOfflineDataChanged = useCallback(() => {
    setOfflineDataVersion(v => v + 1);
  }, []);

  const refreshPending = useCallback(async () => {
    if (!userId) return; // no user logged in — nothing to refresh
    try {
      const breakdown = await getPendingBreakdown(userId);
      setPendingBreakdown(breakdown);
    } catch {
      // non-fatal
    }
  }, [userId]);

  // Native: subscribe to network state changes so isOffline state stays current.
  // Uses the addNetworkListener abstraction — no direct NetInfo import needed here.
  useEffect(() => {
    if (Platform.OS === 'web' || typeof window === 'undefined') return;

    const unsubscribe = addNetworkListener((offline) => {
      setIsOffline(prev => {
        if (prev === offline) return prev;
        if (!offline && userId) {
          getPendingBreakdown(userId)
            .then(breakdown => {
              setPendingBreakdown(breakdown);
              if (breakdown.total > 0) {
                setJustCameOnline(true);
                if (justCameOnlineTimer.current) clearTimeout(justCameOnlineTimer.current);
                justCameOnlineTimer.current = setTimeout(
                  () => setJustCameOnline(false),
                  10000,
                );
              }
            })
            .catch(() => {});
        }
        return offline;
      });
    });

    return unsubscribe;
  }, [userId]);

  // Web: window online/offline events
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const handleOffline = () => {
      setIsOffline(true);
      setJustCameOnline(false);
    };

    const handleOnline = async () => {
      setIsOffline(false);
      if (!userId) return;
      const breakdown = await getPendingBreakdown(userId).catch(() => DEFAULT_BREAKDOWN);
      setPendingBreakdown(breakdown);
      if (breakdown.total > 0) {
        setJustCameOnline(true);
        if (justCameOnlineTimer.current) clearTimeout(justCameOnlineTimer.current);
        justCameOnlineTimer.current = setTimeout(() => setJustCameOnline(false), 10000);
      }
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      if (justCameOnlineTimer.current) clearTimeout(justCameOnlineTimer.current);
    };
  }, []);

  // Poll pending counts periodically (every 30s when online)
  useEffect(() => {
    refreshPending();
    const interval = setInterval(() => {
      if (!isOffline && !isSyncing) refreshPending();
    }, 30000);
    return () => clearInterval(interval);
  }, [isOffline, isSyncing, refreshPending]);

  const openSyncModal = useCallback(() => setShowSyncModal(true), []);
  const closeSyncModal = useCallback(() => setShowSyncModal(false), []);

  const syncParticipant = useCallback(async (participantId: string) => {
    if (isSyncing || !userId) return;
    setIsSyncing(true);
    setSyncProgress({ stage: 'idle', percentage: 0, current: 0, total: 0 });
    try {
      await startSync(participantId, userId, (progress) => setSyncProgress(progress));
    } finally {
      setIsSyncing(false);
      setSyncProgress(null);
      await refreshPending();
      notifyOfflineDataChanged();
    }
  }, [isSyncing, userId, refreshPending, notifyOfflineDataChanged]);

  const syncAll = useCallback(async () => {
    if (isSyncing || !userId) return;
    setIsSyncing(true);
    setSyncProgress({ stage: 'idle', percentage: 0, current: 0, total: 0 });
    try {
      await startSyncAll(userId, (progress) => setSyncProgress(progress));
      setJustCameOnline(false);
    } finally {
      setIsSyncing(false);
      setSyncProgress(null);
      await refreshPending();
      notifyOfflineDataChanged();
    }
  }, [isSyncing, userId, refreshPending, notifyOfflineDataChanged]);

  const value: OfflineSyncContextType = {
    isOffline,
    isOnline: !isOffline,
    isSyncing,
    syncProgress,
    pendingSyncCount: pendingBreakdown.total,
    failedSyncCount: pendingBreakdown.failed,
    pendingBreakdown,
    justCameOnline,
    showSyncModal,
    openSyncModal,
    closeSyncModal,
    syncParticipant,
    syncAll,
    refreshPending,
    offlineDataVersion,
    notifyOfflineDataChanged,
  };

  return (
    <OfflineSyncContext.Provider value={value}>
      {children}
    </OfflineSyncContext.Provider>
  );
};

export const useOfflineSync = (): OfflineSyncContextType => {
  return useContext(OfflineSyncContext);
};

export default OfflineSyncContext;
