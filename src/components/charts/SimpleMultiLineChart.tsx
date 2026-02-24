import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, useWindowDimensions } from 'react-native';
import Svg, { Line, Circle, Text as SvgText, G, Path } from 'react-native-svg';
import { Box, VStack, HStack, Text } from '@ui';
import { usePlatform } from '@utils/platform';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export interface MultiLineChartPoint {
  x: string; // month label
  y: number;
}

export interface MultiLineChartSeries {
  id: string;
  label: string;
  color: string;
  dashArray?: string; // e.g. "4 4"
  axis?: 'left' | 'right';
  hidden?: boolean;
  data: MultiLineChartPoint[];
}

export interface SimpleMultiLineChartProps {
  title?: string;
  height?: number;
  yAxisLabel?: string;
  yMin?: number;
  yMax?: number;
  rightYAxisLabel?: string;
  series: MultiLineChartSeries[];
}

const SimpleMultiLineChart: React.FC<SimpleMultiLineChartProps> = ({
  title = 'Trend',
  height = 300,
  yAxisLabel,
  yMin,
  yMax,
  rightYAxisLabel,
  series,
}) => {
  const { isWeb } = usePlatform();
  const windowDimensions = useWindowDimensions();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const [containerWidth, setContainerWidth] = useState(windowDimensions.width - 100);

  // Use full available container width (end-to-end charts on wide screens)
  const width = containerWidth;
  const hasRightAxis = useMemo(() => series.some(s => s.axis === 'right' && !s.hidden), [series]);
  const padding = { top: 20, right: hasRightAxis ? 60 : 20, bottom: 50, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const xLabels = useMemo(() => {
    const first = series[0]?.data ?? [];
    return first.map(p => p.x);
  }, [series]);

  const leftValues = useMemo(() => {
    const vals: number[] = [];
    const visible = series.filter(s => !s.hidden);
    const leftSeries = visible.filter(s => s.axis !== 'right');
    const input = leftSeries.length > 0 ? leftSeries : visible;
    input.forEach(s => s.data.forEach(p => vals.push(p.y)));
    return vals;
  }, [series]);

  const rightValues = useMemo(() => {
    const vals: number[] = [];
    series
      .filter(s => s.axis === 'right' && !s.hidden)
      .forEach(s => s.data.forEach(p => vals.push(p.y)));
    return vals;
  }, [series]);

  const computedLeftMax = Math.max(...leftValues, 0);
  const computedLeftMin = Math.min(...leftValues, 0);
  const leftMaxValue = yMax !== undefined ? yMax : computedLeftMax;
  const leftMinValue = yMin !== undefined ? yMin : computedLeftMin;
  const leftRange = leftMaxValue - leftMinValue || 1;

  const rightMaxValue = Math.max(...rightValues, 0);
  const rightMinValue = Math.min(...rightValues, 0);
  const rightRange = rightMaxValue - rightMinValue || 1;

  const xStep = chartWidth / (xLabels.length - 1 || 1);

  const yTicks = 5;
  const leftHasFractional = useMemo(
    () => leftValues.some(v => Math.abs(v - Math.round(v)) > 0.0001),
    [leftValues]
  );
  const formatLeftTick = (v: number) => {
    const smallScale = Math.max(Math.abs(leftMaxValue), Math.abs(leftMinValue)) <= 1.5;
    if (smallScale || leftHasFractional) return String(parseFloat(v.toFixed(2)));
    return String(Math.round(v));
  };
  const yTickValues = Array.from({ length: yTicks }, (_, i) => {
    return leftMinValue + (leftRange * i) / (yTicks - 1);
  });
  const rightTickValues = useMemo(() => {
    if (!hasRightAxis) return [];
    return Array.from({ length: yTicks }, (_, i) => {
      return rightMinValue + (rightRange * i) / (yTicks - 1);
    });
  }, [hasRightAxis, rightMinValue, rightRange]);

  const getPointXY = (idx: number, y: number, axis: 'left' | 'right' = 'left') => {
    const x = padding.left + idx * xStep;
    const minV = axis === 'right' ? rightMinValue : leftMinValue;
    const rangeV = axis === 'right' ? rightRange : leftRange;
    const yy = padding.top + chartHeight - ((y - minV) / rangeV) * chartHeight;
    return { x, y: yy };
  };

  // Smooth curve path (Catmull-Rom spline -> Bezier), same as SimpleLineChart
  const createSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x},${pts[0].y}`;
    const d: string[] = [`M ${pts[0].x},${pts[0].y}`];

    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d.push(`C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`);
    }

    return d.join(' ');
  };

  const handleLeave = () => {
    setHoveredIndex(null);
    setHoverPos(null);
  };

  const seriesLengths = useMemo(() => {
    return series.map(s => {
      if (s.hidden) return 1;
      const pts = s.data.map((p, idx) => getPointXY(idx, p.y, s.axis === 'right' ? 'right' : 'left'));
      let len = 0;
      for (let i = 1; i < pts.length; i++) {
        const dx = pts[i].x - pts[i - 1].x;
        const dy = pts[i].y - pts[i - 1].y;
        len += Math.sqrt(dx * dx + dy * dy);
      }
      return Math.max(len, 1);
    });
  }, [series, xStep, chartHeight, chartWidth, leftMinValue, leftRange, rightMinValue, rightRange]);

  const dashOffsetsRef = useRef<Animated.Value[]>([]);
  if (dashOffsetsRef.current.length !== series.length) {
    dashOffsetsRef.current = series.map((_, idx) => new Animated.Value(seriesLengths[idx] || 1));
  }

  useEffect(() => {
    const animations = dashOffsetsRef.current.map((v, idx) => {
      v.setValue(seriesLengths[idx] || 1);
      return Animated.timing(v, {
        toValue: 0,
        duration: 900,
        delay: idx * 120,
        useNativeDriver: false,
      });
    });
    Animated.stagger(120, animations).start();
  }, [seriesLengths, series.length]);

  return (
    <VStack space="sm" width="100%" alignItems="center" mb="$6">
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
              const mouseY = e.clientY - rect.top;

              const withinX =
                mouseX >= padding.left && mouseX <= padding.left + chartWidth;
              const withinY =
                mouseY >= padding.top && mouseY <= padding.top + chartHeight;

              if (!withinX || !withinY) {
                setHoveredIndex(null);
                setHoverPos(null);
                return;
              }

              const rawIdx = Math.round((mouseX - padding.left) / xStep);
              const idx = Math.max(0, Math.min(xLabels.length - 1, rawIdx));
              setHoveredIndex(idx);
              setHoverPos({ x: mouseX, y: mouseY });
            },
            onMouseLeave: handleLeave,
            style: { cursor: 'pointer' },
          })}
        >
          <Svg width={width} height={height}>
            {/* Grid (faint dotted like reference) */}
            {yTickValues.map((val, i) => {
              const y = padding.top + chartHeight - ((val - leftMinValue) / leftRange) * chartHeight;
              return (
                <Line
                  key={`grid-h-${i}`}
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + chartWidth}
                  y2={y}
                  stroke="#D1D5DB"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
              );
            })}

            {xLabels.map((_, i) => {
              const x = padding.left + i * xStep;
              return (
                <Line
                  key={`grid-v-${i}`}
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={padding.top + chartHeight}
                  stroke={hoveredIndex === i ? '#9CA3AF' : '#D1D5DB'}
                  strokeWidth={hoveredIndex === i ? 1.5 : 1}
                  strokeDasharray={hoveredIndex === i ? '0' : '3 3'}
                  opacity={hoveredIndex === i ? 0.9 : 0.7}
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
            {hasRightAxis ? (
              <Line
                x1={padding.left + chartWidth}
                y1={padding.top}
                x2={padding.left + chartWidth}
                y2={padding.top + chartHeight}
                stroke="#9CA3AF"
                strokeWidth="2"
              />
            ) : null}
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
              const y = padding.top + chartHeight - ((val - leftMinValue) / leftRange) * chartHeight;
              return (
                <SvgText
                  key={`y-${i}`}
                  x={padding.left - 10}
                  y={y + 5}
                  fontSize="12"
                  fill="#6B7280"
                  textAnchor="end"
                >
                  {formatLeftTick(val)}
                </SvgText>
              );
            })}

            {/* Right Y labels */}
            {hasRightAxis
              ? rightTickValues.map((val, i) => {
                  const y = padding.top + chartHeight - (chartHeight * i) / (yTicks - 1);
                  return (
                    <SvgText
                      key={`y-right-${i}`}
                      x={padding.left + chartWidth + 10}
                      y={y + 5}
                      fontSize="12"
                      fill="#6B7280"
                      textAnchor="start"
                    >
                      {Math.round(val)}
                    </SvgText>
                  );
                })
              : null}

            {/* Y-axis title (vertical) */}
            {yAxisLabel ? (
              <SvgText
                x={18}
                y={padding.top + chartHeight / 2}
                fontSize="12"
                fill="#6B7280"
                textAnchor="middle"
                transform={`rotate(-90 18 ${padding.top + chartHeight / 2})`}
              >
                {yAxisLabel}
              </SvgText>
            ) : null}
            {hasRightAxis && rightYAxisLabel ? (
              <SvgText
                x={width - 18}
                y={padding.top + chartHeight / 2}
                fontSize="12"
                fill="#6B7280"
                textAnchor="middle"
                transform={`rotate(-90 ${width - 18} ${padding.top + chartHeight / 2})`}
              >
                {rightYAxisLabel}
              </SvgText>
            ) : null}

            {/* Hover crosshair (vertical) */}
            {hoveredIndex !== null ? (
              <Line
                x1={padding.left + hoveredIndex * xStep}
                y1={padding.top}
                x2={padding.left + hoveredIndex * xStep}
                y2={padding.top + chartHeight}
                stroke="#9CA3AF"
                strokeWidth="1"
                opacity={0.6}
              />
            ) : null}

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
              if (s.hidden) return null;
              const axis: 'left' | 'right' = s.axis === 'right' ? 'right' : 'left';
              const pts = s.data.map((p, idx) => getPointXY(idx, p.y, axis));
              const path = createSmoothPath(pts);
              const idx = series.findIndex(ss => ss.id === s.id);
              const length = seriesLengths[idx] || 1;
              const dashOffset = dashOffsetsRef.current[idx];
              return (
                <AnimatedPath
                  key={`path-${s.id}`}
                  d={path}
                  stroke={s.color}
                  strokeWidth="2.5"
                  fill="none"
                  strokeDasharray={s.dashArray as any}
                  {...(!s.dashArray
                    ? {
                        strokeDasharray: `${length} ${length}`,
                        strokeDashoffset: dashOffset as any,
                      }
                    : {})}
                />
              );
            })}

            {/* Interaction points */}
            {xLabels.map((_, idx) => (
              <G key={`hover-${idx}`}>
                {series.map(s => {
                  if (s.hidden) return null;
                  const p = s.data[idx];
                  if (!p) return null;
                  const xy = getPointXY(idx, p.y, s.axis === 'right' ? 'right' : 'left');
                  const isActive = hoveredIndex === idx;
                  return (
                    <G key={`${s.id}-${idx}`}>
                      <Circle
                        cx={xy.x}
                        cy={xy.y}
                        r="12"
                        fill="transparent"
                        onPress={(e: any) => {
                          setHoveredIndex(idx);
                          return e;
                        }}
                      />
                      {isActive ? (
                        <>
                          {/* Outer ring */}
                          <Circle
                            cx={xy.x}
                            cy={xy.y}
                            r="5.5"
                            fill="#FFFFFF"
                            stroke={s.color}
                            strokeWidth="2.5"
                          />
                          {/* Inner dot */}
                          <Circle cx={xy.x} cy={xy.y} r="3" fill={s.color} />
                        </>
                      ) : (
                      <Circle
                        cx={xy.x}
                        cy={xy.y}
                          r="3"
                        fill={s.color}
                          opacity={0.85}
                      />
                      )}
                    </G>
                  );
                })}
              </G>
            ))}
          </Svg>
        </Box>

        {/* Tooltip */}
        {hoveredIndex !== null && xLabels[hoveredIndex] && hoverPos ? (
          <Box
            position="absolute"
            left={Math.min(Math.max(hoverPos.x + 12, 8), width - 220)}
            top={Math.min(Math.max(hoverPos.y - 60, 8), height - 140)}
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
              {series.filter(s => !s.hidden).map(s => (
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

      {/* Y-axis label is rendered vertically inside SVG (like reference) */}
    </VStack>
  );
};

export default SimpleMultiLineChart;

