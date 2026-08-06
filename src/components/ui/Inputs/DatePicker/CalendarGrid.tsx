import React from 'react';
import { Box, Text, HStack, VStack } from '@ui';
import { calendarStyles } from './Styles';
import type { DatePickerTheme, DatePickerStyles } from './Styles';
import { isSameDay, isDateDisabled } from './utils';
import type { CalendarDay } from './utils';
import CalendarCell from './CalendarCell';
import type { RenderDayParams } from './index';

interface CalendarGridProps {
  monthGrid: CalendarDay[];
  value: Date;
  minimumDate?: Date;
  effectiveMaxDate?: Date;
  dayNames: string[];
  monthNamesShort: string[];
  theme: DatePickerTheme;
  styles?: DatePickerStyles;
  onSelectDay: (date: Date) => void;
  renderDay?: (params: RenderDayParams) => React.ReactNode;
  dayRefs: React.MutableRefObject<Array<any>>;
}

/** Week-day header row + the 6x7 day grid — extracted verbatim from the
 * previous inline implementation, no behavior change. */
const CalendarGrid: React.FC<CalendarGridProps> = ({
  monthGrid,
  value,
  minimumDate,
  effectiveMaxDate,
  dayNames,
  monthNamesShort,
  theme,
  styles,
  onSelectDay,
  renderDay,
  dayRefs,
}) => {
  const today = new Date();

  return (
    <>
      <HStack {...calendarStyles.dayHeaderContainer}>
        {dayNames.map((day, index) => (
          <Box key={index} {...calendarStyles.dayHeaderBox}>
            <Text {...calendarStyles.dayHeaderText}>{day}</Text>
          </Box>
        ))}
      </HStack>

      <VStack {...calendarStyles.calendarGrid}>
        {[0, 1, 2, 3, 4, 5].map(row => (
          <HStack key={row} {...calendarStyles.calendarRow}>
            {monthGrid.slice(row * 7, (row + 1) * 7).map((day, colIndex) => {
              const index = row * 7 + colIndex;
              const isSelectedDay = isSameDay(day.date, value);
              const isTodayDay = isSameDay(day.date, today);
              const isDisabledDay = isDateDisabled(day.date, minimumDate, effectiveMaxDate);

              if (renderDay) {
                return (
                  <React.Fragment key={index}>
                    {renderDay({
                      date: day.date,
                      isSelected: isSelectedDay,
                      isToday: isTodayDay,
                      isCurrentMonth: day.isCurrentMonth,
                      isDisabled: isDisabledDay,
                      onPress: () => onSelectDay(day.date),
                    })}
                  </React.Fragment>
                );
              }

              return (
                <CalendarCell
                  key={index}
                  day={day}
                  isSelected={isSelectedDay}
                  isToday={isTodayDay}
                  isDisabled={isDisabledDay}
                  theme={theme}
                  styles={styles}
                  monthNamesShort={monthNamesShort}
                  onPress={onSelectDay}
                  cellRef={el => {
                    dayRefs.current[index] = el;
                  }}
                />
              );
            })}
          </HStack>
        ))}
      </VStack>
    </>
  );
};

export default React.memo(CalendarGrid);
