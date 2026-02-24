import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, useWindowDimensions } from 'react-native';
import Svg, { Path, Polyline, Text as SvgText, Circle } from 'react-native-svg';
import { Box, VStack, HStack, Text } from '@ui';
import { usePlatform } from '@utils/platform';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export interface PieChartDataPoint {
  label: string;
  value: number;
  color: string;
}

export interface SimplePieChartProps {
  data: PieChartDataPoint[];
  title?: string;
  variant?: 'pie' | 'donut';
  showLabels?: boolean;
  showLegend?: boolean;
}

/**
 * Simple Pie Chart using react-native-svg
 * Works on both web and mobile (iOS/Android)
 * Responsive and full-width
 */
const SimplePieChart: React.FC<SimplePieChartProps> = ({
  data,
  title: _title = 'Pie Chart',
  variant = 'pie',
  showLabels,
  showLegend,
}) => {
  const { isWeb } = usePlatform();
  const windowDimensions = useWindowDimensions();
  const [containerWidth, setContainerWidth] = useState(windowDimensions.width - 100);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  
  const useOutsideLabels = (showLabels ?? true) && data.length <= 2;
  const useCalloutLabels = (showLabels ?? true) && data.length > 2;
  
  // Responsive size calculation
  const size = Math.min(containerWidth * 0.6, 280);
  // Extra room for outside labels (match reference for 2-slice pies)
  const sidePadding = useOutsideLabels
    ? Math.min(360, Math.max(240, containerWidth * 0.32))
    : useCalloutLabels
      ? Math.min(320, Math.max(220, containerWidth * 0.28))
      : 0;
  const verticalPadding = useCalloutLabels ? 70 : 0;
  const svgWidth = size + sidePadding * 2;
  const svgHeight = size + verticalPadding * 2;
  const radius = size / 2 - 10;
  const centerX = svgWidth / 2;
  const centerY = svgHeight / 2;
  const isDonut = variant === 'donut';
  const innerRadius = radius * 0.62;

  const percentDigits = useMemo(() => {
    // Use 1 decimal when input values are fractional (e.g., 42.9) to match reference labels.
    const hasFractional = data.some(d => Math.abs(d.value - Math.round(d.value)) > 0.0001);
    return hasFractional ? 1 : 0;
  }, [data]);

  const buildWedgePath = (startAngle: number, endAngle: number) => {
    const angle = endAngle - startAngle;
    const largeArc = Math.abs(angle) > 180 ? 1 : 0;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);

    // sweep-flag=1 to draw clockwise (matches previous filled pie rendering)
    return `M ${centerX},${centerY} L ${x1},${y1} A ${radius},${radius} 0 ${largeArc} 1 ${x2},${y2} Z`;
  };

  const total = useMemo(() => data.reduce((sum, d) => sum + d.value, 0) || 1, [data]);
  const isPercentBreakdown = useMemo(() => Math.abs(total - 100) < 0.001, [total]);

  // Match reference for 2-slice pies: keep the smaller slice (often "Delayed") on the right side.
  const chartData = useMemo(() => {
    if (useOutsideLabels && data.length === 2) {
      return [...data].sort((a, b) => a.value - b.value); // smaller first
    }
    return data;
  }, [data, useOutsideLabels]);

  const slices = useMemo(() => {
    const firstAngle = chartData.length ? (chartData[0].value / total) * 360 : 0;
    // For 2-slice: center the first (smaller) slice at 0deg (pointing right).
    let currentAngle = useOutsideLabels && chartData.length === 2 ? -firstAngle / 2 : -90; // default: start from top
    return chartData.map(d => {
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
      const midAngle = (startAngle + endAngle) / 2;

    return {
      ...d,
      path,
        percentage: percentage.toFixed(percentDigits),
        startAngle,
        endAngle,
        midAngle,
        angle,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartData, total, percentDigits, centerX, centerY, radius, svgWidth, svgHeight, useOutsideLabels]);

  // Circular sweep animation: draw each slice stroke sequentially.
  const sliceAnimsRef = useRef<Animated.Value[]>([]);
  const sliceProgressRef = useRef<number[]>([]);
  const rafRef = useRef<number | null>(null);
  const [, forceRerender] = useState(0);

  const scheduleRerender = () => {
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      forceRerender(v => (v + 1) % 1000000);
    });
  };

  if (sliceAnimsRef.current.length !== slices.length) {
    sliceAnimsRef.current = slices.map((_, idx) => sliceAnimsRef.current[idx] || new Animated.Value(0));
  }

  useEffect(() => {
    // subscribe to value updates so the wedge paths re-render smoothly
    const subs = sliceAnimsRef.current.map((v, idx) =>
      v.addListener(({ value }) => {
        sliceProgressRef.current[idx] = value;
        scheduleRerender();
      })
    );

    sliceAnimsRef.current.forEach(v => v.setValue(0));
    const totalAngle = slices.reduce((s: number, it: any) => s + (it.angle || 0), 0) || 360;
    const totalDuration = 900;
    const animations = slices.map((it: any, idx: number) =>
      Animated.timing(sliceAnimsRef.current[idx], {
        toValue: 1,
        duration: Math.max(140, Math.round((totalDuration * (it.angle || 0)) / totalAngle)),
        useNativeDriver: false,
      })
    );
    Animated.sequence(animations).start();
    return () => {
      subs.forEach((idObj, idx) => {
        try {
          sliceAnimsRef.current[idx]?.removeListener(idObj as any);
        } catch {
          // ignore
        }
      });
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [slices.length, variant]); // re-run when slice count/variant changes

  const callouts = useMemo(() => {
    if (!useCalloutLabels) return [];

    type Item = {
      i: number;
      side: 'left' | 'right';
      color: string;
      label: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      xElbow: number;
      xLineEnd: number;
      y3: number;
      textX: number;
      textY: number;
      textAnchor: 'start' | 'end';
    };

    const minY = 14;
    const maxY = svgHeight - 14;
    const gap = 20;
    const lineOffsetY = 10; // draw the final horizontal segment below the text baseline

    const raw: Item[] = slices.map((s: any, i: number) => {
      const rad = (s.midAngle * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const side: 'left' | 'right' = cos >= 0 ? 'right' : 'left';

      const x1 = centerX + radius * cos;
      const y1 = centerY + radius * sin;
      const x2 = centerX + (radius + 14) * cos;
      const y2 = centerY + (radius + 14) * sin;
      // Elbow is kept close to the pie edge; the final segment runs horizontally near the side.
      const xElbow = side === 'right'
        ? centerX + radius + 18
        : centerX - radius - 18;

      // Text sits near the edges, inside bounds.
      const textX = side === 'right' ? svgWidth - 12 : 12;
      const textAnchor: 'start' | 'end' = side === 'right' ? 'end' : 'start';

      // Stop the line a bit before the text to avoid striking through glyphs.
      const xLineEnd = side === 'right' ? textX - 14 : textX + 14;
      const y3 = y2;

      const label = isPercentBreakdown ? `${s.label}: ${s.percentage}%` : `${s.label}: ${s.percentage}% (${s.value})`;

      return {
        i,
        side,
        color: s.color,
        label,
        x1,
        y1,
        x2,
        y2,
        xElbow,
        xLineEnd,
        y3,
        textX,
        textY: y3,
        textAnchor,
    };
  });

    const adjustSide = (items: Item[]) => {
      const sorted = [...items].sort((a, b) => a.textY - b.textY);
      let y = minY;
      for (const it of sorted) {
        it.textY = Math.max(it.textY, y);
        it.textY = Math.min(Math.max(it.textY, minY), maxY);
        y = it.textY + gap;
      }

      // If overflow at bottom, shift everything up.
      const overflow = (sorted.length ? sorted[sorted.length - 1].textY : 0) - (maxY - 2);
      if (overflow > 0) {
        for (const it of sorted) {
          it.textY = Math.max(minY, it.textY - overflow);
        }
      }

      // Keep the elbow aligned to adjusted textY
      for (const it of sorted) {
        it.y3 = Math.min(maxY, it.textY + lineOffsetY);
      }
      return sorted;
    };

    const left = adjustSide(raw.filter(r => r.side === 'left'));
    const right = adjustSide(raw.filter(r => r.side === 'right'));
    return [...left, ...right].sort((a, b) => a.i - b.i);
  }, [useCalloutLabels, slices, svgHeight, svgWidth, centerX, centerY, radius]);

  const normalizeAngle = (deg: number) => ((deg % 360) + 360) % 360;

  const pickSliceIndexByAngle = (deg: number) => {
    const a = normalizeAngle(deg);
    for (let i = 0; i < slices.length; i++) {
      const s = slices[i] as any;
      const start = normalizeAngle(s.startAngle);
      const end = normalizeAngle(s.endAngle);
      if (start <= end) {
        if (a >= start && a <= end) return i;
      } else {
        // wrap-around (e.g., start=300 end=20)
        if (a >= start || a <= end) return i;
      }
    }
    return null;
  };

  return (
    <VStack space="sm" width="100%" alignItems="center" mb="$6">
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
        <Box
          width={svgWidth}
          height={svgHeight}
          position="relative"
          {...(isWeb && {
            // @ts-ignore - web-only mouse events
            onMouseMove: (e: any) => {
              const rect = e.currentTarget?.getBoundingClientRect?.();
              if (!rect) return;
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;

              const dx = x - centerX;
              const dy = y - centerY;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist > radius || (isDonut && dist < innerRadius)) {
                setHoveredIndex(null);
                setHoverPos(null);
                return;
              }

              const deg = (Math.atan2(dy, dx) * 180) / Math.PI;
              const idx = pickSliceIndexByAngle(deg);
              setHoveredIndex(idx);
              setHoverPos(idx !== null ? { x, y } : null);
            },
            onMouseLeave: () => {
              setHoveredIndex(null);
              setHoverPos(null);
            },
            style: { cursor: 'pointer' },
          })}
        >
          <Svg width={svgWidth} height={svgHeight}>
            {slices.map((slice: any, i) => {
              const p = sliceProgressRef.current[i] ?? 0;
              const end = slice.startAngle + (slice.endAngle - slice.startAngle) * p;
              const d = buildWedgePath(slice.startAngle, end);

              return (
                <AnimatedPath
                  key={`slice-wedge-${i}`}
                  d={d}
                  fill={slice.color}
                  stroke="#FFFFFF"
                  strokeWidth={1}
                  // @ts-ignore - press works on native svg
                  onPress={(ev: any) => {
                    setHoveredIndex(i);
                    setHoverPos({ x: centerX, y: centerY });
                    return ev;
                  }}
                />
              );
            })}

            {/* Donut hole */}
            {isDonut ? (
              <Circle cx={centerX} cy={centerY} r={innerRadius} fill="#FFFFFF" />
            ) : null}

            {/* Multi-slice callout labels + leader lines (Dropouts-style) */}
            {useCalloutLabels
              ? callouts.map(c => (
                  <React.Fragment key={`callout-${c.i}`}>
                    <Polyline
                      points={`${c.x1},${c.y1} ${c.x2},${c.y2} ${c.xElbow},${c.y2} ${c.xElbow},${c.y3} ${c.xLineEnd},${c.y3}`}
                      fill="none"
                      stroke={c.color}
                      strokeWidth={1}
                    />
                    <SvgText
                      x={c.textX}
                      y={c.textY + 4}
                      fontSize="13"
                      fill={c.color}
                      textAnchor={c.textAnchor}
                      fontWeight="500"
                    >
                      {c.label}
                    </SvgText>
                  </React.Fragment>
                ))
              : null}
        </Svg>

          {/* Outside labels (2-slice pies) */}
          {useOutsideLabels ? slices.map((slice: any, i) => {
            const midRad = (slice.midAngle * Math.PI) / 180;
            // Position labels like reference: keep them close to the center line.
            // For 2-slice pies (common in this dashboard), lock Y to center for a clean left/right layout.
            const damp = 0.35;
            const ly =
              slices.length <= 2
                ? centerY
                : centerY + Math.sin(midRad) * radius * damp;
            // Determine which side the label should sit on (left/right)
            const lx = centerX + Math.cos(midRad) * (radius + 10);
            const isRightByAngle = lx >= centerX;
            const isTwoSlices = slices.length === 2;
            const maxValue = isTwoSlices ? Math.max(slices[0].value, slices[1].value) : null;
            // Match reference for 2-slice pies: larger slice label on LEFT, smaller on RIGHT
            const isRight = isTwoSlices
              ? slice.value !== maxValue
              : isRightByAngle;
            const label = isPercentBreakdown
              ? `${slice.label}: ${slice.percentage}%`
              : `${slice.label}: ${slice.percentage}% (${slice.value})`;

            // Position relative to the side paddings; clamp within container height
            const top = Math.min(Math.max(ly - 10, 6), svgHeight - 26);

            return (
              <Box
                key={`label-ui-${i}`}
                position="absolute"
                top={top}
                left={isRight ? undefined : 0}
                right={isRight ? 0 : undefined}
                width={sidePadding - 24}
                px="$2"
                pointerEvents="none"
              >
                <Text
                  fontSize="$md"
                  color={slice.color}
                  textAlign={isRight ? 'left' : 'right'}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              </Box>
            );
          }) : null}
      </Box>

        {/* Hover tooltip (like reference) */}
        {hoveredIndex !== null && hoverPos ? (
          <Box
            position="absolute"
            left={Math.min(Math.max(hoverPos.x + 12, 8), svgWidth - 260)}
            top={Math.min(Math.max(hoverPos.y - 30, 8), svgHeight - 80)}
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
            <Text fontSize="$sm" fontWeight="$semibold" color="$textForeground">
              {(() => {
                const s = slices[hoveredIndex] as any;
                return isPercentBreakdown
                  ? `${s.label}: ${s.percentage}%`
                  : `${s.label}: ${s.percentage}% (${s.value})`;
              })()}
            </Text>
          </Box>
        ) : null}
      </Box>

      {/* Bottom legend (like reference) */}
      {(showLegend ?? (data.length > 2)) ? (
        <HStack
          mt="$3"
          space="md"
          flexWrap="wrap"
          justifyContent="center"
          alignItems="center"
          px="$2"
        >
          {slices.map((s: any, idx: number) => (
            <HStack key={`pie-lg-${idx}`} space="xs" alignItems="center">
              <Box width={10} height={10} borderRadius={2} bg={s.color as any} />
              <Text fontSize="$xs" color={s.color as any} numberOfLines={1}>
                {s.label}
              </Text>
            </HStack>
          ))}
        </HStack>
      ) : null}
    </VStack>
  );
};

export default SimplePieChart;
