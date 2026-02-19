import React, { useState } from 'react';
import { useWindowDimensions } from 'react-native';
import Svg, { Rect, Text as SvgText, Line } from 'react-native-svg';
import { Box, VStack, Text, Heading } from '@ui';

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
}) => {
  const windowDimensions = useWindowDimensions();
  const [containerWidth, setContainerWidth] = useState(windowDimensions.width - 100);
  
  // Responsive width calculation
  const width = Math.min(containerWidth, 1200);
  const padding =
    orientation === 'horizontal'
      ? { top: 30, right: 40, bottom: 30, left: 150 }
      : { top: 40, right: 20, bottom: 60, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxValue = Math.max(...data.map(d => d.value), 0);
  const barWidth = Math.max(chartWidth / Math.max(data.length, 1) - 10, 20);
  const barSpacing = 10;
  const horizontalBarHeight = Math.max((chartHeight / Math.max(data.length, 1)) - 10, 18);
  const horizontalBarSpacing = 10;

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
        onLayout={(e: any) => {
          const layoutWidth = e.nativeEvent.layout.width;
          if (layoutWidth > 0 && layoutWidth !== containerWidth) {
            setContainerWidth(layoutWidth);
          }
        }}
      >
        <Svg width={width} height={height}>
          {orientation === 'horizontal' ? (
            <>
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
                const barW = (d.value / maxValue) * chartWidth || 0;
                const y = padding.top + i * (horizontalBarHeight + horizontalBarSpacing);
                const x = padding.left;
                const label = d.label.length > 18 ? `${d.label.slice(0, 18)}…` : d.label;

                return (
                  <React.Fragment key={`hbar-${i}`}>
                    {/* Y label */}
                    <SvgText
                      x={padding.left - 8}
                      y={y + horizontalBarHeight / 2 + 4}
                      fontSize="10"
                      fill="#6B7280"
                      textAnchor="end"
                    >
                      {label}
                    </SvgText>

                    {/* Bar */}
                    <Rect
                      x={x}
                      y={y}
                      width={barW}
                      height={horizontalBarHeight}
                      fill={d.color || defaultColor}
                      rx="4"
                    />

                    {/* Value label */}
                    <SvgText
                      x={x + barW + 6}
                      y={y + horizontalBarHeight / 2 + 4}
                      fontSize="10"
                      fill="#374151"
                      textAnchor="start"
                      fontWeight="600"
                    >
                      {Math.round(d.value)}
                    </SvgText>
                  </React.Fragment>
                );
              })}
            </>
          ) : (
            <>
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
                const barHeight = (d.value / maxValue) * chartHeight || 0;
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
                      rx="4"
                    />

                    <SvgText
                      x={x + barWidth / 2}
                      y={y - 5}
                      fontSize="11"
                      fill="#374151"
                      textAnchor="middle"
                      fontWeight="600"
                    >
                      {Math.round(d.value)}
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
      </Box>
    </VStack>
  );
};

export default SimpleBarChart;
