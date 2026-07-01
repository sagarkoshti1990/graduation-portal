import React, { useEffect, useState, useCallback, useRef } from 'react';
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
import { startSync, type SyncSkipOptions } from '../../services/syncService';
import {
  runValidationForParticipant,
  buildSkipSets,
  createSyncValidationCache,
  type ParticipantValidationPlan,
  type TaskConflictDetails,
} from '../../services/syncValidationService';
import {
  deleteParticipantOfflineData,
  deleteProjectOfflineData,
  deleteObservationOfflineData,
  deleteTaskOfflineData,
} from '../../services/offlineCleanupService';
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

// ── Dialog types ──────────────────────────────────────────────────────────────

/**
 * One entry per distinct dialog kind.
 *
 *  participant-blocked   → "Participant Progress Updated" (Cancel | Remove Offline Data)
 *  project-blocked       → "Project Already Updated" (Cancel | Skip & Remove)
 *  task-conflict         → "Task Conflict Detected"  (Cancel | Override & Sync | Skip & Remove)
 *  form-blocked          → "Task Observation Already Updated" (Cancel | Skip & Remove)
 *  form-completed        → "Observation Already Completed" (Cancel | Skip & Remove)
 *  participant-conflict  → "Data Conflict Detected" (Cancel | Override & Sync)
 *  project-conflict      → "Data Conflict Detected" (Cancel | Override & Sync)
 *  form-conflict         → "Data Conflict Detected" (Cancel | Override & Sync)
 */
type DialogKind =
  | 'participant-blocked'
  | 'project-blocked'
  | 'task-conflict'
  | 'form-blocked'
  | 'form-completed'
  | 'participant-conflict'
  | 'project-conflict'
  | 'form-conflict';

interface DialogItem {
  id: string;
  kind: DialogKind;
  participantId: string;
  participantName: string;
  /** Online participant status — for 'participant-blocked' message interpolation */
  onlineStatus?: string;
  projectId?: string;
  taskId?: string;
  formId?: string;
  /** Rich conflict details for the 'task-conflict' dialog */
  taskConflict?: TaskConflictDetails;
  /** Observation conflict sub-type — drives the correct message in 'form-conflict' */
  conflictSubType?: 'draft-ahead' | 'timestamp';
}

/** What the user chose in a dialog. */
type DialogDecision = 'cancel' | 'remove' | 'override' | 'ok';

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

// ── Task conflict helpers ─────────────────────────────────────────────────────

function formatTaskStatus(status?: string): string {
  if (!status) return '—';
  return status
    .replace(/-/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^\w/, c => c.toUpperCase());
}

function formatTaskDate(dateStr?: string): string {
  if (!dateStr) return '—';
  try { return new Date(dateStr).toLocaleString(); } catch { return dateStr; }
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

  // ── Validation / dialog state ──────────────────────────────────────────────
  const [isValidating, setIsValidating] = useState(false);
  const [currentDialog, setCurrentDialog] = useState<DialogItem | null>(null);
  const dialogResolverRef = useRef<((d: DialogDecision) => void) | null>(null);

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
      setIsValidating(false);
      setCurrentDialog(null);
    }
  }, [showSyncModal, loadParticipants]);

  // ── Sequential dialog queue ────────────────────────────────────────────────

  const showDialog = useCallback((item: DialogItem): Promise<DialogDecision> => {
    return new Promise(resolve => {
      dialogResolverRef.current = resolve;
      setCurrentDialog(item);
    });
  }, []);

  const resolveDialog = useCallback((decision: DialogDecision) => {
    dialogResolverRef.current?.(decision);
    dialogResolverRef.current = null;
    setCurrentDialog(null);
  }, []);

  // ── Per-participant sync ───────────────────────────────────────────────────

  const syncOne = useCallback(
    async (entry: ParticipantPendingEntry, skipOptions?: SyncSkipOptions) => {
      const { participantId } = entry;
      setSyncStates(prev => ({
        ...prev,
        [participantId]: { ...IDLE_STATE, syncing: true, stage: 'idle' },
      }));
      try {
        await startSync(participantId, userId, (progress: SyncProgress) => {
          setSyncStates(prev => ({
            ...prev,
            [participantId]: applyProgress(prev[participantId] ?? IDLE_STATE, entry, progress),
          }));
        }, skipOptions);

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
        setTimeout(() => {
          setParticipants(prev => prev.filter(p => p.participantId !== participantId));
          setSyncStates(prev => { const n = { ...prev }; delete n[participantId]; return n; });
        }, 2000);
      } catch {
        setSyncStates(prev => ({
          ...prev,
          [participantId]: { ...(prev[participantId] ?? IDLE_STATE), syncing: false, error: true },
        }));
      }
    },
    [userId, refreshPending],
  );

  // ── Bulk sync with validation + per-type dialogs ──────────────────────────

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
      if (!toSync.length) return;

      // ── Phase 1: Validate all selected participants ──────────────────────
      setIsValidating(true);
      const validationCache = createSyncValidationCache();
      const planResults = await Promise.allSettled(
        toSync.map(p => runValidationForParticipant(p.participantId, userId, validationCache)),
      );
      setIsValidating(false);

      const planMap = new Map<string, ParticipantValidationPlan>();
      planResults.forEach((r, i) => {
        if (r.status === 'fulfilled') planMap.set(toSync[i].participantId, r.value);
      });

      // ── Phase 2: Show per-type dialogs sequentially ──────────────────────
      //  Track participants to skip entirely (blocked or conflict-cancelled)
      const skipParticipantIds = new Set<string>();
      //  Tracks projects the user chose to skip (conflict-cancelled)
      const extraSkipProjectIds = new Set<string>();
      //  Tracks forms the user approved for override-sync despite conflict
      const overriddenConflictFormIds = new Set<string>();
      //  Tracks tasks the user approved for override-sync despite conflict
      const overriddenConflictTaskIds = new Set<string>();

      for (const entry of toSync) {
        const plan = planMap.get(entry.participantId);
        if (!plan) continue;

        // ── 1. Participant blocked ─────────────────────────────────────────
        if (plan.participantBlocked) {
          const decision = await showDialog({
            id: `participant-blocked-${entry.participantId}`,
            kind: 'participant-blocked',
            participantId: entry.participantId,
            participantName: entry.name,
            onlineStatus: plan.onlineParticipantStatus,
          });
          if (decision === 'remove') {
            await deleteParticipantOfflineData(userId, [entry.participantId]);
            await refreshPending();
          }
          skipParticipantIds.add(entry.participantId);
          continue; // nothing further can sync for this participant
        }

        // ── 2. Participant conflict (equal status, timestamp divergence) ───
        if (plan.participantConflict) {
          const decision = await showDialog({
            id: `participant-conflict-${entry.participantId}`,
            kind: 'participant-conflict',
            participantId: entry.participantId,
            participantName: entry.name,
          });
          if (decision === 'cancel') {
            skipParticipantIds.add(entry.participantId);
            continue;
          }
          // 'override' → proceed with all items for this participant
        }

        // ── 3. Blocked projects ────────────────────────────────────────────
        for (const projectId of plan.blockedProjectIds) {
          const decision = await showDialog({
            id: `project-blocked-${projectId}`,
            kind: 'project-blocked',
            participantId: entry.participantId,
            participantName: entry.name,
            projectId,
          });
          if (decision === 'remove') {
            await deleteProjectOfflineData(userId, entry.participantId, projectId);
            await refreshPending();
          }
          // buildSkipSets already adds blockedProjectIds to skipProjectIds
        }

        // ── 4. Project conflicts ───────────────────────────────────────────
        for (const projectId of plan.conflictProjectIds) {
          const decision = await showDialog({
            id: `project-conflict-${projectId}`,
            kind: 'project-conflict',
            participantId: entry.participantId,
            participantName: entry.name,
            projectId,
          });
          if (decision === 'cancel') {
            extraSkipProjectIds.add(projectId);
          }
          // 'override' → proceed with task sync for this project
        }

        // ── 5. Conflicting tasks ───────────────────────────────────────────
        for (const task of plan.taskResults.filter(tr => tr.outcome === 'conflict')) {
          const decision = await showDialog({
            id: `task-conflict-${task.taskId}`,
            kind: 'task-conflict',
            participantId: entry.participantId,
            participantName: entry.name,
            projectId: task.projectId,
            taskId: task.taskId,
            taskConflict: task.conflictDetails,
          });
          if (decision === 'remove') {
            await deleteTaskOfflineData(userId, entry.participantId, task.projectId, task.taskId);
            await refreshPending();
          } else if (decision === 'override') {
            overriddenConflictTaskIds.add(task.taskId);
          }
          // 'cancel' → task stays in skipTaskIds (added by buildSkipSets)
        }

        // ── 6. Blocked task observations ──────────────────────────────────
        for (const form of plan.formResults.filter(f => f.outcome === 'blocked')) {
          const decision = await showDialog({
            id: `form-blocked-${form.formId}`,
            kind: 'form-blocked',
            participantId: entry.participantId,
            participantName: entry.name,
            formId: form.formId,
          });
          if (decision === 'remove') {
            await deleteObservationOfflineData(userId, entry.participantId, form.formId);
            await refreshPending();
          }
          // buildSkipSets adds blocked forms to skipFormIds
        }

        // ── 7. Completed standalone observations ──────────────────────────
        for (const form of plan.formResults.filter(f => f.outcome === 'remove')) {
          const decision = await showDialog({
            id: `form-completed-${form.formId}`,
            kind: 'form-completed',
            participantId: entry.participantId,
            participantName: entry.name,
            formId: form.formId,
          });
          if (decision === 'remove') {
            await deleteObservationOfflineData(userId, entry.participantId, form.formId);
            await refreshPending();
          }
          // buildSkipSets adds 'remove' forms to skipFormIds
        }

        // ── 8. Conflict forms (NOT_STARTED+DRAFT or timestamp divergence) ─
        for (const form of plan.formResults.filter(f => f.outcome === 'conflict')) {
          const decision = await showDialog({
            id: `form-conflict-${form.formId}`,
            kind: 'form-conflict',
            participantId: entry.participantId,
            participantName: entry.name,
            formId: form.formId,
            conflictSubType: form.conflictSubType,
          });
          if (decision === 'override') {
            overriddenConflictFormIds.add(form.formId);
          } else if (decision === 'remove') {
            await deleteObservationOfflineData(userId, entry.participantId, form.formId);
            await refreshPending();
          }
          // 'cancel' → form stays in skipFormIds (added by buildSkipSets)
        }
      }

      // ── Phase 3: Sync each participant with computed skip options ────────
      await Promise.all(
        toSync.map(entry => {
          if (skipParticipantIds.has(entry.participantId)) return Promise.resolve();

          const plan = planMap.get(entry.participantId);
          let skipOptions: SyncSkipOptions | undefined;

          if (plan) {
            skipOptions = buildSkipSets(plan);

            // Remove conflict forms the user approved
            for (const formId of overriddenConflictFormIds) {
              skipOptions.skipFormIds?.delete(formId);
            }
            // Remove conflict tasks the user approved for override
            for (const taskId of overriddenConflictTaskIds) {
              skipOptions.skipTaskIds?.delete(taskId);
            }
            // Add projects the user cancelled override for
            for (const projectId of extraSkipProjectIds) {
              skipOptions.skipProjectIds?.add(projectId);
            }
          }

          return syncOne(entry, skipOptions);
        }),
      );

      await refreshPending();
      await loadParticipants();
    } finally {
      setBulkSyncing(false);
    }
  }, [
    isOffline, selectedIds, bulkSyncing, participants, syncStates, userId,
    syncOne, showDialog, refreshPending, loadParticipants,
  ]);

  // ── Selection ──────────────────────────────────────────────────────────────

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const syncableIds = participants
    .filter(p => !syncStates[p.participantId]?.syncing && !syncStates[p.participantId]?.done)
    .map(p => p.participantId);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds(prev => {
      const allSelected = syncableIds.every(id => prev.has(id));
      return allSelected ? new Set<string>() : new Set(syncableIds);
    });
  }, [syncableIds]);

  // ── Derived ────────────────────────────────────────────────────────────────

  const anySyncing = Object.values(syncStates).some(s => s.syncing);
  const allSynced = participants.length === 0 && !loadingParticipants;
  const allSyncableSelected = syncableIds.length > 0 && syncableIds.every(id => selectedIds.has(id));
  const selectedCount = participants.filter(
    p =>
      selectedIds.has(p.participantId) &&
      !syncStates[p.participantId]?.syncing &&
      !syncStates[p.participantId]?.done,
  ).length;
  const isBusy = isValidating || anySyncing || bulkSyncing;

  // ── Render helpers ─────────────────────────────────────────────────────────

  const renderProgressRow = (done: number, total: number, label: string, isCurrent: boolean) => {
    if (total === 0) return null;
    const complete = done >= total;
    return (
      <HStack key={label} space="xs" alignItems="center">
        <LucideIcon
          name={complete ? 'CircleCheck' : isCurrent ? 'RefreshCw' : 'Clock'}
          size={10}
          color={complete ? '$success600' : isCurrent ? '$primary500' : '$textLight400'}
        />
        <Text
          fontSize="$xs"
          color={complete ? '$success600' : isCurrent ? '$primary500' : '$textMutedForeground'}
        >
          {done}/{total} {label}
        </Text>
      </HStack>
    );
  };

  // ── Dialog renderer ────────────────────────────────────────────────────────

  const renderDialog = () => {
    if (!currentDialog) return null;
    const { kind, participantName, onlineStatus } = currentDialog;

    // Buttons shared across kinds
    const cancelBtn = (
      <Button variant="outline" size="sm" onPress={() => resolveDialog('cancel')}>
        <ButtonText>{t('common.cancel')}</ButtonText>
      </Button>
    );
    const skipRemoveBtn = (
      <Button variant="solid" size="sm" onPress={() => resolveDialog('remove')}>
        <ButtonText>{t('offlineSync.skipAndRemove')}</ButtonText>
      </Button>
    );

    let headerTitle = '';
    let message = '';
    let footer: React.ReactNode = null;

    if (kind === 'participant-blocked') {
      headerTitle = t('offlineSync.participantProgressTitle');
      message = t('offlineSync.participantProgressMessage', {
        onlineStatus: onlineStatus ?? '',
      });
      footer = (
        <HStack space="md" justifyContent="flex-end">
          {cancelBtn}
          <Button variant="solid" size="sm" onPress={() => resolveDialog('remove')}>
            <ButtonText>{t('offlineSync.removeAllOfflineData')}</ButtonText>
          </Button>
        </HStack>
      );
    } else if (kind === 'project-blocked') {
      headerTitle = t('offlineSync.projectUpdatedTitle');
      message = t('offlineSync.projectUpdatedMessage');
      footer = <HStack space="md" justifyContent="flex-end">{cancelBtn}{skipRemoveBtn}</HStack>;
    } else if (kind === 'task-conflict') {
      const tc = currentDialog.taskConflict;
      headerTitle = t('offlineSync.taskConflictTitle');
      footer = (
        <HStack space="sm" justifyContent="flex-end" flexWrap="wrap">
          {cancelBtn}
          <Button variant="outline" size="sm" onPress={() => resolveDialog('override')}>
            <ButtonText>{t('offlineSync.overrideAndSync')}</ButtonText>
          </Button>
          {skipRemoveBtn}
        </HStack>
      );
      return (
        <Modal
          isOpen
          onClose={() => resolveDialog('cancel')}
          headerTitle={headerTitle}
          size="lg"
          showCloseButton={false}
          footerContent={footer}
        >
          <VStack space="sm">
            <Text fontSize="$sm" color="$textSecondary">
              {t('offlineSync.taskConflictMessage')}
            </Text>
            <ScrollView maxHeight={320}>
              <VStack space="md" mt="$2">
                {/* Parent task context — only shown for child task conflicts */}
                {tc?.parentTaskName && (
                  <VStack space="xs">
                    <Text fontSize="$xs" fontWeight="$semibold" color="$textMutedForeground">
                      {t('offlineSync.taskConflictParentTaskName')}
                    </Text>
                    <Text fontSize="$sm" color="$textSecondary">{tc.parentTaskName}</Text>
                  </VStack>
                )}
                {/* Task info */}
                <VStack space="xs">
                  <Text fontSize="$xs" fontWeight="$semibold" color="$textMutedForeground">
                    {t('offlineSync.taskConflictTaskName')}
                  </Text>
                  <Text fontSize="$sm" fontWeight="$semibold">{tc?.taskName ?? '—'}</Text>
                </VStack>
                {tc?.taskExternalId && (
                  <VStack space="xs">
                    <Text fontSize="$xs" fontWeight="$semibold" color="$textMutedForeground">
                      {t('offlineSync.taskConflictExternalId')}
                    </Text>
                    <Text fontSize="$sm">{tc.taskExternalId}</Text>
                  </VStack>
                )}

                {/* Status comparison */}
                <VStack space="xs">
                  <Text fontSize="$xs" fontWeight="$semibold" color="$textMutedForeground">
                    {t('offlineSync.taskConflictStatus')}
                  </Text>
                  <HStack space="md">
                    <VStack flex={1} space="xs" borderWidth={1} borderColor="$borderLight200" borderRadius="$sm" p="$2">
                      <Text fontSize="$xs" color="$textMutedForeground">{t('offlineSync.taskConflictOffline')}</Text>
                      <Text fontSize="$sm" fontWeight="$medium">{formatTaskStatus(tc?.offlineStatus)}</Text>
                      <Text fontSize="$xs" color="$textMutedForeground">{formatTaskDate(tc?.offlineUpdatedAt)}</Text>
                    </VStack>
                    <VStack flex={1} space="xs" borderWidth={1} borderColor="$borderLight200" borderRadius="$sm" p="$2">
                      <Text fontSize="$xs" color="$textMutedForeground">{t('offlineSync.taskConflictOnline')}</Text>
                      <Text fontSize="$sm" fontWeight="$medium">{formatTaskStatus(tc?.onlineStatus)}</Text>
                      <Text fontSize="$xs" color="$textMutedForeground">{formatTaskDate(tc?.onlineUpdatedAt)}</Text>
                    </VStack>
                  </HStack>
                </VStack>

                {/* Evidence comparison */}
                <VStack space="xs">
                  <Text fontSize="$xs" fontWeight="$semibold" color="$textMutedForeground">
                    {t('offlineSync.taskConflictEvidence')}
                  </Text>
                  <HStack space="md">
                    <VStack flex={1} space="xs" borderWidth={1} borderColor="$borderLight200" borderRadius="$sm" p="$2">
                      <Text fontSize="$xs" color="$textMutedForeground">{t('offlineSync.taskConflictOffline')}</Text>
                      <Text fontSize="$sm" fontWeight="$medium">
                        {tc?.offlineEvidenceCount ?? 0} {t('offlineSync.taskConflictFiles')}
                      </Text>
                      {tc?.offlineFileNames?.length ? (
                        tc.offlineFileNames.map((name, i) => (
                          <Text key={i} fontSize="$xs" color="$textSecondary" numberOfLines={1}>{name}</Text>
                        ))
                      ) : (
                        <Text fontSize="$xs" color="$textMutedForeground">{t('offlineSync.taskConflictNoFiles')}</Text>
                      )}
                    </VStack>
                    <VStack flex={1} space="xs" borderWidth={1} borderColor="$borderLight200" borderRadius="$sm" p="$2">
                      <Text fontSize="$xs" color="$textMutedForeground">{t('offlineSync.taskConflictOnline')}</Text>
                      <Text fontSize="$sm" fontWeight="$medium">
                        {tc?.onlineEvidenceCount ?? 0} {t('offlineSync.taskConflictFiles')}
                      </Text>
                      {tc?.onlineFileNames?.length ? (
                        tc.onlineFileNames.map((name, i) => (
                          <Text key={i} fontSize="$xs" color="$textSecondary" numberOfLines={1}>{name}</Text>
                        ))
                      ) : (
                        <Text fontSize="$xs" color="$textMutedForeground">{t('offlineSync.taskConflictNoFiles')}</Text>
                      )}
                    </VStack>
                  </HStack>
                </VStack>

                {/* Conflict reasons */}
                {tc?.conflictReasons?.length ? (
                  <VStack space="xs">
                    <Text fontSize="$xs" fontWeight="$semibold" color="$textMutedForeground">
                      {t('offlineSync.taskConflictReason')}
                    </Text>
                    {tc.conflictReasons.length > 1 && (
                      <Text fontSize="$xs" color="$warning600">{t('offlineSync.taskConflictReasonMultiple')}</Text>
                    )}
                    {tc.conflictReasons.map(reason => (
                      <Text key={reason} fontSize="$xs" color="$textSecondary">
                        {'• '}
                        {reason === 'status-ahead'
                          ? t('offlineSync.taskConflictReasonStatusAhead')
                          : reason === 'timestamp-conflict'
                          ? t('offlineSync.taskConflictReasonTimestamp')
                          : t('offlineSync.taskConflictReasonEvidence')}
                      </Text>
                    ))}
                  </VStack>
                ) : null}
              </VStack>
            </ScrollView>
          </VStack>
        </Modal>
      );
    } else if (kind === 'form-blocked') {
      headerTitle = t('offlineSync.taskObservationUpdatedTitle');
      message = t('offlineSync.taskObservationUpdatedMessage');
      footer = <HStack space="md" justifyContent="flex-end">{cancelBtn}{skipRemoveBtn}</HStack>;
    } else if (kind === 'form-completed') {
      headerTitle = t('offlineSync.observationCompletedTitle');
      message = t('offlineSync.observationCompletedMessage');
      footer = <HStack space="md" justifyContent="flex-end">{cancelBtn}{skipRemoveBtn}</HStack>;
    } else if (kind === 'form-conflict') {
      headerTitle = t('offlineSync.observationConflictTitle');
      message = currentDialog.conflictSubType === 'draft-ahead'
        ? t('offlineSync.observationConflictDraftMessage')
        : t('offlineSync.observationConflictTimestampMessage');
      footer = (
        <HStack space="sm" justifyContent="flex-end" flexWrap="wrap">
          {cancelBtn}
          {skipRemoveBtn}
          <Button variant="solid" size="sm" onPress={() => resolveDialog('override')}>
            <ButtonText>{t('offlineSync.overrideAndSync')}</ButtonText>
          </Button>
        </HStack>
      );
    } else if (kind === 'participant-conflict' || kind === 'project-conflict') {
      headerTitle = t('offlineSync.conflictDetectedTitle');
      message = t('offlineSync.conflictDetectedMessage');
      footer = (
        <HStack space="md" justifyContent="flex-end">
          {cancelBtn}
          <Button variant="solid" size="sm" onPress={() => resolveDialog('override')}>
            <ButtonText>{t('offlineSync.overrideAndSync')}</ButtonText>
          </Button>
        </HStack>
      );
    }

    return (
      <Modal
        isOpen
        onClose={() => resolveDialog('cancel')}
        headerTitle={headerTitle}
        size="md"
        showCloseButton={false}
        footerContent={footer}
      >
        <VStack space="sm">
          <Text fontSize="$sm" fontWeight="$semibold">{participantName}</Text>
          <Text fontSize="$sm" color="$textSecondary">{message}</Text>
        </VStack>
      </Modal>
    );
  };

  // ── Main render ────────────────────────────────────────────────────────────

  return (
    <>
      <Modal
        isOpen={showSyncModal}
        onClose={closeSyncModal}
        headerTitle={t('offlineSync.modalTitle')}
        headerIcon={<LucideIcon name="RefreshCw" size={16} color="$primary500" />}
        size="lg"
        showCloseButton={!isBusy}
      >
        <VStack space="md">

          {loadingParticipants && participants.length === 0 && (
            <HStack space="sm" alignItems="center" justifyContent="center" py="$2">
              <Spinner size="small" color="$primary500" />
              <Text fontSize="$sm" color="$textSecondary">{t('common.loading')}</Text>
            </HStack>
          )}

          {isValidating && (
            <HStack space="sm" alignItems="center" justifyContent="center" py="$2">
              <Spinner size="small" color="$primary500" />
              <Text fontSize="$sm" color="$textSecondary">{t('offlineSync.validating')}</Text>
            </HStack>
          )}

          {allSynced && (
            <VStack space="sm" alignItems="center" py="$4">
              <LucideIcon name="CircleCheck" size={40} color="$success600" />
              <Text fontSize="$md" fontWeight="$semibold" color="$success600">
                {t('offlineSync.allSynced')}
              </Text>
            </VStack>
          )}

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
                    {allSyncableSelected ? t('offlineSync.deselectAll') : t('offlineSync.selectAll')}
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

          {!loadingParticipants && participants.length > 0 && (
            <ScrollView maxHeight={350}>
              <VStack space="sm">
                {participants.map(entry => {
                  const state = syncStates[entry.participantId];
                  const isSyncing = state?.syncing ?? false;
                  const isDone = state?.done ?? false;
                  const isError = state?.error ?? false;
                  const isSelected = selectedIds.has(entry.participantId);
                  const canToggle = !isSyncing && !isDone;

                  return (
                    <Pressable
                      key={entry.participantId}
                      onPress={() => canToggle && toggleSelect(entry.participantId)}
                      borderWidth={1}
                      borderColor={isDone ? '$success300' : isError ? '$error300' : '$borderLight200'}
                      borderRadius="$md"
                      p="$3"
                      backgroundColor={isDone ? '$success50' : isError ? '$error50' : 'transparent'}
                    >
                      <HStack justifyContent="space-between" alignItems="flex-start">
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

                            <HStack space="md" flexWrap="wrap" mt="$0.5">
                              {(isSyncing || isDone) ? (
                                <>
                                  {renderProgressRow(state?.completedFiles ?? 0, entry.files, t('offlineSync.labelFiles'), state?.stage === 'files')}
                                  {renderProgressRow(state?.completedForms ?? 0, entry.forms, t('offlineSync.labelForms'), state?.stage === 'forms')}
                                  {renderProgressRow(state?.completedTasks ?? 0, entry.tasks, t('offlineSync.labelTasks'), state?.stage === 'tasks')}
                                </>
                              ) : (
                                <>
                                  {entry.files > 0 && <Text fontSize="$xs" color="$textSecondary">{t('offlineSync.pendingFiles', { count: entry.files })}</Text>}
                                  {entry.forms > 0 && <Text fontSize="$xs" color="$textSecondary">{t('offlineSync.pendingForms', { count: entry.forms })}</Text>}
                                  {entry.tasks > 0 && <Text fontSize="$xs" color="$textSecondary">{t('offlineSync.pendingTasks', { count: entry.tasks })}</Text>}
                                </>
                              )}
                            </HStack>

                            {isSyncing && state?.stage && state.stage !== 'idle' && (
                              <Text fontSize="$xs" color="$primary500">
                                {state.stage === 'files' ? t('offlineSync.stageFiles') : state.stage === 'forms' ? t('offlineSync.stageForms') : t('offlineSync.stageTasks')}
                              </Text>
                            )}
                            {isDone && <Text fontSize="$xs" color="$success600">{t('offlineSync.syncComplete')}</Text>}
                            {isError && !isSyncing && <Text fontSize="$xs" color="$error500">{t('offlineSync.syncError')}</Text>}
                          </VStack>
                        </HStack>
                      </HStack>
                    </Pressable>
                  );
                })}
              </VStack>
            </ScrollView>
          )}

          {isOffline && participants.length > 0 && (
            <Text fontSize="$xs" color="$error500" textAlign="center">
              {t('offlineSync.cannotSyncOffline')}
            </Text>
          )}

          <HStack space="md" justifyContent="flex-end" flexWrap="wrap">
            <Button variant="outline" size="sm" onPress={closeSyncModal} isDisabled={isBusy}>
              <ButtonText>
                {allSynced ? (t('common.close') || 'Close') : t('offlineSync.skipForNow')}
              </ButtonText>
            </Button>

            {!allSynced && syncableIds.length > 0 && (
              <Button
                variant="solid"
                size="sm"
                onPress={syncSelected}
                isDisabled={isOffline || selectedCount === 0 || isBusy}
              >
                {(isValidating || bulkSyncing) ? (
                  <Spinner size="small" color="$white" mr="$1" />
                ) : (
                  <ButtonIcon as={LucideIcon} name="RefreshCw" mr="$1" />
                )}
                <ButtonText>
                  {isValidating
                    ? t('offlineSync.validating')
                    : selectedCount > 0
                    ? `${t('offlineSync.syncSelected')} (${selectedCount})`
                    : t('offlineSync.syncSelected')}
                </ButtonText>
              </Button>
            )}
          </HStack>

        </VStack>
      </Modal>

      {/* Type-specific conflict/block dialog — rendered above the main modal */}
      {renderDialog()}
    </>
  );
};

export default SyncOverviewModal;
