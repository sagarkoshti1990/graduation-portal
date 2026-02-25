import React, { useState } from 'react';
import { ScrollView, Switch } from 'react-native';
import { VStack, HStack, Box, Card, Heading, Text } from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import DataTable from '@components/DataTable';
import SimpleLineChart from '@components/charts/SimpleLineChart';
import SimpleBarChart from '@components/charts/SimpleBarChart';
import SimplePieChart from '@components/charts/SimplePieChart';
import SimpleMultiLineChart from '@components/charts/SimpleMultiLineChart';
import SimpleGroupedBarChart from '@components/charts/SimpleGroupedBarChart';
import { usePlatform } from '@utils/platform';
import type {
  DashboardGraphBlock,
  DashboardGraphReportSectionBlock,
  DashboardGraphStatCard,
  DashboardGraphExtraBlock,
} from '@app-types/dashboardGraphs';

interface DashboardGraphsProps {
  blocks?: DashboardGraphBlock[];
  fallbackPlaceholderKey: string; // translation key
}

const GraphStatCard: React.FC<{ card: DashboardGraphStatCard }> = ({ card }) => {
  const valueStr = String(card.value ?? '');
  // Keep large font for numeric KPIs (e.g., "2,718") but use 18px for text values (e.g., "Monthly tracking")
  const isNumericLike = /^[\d,.\s%]+$/.test(valueStr.trim());
  return (
    <Box
      flex={1}
      minWidth={180}
      bg="$bgSidebar"
      borderRadius="$lg"
      px="$4"
      py="$4"
    
    >
      <Text fontSize="$sm" color="$textMutedForeground">
        {card.title}
      </Text>
      <HStack alignItems="flex-end" justifyContent="space-between" mt="$2">
        <Text
          fontSize={isNumericLike ? '$4xl' : '$lg'}
          fontWeight={isNumericLike ? '$semibold' : '$normal'}
          color={card.valueColor as any}
        >
          {valueStr}
        </Text>
        {card.badgeText ? (
          <Box
            bg={card.badgeBg ? (card.badgeBg as any) : '#7C2D12'}
            px="$2"
            py="$1"
            borderRadius="$sm"
          >
            <Text fontSize="$xs" fontWeight="$semibold" color={card.badgeTextColor ? (card.badgeTextColor as any) : '$white'}>
              {card.badgeText}
            </Text>
          </Box>
        ) : null}
      </HStack>
      {card.subtitle ? (
        <Text fontSize="$xs" color="$textMutedForeground" mt="$1">
          {card.subtitle}
        </Text>
      ) : null}
    </Box>
  );
};

const ReportSection: React.FC<{
  block: DashboardGraphReportSectionBlock;
  fallbackPlaceholderKey: string;
}> = ({ block, fallbackPlaceholderKey }) => {
  const { t } = useLanguage();
  const { isMobile } = usePlatform();
  const [trendEnabled, setTrendEnabled] = useState<boolean>(
    block.headerToggle?.defaultValue ?? true
  );
  const variant = block.headerToggle ? (trendEnabled ? block.trend : block.summary) : undefined;

  const resolvedStatLayout = variant?.statLayout ?? block.statLayout;
  const resolvedStatBarBg = variant?.statBarBg ?? block.statBarBg;
  const resolvedStatPosition = variant?.statPosition ?? block.statPosition;
  const resolvedStatCards = variant?.statCards ?? block.statCards;
  const resolvedExtras = variant?.extras ?? block.extras;
  const resolvedChartLayout = variant?.chartLayout ?? block.chartLayout ?? 'single';

  const resolvedCharts = (() => {
    if (variant && 'chart' in variant && variant.chart === null) return [] as any[];
    const vCharts = variant?.charts && variant.charts.length > 0 ? variant.charts : undefined;
    const vChart = variant?.chart ?? undefined;
    if (vCharts) return vCharts;
    if (vChart) return [vChart];
    if (block.charts && block.charts.length > 0) return block.charts;
    return [block.chart];
  })();

  const extrasTop = (resolvedExtras || []).filter(e => (e as any).placement !== 'bottom');
  const extrasBottom = (resolvedExtras || []).filter(e => (e as any).placement === 'bottom');

  const renderExtra = (extra: DashboardGraphExtraBlock) => {
    if (extra.kind === 'kpiRow') {
      return (
        <Box
          key={extra.id}
          mt="$3"
          bg={extra.bg ? (extra.bg as any) : '$backgroundLight50'}
          borderRadius="$lg"
          px="$4"
          py="$4"
          borderWidth={1}
          borderColor="$borderLight200"
        >
          {extra.title ? (
            <Text fontSize="$sm" fontWeight="$semibold" color="$textForeground" mb="$3">
              {extra.title}
            </Text>
          ) : null}
          <HStack space="lg" alignItems="flex-start" justifyContent="space-between" flexWrap="wrap">
            {extra.items.map(it => (
              <VStack key={it.id} space="xs" flex={1} minWidth={160}>
                <Text fontSize="$xs" color="$textMutedForeground">
                  {it.label}
                </Text>
                <Text
                  fontSize="$sm"
                  fontWeight="$semibold"
                  color={it.valueColor ? (it.valueColor as any) : '$textForeground'}
                >
                  {it.value}
                </Text>
                {it.subValue ? (
                  <Text fontSize="$xs" color="$textMutedForeground">
                    {it.subValue}
                  </Text>
                ) : null}
              </VStack>
            ))}
          </HStack>
        </Box>
      );
    }

    if (extra.kind === 'kvColumns') {
      return (
        <HStack key={extra.id} space="md" flexWrap="wrap" mt="$3">
          {extra.columns.map(col => (
            <Box
              key={col.id}
              flex={1}
              minWidth={220}
              bg="$backgroundLight50"
              borderRadius="$lg"
              px="$4"
              py="$4"
              borderWidth={1}
              borderColor="$borderLight200"
            >
              <Text fontSize="$sm" fontWeight="$semibold" color="$textForeground" mb="$2">
                {col.title}
              </Text>
              <VStack space="xs">
                {col.items.map(item => (
                  <HStack key={item.id} justifyContent="space-between" alignItems="center">
                    <Text fontSize="$xs" color="$textMutedForeground">
                      {item.label}
                    </Text>
                    <Text
                      fontSize="$xs"
                      fontWeight="$semibold"
                      color={item.valueColor ? (item.valueColor as any) : '$textForeground'}
                    >
                      {item.value}
                    </Text>
                  </HStack>
                ))}
              </VStack>
            </Box>
          ))}
        </HStack>
      );
    }

    if (extra.kind === 'calloutRow') {
      return (
        <Box
          key={extra.id}
          mt="$3"
          bg={extra.bg ? (extra.bg as any) : '#EFF6FF'}
          borderRadius="$lg"
          px="$4"
          py="$4"
          borderWidth={1}
          borderColor="$borderLight200"
        >
          <Text fontSize="$sm" fontWeight="$semibold" color="$textForeground" mb="$3">
            {extra.title}
          </Text>
          <HStack space="lg" alignItems="flex-start" justifyContent="space-between" flexWrap="wrap">
            {extra.items.map(it => (
              <VStack key={it.id} space="xs" flex={1} minWidth={180} alignItems="center">
                <Text fontSize="$xs" color="$textMutedForeground">
                  {it.label}
                </Text>
                <Text
                  fontSize="$lg"
                  fontWeight="$semibold"
                  color={it.valueColor ? (it.valueColor as any) : '$textForeground'}
                >
                  {it.value}
                </Text>
                {it.subtitle ? (
                  <Text fontSize="$xs" color={it.subtitleColor ? (it.subtitleColor as any) : '$textMutedForeground'}>
                    {it.subtitle}
                  </Text>
                ) : null}
              </VStack>
            ))}
          </HStack>
        </Box>
      );
    }

    if (extra.kind === 'bullets') {
      return (
        <Box
          key={extra.id}
          mt="$3"
          bg="$backgroundLight50"
          borderRadius="$lg"
          px="$4"
          py="$4"
          borderWidth={1}
          borderColor="$borderLight200"
        >
          {extra.title ? (
            <Text fontSize="$sm" fontWeight="$semibold" color="$textForeground" mb="$2">
              {extra.title}
            </Text>
          ) : null}
          <VStack space="sm">
            {extra.items.map(it => (
              <HStack key={it.id} space="sm" alignItems="flex-start">
                <Box
                  width={8}
                  height={8}
                  borderRadius={999}
                  bg={it.dotColor ? (it.dotColor as any) : '$primary600'}
                  mt="$1.5"
                />
                <Text fontSize="$xs" color="$textMutedForeground" flex={1}>
                  {it.text}
                </Text>
              </HStack>
            ))}
          </VStack>
        </Box>
      );
    }

    if (extra.kind === 'tiles') {
      return (
        <Box
          key={extra.id}
          mt="$3"
          bg="transparent"
          borderRadius="$0"
          px="$0"
          py="$0"
          borderWidth={0}
          borderColor="transparent"
        >
          {extra.title ? (
            <Text fontSize="$sm" fontWeight="$semibold" color="$textForeground" mb="$3">
              {extra.title}
            </Text>
          ) : null}
          <HStack space="md" flexWrap="wrap">
            {extra.items.map(it => (
              <Box
                key={it.id}
                flex={1}
                minWidth={200}
                bg={it.bg ? (it.bg as any) : '$backgroundLight50'}
                borderRadius="$lg"
                px="$4"
                py="$4"
                borderWidth={1}
                borderColor={it.borderColor ? (it.borderColor as any) : '$borderLight200'}
              >
                <Text
                  fontSize="$xs"
                  color="$textMutedForeground"
                  textAlign={it.align === 'center' ? 'center' : 'left'}
                >
                  {it.title}
                </Text>
                <Text
                  fontSize="$lg"
                  fontWeight="$semibold"
                  color={it.valueColor ? (it.valueColor as any) : '$textForeground'}
                  mt="$2"
                  textAlign={it.align === 'center' ? 'center' : 'left'}
                >
                  {it.value}
                </Text>
                {it.badgeText ? (
                  <Box
                    alignSelf={it.align === 'center' ? 'center' : 'flex-start'}
                    bg={it.badgeBg ? (it.badgeBg as any) : '#6B7280'}
                    px="$3"
                    py="$1"
                    borderRadius="$sm"
                    mt="$2"
                  >
                    <Text
                      fontSize="$xs"
                      fontWeight="$semibold"
                      color={it.badgeTextColor ? (it.badgeTextColor as any) : '$white'}
                    >
                      {it.badgeText}
                    </Text>
                  </Box>
                ) : null}
                {it.subtitle ? (
                  <Text
                    fontSize="$xs"
                    color="$textMutedForeground"
                    mt="$1"
                    textAlign={it.align === 'center' ? 'center' : 'left'}
                  >
                    {it.subtitle}
                  </Text>
                ) : null}
              </Box>
            ))}
          </HStack>
        </Box>
      );
    }

    if (extra.kind === 'dataTable') {
      const columns = (extra.columns || []).map(col => ({
        key: col.key,
        label: col.label,
        flex: col.flex,
        width: col.width,
        align: col.align,
        // Force 14px table typography in graphs tab (match UI requirement)
        render:
          col.key === 'change'
            ? (item: any) => (
                <Text
                  fontSize="$sm"
                  fontWeight="$semibold"
                  color={
                    String(item?.[col.key] || '')
                      .trim()
                      .startsWith('+')
                      ? '#16A34A'
                      : '$textForeground'
                  }
                >
                  {String(item?.[col.key] ?? '-')}
                </Text>
              )
            : (item: any) => (
                <Text fontSize="$sm" color="$textForeground">
                  {String(item?.[col.key] ?? '-')}
                </Text>
              ),
      }));

      const rows = (extra.rows || []).map((r, idx) => ({ __rowKey: (r as any).__rowKey ?? idx, ...r }));

      return (
        <Box
          key={extra.id}
          mt="$3"
          width="100%"
        >
          {extra.title ? (
            <Text fontSize="$sm" fontWeight="$semibold" color="$textForeground" mb="$3">
              {extra.title}
            </Text>
          ) : null}
          <DataTable
            data={rows as any}
            columns={columns as any}
            getRowKey={(item: any) => String(item.__rowKey)}
            responsive={false}
            showHeader={extra.showHeader ?? true}
            minWidth={extra.minWidth ?? 900}
            _css={{
              // Remove outer border + rounding (match "flat" table request)
              _table: {
                borderRadius: 0,
                borderWidth: 0,
              },
              // Remove header background tint and header rounding
              _header: {
                _tableHeader: {
                  bg: '$white' as const,
                  borderTopLeftRadius: 0,
                  borderTopRightRadius: 0,
                },
                _thText: {
                  fontSize: '$sm',
                  fontWeight: '$medium',
                },
              },
            }}
          />
        </Box>
      );
    }

    if (extra.kind === 'note') {
      return (
        <Box
          key={extra.id}
          mt="$3"
          bg="$backgroundLight50"
          borderRadius="$lg"
          px="$4"
          py="$4"
          borderWidth={1}
          borderColor="$borderLight200"
        >
          {extra.title ? (
            <Text fontSize="$sm" fontWeight="$semibold" color="$textForeground" mb="$2">
              {extra.title}
            </Text>
          ) : null}
          <Text fontSize="$xs" color="$textMutedForeground">
            {extra.text}
          </Text>
        </Box>
      );
    }

    return null;
  };

  const StatContent = resolvedStatCards && resolvedStatCards.length > 0 ? (
    resolvedStatLayout === 'bar' ? (
      <Box mt="$3" width="100%">
        <HStack space="md" alignItems="stretch" justifyContent="space-between" flexWrap="wrap">
          {resolvedStatCards.map(sc => {
            const valueStr = String(sc.value ?? '');
            const isNumericLike = /^[\d,.\s%]+$/.test(valueStr.trim());
            return (
              <Box
                key={sc.id}
                flex={1}
                minWidth={220}
                bg="$bgSidebar"
                borderRadius="$lg"
                px="$6"
                py="$5"
              >
                <Text fontSize="$sm" color="$textMutedForeground">
                  {sc.title}
                </Text>
                <Text
                  fontSize={isNumericLike ? '$4xl' : '$lg'}
                  fontWeight={isNumericLike ? '$semibold' : '$normal'}
                  color={sc.valueColor ? (sc.valueColor as any) : '$textForeground'}
                  mt="$2"
                >
                  {valueStr}
                </Text>
                {sc.badgeText ? (
                  <Box
                    alignSelf="flex-start"
                    bg={sc.badgeBg ? (sc.badgeBg as any) : '#16A34A'}
                    px="$3"
                    py="$1.5"
                    borderRadius="$sm"
                    mt="$2"
                  >
                    <Text
                      fontSize="$xs"
                      fontWeight="$semibold"
                      color={sc.badgeTextColor ? (sc.badgeTextColor as any) : '$white'}
                    >
                      {sc.badgeText}
                    </Text>
                  </Box>
                ) : null}
              </Box>
            );
          })}
        </HStack>
      </Box>
    ) : (
      <HStack space="md" flexWrap="wrap" mt="$3">
        {resolvedStatCards.map(sc => (
          <GraphStatCard key={sc.id} card={sc} />
        ))}
      </HStack>
    )
  ) : null;

  const renderChart = (chart: any, idx: number) => {
    return (
      <Box key={`${block.id}-chart-${idx}`} mt="$3" width="100%">
        {/* Keep chart title label (do not render title inside chart components to avoid duplicates) */}
        {chart?.title ? (
          <Text fontSize="$sm" fontWeight="$semibold" color="$textForeground" mb="$2">
            {chart.title}
          </Text>
        ) : null}

        {chart?.subtitle ? (
          <Text fontSize="$xs" color="$textMutedForeground" mb="$2">
            {chart.subtitle}
          </Text>
        ) : null}

        {chart.kind === 'line' && chart.line ? (
          <SimpleLineChart
            data={chart.line.data}
            title={chart.title}
            color={chart.line.color}
            yAxisLabel={chart.line.yAxisLabel}
            valueLabel={chart.line.valueLabel}
            showLegend={chart.line.showLegend}
            hideLine={chart.line.hideLine}
            yMin={chart.line.yMin}
            yMax={chart.line.yMax}
            referenceLines={chart.line.referenceLines as any}
            threshold={chart.line.threshold}
            thresholdPointColor={chart.line.thresholdPointColor}
          />
        ) : null}

        {chart.kind === 'multiLine' && chart.multiLine ? (
          <SimpleMultiLineChart
            title={chart.title}
            yAxisLabel={chart.multiLine.yAxisLabel}
            yMin={chart.multiLine.yMin}
            yMax={chart.multiLine.yMax}
            rightYAxisLabel={chart.multiLine.rightYAxisLabel}
            series={chart.multiLine.series as any}
          />
        ) : null}

        {chart.kind === 'bar' && chart.bar ? (
          <SimpleBarChart
            data={chart.bar.data}
            title={chart.title}
            orientation={chart.bar.orientation}
            height={chart.bar.height}
            variant={chart.bar.variant}
            showAxes={chart.bar.showAxes}
            showGrid={chart.bar.showGrid}
            showLegend={chart.bar.showLegend}
            valueFormat={chart.bar.valueFormat}
          />
        ) : null}

        {chart.kind === 'pie' && chart.pie ? (
          <SimplePieChart
            data={chart.pie.data}
            title={chart.title}
            variant={chart.pie.variant}
            showLabels={chart.pie.showLabels}
            showLegend={chart.pie.showLegend}
          />
        ) : null}

        {chart.kind === 'groupedBar' && chart.groupedBar ? (
          <SimpleGroupedBarChart
            title={chart.title}
            categories={chart.groupedBar.categories}
            series={chart.groupedBar.series}
            height={chart.groupedBar.height}
          />
        ) : null}

        {chart.kind === 'placeholder' ? (
          <Text fontSize="$sm" color="$textMutedForeground">
            {chart.placeholderText || t(fallbackPlaceholderKey)}
          </Text>
        ) : null}
      </Box>
    );
  };

  return (
    <Card
      p={isMobile ? '$5' : '$6'}
      borderRadius="$xl"
      borderWidth={1}
      borderColor="$borderColor"
      variant="ghost"
      bg="$white"
    >
      <VStack space="xs" width="100%">
        <HStack alignItems="flex-start" justifyContent="space-between" flexWrap="wrap">
          <VStack space="xs" flex={1} minWidth={240}>
            <Heading size="sm" fontWeight="$normal">
              {t(block.sectionTitle)}
            </Heading>
            {block.sectionMeta ? (
              <Text fontSize="$sm" color="$textMutedForeground" fontWeight="$medium">
                {t(block.sectionMeta)}
              </Text>
            ) : null}
          </VStack>

          {block.headerToggle ? (
            <HStack alignItems="center" space="sm" mt={isMobile ? '$3' : '$0'}>
              <Text fontSize="$sm" color="$textMutedForeground" fontWeight="$medium">
                {t(block.headerToggle.labelKey)}
              </Text>
              <Switch value={trendEnabled} onValueChange={setTrendEnabled} />
            </HStack>
          ) : null}
        </HStack>

        {resolvedStatPosition === 'bottom' ? null : StatContent}

        {extrasTop.map(renderExtra)}

        {resolvedChartLayout === 'twoColumn' && resolvedCharts.length === 2 ? (
          isMobile ? (
            <VStack space="lg" width="100%">
              {renderChart(resolvedCharts[0], 0)}
              {renderChart(resolvedCharts[1], 1)}
            </VStack>
          ) : (
            <HStack space="lg" alignItems="flex-start" flexWrap="wrap">
              <Box flex={1} minWidth={320} width="100%">
                {renderChart(resolvedCharts[0], 0)}
              </Box>
              <Box flex={1} minWidth={320} width="100%">
                {renderChart(resolvedCharts[1], 1)}
              </Box>
            </HStack>
          )
        ) : (
          resolvedCharts.map((c, idx) => renderChart(c, idx))
        )}

        {extrasBottom.map(renderExtra)}

        {resolvedStatPosition === 'bottom' ? StatContent : null}
      </VStack>
    </Card>
  );
};

const DashboardGraphs: React.FC<DashboardGraphsProps> = ({
  blocks,
  fallbackPlaceholderKey,
}) => {
  const { t } = useLanguage();
  const { isMobile } = usePlatform();

  const getGroupHeaderAccent = (block: any) => {
    // Prefer explicit textColor if provided.
    if (block?.textColor) return block.textColor;
    // Infer from known tinted backgrounds used in Livelihood Promotion.
    const bg = String(block?.bg || '').toLowerCase();
    if (bg === '#f5f3ff') return '#7C3AED'; // purple (entrepreneurship)
    if (bg === '#eff6ff') return '#2563EB'; // blue (employment)
    return '#111827';
  };

  if (!blocks || blocks.length === 0) {
    return (
      <VStack
        space="md"
        width="100%"
        alignItems="center"
        py="$4"
        px={isMobile ? '$0' : '$2'}
      >
        <Text>{t(fallbackPlaceholderKey)}</Text>
      </VStack>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={true} style={{ width: '100%' }}>
      <VStack
        space="lg"
        width="100%"
        alignItems="stretch"
        py={isMobile ? '$0' : '$2'}
        px={isMobile ? '$0' : '$2'}
      >
        {blocks.map(block => (
          block.kind === 'reportSection' ? (
            <ReportSection
              key={block.id}
              block={block}
              fallbackPlaceholderKey={fallbackPlaceholderKey}
            />
          ) : block.kind === 'groupHeader' ? (
            (() => {
              const accent = getGroupHeaderAccent(block as any);
              const titleStr = t((block as any).title);
              return (
              <Box
                key={block.id}
                    width="100%"
                bg={(block as any).bg ? ((block as any).bg as any) : '$backgroundLight50'}
                borderRadius="$lg"
                    px="$6"
                    py="$5"
                borderWidth={1}
                borderColor="$borderLight200"
                    position="relative"
                    overflow="hidden"
                    minHeight={64}
                    justifyContent="center"
                  >
                    {/* Left accent bar (like reference) */}
                    <Box
                      position="absolute"
                      left={0}
                      top={0}
                      bottom={0}
                      width={4}
                      bg={accent as any}
                    />
                    <Text
                      fontSize="$sm"
                      fontWeight="$semibold"
                      color={accent as any}
                      letterSpacing={0.5 as any}
                    >
                      {String(titleStr || '').toUpperCase()}
                    </Text>
              </Box>
              );
            })()
          ) : (
            <Card key={block.id} p="$4" borderRadius="$lg" borderWidth={1} borderColor="$borderLight200">
              <VStack space="sm" width="100%">
                {'title' in block && block.title ? <Heading size="md">{t(block.title as any)}</Heading> : null}
                {'description' in block && block.description ? (
                  <Text fontSize="$sm" color="$textMutedForeground">
                    {t(block.description as any)}
                  </Text>
                ) : null}

                <Box width="100%" mt="$2">
                  {block.kind === 'line' ? (
                    <SimpleLineChart
                      data={block.data}
                      title={t(block.title)}
                      color={block.color}
                      yAxisLabel={block.yAxisLabel}
                      valueLabel={block.valueLabel}
                    />
                  ) : null}

                  {block.kind === 'bar' ? (
                    <SimpleBarChart
                      data={block.data}
                      title={t(block.title)}
                      orientation={(block as any).orientation}
                      height={(block as any).height}
                    />
                  ) : null}

                  {block.kind === 'pie' ? (
                    <SimplePieChart data={block.data} title={t(block.title)} />
                  ) : null}

                  {block.kind === 'placeholder' ? (
                    <Text>{t(block.placeholderTextKey || fallbackPlaceholderKey)}</Text>
                  ) : null}
                </Box>
              </VStack>
            </Card>
          )
        ))}
      </VStack>
    </ScrollView>
  );
};

export default DashboardGraphs;

