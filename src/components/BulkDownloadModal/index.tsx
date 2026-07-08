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
} from '@ui';
import { LucideIcon } from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import { useAuth } from '@contexts/AuthContext';
import {
  getDefaultSelection,
  buildDownloadConfig,
  DownloadModuleOption,
} from '@utils/downloadOptions';
import { startDownload } from '../../services/downloadService';
import { useOfflineSync } from '@contexts/OfflineSyncContext';
import { STATUS } from '@constants/app.constant';
import type { DownloadModuleKey } from '@app-types/offline';
import type { Participant } from '@app-types/screens';
import dataService from '../../services/dataService';
import { StepState, StepRow, CheckRow, buildStepKeys, MODULE_LABEL } from '../DownloadConfigModal/shared';

interface BulkDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Participant row objects currently selected in the list (order = selection order). */
  participants: Participant[];
  /** Called once, if at least one participant downloaded successfully, before onClose. */
  onSuccess?: () => void;
}

type ParticipantPhase = 'pending' | 'downloading' | 'completed' | 'failed';

interface ParticipantRunState {
  participantId: string;
  name: string;
  phase: ParticipantPhase;
  error?: string;
  activeSteps: DownloadModuleKey[];
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

  // Build the ONE-TIME shared option list from the first selected participant's
  // status — the selection applies to every participant in the batch. The
  // dynamic per-project household task list is intentionally omitted here (it
  // differs per participant and doesn't affect DownloadConfig — see downloadOptions.ts).
  useEffect(() => {
    if (!isOpen || participants.length === 0) return;
    const first = participants[0];
    const { selected: sel, options: op } = getDefaultSelection(first.status || '', undefined);
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

    const config = buildDownloadConfig(selected);

    for (const participantId of participantIds) {
      setActiveParticipantId(participantId);
      patchRunState(participantId, { phase: 'downloading', error: undefined });

      try {
        const detailsResult = await dataService.getParticipantDetails(participantId, user?.id || '');
        const participantData = detailsResult?.data as any;
        if (!participantData) throw new Error(t('actions.downloadError'));

        const participantStatus = participantData.status;
        const projectId = participantData.idpProjectId;
        const onBoardedProjectId = participantData.onBoardedProjectId;
        const needsOnboarding = participantStatus === STATUS.NOT_ONBOARDED && !onBoardedProjectId;

        if (participantStatus === STATUS.IN_PROGRESS && !projectId) {
          throw new Error(t('actions.downloadNoProject'));
        }

        const resolvedProjectId =
          participantStatus === STATUS.IN_PROGRESS
            ? projectId
            : participantStatus === STATUS.NOT_ONBOARDED
            ? (onBoardedProjectId || undefined)
            : undefined;

        const rawProvince = participantData.province ?? participantData?.userDetails?.province;
        const resolvedProvince: string | undefined =
          typeof rawProvince === 'string' ? rawProvince : rawProvince?.value ?? rawProvince?.label;

        const resolvedEntityId: string | undefined =
          participantData.entityId ??
          participantData?.entity_id ??
          participantData?.userDetails?.entityId ??
          participantData.userId;

        const steps = buildStepKeys(selected, needsOnboarding);
        patchRunState(participantId, {
          activeSteps: steps,
          stepStates: new Map(steps.map(k => [k, 'pending'])),
        });

        const onProgress = (key: string, state: StepState) => {
          patchStepState(participantId, key, state);
        };

        const result = await startDownload({
          participantId,
          projectId: resolvedProjectId,
          downloadConfig: config,
          lcUserId: user?.id ?? '',
          participantSnapshot: participantData,
          onProgress,
          province: resolvedProvince,
          participantEntityId: resolvedEntityId,
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
    onClose();
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

            <VStack space="sm" maxHeight={360} overflow="scroll">
              {participants.map(p => {
                const state = runStates.get(p.userId);
                if (!state) return null;
                return (
                  <ParticipantRow
                    key={p.userId}
                    state={state}
                    isActive={p.userId === activeParticipantId}
                  />
                );
              })}
            </VStack>
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
          {state.activeSteps.map(key => (
            <StepRow key={key} labelKey={MODULE_LABEL[key] ?? key} state={state.stepStates.get(key) ?? 'pending'} />
          ))}
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
