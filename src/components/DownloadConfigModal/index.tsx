import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Pressable,
} from '@ui';
import { LucideIcon } from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import { useAuth, User } from '@contexts/AuthContext';
import {
  getDefaultSelection,
  buildDownloadConfig,
  DownloadModuleOption,
} from '@utils/downloadOptions';
import { startDownload } from '../../services/downloadService';
import { useOfflineSync } from '@contexts/OfflineSyncContext';
import { STATUS } from '@constants/app.constant';
import type { DownloadStatus, DownloadModuleKey } from '@app-types/offline';
import dataService from '../../services/dataService';
import { ProjectData } from '../../project-player/types';

interface DownloadConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  participantId: string;
  onSuccess?: () => void;
}

// Maps every DownloadModuleKey to its i18n label key
const MODULE_LABEL: Record<DownloadModuleKey, string> = {
  onboarding:                   'actions.downloadOnboarding',
  participant:                  'actions.downloadParticipant',
  project:                      'actions.downloadProject',
  tasks:                        'actions.downloadProject',
  'observation:logVisit':       'actions.downloadLogVisit',
  'observation:householdProfile':'actions.downloadHouseholdProfile',
  'observation:individualVisit':'actions.downloadIndividualVisit',
  'observation:midline':        'actions.downloadMidline',
  'observation:interventionPlan':'actions.downloadInterventionPlan',
  'observation:endline':        'actions.downloadEndline',
};

// Download order matches the pipeline in downloadService.
// 'onboarding' is always first when present (automatic, not user-selected).
const DOWNLOAD_ORDER: DownloadModuleKey[] = [
  'onboarding',
  'participant',
  'project',
  'observation:logVisit',
  'observation:householdProfile',
  'observation:individualVisit',
  'observation:midline',
  'observation:interventionPlan',
  'observation:endline',
];

type StepState = 'pending' | 'loading' | 'completed' | 'failed';

/**
 * Build the ordered step keys that will actually appear in the progress UI.
 * `needsOnboarding` includes the automatic 'onboarding' step (not user-selected).
 */
function buildStepKeys(selected: Set<string>, needsOnboarding: boolean): DownloadModuleKey[] {
  return DOWNLOAD_ORDER.filter(key => {
    if (key === 'onboarding') return needsOnboarding;
    if (key === 'tasks') return false; // always bundled with project, never shown separately
    if (key === 'participant') return selected.has('participant');
    if (key === 'project') return selected.has('project');
    // Observation keys: selected set uses short keys like 'logVisit'
    const short = key.replace('observation:', '');
    return selected.has(short);
  });
}

const DownloadConfigModal: React.FC<DownloadConfigModalProps> = ({
  isOpen,
  onClose,
  participantId,
  onSuccess,
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { refreshPending } = useOfflineSync();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<DownloadStatus | null>(null);
  const [options,setOptions] = useState<DownloadModuleOption[] | null>(null);
  const [participant, setParticipant] = useState<User | undefined>();
  const projectId = (participant as any)?.idpProjectId;
  const participantStatus = participant?.status;
  const onBoardedProjectId = participant?.onBoardedProjectId;

  // Per-step progress state
  const [stepStates, setStepStates] = useState<Map<string, StepState>>(new Map());
  const [activeSteps, setActiveSteps] = useState<DownloadModuleKey[]>([]);
  // Use a ref for the callback so it doesn't cause re-render loops
  const stepStatesRef = useRef<Map<string, StepState>>(new Map());
  
  // Onboarding project is missing when participant is NOT_ONBOARDED and no project ID was set yet.
  // The download service will create it automatically — we only need to show the extra step in the UI.
  const needsOnboarding = participantStatus === STATUS.NOT_ONBOARDED && !onBoardedProjectId;

  const downloadDone = downloadStatus !== null;
  const downloadPartial = downloadDone && (downloadStatus!.failedModules ?? []).length > 0;
  const downloadFailed  = downloadDone && downloadStatus!.status === 'failed';

  // Derived progress from step states
  const completedCount = [...stepStatesRef.current.values()].filter(s => s === 'completed').length;
  const totalSteps = activeSteps.length;
  const progressPct = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

  useEffect(() => {
    const init = async () => {
      const result = await dataService.getParticipantDetails(participantId, user?.id || "");
      const participantData = result.data as any;
      const resolvedProjectId = (participantData.status === STATUS.NOT_ONBOARDED && participantData.onBoardedProjectId) ? participantData.onBoardedProjectId : participantData?.idpProjectId;
      let project;
      if(resolvedProjectId) {
        const resultProject = await dataService.getProject<ProjectData>(participantData.id, resolvedProjectId, user?.id ?? '')
        project = resultProject?.data;
      }
      setParticipant(participantData);
      const { selected:sel, options:op } = getDefaultSelection(participantData.status,project || undefined);
      setOptions(op);
      setSelected(sel);
      setDownloadError(null);
      setDownloadStatus(null);
      setStepStates(new Map());
      stepStatesRef.current = new Map();
      setActiveSteps([]);
    }
    if (isOpen) {
      init();
    }
  }, [isOpen, participantId, user?._id]);

  const toggleKey = useCallback((key: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const handleDownload = useCallback(async () => {
    // For IN_PROGRESS, an IDP project ID is always required.
    if (participantStatus === STATUS.IN_PROGRESS && !projectId) {
      setDownloadError(t('actions.downloadNoProject'));
      return;
    }

    // Resolve the project ID passed to the service.
    // For NOT_ONBOARDED without an onBoardedProjectId, pass undefined — the service
    // will create the onboarding project automatically in Step 0.
    const resolvedProjectId =
      participantStatus === STATUS.IN_PROGRESS
        ? projectId
        : participantStatus === STATUS.NOT_ONBOARDED
        ? (onBoardedProjectId || undefined)
        : undefined;

    // Build ordered step list (includes 'onboarding' when project creation is needed)
    const steps = buildStepKeys(selected, needsOnboarding);
    const initialMap = new Map<string, StepState>(steps.map(k => [k, 'pending']));
    stepStatesRef.current = initialMap;
    setActiveSteps(steps);
    setStepStates(new Map(initialMap));
    setIsDownloading(true);
    setDownloadError(null);

    const onProgress = (key: string, state: 'loading' | 'completed' | 'failed') => {
      stepStatesRef.current = new Map(stepStatesRef.current).set(key, state);
      setStepStates(new Map(stepStatesRef.current));
    };
    try {
      const config = buildDownloadConfig(selected);

      // province lives in userDetails in raw list rows (e.g. userDetails.province.value),
      // but may be at the top level after flattening or as a plain string.
      const rawProvince =
        participant?.province ??
        participant?.userDetails?.province;
      const resolvedProvince: string | undefined =
        typeof rawProvince === 'string'
          ? rawProvince
          : rawProvince?.value ?? rawProvince?.label;

      // entityId may be at the top level, entity_id, inside userDetails, or equal to userId
      // (fetchAndStoreParticipant filters the list API with entityId = participantId, confirming they are the same)
      const resolvedEntityId: string | undefined =
        participant?.entityId ??
        (participant as any)?.entity_id ??
        participant?.userDetails?.entityId ??
        participant?.userId;

      const result = await startDownload({
        participantId,
        projectId: resolvedProjectId,
        downloadConfig: config,
        lcUserId: user?.id ?? '',
        participantSnapshot: participant,
        onProgress,
        province: resolvedProvince,
        participantEntityId: resolvedEntityId,
      });

      setDownloadStatus(result.status);
      if (result.success) {
        await refreshPending();
        onSuccess?.();
      } else if (result.error) {
        // Surface the specific failure reason in the result UI
        setDownloadError(result.error);
      }
    } catch (err: any) {
      setDownloadError(err?.message ?? t('actions.downloadError'));
    } finally {
      setIsDownloading(false);
    }
  }, [needsOnboarding, projectId, onBoardedProjectId, selected, participantId, participantStatus, t, refreshPending, onSuccess, user?.id]);

  // Build the result rows for the completed state — dedup 'tasks' (bundled under project)
  const resultRows: Array<{ key: string; label: string; state: 'success' | 'failed' }> = [];
  if (downloadStatus) {
    const seen = new Set<string>();
    for (const key of [...downloadStatus.completedModules, ...downloadStatus.failedModules]) {
      if (key === 'tasks') continue;
      if (seen.has(key)) continue;
      seen.add(key);
      const label = MODULE_LABEL[key as DownloadModuleKey] ?? key;
      resultRows.push({
        key,
        label,
        state: downloadStatus.completedModules.includes(key) ? 'success' : 'failed',
      });
    }
  }
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}}
      headerTitle={t('actions.downloadOffline')}
      headerIcon={<LucideIcon name="Download" size={20} color="$primary500" />}
      size="md"
      showCloseButton={false}
    >
      <VStack space="lg">
        {/* Informational banner when the onboarding project will be created automatically */}
        {needsOnboarding && !isDownloading && !downloadDone && (
          <HStack space="sm" alignItems="flex-start" bg="$info100" p="$3" borderRadius="$md">
            <LucideIcon name="Info" size={16} color="$info600" />
            <Text fontSize="$sm" color="$info800" flex={1}>
              {t('actions.TARGETING_CRITERIA_NOT_COMPLETED')}
            </Text>
          </HStack>
        )}

        {/* ── DOWNLOADING STATE: per-step progress ── */}
        {isDownloading && activeSteps.length > 0 ? (
          <VStack space="md">
            <Text fontSize="$sm" color="$textMutedForeground">
              {t('actions.downloadInProgress') || 'Downloading…'}
            </Text>

            {/* Progress bar */}
            <Box bg="$backgroundLight200" borderRadius="$full" height={6} overflow="hidden">
              <Box
                bg="$primary500"
                height={6}
                borderRadius="$full"
                // @ts-ignore - width percentage
                width={`${progressPct}%`}
              />
            </Box>
            <Text fontSize="$xs" color="$textMutedForeground" textAlign="right">
              {progressPct}%
            </Text>

            {/* Per-step list */}
            <VStack space="xs">
              {activeSteps?.map(key => {
                const state = stepStates.get(key) ?? 'pending';
                return <StepRow key={key} labelKey={MODULE_LABEL[key] ?? key} state={state} />;
              })}
            </VStack>
          </VStack>
        ) : downloadDone ? (
          /* ── RESULT STATE (success / partial / failed) ── */
          <VStack space="md">
            <HStack space="sm" alignItems="center">
              <LucideIcon
                name={downloadFailed ? 'XCircle' : downloadPartial ? 'AlertCircle' : 'CircleCheck'}
                size={28}
                color={downloadFailed ? '$error500' : downloadPartial ? '$warning500' : '$success600'}
              />
              <Text
                fontSize="$md"
                fontWeight="$semibold"
                color={downloadFailed ? '$error600' : downloadPartial ? '$warning600' : '$success600'}
              >
                {downloadFailed
                  ? (downloadError || t('actions.downloadError'))
                  : downloadPartial
                  ? t('actions.downloadPartial')
                  : t('actions.downloadSuccess')}
              </Text>
            </HStack>

            {resultRows.length > 0 && (
              <VStack space="xs" pl="$1">
                {resultRows.map(({ key, label, state }) => (
                  <HStack key={key} space="sm" alignItems="center">
                    <LucideIcon
                      name={state === 'success' ? 'CircleCheck' : 'XCircle'}
                      size={14}
                      color={state === 'success' ? '$success600' : '$error500'}
                    />
                    <Text
                      fontSize="$sm"
                      color={state === 'success' ? '$textPrimary' : '$error600'}
                    >
                      {t(label)}
                    </Text>
                  </HStack>
                ))}
              </VStack>
            )}

            <HStack justifyContent="flex-end">
              <Button variant="solid" size="sm" onPress={onClose}>
                <ButtonText>{t('common.close')}</ButtonText>
              </Button>
            </HStack>
          </VStack>
        ) : (
          /* ── SELECTION STATE ── */
          <>
            <Text fontSize="$sm" color="$textMutedForeground">
              {t('actions.downloadHint')}
            </Text>

            <VStack space="md">
             {options?.map(opt => {
                if (!opt.enabled) return null;

                const isNested = !!opt.nested;

                if (isNested) {
                  const enabledNested: any[] = [];
                  let childrenRequired = false;

                  (opt.nested ?? []).forEach((item: any) => {
                    if (item.enabled) {
                      enabledNested.push(item);
                    }

                    if (item.required) {
                      childrenRequired = true;
                    }
                  });

                  if (enabledNested.length === 0) return null;
                  
                  return (
                    <VStack key={opt.key} space="sm">
                      {childrenRequired ? (
                        <VStack space="sm">
                          <CheckRow
                            labelKey={opt.labelKey}
                            checked={selected.has(opt.key as string)}
                            onToggle={() => toggleKey(opt.key as string)}
                            disabled={isDownloading}
                          />

                          <VStack space="sm" pl="$5">
                            {enabledNested.map(nested => (
                              <HStack key={nested.key} space="sm" alignItems="flex-start">
                                <LucideIcon name={selected.has(opt.key as string) ? "CheckCircle" : "CircleDot"} color={selected.has(opt.key as string) ? "$primary500" :"$textMuted"} size={16}/>
                                <Text flex={1} fontSize="$sm" color="$textPrimary">
                                  {t(nested.labelKey)}
                                </Text>
                              </HStack>
                            ))}
                          </VStack>
                        </VStack>
                      ) : (
                        <VStack space="sm">
                          <Text
                            fontSize="$sm"
                            color="$textPrimary"
                          >
                            {t(opt.labelKey)}
                          </Text>

                          {enabledNested.map(nested => (
                            <CheckRow
                              key={nested.key}
                              labelKey={nested.labelKey}
                              checked={selected.has(nested.key)}
                              onToggle={() => toggleKey(nested.key)}
                              disabled={isDownloading}
                              indented
                            />
                          ))}
                        </VStack>
                      )}
                    </VStack>
                  );
                }

                return (
                  <CheckRow
                    key={opt.key}
                    labelKey={opt.labelKey}
                    checked={selected.has(opt.key)}
                    onToggle={() => toggleKey(opt.key)}
                    disabled={isDownloading}
                  />
                );
              })}
            </VStack>

            {downloadError && (
              <HStack space="sm" alignItems="flex-start" bg="$error50" p="$3" borderRadius="$md">
                <LucideIcon name="AlertCircle" size={14} color="$error500" />
                <Text fontSize="$sm" color="$error600" flex={1}>{downloadError}</Text>
              </HStack>
            )}

            <HStack space="md" justifyContent="flex-end">
              {/* @ts-ignore */}
              <Button variant="outlineghost" size="sm" onPress={onClose} isDisabled={isDownloading}>
                <ButtonText>{t('common.cancel')}</ButtonText>
              </Button>
              {!needsOnboarding &&
              <Button
                variant="solid"
                size="sm"
                onPress={handleDownload}
                isDisabled={isDownloading || selected.size === 0}
              >
                {isDownloading ? (
                  <Spinner size="small" color="white" mr="$2" />
                ) : (
                  <ButtonIcon as={LucideIcon} name="Download" mr="$1" />
                )}
                <ButtonText>
                  {isDownloading ? t('common.loading') : t('actions.download')}
                </ButtonText>
              </Button>}
            </HStack>
          </>
        )}
      </VStack>
    </Modal>
  );
};

// ---------------------------------------------------------------------------
// Step row — shows PENDING / LOADING / COMPLETED / FAILED state per module
// ---------------------------------------------------------------------------

interface StepRowProps {
  labelKey: string;
  state: StepState;
}

const StepRow: React.FC<StepRowProps> = ({ labelKey, state }) => {
  const { t } = useLanguage();

  const icon = state === 'completed'
    ? <LucideIcon name="CircleCheck" size={16} color="$success600" />
    : state === 'failed'
    ? <LucideIcon name="XCircle" size={16} color="$error500" />
    : state === 'loading'
    ? <Spinner size="small" color="$primary500" />
    : <Box width={16} height={16} borderRadius="$full" borderWidth={1} borderColor="$borderLight300" />;

  const textColor = state === 'completed'
    ? '$textPrimary'
    : state === 'failed'
    ? '$error600'
    : state === 'loading'
    ? '$primary600'
    : '$textMutedForeground';

  return (
    <HStack space="sm" alignItems="center" py="$0.5">
      {icon}
      <Text fontSize="$sm" color={textColor} flex={1}>
        {t(labelKey)}
      </Text>
    </HStack>
  );
};

// ---------------------------------------------------------------------------
// Small checkbox row
// ---------------------------------------------------------------------------
interface CheckRowProps {
  labelKey: string;
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
  indented?: boolean;
}

const CheckRow: React.FC<CheckRowProps> = ({ labelKey, checked, onToggle, disabled, indented }) => {
  const { t } = useLanguage();
  return (
    <Pressable onPress={disabled ? undefined : onToggle} opacity={disabled ? 0.5 : 1}>
      <HStack space="sm" alignItems="center" pl={indented ? '$4' : '$0'}>
        <Box
          width={18}
          height={18}
          borderRadius="$sm"
          borderWidth={2}
          borderColor={checked ? '$primary500' : '$borderLight300'}
          backgroundColor={checked ? '$primary500' : 'transparent'}
          alignItems="center"
          justifyContent="center"
        >
          {checked && <LucideIcon name="Check" size={12} color="white" />}
        </Box>
        <Text fontSize="$sm" color="$textPrimary">{t(labelKey)}</Text>
      </HStack>
    </Pressable>
  );
};

export default DownloadConfigModal;
