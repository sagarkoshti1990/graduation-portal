/**
 * Logger utility that only logs in development builds
 * Uses __DEV__ flag which is automatically available in React Native
 * and defined via webpack.DefinePlugin for web builds
 */

// Type definitions for __DEV__ global variable
declare const __DEV__: boolean;

/**
 * Check if we're in development mode
 * __DEV__ is:
 * - Automatically available as a global in React Native
 * - Defined by webpack.DefinePlugin for web builds
 * - Falls back to NODE_ENV check if not available
 */
const isDev = (): boolean => {
  try {
    return typeof __DEV__ !== 'undefined' ? __DEV__ : false;
  } catch {
    return (
      typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production'
    );
  }
};

/**
 * Generic logger function that only executes in dev builds
 */
const logger = {
  /**
   * Log general information (replaces console.log)
   */
  log: (...args: any[]): void => {
    if (isDev()) {
      console.log(...args);
    }
  },

  /**
   * Log warnings (replaces console.warn)
   */
  warn: (...args: any[]): void => {
    if (isDev()) {
      console.warn(...args);
    }
  },

  /**
   * Log errors (replaces console.error)
   */
  error: (...args: any[]): void => {
    if (isDev()) {
      console.error(...args);
    }
  },

  /**
   * Log info messages (replaces console.info)
   */
  info: (...args: any[]): void => {
    if (isDev()) {
      console.info(...args);
    }
  },

  /**
   * Log debug messages (replaces console.debug)
   */
  debug: (...args: any[]): void => {
    if (isDev()) {
      console.debug(...args);
    }
  },
};

export default logger;
