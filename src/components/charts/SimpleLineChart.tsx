import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, View, Pressable, useWindowDimensions } from 'react-native';
import Svg, { Line, Circle, Text as SvgText, G, Rect, Path } from 'react-native-svg';
import { Box, VStack, HStack, Text } from '@ui';
import { usePlatform } from '@utils/platform';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export interface LineChartDataPoint {
  month: string;
  value: number;
}

export interface SimpleLineChartProps {
  data: LineChartDataPoint[];
  title?: string;
  height?: number;
  color?: string;
  showGrid?: boolean;
  yAxisLabel?: string;
  valueLabel?: string;
}

/**
 * Simple Line Chart using react-native-svg
 * Works on both web and mobile (iOS/Android)
 * Responsive and full-width
 */
const SimpleLineChart: React.FC<SimpleLineChartProps> = ({
  data,
  title = 'Monthly Assignment Trend',
  height = 300,
  color = '#3B82F6',
  showGrid = true,
  yAxisLabel = 'Participants Assigned',
  valueLabel = 'Assigned Participants',
}) => {
  const { isWeb } = usePlatform();
  const windowDimensions = useWindowDimensions();
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const [containerWidth, setContainerWidth] = useState(windowDimensions.width - 100);
  
  // Use full available container width (end-to-end charts on wide screens)
  const width = containerWidth;
  const padding = { top: 40, right: 20, bottom: 50, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Find min/max values
  const values = data.map(d => d.value);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values, 0);
  const valueRange = maxValue - minValue || 1;

  // Calculate points
  const xStep = chartWidth / (data.length - 1 || 1);
  const points = data.map((d, i) => ({
    x: padding.left + i * xStep,
    y: padding.top + chartHeight - ((d.value - minValue) / valueRange) * chartHeight,
    month: d.month,
    value: d.value,
  }));

  // Create line path
  // Smooth curve path (Catmull-Rom spline -> Bezier)
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

  const linePath = createSmoothPath(points);

  // Approximate path length for animation (good enough for dash animation)
  const approxPathLength = useMemo(() => {
    if (points.length < 2) return 0;
    let len = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      len += Math.sqrt(dx * dx + dy * dy);
    }
    return Math.max(len, 1);
  }, [points]);

  const dashOffset = useRef(new Animated.Value(approxPathLength)).current;

  useEffect(() => {
    dashOffset.setValue(approxPathLength);
    Animated.timing(dashOffset, {
      toValue: 0,
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [approxPathLength, dashOffset, linePath]);

  // Handle point hover/press
  const handlePointInteraction = (index: number) => {
    setHoveredPoint(index);
  };

  const handlePointLeave = () => {
    setHoveredPoint(null);
    setHoverPos(null);
  };

  // Y-axis labels (5 ticks)
  const yTicks = 5;
  const yTickValues = Array.from({ length: yTicks }, (_, i) => {
    return minValue + (valueRange * i) / (yTicks - 1);
  });

  return (
    <VStack space="sm" width="100%" alignItems="center" mb="$6">
      {/* Chart Container */}
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
            // @ts-ignore - web-only mouse events
            onMouseMove: (e: any) => {
              const svgRect = e.currentTarget?.getBoundingClientRect?.();
              if (!svgRect) return;
              
              const mouseX = e.clientX - svgRect.left;
              const mouseY = e.clientY - svgRect.top;

              // Only hover when mouse is within plot area
              const withinX =
                mouseX >= padding.left && mouseX <= padding.left + chartWidth;
              const withinY =
                mouseY >= padding.top && mouseY <= padding.top + chartHeight;

              if (!withinX || !withinY) {
                setHoveredPoint(null);
                setHoverPos(null);
                return;
              }

              // Hover should follow mouse movement: pick nearest x-index (no distance threshold)
              const rawIdx = Math.round((mouseX - padding.left) / xStep);
              const idx = Math.max(0, Math.min(data.length - 1, rawIdx));
              setHoveredPoint(idx);
              setHoverPos({ x: mouseX, y: mouseY });
            },
            onMouseLeave: handlePointLeave,
            style: { cursor: 'pointer' },
          })}
        >
          <Svg width={width} height={height}>
          {/* Grid lines (faint dotted like reference) */}
          {showGrid &&
            yTickValues.map((val, i) => {
              const y = padding.top + chartHeight - ((val - minValue) / valueRange) * chartHeight;
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

          {showGrid &&
            points.map((p, i) => (
              <Line
                key={`grid-v-${i}`}
                x1={p.x}
                y1={padding.top}
                x2={p.x}
                y2={padding.top + chartHeight}
                stroke={hoveredPoint === i ? '#9CA3AF' : '#D1D5DB'}
                strokeWidth={hoveredPoint === i ? 1.5 : 1}
                strokeDasharray={hoveredPoint === i ? '0' : '3 3'}
                opacity={hoveredPoint === i ? 0.9 : 0.7}
              />
            ))}

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

          {/* Y-axis labels */}
          {yTickValues.map((val, i) => {
            const y = padding.top + chartHeight - ((val - minValue) / valueRange) * chartHeight;
            return (
              <SvgText
                key={`y-label-${i}`}
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

          {/* Hover crosshair (vertical) */}
          {hoveredPoint !== null ? (
            <Line
              x1={points[hoveredPoint].x}
              y1={padding.top}
              x2={points[hoveredPoint].x}
              y2={padding.top + chartHeight}
              stroke="#9CA3AF"
              strokeWidth="1"
              opacity={0.6}
            />
          ) : null}

          {/* Line (smooth curve) with draw animation */}
          <AnimatedPath
            d={linePath}
            stroke={color}
            strokeWidth="3"
            fill="none"
            strokeDasharray={`${approxPathLength} ${approxPathLength}`}
            strokeDashoffset={dashOffset as any}
          />

          {/* Data points with hover/press support */}
          {points.map((p, i) => (
            <G key={`point-group-${i}`}>
              {/* Invisible larger circle for easier interaction */}
              <Circle
                cx={p.x}
                cy={p.y}
                r="15"
                fill="transparent"
                onPress={(e: any) => {
                  handlePointInteraction(i);
                  return e;
                }}
              />
              {/* Visible point */}
              {hoveredPoint === i ? (
                <>
                  {/* Outer ring */}
                  <Circle
                    cx={p.x}
                    cy={p.y}
                    r="6.5"
                    fill="#FFFFFF"
                    stroke={color}
                    strokeWidth="2.5"
                    onPress={(e: any) => {
                      handlePointInteraction(i);
                      return e;
                    }}
                  />
                  {/* Inner dot */}
                  <Circle cx={p.x} cy={p.y} r="3.5" fill={color} />
                </>
              ) : (
                <Circle
                  cx={p.x}
                  cy={p.y}
                  r="5"
                  fill={color}
                  onPress={(e: any) => {
                    handlePointInteraction(i);
                    return e;
                  }}
                />
              )}
            </G>
          ))}

          {/* X-axis labels */}
          {data.map((d, i) => {
            const x = padding.left + i * xStep;
            const y = padding.top + chartHeight + 25;
            // Show every other label if too many points
            const showLabel = data.length <= 12 || i % 2 === 0;
            return showLabel ? (
              <SvgText
                key={`x-label-${i}`}
                x={x}
                y={y}
                fontSize="11"
                fill="#6B7280"
                textAnchor="middle"
              >
                {d.month}
              </SvgText>
            ) : null;
          })}
        </Svg>
        </Box>

        {/* Tooltip Popover */}
        {hoveredPoint !== null && hoverPos && (
          <Box
            position="absolute"
            // Follow mouse, clamped within container
            left={Math.min(
              Math.max(hoverPos.x + 12, 8),
              width - 180
            )}
            top={Math.min(
              Math.max(hoverPos.y - 60, 8),
              height - 90
            )}
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
          >
            <VStack space="xs">
              <Text fontSize="$sm" fontWeight="$semibold" color="$textForeground">
                {data[hoveredPoint].month}
              </Text>
              <Text fontSize="$xs" color="$primary600">
                {valueLabel}: {data[hoveredPoint].value}
              </Text>
            </VStack>
          </Box>
        )}
      </Box>
    </VStack>
  );
};

export default SimpleLineChart;
