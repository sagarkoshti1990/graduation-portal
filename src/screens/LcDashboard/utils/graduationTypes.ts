export type IndicatorStatus = 'achieved' | 'on_track' | 'at_risk' | 'not_computable';
export type PillarKey = 'livelihoods' | 'financialInclusion' | 'socialEmpowerment' | 'gender';

export interface IndicatorCountBreakdown {
  achieved: number;
  onTrack: number;
  atRisk: number;
  notComputable: number;
}

/** Coach-level aggregate: GET /lc-dashboard/graduation-overview?coachId=... */
export interface GraduationOverviewData {
  coach: { id: number; name: string };
  totalParticipants: number;
  coachWorkload: number;
  exitDistribution: {
    graduated: number;
    completed_below_threshold: number;
    dropped_off: number;
  };
  graduationRate: number | null;
  graduationTimeline: unknown[];
  readiness: {
    readyToGraduateCount: number;
    nearReadyCount: number;
    notReadyCount: number;
  };
  indicatorDistribution: Record<string, IndicatorCountBreakdown>;
  computedAt: string;
}

export interface GraduationOverviewResponse {
  status: string;
  service: string;
  data: GraduationOverviewData;
  timestamp: string;
}

/** Participant-level detail: GET /lc-dashboard/graduation-readiness?participantId=... */
export interface GraduationIndicatorDetail {
  key: string;
  code: string;
  pillar: PillarKey;
  pathway: 'both' | 'entrepreneurship' | 'employment';
  achieveText: string;
  status: IndicatorStatus;
  value: number | null;
  progress?: number;
  reason?: string;
  periodType: string | null;
  visitDate: string | null;
}

export interface GraduationReadinessData {
  participant: {
    id: string;
    gender: string;
    pathway: string;
    lifecycleStatus: string;
    coach: { id: number; name: string };
  };
  summary: {
    achievedCount: number;
    onTrackCount: number;
    atRiskCount: number;
    notComputableCount: number;
    totalIndicators: number;
    readinessBand: 'ready_to_graduate' | 'near_ready' | 'not_ready';
    gateStatus: 'met' | 'not_met';
    gateBlockedBy: string[];
    pillars: Record<PillarKey, IndicatorCountBreakdown>;
  };
  indicators: GraduationIndicatorDetail[];
  computedAt: string;
}

export interface GraduationReadinessResponse {
  status: string;
  service: string;
  data: GraduationReadinessData;
  timestamp: string;
}

/** Static indicator metadata — mirrors the program's fixed 12-indicator / 4-pillar definition. */
export const INDICATOR_CONFIG: Record<string, { name: string; pillar: PillarKey; icon: string }> = {
  activeIga: { name: 'Active Income Generating Activity', pillar: 'livelihoods', icon: 'Briefcase' },
  businessProfitability: { name: 'Business Profitability', pillar: 'livelihoods', icon: 'TrendingUp' },
  participantIncome: { name: 'Participant Income', pillar: 'livelihoods', icon: 'DollarSign' },
  assetAccumulation: { name: 'Asset Accumulation', pillar: 'livelihoods', icon: 'Award' },
  savingsAmount: { name: 'Savings Amount', pillar: 'financialInclusion', icon: 'CreditCard' },
  savingsFrequency: { name: 'Savings Frequency', pillar: 'financialInclusion', icon: 'Clock' },
  recordKeeping: { name: 'Financial Record Keeping', pillar: 'financialInclusion', icon: 'ClipboardList' },
  responsibleCreditUsage: { name: 'Responsible Credit Usage', pillar: 'financialInclusion', icon: 'ShieldCheck' },
  selfEsteemConfidence: { name: 'Self-Esteem & Confidence', pillar: 'socialEmpowerment', icon: 'Heart' },
  agencyControl: { name: 'Agency & Control', pillar: 'socialEmpowerment', icon: 'UserCheck' },
  attitudesViolence: { name: 'Attitudes Toward Violence (GBV)', pillar: 'gender', icon: 'AlertTriangle' },
  decisionMakingGender: { name: 'Decision-Making & Gender Equality', pillar: 'gender', icon: 'Users' },
};

export const PILLAR_ORDER: PillarKey[] = ['livelihoods', 'financialInclusion', 'socialEmpowerment', 'gender'];

export const PILLAR_LABELS: Record<PillarKey, string> = {
  livelihoods: 'Livelihoods',
  financialInclusion: 'Financial Inclusion',
  socialEmpowerment: 'Social Empowerment',
  gender: 'Gender Equality',
};

export const STATUS_STYLES: Record<IndicatorStatus, { label: string; bg: string; text: string; border: string; icon: string }> = {
  achieved: { label: 'Achieved', bg: '$success50', text: '$success700', border: '$success200', icon: 'CheckCircle2' },
  on_track: { label: 'On Track', bg: '$warning50', text: '$warningIconColor', border: '$warning200', icon: 'Clock' },
  at_risk: { label: 'At Risk', bg: '$error50', text: '$error700', border: '$error200', icon: 'AlertTriangle' },
  not_computable: { label: 'Not Computable', bg: '$backgroundLight100', text: '$textMutedForeground', border: '$borderColor', icon: 'HelpCircle' },
};

export const READINESS_BAND_LABELS: Record<GraduationReadinessData['summary']['readinessBand'], string> = {
  ready_to_graduate: 'Ready to Graduate',
  near_ready: 'Near Ready',
  not_ready: 'Not Ready',
};

export const sumBreakdown = (breakdown: IndicatorCountBreakdown): number =>
  breakdown.achieved + breakdown.onTrack + breakdown.atRisk + breakdown.notComputable;
