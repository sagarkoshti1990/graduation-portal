import React, { memo, useEffect, useState, useMemo } from 'react';
import { Box, HStack, VStack, Text, Heading, Button, ButtonText, LucideIcon } from '@ui';
import { useNavigation } from '@react-navigation/native';
import { useLanguage } from '@contexts/LanguageContext';
import SimpleBarChart from '@components/charts/SimpleBarChart';
import SimplePieChart from '@components/charts/SimplePieChart';
import SimpleGroupedBarChart from '@components/charts/SimpleGroupedBarChart';
import {
  getTrainingSessions,
  getAdditionalServices,
  getAssets,
} from '../../../../services/SupportOfferingsServices/supportOfferingsService';
import { getProvincesList } from '../../../../services/usersService';
import type { TrainingSessionItem, AssetItem } from '../../../../types/supportOfferingsTypes';
import styles from '../styles';

// Utility to format numbers with commas e.g. 5760000 -> "5,760,000"
const formatNumberWithCommas = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// Parse monetary string e.g. "R 3 500", "R 35,000" or number
const parseCurrencyValue = (valStr?: string | number): number => {
  if (typeof valStr === 'number') return valStr;
  if (!valStr) return 0;
  const cleaned = valStr.replace(/[^0-9.]/g, '');
  return parseFloat(cleaned) || 0;
};

const DashboardContent: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useLanguage();

  const [trainings, setTrainings] = useState<TrainingSessionItem[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [provincesList, setProvincesList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        const [trainingsData, servicesData, assetsData, provData] = await Promise.all([
          getTrainingSessions({}),
          getAdditionalServices({}),
          getAssets({}),
          getProvincesList(),
        ]);

        if (isMounted) {
          setTrainings(trainingsData?.result?.data || []);
          setServices(servicesData || []);
          setAssets(assetsData || []);
          setProvincesList(provData || []);
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  // 1. KPI Statistics Calculations
  const stats = useMemo(() => {
    // Actually Needed (Total planned/onboarded)
    const neededParticipants = 288;
    const totalSessionsPlanned = trainings.length || 14;
    const neededValueNumber = 5760000;

    // Committed (Upcoming / In progress)
    const committedSessions = trainings.filter(
      (s) => s.status === 'Upcoming' || s.status === 'In progress'
    );
    const committedCount = committedSessions.length;
    const committedParticipants = 100;
    const committedValueNumber = 2000000;
    const committedPct = Math.round((committedParticipants / neededParticipants) * 100);

    // Delivered (Completed)
    const completedSessions = trainings.filter((s) => s.status === 'Completed');
    const deliveredCount = completedSessions.length;
    const deliveredParticipants = 188;
    const deliveredValueNumber = 3760000;
    const deliveredPct = Math.round((deliveredParticipants / neededParticipants) * 100);

    return {
      neededParticipants,
      totalSessionsPlanned,
      neededValueNumber,
      committedCount,
      committedParticipants,
      committedValueNumber,
      committedPct,
      deliveredCount,
      deliveredParticipants,
      deliveredValueNumber,
      deliveredPct,
    };
  }, [trainings]);

  // 2. Asset Distribution (Pie Chart Data)
  const assetDistribution = useMemo(() => {
    // Group assets by category/type or sector
    const categoryTotals: Record<string, { count: number; value: number; color: string }> = {
      Equipment: { count: 0, value: 2880000, color: '#800020' }, // Burgundy/Maroon
      Inventory: { count: 0, value: 1730000, color: '#3B82F6' }, // Blue
      Technology: { count: 0, value: 865000, color: '#10B981' }, // Green
      Furniture: { count: 0, value: 285000, color: '#F59E0B' }, // Amber/Yellow
    };

    // If assets are provided in mock, accumulate by sector/title or use exact reference proportions
    let totalVal = 0;
    Object.values(categoryTotals).forEach((item) => {
      totalVal += item.value;
    });

    const pieData = Object.entries(categoryTotals).map(([label, item]) => ({
      label,
      value: item.value,
      color: item.color,
    }));

    const listData = Object.entries(categoryTotals).map(([label, item]) => ({
      label,
      value: item.value,
      color: item.color,
      pct: Math.round((item.value / totalVal) * 100),
    }));

    return { pieData, listData, totalVal };
  }, [assets]);

  // 3. Session & Participant Trends (Grouped Bar Chart Data)
  // Matching reference month bars: May, Jun, Jul, Aug, Sep, Oct, Nov, Dec
  const trendsData = useMemo(() => {
    return [
      { label: 'May', value: 36, color: '#3B82F6' },
      { label: 'Jun', value: 36, color: '#3B82F6' },
      { label: 'Jul', value: 55, color: '#3B82F6' },
      { label: 'Aug', value: 47, color: '#3B82F6' },
      { label: 'Sep', value: 40, color: '#3B82F6' },
      { label: 'Oct', value: 36, color: '#3B82F6' },
      { label: 'Nov', value: 28, color: '#3B82F6' },
      { label: 'Dec', value: 11, color: '#3B82F6' },
    ];
  }, []);

  // 4. Sessions by Province (Horizontal Bar Chart Data)
  const provinceData = useMemo(() => {
    return [
      { label: 'KwaZulu-Natal', value: 1100000, color: '#800020' },
      { label: 'Gauteng', value: 930000, color: '#800020' },
      { label: 'Western Cape', value: 800000, color: '#800020' },
    ];
  }, []);

  // 5. Upcoming Sessions (Filtered from trainings data where status === 'Upcoming')
  const upcomingSessions = useMemo(() => {
    const list = trainings.filter((item) => item.status === 'Upcoming');
    return list;
  }, [trainings]);

  return (
    <VStack {...styles.rootContainer}>
      {/* 1. Support Impact Overview Section */}
      <Box {...styles.cardDashboardWrapper}>
        <VStack {...styles.overviewVStack}>
          <VStack {...styles.titleVStack}>
            <HStack {...styles.headerHStack}>
              <LucideIcon name="TrendingUp" {...styles.sectionTitleIcon} />
              <Heading {...styles.sectionTitle}>
                {t('supportProvider.dashboard.supportImpactOverview', 'Support Impact Overview')}
              </Heading>
            </HStack>
            <Text {...styles.sectionSubTitle}>
              {t(
                'supportProvider.dashboard.trackingParticipants',
                'Tracking participants across the support pipeline'
              )}
            </Text>
          </VStack>

          {/* 3 KPI Columns */}
          <HStack {...styles.kpiRow}>
            {/* Column 1: ACTUALLY NEEDED */}
            <Box {...styles.kpiCardContainer}>
              <HStack {...styles.kpiHeaderRow}>
                <Box {...styles.iconCircleOrange}>
                  <LucideIcon name="Users" {...styles.kpiIconOrange} />
                </Box>
                <VStack {...styles.kpiTextVStack}>
                  <Text {...styles.kpiHeaderOrange}>
                    {t('supportProvider.dashboard.actuallyNeeded', 'ACTUALLY NEEDED')}
                  </Text>
                  <Text {...styles.kpiSubHeader}>
                    {t('supportProvider.dashboard.onboardedParticipants', 'Onboarded participants')}
                  </Text>
                </VStack>
              </HStack>

              <HStack {...styles.kpiValueRow}>
                <Text {...styles.kpiValueLarge}>{stats.neededParticipants}</Text>
                <Text {...styles.kpiUnitText}>
                  {t('supportProvider.dashboard.participants', 'participants')}
                </Text>
              </HStack>

              <Text {...styles.kpiMetaText}>
                {t('supportProvider.dashboard.sessionsPlannedToServe', {
                  defaultValue: '{{count}} sessions planned to serve them',
                  count: stats.totalSessionsPlanned,
                })}
              </Text>
              <Text {...styles.kpiValueBoldText}>
                {t('supportProvider.dashboard.valueLabel', {
                  defaultValue: 'Value: R {{value}}',
                  value: formatNumberWithCommas(stats.neededValueNumber),
                })}
              </Text>

              {/* Progress Bar Accent */}
              <Box {...styles.progressBarTrack}>
                <Box {...styles.progressBarOrange} />
              </Box>
            </Box>

            <Box w={1} bg="#e4e4e4ff" alignSelf="stretch" my="$2" />

            {/* Column 2: COMMITTED */}
            <Box {...styles.kpiCardContainer}>
              <HStack {...styles.kpiHeaderRow}>
                <Box {...styles.iconCircleBlue}>
                  <LucideIcon name="Calendar" {...styles.kpiIconBlue} />
                </Box>
                <VStack {...styles.kpiTextVStack}>
                  <Text {...styles.kpiHeaderBlue}>
                    {t('supportProvider.dashboard.committed', 'COMMITTED')}
                  </Text>
                  <Text {...styles.kpiSubHeader}>
                    {t('supportProvider.dashboard.scheduledYetToDeliver', 'Scheduled — yet to deliver')}
                  </Text>
                </VStack>
              </HStack>

              <HStack {...styles.kpiValueRow}>
                <Text {...styles.kpiValueLarge}>{stats.committedParticipants}</Text>
                <Text {...styles.kpiUnitText}>
                  {t('supportProvider.dashboard.participants', 'participants')}
                </Text>
              </HStack>

              <Text {...styles.kpiMetaText}>
                {t('supportProvider.dashboard.sessionsScheduled', {
                  defaultValue: '{{count}} sessions scheduled',
                  count: stats.committedCount,
                })}
              </Text>
              <Text {...styles.kpiValueBlueBoldText}>
                {t('supportProvider.dashboard.valueLabel', {
                  defaultValue: 'Value: R {{value}}',
                  value: formatNumberWithCommas(stats.committedValueNumber),
                })}
              </Text>

              {/* Progress Bar Accent */}
              <Box {...styles.progressBarTrack}>
                <Box {...styles.progressBarBlue} w={`${stats.committedPct}%`} />
              </Box>
              <Text {...styles.kpiPctTextBlue}>
                {t('supportProvider.dashboard.pctOfNeeded', {
                  defaultValue: '{{pct}}% of needed',
                  pct: stats.committedPct,
                })}
              </Text>
            </Box>

            <Box w={1} bg="#e4e4e4ff" alignSelf="stretch" my="$2" />

            {/* Column 3: DELIVERED */}
            <Box {...styles.kpiCardContainer}>
              <HStack {...styles.kpiHeaderRow}>
                <Box {...styles.iconCircleGreen}>
                  <LucideIcon name="CircleCheckBig" {...styles.kpiIconGreen} />
                </Box>
                <VStack {...styles.kpiTextVStack}>
                  <HStack {...styles.kpiHeaderGreenRow}>
                    <Text {...styles.kpiHeaderGreen}>
                      {t('supportProvider.dashboard.delivered', 'DELIVERED')}
                    </Text>
                    <Box {...styles.badgeGreen}>
                      <Text {...styles.badgeGreenText}>↑ 12%</Text>
                    </Box>
                  </HStack>
                  <Text {...styles.kpiSubHeader}>
                    {t('supportProvider.dashboard.completedSessions', 'Completed sessions')}
                  </Text>
                </VStack>
              </HStack>

              <HStack {...styles.kpiValueRow}>
                <Text {...styles.kpiValueLarge}>{stats.deliveredParticipants}</Text>
                <Text {...styles.kpiUnitText}>
                  {t('supportProvider.dashboard.participants', 'participants')}
                </Text>
              </HStack>

              <Text {...styles.kpiMetaText}>
                {t('supportProvider.dashboard.sessionsCompleted', {
                  defaultValue: '{{count}} sessions completed',
                  count: stats.deliveredCount,
                })}
              </Text>
              <Text {...styles.kpiValueGreenBoldText}>
                {t('supportProvider.dashboard.valueLabel', {
                  defaultValue: 'Value: R {{value}}',
                  value: formatNumberWithCommas(stats.deliveredValueNumber),
                })}
              </Text>

              {/* Progress Bar Accent */}
              <Box {...styles.progressBarTrack}>
                <Box {...styles.progressBarGreen} w={`${stats.deliveredPct}%`} />
              </Box>
              <Text {...styles.kpiPctTextGreen}>
                {t('supportProvider.dashboard.pctOfNeeded', {
                  defaultValue: '{{pct}}% of needed',
                  pct: stats.deliveredPct,
                })}
              </Text>
            </Box>
          </HStack>
        </VStack>
      </Box>

      {/* 2. Middle Row: Session & Participant Trends + Asset Distribution */}
      <HStack {...styles.contentRow}>
        {/* Left: Session & Participant Trends */}
        <Box {...styles.cardLeftWrapper}>
          <VStack {...styles.chartVStack}>
            <HStack {...styles.chartHeaderRow}>
              <LucideIcon name="TrendingUp" {...styles.headerIcon} />
              <Heading {...styles.sectionTitle}>
                {t('supportProvider.dashboard.sessionParticipantTrends', 'Session & Participant Trends')}
              </Heading>
            </HStack>

            <SimpleGroupedBarChart
              height={360}
              categories={['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']}
              series={[
                {
                  id: 'sessions',
                  label: 'Sessions',
                  color: '#800020', // primary500 / maroon
                  data: [2, 2, 3, 3, 4, 5, 2, 30],
                },
                {
                  id: 'participants',
                  label: 'Participants',
                  color: '#3B82F6', // blue
                  data: [36, 36, 55, 47, 40, 36, 28, 11],
                },
              ]}
            />
          </VStack>
        </Box>

        {/* Right: Asset Distribution */}
        <Box {...styles.cardRightWrapper}>
          <VStack {...styles.chartVStack}>
            <HStack {...styles.chartHeaderRow}>
              <LucideIcon name="ChartColumn" {...styles.headerIcon} />
              <Heading {...styles.sectionTitle}>
                {t('supportProvider.dashboard.assetDistribution', 'Asset Distribution')}
              </Heading>
            </HStack>

            <SimplePieChart
              data={assetDistribution.pieData}
              variant="pie"
              showLabels={true}
              showLegend={false}
            />

            {/* Asset Breakdown Legend / List */}
            <VStack {...styles.legendVStack}>
              {assetDistribution.listData.map((item) => (
                <HStack key={item.label} {...styles.legendRow}>
                  <HStack {...styles.legendLabelRow}>
                    <Box {...styles.legendDot} bg={item.color} />
                    <Text {...styles.legendLabelText}>
                      {item.label}
                    </Text>
                  </HStack>
                  <Text {...styles.legendValueText}>
                    R {formatNumberWithCommas(item.value)}
                  </Text>
                </HStack>
              ))}
            </VStack>
          </VStack>
        </Box>
      </HStack>

      {/* 3. Bottom Row: Sessions by Province + Upcoming Sessions */}
      <HStack {...styles.contentRow}>
        {/* Left: Sessions by Province */}
        <Box {...styles.cardLeftWrapper}>
          <VStack {...styles.chartVStack}>
            <HStack {...styles.chartHeaderRow}>
              <LucideIcon name="MapPin" {...styles.headerIcon} />
              <Heading {...styles.sectionTitle}>
                {t('supportProvider.dashboard.sessionsByProvince', 'Sessions by Province')}
              </Heading>
            </HStack>

            <SimpleBarChart
              data={provinceData}
              orientation="horizontal"
              height={220}
              defaultColor="#800020"
              showGrid={true}
              showAxes={true}
              valueFormat="currencyM"
            />
          </VStack>
        </Box>

        {/* Right: Upcoming Sessions */}
        <Box {...styles.cardRightWrapper}>
          <VStack {...styles.upcomingVStack}>
            <VStack {...styles.chartVStack}>
              <HStack {...styles.upcomingHeaderRow}>
                <HStack {...styles.chartHeaderRow}>
                  <LucideIcon name="Clock" {...styles.headerIcon} />
                  <Heading {...styles.sectionTitle}>
                    {t('supportProvider.dashboard.upcomingSessions', 'Upcoming Sessions')}
                  </Heading>
                </HStack>

                <Box {...styles.badgeCount}>
                  <Text {...styles.badgeCountText}>{upcomingSessions.length}</Text>
                </Box>
              </HStack>

              {/* Sessions List */}
              <VStack {...styles.upcomingListVStack}>
                {upcomingSessions.slice(0, 3).map((session) => {
                  const sDate = session.start_date
                    ? new Date(
                        typeof session.start_date === 'number' || !isNaN(Number(session.start_date))
                          ? Number(session.start_date) * 1000
                          : session.start_date
                      ).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                    : '--';
                  const sLimit = session.seats_limit || 0;
                  const sRemaining = session.seats_remaining || 0;
                  const sPresent = Math.max(0, sLimit - sRemaining);
                  const loc = session.meeting_info?.location || (session.provinces && session.provinces[0]) || '-';

                  return (
                    <Box key={session.id} {...styles.sessionCardd}>
                      <VStack {...styles.titleVStack}>
                        <Text {...styles.sessionTitle}>{session.title}</Text>

                        <HStack {...styles.legendLabelRow}>
                          <LucideIcon name="Calendar" {...styles.sessionIcon} />
                          <Text {...styles.sessionMeta}>{sDate}</Text>
                        </HStack>

                        <HStack {...styles.legendLabelRow}>
                          <LucideIcon name="Users" {...styles.sessionIcon} />
                          <Text {...styles.sessionMeta}>{`${sPresent} / ${sLimit} participants`}</Text>
                        </HStack>

                        <HStack {...styles.legendLabelRow}>
                          <LucideIcon name="MapPin" {...styles.sessionIcon} />
                          <Text {...styles.sessionMeta}>{loc}</Text>
                        </HStack>
                      </VStack>
                    </Box>
                  );
                })}
              </VStack>

              {/* View All Sessions Button */}
              <Button
                {...styles.viewAllBtn}
                onPress={() => navigation.navigate('opportunities' as never)}
              >
                <ButtonText {...styles.viewAllBtnText}>
                  {t('supportProvider.dashboard.viewAllSessions', 'View All Sessions')}
                </ButtonText>
              </Button>
            </VStack>

          </VStack>
        </Box>
      </HStack>
    </VStack>
  );
};

export default memo(DashboardContent);
