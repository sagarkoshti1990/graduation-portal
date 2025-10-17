/**
 * Hook for responsive column calculation
 */

import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';
import { ResponsiveColumnsConfig, ScreenSize } from '../types';

// Default breakpoints (in pixels)
const DEFAULT_BREAKPOINTS = {
  xs: 0, // 0-575px
  sm: 576, // 576-767px
  md: 768, // 768-991px
  lg: 992, // 992-1199px
  xl: 1200, // 1200px+
};

// Default column configuration
const DEFAULT_COLUMNS: ResponsiveColumnsConfig = {
  xs: 1,
  sm: 2,
  md: 2,
  lg: 3,
  xl: 4,
};

/**
 * Get current screen size based on width
 */
function getScreenSize(width: number): ScreenSize {
  if (width >= DEFAULT_BREAKPOINTS.xl) return 'xl';
  if (width >= DEFAULT_BREAKPOINTS.lg) return 'lg';
  if (width >= DEFAULT_BREAKPOINTS.md) return 'md';
  if (width >= DEFAULT_BREAKPOINTS.sm) return 'sm';
  return 'xs';
}

/**
 * Hook to get responsive column count
 */
export function useResponsiveColumns(
  customConfig?: Partial<ResponsiveColumnsConfig>,
): {
  columns: number;
  screenSize: ScreenSize;
  width: number;
} {
  const [dimensions, setDimensions] = useState({
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({
        width: window.width,
        height: window.height,
      });
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  const config = { ...DEFAULT_COLUMNS, ...customConfig };
  const screenSize = getScreenSize(dimensions.width);
  const columns = config[screenSize];

  return {
    columns,
    screenSize,
    width: dimensions.width,
  };
}

export default useResponsiveColumns;
