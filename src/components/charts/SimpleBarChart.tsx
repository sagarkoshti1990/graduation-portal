import React, { useMemo, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import Svg, { Rect, Text as SvgText, Line } from 'react-native-svg';
import { Box, VStack, Text } from '@ui';
import { usePlatform } from '@utils/platform';

export interface BarChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface SimpleBarChartProps {
  data: BarChartDataPoint[];
  title?: string;
  height?: number;
  defaultColor?: string;
  orientation?: 'vertical' | 'horizontal';
  variant?: 'standard' | 'progress';
  showAxes?: boolean;
  showGrid?: boolean;
  showLegend?: boolean;
  valueFormat?: 'number' | 'currencyM' | 'countPercent';
}

/**
 * Simple Bar Chart using react-native-svg
 * Works on both web and mobile (iOS/Android)
 * Responsive and full-width
 */
const SimpleBarChart: React.FC<SimpleBarChartProps> = ({
  data,
  title = 'Bar Chart',
  height = 300,
  defaultColor = '#10B981',
  orientation = 'vertical',
  variant = 'standard',
  showAxes,
  showGrid,
  showLegend,
  valueFormat,
}) => {
  const { isWeb, isMobile } = usePlatform();
  const windowDimensions = useWindowDimensions();
  const [containerWidth, setContainerWidth] = useState(Math.max(windowDimensions.width, 0));
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  
  // Use full available container width (end-to-end charts on wide screens)
  const width = containerWidth;
  const isNarrow = isMobile && containerWidth > 0 && containerWidth < 420;
  const resolvedShowAxes = showAxes ?? variant === 'standard';
  const resolvedShowGrid = showGrid ?? variant === 'standard';
  const resolvedShowLegend = showLegend ?? (variant === 'standard' && orientation === 'horizontal');

  const padding =
    orientation === 'horizontal'
      ? variant === 'progress'
        // extra right space so value labels can align in a right-side column
        ? {
            top: 18,
            right: isNarrow ? 86 : 120,
            bottom: 18,
            left: isNarrow ? 140 : 220,
          }
        : {
            top: 30,
            right: isNarrow ? 20 : 40,
            bottom: 56,
            left: isNarrow ? 110 : 150,
          } // extra room for x-ticks + legend
      : {
          top: isNarrow ? 30 : 40,
          right: 20,
          bottom: isNarrow ? 50 : 60,
          left: isNarrow ? 48 : 60,
        };
  const chartWidth = Math.max(width - padding.left - padding.right, 1);
  const chartHeight = Math.max(height - padding.top - padding.bottom, 1);

  const maxValue = Math.max(...data.map(d => d.value), 0);
  const isCurrencyLike = /zar|asset value/i.test(title || '');
  const totalValue = useMemo(() => data.reduce((s, d) => s + (d.value || 0), 0) || 1, [data]);

  // "Nice" domain for currency-like charts so ticks look like the reference (e.g. 0, 1.5, 3.0, 4.5, 6.0)
  const niceStep = (raw: number) => {
    if (!raw || raw <= 0) return 1;
    const exp = Math.floor(Math.log10(raw));
    const base = raw / Math.pow(10, exp);
    const niceBase =
      base <= 1 ? 1 :
      base <= 1.5 ? 1.5 :
      base <= 2 ? 2 :
      base <= 2.5 ? 2.5 :
      base <= 5 ? 5 : 10;
    return niceBase * Math.pow(10, exp);
  };

  const currencyTicks = 4; // -> 5 labels including 0
  const step = isCurrencyLike ? niceStep(maxValue / currencyTicks) : 0;
  const domainMax =
    variant === 'progress'
      ? totalValue
      : isCurrencyLike
        ? Math.max(step * Math.ceil(maxValue / step), step)
        : maxValue || 1;

  const formatValue = (v: number) => {
    const fmt = valueFormat || (isCurrencyLike ? 'currencyM' : 'number');
    if (fmt === 'currencyM') return `R${v.toFixed(1)}M`;
    if (fmt === 'countPercent') {
      const pct = Math.round((v / totalValue) * 100);
      return `${v.toLocaleString()} (${pct}%)`;
    }
    return `${Math.round(v)}`;
  };

  const legendText = isCurrencyLike
    ? /provider/i.test(title || '')
      ? 'Total Asset Value (ZAR)'
      : 'Asset Value (ZAR)'
    : title;

  const barWidth = Math.max(chartWidth / Math.max(data.length, 1) - 10, 20);
  const barSpacing = 10;
  const horizontalBarHeight = Math.max((chartHeight / Math.max(data.length, 1)) - 10, 18);
  const horizontalBarSpacing = 10;
  const gridStroke = '#E5E7EB';
  const gridDash = '3 3';
  const gridVerticalCount = isCurrencyLike && orientation === 'horizontal' ? currencyTicks : 8;
  const hoverBandColor = '#D1D5DB'; // light gray like reference
  const trackColor = '#E5E7EB';

  const hoveredDatum = useMemo(() => {
    if (hoveredIndex === null || hoveredIndex < 0 || hoveredIndex >= data.length) return null;
    return data[hoveredIndex];
  }, [data, hoveredIndex]);

  const pickBarIndexByPoint = (x: number, y: number) => {
    // only consider hover within plot area (not margins)
    if (
      x < padding.left ||
      x > padding.left + chartWidth ||
      y < padding.top ||
      y > padding.top + chartHeight
    ) {
      return null;
    }

    if (orientation === 'horizontal') {
      for (let i = 0; i < data.length; i++) {
        const y0 = padding.top + i * (horizontalBarHeight + horizontalBarSpacing);
        const y1 = y0 + horizontalBarHeight;
        if (y >= y0 && y <= y1) return i;
      }
      return null;
    }

    // vertical
    for (let i = 0; i < data.length; i++) {
      const x0 = padding.left + i * (barWidth + barSpacing) + barSpacing / 2;
      const x1 = x0 + barWidth;
      if (x >= x0 && x <= x1) return i;
    }
    return null;
  };

  return (
    <VStack space="sm" width="100%" alignItems="center" mb={isMobile ? '$2' : '$6'}>
      {/* Chart Container */}
      <Box 
        width="100%" 
        alignItems="center"
        onLayout={(e: any) => {
          const layoutWidth = e.nativeEvent.layout.width;
          if (layoutWidth > 0 && layoutWidth !== containerWidth) {
            setContainerWidth(layoutWidth);
          }
        }}
      >
        <Box
          width={width}
          height={height}
          position="relative"
          $web-cursor={isWeb ? 'auto' : undefined}
          {...(isWeb && {
            // @ts-ignore - web-only mouse events
            onMouseMove: (e: any) => {
              const rect = e.currentTarget?.getBoundingClientRect?.();
              if (!rect) return;
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              const idx = pickBarIndexByPoint(x, y);
              setHoveredIndex(idx);
              setHoverPos(idx !== null ? { x, y } : null);
            },
            onMouseLeave: () => {
              setHoveredIndex(null);
              setHoverPos(null);
            },
          })}
      >
        <Svg width={width} height={height}>
          {orientation === 'horizontal' ? (
            <>
              {resolvedShowGrid ? (
                <>
                  {/* Faint dotted grid (horizontal + vertical) */}
                  {Array.from({ length: gridVerticalCount + 1 }).map((_, idx) => {
                    const x = padding.left + (idx * chartWidth) / gridVerticalCount;
                    return (
                      <Line
                        key={`grid-v-${idx}`}
                        x1={x}
                        y1={padding.top}
                        x2={x}
                        y2={padding.top + chartHeight}
                        stroke={gridStroke}
                        strokeWidth="1"
                        strokeDasharray={gridDash}
                      />
                    );
                  })}
                  {data.map((_, i) => {
                    const y =
                      padding.top +
                      i * (horizontalBarHeight + horizontalBarSpacing) +
                      horizontalBarHeight / 2;
                    return (
                      <Line
                        key={`grid-h-${i}`}
                        x1={padding.left}
                        y1={y}
                        x2={padding.left + chartWidth}
                        y2={y}
                        stroke={gridStroke}
                        strokeWidth="1"
                        strokeDasharray={gridDash}
                      />
                    );
                  })}
                </>
              ) : null}

              {/* Hover highlight band (row) */}
              {variant !== 'progress' && hoveredIndex !== null ? (
                <Rect
                  x={padding.left}
                  y={padding.top + hoveredIndex * (horizontalBarHeight + horizontalBarSpacing)}
                  width={chartWidth}
                  height={horizontalBarHeight}
                  fill={hoverBandColor}
                  opacity={0.35}
                />
              ) : null}

              {resolvedShowAxes ? (
                <>
                  {/* Y-axis (vertical) */}
                  <Line
                    x1={padding.left}
                    y1={padding.top}
                    x2={padding.left}
                    y2={padding.top + chartHeight}
                    stroke="#9CA3AF"
                    strokeWidth="2"
                  />

              {/* X-axis */}
              <Line
                x1={padding.left}
                y1={padding.top + chartHeight}
                x2={padding.left + chartWidth}
                y2={padding.top + chartHeight}
                stroke="#9CA3AF"
                strokeWidth="2"
              />
                </>
              ) : null}

              {resolvedShowAxes ? (
                <>
                  {/* X-axis tick labels */}
                  {Array.from({ length: gridVerticalCount + 1 }).map((_, idx) => {
                    const x = padding.left + (idx * chartWidth) / gridVerticalCount;
                    const tickVal = (idx / gridVerticalCount) * domainMax;
                    const label = isCurrencyLike ? `R${tickVal.toFixed(1)}M` : `${Math.round(tickVal)}`;
                    return (
                      <SvgText
                        key={`tick-${idx}`}
                        x={x}
                        y={padding.top + chartHeight + 18}
                        fontSize="10"
                        fill="#6B7280"
                        textAnchor="middle"
                      >
                        {label}
                      </SvgText>
                    );
                  })}
                </>
              ) : null}

              {/* Bars */}
              {data.map((d, i) => {
                const barW = (d.value / domainMax) * chartWidth || 0;
                const y = padding.top + i * (horizontalBarHeight + horizontalBarSpacing);
                const x = padding.left;
                const maxLabel = isNarrow
                  ? variant === 'progress'
                    ? 18
                    : 12
                  : variant === 'progress'
                    ? 34
                    : 18;
                const label = d.label.length > maxLabel ? `${d.label.slice(0, maxLabel)}…` : d.label;

                return (
                  <React.Fragment key={`hbar-${i}`}>
                    {/* Y label */}
                    <SvgText
                      x={padding.left - 8}
                      y={y + horizontalBarHeight / 2 + 4}
                      fontSize={variant === 'progress' ? '11' : '10'}
                      fill="#6B7280"
                      textAnchor="end"
                    >
                      {label}
                    </SvgText>

                    {/* Track + Bar */}
                    {variant === 'progress' ? (
                      <>
                        <Rect
                          x={x}
                          y={y + horizontalBarHeight / 2 - 3}
                          width={chartWidth}
                          height={6}
                          fill={trackColor}
                          rx={3}
                          ry={3}
                        />
                        <Rect
                          x={x}
                          y={y + horizontalBarHeight / 2 - 3}
                          width={barW}
                          height={6}
                          fill={d.color || defaultColor}
                          rx={3}
                          ry={3}
                        />
                      </>
                    ) : (
                    <Rect
                      x={x}
                      y={y}
                      width={barW}
                      height={horizontalBarHeight}
                      fill={d.color || defaultColor}
                        rx={0}
                        ry={0}
                    />
                    )}

                    {/* Value label */}
                    <SvgText
                      x={variant === 'progress' ? padding.left + chartWidth + 10 : x + barW + 6}
                      y={y + horizontalBarHeight / 2 + 4}
                      fontSize={variant === 'progress' ? '11' : '10'}
                      fill="#374151"
                      textAnchor="start"
                      fontWeight="600"
                    >
                        {formatValue(d.value)}
                    </SvgText>
                  </React.Fragment>
                );
              })}

              {resolvedShowLegend ? (
                <>
                  {/* Legend (bottom center) */}
                  <Rect
                    x={padding.left + chartWidth / 2 - 50}
                    y={height - 20}
                    width={12}
                    height={12}
                    fill={(data[0]?.color as any) || defaultColor}
                    rx={0}
                    ry={0}
                  />
                  <SvgText
                    x={padding.left + chartWidth / 2 - 32}
                    y={height - 10}
                    fontSize="11"
                    fill={(data[0]?.color as any) || defaultColor}
                    textAnchor="start"
                    fontWeight="500"
                  >
                    {legendText}
                  </SvgText>
                </>
              ) : null}
            </>
          ) : (
            <>
              {/* Faint dotted grid (horizontal + vertical) */}
              {Array.from({ length: gridVerticalCount + 1 }).map((_, idx) => {
                const x = padding.left + (idx * chartWidth) / gridVerticalCount;
                return (
                  <Line
                    key={`grid-v-${idx}`}
                    x1={x}
                    y1={padding.top}
                    x2={x}
                    y2={padding.top + chartHeight}
                    stroke={gridStroke}
                    strokeWidth="1"
                    strokeDasharray={gridDash}
                  />
                );
              })}
              {Array.from({ length: 6 }).map((_, idx) => {
                const y = padding.top + (idx * chartHeight) / 5;
                return (
                  <Line
                    key={`grid-h-${idx}`}
                    x1={padding.left}
                    y1={y}
                    x2={padding.left + chartWidth}
                    y2={y}
                    stroke={gridStroke}
                    strokeWidth="1"
                    strokeDasharray={gridDash}
                  />
                );
              })}

              {/* Hover highlight band (column) */}
              {hoveredIndex !== null ? (
                <Rect
                  x={padding.left + hoveredIndex * (barWidth + barSpacing) + barSpacing / 2}
                  y={padding.top}
                  width={barWidth}
                  height={chartHeight}
                  fill={hoverBandColor}
                  opacity={0.18}
                />
              ) : null}

              {/* Y-axis */}
              <Line
                x1={padding.left}
                y1={padding.top}
                x2={padding.left}
                y2={padding.top + chartHeight}
                stroke="#9CA3AF"
                strokeWidth="2"
              />

              {/* X-axis */}
              <Line
                x1={padding.left}
                y1={padding.top + chartHeight}
                x2={padding.left + chartWidth}
                y2={padding.top + chartHeight}
                stroke="#9CA3AF"
                strokeWidth="2"
              />

              {/* Bars */}
              {data.map((d, i) => {
                const barHeight = (d.value / domainMax) * chartHeight || 0;
                const x = padding.left + i * (barWidth + barSpacing) + barSpacing / 2;
                const y = padding.top + chartHeight - barHeight;

                return (
                  <React.Fragment key={`bar-${i}`}>
                    <Rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      fill={d.color || defaultColor}
                      rx={0}
                      ry={0}
                    />

                    <SvgText
                      x={x + barWidth / 2}
                      y={y - 5}
                      fontSize="11"
                      fill="#374151"
                      textAnchor="middle"
                      fontWeight="600"
                    >
                      {formatValue(d.value)}
                    </SvgText>

                    <SvgText
                      x={x + barWidth / 2}
                      y={padding.top + chartHeight + 20}
                      fontSize="10"
                      fill="#6B7280"
                      textAnchor="middle"
                    >
                      {d.label.substring(0, 3)}
                    </SvgText>
                  </React.Fragment>
                );
              })}
            </>
          )}
        </Svg>

          {/* Hover tooltip */}
          {isWeb && hoveredDatum && hoverPos ? (
            <Box
              position="absolute"
              left={Math.min(Math.max(hoverPos.x + 12, 8), width - 320)}
              top={Math.min(Math.max(hoverPos.y - 30, 8), height - 90)}
              bg="$white"
              borderWidth={1}
              borderColor="$borderLight300"
              borderRadius="$md"
              p="$3"
              shadowColor="$black"
              shadowOffset={{ width: 0, height: 2 } as any}
              shadowOpacity={0.08}
              shadowRadius={6}
              elevation={3}
              pointerEvents="none"
            >
              <Text fontSize="$md" fontWeight="$semibold" color="$textForeground">
                {hoveredDatum.label}
              </Text>
              <Text fontSize="$sm" color={hoveredDatum.color || defaultColor}>
                {`Value: ${hoveredDatum.value}`}
              </Text>
            </Box>
          ) : null}
        </Box>
      </Box>
    </VStack>
  );
};

export default SimpleBarChart;
