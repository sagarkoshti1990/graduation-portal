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
} from '@ui';
import { LucideIcon } from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import { useAuth, User } from '@contexts/AuthContext';
import {
  getDefaultSelection,
  buildDownloadConfig,
  resolveDownloadContext,
  DownloadModuleOption,
} from '@utils/downloadOptions';
import { startDownload } from '../../services/downloadService';
import { useOfflineSync } from '@contexts/OfflineSyncContext';
import { STATUS } from '@constants/app.constant';
import type { DownloadStatus, DownloadModuleKey } from '@app-types/offline';
import dataService from '../../services/dataService';
import { ProjectData } from '../../project-player/types';
import { StepState, StepRow, CheckRow, buildStepKeys, MODULE_LABEL } from './shared';

interface DownloadConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  participantId: string;
  onSuccess?: () => void;
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

  // Per-step progress state
  const [stepStates, setStepStates] = useState<Map<string, StepState>>(new Map());
  const [activeSteps, setActiveSteps] = useState<DownloadModuleKey[]>([]);
  // Use a ref for the callback so it doesn't cause re-render loops
  const stepStatesRef = useRef<Map<string, StepState>>(new Map());

  // Onboarding project is missing when participant is NOT_ONBOARDED and no project ID was set yet.
  // The download service will create it automatically — we only need to show the extra step in the UI.
  const needsOnboarding = participant ? resolveDownloadContext(participant).needsOnboarding : false;

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
    if (!participant) return;
    const ctx = resolveDownloadContext(participant);

    // For IN_PROGRESS, an IDP project ID is always required.
    if (ctx.missingProject) {
      setDownloadError(t('actions.downloadNoProject'));
      return;
    }

    // Build ordered step list (includes 'onboarding' when project creation is needed)
    const steps = buildStepKeys(selected, ctx.needsOnboarding);
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

      const result = await startDownload({
        participantId,
        projectId: ctx.resolvedProjectId,
        downloadConfig: config,
        lcUserId: user?.id ?? '',
        participantSnapshot: participant,
        onProgress,
        province: ctx.resolvedProvince,
        participantEntityId: ctx.resolvedEntityId,
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
  }, [selected, participant, participantId, t, refreshPending, onSuccess, user?.id]);

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
          <HStack space="sm" alignItems="flex-start" bg="$warning100" p="$3" borderRadius="$md">
            <LucideIcon name="Info" size={16} color="$warning700" />
            <Text fontSize="$sm" color="$warning700" flex={1}>
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

export default DownloadConfigModal;
