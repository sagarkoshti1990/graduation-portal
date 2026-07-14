import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import { useAuth } from '@contexts/AuthContext';
import {
  getAllDefaultSelection,
  getDownloadOptions,
  getEnabledKeys,
  resolveDownloadContext,
  buildDownloadConfig,
  DownloadModuleOption,
} from '@utils/downloadOptions';
import { startDownload } from '../../services/downloadService';
import { useOfflineSync } from '@contexts/OfflineSyncContext';
import type { Participant } from '@app-types/screens';
import dataService from '../../services/dataService';
import { ProjectData } from '../../project-player/types';
import { StepState, StepRow, CheckRow, buildStepKeys, MODULE_LABEL } from '../DownloadConfigModal/shared';

interface BulkDownloadModalProps {
  isOpen: boolean;
  onClose: (type?:string) => void;
  /** Participant row objects currently selected in the list (order = selection order). */
  participants: Participant[];
  /** Called once, if at least one participant downloaded successfully, before onClose. */
  onSuccess?: () => void;
}

type ParticipantPhase = 'pending' | 'downloading' | 'completed' | 'failed';

interface ProgressStep {
  key: string;
  labelKey: string;
  /** true for a project task-observation row nested under the 'project' step. */
  isProjectChild?: boolean;
}

interface ParticipantRunState {
  participantId: string;
  name: string;
  phase: ParticipantPhase;
  error?: string;
  activeSteps: ProgressStep[];
  stepStates: Map<string, StepState>;
}

type Screen = 'select' | 'running' | 'summary';

const BulkDownloadModal: React.FC<BulkDownloadModalProps> = ({
  isOpen,
  onClose,
  participants,
  onSuccess,
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { refreshPending } = useOfflineSync();

  const [screen, setScreen] = useState<Screen>('select');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [options, setOptions] = useState<DownloadModuleOption[] | null>(null);
  const [runStates, setRunStates] = useState<Map<string, ParticipantRunState>>(new Map());
  const runStatesRef = useRef<Map<string, ParticipantRunState>>(new Map());
  const [activeParticipantId, setActiveParticipantId] = useState<string | null>(null);
  const isRunningRef = useRef(false);
  const hadSuccessRef = useRef(false);

  // Auto-scroll: keeps the currently-downloading participant row visible inside
  // the fixed-height scroll area below, without redesigning the popup itself.
  const scrollViewRef = useRef<any>(null);
  // Layout captured per participant row via onLayout — {y, height} relative to
  // the scroll content, so we know both where the row starts and how tall it is
  // (a row grows as its module steps render while active).
  const rowLayoutsRef = useRef<Record<string, { y: number; height: number }>>({});

  // Build the ONE-TIME shared option list, unfiltered by any single participant's
  // status — every module available to at least one status is offered, since the
  // batch can contain participants in different states. Per-participant availability
  // (and the dynamic per-project household task list) is resolved individually for
  // each participant when its download actually runs — see runDownloads below.
  useEffect(() => {
    if (!isOpen || participants.length === 0) return;
    const { selected: sel, options: op } = getAllDefaultSelection(participants);
    setOptions(op);
    setSelected(sel);
    setScreen('select');
    setActiveParticipantId(null);
    hadSuccessRef.current = false;

    const initial = new Map<string, ParticipantRunState>();
    participants.forEach(p => {
      initial.set(p.userId, {
        participantId: p.userId,
        name: p.name || p.userId,
        phase: 'pending',
        activeSteps: [],
        stepStates: new Map(),
      });
    });
    runStatesRef.current = initial;
    setRunStates(new Map(initial));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const toggleKey = useCallback((key: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const patchRunState = useCallback((participantId: string, patch: Partial<ParticipantRunState>) => {
    const current = runStatesRef.current.get(participantId);
    if (!current) return;
    const next = new Map(runStatesRef.current);
    next.set(participantId, { ...current, ...patch });
    runStatesRef.current = next;
    setRunStates(next);
  }, []);

  const patchStepState = useCallback((participantId: string, key: string, state: StepState) => {
    const current = runStatesRef.current.get(participantId);
    if (!current) return;
    patchRunState(participantId, { stepStates: new Map(current.stepStates).set(key, state) });
  }, [patchRunState]);

  // Sequential per-participant download — reuses startDownload exactly like the
  // single-participant flow. One participant's download always finishes (success
  // or failure) before the next one starts.
  const runDownloads = useCallback(async (participantIds: string[]) => {
    if (isRunningRef.current || participantIds.length === 0) return;
    isRunningRef.current = true;
    setScreen('running');

    for (const participantId of participantIds) {
      setActiveParticipantId(participantId);
      patchRunState(participantId, { phase: 'downloading', error: undefined });

      try {
        const detailsResult = await dataService.getParticipantDetails(participantId, user?.id || '');
        const participantData = detailsResult?.data as any;
        if (!participantData) throw new Error(t('actions.downloadError'));

        const ctx = resolveDownloadContext(participantData);
        if (ctx.missingProject) {
          throw new Error(t('actions.downloadNoProject'));
        }

        // Fetch the participant's project so its dynamic per-project task list
        // (household observations) is reflected in availability, same as the
        // single-participant modal does on open.
        let project: ProjectData | undefined;
        if (ctx.resolvedProjectId) {
          const resultProject = await dataService.getProject<ProjectData>(
            participantData.id,
            ctx.resolvedProjectId,
            user?.id ?? '',
          );
          project = resultProject?.data ?? undefined;
        }

        // The admin's selection is the batch-wide *desired* modules — but this
        // participant's own status (and project) decides which of those are
        // actually available (e.g. Midline may be checked for the batch but not
        // yet available for a NOT_ONBOARDED participant). Reuse the same
        // status→options logic as the single-participant modal so both flows
        // stay in sync.
        const participantOptions = getDownloadOptions(ctx.participantStatus, project);
        const availableKeys = getEnabledKeys(participantOptions);
        const participantSelected = new Set([...selected].filter(key => availableKeys.has(key)));
        if (participantSelected.size === 0) {
          throw new Error(t('actions.downloadNoModulesAvailable'));
        }
        const config = buildDownloadConfig(participantSelected);

        const fixedSteps = buildStepKeys(participantSelected);
        let combinedSteps: ProgressStep[] = fixedSteps.map(key => ({ key, labelKey: MODULE_LABEL[key] ?? key }));

        // Project's own task observations (household forms) are bundled into the
        // 'project' download step but shown as nested rows under it, same as the
        // nested checklist the single-participant modal shows on selection.
        if (participantSelected.has('project')) {
          const projectOption = participantOptions.find(o => o.key === 'project');
          const nestedTaskSteps: ProgressStep[] = (projectOption?.nested ?? [])
            .filter(item => item.enabled)
            .map(item => ({ key: item.key, labelKey: item.labelKey, isProjectChild: true }));
          const projectIdx = combinedSteps.findIndex(s => s.key === 'project');
          combinedSteps = [
            ...combinedSteps.slice(0, projectIdx + 1),
            ...nestedTaskSteps,
            ...combinedSteps.slice(projectIdx + 1),
          ];
        }

        patchRunState(participantId, {
          activeSteps: combinedSteps,
          stepStates: new Map(fixedSteps.map(k => [k, 'pending'])),
        });

        const onProgress = (key: string, state: StepState) => {
          patchStepState(participantId, key, state);
        };

        const result = await startDownload({
          participantId,
          projectId: ctx.resolvedProjectId,
          downloadConfig: config,
          lcUserId: user?.id ?? '',
          participantSnapshot: participantData,
          onProgress,
          province: ctx.resolvedProvince,
          participantEntityId: ctx.resolvedEntityId,
        });

        const hasFailedModules = (result.status?.failedModules ?? []).length > 0;
        if (result.success && !hasFailedModules) {
          patchRunState(participantId, { phase: 'completed', error: undefined });
          hadSuccessRef.current = true;
        } else {
          patchRunState(participantId, {
            phase: 'failed',
            error: result.error || t('actions.downloadPartial'),
          });
        }
      } catch (err: any) {
        patchRunState(participantId, { phase: 'failed', error: err?.message ?? t('actions.downloadError') });
      }
    }

    setActiveParticipantId(null);
    isRunningRef.current = false;
    setScreen('summary');
    await refreshPending();
  }, [selected, user?.id, t, patchRunState, patchStepState, refreshPending]);

  const handleStartDownload = useCallback(() => {
    runDownloads(participants.map(p => p.userId));
  }, [runDownloads, participants]);

  // Which module step (if any) is currently loading for the active participant —
  // used to re-trigger auto-scroll as the active row grows while it downloads.
  const activeStepKey = useMemo(() => {
    if (!activeParticipantId) return null;
    const state = runStates.get(activeParticipantId);
    if (!state) return null;
    for (const [key, stepState] of state.stepStates) {
      if (stepState === 'loading') return key;
    }
    return null;
  }, [activeParticipantId, runStates]);

  // Keep the active participant's row visible as the download progresses. If the
  // row is short, scroll its top into view; if it has grown taller than the
  // scroll viewport (many module steps), scroll to its bottom instead so the
  // most recently started step — where the current activity is — stays visible.
  useEffect(() => {
    if (!activeParticipantId || !scrollViewRef.current) return;
    const layout = rowLayoutsRef.current[activeParticipantId];
    if (!layout) return;
    const viewportHeight = 360;
    const targetY = layout.height > viewportHeight
      ? layout.y + layout.height - viewportHeight
      : layout.y;
    scrollViewRef.current.scrollTo({ y: Math.max(0, targetY), animated: true });
  }, [activeParticipantId, activeStepKey]);

  const completedCount = useMemo(
    () => [...runStates.values()].filter(s => s.phase === 'completed').length,
    [runStates],
  );
  const failedEntries = useMemo(
    () => [...runStates.values()].filter(s => s.phase === 'failed'),
    [runStates],
  );

  const handleRedownloadFailed = useCallback(() => {
    runDownloads(failedEntries.map(s => s.participantId));
  }, [runDownloads, failedEntries]);

  const handleClose = useCallback(() => {
    if (hadSuccessRef.current) onSuccess?.();
    onClose("close");
  }, [onClose, onSuccess]);

  const runningProgressPct = participants.length > 0
    ? Math.round((completedCount + failedEntries.length) / participants.length * 100)
    : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}}
      headerTitle={t('participants.bulkDownload')}
      headerIcon={<LucideIcon name="Download" size={20} color="$primary500" />}
      size="md"
      showCloseButton={false}
    >
      <VStack space="lg">
        {screen === 'select' && (
          <>
            <Text fontSize="$sm" color="$textMutedForeground">
              {t('actions.bulkDownloadHint')}
            </Text>

            <Text fontSize="$sm" fontWeight="$medium" color="$textPrimary">
              {t('actions.bulkDownloadParticipantCount', { count: participants.length })}
            </Text>

            <VStack space="md">
              {options?.map(opt => {
                if (!opt.enabled) return null;
                const isNested = !!opt.nested;

                if (isNested) {
                  const enabledNested = (opt.nested ?? []).filter(item => item.enabled);
                  if (enabledNested.length === 0) return null;
                  return (
                    <VStack key={opt.key} space="sm">
                      <Text fontSize="$sm" color="$textPrimary">
                        {t(opt.labelKey)}
                      </Text>
                      {enabledNested.map(nested => (
                        <CheckRow
                          key={nested.key}
                          labelKey={nested.labelKey}
                          checked={selected.has(nested.key)}
                          onToggle={() => toggleKey(nested.key)}
                          indented
                        />
                      ))}
                    </VStack>
                  );
                }

                return (
                  <CheckRow
                    key={opt.key}
                    labelKey={opt.labelKey}
                    checked={selected.has(opt.key)}
                    onToggle={() => toggleKey(opt.key as string)}
                  />
                );
              })}
            </VStack>

            <HStack space="md" justifyContent="flex-end">
              {/* @ts-ignore */}
              <Button variant="outlineghost" size="sm" onPress={onClose}>
                <ButtonText>{t('common.cancel')}</ButtonText>
              </Button>
              <Button
                variant="solid"
                size="sm"
                onPress={handleStartDownload}
                isDisabled={selected.size === 0 || participants.length === 0}
              >
                <ButtonIcon as={LucideIcon} name="Download" mr="$1" />
                <ButtonText>{t('actions.download')}</ButtonText>
              </Button>
            </HStack>
          </>
        )}

        {screen === 'running' && (
          <VStack space="md">
            <Text fontSize="$sm" color="$textMutedForeground">
              {t('actions.bulkDownloadInProgress')}
            </Text>

            <Box bg="$backgroundLight200" borderRadius="$full" height={6} overflow="hidden">
              <Box
                bg="$primary500"
                height={6}
                borderRadius="$full"
                // @ts-ignore - width percentage
                width={`${runningProgressPct}%`}
              />
            </Box>

            <ScrollView ref={scrollViewRef} maxHeight={360} showsVerticalScrollIndicator>
              <VStack space="sm">
                {participants.map(p => {
                  const state = runStates.get(p.userId);
                  if (!state) return null;
                  return (
                    <Box
                      key={p.userId}
                      onLayout={(e: any) => {
                        const { y, height } = e.nativeEvent.layout;
                        rowLayoutsRef.current[p.userId] = { y, height };
                      }}
                    >
                      <ParticipantRow
                        state={state}
                        isActive={p.userId === activeParticipantId}
                      />
                    </Box>
                  );
                })}
              </VStack>
            </ScrollView>
          </VStack>
        )}

        {screen === 'summary' && (
          <VStack space="md">
            <HStack space="sm" alignItems="center">
              <LucideIcon
                name={failedEntries.length > 0 ? 'AlertCircle' : 'CircleCheck'}
                size={28}
                color={failedEntries.length > 0 ? '$warning500' : '$success600'}
              />
              <Text fontSize="$md" fontWeight="$semibold" color="$textPrimary">
                {t('actions.bulkDownloadSummary')}
              </Text>
            </HStack>

            <VStack space="xs" pl="$1">
              <SummaryRow labelKey="actions.bulkDownloadTotalSelected" value={participants.length} />
              <SummaryRow labelKey="actions.bulkDownloadSuccessCount" value={completedCount} color="$success600" />
              {failedEntries.length > 0 && (
                <SummaryRow labelKey="actions.bulkDownloadFailedCount" value={failedEntries.length} color="$error600" />
              )}
            </VStack>

            <HStack space="md" justifyContent="flex-end">
              {failedEntries.length > 0 && (
                // @ts-ignore
                <Button variant="outlineghost" size="sm" onPress={handleRedownloadFailed}>
                  <ButtonIcon as={LucideIcon} name="RefreshCw" mr="$1" />
                  <ButtonText>{t('actions.reDownloadFailed')}</ButtonText>
                </Button>
              )}
              <Button variant="solid" size="sm" onPress={handleClose}>
                <ButtonText>{t('common.close')}</ButtonText>
              </Button>
            </HStack>
          </VStack>
        )}
      </VStack>
    </Modal>
  );
};

// ---------------------------------------------------------------------------
// Per-participant row — icon + name + phase, with nested module steps while active
// ---------------------------------------------------------------------------

const ParticipantRow: React.FC<{ state: ParticipantRunState; isActive: boolean }> = ({ state, isActive }) => {
  const { t } = useLanguage();

  const icon = state.phase === 'completed'
    ? <LucideIcon name="CircleCheck" size={18} color="$success600" />
    : state.phase === 'failed'
    ? <LucideIcon name="XCircle" size={18} color="$error500" />
    : state.phase === 'downloading'
    ? <Spinner size="small" color="$primary500" />
    : <Box width={18} height={18} borderRadius="$full" borderWidth={1} borderColor="$borderLight300" />;

  const phaseLabel = t(
    state.phase === 'completed' ? 'actions.bulkDownloadCompleted'
      : state.phase === 'failed' ? 'actions.bulkDownloadFailed'
      : state.phase === 'downloading' ? 'actions.bulkDownloadDownloading'
      : 'actions.bulkDownloadPending',
  );

  return (
    <VStack space="xs">
      <HStack space="sm" alignItems="center" justifyContent="space-between">
        <HStack space="sm" alignItems="center" flex={1}>
          {icon}
          <Text fontSize="$sm" fontWeight="$medium" color="$textPrimary">
            {state.name}
          </Text>
        </HStack>
        <Text
          fontSize="$xs"
          color={
            state.phase === 'completed' ? '$success600'
              : state.phase === 'failed' ? '$error600'
              : '$textMutedForeground'
          }
        >
          {phaseLabel}
        </Text>
      </HStack>

      {isActive && state.activeSteps.length > 0 && (
        <VStack space="xs" pl="$7">
          {state.activeSteps.map(step => {
            // its state (pending → loading → completed/failed) as a group.
            const stepState = step.isProjectChild
              ? state.stepStates.get('project') ?? 'pending'
              : state.stepStates.get(step.key) ?? 'pending';
            const row = <StepRow labelKey={step.labelKey} state={stepState} hideIcon={!step.isProjectChild} />;
            return step.isProjectChild ? (
              <Box key={step.key} pl="$4">
                {row}
              </Box>
            ) : (
              <React.Fragment key={step.key}>{row}</React.Fragment>
            );
          })}
        </VStack>
      )}

      {state.phase === 'failed' && state.error && (
        <Text fontSize="$xs" color="$error600" pl="$7">
          {state.error}
        </Text>
      )}
    </VStack>
  );
};

const SummaryRow: React.FC<{ labelKey: string; value: number; color?: string }> = ({ labelKey, value, color }) => {
  const { t } = useLanguage();
  return (
    <HStack space="sm" justifyContent="space-between">
      <Text fontSize="$sm" color="$textMutedForeground">{t(labelKey)}</Text>
      <Text fontSize="$sm" fontWeight="$semibold" color={color ?? '$textPrimary'}>{value}</Text>
    </HStack>
  );
};

export default BulkDownloadModal;
