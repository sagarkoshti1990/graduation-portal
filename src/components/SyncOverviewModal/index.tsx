import React from 'react';
import {
  Modal,
  VStack,
  HStack,
  Text,
  Box,
  Button,
  ButtonText,
  ButtonIcon,
  Spinner,
} from '@ui';
import { LucideIcon } from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import { useOfflineSync } from '@contexts/OfflineSyncContext';

const SyncOverviewModal: React.FC = () => {
  const {
    showSyncModal,
    closeSyncModal,
    pendingBreakdown,
    syncProgress,
    isSyncing,
    syncAll,
    isOffline,
  } = useOfflineSync();
  const { t } = useLanguage();

  const { files, forms, tasks, failed, total } = pendingBreakdown;
  const allSynced = total === 0 && !isSyncing;
  const percentage = syncProgress?.percentage ?? 0;

  const stageLabel = syncProgress
    ? {
        idle: '',
        files: t('offlineSync.stageFiles'),
        forms: t('offlineSync.stageForms'),
        tasks: t('offlineSync.stageTasks'),
        done: t('offlineSync.syncSuccess'),
      }[syncProgress.stage] ?? ''
    : '';

  return (
    <Modal
      isOpen={showSyncModal}
      onClose={closeSyncModal}
      headerContent={t('offlineSync.modalTitle')}
      headerIcon={<LucideIcon name="RefreshCw" size={22} color="$primary500" />}
      size="md"
      showCloseButton={!isSyncing}
    >
      <VStack space="lg">
        {allSynced && !isSyncing ? (
          <VStack space="sm" alignItems="center" py="$4">
            <LucideIcon name="CheckCircle2" size={40} color="$success600" />
            <Text fontSize="$md" fontWeight="$semibold" color="$success600">
              {t('offlineSync.allSynced')}
            </Text>
          </VStack>
        ) : (
          <VStack space="md">
            {/* Pending item counts */}
            {!isSyncing && (
              <VStack space="sm">
                <Text fontSize="$sm" color="$textMutedForeground">
                  {t('offlineSync.pendingItems', { count: total })}
                </Text>
                {files > 0 && (
                  <HStack space="sm" alignItems="center">
                    <LucideIcon name="Paperclip" size={14} color="$textSecondary" />
                    <Text fontSize="$sm">{t('offlineSync.pendingFiles', { count: files })}</Text>
                  </HStack>
                )}
                {forms > 0 && (
                  <HStack space="sm" alignItems="center">
                    <LucideIcon name="FileText" size={14} color="$textSecondary" />
                    <Text fontSize="$sm">{t('offlineSync.pendingForms', { count: forms })}</Text>
                  </HStack>
                )}
                {tasks > 0 && (
                  <HStack space="sm" alignItems="center">
                    <LucideIcon name="CheckSquare" size={14} color="$textSecondary" />
                    <Text fontSize="$sm">{t('offlineSync.pendingTasks', { count: tasks })}</Text>
                  </HStack>
                )}
                {failed > 0 && (
                  <HStack space="sm" alignItems="center">
                    <LucideIcon name="AlertCircle" size={14} color="$error500" />
                    <Text fontSize="$sm" color="$error500">
                      {t('offlineSync.failedItems', { count: failed })}
                    </Text>
                  </HStack>
                )}
              </VStack>
            )}

            {/* Progress bar while syncing */}
            {isSyncing && (
              <VStack space="sm">
                <HStack space="sm" alignItems="center">
                  <Spinner size="small" color="$primary500" />
                  <Text fontSize="$sm" color="$textSecondary">
                    {stageLabel || t('offlineSync.syncing')}
                  </Text>
                </HStack>
                <Box
                  height={6}
                  backgroundColor="$backgroundMuted"
                  borderRadius="$full"
                  overflow="hidden"
                >
                  <Box
                    height={6}
                    backgroundColor="$primary500"
                    borderRadius="$full"
                    width={`${percentage}%`}
                  />
                </Box>
                <Text fontSize="$xs" color="$textMutedForeground" textAlign="right">
                  {t('offlineSync.syncProgress', { percentage })}
                </Text>
              </VStack>
            )}
          </VStack>
        )}

        {/* Action buttons */}
        {!isSyncing && !allSynced && (
          <HStack space="md" justifyContent="flex-end">
            <Button variant="outline" size="sm" onPress={closeSyncModal}>
              <ButtonText>{t('offlineSync.skipForNow')}</ButtonText>
            </Button>
            <Button
              variant="solid"
              size="sm"
              onPress={syncAll}
              isDisabled={isOffline}
            >
              <ButtonIcon as={LucideIcon} name="RefreshCw" mr="$1" />
              <ButtonText>{t('offlineSync.startSync')}</ButtonText>
            </Button>
          </HStack>
        )}

        {allSynced && (
          <HStack justifyContent="flex-end">
            <Button variant="solid" size="sm" onPress={closeSyncModal}>
              <ButtonText>{t('common.close') || 'Close'}</ButtonText>
            </Button>
          </HStack>
        )}

        {isOffline && !isSyncing && (
          <Text fontSize="$xs" color="$error500" textAlign="center">
            {t('offlineSync.cannotSyncOffline')}
          </Text>
        )}
      </VStack>
    </Modal>
  );
};

export default SyncOverviewModal;
