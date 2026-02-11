/**
 * Authentication Configuration
 * Config-driven settings for authentication behavior
 */

export interface AuthConfig {
  /**
   * Remember Me Configuration
   */
  rememberMe: {
    /**
     * Whether to clear auth data when tab/window closes if rememberMe is false
     * Only applies to web platform
     */
    clearOnTabClose: boolean;
    /**
     * Whether to enable remember me functionality
     */
    enabled: boolean;
  };
}

/**
 * Default authentication configuration
 */
export const authConfig: AuthConfig = {
  rememberMe: {
    /**
     * Clear auth data (token, user, refresh token) when tab closes
     * if rememberMe was false during login
     * Only works on web platform
     */
    clearOnTabClose: true,
    /**
     * Enable remember me functionality
     */
    enabled: true,
  },
};

/**
 * Get authentication configuration
 * Can be extended to load from environment variables or other sources
 */
export const getAuthConfig = (): AuthConfig => {
  return authConfig;
};

