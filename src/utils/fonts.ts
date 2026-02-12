import { Platform } from 'react-native';

/**
 * Font utility for loading and using Inter font across platforms
 * For React Native: Fonts should be added to assets/fonts/ directory
 * For Web: Fonts are loaded via Google Fonts in index.html
 */

export const FONT_FAMILY = {
  INTER: Platform.select({
    ios: 'Inter',
    android: 'Inter',
    web: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
    default: 'Inter',
  }),
} as const;

/**
 * Get the default font family for the current platform
 */
export const getDefaultFontFamily = (): string => {
  return FONT_FAMILY.INTER || 'System';
};

