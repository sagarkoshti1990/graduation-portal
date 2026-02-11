/**
 * Storage keys used throughout the application.
 * Used for both localStorage (web) and AsyncStorage (React Native).
 */
export const STORAGE_KEYS = {
  /** Language preference storage key */
  LANGUAGE: '@app_language',
  /** Color mode preference storage key (light/dark) */
  COLOR_MODE: 'colorMode',
  /** Authentication token storage key */
  AUTH_TOKEN: '@auth_token',
  /** Authentication user storage key */
  AUTH_USER: '@auth_user',
  /** Authentication refresh token storage key */
  AUTH_REFRESH_TOKEN: '@auth_refresh_token',
  /** Remember Me preference storage key */
  AUTH_REMEMBER_ME: '@auth_remember_me',
  /** Internal access token storage key */
  INTERNAL_ACCESS_TOKEN: '@internal_access_token',
  /** Entity types storage key (for caching province, district, site entity types) */
  ENTITY_TYPES: '@entity_types',
} as const;

