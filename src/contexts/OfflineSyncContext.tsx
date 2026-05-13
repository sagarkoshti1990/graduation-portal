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
import { getPendingBreakdown, isNetworkOffline, type PendingBreakdown } from '../services/dataService';
import { startSync, startSyncAll } from '../services/syncService';
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
}

const DEFAULT_BREAKDOWN: PendingBreakdown = { files: 0, forms: 0, tasks: 0, failed: 0, total: 0 };

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
});

export const OfflineSyncProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOffline, setIsOffline] = useState<boolean>(isNetworkOffline());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [pendingBreakdown, setPendingBreakdown] = useState<PendingBreakdown>(DEFAULT_BREAKDOWN);
  const [justCameOnline, setJustCameOnline] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const justCameOnlineTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshPending = useCallback(async () => {
    try {
      const breakdown = await getPendingBreakdown();
      setPendingBreakdown(breakdown);
    } catch {
      // non-fatal
    }
  }, []);

  // Network event listeners (web only — native uses API error detection)
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const handleOffline = () => {
      setIsOffline(true);
      setJustCameOnline(false);
    };

    const handleOnline = async () => {
      setIsOffline(false);
      const breakdown = await getPendingBreakdown().catch(() => DEFAULT_BREAKDOWN);
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
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncProgress({ stage: 'idle', percentage: 0, current: 0, total: 0 });
    try {
      await startSync(participantId, (progress) => setSyncProgress(progress));
    } finally {
      setIsSyncing(false);
      setSyncProgress(null);
      await refreshPending();
    }
  }, [isSyncing, refreshPending]);

  const syncAll = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncProgress({ stage: 'idle', percentage: 0, current: 0, total: 0 });
    try {
      await startSyncAll((progress) => setSyncProgress(progress));
      setJustCameOnline(false);
    } finally {
      setIsSyncing(false);
      setSyncProgress(null);
      await refreshPending();
    }
  }, [isSyncing, refreshPending]);

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
