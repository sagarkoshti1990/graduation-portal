import React from 'react';
import { Pressable } from 'react-native';
import { Box, Text } from '@ui';
import { calendarStyles, getDateCellStyle, getDateTextStyle } from './Styles';
import type { DatePickerTheme, DatePickerStyles } from './Styles';
import { formatDate } from './utils';
import type { CalendarDay } from './utils';

interface CalendarCellProps {
  day: CalendarDay;
  isSelected: boolean;
  isToday: boolean;
  isDisabled: boolean;
  theme: DatePickerTheme;
  styles?: DatePickerStyles;
  monthNamesShort: string[];
  onPress: (date: Date) => void;
  cellRef?: (el: any) => void;
}

/** A single day cell in the calendar grid — extracted verbatim from the
 * previous inline implementation, no behavior change. */
const CalendarCell: React.FC<CalendarCellProps> = ({
  day,
  isSelected,
  isToday,
  isDisabled,
  theme,
  styles,
  monthNamesShort,
  onPress,
  cellRef,
}) => {
  const cellStyle = {
    ...calendarStyles.dateCell,
    ...getDateCellStyle(isSelected, isToday, day.isCurrentMonth, isDisabled, theme),
    ...styles?.dayCell,
    ...(isSelected ? styles?.selectedDay : null),
    ...(isToday && !isSelected ? styles?.today : null),
    ...(isDisabled ? styles?.disabledDay : null),
  };
  const textStyle = {
    ...calendarStyles.dateText,
    ...getDateTextStyle(isSelected, isToday, day.isCurrentMonth, theme),
  };

  return (
    <Pressable
      ref={cellRef}
      accessibilityRole="button"
      accessibilityLabel={formatDate(day.date, 'DD MMM YYYY', monthNamesShort)}
      accessibilityState={{ selected: isSelected, disabled: isDisabled }}
      onPress={(e: any) => {
        e?.stopPropagation?.();
        onPress(day.date);
      }}
      disabled={isDisabled}
    >
      <Box {...cellStyle}>
        <Text {...textStyle}>{day.date.getDate()}</Text>
      </Box>
    </Pressable>
  );
};

export default React.memo(CalendarCell);
