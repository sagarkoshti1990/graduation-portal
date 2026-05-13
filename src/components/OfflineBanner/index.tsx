import React from 'react';
import { HStack, Text, Box } from '@ui';
import { LucideIcon } from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import { useOfflineSync } from '@contexts/OfflineSyncContext';

const OfflineBanner: React.FC = () => {
  const { isOffline } = useOfflineSync();
  const { t } = useLanguage();

  if (!isOffline) return null;

  return (
    <Box
      backgroundColor="$error600"
      px="$4"
      py="$2"
    >
      <HStack space="sm" alignItems="center" justifyContent="center">
        <LucideIcon name="WifiOff" size={16} color="white" />
        <Text color="white" fontSize="$sm" fontWeight="$medium">
          {t('offlineSync.banner')}
        </Text>
      </HStack>
    </Box>
  );
};

export default OfflineBanner;
