import React from 'react';
import { Pressable } from 'react-native';
import { Box, HStack, Text } from '@ui';
import { LucideIcon } from '@ui';
import { calendarStyles, mergeStyle } from './Styles';
import type { DatePickerTheme, DatePickerStyles } from './Styles';
import type { CalendarViewMode } from './useCalendarNavigation';

interface CalendarHeaderProps {
  viewMode: CalendarViewMode;
  monthLabel: string;
  yearLabel: string;
  theme: DatePickerTheme;
  styles?: DatePickerStyles;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onShowMonthPicker: () => void;
  onShowYearPicker: () => void;
  onBackToDays: () => void;
}

/**
 * Calendar's top nav row. In the day-grid view it's the original prev/next
 * month chevrons + tappable month/year labels; in the month/year picker
 * views the left chevron is repurposed as "back to calendar" (same visual
 * slot, no new UI element) and the label shows the year currently being
 * browsed.
 */
const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  viewMode,
  monthLabel,
  yearLabel,
  theme,
  styles,
  onPrevMonth,
  onNextMonth,
  onShowMonthPicker,
  onShowYearPicker,
  onBackToDays,
}) => {
  if (viewMode !== 'days') {
    return (
      <HStack {...mergeStyle(calendarStyles.headerContainer, styles?.header)}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to calendar"
          onPress={onBackToDays}
        >
          <LucideIcon name="ChevronLeft" size={20} color={theme.text} />
        </Pressable>
        <Text {...calendarStyles.monthYearText}>{yearLabel}</Text>
        {/* Balances the left chevron so the year label stays centered. */}
        <Box width={20} />
      </HStack>
    );
  }

  return (
    <HStack {...mergeStyle(calendarStyles.headerContainer, styles?.header)}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Previous month"
        onPress={onPrevMonth}
      >
        <LucideIcon name="ChevronLeft" size={20} color={theme.text} />
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${monthLabel}, choose month`}
        onPress={onShowMonthPicker}
      >
        <HStack {...calendarStyles.monthYearContainer}>
          <Text {...calendarStyles.monthYearText}>{monthLabel}</Text>
          <LucideIcon name="ChevronDown" size={16} color={theme.muted} />
        </HStack>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${yearLabel}, choose year`}
        onPress={onShowYearPicker}
      >
        <HStack {...calendarStyles.monthYearContainer}>
          <Text {...calendarStyles.monthYearText}>{yearLabel}</Text>
          <LucideIcon name="ChevronDown" size={16} color={theme.muted} />
        </HStack>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Next month"
        onPress={onNextMonth}
      >
        <LucideIcon name="ChevronRight" size={20} color={theme.text} />
      </Pressable>
    </HStack>
  );
};

export default React.memo(CalendarHeader);
