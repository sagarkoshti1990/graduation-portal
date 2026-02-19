import React, { useState } from 'react';
import { useWindowDimensions } from 'react-native';
import Svg, { Path, Circle, Text as SvgText } from 'react-native-svg';
import { Box, VStack, HStack, Text, Heading } from '@ui';

export interface PieChartDataPoint {
  label: string;
  value: number;
  color: string;
}

export interface SimplePieChartProps {
  data: PieChartDataPoint[];
  title?: string;
}

/**
 * Simple Pie Chart using react-native-svg
 * Works on both web and mobile (iOS/Android)
 * Responsive and full-width
 */
const SimplePieChart: React.FC<SimplePieChartProps> = ({
  data,
  title = 'Pie Chart',
}) => {
  const windowDimensions = useWindowDimensions();
  const [containerWidth, setContainerWidth] = useState(windowDimensions.width - 100);
  
  // Responsive size calculation
  const size = Math.min(containerWidth * 0.6, 280);
  const radius = size / 2 - 10;
  const centerX = size / 2;
  const centerY = size / 2;

  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  let currentAngle = -90; // Start from top

  const slices = data.map(d => {
    const percentage = (d.value / total) * 100;
    const angle = (d.value / total) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;
    const endAngle = currentAngle;

    // Calculate arc path
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);

    const largeArc = angle > 180 ? 1 : 0;

    const path = `M ${centerX},${centerY} L ${x1},${y1} A ${radius},${radius} 0 ${largeArc} 1 ${x2},${y2} Z`;

    return {
      ...d,
      path,
      percentage: percentage.toFixed(1),
    };
  });

  return (
    <VStack space="sm" width="100%" alignItems="center" mb="$6">
      {/* Title */}
      <Heading size="md" mb="$2">
        {title}
      </Heading>

      {/* Chart */}
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
        <Svg width={size} height={size}>
          {slices.map((slice, i) => (
            <Path key={`slice-${i}`} d={slice.path} fill={slice.color} />
          ))}
        </Svg>
      </Box>

      {/* Legend */}
      <VStack space="xs" width="100%" mt="$2" px="$4">
        {slices.map((slice, i) => (
          <HStack key={`legend-${i}`} space="sm" alignItems="center">
            <Box width={16} height={16} borderRadius={4} bg={slice.color} />
            <Text fontSize="$sm" color="$textLight600" flex={1}>
              {slice.label}
            </Text>
            <Text fontSize="$sm" fontWeight="$semibold" color="$textForeground">
              {slice.percentage}%
            </Text>
          </HStack>
        ))}
      </VStack>
    </VStack>
  );
};

export default SimplePieChart;
