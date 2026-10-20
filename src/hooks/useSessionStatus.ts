import { useMemo } from 'react';
import { SESSION_STATUS, SESSION_STATUS_LABEL } from '@constants/SUPPORT_PROVIDER_CARDS';

interface SessionStatusItem {
  status?: string;
  start_date?: string | number;
  end_date?: string | number;
}

const toMs = (value: string | number): number =>
  typeof value === 'number' || !isNaN(Number(value))
    ? Number(value) * 1000
    : new Date(value).getTime();

// Normalizes a raw backend status (DRAFT / PUBLISHED / LIVE / COMPLETED / CANCELLED)
// plus start/end dates into the human-facing status label shown on session/service cards.
export const deriveStatusLabel = (item: SessionStatusItem): string => {
  const rawStatus = item?.status || '';
  const thisStatus = String(rawStatus).toUpperCase();

  if (thisStatus === SESSION_STATUS.CANCELLED) {
    return SESSION_STATUS_LABEL.CANCELLED;
  }
  if (thisStatus === SESSION_STATUS.DRAFT) {
    return SESSION_STATUS_LABEL.DRAFT;
  }
  if (thisStatus === SESSION_STATUS.COMPLETED) {
    return SESSION_STATUS_LABEL.COMPLETED;
  }

  if (item?.start_date) {
    const startMs = toMs(item.start_date);
    const endMs = item.end_date !== undefined ? toMs(item.end_date) : undefined;
    const nowMs = Date.now();

    if (endMs !== undefined && nowMs > endMs) {
      return SESSION_STATUS_LABEL.COMPLETED;
    }
    if (nowMs < startMs) {
      return SESSION_STATUS_LABEL.UPCOMING;
    }
    return SESSION_STATUS_LABEL.IN_PROGRESS;
  }

  if (thisStatus === SESSION_STATUS.LIVE) {
    return SESSION_STATUS_LABEL.IN_PROGRESS;
  }
  if (thisStatus === SESSION_STATUS.PUBLISHED) {
    return SESSION_STATUS_LABEL.UPCOMING;
  }

  return rawStatus || SESSION_STATUS_LABEL.UPCOMING;
};

export function useSessionStatus(item: SessionStatusItem, statusOverride?: string | null) {
  return useMemo(() => {
    const statusTag = statusOverride || deriveStatusLabel(item);

    return {
      statusTag,
      isDraft: statusTag === SESSION_STATUS_LABEL.DRAFT,
      isUpcoming: statusTag === SESSION_STATUS_LABEL.UPCOMING,
      isInProgress: statusTag === SESSION_STATUS_LABEL.IN_PROGRESS,
      isCompleted: statusTag === SESSION_STATUS_LABEL.COMPLETED,
      isCancelled: statusTag === SESSION_STATUS_LABEL.CANCELLED,
    };
  }, [item?.status, item?.start_date, item?.end_date, statusOverride]);
}

interface RequesterInfoItem {
  mentor_name?: string;
  organization?: string | { name?: string };
  meta?: {
    mentor_name?: string;
    organization?: string | { name?: string };
  };
}

export function useRequesterInfo(item: RequesterInfoItem) {
  return useMemo(() => {
    const requesterName = item?.mentor_name || item?.meta?.mentor_name;
    const org = item?.organization || item?.meta?.organization;
    const requesterOrgName = typeof org === 'object' ? org?.name : org;

    return { requesterName, requesterOrgName };
  }, [item?.mentor_name, item?.meta?.mentor_name, item?.organization, item?.meta?.organization]);
}
