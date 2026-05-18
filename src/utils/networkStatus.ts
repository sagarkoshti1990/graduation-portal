import { Platform } from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

// ── Subscriber registry ───────────────────────────────────────────────────────
type NetworkListener = (isOffline: boolean) => void;
const _listeners = new Set<NetworkListener>();

function _notify(offline: boolean): void {
  if (_isOffline === offline) return; // no change — skip re-notification
  _isOffline = offline;
  _listeners.forEach(fn => { try { fn(offline); } catch { /* non-fatal */ } });
}

// ── Module-level cache ────────────────────────────────────────────────────────
// Starts with the best synchronous guess available per platform.
// Kept current by platform event listeners — no polling needed.
let _isOffline: boolean =
  Platform.OS === 'web' && typeof window !== 'undefined'
    ? !window.navigator.onLine
    : false; // native: assume online until first NetInfo event fires

function _applyState(state: NetInfoState): void {
  // Treat null/undefined as "unknown → online" to avoid blocking API calls
  // while NetInfo is still initialising on Android.
  _notify(state.isConnected === false || state.isInternetReachable === false);
}

// ── Platform event listeners ──────────────────────────────────────────────────
try {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.addEventListener('online',  () => _notify(false));
    window.addEventListener('offline', () => _notify(true));
  } else {
    // Native: subscribe for ongoing updates and do an eager fetch so the cache
    // is accurate within milliseconds of the first import.
    NetInfo.addEventListener(_applyState);
    NetInfo.fetch().then(_applyState).catch(() => {});
  }
} catch {
  // Defensive: never let listener setup crash the module (e.g. in tests).
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Synchronous offline check — reads the module-level cache.
 *
 * Safe to call anywhere without `await`.
 * Accuracy:
 *   - Web:    immediate (backed by navigator.onLine + window events).
 *   - Native: near-instant after app start (backed by NetInfo events + eager fetch).
 */
export const isNetworkOffline = (): boolean => _isOffline;

/**
 * Fresh async check — queries the platform directly instead of reading the cache.
 * Also updates the cache as a side-effect.
 *
 * Use before critical operations (e.g. background sync) where a stale
 * cache value is unacceptable.
 */
export const checkNetworkOffline = async (): Promise<boolean> => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    _notify(!window.navigator.onLine);
    return _isOffline;
  }
  const state = await NetInfo.fetch();
  _applyState(state);
  return _isOffline;
};

/**
 * Subscribe to network state changes.
 * The listener is called whenever the offline state transitions (online→offline
 * or offline→online). It is NOT called with the current state immediately —
 * read `isNetworkOffline()` for the current value on subscribe.
 *
 * Returns an unsubscribe function.
 */
export function addNetworkListener(fn: NetworkListener): () => void {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}
