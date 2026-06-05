// Web implementation — uses navigator.onLine and window events.
// Metro loads this file for web builds; native builds use networkStatus.native.ts.

type NetworkListener = (isOffline: boolean) => void;
const _listeners = new Set<NetworkListener>();

let _isOffline: boolean =
  typeof window !== 'undefined' ? !window.navigator.onLine : false;

function _notify(offline: boolean): void {
  if (_isOffline === offline) return;
  _isOffline = offline;
  _listeners.forEach(fn => { try { fn(offline); } catch { /* non-fatal */ } });
}

if (typeof window !== 'undefined') {
  window.addEventListener('online',  () => _notify(false));
  window.addEventListener('offline', () => _notify(true));
}

/**
 * Synchronous offline check. Safe to call anywhere without `await`.
 * Backed by navigator.onLine and window online/offline events on web.
 */
export const isNetworkOffline = (): boolean => _isOffline;

/**
 * Fresh check — re-reads navigator.onLine directly.
 * Updates the cache as a side-effect.
 */
export const checkNetworkOffline = async (): Promise<boolean> => {
  if (typeof window !== 'undefined') {
    _notify(!window.navigator.onLine);
  }
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
