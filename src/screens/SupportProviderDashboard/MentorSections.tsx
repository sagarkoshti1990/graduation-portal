import React from 'react';
import { ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { VStack, HStack, Box, Text, Button, ButtonText } from '@ui';
import { LucideIcon } from '@ui/index';
import type { SupportDashboardSummary, AssetsSummary } from '../../services/supportDashboardService';
import type { AssetItem } from '../../types/supportOfferingsTypes';
import styles, { BAR_COLORS } from './styles';

const money = (value: number) => 'R ' + Math.round(value).toLocaleString('en-ZA');

const ProgressRow = ({ label, pct, color }: { label: string; pct: number; color: string }) => (
  <VStack space="xs">
    <HStack justifyContent="space-between">
      <Text fontSize={12} color="$textMutedForeground">{label}</Text>
      <Text fontSize={12} fontWeight="$semibold">{pct}%</Text>
    </HStack>
    <Box {...styles.barTrack}>
      <Box height="$full" bg={color} width={`${Math.min(100, pct)}%`} />
    </Box>
  </VStack>
);

// Coverage = committed / needed, delivery = delivered / committed, same formulas as the summary table
export const DeliveryStatusCard = ({ coverage, delivery }: { coverage: number; delivery: number }) => {
  const { t } = useTranslation();
  return (
    <VStack {...styles.statCard} borderTopWidth={3} borderTopColor={BAR_COLORS.coverage}>
      <Text {...styles.statLabel}>{t('supportProviderDashboard.deliveryStatus', 'Delivery Status')}</Text>
      <ProgressRow label={t('supportProviderDashboard.coverage', 'Coverage')} pct={coverage} color={BAR_COLORS.committed} />
      <ProgressRow label={t('supportProviderDashboard.delivery', 'Delivery')} pct={delivery} color={BAR_COLORS.delivered} />
    </VStack>
  );
};

export const FulfillmentByProvince = ({
  rows,
  nameFor,
}: {
  rows: NonNullable<SupportDashboardSummary['by_province']>;
  nameFor: (province: string) => string;
}) => {
  const { t } = useTranslation();
  const metrics = [
    { key: 'approved' as const, color: BAR_COLORS.approved, label: t('supportProviderDashboard.approved', 'Approved') },
    { key: 'delivered' as const, color: BAR_COLORS.delivered, label: t('supportProviderDashboard.delivered', 'Delivered') },
  ];
  const max = Math.max(1, ...rows.flatMap((r) => [r.approved, r.delivered]));
  return (
    <VStack>
      <HStack {...styles.legendRow}>
        {metrics.map(({ key, color, label }) => (
          <HStack key={key} {...styles.legendItem}>
            <Box {...styles.legendDot} bg={color} />
            <Text {...styles.legendText}>{label}</Text>
          </HStack>
        ))}
      </HStack>
      {rows.map((row) => (
        <VStack key={row.province} mb="$3" space="xs">
          <Text fontSize={13} fontWeight="$semibold" numberOfLines={1}>{nameFor(row.province)}</Text>
          {metrics.map(({ key, color }) => (
            <HStack key={key} alignItems="center" gap="$3">
              <Box {...styles.barTrack}>
                <Box height="$full" bg={color} width={`${(row[key] / max) * 100}%`} />
              </Box>
              <Text {...styles.barValue}>{row[key]}</Text>
            </HStack>
          ))}
        </VStack>
      ))}
    </VStack>
  );
};

const formatSessionDate = (value: any): string => {
  if (!value) return '--';
  const date = new Date(typeof value === 'number' || !isNaN(Number(value)) ? Number(value) * 1000 : value);
  return isNaN(date.getTime())
    ? '--'
    : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const UpcomingSessions = ({ sessions, onViewAll }: { sessions: any[]; onViewAll: () => void }) => {
  const { t } = useTranslation();
  return (
    <VStack space="sm">
      {sessions.slice(0, 3).map((session) => {
        const limit = session.seats_limit || 0;
        const enrolled = Math.max(0, limit - (session.seats_remaining || 0));
        const location = session.meeting_info?.location || session.provinces?.[0] || '-';
        return (
          <VStack key={session.id} p="$3" borderWidth={1} borderColor="$borderLight200" borderRadius="$lg" space="xs">
            <Text fontSize={14} fontWeight="$semibold">{session.title}</Text>
            <HStack alignItems="center" gap="$2">
              <LucideIcon name="Calendar" size={14} color="$textMutedForeground" />
              <Text fontSize={12} color="$textMutedForeground">{formatSessionDate(session.start_date)}</Text>
            </HStack>
            <HStack alignItems="center" gap="$2">
              <LucideIcon name="Users" size={14} color="$textMutedForeground" />
              <Text fontSize={12} color="$textMutedForeground">
                {t('supportProviderDashboard.participantsCount', '{{enrolled}} / {{limit}} participants', { enrolled, limit })}
              </Text>
            </HStack>
            <HStack alignItems="center" gap="$2">
              <LucideIcon name="MapPin" size={14} color="$textMutedForeground" />
              <Text fontSize={12} color="$textMutedForeground">{location}</Text>
            </HStack>
          </VStack>
        );
      })}
      {sessions.length === 0 ? (
        <Text {...styles.emptyText}>{t('supportProviderDashboard.noUpcoming', 'No upcoming sessions.')}</Text>
      ) : null}
      <Button variant="outline" onPress={onViewAll}>
        <ButtonText>{t('supportProviderDashboard.viewCatalog', 'View Catalog')}</ButtonText>
      </Button>
    </VStack>
  );
};

type FundCardProps = { label: string; value: number; note: string; color: string };

const FundCard = ({ label, value, note, color }: FundCardProps) => (
  <VStack {...styles.statCard} borderTopWidth={3} borderTopColor={color}>
    <Text {...styles.statLabel}>{label}</Text>
    <Text {...styles.statValue}>{money(value)}</Text>
    <Text fontSize={11} color="$textMutedForeground">{note}</Text>
  </VStack>
);

/**
 * Asset Financial Valuation & Fund Pool.
 * Pool = value of everything the provider published (unit value x quantity); the other cards are drawn from the dashboard assets view.
 */
export const AssetFundPool = ({
  assets,
  summary,
  pendingValue,
  pendingCount,
}: {
  assets: AssetItem[];
  summary: AssetsSummary | null;
  pendingValue: number;
  pendingCount: number;
}) => {
  const { t } = useTranslation();
  const pool = assets.reduce((sum, a) => sum + (a.estimatedValuePerParticipant || 0) * (a.quantity || 0), 0);
  const approved = Number(summary?.totals.approved_value || 0);
  const delivered = Number(summary?.totals.delivered_value || 0);
  const deliveredPct = approved > 0 ? Math.round((delivered / approved) * 100) : 0;

  return (
    <VStack space="md">
      <HStack flexWrap="wrap" gap="$4">
        <FundCard
          label={t('supportProviderDashboard.totalFundPool', 'Total Available Fund Pool')}
          value={pool}
          note={t('supportProviderDashboard.activeOfferings', 'Across {{count}} asset offerings', { count: assets.length })}
          color={BAR_COLORS.needed}
        />
        <FundCard
          label={t('supportProviderDashboard.approvedAssetsValue', 'Approved Assets Value')}
          value={approved}
          note={t('supportProviderDashboard.approvedAllocations', '{{count}} approved participant allocations', { count: summary?.totals.approved_count || 0 })}
          color={BAR_COLORS.approved}
        />
        <FundCard
          label={t('supportProviderDashboard.deliveredAssetsValue', 'Delivered Assets Value')}
          value={delivered}
          note={t('supportProviderDashboard.deliveredSubtitle', 'Fulfilled & verified in field')}
          color={BAR_COLORS.delivered}
        />
        <FundCard
          label={t('supportProviderDashboard.pendingRequestsValue', 'Pending Requests Value')}
          value={pendingValue}
          note={t('supportProviderDashboard.pendingRequests', '{{count}} unapproved participant requests', { count: pendingCount })}
          color={BAR_COLORS.committed}
        />
      </HStack>
      <ProgressRow
        label={`${t('supportProviderDashboard.deliveredVsApproved', 'Delivered Assets Value vs. Approved Allocation')} (${money(delivered)} / ${money(approved)})`}
        pct={deliveredPct}
        color={BAR_COLORS.delivered}
      />
    </VStack>
  );
};

const COL_W = 110;
const TITLE_W = 200;

const Cell = ({ children, first = false, bold = false }: { children: React.ReactNode; first?: boolean; bold?: boolean }) => (
  <Text
    flex={first ? 2 : 1}
    minWidth={first ? TITLE_W : COL_W}
    textAlign={first ? 'left' : 'center'}
    fontSize={first ? 13 : 12}
    fontWeight={first || bold ? '$semibold' : '$normal'}
  >
    {children}
  </Text>
);

export const PublishedAssetsTable = ({
  assets,
  onManage,
}: {
  assets: AssetItem[];
  onManage: () => void;
}) => {
  const { t } = useTranslation();
  const headers = [
    t('supportProviderDashboard.publishedAsset', 'Published Asset Item'),
    t('supportProviderDashboard.subCategory', 'Sub-Category'),
    t('supportProviderDashboard.unitValue', 'Unit Value'),
    t('supportProviderDashboard.availableQty', 'Available Qty'),
    t('supportProviderDashboard.status', 'Status'),
  ];

  return (
    <VStack>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        <VStack flex={1} minWidth={TITLE_W * 2 + COL_W * 4}>
          <HStack py="$2">
            {headers.map((h, i) => (
              <Text
                key={h}
                flex={i === 0 ? 2 : 1}
                minWidth={i === 0 ? TITLE_W : COL_W}
                textAlign={i === 0 ? 'left' : 'center'}
                fontSize={12}
                fontWeight="$bold"
                color="$textMutedForeground"
              >
                {h}
              </Text>
            ))}
          </HStack>
          {assets.map((a) => (
            <HStack key={a.id} alignItems="center" py="$2.5" borderTopWidth={1} borderColor="$borderLight200">
              <Cell first>{a.title}</Cell>
              <Cell>{a.type || '–'}</Cell>
              <Cell>{a.estimatedValuePerParticipant != null ? money(a.estimatedValuePerParticipant) : '–'}</Cell>
              <Cell>{a.seats_remaining ?? a.quantity ?? '–'}</Cell>
              <Cell>{a.status}</Cell>
            </HStack>
          ))}
          {assets.length === 0 ? (
            <Text {...styles.emptyText}>{t('supportProviderDashboard.noAssets', 'No published assets yet.')}</Text>
          ) : null}
        </VStack>
      </ScrollView>
      <HStack justifyContent="flex-end" mt="$3">
        <Button variant="outline" onPress={onManage}>
          <ButtonText>{t('supportProviderDashboard.manageOfferings', 'Manage Offerings')}</ButtonText>
        </Button>
      </HStack>
    </VStack>
  );
};
