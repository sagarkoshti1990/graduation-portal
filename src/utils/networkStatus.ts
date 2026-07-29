import NetInfo from '@react-native-community/netinfo';

type NetworkListener = (isOffline: boolean) => void;
const _listeners = new Set<NetworkListener>();

// Start as online; corrected within milliseconds by the eager fetch below.
let _isOffline = false;

// Listen for network changes
NetInfo.addEventListener(state => {
  const offline =
    !state.isConnected || state.isInternetReachable === false;

  if (_isOffline !== offline) {
    _isOffline = offline;
    _listeners.forEach(listener => listener(offline));
  }
});

// Get initial state
NetInfo.fetch().then(state => {
  _isOffline =
    !state.isConnected || state.isInternetReachable === false;
});

/**
 * Returns the cached offline status.
 */
export const isNetworkOffline = (): boolean => _isOffline;

/**
 * Performs a fresh network check.
 */
export const checkNetworkOffline = async (): Promise<boolean> => {
  const state = await NetInfo.fetch();

  _isOffline =
    !state.isConnected || state.isInternetReachable === false;

  return _isOffline;
};

/**
 * Subscribe to offline/online changes.
 */
export const addNetworkListener = (
  listener: NetworkListener
): (() => void) => {
  _listeners.add(listener);

  // Emit current state immediately
  listener(_isOffline);

  return () => _listeners.delete(listener);
};