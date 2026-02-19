import React from 'react';
import { ScrollView } from 'react-native';
import { VStack, HStack, Box, Card, Heading, Text } from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import SimpleLineChart from '@components/charts/SimpleLineChart';
import SimpleBarChart from '@components/charts/SimpleBarChart';
import SimplePieChart from '@components/charts/SimplePieChart';
import SimpleMultiLineChart from '@components/charts/SimpleMultiLineChart';
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
  return (
    <Box
      flex={1}
      minWidth={180}
      bg="$backgroundLight50"
      borderRadius="$lg"
      px="$4"
      py="$4"
      borderWidth={1}
      borderColor="$borderLight200"
    >
      <Text fontSize="$sm" color="$textLight600">
        {card.title}
      </Text>
      <HStack alignItems="flex-end" justifyContent="space-between" mt="$2">
        <Text fontSize="$2xl" fontWeight="$semibold" color={card.valueColor as any}>
          {card.value}
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
  const chartsToRender = block.charts && block.charts.length > 0 ? block.charts : [block.chart];

  const extrasTop = (block.extras || []).filter(e => (e as any).placement !== 'bottom');
  const extrasBottom = (block.extras || []).filter(e => (e as any).placement === 'bottom');

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
                <Text fontSize="$xs" color="$textLight600">
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
                  <Text fontSize="$xs" color="$textLight600">
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
                    <Text fontSize="$xs" color="$textLight600">
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
                <Text fontSize="$xs" color="$textLight600">
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
                  <Text fontSize="$xs" color={it.subtitleColor ? (it.subtitleColor as any) : '$textLight600'}>
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
                <Text fontSize="$xs" color="$textLight600" flex={1}>
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
          bg="$backgroundLight50"
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
                <Text fontSize="$xs" color="$textLight600">
                  {it.title}
                </Text>
                <Text
                  fontSize="$lg"
                  fontWeight="$semibold"
                  color={it.valueColor ? (it.valueColor as any) : '$textForeground'}
                  mt="$2"
                >
                  {it.value}
                </Text>
                {it.subtitle ? (
                  <Text fontSize="$xs" color="$textLight600" mt="$1">
                    {it.subtitle}
                  </Text>
                ) : null}
              </Box>
            ))}
          </HStack>
        </Box>
      );
    }

    return null;
  };

  const StatContent = block.statCards && block.statCards.length > 0 ? (
    block.statLayout === 'bar' ? (
      <Box
        mt="$3"
        bg={block.statBarBg ? (block.statBarBg as any) : '$backgroundLight50'}
        borderRadius="$lg"
        px="$4"
        py="$4"
        borderWidth={1}
        borderColor="$borderLight200"
      >
        <HStack space="lg" alignItems="center" justifyContent="space-between" flexWrap="wrap">
          {block.statCards.map(sc => (
            <VStack key={sc.id} space="xs" flex={1} minWidth={180}>
              <Text fontSize="$xs" color="$textLight600">
                {sc.title}
              </Text>
              <Text
                fontSize="$lg"
                fontWeight="$semibold"
                color={sc.valueColor ? (sc.valueColor as any) : '$textForeground'}
              >
                {sc.value}
              </Text>
              {sc.badgeText ? (
                <Box
                  alignSelf="flex-start"
                  bg={sc.badgeBg ? (sc.badgeBg as any) : '#16A34A'}
                  px="$2"
                  py="$1"
                  borderRadius="$sm"
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
            </VStack>
          ))}
        </HStack>
      </Box>
    ) : (
      <HStack space="md" flexWrap="wrap" mt="$3">
        {block.statCards.map(sc => (
          <GraphStatCard key={sc.id} card={sc} />
        ))}
      </HStack>
    )
  ) : null;

  const renderChart = (chart: any, idx: number) => {
    return (
      <Box key={`${block.id}-chart-${idx}`} mt="$3" width="100%">
        <Text fontSize="$sm" fontWeight="$semibold" color="$textForeground" mb="$2">
          {chart.title}
        </Text>

        {chart.kind === 'line' && chart.line ? (
          <SimpleLineChart
            data={chart.line.data}
            title={chart.title}
            color={chart.line.color}
            yAxisLabel={chart.line.yAxisLabel}
            valueLabel={chart.line.valueLabel}
          />
        ) : null}

        {chart.kind === 'multiLine' && chart.multiLine ? (
          <SimpleMultiLineChart
            title={chart.title}
            yAxisLabel={chart.multiLine.yAxisLabel}
            series={chart.multiLine.series as any}
          />
        ) : null}

        {chart.kind === 'bar' && chart.bar ? (
          <SimpleBarChart
            data={chart.bar.data}
            title={chart.title}
            orientation={chart.bar.orientation}
            height={chart.bar.height}
          />
        ) : null}

        {chart.kind === 'pie' && chart.pie ? (
          <SimplePieChart data={chart.pie.data} title={chart.title} />
        ) : null}

        {chart.kind === 'placeholder' ? (
          <Text fontSize="$sm" color="$textLight600">
            {chart.placeholderText || t(fallbackPlaceholderKey)}
          </Text>
        ) : null}
      </Box>
    );
  };

  return (
    <Card p="$4" borderRadius="$lg" borderWidth={1} borderColor="$borderLight200">
      <VStack space="sm" width="100%">
        <Heading size="sm">{t(block.sectionTitle)}</Heading>
        {block.sectionMeta ? (
          <Text fontSize="$xs" color="$textLight600">
            {t(block.sectionMeta)}
          </Text>
        ) : null}

        {block.statPosition === 'bottom' ? null : StatContent}

        {extrasTop.map(renderExtra)}

        {chartsToRender.map((c, idx) => renderChart(c, idx))}

        {extrasBottom.map(renderExtra)}

        {block.statPosition === 'bottom' ? StatContent : null}
      </VStack>
    </Card>
  );
};

const DashboardGraphs: React.FC<DashboardGraphsProps> = ({
  blocks,
  fallbackPlaceholderKey,
}) => {
  const { t } = useLanguage();

  if (!blocks || blocks.length === 0) {
    return (
      <VStack space="md" width="100%" alignItems="center" py="$4" px="$2">
        <Text>{t(fallbackPlaceholderKey)}</Text>
      </VStack>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={true} style={{ width: '100%' }}>
      <VStack space="lg" width="100%" alignItems="stretch" py="$2" px="$2">
        {blocks.map(block => (
          block.kind === 'reportSection' ? (
            <ReportSection
              key={block.id}
              block={block}
              fallbackPlaceholderKey={fallbackPlaceholderKey}
            />
          ) : block.kind === 'groupHeader' ? (
            <Box
              key={block.id}
              bg={(block as any).bg ? ((block as any).bg as any) : '$backgroundLight50'}
              borderRadius="$lg"
              px="$4"
              py="$3"
              borderWidth={1}
              borderColor="$borderLight200"
            >
              <Heading size="xs" color={(block as any).textColor ? ((block as any).textColor as any) : '$textForeground'}>
                {t((block as any).title)}
              </Heading>
            </Box>
          ) : (
            <Card key={block.id} p="$4" borderRadius="$lg" borderWidth={1} borderColor="$borderLight200">
              <VStack space="sm" width="100%">
                {'title' in block && block.title ? <Heading size="md">{t(block.title as any)}</Heading> : null}
                {'description' in block && block.description ? (
                  <Text fontSize="$sm" color="$textLight600">
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

