import React, { useMemo, useState } from 'react';
import { Platform, ScrollView, useWindowDimensions } from 'react-native';
import { VStack, Heading, Box, Card, Text, HStack } from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import { TabButton } from '@components/Tabs';
import StatCard, { StatsRow } from '@components/StatCard';
import { TabData } from '@app-types/components';
import type { DashboardGraphBlock } from '@app-types/dashboardGraphs';
import { cardViewStyles } from './CardViewStyles';
import DashboardGraphs from './DashboardGraphs';

interface MetricCardData {
  id: string;
  title: string; // Translation key
  value: string | number; // Display value shown directly (no calculation)
  subtitle: string; // Translation key
  count?: string; // Optional count to show before subtitle
  color?: string; // Optional color for the main value
  badgeText?: string;
  badgeBg?: string;
  badgeTextColor?: string;
}

interface CardViewSection {
  title: string; // Translation key
  metricCards: MetricCardData[];
}

interface CardViewBreakdownItem {
  id: string;
  label: string; // Translation key
  color: string;
  count: string | number;
  percentage: string;
}

interface CardViewBreakdownSection {
  title: string; // Translation key
  items: CardViewBreakdownItem[];
}

interface CardViewProps {
  tabs: TabData[];
  metricCards: MetricCardData[];
  sections?: CardViewSection[];
  breakdownSections?: CardViewBreakdownSection[];
  graphsBlocks?: DashboardGraphBlock[];
  graphsPlaceholderKey?: string;
  insightsTitle?: string; // Translation key
  insightsItems?: string[]; // Translation keys
  cardViewId?: string; // e.g. 'participant-enrollment'
  topContent?: React.ReactNode; // optional block above tabs (e.g., individual filters bar)
  snapshotHeader?: React.ReactNode; // optional block above metric cards in Snapshot
  insightsDotColor?: string; // optional override color for insight bullets
  snapshotPlaceholderKey?: string; // Translation key for placeholder when snapshot is empty
}

/**
 * CardView Component
 * Displays indicator details with tabs, metric cards, and insights
 * Used within DashboardCards to show card details on the same screen
 */
const CardView: React.FC<CardViewProps> = ({
  tabs,
  metricCards,
  sections,
  breakdownSections,
  graphsBlocks,
  graphsPlaceholderKey,
  insightsTitle,
  insightsItems,
  cardViewId,
  topContent,
  snapshotHeader,
  insightsDotColor,
  snapshotPlaceholderKey,
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<string>(tabs[0]?.key || '');
  const { width: windowWidth } = useWindowDimensions();

  const metricColumns = useMemo(() => {
    // Max 5 cards per row (web). On smaller widths, reduce columns.
    if (windowWidth < 640) return 1;
    if (windowWidth < 1024) return 2;
    if (windowWidth < 1280) return 4;
    return 5;
  }, [windowWidth]);

  const renderMetricGrid = (metrics: MetricCardData[]) => {
    if (Platform.OS !== 'web') {
      return (
        <StatsRow>
          {metrics.map(metric => (
            <StatCard
              key={metric.id}
              title={metric.title}
              count={metric.value}
              subLabel={metric.subtitle}
              showCountBeforeSubLabel={!!metric.count}
              countValue={metric.count}
              color={metric.color}
              badgeText={metric.badgeText}
              badgeBg={metric.badgeBg}
              badgeTextColor={metric.badgeTextColor}
            />
          ))}
        </StatsRow>
      );
    }

    const maxCols = metricColumns;
    const gutter = 8; // left/right padding per item (8 + 8 = 16px gap)
    const rowGap = 16;

    const rows: MetricCardData[][] = [];
    for (let i = 0; i < metrics.length; i += maxCols) {
      rows.push(metrics.slice(i, i + maxCols));
    }

    // If we have multiple rows, keep a consistent column width (100/maxCols) across all rows.
    // If we only have one row, expand to 100/rowLength to avoid empty space.
    const colsForWidth = rows.length > 1 ? maxCols : Math.max(1, rows[0]?.length ?? 1);

    return (
      <Box>
        {rows.map((row, rowIdx) => {
          const itemWidth = `${100 / colsForWidth}%`;
          return (
            <Box
              key={`metric-row-${rowIdx}`}
              style={{
                flexDirection: 'row',
                flexWrap: 'nowrap',
                marginLeft: -gutter,
                marginRight: -gutter,
                marginBottom: rowIdx === rows.length - 1 ? 0 : rowGap,
              } as any}
            >
              {row.map(metric => (
                <Box
                  key={metric.id}
                  style={{
                    width: itemWidth,
                    paddingLeft: gutter,
                    paddingRight: gutter,
                  } as any}
                >
                  <StatCard
                    title={metric.title}
                    count={metric.value}
                    subLabel={metric.subtitle}
                    showCountBeforeSubLabel={!!metric.count}
                    countValue={metric.count}
                    color={metric.color}
                    badgeText={metric.badgeText}
                    badgeBg={metric.badgeBg}
                    badgeTextColor={metric.badgeTextColor}
                    containerStyle={{
                      marginHorizontal: 0,
                      marginBottom: 0,
                      width: '100%',
                    } as any}
                  />
                </Box>
              ))}
            </Box>
          );
        })}
      </Box>
    );
  };

  return (
    <VStack {...cardViewStyles.container}>
      {topContent ? <Box mb="$2">{topContent}</Box> : null}
      {/* Tabs */}
      <Box mt="$4" mb="$6">
        <HStack
          bg="$backgroundLight50"
          borderRadius={50}
          p={4}
          gap={4}
          alignItems="center"
          alignSelf="flex-start"
        >
          {tabs.map(tab => (
            <Box 
              key={tab.key}
              flexShrink={0}
              style={{ 
                flex: 0,
                minWidth: 'auto',
                width: 'auto',
              } as any}
            >
              <TabButton
                tab={tab}
                isActive={activeTab === tab.key}
                onPress={setActiveTab}
                variant="ButtonTab"
              />
            </Box>
          ))}
        </HStack>
      </Box>

      {/* Content based on active tab */}
      {activeTab === 'snapshot' && (
        <VStack space="md">
          {snapshotHeader ? <Box mb="$2">{snapshotHeader}</Box> : null}
          {/* Show placeholder if no metrics and placeholder key is provided */}
          {snapshotPlaceholderKey && (!metricCards || metricCards.length === 0) && (!sections || sections.length === 0) && !breakdownSections && !insightsTitle ? (
            <Box flex={1} alignItems="center" justifyContent="center" py="$16">
              <Text fontSize="$2xl" fontWeight="$bold" color="$textForeground" mb="$2">
                {t('common.comingSoon')}
              </Text>
              <Text fontSize="$md" color="$textLight600">
                {t(snapshotPlaceholderKey)}
              </Text>
            </Box>
          ) : (
            <>
          {/* Metric Cards (supports simple list or sectioned layout) */}
          {sections && sections.length > 0 ? (
            <VStack space="lg">
              {sections.map(section => (
                <Card key={section.title} {...cardViewStyles.insightsCard} mt="$0">
                  <Heading {...cardViewStyles.insightsTitle}>{t(section.title)}</Heading>
                  <Box mt="$4">
                        {renderMetricGrid(section.metricCards)}
                  </Box>
                </Card>
              ))}
            </VStack>
          ) : (
                renderMetricGrid(metricCards)
          )}

          {/* Breakdown Sections (e.g. Drop Outs reasons) */}
          {breakdownSections && breakdownSections.length > 0 && (
            <VStack space="md">
              {breakdownSections.map(section => (
                <Card key={section.title} {...cardViewStyles.insightsCard} mt="$0">
                  <Heading {...cardViewStyles.insightsTitle}>{t(section.title)}</Heading>
                  <Box mt="$4">
                    {(() => {
                      const isNarrow = windowWidth < 768;
                      const leftItems = section.items.filter((_, idx) => idx % 2 === 0);
                      const rightItems = section.items.filter((_, idx) => idx % 2 === 1);

                      const renderRow = (item: CardViewBreakdownItem) => (
                        <Box
                          key={item.id}
                          width="100%"
                          px="$4"
                          py="$4"
                          bg="$backgroundLight50"
                          borderRadius="$lg"
                        >
                          <HStack alignItems="center" justifyContent="space-between">
                            <HStack space="sm" alignItems="center" flex={1}>
                              <Box
                                width={10}
                                height={10}
                                borderRadius={999}
                                bg={item.color as any}
                                flexShrink={0}
                              />
                              <Text fontSize="$sm" color="$textForeground" flex={1}>
                                {t(item.label)}
                              </Text>
                            </HStack>

                            <VStack space="xs" alignItems="flex-end">
                              <Text fontSize="$sm" fontWeight="$semibold" color="$textForeground">
                                {item.count}
                              </Text>
                              <Box
                                bg="#6B7280"
                                px="$2"
                                py="$1"
                                borderRadius="$sm"
                              >
                                <Text fontSize="$xs" color="$white" fontWeight="$semibold">
                                  {item.percentage}
                                </Text>
                              </Box>
                            </VStack>
                          </HStack>
                        </Box>
                      );

                      if (isNarrow) {
                        return (
                          <VStack space="md">
                            {section.items.map(renderRow)}
                          </VStack>
                        );
                      }

                      return (
                        <HStack space="lg" alignItems="flex-start">
                          <VStack flex={1} space="md">
                            {leftItems.map(renderRow)}
                          </VStack>
                          <VStack flex={1} space="md">
                            {rightItems.map(renderRow)}
                          </VStack>
                        </HStack>
                      );
                    })()}
                  </Box>
                </Card>
              ))}
            </VStack>
          )}

          {/* Key Insights */}
          {insightsTitle && insightsItems && (
            <Card {...cardViewStyles.insightsCard}>
              <Heading {...cardViewStyles.insightsTitle}>
                {t(insightsTitle)}
              </Heading>
              <VStack space="sm" mt="$4">
                {insightsItems.map((item, index) => {
                      const dotColor = insightsDotColor ?? metricCards?.[index]?.color ?? '#2563EB';
                  return (
                    <HStack key={index} space="sm" alignItems="flex-start">
                      <Box
                        width={8}
                        height={8}
                        borderRadius={999}
                        mt={6}
                        bg={dotColor as any}
                        flexShrink={0}
                      />
                      <Text {...cardViewStyles.insightItem} flex={1}>
                        {t(item)}
                  </Text>
                    </HStack>
                  );
                })}
              </VStack>
            </Card>
              )}
            </>
          )}
        </VStack>
      )}

      {activeTab === 'graphs' && (
        <Box {...cardViewStyles.graphsContainer}>
          <DashboardGraphs
            blocks={graphsBlocks}
            fallbackPlaceholderKey={
              graphsPlaceholderKey || 'admin.participantEnrollment.graphs.placeholder'
            }
          />
        </Box>
      )}
    </VStack>
  );
};

export default CardView;
