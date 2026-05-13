import React from 'react';
import { HStack, Text, Box, Button, ButtonText, ButtonIcon, Pressable } from '@ui';
import { LucideIcon } from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import { useOfflineSync } from '@contexts/OfflineSyncContext';

const OnlineSyncBanner: React.FC = () => {
  const { isOffline, pendingSyncCount, justCameOnline, openSyncModal, isSyncing } = useOfflineSync();
  const { t } = useLanguage();

  // Only show when online and there are pending changes
  if (isOffline || pendingSyncCount === 0) return null;

  const isReconnect = justCameOnline;
  const bg = isReconnect ? '$success600' : '$warning500';

  return (
    <Box backgroundColor={bg} px="$4" py="$2">
      <HStack space="sm" alignItems="center" justifyContent="space-between">
        <HStack space="sm" alignItems="center" flex={1}>
          <LucideIcon
            name={isReconnect ? 'Wifi' : 'CloudUpload'}
            size={16}
            color="white"
          />
          <Text color="white" fontSize="$sm" fontWeight="$medium" flexShrink={1}>
            {isReconnect
              ? t('offlineSync.backOnline', { count: pendingSyncCount })
              : t('offlineSync.pendingChanges', { count: pendingSyncCount })}
          </Text>
        </HStack>
        <Button
          size="xs"
          variant="outline"
          borderColor="white"
          onPress={openSyncModal}
          isDisabled={isSyncing}
        >
          <ButtonText color="white" fontSize="$xs">
            {isSyncing ? t('offlineSync.syncing') : t('offlineSync.syncNow')}
          </ButtonText>
        </Button>
      </HStack>
    </Box>
  );
};

export default OnlineSyncBanner;
