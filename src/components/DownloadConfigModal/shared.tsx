/**
 * Shared pieces of the single-participant download UI (DownloadConfigModal)
 * that BulkDownloadModal also needs — kept in one place so both modals stay
 * in sync with the same module list, order, and progress-row rendering.
 */
import React from 'react';
import { HStack, Text, Box, Pressable, Spinner } from '@ui';
import { LucideIcon } from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import type { DownloadModuleKey } from '@app-types/offline';

export type StepState = 'pending' | 'loading' | 'completed' | 'failed';

// Maps every DownloadModuleKey to its i18n label key
export const MODULE_LABEL: Record<DownloadModuleKey, string> = {
  onboarding:                   'actions.downloadOnboarding',
  participant:                  'actions.downloadParticipant',
  project:                      'actions.downloadProject',
  tasks:                        'actions.downloadProject',
  'observation:logVisit':       'actions.downloadLogVisit',
  'observation:householdProfile':'actions.downloadHouseholdProfile',
  'observation:individualVisit':'actions.downloadIndividualVisit',
  'observation:midline':        'actions.downloadMidline',
  // 'observation:interventionPlan':'actions.downloadInterventionPlan',
  // 'observation:endline':        'actions.downloadEndline',
};

// Download order matches the pipeline in downloadService.
// 'onboarding' is always first when present (automatic, not user-selected).
export const DOWNLOAD_ORDER: DownloadModuleKey[] = [
  'onboarding',
  'participant',
  'project',
  'observation:logVisit',
  'observation:householdProfile',
  'observation:individualVisit',
  'observation:midline',
  // 'observation:interventionPlan',
  // 'observation:endline',
];

/**
 * Build the ordered step keys that will actually appear in the progress UI.
 * `needsOnboarding` includes the automatic 'onboarding' step (not user-selected).
 */
export function buildStepKeys(selected: Set<string>, needsOnboarding: boolean): DownloadModuleKey[] {
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

// ---------------------------------------------------------------------------
// Step row — shows PENDING / LOADING / COMPLETED / FAILED state per module
// ---------------------------------------------------------------------------

export interface StepRowProps {
  labelKey: string;
  state: StepState;
  hideIcon?: boolean
}

export const StepRow: React.FC<StepRowProps> = ({ labelKey, state, hideIcon }) => {
  const { t } = useLanguage();

  const icon = !hideIcon
    ? <LucideIcon name="CircleDot" size={16} color="$primary500" />
    : state === 'completed'
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
    <HStack space={"sm"} alignItems="center" py="$0.5">
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
export interface CheckRowProps {
  labelKey: string;
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
  indented?: boolean;
}

export const CheckRow: React.FC<CheckRowProps> = ({ labelKey, checked, onToggle, disabled, indented }) => {
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
