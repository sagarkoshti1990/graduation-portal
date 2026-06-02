// Native implementation (iOS / Android) — uses @react-native-community/netinfo.
// Metro loads this file for native builds; web builds use networkStatus.ts.

import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

type NetworkListener = (isOffline: boolean) => void;
const _listeners = new Set<NetworkListener>();

// Start as online; corrected within milliseconds by the eager fetch below.
let _isOffline = false;

function _notify(offline: boolean): void {
  if (_isOffline === offline) return;
  _isOffline = offline;
  _listeners.forEach(fn => { try { fn(offline); } catch { /* non-fatal */ } });
}

function _applyState(state: NetInfoState): void {
  // Treat null/undefined as "unknown → online" to avoid blocking API calls
  // while NetInfo is still initialising on Android.
  _notify(state.isConnected === false || state.isInternetReachable === false);
}

try {
  // Subscribe for ongoing updates + eagerly fetch current state.
  NetInfo.addEventListener(_applyState);
  NetInfo.fetch().then(_applyState).catch(() => {});
} catch {
  // Defensive: never crash the module (e.g. in test environments).
}

/**
 * Synchronous offline check. Safe to call anywhere without `await`.
 * Backed by NetInfo events and an eager fetch at module load time.
 */
export const isNetworkOffline = (): boolean => _isOffline;

/**
 * Fresh check — queries NetInfo directly, bypassing the cache.
 * Updates the cache as a side-effect.
 */
export const checkNetworkOffline = async (): Promise<boolean> => {
  const state = await NetInfo.fetch();
  _applyState(state);
  return _isOffline;
};

/**
 * Subscribe to network state transitions (online↔offline).
 * Returns an unsubscribe function.
 * Read `isNetworkOffline()` for the current value at subscribe time.
 */
export function addNetworkListener(fn: NetworkListener): () => void {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}
