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
  Pressable,
} from '@ui';
import { LucideIcon } from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import { useOfflineSync } from '@contexts/OfflineSyncContext';
import { useAuth } from '@contexts/AuthContext';
import { getPerParticipantPendingBreakdown, type ParticipantPendingEntry } from '../../services/dataService';
import { startSync } from '../../services/syncService';
import type { SyncProgress } from '@app-types/offline';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ParticipantSyncState {
  syncing: boolean;
  done: boolean;
  error: boolean;
  stage: SyncProgress['stage'] | null;
  completedFiles: number;
  completedForms: number;
  completedTasks: number;
}

const IDLE_STATE: ParticipantSyncState = {
  syncing: false,
  done: false,
  error: false,
  stage: null,
  completedFiles: 0,
  completedForms: 0,
  completedTasks: 0,
};

// ── Progress helper ───────────────────────────────────────────────────────────

function applyProgress(
  prev: ParticipantSyncState,
  entry: ParticipantPendingEntry,
  p: SyncProgress,
): ParticipantSyncState {
  let { completedFiles, completedForms, completedTasks } = prev;

  if (p.stage === 'files') {
    completedFiles = p.current;
  } else if (p.stage === 'forms') {
    completedFiles = entry.files;
    completedForms = p.current;
  } else if (p.stage === 'tasks') {
    completedForms = entry.forms;
    completedTasks = Math.min(p.current, entry.tasks);
  } else if (p.stage === 'done') {
    completedFiles = entry.files;
    completedForms = entry.forms;
    completedTasks = entry.tasks;
  }

  return {
    ...prev,
    stage: p.stage,
    completedFiles,
    completedForms,
    completedTasks,
    syncing: p.stage !== 'done',
    done: p.stage === 'done',
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

const SyncOverviewModal: React.FC = () => {
  const { showSyncModal, closeSyncModal, isOffline, refreshPending } = useOfflineSync();
  const { user } = useAuth();
  const { t } = useLanguage();
  const userId = user?.id ?? '';

  const [participants, setParticipants] = useState<ParticipantPendingEntry[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [syncStates, setSyncStates] = useState<Record<string, ParticipantSyncState>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkSyncing, setBulkSyncing] = useState(false);

  // ── Load participants ──────────────────────────────────────────────────────

  const loadParticipants = useCallback(async () => {
    if (!userId) return;
    setLoadingParticipants(true);
    try {
      const entries = await getPerParticipantPendingBreakdown(userId);
      setParticipants(entries);
      setSelectedIds(new Set(entries.map(e => e.participantId)));
    } catch {
      setParticipants([]);
    } finally {
      setLoadingParticipants(false);
    }
  }, [userId]);

  useEffect(() => {
    if (showSyncModal) {
      loadParticipants();
      setSyncStates({});
      setBulkSyncing(false);
    }
  }, [showSyncModal, loadParticipants]);

  // ── Per-participant sync (independent — does not block others) ─────────────

  const syncOne = useCallback(
    async (entry: ParticipantPendingEntry) => {
      const { participantId } = entry;

      setSyncStates(prev => ({
        ...prev,
        [participantId]: { ...IDLE_STATE, syncing: true, stage: 'idle' },
      }));

      try {
        await startSync(participantId, userId, (progress: SyncProgress) => {
          setSyncStates(prev => ({
            ...prev,
            [participantId]: applyProgress(
              prev[participantId] ?? IDLE_STATE,
              entry,
              progress,
            ),
          }));
        });

        // Ensure final done state (guard against missing 'done' callback)
        setSyncStates(prev => ({
          ...prev,
          [participantId]: {
            ...IDLE_STATE,
            done: true,
            stage: 'done',
            completedFiles: entry.files,
            completedForms: entry.forms,
            completedTasks: entry.tasks,
          },
        }));

        await refreshPending();

        // Remove from list 2 s after done so the user sees the success state briefly
        setTimeout(() => {
          setParticipants(prev => prev.filter(p => p.participantId !== participantId));
          setSyncStates(prev => {
            const next = { ...prev };
            delete next[participantId];
            return next;
          });
        }, 2000);
      } catch {
        setSyncStates(prev => ({
          ...prev,
          [participantId]: {
            ...(prev[participantId] ?? IDLE_STATE),
            syncing: false,
            error: true,
          },
        }));
      }
    },
    [userId, refreshPending],
  );

  // ── Bulk sync ──────────────────────────────────────────────────────────────

  const syncSelected = useCallback(async () => {
    if (isOffline || !selectedIds.size || bulkSyncing) return;
    setBulkSyncing(true);
    try {
      const toSync = participants.filter(
        p =>
          selectedIds.has(p.participantId) &&
          !syncStates[p.participantId]?.syncing &&
          !syncStates[p.participantId]?.done,
      );
      await Promise.all(toSync.map(entry => syncOne(entry)));
    } finally {
      setBulkSyncing(false);
    }
  }, [isOffline, selectedIds, bulkSyncing, participants, syncStates, syncOne]);

  // ── Selection ──────────────────────────────────────────────────────────────

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // IDs that can still be synced (not yet syncing or done)
  const syncableIds = participants
    .filter(p => !syncStates[p.participantId]?.syncing && !syncStates[p.participantId]?.done)
    .map(p => p.participantId);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds(prev => {
      const allSelected = syncableIds.every(id => prev.has(id));
      return allSelected ? new Set<string>() : new Set(syncableIds);
    });
  }, [syncableIds]);

  // ── Derived state ──────────────────────────────────────────────────────────

  const anySyncing = Object.values(syncStates).some(s => s.syncing);
  const allSynced = participants.length === 0 && !loadingParticipants;
  const allSyncableSelected = syncableIds.length > 0 && syncableIds.every(id => selectedIds.has(id));
  const selectedCount = participants.filter(
    p =>
      selectedIds.has(p.participantId) &&
      !syncStates[p.participantId]?.syncing &&
      !syncStates[p.participantId]?.done,
  ).length;

  // ── Render helpers ─────────────────────────────────────────────────────────

  const renderProgressRow = (
    done: number,
    total: number,
    label: string,
    isCurrentStage: boolean,
  ) => {
    if (total === 0) return null;
    const complete = done >= total;
    return (
      <HStack key={label} space="xs" alignItems="center">
        <LucideIcon
          name={complete ? 'CircleCheck' : isCurrentStage ? 'RefreshCw' : 'Clock'}
          size={10}
          color={complete ? '$success600' : isCurrentStage ? '$primary500' : '$textLight400'}
        />
        <Text
          fontSize="$xs"
          color={complete ? '$success600' : isCurrentStage ? '$primary500' : '$textMutedForeground'}
        >
          {done}/{total} {label}
        </Text>
      </HStack>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Modal
      isOpen={showSyncModal}
      onClose={closeSyncModal}
      headerTitle={t('offlineSync.modalTitle')}
      headerIcon={<LucideIcon name="RefreshCw" size={16} color="$primary500" />}
      size="lg"
      showCloseButton={!anySyncing}
    >
      <VStack space="md">

        {/* Loading */}
        {loadingParticipants && participants.length === 0 && (
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

        {/* Select-all bar */}
        {!loadingParticipants && syncableIds.length > 0 && (
          <HStack justifyContent="space-between" alignItems="center" px="$1">
            <Pressable onPress={toggleSelectAll}>
              <HStack space="xs" alignItems="center">
                <LucideIcon
                  name={allSyncableSelected ? 'SquareCheckBig' : 'Square'}
                  size={16}
                  color="$primary500"
                />
                <Text fontSize="$xs" color="$primary500">
                  {allSyncableSelected
                    ? t('offlineSync.deselectAll')
                    : t('offlineSync.selectAll')}
                </Text>
              </HStack>
            </Pressable>
            {selectedCount > 0 && (
              <Text fontSize="$xs" color="$textMutedForeground">
                {selectedCount}/{syncableIds.length} {t('offlineSync.selected')}
              </Text>
            )}
          </HStack>
        )}

        {/* Participant list */}
        {!loadingParticipants && participants.length > 0 && (
          <ScrollView maxHeight={350}>
            <VStack space="sm">
              {participants.map(entry => {
                const state = syncStates[entry.participantId];
                const isSyncing = state?.syncing ?? false;
                const isDone = state?.done ?? false;
                const isError = state?.error ?? false;
                const isSelected = selectedIds.has(entry.participantId);
                const canSync = !isOffline && !isSyncing && !isDone;

                const filesDone = state?.completedFiles ?? 0;
                const formsDone = state?.completedForms ?? 0;
                const tasksDone = state?.completedTasks ?? 0;

                const isFilesStage = state?.stage === 'files';
                const isFormsStage = state?.stage === 'forms';
                const isTasksStage = state?.stage === 'tasks';

                return (
                  <Pressable onPress={() => (canSync) ? toggleSelect(entry.participantId) : ""}
                    key={entry.participantId}
                    borderWidth={1}
                    borderColor={
                      isDone ? '$success300' : isError ? '$error300' : '$borderLight200'
                    }
                    borderRadius="$md"
                    p="$3"
                    backgroundColor={
                      isDone ? '$success50' : isError ? '$error50' : 'transparent'
                    }
                  >
                    <HStack justifyContent="space-between" alignItems="flex-start">
                      {/* Checkbox / status icon + participant info */}
                      <HStack space="sm" flex={1} mr="$2" alignItems="flex-start">
                        <Box width={18} alignItems="center" mt="$0.5">
                          {isSyncing ? (
                            <Spinner size="small" color="$primary500" />
                          ) : isDone ? (
                            <LucideIcon name="CircleCheck" size={16} color="$success600" />
                          ) : (
                              <LucideIcon
                                name={isSelected ? 'SquareCheckBig' : 'Square'}
                                size={16}
                                color={isSelected ? '$primary500' : '$borderLight400'}
                              />
                          )}
                        </Box>

                        <VStack flex={1} space="xs">
                          <Text fontSize="$sm" fontWeight="$semibold" numberOfLines={1}>
                            {entry.name}
                          </Text>
                          <Text fontSize="$xs" color="$textMutedForeground">
                            {t('offlineSync.participantId', { id: entry.externalId })}
                          </Text>

                          {/* Pending counts (idle) or per-category progress (syncing/done) */}
                          <HStack space="md" flexWrap="wrap" mt="$0.5">
                            {isSyncing || isDone ? (
                              <>
                                {renderProgressRow(filesDone, entry.files, t('offlineSync.labelFiles'), isFilesStage)}
                                {renderProgressRow(formsDone, entry.forms, t('offlineSync.labelForms'), isFormsStage)}
                                {renderProgressRow(tasksDone, entry.tasks, t('offlineSync.labelTasks'), isTasksStage)}
                              </>
                            ) : (
                              <>
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
                              </>
                            )}
                          </HStack>

                          {/* Stage label / status */}
                          {isSyncing && state?.stage && state.stage !== 'idle' && (
                            <Text fontSize="$xs" color="$primary500">
                              {state.stage === 'files'
                                ? t('offlineSync.stageFiles')
                                : state.stage === 'forms'
                                ? t('offlineSync.stageForms')
                                : t('offlineSync.stageTasks')}
                            </Text>
                          )}
                          {isDone && (
                            <Text fontSize="$xs" color="$success600">
                              {t('offlineSync.syncComplete')}
                            </Text>
                          )}
                          {isError && !isSyncing && (
                            <Text fontSize="$xs" color="$error500">
                              {t('offlineSync.syncError')}
                            </Text>
                          )}
                        </VStack>
                      </HStack>

                      {/* Individual sync button (hidden while syncing or done) */}
                      {/* {canSync && (
                        <Button
                          variant="outline"
                          size="xs"
                          onPress={() => syncOne(entry)}
                          isDisabled={isOffline}
                        >
                          <ButtonIcon as={LucideIcon} name="RefreshCw" mr="$1" size={12} />
                          <ButtonText>{t('offlineSync.sync')}</ButtonText>
                        </Button>
                      )} */}
                    </HStack>
                  </Pressable>
                );
              })}
            </VStack>
          </ScrollView>
        )}

        {/* Offline warning */}
        {isOffline && participants.length > 0 && (
          <Text fontSize="$xs" color="$error500" textAlign="center">
            {t('offlineSync.cannotSyncOffline')}
          </Text>
        )}

        {/* Footer */}
        <HStack space="md" justifyContent="flex-end">
          <Button
            variant="outline"
            size="sm"
            onPress={closeSyncModal}
            isDisabled={anySyncing}
          >
            <ButtonText>
              {allSynced ? (t('common.close') || 'Close') : t('offlineSync.skipForNow')}
            </ButtonText>
          </Button>

          {!allSynced && syncableIds.length > 0 && (
            <Button
              variant="solid"
              size="sm"
              onPress={syncSelected}
              isDisabled={isOffline || selectedCount === 0 || bulkSyncing}
            >
              {bulkSyncing ? (
                <Spinner size="small" color="$white" mr="$1" />
              ) : (
                <ButtonIcon as={LucideIcon} name="RefreshCw" mr="$1" />
              )}
              <ButtonText>
                {selectedCount > 0
                  ? `${t('offlineSync.syncSelected')} (${selectedCount})`
                  : t('offlineSync.syncSelected')}
              </ButtonText>
            </Button>
          )}
        </HStack>

      </VStack>
    </Modal>
  );
};

export default SyncOverviewModal;
