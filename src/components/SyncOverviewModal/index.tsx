import React, { useEffect, useState, useCallback } from 'react';
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
  ScrollView,
} from '@ui';
import { LucideIcon } from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import { useOfflineSync } from '@contexts/OfflineSyncContext';
import { useAuth } from '@contexts/AuthContext';
import { getPerParticipantPendingBreakdown, type ParticipantPendingEntry } from '../../services/dataService';

const SyncOverviewModal: React.FC = () => {
  const {
    showSyncModal,
    closeSyncModal,
    syncProgress,
    isSyncing,
    syncParticipant,
    syncAll,
    isOffline,
    refreshPending,
  } = useOfflineSync();
  const { user } = useAuth();
  const { t } = useLanguage();

  const [participants, setParticipants] = useState<ParticipantPendingEntry[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const userId = user?.id ?? '';

  const loadParticipants = useCallback(async () => {
    if (!userId) return;
    setLoadingParticipants(true);
    try {
      const entries = await getPerParticipantPendingBreakdown(userId);
      setParticipants(entries);
    } catch {
      setParticipants([]);
    } finally {
      setLoadingParticipants(false);
    }
  }, [userId]);

  useEffect(() => {
    if (showSyncModal) loadParticipants();
  }, [showSyncModal, loadParticipants]);

  // Refresh list after any sync completes
  useEffect(() => {
    if (!isSyncing && showSyncModal) loadParticipants();
  }, [isSyncing]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSyncOne = async (participantId: string) => {
    setSyncingId(participantId);
    try {
      await syncParticipant(participantId);
      await loadParticipants();
      await refreshPending();
    } finally {
      setSyncingId(null);
    }
  };

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

  const allSynced = participants.length === 0 && !loadingParticipants && !isSyncing;

  return (
    <Modal
      isOpen={showSyncModal}
      onClose={closeSyncModal}
      headerTitle={t('offlineSync.modalTitle')}
      headerIcon={<LucideIcon name="RefreshCw" size={16} color="$primary500" />}
      size="md"
      showCloseButton={!isSyncing}
    >
      <VStack space="lg">
        {/* Loading state */}
        {loadingParticipants && !isSyncing && (
          <HStack space="sm" alignItems="center" justifyContent="center" py="$2">
            <Spinner size="small" color="$primary500" />
            <Text fontSize="$sm" color="$textSecondary">{t('common.loading')}</Text>
          </HStack>
        )}

        {/* All synced */}
        {allSynced && (
          <VStack space="sm" alignItems="center" py="$4">
            <LucideIcon name="CircleCheck" size={40} color="$success600" />
            <Text fontSize="$md" fontWeight="$semibold" color="$success600">
              {t('offlineSync.allSynced')}
            </Text>
          </VStack>
        )}

        {/* Per-participant list */}
        {!loadingParticipants && participants.length > 0 && !isSyncing && (
          <ScrollView maxHeight={300}>
            <VStack space="sm">
              {participants.map((entry) => (
                <Box
                  key={entry.participantId}
                  borderWidth={1}
                  borderColor="$borderLight200"
                  borderRadius="$md"
                  p="$3"
                >
                  <HStack justifyContent="space-between" alignItems="center">
                    <VStack flex={1} mr="$2">
                      <Text fontSize="$sm" fontWeight="$semibold" numberOfLines={1}>
                        {entry.name}
                      </Text>
                      <Text fontSize="$xs" color="$textMutedForeground">
                        {t('offlineSync.participantId', { id: entry.externalId })}
                      </Text>
                      <HStack space="sm" mt="$1" flexWrap="wrap">
                        {entry.files > 0 && (
                          <Text fontSize="$xs" color="$textSecondary">
                            {t('offlineSync.pendingFiles', { count: entry.files })}
                          </Text>
                        )}
                        {entry.forms > 0 && (
                          <Text fontSize="$xs" color="$textSecondary">
                            {t('offlineSync.pendingForms', { count: entry.forms })}
                          </Text>
                        )}
                        {entry.tasks > 0 && (
                          <Text fontSize="$xs" color="$textSecondary">
                            {t('offlineSync.pendingTasks', { count: entry.tasks })}
                          </Text>
                        )}
                      </HStack>
                    </VStack>
                    <Button
                      variant="outline"
                      size="xs"
                      onPress={() => handleSyncOne(entry.participantId)}
                      isDisabled={isOffline || !!syncingId}
                    >
                      {syncingId === entry.participantId ? (
                        <Spinner size="small" color="$primary500" />
                      ) : (
                        <>
                          <ButtonIcon as={LucideIcon} name="RefreshCw" mr="$1" size={12} />
                          <ButtonText>{t('offlineSync.sync')}</ButtonText>
                        </>
                      )}
                    </Button>
                  </HStack>
                </Box>
              ))}
            </VStack>
          </ScrollView>
        )}

        {/* Progress bar while syncing all */}
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

        {isOffline && !isSyncing && (
          <Text fontSize="$xs" color="$error500" textAlign="center">
            {t('offlineSync.cannotSyncOffline')}
          </Text>
        )}

        {/* Action buttons */}
        {!isSyncing && (
          <HStack space="md" justifyContent="flex-end">
            <Button variant="outline" size="sm" onPress={closeSyncModal}>
              <ButtonText>{allSynced ? (t('common.close') || 'Close') : t('offlineSync.skipForNow')}</ButtonText>
            </Button>
            {!allSynced && (
              <Button
                variant="solid"
                size="sm"
                onPress={syncAll}
                isDisabled={isOffline}
              >
                <ButtonIcon as={LucideIcon} name="RefreshCw" mr="$1" />
                <ButtonText>{t('offlineSync.startSync')}</ButtonText>
              </Button>
            )}
          </HStack>
        )}
      </VStack>
    </Modal>
  );
};

export default SyncOverviewModal;
