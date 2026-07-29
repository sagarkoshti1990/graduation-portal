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
  type ObservationConflictDetails,
} from '../../services/syncValidationService';
import {
  deleteParticipantOfflineData,
  deleteProjectOfflineData,
  deleteObservationOfflineData,
  deleteTaskOfflineData,
} from '../../services/offlineCleanupService';
import type { SyncProgress } from '@app-types/offline';
import offlineStorage from '../../services/offlineStorage';
import { isNetworkOffline } from '@utils/networkStatus';

/** Rejection sentinel used by showDialog to signal "sync must stop — went offline". */
const SYNC_INTERRUPTED_OFFLINE = 'SYNC_INTERRUPTED_OFFLINE';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ParticipantSyncState {
  syncing: boolean;
  done: boolean;
  error: boolean;
  stage: SyncProgress['stage'] | null;
  completedFiles: number;
  completedForms: number;
  completedTasks: number;
  completedIdp: number;
}

const IDLE_STATE: ParticipantSyncState = {
  syncing: false,
  done: false,
  error: false,
  stage: null,
  completedFiles: 0,
  completedForms: 0,
  completedTasks: 0,
  completedIdp: 0,
};

// ── Dialog types ──────────────────────────────────────────────────────────────

/**
 * One entry per distinct dialog kind.
 *
 *  participant-blocked   → "Participant Progress Updated" (Cancel | Remove Offline Data)
 *  project-blocked       → "Project Already Updated" (Cancel | Skip & Remove)
 *  project-pathway-conflict → "Project Pathway Conflict" rich comparison (Cancel | Skip & Remove)
 *  task-conflict         → "Task Conflict Detected"  (Cancel | Override & Sync | Skip & Remove)
 *  form-blocked          → "Observation Conflict Detected" rich comparison (Cancel | Skip & Remove)
 *  form-completed        → "Observation Conflict Detected" rich comparison (Cancel | Skip & Remove)
 *  participant-conflict  → "Data Conflict Detected" (Cancel | Override & Sync)
 *  project-conflict      → "Data Conflict Detected" (Cancel | Override & Sync)
 *  form-conflict         → "Observation Conflict Detected" rich comparison (Cancel | Skip & Remove | Override & Sync*)
 */
type DialogKind =
  | 'participant-blocked'
  | 'project-blocked'
  | 'project-pathway-conflict'
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
  conflictSubType?: 'draft-ahead' | 'status-ahead' | 'timestamp';
  /** Rich comparison data for the 'form-conflict' dialog */
  conflictDetails?: ObservationConflictDetails;
  /** Offline/online pathway name+id comparison for the 'project-pathway-conflict' dialog */
  pathwayConflict?: { offlineName: string; offlineId: string; onlineName: string; onlineId: string };
}

/** What the user chose in a dialog. */
type DialogDecision = 'cancel' | 'remove' | 'override' | 'ok';

// ── Sync Summary types ─────────────────────────────────────────────────────────

/** One row of the post-sync report. A metric is omitted from display when it's 0. */
interface CategorySummary {
  synced: number;
  skipped: number;
  cancelled: number;
  remaining: number;
}

function emptyCategorySummary(): CategorySummary {
  return { synced: 0, skipped: 0, cancelled: 0, remaining: 0 };
}

/** Aggregate Sync Summary shown once after a batch sync run finishes. */
interface SyncSummaryData {
  project: CategorySummary;
  task: CategorySummary;
  observation: CategorySummary;
}

function emptySyncSummary(): SyncSummaryData {
  return { project: emptyCategorySummary(), task: emptyCategorySummary(), observation: emptyCategorySummary() };
}

function mergeCategorySummary(target: CategorySummary, source: CategorySummary): void {
  target.synced += source.synced;
  target.skipped += source.skipped;
  target.cancelled += source.cancelled;
  target.remaining += source.remaining;
}

function mergeSyncSummary(target: SyncSummaryData, source: SyncSummaryData): void {
  mergeCategorySummary(target.project, source.project);
  mergeCategorySummary(target.task, source.task);
  mergeCategorySummary(target.observation, source.observation);
}

/**
 * Folds a participant's would-have-synced counts into Skipped instead — used when
 * their syncOne() call actually failed over the network, so Phase 2's validation-time
 * "allowed"/"override" tally doesn't misreport a real failure as a success. Already
 * skipped/cancelled counts for that same participant are untouched.
 */
function demoteSyncedToSkipped(summary: SyncSummaryData): SyncSummaryData {
  const demote = (c: CategorySummary): CategorySummary => ({
    ...c,
    skipped: c.skipped + c.synced,
    synced: 0,
  });
  return { project: demote(summary.project), task: demote(summary.task), observation: demote(summary.observation) };
}

// ── Progress helper ───────────────────────────────────────────────────────────

function applyProgress(
  prev: ParticipantSyncState,
  entry: ParticipantPendingEntry,
  p: SyncProgress,
): ParticipantSyncState {
  let { completedFiles, completedForms, completedTasks, completedIdp } = prev;
  if (p.stage === 'files') {
    completedFiles = p.current;
  } else if (p.stage === 'forms') {
    completedFiles = entry.files;
    completedForms = p.current;
  } else if (p.stage === 'tasks') {
    completedForms = entry.forms;
    completedTasks = Math.min(p.current, entry.tasks);
  } else if (p.stage === 'idp') {
    completedTasks = entry.tasks;
    completedIdp = p.current;
  } else if (p.stage === 'done') {
    completedFiles = entry.files;
    completedForms = entry.forms;
    completedTasks = entry.tasks;
    completedIdp = entry.idp;
  }
  return {
    ...prev,
    stage: p.stage,
    completedFiles,
    completedForms,
    completedTasks,
    completedIdp,
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
  const { showSyncModal, closeSyncModal, isOffline, refreshPending, notifyOfflineDataChanged } = useOfflineSync();

  // Refreshes pending-sync counters and tells offline-data-dependent UI
  // (e.g. each participant's Offline badge) to re-check storage. Called
  // after every point below that deletes/cleans up offline data.
  const refreshAfterOfflineChange = useCallback(async () => {
    await refreshPending();
    notifyOfflineDataChanged();
  }, [refreshPending, notifyOfflineDataChanged]);
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
  // Aggregate report shown once a batch sync run finishes — see syncSelected's Phase 3.
  const [syncSummary, setSyncSummary] = useState<SyncSummaryData | null>(null);
  // Set when a sync run had to stop mid-way because the device went offline.
  const [syncInterrupted, setSyncInterrupted] = useState(false);

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

  // Never show — or act on — a dialog once offline. Checked both before the
  // dialog is created and again inside the resolver, since a dialog can sit
  // open indefinitely waiting on the user and connectivity can drop while
  // they're deciding. Uses the live isNetworkOffline() check (not the
  // isOffline context value, which would be a stale closure read once at
  // syncSelected's call time) so this reflects connectivity at the moment it
  // actually matters.
  const showDialog = useCallback((item: DialogItem): Promise<DialogDecision> => {
    if (isNetworkOffline()) {
      return Promise.reject(new Error(SYNC_INTERRUPTED_OFFLINE));
    }
    return new Promise<DialogDecision>((resolve, reject) => {
      dialogResolverRef.current = (decision: DialogDecision) => {
        if (isNetworkOffline()) {
          reject(new Error(SYNC_INTERRUPTED_OFFLINE));
          return;
        }
        resolve(decision);
      };
      setCurrentDialog(item);
    });
  }, []);

  const resolveDialog = useCallback((decision: DialogDecision) => {
    dialogResolverRef.current?.(decision);
    dialogResolverRef.current = null;
    setCurrentDialog(null);
  }, []);

  // Force-closes a dialog that's already open if connectivity drops while the
  // user hasn't yet responded to it, rather than waiting for their next tap.
  // Reuses the existing reactive isOffline context state — no new network
  // listener needed.
  useEffect(() => {
    if (isOffline && currentDialog) {
      dialogResolverRef.current?.('cancel');
    }
  }, [isOffline, currentDialog]);

  // ── Per-participant sync ───────────────────────────────────────────────────

  const syncOne = useCallback(
    async (entry: ParticipantPendingEntry, skipOptions?: SyncSkipOptions): Promise<boolean> => {
      const { participantId } = entry;
      setSyncStates(prev => ({
        ...prev,
        [participantId]: { ...IDLE_STATE, syncing: true, stage: 'idle' },
      }));
      try {
        // startSync resolves (rather than throwing) even when some items
        // failed internally — check its own success/failedCount instead of
        // assuming a non-throwing resolution means everything synced, so a
        // silent internal failure is reflected in the UI and in the Sync
        // Summary's synced/skipped tally (via demoteSyncedToSkipped below).
        const result = await startSync(participantId, userId, (progress: SyncProgress) => {
          setSyncStates(prev => ({
            ...prev,
            [participantId]: applyProgress(prev[participantId] ?? IDLE_STATE, entry, progress),
          }));
        }, skipOptions);

        setSyncStates(prev => ({
          ...prev,
          [participantId]: result.success
            ? {
                ...IDLE_STATE,
                done: true,
                stage: 'done',
                completedFiles: entry.files,
                completedForms: entry.forms,
                completedTasks: entry.tasks,
                completedIdp: entry.idp,
              }
            : { ...(prev[participantId] ?? IDLE_STATE), syncing: false, error: true },
        }));

        await refreshAfterOfflineChange();
        setTimeout(async () => {
          // startSync resolving without throwing doesn't mean everything synced —
          // Cancelled items are intentionally left pending for retry. Only drop
          // this participant from the visible list once they truly have nothing
          // left, otherwise this stale check (2s later) would wrongly overwrite
          // the accurate list loadParticipants() already set after Phase 3.
          const stillPending = await getPerParticipantPendingBreakdown(userId);
          const hasRemainingWork = stillPending.some(p => p.participantId === participantId);
          if (!hasRemainingWork) {
            setParticipants(prev => prev.filter(p => p.participantId !== participantId));
          }
          setSyncStates(prev => { const n = { ...prev }; delete n[participantId]; return n; });
        }, 2000);
        return result.success;
      } catch {
        setSyncStates(prev => ({
          ...prev,
          [participantId]: { ...(prev[participantId] ?? IDLE_STATE), syncing: false, error: true },
        }));
        return false;
      }
    },
    [userId, refreshAfterOfflineChange],
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

      // Covers going offline during the (network-bound) validation calls
      // above, before any dialog exists or any decision has been acted on.
      if (isNetworkOffline()) {
        throw new Error(SYNC_INTERRUPTED_OFFLINE);
      }

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
      //  Per-participant partial tally, merged into the final summary in Phase 3 once
      //  each participant's actual syncOne() outcome (success/failure) is known.
      const partialSummaries = new Map<string, SyncSummaryData>();

      for (const entry of toSync) {
        const plan = planMap.get(entry.participantId);
        if (!plan) continue; // validation itself failed for this participant — not tallied (accepted gap)

        const partial = emptySyncSummary();
        partialSummaries.set(entry.participantId, partial);

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
            await refreshAfterOfflineChange();
          }
          // Whole participant bypassed before any per-item loop ran — attribute
          // everything to Skipped rather than falling through to per-item tallying.
          partial.project.skipped += plan.allProjectIds.length;
          partial.task.skipped += plan.taskResults.length;
          partial.observation.skipped += plan.formResults.length;
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
            // Same bypass as above, but user-declined rather than auto-blocked.
            partial.project.cancelled += plan.allProjectIds.length;
            partial.task.cancelled += plan.taskResults.length;
            partial.observation.cancelled += plan.formResults.length;
            skipParticipantIds.add(entry.participantId);
            continue;
          }
          // 'override' → proceed with all items for this participant
        }

        // ── Tally the "always known" outcomes — items no dialog choice affects ──
        partial.project.skipped += plan.blockedProjectIds.length + plan.pathwayConflictProjectIds.length;
        partial.project.synced += Math.max(
          0,
          plan.allProjectIds.length
            - plan.blockedProjectIds.length
            - plan.pathwayConflictProjectIds.length
            - plan.conflictProjectIds.length,
        );
        partial.task.synced += plan.taskResults.filter(tr => tr.outcome === 'allowed').length;
        partial.observation.synced += plan.formResults.filter(f => f.outcome === 'allowed').length;
        partial.observation.skipped += plan.formResults.filter(
          f => f.outcome === 'blocked' || f.outcome === 'remove',
        ).length;

        // ── 2a. Pathway conflicts ──────────────────────────────────────────
        for (const projectId of plan.pathwayConflictProjectIds) {
          const decision = await showDialog({
            id: `project-pathway-conflict-${projectId}`,
            kind: 'project-pathway-conflict',
            participantId: entry.participantId,
            participantName: entry.name,
            projectId,
            pathwayConflict: plan.pathwayConflictDetails.get(projectId),
          });
          if (decision === 'remove') {
            await deleteProjectOfflineData(userId, entry.participantId, projectId);
            await refreshAfterOfflineChange();
          }
          // buildSkipSets already adds pathwayConflictProjectIds to skipProjectIds —
          // this project never syncs this run whether the user cancels or removes.
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
            await refreshAfterOfflineChange();
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
            partial.project.cancelled += 1;
          } else {
            partial.project.synced += 1;
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
            await refreshAfterOfflineChange();
            partial.task.skipped += 1;
          } else if (decision === 'override') {
            overriddenConflictTaskIds.add(task.taskId);
            partial.task.synced += 1;
          } else {
            partial.task.cancelled += 1;
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
            conflictDetails: form.conflictDetails,
          });
          if (decision === 'remove') {
            await deleteObservationOfflineData(userId, entry.participantId, form.formId);
            await refreshAfterOfflineChange();
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
            conflictDetails: form.conflictDetails,
          });
          if (decision === 'remove') {
            await deleteObservationOfflineData(userId, entry.participantId, form.formId);
            await refreshAfterOfflineChange();
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
            conflictDetails: form.conflictDetails,
          });
          if (decision === 'override') {
            overriddenConflictFormIds.add(form.formId);
            partial.observation.synced += 1;
          } else if (decision === 'remove') {
            await deleteObservationOfflineData(userId, entry.participantId, form.formId);
            await refreshAfterOfflineChange();
            partial.observation.skipped += 1;
          } else {
            partial.observation.cancelled += 1;
          }
          // 'cancel' → form stays in skipFormIds (added by buildSkipSets)
        }
      }

      // ── Phase 3: Sync each participant with computed skip options ────────
      const syncOutcomes = await Promise.all(
        toSync.map(async entry => {
          if (skipParticipantIds.has(entry.participantId)) {
            return { participantId: entry.participantId, attempted: false, success: false };
          }

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

            // If every task/form conflict for this participant was Cancelled
            // (or already blocked/skipped) and there's no pending IDP submission
            // (which always attempts regardless of skip decisions — see
            // syncInterventionPlanSubmissions), there's genuinely nothing left
            // to sync. Skip the startSync call — and the "Syncing..." UI state
            // it drives — entirely, instead of running/showing a no-op sync.
            const hasTaskWork = plan.taskResults.some(
              tr => !skipOptions?.skipTaskIds?.has(tr.taskId) && !skipOptions?.skipProjectIds?.has(tr.projectId),
            );
            const hasFormWork = plan.formResults.some(f => !skipOptions?.skipFormIds?.has(f.formId));
            const hasIdpWork = entry.idp > 0;
            if (!hasTaskWork && !hasFormWork && !hasIdpWork) {
              return { participantId: entry.participantId, attempted: false, success: false };
            }
          }

          const success = await syncOne(entry, skipOptions);
          return { participantId: entry.participantId, attempted: true, success };
        }),
      );

      // ── Build the final Sync Summary ─────────────────────────────────────
      // Merge each participant's Phase-2 partial tally in: as-is for participants
      // that were fully bypassed (their partial already reflects that), fully if
      // their actual syncOne() call succeeded, or with "would-sync" counts
      // demoted to Skipped if it failed (see demoteSyncedToSkipped doc comment).
      const summary = emptySyncSummary();
      for (const entry of toSync) {
        const partial = partialSummaries.get(entry.participantId);
        if (!partial) continue; // validation itself failed for this participant — not tallied

        if (skipParticipantIds.has(entry.participantId)) {
          mergeSyncSummary(summary, partial);
          continue;
        }

        const outcome = syncOutcomes.find(o => o.participantId === entry.participantId);
        mergeSyncSummary(summary, outcome?.success ? partial : demoteSyncedToSkipped(partial));
      }

      // ── Remaining counts — a fresh post-sync scan across this batch's participants.
      // Uses the same leaf-counting unit as plan.taskResults: a parent task with
      // children is only a wrapper (validation skips it and checks each child
      // individually — see syncValidationService.validateOneTask), so each child
      // counts as one and the parent wrapper itself is not counted separately.
      for (const entry of toSync) {
        try {
          const keys = await offlineStorage.getParticipantKeys(userId, entry.participantId);
          const projectEditKeys = keys.filter((k: string) => k.includes(':projectEdits:'));
          summary.project.remaining += projectEditKeys.length;

          for (const key of projectEditKeys) {
            const edits = await offlineStorage.read<{ tasks?: any[] }>(key).catch(() => null);
            for (const task of edits?.tasks ?? []) {
              summary.task.remaining += task?.children?.length ? task.children.length : 1;
            }
          }

          summary.observation.remaining += keys.filter(
            (k: string) => k.endsWith(':edits') && k.includes(':form:'),
          ).length;
        } catch {
          // non-fatal — this participant just won't contribute to "Remaining"
        }
      }

      setSyncSummary(summary);

      await refreshAfterOfflineChange();
      await loadParticipants();
    } catch (err: any) {
      if (err?.message === SYNC_INTERRUPTED_OFFLINE) {
        // Stopped mid-way because the device went offline — close whatever
        // dialog might still be showing and let the user know, without
        // running Phase 3 or acting on anything further. refreshAfterOfflineChange/
        // loadParticipants are safe, read-only reflections of whatever DID
        // complete before the drop, so still run them to keep the UI honest.
        setCurrentDialog(null);
        setSyncInterrupted(true);
        await refreshAfterOfflineChange();
        await loadParticipants();
        return;
      }
      throw err;
    } finally {
      setBulkSyncing(false);
    }
  }, [
    isOffline, selectedIds, bulkSyncing, participants, syncStates, userId,
    syncOne, showDialog, refreshAfterOfflineChange, loadParticipants,
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
      // @ts-ignore
      <Button variant="danger" size="sm" onPress={() => resolveDialog('remove')}>
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
    } else if (kind === 'project-pathway-conflict') {
      const pc = currentDialog.pathwayConflict;
      return (
        <Modal
          isOpen
          onClose={() => resolveDialog('cancel')}
          headerTitle={t('offlineSync.pathwayConflictTitle')}
          size="md"
          showCloseButton={false}
          footerContent={<HStack space="md" justifyContent="flex-end">{cancelBtn}{skipRemoveBtn}</HStack>}
        >
          <VStack space="sm">
            <Text fontSize="$sm" fontWeight="$semibold">{participantName}</Text>
            <Text fontSize="$sm" color="$textSecondary">{t('offlineSync.pathwayConflictMessage')}</Text>
            <HStack space="md" mt="$2">
              <VStack flex={1} space="xs" borderWidth={1} borderColor="$borderLight200" borderRadius="$sm" p="$2">
                <Text fontSize="$xs" color="$textMutedForeground">{t('offlineSync.taskConflictOffline')}</Text>
                <Text fontSize="$sm" fontWeight="$medium">{pc?.offlineName ?? '—'}</Text>
                {/* <Text fontSize="$xs" color="$textMutedForeground" numberOfLines={1}>{pc?.offlineId ?? '—'}</Text> */}
              </VStack>
              <VStack flex={1} space="xs" borderWidth={1} borderColor="$borderLight200" borderRadius="$sm" p="$2">
                <Text fontSize="$xs" color="$textMutedForeground">{t('offlineSync.taskConflictOnline')}</Text>
                <Text fontSize="$sm" fontWeight="$medium">{pc?.onlineName ?? '—'}</Text>
                {/* <Text fontSize="$xs" color="$textMutedForeground" numberOfLines={1}>{pc?.onlineId ?? '—'}</Text> */}
              </VStack>
            </HStack>
          </VStack>
        </Modal>
      );
    } else if (kind === 'task-conflict') {
      const tc = currentDialog.taskConflict;
      headerTitle = t('offlineSync.taskConflictTitle');
      footer = (
        <HStack space="sm" justifyContent="flex-end" flexWrap="wrap">
          {cancelBtn}
          <Button variant="solid" size="sm" onPress={() => resolveDialog('override')}>
            <ButtonText>{t('offlineSync.overrideAndSync')}</ButtonText>
          </Button>
          {skipRemoveBtn}
        </HStack>
      );
      return (
        <Modal
          isOpen
          onClose={() => console.log('cancel')}
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
                {/* {tc?.taskExternalId && (
                  <VStack space="xs">
                    <Text fontSize="$xs" fontWeight="$semibold" color="$textMutedForeground">
                      {t('offlineSync.taskConflictExternalId')}
                    </Text>
                    <Text fontSize="$sm">{tc.taskExternalId}</Text>
                  </VStack>
                )} */}

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
    } else if (kind === 'form-blocked' || kind === 'form-completed' || kind === 'form-conflict') {
      const oc = currentDialog.conflictDetails;
      // Override & Sync is only available for genuine conflicts where the user can choose to override.
      // Blocked (online ahead) and completed dialogs only offer Cancel / Skip & Remove.
      const showOverride = kind === 'form-conflict' && oc?.onlineStatus !== 'completed';
      const overrideBtn = showOverride ? (
        <Button variant="solid" size="sm" onPress={() => resolveDialog('override')}>
          <ButtonText>{t('offlineSync.overrideAndSync')}</ButtonText>
        </Button>
      ) : null;
      return (
        <Modal
          isOpen
          onClose={() => console.log('cancel')}
          headerTitle={t('offlineSync.observationConflictTitle')}
          size="lg"
          showCloseButton={false}
          footerContent={
            <HStack space="sm" justifyContent="flex-end" flexWrap="wrap">
              {cancelBtn}
              {skipRemoveBtn}
              {overrideBtn}
            </HStack>
          }
        >
          <VStack space="sm">
            <Text fontSize="$sm" fontWeight="$semibold">{participantName}</Text>
            <Text fontSize="$sm" color="$textSecondary">
              {t('offlineSync.observationConflictMessage')}
            </Text>
            <ScrollView maxHeight={340}>
              <VStack space="md" mt="$2">

                {/* Observation info */}
                <HStack space="md">
                  <VStack space="xs">
                  <Text fontSize="$xs" fontWeight="$semibold" color="$textMutedForeground">
                    {t('offlineSync.observationConflictName')}
                  </Text>
                  <Text fontSize="$sm" fontWeight="$semibold">{oc?.observationName ?? '—'}</Text>
                </VStack>
                  <VStack flex={1} space="xs">
                    <Text fontSize="$xs" fontWeight="$semibold" color="$textMutedForeground">
                      {t('offlineSync.observationConflictSubmissionNumber')}
                    </Text>
                    <Text fontSize="$sm">{oc?.submissionNumber ?? '—'}</Text>
                  </VStack>
                </HStack>
                {/* {oc?.observationId && (
                  <VStack space="xs">
                    <Text fontSize="$xs" fontWeight="$semibold" color="$textMutedForeground">
                      {t('offlineSync.observationConflictObsId')}
                    </Text>
                    <Text fontSize="$sm">{oc.observationId}</Text>
                  </VStack>
                )}
                {oc?.submissionId && (
                  <VStack flex={2} space="xs">
                    <Text fontSize="$xs" fontWeight="$semibold" color="$textMutedForeground">
                      {t('offlineSync.observationConflictSubmissionId')}
                    </Text>
                    <Text fontSize="$sm" numberOfLines={1}>{oc.submissionId}</Text>
                  </VStack>
                )} */}
                {/* Status comparison */}
                <VStack space="xs">
                  <Text fontSize="$xs" fontWeight="$semibold" color="$textMutedForeground">
                    {t('offlineSync.observationConflictStatus')}
                  </Text>
                  <HStack space="md">
                    <VStack flex={1} space="xs" borderWidth={1} borderColor="$borderLight200" borderRadius="$sm" p="$2">
                      <Text fontSize="$xs" color="$textMutedForeground">{t('offlineSync.taskConflictOffline')}</Text>
                      <Text fontSize="$sm" fontWeight="$medium">{formatTaskStatus(oc?.offlineStatus)}</Text>
                      <Text fontSize="$xs" color="$textMutedForeground">{formatTaskDate(oc?.offlineUpdatedAt)}</Text>
                    </VStack>
                    <VStack flex={1} space="xs" borderWidth={1} borderColor="$borderLight200" borderRadius="$sm" p="$2">
                      <Text fontSize="$xs" color="$textMutedForeground">{t('offlineSync.taskConflictOnline')}</Text>
                      <Text fontSize="$sm" fontWeight="$medium">{formatTaskStatus(oc?.onlineStatus)}</Text>
                      <Text fontSize="$xs" color="$textMutedForeground">{formatTaskDate(oc?.onlineUpdatedAt)}</Text>
                    </VStack>
                  </HStack>
                </VStack>

                {/* Response summary */}
                <VStack space="xs">
                  <Text fontSize="$xs" fontWeight="$semibold" color="$textMutedForeground">
                    {t('offlineSync.observationConflictResponses')}
                  </Text>
                  <HStack space="md">
                    <VStack flex={1} space="xs" borderWidth={1} borderColor="$borderLight200" borderRadius="$sm" p="$2">
                      <Text fontSize="$xs" color="$textMutedForeground">{t('offlineSync.taskConflictOffline')}</Text>
                      <Text fontSize="$sm">
                        {t('offlineSync.observationConflictAnswered')}: {oc?.offlineAnsweredCount ?? 0}
                      </Text>
                      <Text fontSize="$sm">
                        {t('offlineSync.observationConflictUnanswered')}: {oc?.offlineUnansweredCount ?? 0}
                      </Text>
                    </VStack>
                    <VStack flex={1} space="xs" borderWidth={1} borderColor="$borderLight200" borderRadius="$sm" p="$2">
                      <Text fontSize="$xs" color="$textMutedForeground">{t('offlineSync.taskConflictOnline')}</Text>
                      <Text fontSize="$sm">
                        {t('offlineSync.observationConflictAnswered')}: {oc?.onlineAnsweredCount ?? 0}
                      </Text>
                      <Text fontSize="$sm">
                        {t('offlineSync.observationConflictUnanswered')}: {oc?.onlineUnansweredCount ?? 0}
                      </Text>
                    </VStack>
                  </HStack>
                </VStack>

                {/* Evidence comparison */}
                {!!(oc?.offlineEvidenceCount || oc?.onlineEvidenceCount) &&
                <VStack space="xs">
                  <Text fontSize="$xs" fontWeight="$semibold" color="$textMutedForeground">
                    {t('offlineSync.observationConflictEvidence')}
                  </Text>
                  <HStack space="md">
                    <VStack flex={1} space="xs" borderWidth={1} borderColor="$borderLight200" borderRadius="$sm" p="$2">
                      <Text fontSize="$xs" color="$textMutedForeground">{t('offlineSync.taskConflictOffline')}</Text>
                      <Text fontSize="$sm" fontWeight="$medium">
                        {oc?.offlineEvidenceCount ?? 0} {t('offlineSync.taskConflictFiles')}
                      </Text>
                      {oc?.offlineFileNames?.length ? (
                        oc.offlineFileNames.map((name, i) => (
                          <Text key={i} fontSize="$xs" color="$textSecondary" numberOfLines={1}>{name}</Text>
                        ))
                      ) : (
                        <Text fontSize="$xs" color="$textMutedForeground">{t('offlineSync.taskConflictNoFiles')}</Text>
                      )}
                    </VStack>
                    <VStack flex={1} space="xs" borderWidth={1} borderColor="$borderLight200" borderRadius="$sm" p="$2">
                      <Text fontSize="$xs" color="$textMutedForeground">{t('offlineSync.taskConflictOnline')}</Text>
                      <Text fontSize="$sm" fontWeight="$medium">
                        {oc?.onlineEvidenceCount ?? 0} {t('offlineSync.taskConflictFiles')}
                      </Text>
                      {oc?.onlineFileNames?.length ? (
                        oc.onlineFileNames.map((name, i) => (
                          <Text key={i} fontSize="$xs" color="$textSecondary" numberOfLines={1}>{name}</Text>
                        ))
                      ) : (
                        <Text fontSize="$xs" color="$textMutedForeground">{t('offlineSync.taskConflictNoFiles')}</Text>
                      )}
                    </VStack>
                  </HStack>
                </VStack>}

                {/* Conflict reason */}
                {oc?.conflictReasons?.length ? (
                  <VStack space="xs">
                    <Text fontSize="$xs" fontWeight="$semibold" color="$textMutedForeground">
                      {t('offlineSync.observationConflictReason')}
                    </Text>
                    {oc.conflictReasons.map(reason => (
                      <Text key={reason} fontSize="$xs" color="$textSecondary">
                        {'• '}
                        {reason === 'completed'
                          ? t('offlineSync.observationConflictReasonCompleted')
                          : reason === 'status-ahead'
                          ? t('offlineSync.observationConflictReasonStatusAhead')
                          : reason === 'draft-ahead'
                          ? t('offlineSync.observationConflictReasonDraftAhead')
                          : t('offlineSync.observationConflictReasonTimestamp')}
                      </Text>
                    ))}
                  </VStack>
                ) : null}

              </VStack>
            </ScrollView>
          </VStack>
        </Modal>
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

  // ── Sync Summary renderer ─────────────────────────────────────────────────
  // One informational dialog shown once a batch sync run finishes — a category
  // section is omitted entirely when every one of its metrics is 0, and an
  // individual metric row is omitted when it's 0 (per the display rules).

  const renderCategorySummary = (titleKey: string, category: CategorySummary) => {
    const rows: Array<{ labelKey: string; value: number }> = [
      { labelKey: 'offlineSync.syncSummarySynced', value: category.synced },
      { labelKey: 'offlineSync.syncSummarySkipped', value: category.skipped },
      { labelKey: 'offlineSync.syncSummaryCancelled', value: category.cancelled },
      { labelKey: 'offlineSync.syncSummaryRemaining', value: category.remaining },
    ].filter(row => row.value > 0);

    if (rows.length === 0) return null;

    return (
      <VStack key={titleKey} space="xs">
        <Text fontSize="$sm" fontWeight="$semibold" color="$textPrimary">{t(titleKey)}</Text>
        {rows.map(row => (
          <HStack key={row.labelKey} justifyContent="space-between">
            <Text fontSize="$xs" color="$textMutedForeground">{t(row.labelKey)}</Text>
            <Text fontSize="$xs" fontWeight="$medium">{row.value}</Text>
          </HStack>
        ))}
      </VStack>
    );
  };

  const renderSyncSummary = () => {
    if (!syncSummary) return null;

    const sections = [
      renderCategorySummary('offlineSync.syncSummaryProjectSync', syncSummary.project),
      renderCategorySummary('offlineSync.syncSummaryTaskSync', syncSummary.task),
      renderCategorySummary('offlineSync.syncSummaryObservationSync', syncSummary.observation),
    ].filter(Boolean);

    return (
      <Modal
        isOpen
        onClose={() => setSyncSummary(null)}
        headerTitle={t('offlineSync.syncSummaryTitle')}
        size="md"
        showCloseButton={false}
        footerContent={
          <HStack space="md" justifyContent="flex-end">
            <Button variant="solid" size="sm" onPress={() => setSyncSummary(null)}>
              <ButtonText>{t('common.close')}</ButtonText>
            </Button>
          </HStack>
        }
      >
        <VStack space="md">
          {sections.length > 0 ? sections : (
            <Text fontSize="$sm" color="$textMutedForeground">{t('offlineSync.allSynced')}</Text>
          )}
        </VStack>
      </Modal>
    );
  };

  // ── Sync Interrupted notice ───────────────────────────────────────────────
  // Shown when a batch sync run had to stop mid-way because the device went
  // offline — see syncSelected's catch block.

  const renderSyncInterrupted = () => {
    if (!syncInterrupted) return null;

    return (
      <Modal
        isOpen
        onClose={() => setSyncInterrupted(false)}
        headerTitle={t('offlineSync.syncInterruptedTitle')}
        size="md"
        showCloseButton={false}
        footerContent={
          <HStack space="md" justifyContent="flex-end">
            <Button variant="solid" size="sm" onPress={() => setSyncInterrupted(false)}>
              <ButtonText>{t('common.close')}</ButtonText>
            </Button>
          </HStack>
        }
      >
        <Text fontSize="$sm" color="$textSecondary">{t('offlineSync.syncInterruptedMessage')}</Text>
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
                                  {renderProgressRow(state?.completedIdp ?? 0, entry.idp, t('offlineSync.labelIdp'), state?.stage === 'idp')}
                                </>
                              ) : (
                                <>
                                  {entry.files > 0 && <Text fontSize="$xs" color="$textSecondary">{t('offlineSync.pendingFiles', { count: entry.files })}</Text>}
                                  {entry.forms > 0 && <Text fontSize="$xs" color="$textSecondary">{t('offlineSync.pendingForms', { count: entry.forms })}</Text>}
                                  {entry.tasks > 0 && <Text fontSize="$xs" color="$textSecondary">{t('offlineSync.pendingTasks', { count: entry.tasks })}</Text>}
                                  {entry.idp > 0 && <Text fontSize="$xs" color="$textSecondary">{t('offlineSync.pendingIdp')}</Text>}
                                </>
                              )}
                            </HStack>

                            {isSyncing && state?.stage && state.stage !== 'idle' && (
                              <Text fontSize="$xs" color="$primary500">
                                {state.stage === 'files' ? t('offlineSync.stageFiles') : state.stage === 'forms' ? t('offlineSync.stageForms') : state.stage === 'idp' ? t('offlineSync.stageIdp') : t('offlineSync.stageTasks')}
                              </Text>
                            )}
                            {isError && !isSyncing && <Text fontSize="$xs" color="$error500">{t('offlineSync.syncError')}</Text>}
                            {isDone && <Text fontSize="$xs" color="$success600">{t('offlineSync.syncComplete')}</Text>}
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

      {/* Post-sync aggregate report — rendered once a batch sync run finishes */}
      {renderSyncSummary()}

      {/* Shown when a sync run had to stop mid-way because of connectivity loss */}
      {renderSyncInterrupted()}
    </>
  );
};

export default SyncOverviewModal;
