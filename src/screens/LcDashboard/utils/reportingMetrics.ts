export interface LcDashboardOverviewData {
  coach: {
    id: number;
    name: string;
    site: string | null;
    province: string | null;
  };
  filters: {
    timeWindow: string;
    gender: string | null;
    pathway: string | null;
  };
  totalParticipants: number;
  lifecycleStatusBreakdown: Record<string, number>;
  genderBreakdown: Record<string, number>;
  pathwayBreakdown: Record<string, number>;
  graduation: {
    graduatedCount: number;
    graduationRate: number;
    readyToGraduateCount: number;
    nearReadyCount: number;
    notReadyCount: number;
  };
  idpTasks: {
    totalTasks: number;
    completedTasks: number;
  };
  formSubmissions: {
    totalMidlineSubmissions: number;
    totalEndlineSubmissions: number;
    totalIndividualVisits: number;
  };
  bigPush: {
    facilitatedCount: number;
    totalValue: number;
  };
  fastClimberCount: number;
  groupCheckinCount: number;
  computedAt: string;
}

export interface LcDashboardOverviewResponse {
  status: string;
  service: string;
  data: LcDashboardOverviewData;
  timestamp: string;
}

/** Looks up a breakdown value trying a few common key spellings (e.g. `in_progress` / `inProgress`). */
export const pickBreakdownValue = (
  breakdown: Record<string, number> | undefined,
  keys: string[],
): number | undefined => {
  if (!breakdown) return undefined;
  for (const key of keys) {
    if (typeof breakdown[key] === 'number') return breakdown[key];
  }
  return undefined;
};

export interface LcDashboardMetrics {
  totalCaseload?: number;
  activeParticipants?: number;
  graduated?: number;
  averageProgress?: string;
}

export const extractLcDashboardMetrics = (
  data: LcDashboardOverviewData | undefined,
): LcDashboardMetrics => {
  if (!data) return {};

  const activeParticipants = pickBreakdownValue(data.lifecycleStatusBreakdown, [
    'in_progress',
    'inProgress',
    'inprogress',
  ]);
  const { totalTasks, completedTasks } = data.idpTasks ?? ({} as LcDashboardOverviewData['idpTasks']);
  const averageProgress =
    totalTasks ? `${Math.round(((completedTasks ?? 0) / totalTasks) * 100)}%` : undefined;

  return {
    totalCaseload: data.totalParticipants,
    activeParticipants,
    graduated: data.graduation?.graduatedCount,
    averageProgress,
  };
};

export const displayMetric = (value: string | number | undefined): string | number => {
  if (value === undefined || value === null) return '—';
  return value;
};
