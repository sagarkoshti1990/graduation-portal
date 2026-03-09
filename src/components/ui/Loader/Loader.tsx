import React from 'react';
import { Spinner, Box, VStack, Text } from '@ui';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';

/**
 * Props for Loader component
 */
export interface LoaderProps {
  /** Size of the spinner */
  size?: 'small' | 'large';
  /** Color of the spinner */
  color?: string;
  /** Optional loading message to display below the spinner */
  message?: string;
  /** Whether to show the loader in full screen mode */
  fullScreen?: boolean;
  /** Custom container styles */
  containerProps?: Record<string, unknown>;
}

/**
 * Loader Component
 * 
 * A reusable loading spinner component using Gluestack UI Spinner.
 * Can display with or without a loading message, and supports full-screen mode.
 * 
 * @example
 * <Loader />
 * 
 * @example
 * <Loader size="large" color="$primary500" message="Loading..." />
 * 
 * @example
 * <Loader fullScreen message="Please wait..." />
 * 
 * @example
 * <Loader size="small" color="$secondary500" message="Processing..." />
 */
export const Loader: React.FC<LoaderProps> = ({
  size = 'large',
  color = '$primary500',
  message,
  fullScreen = false,
  containerProps,
}) => {
  const containerStyles = fullScreen
    ? {
        flex: 1,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        minHeight: '100%' as const,
      }
    : {
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        py: '$8' as const,
      };

  return (
    <Box {...containerStyles} {...containerProps}>
      <VStack space="md" alignItems="center">
        <Spinner size={size} color={color} />
        {message && (
          <Text
            {...TYPOGRAPHY.paragraph}
            color="$textMutedForeground"
            textAlign="center"
          >
            {message}
          </Text>
        )}
      </VStack>
    </Box>
  );
};

export default Loader;

