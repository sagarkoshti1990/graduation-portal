import React, { useMemo, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import Svg, { Line, Circle, Text as SvgText, G, Path } from 'react-native-svg';
import { Box, VStack, HStack, Text, Heading } from '@ui';
import { usePlatform } from '@utils/platform';

export interface MultiLineChartPoint {
  x: string; // month label
  y: number;
}

export interface MultiLineChartSeries {
  id: string;
  label: string;
  color: string;
  dashArray?: string; // e.g. "4 4"
  data: MultiLineChartPoint[];
}

export interface SimpleMultiLineChartProps {
  title?: string;
  height?: number;
  yAxisLabel?: string;
  series: MultiLineChartSeries[];
}

const SimpleMultiLineChart: React.FC<SimpleMultiLineChartProps> = ({
  title = 'Trend',
  height = 300,
  yAxisLabel,
  series,
}) => {
  const { isWeb } = usePlatform();
  const windowDimensions = useWindowDimensions();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [containerWidth, setContainerWidth] = useState(windowDimensions.width - 100);

  const width = Math.min(containerWidth, 1200);
  const padding = { top: 20, right: 20, bottom: 50, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const xLabels = useMemo(() => {
    const first = series[0]?.data ?? [];
    return first.map(p => p.x);
  }, [series]);

  const allValues = useMemo(() => {
    const vals: number[] = [];
    series.forEach(s => s.data.forEach(p => vals.push(p.y)));
    return vals;
  }, [series]);

  const maxValue = Math.max(...allValues, 0);
  const minValue = Math.min(...allValues, 0);
  const valueRange = maxValue - minValue || 1;

  const xStep = chartWidth / (xLabels.length - 1 || 1);

  const yTicks = 5;
  const yTickValues = Array.from({ length: yTicks }, (_, i) => {
    return minValue + (valueRange * i) / (yTicks - 1);
  });

  const getPointXY = (idx: number, y: number) => {
    const x = padding.left + idx * xStep;
    const yy = padding.top + chartHeight - ((y - minValue) / valueRange) * chartHeight;
    return { x, y: yy };
  };

  const handleLeave = () => setHoveredIndex(null);

  return (
    <VStack space="sm" width="100%" alignItems="center" mb="$6">
      <Heading size="md" mb="$2">
        {title}
      </Heading>

      <Box
        width="100%"
        alignItems="center"
        position="relative"
        onLayout={(e: any) => {
          const layoutWidth = e.nativeEvent.layout.width;
          if (layoutWidth > 0 && layoutWidth !== containerWidth) {
            setContainerWidth(layoutWidth);
          }
        }}
      >
        <Box
          {...(isWeb && {
            // @ts-ignore web-only mouse events
            onMouseMove: (e: any) => {
              const rect = e.currentTarget?.getBoundingClientRect?.();
              if (!rect) return;
              const mouseX = e.clientX - rect.left;

              let closestIndex = -1;
              let minDist = 28;
              xLabels.forEach((_, idx) => {
                const px = padding.left + idx * xStep;
                const dist = Math.abs(mouseX - px);
                if (dist < minDist) {
                  minDist = dist;
                  closestIndex = idx;
                }
              });

              setHoveredIndex(closestIndex >= 0 ? closestIndex : null);
            },
            onMouseLeave: handleLeave,
            style: { cursor: 'pointer' },
          })}
        >
          <Svg width={width} height={height}>
            {/* Grid */}
            {yTickValues.map((val, i) => {
              const y = padding.top + chartHeight - ((val - minValue) / valueRange) * chartHeight;
              return (
                <Line
                  key={`grid-${i}`}
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + chartWidth}
                  y2={y}
                  stroke="#E5E7EB"
                  strokeWidth="1"
                />
              );
            })}

            {/* Axes */}
            <Line
              x1={padding.left}
              y1={padding.top}
              x2={padding.left}
              y2={padding.top + chartHeight}
              stroke="#9CA3AF"
              strokeWidth="2"
            />
            <Line
              x1={padding.left}
              y1={padding.top + chartHeight}
              x2={padding.left + chartWidth}
              y2={padding.top + chartHeight}
              stroke="#9CA3AF"
              strokeWidth="2"
            />

            {/* Y labels */}
            {yTickValues.map((val, i) => {
              const y = padding.top + chartHeight - ((val - minValue) / valueRange) * chartHeight;
              return (
                <SvgText
                  key={`y-${i}`}
                  x={padding.left - 10}
                  y={y + 5}
                  fontSize="12"
                  fill="#6B7280"
                  textAnchor="end"
                >
                  {Math.round(val)}
                </SvgText>
              );
            })}

            {/* X labels */}
            {xLabels.map((lab, i) => {
              const x = padding.left + i * xStep;
              const y = padding.top + chartHeight + 25;
              const showLabel = xLabels.length <= 12 || i % 2 === 0;
              return showLabel ? (
                <SvgText
                  key={`x-${i}`}
                  x={x}
                  y={y}
                  fontSize="11"
                  fill="#6B7280"
                  textAnchor="middle"
                >
                  {lab}
                </SvgText>
              ) : null;
            })}

            {/* Series paths */}
            {series.map(s => {
              const path = s.data
                .map((p, idx) => {
                  const xy = getPointXY(idx, p.y);
                  return `${idx === 0 ? 'M' : 'L'} ${xy.x},${xy.y}`;
                })
                .join(' ');
              return (
                <Path
                  key={`path-${s.id}`}
                  d={path}
                  stroke={s.color}
                  strokeWidth="2.5"
                  fill="none"
                  strokeDasharray={s.dashArray as any}
                />
              );
            })}

            {/* Interaction points */}
            {xLabels.map((_, idx) => (
              <G key={`hover-${idx}`}>
                {series.map(s => {
                  const p = s.data[idx];
                  if (!p) return null;
                  const xy = getPointXY(idx, p.y);
                  const isActive = hoveredIndex === idx;
                  return (
                    <G key={`${s.id}-${idx}`}>
                      <Circle
                        cx={xy.x}
                        cy={xy.y}
                        r="12"
                        fill="transparent"
                        onPress={() => setHoveredIndex(idx)}
                      />
                      <Circle
                        cx={xy.x}
                        cy={xy.y}
                        r={isActive ? '4.5' : '3'}
                        fill={s.color}
                        opacity={isActive ? 1 : 0.85}
                      />
                    </G>
                  );
                })}
              </G>
            ))}
          </Svg>
        </Box>

        {/* Tooltip */}
        {hoveredIndex !== null && xLabels[hoveredIndex] ? (
          <Box
            position="absolute"
            left={padding.left + hoveredIndex * xStep - 60}
            top={padding.top + 10}
            bg="$white"
            borderWidth={1}
            borderColor="$borderLight300"
            borderRadius="$md"
            p="$2"
            px="$3"
            shadowColor="$black"
            shadowOffset={{ width: 0, height: 2 } as any}
            shadowOpacity={0.1}
            shadowRadius={4}
            elevation={3}
            zIndex={1000}
            pointerEvents="none"
            minWidth={140}
          >
            <VStack space="xs">
              <Text fontSize="$sm" fontWeight="$semibold" color="$textForeground">
                {xLabels[hoveredIndex]}
              </Text>
              {series.map(s => (
                <HStack key={`tt-${s.id}`} space="sm" alignItems="center">
                  <Box width={8} height={8} borderRadius={999} bg={s.color as any} />
                  <Text fontSize="$xs" color="$textLight600" flex={1}>
                    {s.label}
                  </Text>
                  <Text fontSize="$xs" fontWeight="$semibold" color="$textForeground">
                    {s.data[hoveredIndex]?.y ?? '-'}
                  </Text>
                </HStack>
              ))}
            </VStack>
          </Box>
        ) : null}
      </Box>

      {/* Legend */}
      <HStack space="md" flexWrap="wrap" justifyContent="center" mt="$2">
        {series.map(s => (
          <HStack key={`lg-${s.id}`} space="xs" alignItems="center">
            <Box width={10} height={10} borderRadius={999} bg={s.color as any} />
            <Text fontSize="$xs" color="$textLight600">
              {s.label}
            </Text>
          </HStack>
        ))}
      </HStack>

      {yAxisLabel ? (
        <Text fontSize="$sm" color="$textLight600" mt="$2">
          {yAxisLabel}
        </Text>
      ) : null}
    </VStack>
  );
};

export default SimpleMultiLineChart;

