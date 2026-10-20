export interface OutcomeMetricValue {
  value: number | null;
  periodType: string;
  periodValue: string | null;
  visitDate: string | null;
  baselineValue: number | null;
  percentFromBaseline: number | null;
  label?: string;
  scaledValue?: number;
  baselineScaledValue?: number;
  components?: { key: string; numeric: number }[];
}

export interface ParticipantOutcomesData {
  participant: {
    id: string;
    gender: string;
    pathway: string;
    lifecycleStatus: string;
    coach: { id: number; name: string };
  };
  metrics: {
    currentMonthlyIncome: OutcomeMetricValue;
    currentSavings: OutcomeMetricValue;
    igaStatus: OutcomeMetricValue;
    selfEfficacyScore: OutcomeMetricValue;
    savingsFrequency: OutcomeMetricValue;
    savingsLocation: OutcomeMetricValue;
    recordKeeping: OutcomeMetricValue;
    debtStatus: OutcomeMetricValue;
  };
  selfEfficacyProgress: { baseline: number | null; midline: number | null; current: number | null };
  agencyAndControl: OutcomeMetricValue;
  trends: {
    income: TrendPoint[];
    savings: TrendPoint[];
  };
  incomeSourcesBreakdown: { key: string; numeric: number; percentOfTotal: number }[];
  computedAt: string;
}

export interface TrendPoint {
  periodType: string;
  periodValue: string | null;
  visitDate: string;
  value: number;
}

export interface ParticipantOutcomesResponse {
  status: string;
  service: string;
  data: ParticipantOutcomesData;
  timestamp: string;
}

export const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '—';
  return `R${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
};

export const formatPercentFromBaseline = (value: number | null | undefined): string | undefined => {
  if (value === null || value === undefined) return undefined;
  const sign = value > 0 ? '+' : '';
  return `${sign}${value}% from baseline`;
};

export const titleCase = (key: string): string =>
  key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export const formatTrendPointLabel = (point: TrendPoint): string => {
  if (point.periodType === 'baseline') return 'Baseline';
  if (point.periodValue) {
    const date = new Date(point.periodValue);
    if (!Number.isNaN(date.getTime())) {
      return `${MONTH_LABELS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
    }
  }
  return point.periodType;
};

export const sortTrendPoints = (points: TrendPoint[]): TrendPoint[] =>
  [...points].sort((a, b) => new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime());
