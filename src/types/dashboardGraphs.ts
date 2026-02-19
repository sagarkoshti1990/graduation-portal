import type { LineChartDataPoint } from '@components/charts/SimpleLineChart';
import type { BarChartDataPoint } from '@components/charts/SimpleBarChart';
import type { PieChartDataPoint } from '@components/charts/SimplePieChart';

export type DashboardGraphKind =
  | 'line'
  | 'bar'
  | 'pie'
  | 'placeholder'
  | 'reportSection'
  | 'groupHeader';

export interface DashboardGraphBlockBase {
  id: string;
  kind: DashboardGraphKind;
}

export interface DashboardGraphLineBlock extends DashboardGraphBlockBase {
  kind: 'line';
  title: string; // translation key
  description?: string; // translation key
  data: LineChartDataPoint[];
  color?: string;
  yAxisLabel?: string; // plain text
  valueLabel?: string; // plain text (tooltip label)
}

export interface DashboardGraphBarBlock extends DashboardGraphBlockBase {
  kind: 'bar';
  title: string; // translation key
  description?: string; // translation key
  data: BarChartDataPoint[];
  orientation?: 'vertical' | 'horizontal';
  height?: number;
}

export interface DashboardGraphPieBlock extends DashboardGraphBlockBase {
  kind: 'pie';
  title: string; // translation key
  description?: string; // translation key
  data: PieChartDataPoint[];
}

export interface DashboardGraphPlaceholderBlock extends DashboardGraphBlockBase {
  kind: 'placeholder';
  title?: string; // optional translation key
  placeholderTextKey?: string; // translation key
}

export interface DashboardGraphStatCard {
  id: string;
  title: string; // plain text (already formatted)
  value: string; // plain text
  subtitle?: string; // plain text
  valueColor?: string;
  badgeText?: string; // plain text
  badgeBg?: string;
  badgeTextColor?: string;
}

export interface DashboardGraphSectionChart {
  kind: 'line' | 'bar' | 'pie' | 'placeholder' | 'multiLine';
  title: string; // plain text
  line?: {
    data: LineChartDataPoint[];
    color?: string;
    yAxisLabel?: string;
    valueLabel?: string;
  };
  multiLine?: {
    yAxisLabel?: string;
    series: {
      id: string;
      label: string;
      color: string;
      dashArray?: string; // e.g. "4 4" (for cumulative dotted)
      data: { x: string; y: number }[];
    }[];
  };
  bar?: {
    data: BarChartDataPoint[];
    orientation?: 'vertical' | 'horizontal';
    height?: number;
  };
  pie?: {
    data: PieChartDataPoint[];
  };
  placeholderText?: string;
}

export interface DashboardGraphReportSectionBlock extends DashboardGraphBlockBase {
  kind: 'reportSection';
  sectionTitle: string; // translation key
  sectionMeta?: string; // translation key
  statLayout?: 'cards' | 'bar';
  statBarBg?: string;
  statPosition?: 'top' | 'bottom';
  statCards?: DashboardGraphStatCard[];
  chart: DashboardGraphSectionChart; // backward compat (single chart)
  charts?: DashboardGraphSectionChart[]; // optional (multiple charts)
  extras?: DashboardGraphExtraBlock[]; // optional (tables/highlights/bullets)
}

export interface DashboardGraphGroupHeaderBlock extends DashboardGraphBlockBase {
  kind: 'groupHeader';
  title: string; // translation key
  bg?: string;
  textColor?: string;
}

export type DashboardGraphExtraPlacement = 'top' | 'bottom';

export type DashboardGraphExtraKind =
  | 'kpiRow'
  | 'kvColumns'
  | 'calloutRow'
  | 'bullets'
  | 'tiles';

export interface DashboardGraphExtraBase {
  id: string;
  kind: DashboardGraphExtraKind;
  placement?: DashboardGraphExtraPlacement;
}

export interface DashboardGraphExtraKpiRow extends DashboardGraphExtraBase {
  kind: 'kpiRow';
  title?: string; // plain text
  bg?: string;
  items: Array<{
    id: string;
    label: string; // plain text
    value: string; // plain text
    valueColor?: string;
    subValue?: string; // plain text
  }>;
}

export interface DashboardGraphExtraKvColumns extends DashboardGraphExtraBase {
  kind: 'kvColumns';
  columns: Array<{
    id: string;
    title: string; // plain text
    items: Array<{
      id: string;
      label: string; // plain text
      value: string; // plain text
      valueColor?: string;
    }>;
  }>;
}

export interface DashboardGraphExtraCalloutRow extends DashboardGraphExtraBase {
  kind: 'calloutRow';
  title: string; // plain text
  bg?: string;
  items: Array<{
    id: string;
    label: string; // plain text
    value: string; // plain text
    valueColor?: string;
    subtitle?: string; // plain text
    subtitleColor?: string;
  }>;
}

export interface DashboardGraphExtraBullets extends DashboardGraphExtraBase {
  kind: 'bullets';
  title?: string; // plain text
  items: Array<{
    id: string;
    text: string; // plain text
    dotColor?: string;
  }>;
}

export interface DashboardGraphExtraTiles extends DashboardGraphExtraBase {
  kind: 'tiles';
  title?: string; // plain text
  items: Array<{
    id: string;
    title: string; // plain text
    value: string; // plain text
    subtitle?: string; // plain text
    valueColor?: string;
    bg?: string;
    borderColor?: string;
  }>;
}

export type DashboardGraphExtraBlock =
  | DashboardGraphExtraKpiRow
  | DashboardGraphExtraKvColumns
  | DashboardGraphExtraCalloutRow
  | DashboardGraphExtraBullets
  | DashboardGraphExtraTiles;

export type DashboardGraphBlock =
  | DashboardGraphLineBlock
  | DashboardGraphBarBlock
  | DashboardGraphPieBlock
  | DashboardGraphPlaceholderBlock
  | DashboardGraphReportSectionBlock
  | DashboardGraphGroupHeaderBlock;

