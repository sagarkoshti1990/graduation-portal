// Color palette based on the provided design images
export const colors = {
  // Primary colors
  primary: '#8B0000', // Maroon - main accent color
  primaryLight: '#A52A2A',
  primaryDark: '#5D0000',

  // Secondary colors
  secondary: '#0066CC', // Blue
  secondaryLight: '#4A9EFF',
  secondaryDark: '#004499',

  // Status colors
  success: '#28A745', // Green
  warning: '#FFC107', // Yellow
  danger: '#DC3545', // Red
  info: '#17A2B8', // Cyan

  // Neutral colors
  white: '#FFFFFF',
  lightGray: '#F8F9FA',
  gray: '#6C757D',
  darkGray: '#495057',
  black: '#2C3E50',

  // Progress colors
  progressBlue: '#0066CC', // Light blue for progress bars
  progressPurple: '#6F42C1', // Purple for progress text

  // Background colors
  background: '#FFFFFF',
  cardBackground: '#FFFFFF',
  sectionBackground: '#F8F9FA',

  // Border colors
  border: '#E9ECEF',
  borderLight: '#F1F3F4',

  // Text colors
  textPrimary: '#2C3E50',
  textSecondary: '#6C757D',
  textLight: '#ADB5BD',

  // Status badge colors
  notEnrolled: '#8B0000', // Maroon
  enrolled: '#0066CC', // Blue
  inProgress: '#FF6B35', // Orange
  completed: '#28A745', // Green
};

export const typography = {
  // Font sizes
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 32,

  // Font weights
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',

  // Line heights
  tight: 1.2,
  normal: 1.4,
  relaxed: 1.6,
};

export const spacing = {
  xs: 4,
  sm: 8,
  base: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

export const borderRadius = {
  sm: 4,
  base: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  base: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
};

// Component-specific styles
export const componentStyles = {
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    ...shadows.base,
  },

  button: {
    primary: {
      backgroundColor: colors.primary,
      borderRadius: borderRadius.base,
      paddingHorizontal: spacing.base,
      paddingVertical: spacing.sm,
    },
    secondary: {
      backgroundColor: colors.lightGray,
      borderRadius: borderRadius.base,
      paddingHorizontal: spacing.base,
      paddingVertical: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
  },

  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.base,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    fontSize: typography.base,
    color: colors.textPrimary,
  },

  progressBar: {
    height: 8,
    backgroundColor: colors.lightGray,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor: colors.progressBlue,
    borderRadius: borderRadius.sm,
  },
};

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  componentStyles,
};
