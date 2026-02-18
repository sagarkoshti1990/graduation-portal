import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import {
  useToast,
  Toast,
  ToastDescription,
  VStack,
  HStack,
  Box,
  Pressable,
} from '@gluestack-ui/themed';
import { LucideIcon } from '@ui';
import { theme } from '@config/theme';
import type { AlertOptions } from '@app-types/components';
import { useLanguage } from '@contexts/LanguageContext';

/*
  Example usage:
  const { showAlert } = useAlert();

  // Show different types of alerts with default placement (bottom)
  showAlert('error', 'Operation failed');
  showAlert('success', 'Data saved!');
  showAlert('info', 'Processing...');
  showAlert('warning', 'Please check your input');

  // Show alert with custom placement
  showAlert('success', 'Data saved!', { placement: 'top-right' });
  showAlert('error', 'Operation failed', { placement: 'bottom-left' });
  showAlert('info', 'Processing...', { placement: 'bottom', duration: 5000 });
*/

// Icon mapping for different alert types
const getAlertIcon = (action: 'error' | 'warning' | 'success' | 'info' | 'attention') => {
  switch (action) {
    case 'success':
      return { name: 'CheckCircle', color: theme.tokens.colors.success600 || '#00a63e' };
    case 'error':
      return { name: 'XCircle', color: theme.tokens.colors.error600 || '#dc2626' };
    case 'warning':
      return { name: 'AlertTriangle', color: '#f59e0b' };
    case 'info':
      return { name: 'Info', color: theme.tokens.colors.info100 || '#0ea5e9' };
    case 'attention':
      return { name: 'AlertCircle', color: '#f59e0b' };
    default:
      return { name: 'Info', color: theme.tokens.colors.info100 || '#0ea5e9' };
  }
};

// Toast content component with progress bar
const ToastContent = ({ 
  id, 
  action, 
  variant, 
  icon, 
  description, 
  duration,
  onClose 
}: {
  id: string;
  action: 'error' | 'warning' | 'success' | 'info' | 'attention';
  variant: 'outline' | 'solid' | 'accent';
  icon: { name: string; color: string };
  description: string;
  duration: number;
  onClose: () => void;
}) => {
  const [progress, setProgress] = useState(100);
  const { t } = useLanguage();

  useEffect(() => {
    const interval = 50; // Update every 50ms for smooth animation
    const decrement = (interval / duration) * 100;
    
    const timer = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev - decrement;
        return newProgress < 0 ? 0 : newProgress;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [duration]);

  return (
    <Toast 
      nativeID={`toast-${id}`} 
      action={action} 
      variant={variant}
      padding="$0"
    >
      <VStack width="100%">
        <Box paddingHorizontal="$4" paddingTop="$3" paddingBottom="$2">
          <HStack space="md" alignItems="center" justifyContent="space-between">
            <HStack space="md" alignItems="center" flex={1}>
              <LucideIcon name={icon.name} size={16} color={icon.color} />
              <VStack space="xs" flex={1}>
                <ToastDescription>{t(description)}</ToastDescription>
              </VStack>
            </HStack>
            {/* Close button */}
            <Pressable onPress={onClose} padding="$1">
              <LucideIcon 
                name="X" 
                size={16} 
                color={icon.color}
              />
            </Pressable>
          </HStack>
        </Box>
        {/* Progress bar showing time remaining - at the very bottom without padding */}
        <Box 
          width="100%" 
          height={3} 
          bg="$backgroundLight200" 
          overflow="hidden"
          marginTop="$0"
          marginBottom="$0"
        >
          <Box 
            width={`${progress}%`} 
            height="100%" 
            bg={icon.color}
            // @ts-ignore - className only exists on web
            className={Platform.OS === 'web' ? 'toast-progress-bar' : undefined}
          />
        </Box>
      </VStack>
    </Toast>
  );
};

export const useAlert = () => {
  const toast = useToast();

  const showAlert = (
    action: 'error' | 'warning' | 'success' | 'info' | 'attention',
    description: string,
    options: AlertOptions = {},
  ) => {
    const {
      variant = 'solid',
      placement = 'bottom',
      duration = 20000,
    } = options;

    const icon = getAlertIcon(action);

    // Convert placement format if needed (Gluestack UI uses spaces, not hyphens)
    const gluestackPlacement = placement.replace('-', ' ') as any;
    
    const toastId = toast.show({
      placement: gluestackPlacement,
      duration,
      render: ({ id }) => {
        return (
          <ToastContent
            id={id}
            action={action}
            variant={variant as 'outline' | 'solid' | 'accent'}
            icon={icon}
            description={description}
            duration={duration}
            onClose={() => toast.close(id)}
          />
        );
      },
    });
    
    return toastId;
  };

  return {
    showAlert,
  };
};
