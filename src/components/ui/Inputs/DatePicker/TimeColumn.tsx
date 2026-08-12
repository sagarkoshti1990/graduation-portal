import React, { useCallback, useLayoutEffect, useRef } from 'react';
import { Pressable } from 'react-native';
import { Box, Text, VStack, ScrollView } from '@ui';
import { LucideIcon } from '@ui';
import {
  timePickerStyles,
  getTimeRowStyle,
  getTimeRowTextStyle,
  mergeStyle,
} from './Styles';
import type { DatePickerTheme } from './Styles';
import type { StyleObject } from './utils';

const TIME_ROW_HEIGHT = 32;

interface TimeColumnItem {
  value: number | string;
  label: string;
}

interface TimeRowProps {
  value: number | string;
  label: string;
  isSelected: boolean;
  onSelect: (value: any) => void;
  theme: DatePickerTheme;
}

// Its own `React.memo` so picking a new hour/minute only re-renders the one
// row that lost its selected state and the one that gained it — not all 24
// (hour) or 60 (minute) rows every time.
const TimeRow = React.memo(function TimeRow({ value, label, isSelected, onSelect, theme }: TimeRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={label}
      onPress={() => onSelect(value)}
    >
      <Box {...timePickerStyles.row} {...getTimeRowStyle(isSelected, theme)}>
        <Text {...timePickerStyles.rowText} {...getTimeRowTextStyle(isSelected, theme)}>
          {label}
        </Text>
      </Box>
    </Pressable>
  );
});

interface TimeColumnProps {
  items: TimeColumnItem[];
  selectedValue: number | string;
  onSelect: (value: any) => void;
  theme: DatePickerTheme;
  style?: StyleObject;
  label: string;
  accessibilityLabel: string;
}

const TimeColumn = React.memo(function TimeColumn({
  items,
  selectedValue,
  onSelect,
  theme,
  style,
  label,
  accessibilityLabel,
}: TimeColumnProps) {
  const scrollRef = useRef<any>(null);
  const selectedIndex = items.findIndex(item => item.value === selectedValue);

  // Tracks the last row we actually scrolled to, so a re-render that doesn't
  // change `selectedIndex` never issues a redundant `scrollTo`.
  const lastPositionedIndexRef = useRef<number | null>(null);

  // `useLayoutEffect` (not `useEffect`) fires synchronously before the next
  // paint, so positioning is applied before the user ever sees the list —
  // no flash at the top, no animation. Runs every time `selectedIndex`
  // changes (not just on first mount): a `contentOffset` prop or a
  // mount-only guard both broke down whenever this component's instance
  // persisted across multiple picker opens (e.g. a native Modal that keeps
  // its content mounted while hidden) with a different selected value each
  // time — this version has no mount-vs-update distinction to get wrong.
  useLayoutEffect(() => {
    if (selectedIndex < 0) return;
    if (lastPositionedIndexRef.current === selectedIndex) return;
    lastPositionedIndexRef.current = selectedIndex;
    if (scrollRef.current?.scrollTo) {
      scrollRef.current.scrollTo({
        y: Math.max(0, selectedIndex * TIME_ROW_HEIGHT - TIME_ROW_HEIGHT * 2),
        animated: false,
      });
    }
  }, [selectedIndex]);

  const step = useCallback(
    (delta: number) => {
      if (items.length === 0) return;
      const base = selectedIndex >= 0 ? selectedIndex : 0;
      const nextIndex = (base + delta + items.length) % items.length;
      onSelect(items[nextIndex].value);
    },
    [items, selectedIndex, onSelect],
  );

  return (
    <VStack {...timePickerStyles.columnWrapper}>
      <Text {...timePickerStyles.columnHeaderText}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Increase ${label}`}
        onPress={() => step(1)}
        {...timePickerStyles.stepperButton}
      >
        <LucideIcon name="ChevronUp" size={14} color={theme.muted} />
      </Pressable>
      <ScrollView
        ref={scrollRef}
        {...mergeStyle(timePickerStyles.column, style)}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        accessibilityLabel={accessibilityLabel}
        contentContainerStyle={timePickerStyles.columnContent}
      >
        {items.map(item => (
          <TimeRow
            key={String(item.value)}
            value={item.value}
            label={item.label}
            isSelected={item.value === selectedValue}
            onSelect={onSelect}
            theme={theme}
          />
        ))}
      </ScrollView>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Decrease ${label}`}
        onPress={() => step(-1)}
        {...timePickerStyles.stepperButton}
      >
        <LucideIcon name="ChevronDown" size={14} color={theme.muted} />
      </Pressable>
    </VStack>
  );
});

export default TimeColumn;
