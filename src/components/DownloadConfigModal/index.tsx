import React, { useState, useEffect, useCallback } from 'react';
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
import { useAuth } from '@contexts/AuthContext';
import {
  getDownloadOptions,
  getDefaultSelection,
  buildDownloadConfig,
} from '@utils/downloadOptions';
import { startDownload } from '../../services/downloadService';
import { useOfflineSync } from '@contexts/OfflineSyncContext';
import { STATUS } from '@constants/app.constant';
import type { DownloadStatus, DownloadModuleKey } from '@app-types/offline';

interface DownloadConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  participantId: string;
  projectId?: string;
  participantStatus: string;
  participantData?: any;
  onBoardedProjectId?: string;
  onSuccess?: () => void;
}

// Maps every DownloadModuleKey to its i18n label key
const MODULE_LABEL: Record<DownloadModuleKey, string> = {
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

const DownloadConfigModal: React.FC<DownloadConfigModalProps> = ({
  isOpen,
  onClose,
  participantId,
  projectId,
  participantStatus,
  participantData,
  onBoardedProjectId,
  onSuccess,
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { refreshPending } = useOfflineSync();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<DownloadStatus | null>(null);

  const options = getDownloadOptions(participantStatus);
  const isInProgress = participantStatus === STATUS.IN_PROGRESS;
  const needsOnboardingProject = isInProgress && !onBoardedProjectId && !projectId;

  // downloadDone = any terminal state (success, partial, or full failure after attempt)
  const downloadDone = downloadStatus !== null;
  const downloadPartial = downloadDone && (downloadStatus!.failedModules ?? []).length > 0;
  const downloadFailed  = downloadDone && downloadStatus!.status === 'failed';

  useEffect(() => {
    if (isOpen) {
      setSelected(getDefaultSelection(participantStatus));
      setDownloadError(null);
      setDownloadStatus(null);
    }
  }, [isOpen, participantStatus]);

  const toggleKey = useCallback((key: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const handleDownload = useCallback(async () => {
    if (needsOnboardingProject) {
      setDownloadError(t('actions.downloadNeedsOnboardingProject'));
      return;
    }

    const resolvedProjectId = projectId ?? onBoardedProjectId;
    if (!resolvedProjectId) {
      setDownloadError(t('actions.downloadNoProject'));
      return;
    }

    setIsDownloading(true);
    setDownloadError(null);

    try {
      const config = buildDownloadConfig(selected);
      const result = await startDownload({
        participantId,
        projectId: resolvedProjectId,
        downloadConfig: config,
        lcUserId: user?.id ?? '',
        participantSnapshot: participantData,
      });

      setDownloadStatus(result.status);
      await refreshPending();
      onSuccess?.();
    } catch (err: any) {
      setDownloadError(err?.message ?? t('actions.downloadError'));
    } finally {
      setIsDownloading(false);
    }
  }, [needsOnboardingProject, projectId, onBoardedProjectId, selected, participantId, participantData, t, refreshPending, onSuccess]);

  // Build the result rows — deduplicate 'tasks' (bundled under project)
  const resultRows: Array<{ key: string; label: string; state: 'success' | 'failed' }> = [];
  if (downloadStatus) {
    const seen = new Set<string>();
    for (const key of [...downloadStatus.completedModules, ...downloadStatus.failedModules]) {
      if (key === 'tasks') continue; // bundled with project, don't show separately
      if (seen.has(key)) continue;
      seen.add(key);
      // Static keys resolve via MODULE_LABEL; dynamic "observation:task:<id>" keys fall back to the key itself
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
      onClose={onClose}
      headerContent={t('actions.downloadOffline')}
      headerIcon={<LucideIcon name="Download" size={20} color="$primary500" />}
      size="md"
      showCloseButton={!isDownloading}
    >
      <VStack space="lg">
        {/* Onboarding validation warning */}
        {needsOnboardingProject && (
          <HStack space="sm" alignItems="flex-start" bg="$warning100" p="$3" borderRadius="$md">
            <LucideIcon name="AlertTriangle" size={16} color="$warning600" />
            <Text fontSize="$sm" color="$warning800" flex={1}>
              {t('actions.downloadNeedsOnboardingProject')}
            </Text>
          </HStack>
        )}

        {/* ── RESULT STATE (success / partial / failed) ── */}
        {downloadDone ? (
          <VStack space="md">
            {/* Overall status header */}
            <HStack space="sm" alignItems="center">
              <LucideIcon
                name={downloadFailed ? 'XCircle' : downloadPartial ? 'AlertCircle' : 'CheckCircle2'}
                size={28}
                color={downloadFailed ? '$error500' : downloadPartial ? '$warning500' : '$success600'}
              />
              <Text
                fontSize="$md"
                fontWeight="$semibold"
                color={downloadFailed ? '$error600' : downloadPartial ? '$warning600' : '$success600'}
              >
                {downloadFailed
                  ? t('actions.downloadError')
                  : downloadPartial
                  ? t('actions.downloadPartial')
                  : t('actions.downloadSuccess')}
              </Text>
            </HStack>

            {/* Module result list */}
            {resultRows.length > 0 && (
              <VStack space="xs" pl="$1">
                {resultRows.map(({ key, label, state }) => (
                  <HStack key={key} space="sm" alignItems="center">
                    <LucideIcon
                      name={state === 'success' ? 'CheckCircle2' : 'XCircle'}
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
          <>
            <Text fontSize="$sm" color="$textMutedForeground">
              {t('actions.downloadHint')}
            </Text>

            {/* Module checkboxes */}
            <VStack space="sm">
              {options.map(opt => {
                if (!opt.enabled) return null;
                const isNested = !!opt.nested;

                if (isNested) {
                  const enabledNested = (opt.nested ?? []).filter(n => n.enabled);
                  if (enabledNested.length === 0) return null;
                  return (
                    <VStack key={opt.key} space="xs">
                      <Text fontSize="$sm" fontWeight="$semibold" color="$textPrimary">
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
                  );
                }

                return (
                  <CheckRow
                    key={opt.key as string}
                    labelKey={opt.labelKey}
                    checked={selected.has(opt.key as string)}
                    onToggle={() => toggleKey(opt.key as string)}
                    disabled={isDownloading}
                  />
                );
              })}
            </VStack>

            {/* Error message (config-level or thrown exception) */}
            {downloadError && (
              <HStack space="sm" alignItems="flex-start" bg="$error50" p="$3" borderRadius="$md">
                <LucideIcon name="AlertCircle" size={14} color="$error500" />
                <Text fontSize="$sm" color="$error600" flex={1}>{downloadError}</Text>
              </HStack>
            )}

            {/* Action buttons */}
            <HStack space="md" justifyContent="flex-end">
              <Button variant="outline" size="sm" onPress={onClose} isDisabled={isDownloading}>
                <ButtonText>{t('common.cancel')}</ButtonText>
              </Button>
              <Button
                variant="solid"
                size="sm"
                onPress={handleDownload}
                isDisabled={isDownloading || needsOnboardingProject || selected.size === 0}
              >
                {isDownloading ? (
                  <Spinner size="small" color="white" mr="$2" />
                ) : (
                  <ButtonIcon as={LucideIcon} name="Download" mr="$1" />
                )}
                <ButtonText>
                  {isDownloading ? t('common.loading') : t('actions.download')}
                </ButtonText>
              </Button>
            </HStack>
          </>
        )}
      </VStack>
    </Modal>
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
