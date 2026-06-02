import React, { useEffect, useState } from 'react';
import { HStack, Text, Spinner } from '@ui';
import { LucideIcon } from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import { getDownloadStatus } from '../../services/downloadService';
import type { DownloadStatus } from '@app-types/offline';

interface OfflineBadgeProps {
  participantId: string;
  /** Re-check when this value changes (e.g. after a new download completes) */
  refreshKey?: number;
  size?: 'xs' | 'sm';
}

type BadgeState = 'none' | 'downloading' | 'available' | 'partial' | 'failed';

function resolveBadgeState(status: DownloadStatus | null): BadgeState {
  if (!status) return 'none';
  switch (status.status) {
    case 'completed':   return 'available';
    case 'partial':     return 'partial';
    case 'in_progress': return 'downloading';
    case 'failed':      return 'failed';
    default:            return 'none';
  }
}

const BADGE_CONFIG: Record<
  Exclude<BadgeState, 'none' | 'downloading'>,
  { icon: string; bgColor: string; textColor: string; iconColor: string; labelKey: string }
> = {
  available: {
    icon: 'WifiOff',
    bgColor: '$success100',
    textColor: '$success700',
    iconColor: '$success600',
    labelKey: 'offlineSync.available',
  },
  partial: {
    icon: 'AlertCircle',
    bgColor: '$warning100',
    textColor: '$warning700',
    iconColor: '$warning600',
    labelKey: 'offlineSync.partial',
  },
  failed: {
    icon: 'WifiOff',
    bgColor: '$error100',
    textColor: '$error700',
    iconColor: '$error600',
    labelKey: 'offlineSync.downloadFailed',
  },
};

/**
 * Small badge showing whether a participant's data has been downloaded for
 * offline use. Shows an icon + translated text label.
 * Reads download status asynchronously on mount and whenever `refreshKey` changes.
 */
const OfflineBadge: React.FC<OfflineBadgeProps> = ({ participantId, refreshKey, size = 'xs' }) => {
  const { t } = useLanguage();
  const [badgeState, setBadgeState] = useState<BadgeState>('none');
  const iconSize = size === 'xs' ? 10 : 12;
  const fontSize = size === 'xs' ? '$2xs' : '$xs';

  useEffect(() => {
    let cancelled = false;
    getDownloadStatus(participantId)
      .then(status => {
        if (!cancelled) setBadgeState(resolveBadgeState(status));
      })
      .catch(() => {
        if (!cancelled) setBadgeState('none');
      });
    return () => { cancelled = true; };
  }, [participantId, refreshKey]);

  if (badgeState === 'none') return null;

  if (badgeState === 'downloading') {
    return (
      <HStack
        space="xs"
        alignItems="center"
        bg="$info100"
        px="$1"
        py="$0.5"
        borderRadius="$sm"
      >
        <Spinner size="small" color="$info600" />
        <Text fontSize={fontSize} color="$info700">
          {t('offlineSync.downloading')}
        </Text>
      </HStack>
    );
  }

  const cfg = BADGE_CONFIG[badgeState as Exclude<BadgeState, 'none' | 'downloading'>];

  return (
    <HStack
      space="xs"
      alignItems="center"
      bg={cfg.bgColor}
      px="$1"
      py="$0.5"
      borderRadius="$sm"
    >
      <LucideIcon name={cfg.icon as any} size={iconSize} color={cfg.iconColor} />
      <Text fontSize={fontSize} color={cfg.textColor}>
        {t(cfg.labelKey)}
      </Text>
    </HStack>
  );
};

export default OfflineBadge;
