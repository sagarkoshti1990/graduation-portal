import React, { useState } from 'react';
import { View, Pressable, useWindowDimensions } from 'react-native';
import Svg, { Line, Circle, Text as SvgText, G, Rect, Path } from 'react-native-svg';
import { Box, VStack, HStack, Text, Heading } from '@ui';
import { usePlatform } from '@utils/platform';

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
  const [containerWidth, setContainerWidth] = useState(windowDimensions.width - 100);
  
  // Responsive width calculation
  const width = Math.min(containerWidth, 1200);
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
  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`)
    .join(' ');

  // Handle point hover/press
  const handlePointInteraction = (index: number) => {
    setHoveredPoint(index);
  };

  const handlePointLeave = () => {
    setHoveredPoint(null);
  };

  // Y-axis labels (5 ticks)
  const yTicks = 5;
  const yTickValues = Array.from({ length: yTicks }, (_, i) => {
    return minValue + (valueRange * i) / (yTicks - 1);
  });

  return (
    <VStack space="sm" width="100%" alignItems="center" mb="$6">
      {/* Title */}
      <Heading size="md" mb="$2">
        {title}
      </Heading>

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
              
              // Find closest point
              let closestIndex = -1;
              let minDistance = 30; // Max distance threshold
              
              points.forEach((point, index) => {
                const distance = Math.sqrt(
                  Math.pow(mouseX - point.x, 2) + Math.pow(mouseY - point.y, 2)
                );
                if (distance < minDistance) {
                  minDistance = distance;
                  closestIndex = index;
                }
              });
              
              if (closestIndex >= 0) {
                setHoveredPoint(closestIndex);
              } else {
                setHoveredPoint(null);
              }
            },
            onMouseLeave: handlePointLeave,
            style: { cursor: 'pointer' },
          })}
        >
          <Svg width={width} height={height}>
          {/* Grid lines */}
          {showGrid &&
            yTickValues.map((val, i) => {
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

          {/* Line */}
          <Path d={linePath} stroke={color} strokeWidth="3" fill="none" />

          {/* Data points with hover/press support */}
          {points.map((p, i) => (
            <G key={`point-group-${i}`}>
              {/* Invisible larger circle for easier interaction */}
              <Circle
                cx={p.x}
                cy={p.y}
                r="15"
                fill="transparent"
                onPress={() => handlePointInteraction(i)}
              />
              {/* Visible point */}
              <Circle
                cx={p.x}
                cy={p.y}
                r={hoveredPoint === i ? "7" : "5"}
                fill={hoveredPoint === i ? "#1E40AF" : color}
                onPress={() => handlePointInteraction(i)}
              />
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
        {hoveredPoint !== null && (
          <Box
            position="absolute"
            left={points[hoveredPoint].x - 40}
            top={points[hoveredPoint].y - 80}
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

      {/* Y-axis label */}
      <Text fontSize="$sm" color="$textLight600" mt="$2">
        {yAxisLabel}
      </Text>
    </VStack>
  );
};

export default SimpleLineChart;
