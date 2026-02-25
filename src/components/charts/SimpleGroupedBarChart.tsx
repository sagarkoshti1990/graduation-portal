import React, { useMemo, useState } from 'react';
import { ScrollView, useWindowDimensions } from 'react-native';
import Svg, { Rect, Text as SvgText, Line } from 'react-native-svg';
import { Box, VStack, Text } from '@ui';
import { usePlatform } from '@utils/platform';

export interface GroupedBarSeries {
  id: string;
  label: string;
  color: string;
  axis?: 'left' | 'right';
  data: number[];
}

export interface SimpleGroupedBarChartProps {
  title?: string;
  categories: string[];
  series: GroupedBarSeries[];
  height?: number;
}

const SimpleGroupedBarChart: React.FC<SimpleGroupedBarChartProps> = ({
  title: _title = 'Grouped Bar Chart',
  categories,
  series,
  height = 260,
}) => {
  const { isWeb, isMobile } = usePlatform();
  const windowDimensions = useWindowDimensions();
  const [containerWidth, setContainerWidth] = useState(Math.max(windowDimensions.width, 0));
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  const padding = { top: 20, right: 52, bottom: 58, left: 52 };
  const groupCount = Math.max(categories.length, 1);
  // Mobile: allow horizontal scroll when category labels would collide.
  const minGroupWidth = 90;
  const desiredWidth = padding.left + padding.right + groupCount * minGroupWidth;
  const width = isMobile ? Math.max(containerWidth, desiredWidth) : containerWidth;
  const shouldScrollX = isMobile && width > containerWidth + 1;
  const chartWidth = Math.max(width - padding.left - padding.right, 1);
  const chartHeight = Math.max(height - padding.top - padding.bottom, 1);

  const leftSeries = useMemo(() => series.filter(s => (s.axis || 'left') === 'left'), [series]);
  const rightSeries = useMemo(() => series.filter(s => (s.axis || 'left') === 'right'), [series]);

  const leftMax = useMemo(() => {
    const vals = leftSeries.flatMap(s => s.data || []);
    return Math.max(...vals, 0) || 1;
  }, [leftSeries]);

  const rightMax = useMemo(() => {
    const vals = rightSeries.flatMap(s => s.data || []);
    return Math.max(...vals, 0) || 1;
  }, [rightSeries]);

  const gridStroke = '#E5E7EB';
  const gridDash = '3 3';
  const axisStroke = '#9CA3AF';

  const ticks = 4;
  const formatLeft = (v: number) => `${Math.round(v)}`;
  const formatRight = (v: number) => `${v.toFixed(1)}%`;

  const groupWidth = chartWidth / groupCount;
  const barGap = 8;
  const barCount = Math.max(series.length, 1);
  const barWidth = Math.max((groupWidth - barGap * 2) / barCount, 8);

  const pickGroupIndexByPoint = (x: number, y: number) => {
    if (
      x < padding.left ||
      x > padding.left + chartWidth ||
      y < padding.top ||
      y > padding.top + chartHeight
    ) {
      return null;
    }
    const idx = Math.floor((x - padding.left) / groupWidth);
    if (idx < 0 || idx >= categories.length) return null;
    return idx;
  };

  const tooltipLines = useMemo(() => {
    if (hoveredIndex === null) return null;
    const cat = categories[hoveredIndex] || '';
    const lines: Array<{ label: string; value: string; color: string }> = [];
    series.forEach(s => {
      const v = s.data?.[hoveredIndex] ?? 0;
      lines.push({
        label: s.label,
        value: (s.axis || 'left') === 'right' ? formatRight(v) : formatLeft(v),
        color: s.color,
      });
    });
    return { cat, lines };
  }, [categories, hoveredIndex, series]);

  const ChartBody = (
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
          const idx = pickGroupIndexByPoint(x, y);
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
            {/* Grid (horizontal) */}
            {Array.from({ length: ticks + 1 }).map((_, i) => {
              const y = padding.top + (i * chartHeight) / ticks;
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

            {/* Grid (vertical) */}
            {Array.from({ length: groupCount + 1 }).map((_, i) => {
              const x = padding.left + i * groupWidth;
              return (
                <Line
                  key={`grid-v-${i}`}
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

            {/* Hover highlight band */}
            {hoveredIndex !== null ? (
              <Rect
                x={padding.left + hoveredIndex * groupWidth}
                y={padding.top}
                width={groupWidth}
                height={chartHeight}
                fill="#D1D5DB"
                opacity={0.25}
              />
            ) : null}

            {/* Left axis */}
            <Line
              x1={padding.left}
              y1={padding.top}
              x2={padding.left}
              y2={padding.top + chartHeight}
              stroke={axisStroke}
              strokeWidth="2"
            />
            {/* Bottom axis */}
            <Line
              x1={padding.left}
              y1={padding.top + chartHeight}
              x2={padding.left + chartWidth}
              y2={padding.top + chartHeight}
              stroke={axisStroke}
              strokeWidth="2"
            />
            {/* Right axis */}
            <Line
              x1={padding.left + chartWidth}
              y1={padding.top}
              x2={padding.left + chartWidth}
              y2={padding.top + chartHeight}
              stroke={axisStroke}
              strokeWidth="2"
            />

            {/* Left ticks */}
            {Array.from({ length: ticks + 1 }).map((_, i) => {
              const y = padding.top + (i * chartHeight) / ticks;
              const v = leftMax - (i * leftMax) / ticks;
              return (
                <SvgText
                  key={`ltick-${i}`}
                  x={padding.left - 6}
                  y={y + 4}
                  fontSize="10"
                  fill="#6B7280"
                  textAnchor="end"
                >
                  {formatLeft(v)}
                </SvgText>
              );
            })}

            {/* Right ticks */}
            {Array.from({ length: ticks + 1 }).map((_, i) => {
              const y = padding.top + (i * chartHeight) / ticks;
              const v = rightMax - (i * rightMax) / ticks;
              return (
                <SvgText
                  key={`rtick-${i}`}
                  x={padding.left + chartWidth + 6}
                  y={y + 4}
                  fontSize="10"
                  fill="#6B7280"
                  textAnchor="start"
                >
                  {formatRight(v)}
                </SvgText>
              );
            })}

            {/* Bars */}
            {categories.map((cat, idx) => {
              return series.map((s, si) => {
                const v = s.data?.[idx] ?? 0;
                const axis = s.axis || 'left';
                const max = axis === 'right' ? rightMax : leftMax;
                const h = (v / max) * chartHeight;
                const x = padding.left + idx * groupWidth + barGap + si * barWidth;
                const y = padding.top + chartHeight - h;
                return (
                  <React.Fragment key={`bar-${idx}-${s.id}`}>
                    <Rect x={x} y={y} width={barWidth - 2} height={h} fill={s.color} />
                    {/* Value labels on top */}
                    <SvgText
                      x={x + (barWidth - 2) / 2}
                      y={y - 6}
                      fontSize="9"
                      fill="#6B7280"
                      textAnchor="middle"
                      fontWeight="600"
                    >
                      {axis === 'right' ? formatRight(v) : formatLeft(v)}
                    </SvgText>
                  </React.Fragment>
                );
              });
            })}

            {/* X labels */}
            {categories.map((cat, idx) => {
              const x = padding.left + idx * groupWidth + groupWidth / 2;
              const y = padding.top + chartHeight + 20;
              const label = cat.length > 12 ? `${cat.slice(0, 12)}…` : cat;
              return (
                <SvgText
                  key={`xlabel-${idx}`}
                  x={x}
                  y={y}
                  fontSize="9"
                  fill="#6B7280"
                  textAnchor="middle"
                  transform={`rotate(-35 ${x} ${y})`}
                >
                  {label}
                </SvgText>
              );
            })}

            {/* Legend */}
            <Rect x={padding.left + chartWidth / 2 - 70} y={height - 18} width={10} height={10} fill={series[0]?.color || '#111827'} />
            <SvgText x={padding.left + chartWidth / 2 - 56} y={height - 9} fontSize="10" fill="#6B7280" textAnchor="start">
              {series[0]?.label || ''}
            </SvgText>
            {series[1] ? (
              <>
                <Rect x={padding.left + chartWidth / 2 + 10} y={height - 18} width={10} height={10} fill={series[1].color} />
                <SvgText x={padding.left + chartWidth / 2 + 24} y={height - 9} fontSize="10" fill="#6B7280" textAnchor="start">
                  {series[1].label}
                </SvgText>
              </>
            ) : null}
          </Svg>

      {/* Hover tooltip */}
      {isWeb && hoveredIndex !== null && hoverPos && tooltipLines ? (
        <Box
          position="absolute"
          left={Math.min(Math.max(hoverPos.x + 12, 8), width - 260)}
          top={Math.min(Math.max(hoverPos.y - 30, 8), height - 110)}
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
          <Text fontSize="$sm" fontWeight="$semibold" color="$textForeground" mb="$2">
            {tooltipLines.cat}
          </Text>
          {tooltipLines.lines.map(l => (
            <Text key={l.label} fontSize="$xs" color={l.color as any}>
              {`${l.label}: ${l.value}`}
            </Text>
          ))}
        </Box>
      ) : null}
    </Box>
  );

  return (
    <VStack space="sm" width="100%" alignItems="center" mb={isMobile ? '$2' : '$6'}>
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
        {shouldScrollX ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            style={{ width: '100%' } as any}
            contentContainerStyle={{ width } as any}
          >
            {ChartBody}
          </ScrollView>
        ) : (
          ChartBody
        )}
      </Box>
    </VStack>
  );
};

export default SimpleGroupedBarChart;

