import React, { useLayoutEffect, useRef } from 'react';
import { Pressable } from 'react-native';
import { Box, Text, VStack, HStack, ScrollView } from '@ui';
import { pickerGridStyles, getPickerCellStyle, getPickerCellTextStyle } from './Styles';
import type { DatePickerTheme } from './Styles';
import type { StyleObject } from './utils';

export interface PickerGridItem {
  value: number;
  label: string;
  isSelected: boolean;
}

interface PickerGridProps {
  items: PickerGridItem[];
  onSelect: (value: number) => void;
  theme: DatePickerTheme;
  columns?: number;
  /** Years scroll (range can be large); months never do (always exactly 12). */
  scrollable?: boolean;
  style?: StyleObject;
}

const CELL_HEIGHT = 56;

/**
 * A generic 4-per-row grid of circular selectable cells — used for both the
 * month picker (12 items, fixed) and the year picker (scrollable). Replaces
 * the old floating dropdown: this renders in place of the day grid rather
 * than floating above it.
 */
const PickerGrid: React.FC<PickerGridProps> = ({
  items,
  onSelect,
  theme,
  columns = 4,
  scrollable = false,
  style,
}) => {
  const scrollRef = useRef<any>(null);
  const selectedIndex = items.findIndex(item => item.isSelected);
  const targetRow = selectedIndex >= 0 ? Math.floor(selectedIndex / columns) : 0;

  // Tracks the last row we actually scrolled to, so a re-render that doesn't
  // change the target row never issues a redundant `scrollTo`.
  const lastPositionedRowRef = useRef<number | null>(null);

  // `useLayoutEffect` fires synchronously before the next paint — positions
  // the year list before the user ever sees it, no animation, and re-runs
  // whenever the target row changes (not gated to "first mount only"), so
  // it stays correct even if this component's instance persists across
  // multiple picker opens (e.g. inside a native Modal that keeps its content
  // mounted while hidden) with a different selection each time.
  useLayoutEffect(() => {
    if (!scrollable) return;
    if (lastPositionedRowRef.current === targetRow) return;
    lastPositionedRowRef.current = targetRow;
    if (scrollRef.current?.scrollTo) {
      scrollRef.current.scrollTo({
        y: Math.max(0, targetRow * CELL_HEIGHT - CELL_HEIGHT * 2),
        animated: false,
      });
    }
  }, [scrollable, targetRow]);

  const rows: PickerGridItem[][] = [];
  for (let i = 0; i < items.length; i += columns) {
    rows.push(items.slice(i, i + columns));
  }

  const gridBody = (
    <VStack space="xs">
      {rows.map((row, rowIndex) => (
        <HStack key={rowIndex} {...pickerGridStyles.row}>
          {row.map(item => (
            <Pressable
              key={item.value}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: item.isSelected }}
              onPress={() => onSelect(item.value)}
            >
              <Box {...pickerGridStyles.cell} {...getPickerCellStyle(item.isSelected, theme)}>
                <Text {...pickerGridStyles.cellText} {...getPickerCellTextStyle(item.isSelected, theme)}>
                  {item.label}
                </Text>
              </Box>
            </Pressable>
          ))}
        </HStack>
      ))}
    </VStack>
  );

  if (!scrollable) {
    return (
      <Box {...style}>
        {gridBody}
      </Box>
    );
  }

  return (
    <ScrollView
      ref={scrollRef}
      showsVerticalScrollIndicator={false}
      {...pickerGridStyles.container}
      {...style}
    >
      {gridBody}
    </ScrollView>
  );
};

export default React.memo(PickerGrid);
