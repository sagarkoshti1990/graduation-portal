import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import {
  VStack,
  HStack,
  Box,
  Button,
  ButtonText,
  ButtonIcon,
  Text,
  Spinner,
  Input,
  InputField,
  Pressable,
  useAlert,
} from '@ui';
import { LucideIcon } from '@ui/index';
import TitleHeader from '@components/TitleHeader';
import FilterButton from '@components/Filter';
import Select from '@components/ui/Inputs/Select';
import { useAuth, useIsTenantAdmin } from '@contexts/AuthContext';
import { useProfileCompletion } from '@hooks';
import { getProvincesList, getSitesByProvince } from '../../services/usersService';
import { MentoringOption, getMentoringEntities } from '../../services/mentoringService';
import { SUPPORT_OFFERING_TYPE_VALUES } from '@constants/SUPPORT_PROVIDER_CARDS';
import {
  getSupportDashboardSummary,
  getSupportDashboardByMentor,
  getSupportDashboardAssets,
  getSupportTypeOptions,
  getSupportTypeOptionsWithExclusion,
  getPillarOptions,
  getProviderOptions,
  COMMITMENT_FIELD_BY_SUPPORT_TYPE,
  recordInterventionCommitment,
  SupportDashboardSummary,
  ByMentorRow,
  AssetsSummary,
  ProviderOption,
} from '../../services/supportDashboardService';
import { getTrainingSessions, getAssets } from '../../services/SupportOfferingsServices/supportOfferingsService';
import type { AssetItem } from '../../types/supportOfferingsTypes';
import {
  DeliveryStatusCard,
  FulfillmentByProvince,
  UpcomingSessions,
  AssetFundPool,
  PublishedAssetsTable,
} from './MentorSections';
import styles, { BAR_COLORS } from './styles';

const ALL = 'all';

// FilterButton treats an 'all-' prefixed first option as the selectable default, so the user can return to "All"
const withAll = (attr: string, label: string, options: { value: string; label: string }[]) => [
  { value: `all-${attr}`, label },
  ...options,
];

const humanize = (value: string) =>
  value.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const Bar = ({ value, max, color }: { value: number; max: number; color: string }) => (
  <Box {...styles.barTrack}>
    <Box height="$full" bg={color} width={`${max > 0 ? (value / max) * 100 : 0}%`} />
  </Box>
);

const percent = (part?: number, whole?: number) =>
  part === undefined || !whole ? null : Math.round((part / whole) * 100);

const COLUMN_MIN_WIDTH = 90;
const CATEGORY_MIN_WIDTH = 150;

type SummaryRow = Omit<SupportDashboardSummary['totals'], 'committed_sessions' | 'committed_services' | 'committed_assets'>;

// Committed per support type comes from the summary totals, sessions for trainings and services for additional services
const committedForType = (type: string, totals?: SupportDashboardSummary['totals']) => {
  if (type === SUPPORT_OFFERING_TYPE_VALUES.TRAINING_SESSION) return totals?.committed_sessions;
  if (type === SUPPORT_OFFERING_TYPE_VALUES.ADDITIONAL_SERVICE) return totals?.committed_services;
  return undefined;
};

const SupportTypeTable = ({
  rows,
  totals,
  committedTotal,
  labelFor,
}: {
  rows: SupportDashboardSummary['by_support_offering_type'];
  totals?: SupportDashboardSummary['totals'];
  committedTotal: number;
  labelFor: (value: string) => string;
}) => {
  const { t } = useTranslation();
  const headers = [
    t('supportProviderDashboard.needed', 'Needed'),
    t('supportProviderDashboard.committed', 'Committed'),
    t('supportProviderDashboard.approved', 'Approved'),
    t('supportProviderDashboard.delivered', 'Delivered'),
    t('supportProviderDashboard.coverage', 'Coverage'),
    t('supportProviderDashboard.deliveryRate', 'Delivery Rate'),
  ];

  const renderRow = (key: string, label: string, row: SummaryRow, bold = false) => {
    const weight = bold ? '$bold' : '$normal';
    // Coverage and Delivery Rate depend on committed, so they stay blank until the API returns it
    const coverage = percent(row.committed, row.needed);
    const deliveryRate = percent(row.delivered, row.committed);
    const surplus = coverage !== null && coverage > 100 ? coverage - 100 : null;
    const cells: { value: string | number; note?: string }[] = [
      { value: row.needed },
      { value: row.committed ?? '–' },
      { value: row.approved },
      { value: row.delivered },
      {
        value: coverage === null ? '–' : `${Math.min(coverage, 100)}%`,
        note: surplus !== null ? `(+${surplus}% ${t('supportProviderDashboard.surplus', 'Surplus')})` : undefined,
      },
      { value: deliveryRate === null ? '–' : `${deliveryRate}%` },
    ];
    return (
      <HStack key={key} alignItems="center" py="$2.5" borderTopWidth={1} borderColor="$borderLight200" bg={bold ? '$backgroundLight50' : undefined}>
        <Text flex={2} minWidth={CATEGORY_MIN_WIDTH} fontSize={13} fontWeight="$semibold">{label}</Text>
        {cells.map((cell, i) => (
          <VStack key={i} flex={1} minWidth={COLUMN_MIN_WIDTH} alignItems="center">
            <Text fontSize={13} fontWeight={weight}>{cell.value}</Text>
            {cell.note ? <Text fontSize={11} color="$textMutedForeground">{cell.note}</Text> : null}
          </VStack>
        ))}
      </HStack>
    );
  };

  return (
    <VStack>
      <Text fontSize={12} color="$textMutedForeground" mb="$1">
        {t('supportProviderDashboard.formulas', 'Formulas: Coverage = (Committed / Needed) × 100% · Delivery Rate = (Delivered / Committed) × 100%')}
      </Text>
      <Text fontSize={12} color="$textMutedForeground" mb="$3">
        {t('supportProviderDashboard.targets', 'Coverage Target: 100% · Delivery Rate Target: 100%')}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        <VStack flex={1} minWidth={CATEGORY_MIN_WIDTH * 2 + COLUMN_MIN_WIDTH * headers.length}>
          <HStack py="$2">
            <Text flex={2} minWidth={CATEGORY_MIN_WIDTH} fontSize={12} fontWeight="$bold" color="$textMutedForeground">
              {t('supportProviderDashboard.supportCategory', 'Support Category')}
            </Text>
            {headers.map((h) => (
              <Text key={h} flex={1} minWidth={COLUMN_MIN_WIDTH} textAlign="center" fontSize={12} fontWeight="$bold" color="$textMutedForeground">{h}</Text>
            ))}
          </HStack>
          {rows.map((row) =>
            renderRow(row.support_offering_type, labelFor(row.support_offering_type), {
              ...row,
              committed: committedForType(row.support_offering_type, totals) ?? row.committed,
            }),
          )}
          {totals ? renderRow('total', t('supportProviderDashboard.cumulativeTotal', 'Cumulative Total'), { ...totals, committed: committedTotal }, true) : null}
        </VStack>
      </ScrollView>
    </VStack>
  );
};

const CHART_HEIGHT = 180;
const MONTH_COLUMN_WIDTH = 64;
const Y_TICKS = 4;

// Rounds the max up so the Y axis ticks land on whole numbers
const niceMax = (max: number) => {
  const step = Math.max(1, Math.ceil(max / Y_TICKS));
  return step * Y_TICKS;
};

const MonthlyBarChart = ({ rows }: { rows: SupportDashboardSummary['monthly'] }) => {
  const top = niceMax(Math.max(0, ...rows.map((r) => Math.max(r.approved, r.delivered))));
  const ticks = Array.from({ length: Y_TICKS + 1 }, (_, i) => (top / Y_TICKS) * (Y_TICKS - i));

  return (
    <HStack>
      <VStack height={CHART_HEIGHT} justifyContent="space-between" pr="$2" alignItems="flex-end">
        {ticks.map((tick) => (
          <Text key={tick} fontSize={11} color="$textMutedForeground">{tick}</Text>
        ))}
      </VStack>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <VStack>
          <HStack
            height={CHART_HEIGHT}
            alignItems="flex-end"
            borderLeftWidth={1}
            borderBottomWidth={1}
            borderColor="$borderLight300"
          >
            {rows.map((row) => (
              <HStack key={row.month} width={MONTH_COLUMN_WIDTH} height="$full" alignItems="flex-end" justifyContent="center" gap="$1">
                {(['approved', 'delivered'] as const).map((k) => (
                  <VStack key={k} alignItems="center" justifyContent="flex-end" height="$full">
                    <Text fontSize={10} color="$textMutedForeground">{row[k]}</Text>
                    <Box width={18} height={(row[k] / top) * (CHART_HEIGHT - 16)} bg={BAR_COLORS[k]} borderTopLeftRadius="$sm" borderTopRightRadius="$sm" />
                  </VStack>
                ))}
              </HStack>
            ))}
          </HStack>
          <HStack>
            {rows.map((row) => (
              <Text key={row.month} width={MONTH_COLUMN_WIDTH} textAlign="center" fontSize={11} color="$textMutedForeground" mt="$1">
                {row.month}
              </Text>
            ))}
          </HStack>
        </VStack>
      </ScrollView>
    </HStack>
  );
};

const StatCard = ({ label, value, color, note }: { label: string; value: number | string; color: string; note?: string }) => (
  <VStack {...styles.statCard} borderTopWidth={3} borderTopColor={color}>
    <Text {...styles.statLabel}>{label}</Text>
    <Text {...styles.statValue}>{value}</Text>
    {note ? <Text fontSize={11} color="$textMutedForeground">{note}</Text> : null}
  </VStack>
);

const SectionHeader = ({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) => (
  <VStack>
    <HStack {...styles.sectionTitleRow}>
      <LucideIcon name={icon} {...styles.sectionIcon} />
      <Text {...styles.sectionTitle}>{title}</Text>
    </HStack>
    <Text {...styles.sectionSubtitle}>{subtitle}</Text>
  </VStack>
);

const FilterField = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <VStack {...styles.filterCol}>
    <Text {...styles.label}>{label}</Text>
    {children}
  </VStack>
);

const PROVIDER_CHART_HEIGHT = 220;
const PROVIDER_GROUP_WIDTH = 88;
const PROVIDER_BAR_WIDTH = 18;

const PROVIDER_METRICS: { key: 'committed' | 'delivered'; color: string; label: string }[] = [
  { key: 'committed', color: BAR_COLORS.committed, label: 'Committed' },
  { key: 'delivered', color: BAR_COLORS.delivered, label: 'Delivered' },
];

// Slim type consumed by the chart — committed and delivered are pre-computed sums
// (sessions + services only; assets are shown in the separate Assets tab)
type ProviderChartRow = { mentor_id: string; committed: number; delivered: number };

const abbreviateName = (name: string, max = 15) =>
  name.length > max ? name.slice(0, max - 1) + '…' : name;

const ProviderBarChart = ({
  rows,
  providers,
}: {
  rows: ProviderChartRow[];
  providers: ProviderOption[];
}) => {
  const { t } = useTranslation();

  const labelFor = (mentorId: string) =>
    abbreviateName(providers.find((p) => p.value === mentorId)?.label || mentorId);

  const maxVal = Math.max(1, ...rows.flatMap((r) => [r.committed, r.delivered]));
  const top = niceMax(maxVal);
  const ticks = Array.from({ length: Y_TICKS + 1 }, (_, i) => (top / Y_TICKS) * (Y_TICKS - i));
  const barH = (val: number) => Math.max(2, (val / top) * (PROVIDER_CHART_HEIGHT - 20));

  return (
    <VStack>
      {/* Legend */}
      <HStack {...styles.legendRow}>
        {PROVIDER_METRICS.map(({ key, color, label }) => (
          <HStack key={key} {...styles.legendItem}>
            <Box {...styles.legendDot} bg={color} />
            <Text {...styles.legendText}>{t(`supportProviderDashboard.${key}`, label)}</Text>
          </HStack>
        ))}
      </HStack>

      <HStack>
        {/* Y-axis ticks */}
        <VStack width={36} height={PROVIDER_CHART_HEIGHT} justifyContent="space-between" alignItems="flex-end" pr="$1">
          {ticks.map((tick) => (
            <Text key={tick} fontSize={10} color="$textMutedForeground">{tick}</Text>
          ))}
        </VStack>

        {/* Bars + provider name labels */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <VStack>
            <HStack
              height={PROVIDER_CHART_HEIGHT}
              alignItems="flex-end"
              borderLeftWidth={1}
              borderBottomWidth={1}
              borderColor="$borderLight300"
            >
              {rows.map((row) => (
                <HStack
                  key={row.mentor_id}
                  width={PROVIDER_GROUP_WIDTH}
                  height="$full"
                  alignItems="flex-end"
                  justifyContent="center"
                  gap="$1"
                  px="$1"
                >
                  {PROVIDER_METRICS.map(({ key, color }) => (
                    <VStack key={key} alignItems="center" justifyContent="flex-end" height="$full">
                      <Text fontSize={9} color="$textMutedForeground" mb="$0.5">{row[key]}</Text>
                      <Box
                        width={PROVIDER_BAR_WIDTH}
                        height={barH(row[key])}
                        bg={color}
                        borderTopLeftRadius="$sm"
                        borderTopRightRadius="$sm"
                      />
                    </VStack>
                  ))}
                </HStack>
              ))}
            </HStack>

            {/* X-axis: provider name labels */}
            <HStack mt="$1">
              {rows.map((row) => (
                <Text
                  key={row.mentor_id}
                  width={PROVIDER_GROUP_WIDTH}
                  textAlign="center"
                  fontSize={10}
                  color="$textMutedForeground"
                  numberOfLines={2}
                >
                  {labelFor(row.mentor_id)}
                </Text>
              ))}
            </HStack>
          </VStack>
        </ScrollView>
      </HStack>
    </VStack>
  );
};

const ASSET_COL_W = 90;
const ASSET_TITLE_W = 160;

const AssetsTable = ({
  summary,
  onLoadMore,
  loadingMore,
}: {
  summary: AssetsSummary;
  onLoadMore: () => void;
  loadingMore: boolean;
}) => {
  const { t } = useTranslation();
  const hasMore = summary.data.length < summary.count;

  return (
    <VStack>
      {/* Asset valuation summary */}
      <HStack flexWrap="wrap" gap="$4" mb="$4">
        <VStack {...styles.statCard} borderTopWidth={3} borderTopColor={BAR_COLORS.approved} flexBasis={140} flex={1}>
          <Text {...styles.statLabel}>{t('supportProviderDashboard.approvedValue', 'Value of Approved Assets')}</Text>
          <Text {...styles.statValue}>{'R ' + Math.round(Number(summary.totals.approved_value)).toLocaleString()}</Text>
          <Text fontSize={11} color="$textMutedForeground" mt="$1">
            {t('supportProviderDashboard.approvedPackages', 'Across {{count}} approved asset packages', { count: summary.totals.approved_count })}
          </Text>
        </VStack>
        <VStack {...styles.statCard} borderTopWidth={3} borderTopColor={BAR_COLORS.delivered} flexBasis={140} flex={1}>
          <Text {...styles.statLabel}>{t('supportProviderDashboard.deliveredValue', 'Value of Delivered Assets')}</Text>
          <Text {...styles.statValue}>{'R ' + Math.round(Number(summary.totals.delivered_value)).toLocaleString()}</Text>
          <Text fontSize={11} color="$textMutedForeground" mt="$1">
            {t('supportProviderDashboard.deliveredValueSubtitle', 'Fulfilled & verified in field')}
          </Text>
        </VStack>
        <VStack {...styles.statCard} borderTopWidth={3} borderTopColor={BAR_COLORS.committed} flexBasis={140} flex={1}>
          <Text {...styles.statLabel}>{t('supportProviderDashboard.remainingValue', 'Remaining Asset Value')}</Text>
          <Text {...styles.statValue}>{'R ' + Math.round(Math.max(0, Number(summary.totals.approved_value) - Number(summary.totals.delivered_value))).toLocaleString()}</Text>
          <Text fontSize={11} color="$textMutedForeground" mt="$1">
            {t('supportProviderDashboard.remainingValueSubtitle', 'Pending field delivery fulfillment')}
          </Text>
        </VStack>
      </HStack>
      {/* Row table */}
      {/* <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        <VStack minWidth={ASSET_TITLE_W + ASSET_COL_W * 4}>
          <HStack py="$2" borderBottomWidth={1} borderColor="$borderLight200">
            {['Title / Asset Type', 'Status', 'Qty', 'Value', 'Month'].map((h, i) => (
              <Text
                key={h}
                flex={i === 0 ? 2 : 1}
                minWidth={i === 0 ? ASSET_TITLE_W : ASSET_COL_W}
                textAlign={i === 0 ? 'left' : 'center'}
                fontSize={12}
                fontWeight="$bold"
                color="$textMutedForeground"
              >
                {h}
              </Text>
            ))}
          </HStack>
          {summary.data.map((row) => (
            <HStack key={row.request_id} alignItems="center" py="$2" borderTopWidth={1} borderColor="$borderLight200">
              <VStack flex={2} minWidth={ASSET_TITLE_W}>
                <Text fontSize={13} fontWeight="$medium">{row.title}</Text>
                {row.asset_type ? <Text fontSize={11} color="$textMutedForeground">{row.asset_type}</Text> : null}
              </VStack>
              <Text flex={1} minWidth={ASSET_COL_W} textAlign="center" fontSize={12}>{row.request_status}</Text>
              <Text flex={1} minWidth={ASSET_COL_W} textAlign="center" fontSize={12}>{row.quantity ?? '–'}</Text>
              <Text flex={1} minWidth={ASSET_COL_W} textAlign="center" fontSize={12}>
                {row.total_value != null ? Number(row.total_value).toLocaleString() : '–'}
              </Text>
              <Text flex={1} minWidth={ASSET_COL_W} textAlign="center" fontSize={12}>{row.request_month}</Text>
            </HStack>
          ))}
        </VStack>
      </ScrollView> */}
      {/* Pagination */}
      {/* <HStack justifyContent="space-between" alignItems="center" mt="$3">
        <Text fontSize={12} color="$textMutedForeground">
          {t('supportProviderDashboard.showingOf', 'Showing {{shown}} of {{total}}', {
            shown: summary.data.length,
            total: summary.count,
          })}
        </Text>
        {hasMore ? (
          <Button size="sm" variant="outline" onPress={onLoadMore} isDisabled={loadingMore}>
            {loadingMore ? <Spinner size="small" /> : null}
            <ButtonText>{t('supportProviderDashboard.loadMore', 'Load More')}</ButtonText>
          </Button>
        ) : null}
      </HStack> */}
    </VStack>
  );
};

const ASSET_PAGE_SIZE = 20;

type DashboardTab = 'interventions' | 'assets';

const DASHBOARD_TABS: { key: DashboardTab; label: string }[] = [
  { key: 'interventions', label: 'Interventions Overview' },
  { key: 'assets',        label: 'Asset Provider Approvals & Financials' },
];

const TabBar = ({ active, onChange }: { active: DashboardTab; onChange: (t: DashboardTab) => void }) => (
  <HStack bg="$backgroundLight100" borderRadius="$lg" p="$1" gap="$1" flexWrap="wrap" alignSelf="flex-start">
    {DASHBOARD_TABS.map((tab) => {
      const isActive = tab.key === active;
      return (
        <Pressable
          key={tab.key}
          onPress={() => onChange(tab.key)}
          px="$4"
          py="$2"
          borderRadius="$md"
          bg={isActive ? '$white' : 'transparent'}
          shadowColor={isActive ? '$shadowColor' : 'transparent'}
          shadowOpacity={isActive ? 0.1 : 0}
          shadowRadius={isActive ? 4 : 0}
        >
          <Text
            fontSize="$sm"
            fontWeight={isActive ? '$semibold' : '$normal'}
            color={isActive ? '$textForeground' : '$textMutedForeground'}
          >
            {tab.label}
          </Text>
        </Pressable>
      );
    })}
  </HStack>
);

// 'mentor' is the support provider's own view, the API already scopes the data to the logged in provider
const SupportProviderDashboard = ({ variant = 'admin' }: { variant?: 'admin' | 'mentor' }): React.JSX.Element => {
  const isMentor = variant === 'mentor';
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { showAlert } = useAlert();
  const isSupervisor = useIsTenantAdmin();
  const { user } = useAuth();
  const { allowedProvinces, isProfileLoading } = useProfileCompletion();

  const [allProvinces, setAllProvinces] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [supportTypes, setSupportTypes] = useState<MentoringOption[]>([]);
  const [filterSupportTypes, setFilterSupportTypes] = useState<MentoringOption[]>([]);
  const [pillars, setPillars] = useState<MentoringOption[]>([]);
  const [subCategories, setSubCategories] = useState<MentoringOption[]>([]);

  const [province, setProvince] = useState(ALL);
  const [site, setSite] = useState(ALL);
  const [provider, setProvider] = useState(ALL);
  const [supportType, setSupportType] = useState(ALL);
  const [filterSupportType, setFilterSupportType] = useState(ALL);
  const [pillar, setPillar] = useState(ALL);
  const [idpTask, setIdpTask] = useState(ALL);

  const [summary, setSummary] = useState<SupportDashboardSummary | null>(null);
  const [byMentor, setByMentor] = useState<ByMentorRow[]>([]);
  const [assetSummary, setAssetSummary] = useState<AssetsSummary | null>(null);
  const [assetPage, setAssetPage] = useState(1);

  const [activeTab, setActiveTab] = useState<DashboardTab>('interventions');

  const [loading, setLoading] = useState(false);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [publishedAssets, setPublishedAssets] = useState<AssetItem[]>([]);

  const [commitSupportType, setCommitSupportType] = useState('');
  const [commitProvider, setCommitProvider] = useState('');
  const [commitUnits, setCommitUnits] = useState('');
  const [savingCommitments, setSavingCommitments] = useState(false);

  // A supervisor only sees the provinces on their own profile; admins see every province
  const visibleProvinces = useMemo(
    () => (isSupervisor ? allProvinces.filter((p) => allowedProvinces.includes(p._id)) : allProvinces),
    [isSupervisor, allProvinces, allowedProvinces],
  );
  const provinceNames = useMemo(
    () => Object.fromEntries(allProvinces.map((p) => [String(p._id), p.name])),
    [allProvinces],
  );

  // Static filter data
  useEffect(() => {
    getProvincesList().then(setAllProvinces);
    getProviderOptions().then(setProviders);
    getSupportTypeOptions().then(setSupportTypes);
    getSupportTypeOptionsWithExclusion().then(setFilterSupportTypes);
    if (isMentor) {
      getTrainingSessions({}).then((res) =>
        setUpcomingSessions((res?.result?.data || []).filter((s: any) => s.status === 'Upcoming')),
      );
      getAssets({}).then((res) => setPublishedAssets(res?.result?.data || []));
    }
  }, [isMentor]);

  // Sites follow the selected province
  useEffect(() => {
    setSite(ALL);
    if (province === ALL) {
      setSites([]);
      return;
    }
    getSitesByProvince({ provinceId: province })
      .then((res) => setSites(res.result?.data || []))
      .catch(() => setSites([]));
  }, [province]);

  // Pillars follow the selected support type
  useEffect(() => {
    setPillar(ALL);
    if (filterSupportType === ALL) {
      setPillars([]);
      return;
    }
    getPillarOptions(filterSupportType).then(setPillars);
  }, [filterSupportType]);

  // IDP task options (training sub-categories) follow the selected pillar
  useEffect(() => {
    setIdpTask(ALL);
    if (filterSupportType !== SUPPORT_OFFERING_TYPE_VALUES.TRAINING_SESSION || pillar === ALL) {
      setSubCategories([]);
      return;
    }
    getMentoringEntities({ value: pillar }).then(setSubCategories);
  }, [filterSupportType, pillar]);

  // Derived filter object shared by loadData and handleLoadMoreAssets
  const activeFilters = useMemo(() => {
    const provinceIds =
      province !== ALL ? [province] : isSupervisor ? visibleProvinces.map((p) => p._id) : [];
    return {
      provinces: provinceIds,
      sites: site !== ALL ? [site] : [],
      // A mentor only ever sees their own data, so their user id is the mentor_id filter
      mentorId: isMentor ? (user?.id ? String(user.id) : undefined) : provider !== ALL ? provider : undefined,
      supportOfferingType: filterSupportType !== ALL ? filterSupportType : undefined,
      pillar: pillar !== ALL ? pillar : undefined,
      idpTasks: idpTask !== ALL ? [idpTask] : undefined,
    };
  }, [province, site, provider, filterSupportType, pillar, idpTask, isSupervisor, visibleProvinces, isMentor, user?.id]);

  // Loads summary + byMentor — runs whenever filters change, independent of active tab
  const loadSummaryData = useCallback(async () => {
    if (isProfileLoading || allProvinces.length === 0) return;

    if (isSupervisor && activeFilters.provinces.length === 0) {
      setSummary(null);
      setByMentor([]);
      return;
    }

    setLoading(true);
    try {
      const [summaryResult, mentorRows] = await Promise.all([
        getSupportDashboardSummary(activeFilters),
        getSupportDashboardByMentor(activeFilters),
      ]);
      setSummary(summaryResult);
      setByMentor(mentorRows);
    } catch (err) {
      console.error('Error fetching support dashboard:', err);
      setSummary(null);
      setByMentor([]);
      showAlert('error', t('supportProviderDashboard.loadError', 'Failed to load dashboard data.'));
    } finally {
      setLoading(false);
    }
  // showAlert and t are utility functions — not reactive values that should trigger re-fetches.
  // Including them caused infinite re-render loops because their references are not stable.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProfileLoading, allProvinces, activeFilters, isSupervisor]);

  // Loads asset data — only called when the assets tab is active
  const loadAssetsData = useCallback(async () => {
    if (isProfileLoading || allProvinces.length === 0) return;

    if (isSupervisor && activeFilters.provinces.length === 0) {
      setAssetSummary(null);
      return;
    }

    setAssetPage(1);
    setLoadingAssets(true);
    try {
      const assetResult = await getSupportDashboardAssets(activeFilters, 1, ASSET_PAGE_SIZE);
      setAssetSummary(assetResult);
    } catch (err) {
      console.error('Error fetching assets:', err);
      setAssetSummary(null);
      showAlert('error', t('supportProviderDashboard.assetsLoadError', 'Failed to load asset data.'));
    } finally {
      setLoadingAssets(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProfileLoading, allProvinces, activeFilters, isSupervisor]);

  useEffect(() => {
    loadSummaryData();
  }, [loadSummaryData]);

  // Assets are fetched lazily — only when the assets tab is open.
  // Re-runs automatically if filters change while the tab is already active.
  useEffect(() => {
    if (activeTab === 'assets') {
      loadAssetsData();
    }
  }, [activeTab, loadAssetsData]);

  const handleLoadMoreAssets = useCallback(async () => {
    if (!assetSummary) return;
    const nextPage = assetPage + 1;
    setLoadingAssets(true);
    try {
      const result = await getSupportDashboardAssets(activeFilters, nextPage, ASSET_PAGE_SIZE);
      setAssetSummary((prev) =>
        prev ? { ...result, data: [...prev.data, ...result.data] } : result,
      );
      setAssetPage(nextPage);
    } catch (err) {
      console.error('Error loading more assets:', err);
    } finally {
      setLoadingAssets(false);
    }
  }, [assetPage, assetSummary, activeFilters]);

  const units = Number(commitUnits);
  const commitmentValid =
    !!commitSupportType && !!commitProvider && commitUnits.trim() !== '' && Number.isInteger(units) && units >= 0;

  const handleSaveCommitments = async () => {
    setSavingCommitments(true);
    try {
      await recordInterventionCommitment({ providerId: commitProvider, supportType: commitSupportType, units });
      showAlert('success', t('supportProviderDashboard.commitmentSaved', 'Intervention commitment recorded.'));
      setCommitSupportType('');
      setCommitProvider('');
      setCommitUnits('');
    } catch (err) {
      console.error('Error saving commitment:', err);
      showAlert('error', t('supportProviderDashboard.commitmentError', 'Failed to record commitment.'));
    } finally {
      setSavingCommitments(false);
    }
  };

  const supportTypeLabel = (value: string) =>
    supportTypes.find((o) => o.value === value)?.label || humanize(value);

  const totals = summary?.totals;
  const provinceMax = Math.max(0, ...(summary?.sessions_per_province || []).map((r) => r.sessions_completed));

  const noData = !summary || (totals?.needed === 0 && totals?.approved === 0 && totals?.delivered === 0);
  const emptyText = (
    <Text {...styles.emptyText}>{t('supportProviderDashboard.noData', 'No data for the selected filters.')}</Text>
  );

  const isTraining = filterSupportType === SUPPORT_OFFERING_TYPE_VALUES.TRAINING_SESSION;
  const isService = filterSupportType === SUPPORT_OFFERING_TYPE_VALUES.ADDITIONAL_SERVICE;

  // This dashboard covers sessions and services only; assets are tracked on their own section
  const committedTotal = isTraining
    ? totals?.committed_sessions ?? 0
    : isService
      ? totals?.committed_services ?? 0
      : (totals?.committed_sessions ?? 0) + (totals?.committed_services ?? 0);

  const coveragePct = totals?.needed ? Math.round((committedTotal / totals.needed) * 100) : 0;
  const approvedPct = percent(totals?.approved, committedTotal) ?? 0;
  const deliveredPct = percent(totals?.delivered, totals?.approved) ?? 0;
  const deliveryPct = percent(totals?.delivered, committedTotal) ?? 0;

  const pendingAssetRows = (assetSummary?.data || []).filter(
    (r) => String(r.request_status).toLowerCase() === 'pending',
  );
  const pendingAssetValue = pendingAssetRows.reduce((sum, r) => sum + Number(r.total_value || 0), 0);

  const filterOptions = useMemo(
    () => [
      {
        attr: 'province',
        placeholder: t('supportProviderDashboard.allProvinces', 'All Provinces'),
        data: withAll('province', t('supportProviderDashboard.allProvinces', 'All Provinces'), visibleProvinces.map((p) => ({ value: p._id, label: p.name }))),
        resetOnChange: ['site'],
      },
      {
        attr: 'site',
        placeholder: t('supportProviderDashboard.allSites', 'All Sites'),
        data: withAll('site', t('supportProviderDashboard.allSites', 'All Sites'), sites.map((s) => ({ value: s._id, label: s.name }))),
        disabled: province === ALL,
      },
      ...(isMentor
        ? []
        : [{
            attr: 'provider',
            placeholder: t('supportProviderDashboard.allProviders', 'All Providers'),
            data: withAll('provider', t('supportProviderDashboard.allProviders', 'All Providers'), providers),
          }]),
      {
        attr: 'supportType',
        placeholder: t('supportProviderDashboard.allSupportTypes', 'All Support Types'),
        data: withAll('supportType', t('supportProviderDashboard.allSupportTypes', 'All Support Types'), filterSupportTypes),
        resetOnChange: ['pillar', 'idpTask'],
      },
      // Additional services have no pillar, they are filtered by service category directly
      {
        attr: 'pillar',
        placeholder: isService
          ? t('supportProviderDashboard.allServiceCategories', 'All Service Categories')
          : t('supportProviderDashboard.allPillars', 'All Pillars'),
        data: withAll(
          'pillar',
          isService
            ? t('supportProviderDashboard.allServiceCategories', 'All Service Categories')
            : t('supportProviderDashboard.allPillars', 'All Pillars'),
          pillars,
        ),
        disabled: filterSupportType === ALL,
        resetOnChange: ['idpTask'],
      },
      ...(isTraining
        ? [{
            attr: 'idpTask',
            placeholder: t('supportProviderDashboard.allSubCategories', 'All Subcategories'),
            data: withAll('idpTask', t('supportProviderDashboard.allSubCategories', 'All Subcategories'), subCategories),
            disabled: pillar === ALL,
          }]
        : []),
    ],
    [t, isMentor, visibleProvinces, sites, providers, filterSupportTypes, pillars, subCategories, province, pillar, filterSupportType, isTraining, isService],
  );

  const handleFilterChange = useCallback((f: Record<string, any>) => {
    const pick = (v?: string) => (!v || v.startsWith('all-') ? ALL : v);
    setProvince(pick(f.province));
    setSite(pick(f.site));
    setProvider(pick(f.provider));
    setFilterSupportType(pick(f.supportType));
    setPillar(pick(f.pillar));
    setIdpTask(pick(f.idpTask));
  }, []);

  return (
    <VStack space="md" width="100%">
      {isMentor ? null : (
        <TitleHeader
          title="admin.menu.supportProviderDashboard"
          description="admin.supportProviderDashboardDescription"
        />
      )}

      <FilterButton data={filterOptions} onFilterChange={handleFilterChange} />

      <TabBar active={activeTab} onChange={setActiveTab} />

      <VStack>
        {/* ===== Interventions Overview tab ===== */}
        {activeTab === 'interventions' && (
          <>
            {loading ? (
              <VStack {...styles.loadingBox}>
                <Spinner size="large" />
              </VStack>
            ) : (
              <>
                {/* Top-level stat cards */}
                <HStack {...styles.statsRow}>
                  <StatCard
                    label={t('supportProviderDashboard.needed', 'Needed')}
                    value={totals?.needed ?? 0}
                    color={BAR_COLORS.needed}
                    note={isMentor ? t('supportProviderDashboard.neededNote', 'Required for your portfolio') : undefined}
                  />
                  <StatCard
                    label={t('supportProviderDashboard.committed', 'Committed')}
                    value={committedTotal}
                    color={BAR_COLORS.committed}
                    note={isMentor ? t('supportProviderDashboard.committedNote', '{{pct}}% of your needed target', { pct: coveragePct }) : undefined}
                  />
                  <StatCard
                    label={t('supportProviderDashboard.approved', 'Approved')}
                    value={totals?.approved ?? 0}
                    color={BAR_COLORS.approved}
                    note={isMentor ? t('supportProviderDashboard.approvedNote', '{{pct}}% of your committed', { pct: approvedPct }) : undefined}
                  />
                  <StatCard
                    label={t('supportProviderDashboard.delivered', 'Delivered')}
                    value={totals?.delivered ?? 0}
                    color={BAR_COLORS.delivered}
                    note={isMentor ? t('supportProviderDashboard.deliveredNote', '{{pct}}% of your approved', { pct: deliveredPct }) : undefined}
                  />
                  {isMentor ? <DeliveryStatusCard coverage={Math.min(coveragePct, 100)} delivery={deliveryPct} /> : null}
                </HStack>

                <VStack {...styles.chartsRow}>
                  {/* By support type */}
                  <VStack {...styles.sectionCard}>
                    <SectionHeader
                      icon="Layers"
                      title={t('supportProviderDashboard.byType', 'Disaggregated Delivery Summary')}
                      subtitle={t('supportProviderDashboard.byTypeSubtitle', 'Needed, committed, approved and delivered for each support category')}
                    />
                    {noData ? emptyText : (
                      <SupportTypeTable
                        rows={summary?.by_support_offering_type || []}
                        totals={totals}
                        committedTotal={committedTotal}
                        labelFor={supportTypeLabel}
                      />
                    )}
                  </VStack>

                  {/* Monthly */}
                  <VStack {...styles.sectionCard}>
                    <SectionHeader
                      icon="Calendar"
                      title={t('supportProviderDashboard.monthly', 'Approved vs Delivered')}
                      subtitle={t('supportProviderDashboard.monthlySubtitle', 'Month on month')}
                    />
                    <HStack {...styles.legendRow}>
                      {(['approved', 'delivered'] as const).map((k) => (
                        <HStack key={k} {...styles.legendItem}>
                          <Box {...styles.legendDot} bg={BAR_COLORS[k]} />
                          <Text {...styles.legendText}>{t(`supportProviderDashboard.${k}`, humanize(k))}</Text>
                        </HStack>
                      ))}
                    </HStack>
                    {noData || !(summary?.monthly || []).length ? emptyText : (
                      <MonthlyBarChart rows={summary?.monthly || []} />
                    )}
                  </VStack>
                </VStack>

                {isMentor ? (
                  <VStack {...styles.chartsRow}>
                    <VStack {...styles.sectionCard}>
                      <SectionHeader
                        icon="MapPin"
                        title={t('supportProviderDashboard.fulfillmentByProvince', 'Fulfillment by Province')}
                        subtitle={t('supportProviderDashboard.fulfillmentByProvinceSubtitle', 'Approved vs delivered interventions per province')}
                      />
                      {(summary?.by_province || []).length === 0 ? emptyText : (
                        <FulfillmentByProvince
                          rows={summary?.by_province || []}
                          nameFor={(id) => provinceNames[id] || id}
                        />
                      )}
                    </VStack>
                    <VStack {...styles.sectionCard}>
                      <SectionHeader
                        icon="Clock"
                        title={t('supportProviderDashboard.upcomingSessions', 'Upcoming Scheduled Sessions')}
                        subtitle={t('supportProviderDashboard.upcomingSessionsSubtitle', 'Your next sessions')}
                      />
                      <UpcomingSessions
                        sessions={upcomingSessions}
                        onViewAll={() => navigation.navigate('opportunities' as never)}
                      />
                    </VStack>
                  </VStack>
                ) : (
                /* Interventions by Support Provider – grouped bar chart */
                /* Data is scoped server-side: supervisors see all providers; regular users see only their own row */
                <VStack {...styles.sectionCard}>
                  <SectionHeader
                    icon="Users"
                    title={t('supportProviderDashboard.byMentor', 'Interventions by Support Provider')}
                    subtitle={t('supportProviderDashboard.byMentorSubtitle', 'Committed vs delivered per provider — filtered by current selection')}
                  />
                  {byMentor.length === 0 ? emptyText : (
                    <ProviderBarChart
                      rows={byMentor.map((r) => ({
                        mentor_id: r.mentor_id,
                        // Exclude assets here — they are surfaced in the Assets tab
                        committed: r.committed_sessions + r.committed_services,
                        delivered: r.delivered_sessions + r.delivered_services,
                      }))}
                      providers={providers}
                    />
                  )}
                </VStack>
                )}
              </>
            )}

            {/* Record Intervention Commitment */}
            {isMentor ? null : (
            <VStack {...styles.sectionCard}>
              <SectionHeader
                icon="ClipboardCheck"
                title={t('supportProviderDashboard.commitment', 'Record Intervention Commitment')}
                subtitle={t('supportProviderDashboard.commitmentSubtitle', 'Record the units a support provider commits to for a support type')}
              />
              <HStack {...styles.filterRow}>
                <FilterField label={t('supportProviderDashboard.supportType', 'Support Type')}>
                  <Select
                    options={supportTypes.filter((o) => COMMITMENT_FIELD_BY_SUPPORT_TYPE[o.value])}
                    value={commitSupportType}
                    onChange={setCommitSupportType}
                    placeholder={t('supportProviderDashboard.select', 'Select')}
                  />
                </FilterField>
                <FilterField label={t('supportProviderDashboard.supportProvider', 'Support Provider')}>
                  <Select
                    options={providers}
                    value={commitProvider}
                    onChange={setCommitProvider}
                    placeholder={t('supportProviderDashboard.select', 'Select')}
                  />
                </FilterField>
                <FilterField label={t('supportProviderDashboard.committedUnits', 'Committed Units')}>
                  <Input>
                    <InputField
                      keyboardType="numeric"
                      value={commitUnits}
                      onChangeText={(v: string) => setCommitUnits(v.replace(/[^0-9]/g, ''))}
                      placeholder={t('supportProviderDashboard.enterUnits', 'Enter units')}
                    />
                  </Input>
                </FilterField>
              </HStack>
              <HStack {...styles.saveRow}>
                <Button onPress={handleSaveCommitments} isDisabled={savingCommitments || !commitmentValid}>
                  {savingCommitments ? <Spinner /> : <ButtonIcon as={LucideIcon} name="Save" />}
                  <ButtonText>{t('supportProviderDashboard.saveCommitment', 'Record Commitment')}</ButtonText>
                </Button>
              </HStack>
            </VStack>
            )}
          </>
        )}

        {/* ===== Asset Provider Approval & Valuation tab ===== */}
        {activeTab === 'assets' && (
          <>
            {loadingAssets ? (
              <VStack {...styles.loadingBox}>
                <Spinner size="large" />
              </VStack>
            ) : isMentor ? (
              <>
                <VStack {...styles.sectionCard}>
                  <SectionHeader
                    icon="Wallet"
                    title={t('supportProviderDashboard.fundPoolTitle', 'Asset Financial Valuation & Fund Pool Dashboard')}
                    subtitle={t('supportProviderDashboard.fundPoolSubtitle', 'Monetary valuation is tracked exclusively for physical and in-kind assets (1:1 participant ratio)')}
                  />
                  <AssetFundPool
                    assets={publishedAssets}
                    summary={assetSummary}
                    pendingValue={pendingAssetValue}
                    pendingCount={pendingAssetRows.length}
                  />
                </VStack>
                <VStack {...styles.sectionCard}>
                  <SectionHeader
                    icon="Package"
                    title={t('supportProviderDashboard.assetCatalog', 'Asset Request Approvals & Offering Catalog')}
                    subtitle={t('supportProviderDashboard.assetCatalogSubtitle', 'Review your published assets, coach requests are approved from the Requests page')}
                  />
                  <PublishedAssetsTable
                    assets={publishedAssets}
                    onManage={() => navigation.navigate('opportunities' as never)}
                  />
                  <HStack justifyContent="flex-end" mt="$2">
                    <Button onPress={() => navigation.navigate('requests' as never)}>
                      <ButtonText>{t('supportProviderDashboard.reviewRequests', 'Review Coach Asset Requests')}</ButtonText>
                    </Button>
                  </HStack>
                </VStack>
              </>
            ) : !assetSummary || assetSummary.count === 0 ? (
              <Text {...styles.emptyText}>{t('supportProviderDashboard.noData', 'No data for the selected filters.')}</Text>
            ) : (
              <VStack {...styles.sectionCard}>
                <SectionHeader
                  icon="Package"
                  title={t('supportProviderDashboard.assets', 'Asset Provider Approval & Valuation')}
                  subtitle={t('supportProviderDashboard.assetsSubtitle', 'Asset requests, quantities and values')}
                />
                <AssetsTable
                  summary={assetSummary}
                  onLoadMore={handleLoadMoreAssets}
                  loadingMore={loadingAssets}
                />
              </VStack>
            )}
          </>
        )}
      </VStack>
    </VStack>
  );
};

export default SupportProviderDashboard;
