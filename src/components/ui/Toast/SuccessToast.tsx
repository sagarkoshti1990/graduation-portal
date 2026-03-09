import React from 'react';
import { Box, HStack, Toast, ToastDescription, VStack } from '@gluestack-ui/themed';
import type { ToastPlacement } from '@app-types/components';
import LucideIcon from '../LucideIcon';
import { successToastStyles } from './Styles';
import { theme } from '@config/theme';

export type SuccessToastStyles = {
  toast?: Record<string, unknown>;
  content?: Record<string, unknown>;
  icon?: Record<string, unknown>;
  title?: Record<string, unknown>;
  iconSize?: number;
};

export type ShowSuccessToastOptions = {
  placement?: ToastPlacement;
  iconName?: string;
  iconColor?: string;
};

type SuccessToastProps = {
  id?: string;
  message: string;
  styles?: SuccessToastStyles;
  iconName?: string;
  iconColor?: string;
};

export const SuccessToast: React.FC<SuccessToastProps> = ({
  id,
  message,
  styles,
  iconName = 'CheckCircle',
  iconColor = (theme.tokens.colors.success600 as string) ?? '#00a63e',
}) => {
  const mergedStyles = {
    toast: { ...successToastStyles.toast, ...styles?.toast },
    content: { ...successToastStyles.content, ...styles?.content },
    icon: { ...successToastStyles.icon, ...styles?.icon },
    title: { ...successToastStyles.title, ...styles?.title },
    iconSize: styles?.iconSize ?? successToastStyles.iconSize ?? 16,
  };
  const iconSize = mergedStyles.iconSize ?? 16;

  return (
    <Toast nativeID={id} action="success" variant="solid" {...mergedStyles.toast}>
      <HStack space="md" alignItems="center" {...mergedStyles.content}>
        <Box {...mergedStyles.icon}>
          <LucideIcon
            name={iconName}
            size={iconSize}
            color={iconColor}
            strokeWidth={3}
          />
        </Box>
        <VStack space="xs" flex={1}>
          <ToastDescription {...mergedStyles.title}>{message}</ToastDescription>
        </VStack>
      </HStack>
    </Toast>
  );
};

export const showSuccessToast = (
  toast: { show: (config: { placement?: ToastPlacement; render: (props: { id: string }) => React.ReactElement }) => void },
  message: string,
  styles?: SuccessToastStyles,
  options?: ShowSuccessToastOptions,
) => {
  toast.show({
    placement: options?.placement ?? 'bottom',
    render: ({ id }: { id: string }) => (
      <SuccessToast
        id={id}
        message={message}
        styles={styles}
        iconName={options?.iconName}
        iconColor={options?.iconColor}
      />
    ),
  });
};

