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
  kind: 'line' | 'bar' | 'pie' | 'placeholder' | 'multiLine' | 'groupedBar';
  title: string; // plain text
  subtitle?: string; // plain text
  line?: {
    data: LineChartDataPoint[];
    color?: string;
    yAxisLabel?: string;
    valueLabel?: string;
    showLegend?: boolean;
    hideLine?: boolean;
    yMin?: number;
    yMax?: number;
    threshold?: number;
    thresholdPointColor?: string;
    referenceLines?: Array<{
      value: number;
      color: string;
      label?: string;
      dashArray?: string;
    }>;
  };
  multiLine?: {
    yAxisLabel?: string;
    yMin?: number;
    yMax?: number;
    rightYAxisLabel?: string;
    series: {
      id: string;
      label: string;
      color: string;
      dashArray?: string; // e.g. "4 4" (for cumulative dotted)
      axis?: 'left' | 'right';
      hidden?: boolean;
      data: { x: string; y: number }[];
    }[];
  };
  bar?: {
    data: BarChartDataPoint[];
    orientation?: 'vertical' | 'horizontal';
    height?: number;
    variant?: 'standard' | 'progress';
    showAxes?: boolean;
    showGrid?: boolean;
    showLegend?: boolean;
    valueFormat?: 'number' | 'currencyM' | 'countPercent';
  };
  groupedBar?: {
    categories: string[];
    height?: number;
    series: Array<{
      id: string;
      label: string;
      color: string;
      axis?: 'left' | 'right';
      data: number[];
    }>;
  };
  pie?: {
    data: PieChartDataPoint[];
    variant?: 'pie' | 'donut';
    showLabels?: boolean;
    showLegend?: boolean;
  };
  placeholderText?: string;
}

export interface DashboardGraphReportSectionVariant {
  statLayout?: 'cards' | 'bar';
  statBarBg?: string;
  statPosition?: 'top' | 'bottom';
  statCards?: DashboardGraphStatCard[];
  chartLayout?: 'single' | 'twoColumn';
  chart?: DashboardGraphSectionChart | null;
  charts?: DashboardGraphSectionChart[];
  extras?: DashboardGraphExtraBlock[];
}

export interface DashboardGraphReportSectionBlock extends DashboardGraphBlockBase {
  kind: 'reportSection';
  sectionTitle: string; // translation key
  sectionMeta?: string; // translation key
  headerToggle?: {
    labelKey: string; // translation key
    defaultValue?: boolean;
  };
  trend?: DashboardGraphReportSectionVariant;
  summary?: DashboardGraphReportSectionVariant;
  statLayout?: 'cards' | 'bar';
  statBarBg?: string;
  statPosition?: 'top' | 'bottom';
  statCards?: DashboardGraphStatCard[];
  chartLayout?: 'single' | 'twoColumn';
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
  | 'tiles'
  | 'dataTable'
  | 'note';

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
    badgeText?: string; // plain text
    badgeBg?: string;
    badgeTextColor?: string;
    align?: 'left' | 'center';
    valueColor?: string;
    bg?: string;
    borderColor?: string;
  }>;
}

export interface DashboardGraphExtraDataTable extends DashboardGraphExtraBase {
  kind: 'dataTable';
  title?: string; // plain text
  minWidth?: number;
  showHeader?: boolean;
  columns: Array<{
    key: string;
    label: string; // plain text (or translation key; if missing, shows as-is)
    flex?: number;
    width?: number;
    align?: 'left' | 'center' | 'right';
  }>;
  rows: Array<Record<string, string | number>>;
}

export interface DashboardGraphExtraNote extends DashboardGraphExtraBase {
  kind: 'note';
  title?: string; // plain text
  text: string; // plain text
}

export type DashboardGraphExtraBlock =
  | DashboardGraphExtraKpiRow
  | DashboardGraphExtraKvColumns
  | DashboardGraphExtraCalloutRow
  | DashboardGraphExtraBullets
  | DashboardGraphExtraTiles
  | DashboardGraphExtraDataTable
  | DashboardGraphExtraNote;

export type DashboardGraphBlock =
  | DashboardGraphLineBlock
  | DashboardGraphBarBlock
  | DashboardGraphPieBlock
  | DashboardGraphPlaceholderBlock
  | DashboardGraphReportSectionBlock
  | DashboardGraphGroupHeaderBlock;

