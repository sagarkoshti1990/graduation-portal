import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Pressable } from 'react-native';
import { Box, Text, HStack, VStack, ScrollView } from '@ui';
import { LucideIcon } from '@ui';
import {
  calendarStyles,
  getDateCellStyle,
  getDateTextStyle,
  dropdownStyles,
  getDropdownOptionStyle,
  getDropdownOptionTextStyle,
  timePickerStyles,
  getTimeRowStyle,
  getTimeRowTextStyle,
  getDoneButtonStyle,
  getContainerSizeStyle,
  mergeStyle,
  DatePickerTheme,
  DatePickerStyles,
  DatePickerMode,
} from './Styles';
import type {
  RenderDayParams,
  RenderHeaderParams,
  RenderFooterParams,
} from './index';
import {
  getMonthGrid,
  isSameDay,
  startOfDay,
  isDateDisabled,
  combineDateAndTime,
  to12Hour,
  to24Hour,
  pad2,
  getHourList,
  getMinuteList,
  getYearRange,
  formatDate,
  StyleObject,
} from './utils';

const TIME_ROW_HEIGHT = 32;

interface CalendarLabels {
  today: string;
  now: string;
  clear: string;
  cancel: string;
  done: string;
}

interface CalendarProps {
  mode: DatePickerMode;
  value: Date;
  onChange: (date: Date) => void;
  onClose: () => void;
  onClear: () => void;
  onCancel: () => void;
  maximumDate?: Date;
  minimumDate?: Date;
  calendarId?: string;
  hourFormat: 12 | 24;
  theme: DatePickerTheme;
  styles?: DatePickerStyles;
  monthNames: string[];
  monthNamesShort: string[];
  dayNames: string[];
  labels: CalendarLabels;
  renderHeader?: (params: RenderHeaderParams) => React.ReactNode;
  renderFooter?: (params: RenderFooterParams) => React.ReactNode;
  renderDay?: (params: RenderDayParams) => React.ReactNode;
}

interface TimeColumnItem {
  value: number | string;
  label: string;
}

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

  useEffect(() => {
    if (selectedIndex >= 0 && scrollRef.current?.scrollTo) {
      scrollRef.current.scrollTo({
        y: Math.max(0, selectedIndex * TIME_ROW_HEIGHT - TIME_ROW_HEIGHT * 2),
        animated: true,
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
      >
        {items.map(item => {
          const isSelected = item.value === selectedValue;
          return (
            <Pressable
              key={String(item.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={item.label}
              onPress={() => onSelect(item.value)}
            >
              <Box {...timePickerStyles.row} {...getTimeRowStyle(isSelected, theme)}>
                <Text {...timePickerStyles.rowText} {...getTimeRowTextStyle(isSelected, theme)}>
                  {item.label}
                </Text>
              </Box>
            </Pressable>
          );
        })}
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

const Calendar: React.FC<CalendarProps> = ({
  mode,
  value,
  onChange,
  onClose,
  onClear,
  onCancel,
  maximumDate,
  minimumDate,
  calendarId,
  hourFormat,
  theme,
  styles,
  monthNames,
  monthNamesShort,
  dayNames,
  labels,
  renderHeader,
  renderFooter,
  renderDay,
}) => {
  const [currentMonth, setCurrentMonth] = useState(
    new Date(value.getFullYear(), value.getMonth(), 1),
  );
  const [activeDropdown, setActiveDropdown] = useState<'month' | 'year' | null>(null);
  const [focusedDayIndex, setFocusedDayIndex] = useState<number | null>(null);
  const dayRefs = useRef<Array<any>>([]);

  // Preserves the original behavior: when no maximumDate is supplied for a
  // pure date picker, future dates are disabled by default. New time/datetime
  // modes are not artificially capped at "now" since there's no legacy usage
  // to preserve there.
  const effectiveMaxDate = useMemo(
    () => maximumDate ?? (mode === 'date' ? new Date() : undefined),
    [maximumDate, mode],
  );

  const monthGrid = useMemo(() => getMonthGrid(currentMonth), [currentMonth]);

  const navigateMonth = useCallback((direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const next = new Date(prev);
      next.setMonth(prev.getMonth() + (direction === 'prev' ? -1 : 1));
      return next;
    });
    setActiveDropdown(null);
    setFocusedDayIndex(null);
  }, []);

  const navigateYear = useCallback((direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const next = new Date(prev);
      next.setFullYear(prev.getFullYear() + (direction === 'prev' ? -1 : 1));
      return next;
    });
    setActiveDropdown(null);
    setFocusedDayIndex(null);
  }, []);

  const handleSelectMonth = useCallback((monthIndex: number) => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), monthIndex, 1));
    setActiveDropdown(null);
  }, []);

  const handleSelectYear = useCallback((year: number) => {
    setCurrentMonth(prev => new Date(year, prev.getMonth(), 1));
    setActiveDropdown(null);
  }, []);

  const toggleDropdown = useCallback((which: 'month' | 'year') => {
    setActiveDropdown(prev => (prev === which ? null : which));
  }, []);

  const handleDaySelect = useCallback(
    (date: Date) => {
      if (isDateDisabled(date, minimumDate, effectiveMaxDate)) return;
      const next = mode === 'date' ? date : combineDateAndTime(date, value);
      onChange(next);
      setActiveDropdown(null);
      if (mode === 'date') onClose();
    },
    [mode, value, minimumDate, effectiveMaxDate, onChange, onClose],
  );

  const handleHourSelect = useCallback(
    (hour: number) => {
      const next = new Date(value);
      if (hourFormat === 24) {
        next.setHours(hour);
      } else {
        const isPM = value.getHours() >= 12;
        next.setHours(to24Hour(hour, isPM));
      }
      onChange(next);
    },
    [value, hourFormat, onChange],
  );

  const handleMinuteSelect = useCallback(
    (minute: number) => {
      const next = new Date(value);
      next.setMinutes(minute);
      onChange(next);
    },
    [value, onChange],
  );

  const handleAmPmSelect = useCallback(
    (isPM: boolean) => {
      const next = new Date(value);
      const hour12 = to12Hour(value.getHours());
      next.setHours(to24Hour(hour12, isPM));
      onChange(next);
    },
    [value, onChange],
  );

  const handleNow = useCallback(() => {
    const now = new Date();
    if (mode === 'time') {
      onChange(combineDateAndTime(value, now));
      return;
    }
    if (isDateDisabled(startOfDay(now), minimumDate, effectiveMaxDate)) return;
    onChange(mode === 'datetime' ? now : startOfDay(now));
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    if (mode === 'date') onClose();
  }, [mode, value, minimumDate, effectiveMaxDate, onChange, onClose]);

  const handleClear = useCallback(() => {
    onClear();
  }, [onClear]);

  const handleCancelPress = useCallback(() => {
    onCancel();
  }, [onCancel]);

  const handleDone = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleGridKeyDown = useCallback(
    (e: any) => {
      const key = e?.key;
      const deltas: Record<string, number> = {
        ArrowLeft: -1,
        ArrowRight: 1,
        ArrowUp: -7,
        ArrowDown: 7,
      };
      const delta = deltas[key];
      if (delta === undefined) return;
      e.preventDefault?.();
      const base =
        focusedDayIndex ?? Math.max(0, monthGrid.findIndex(day => isSameDay(day.date, value)));
      const nextIndex = Math.min(41, Math.max(0, base + delta));
      setFocusedDayIndex(nextIndex);
      dayRefs.current[nextIndex]?.focus?.();
    },
    [focusedDayIndex, monthGrid, value],
  );

  const monthLabel = monthNames[currentMonth.getMonth()];
  const yearLabel = String(currentMonth.getFullYear());
  const yearOptions = useMemo(
    () => getYearRange(currentMonth.getFullYear(), minimumDate, effectiveMaxDate),
    [currentMonth, minimumDate, effectiveMaxDate],
  );

  const hourItems = useMemo(
    () => getHourList(hourFormat).map(hour => ({ value: hour, label: pad2(hour) })),
    [hourFormat],
  );
  const minuteItems = useMemo(
    () => getMinuteList().map(minute => ({ value: minute, label: pad2(minute) })),
    [],
  );
  const ampmItems = useMemo(
    () => [
      { value: 'AM', label: 'AM' },
      { value: 'PM', label: 'PM' },
    ],
    [],
  );

  const selectedHour = hourFormat === 24 ? value.getHours() : to12Hour(value.getHours());
  const selectedMinute = value.getMinutes();
  const selectedAmPm = value.getHours() >= 12 ? 'PM' : 'AM';

  const dayGridSection = (
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
              const isTodayDay = isSameDay(day.date, new Date());
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
                      onPress: () => handleDaySelect(day.date),
                    })}
                  </React.Fragment>
                );
              }

              const cellStyle = {
                ...calendarStyles.dateCell,
                ...getDateCellStyle(isSelectedDay, isTodayDay, day.isCurrentMonth, isDisabledDay, theme),
                ...styles?.dayCell,
                ...(isSelectedDay ? styles?.selectedDay : null),
                ...(isTodayDay && !isSelectedDay ? styles?.today : null),
                ...(isDisabledDay ? styles?.disabledDay : null),
              };
              const textStyle = {
                ...calendarStyles.dateText,
                ...getDateTextStyle(isSelectedDay, isTodayDay, day.isCurrentMonth, theme),
              };

              return (
                <Pressable
                  key={index}
                  ref={el => {
                    dayRefs.current[index] = el;
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={formatDate(day.date, 'DD MMM YYYY', monthNamesShort)}
                  accessibilityState={{ selected: isSelectedDay, disabled: isDisabledDay }}
                  onPress={(e: any) => {
                    e?.stopPropagation?.();
                    handleDaySelect(day.date);
                  }}
                  disabled={isDisabledDay}
                >
                  <Box {...cellStyle}>
                    <Text {...textStyle}>{day.date.getDate()}</Text>
                  </Box>
                </Pressable>
              );
            })}
          </HStack>
        ))}
      </VStack>
    </>
  );

  const timeColumnsRow = (
    <HStack {...timePickerStyles.columnsRow} accessibilityLabel="Time picker">
      <TimeColumn
        items={hourItems}
        selectedValue={selectedHour}
        onSelect={handleHourSelect}
        theme={theme}
        style={styles?.hourColumn}
        label="Hour"
        accessibilityLabel="Hour"
      />
      <TimeColumn
        items={minuteItems}
        selectedValue={selectedMinute}
        onSelect={handleMinuteSelect}
        theme={theme}
        style={styles?.minuteColumn}
        label="Minute"
        accessibilityLabel="Minute"
      />
      {hourFormat === 12 && (
        <TimeColumn
          items={ampmItems}
          selectedValue={selectedAmPm}
          onSelect={(v: string) => handleAmPmSelect(v === 'PM')}
          theme={theme}
          style={styles?.ampmColumn}
          label="AM/PM"
          accessibilityLabel="AM or PM"
        />
      )}
    </HStack>
  );

  return (
    <Box
      {...mergeStyle({ ...calendarStyles.container, ...getContainerSizeStyle(mode) }, styles?.calendar)}
      data-calendar-container={calendarId || undefined}
      accessibilityRole="none"
      {...({ onKeyDown: handleGridKeyDown } as any)}
    >
      {renderHeader ? (
        renderHeader({
          monthLabel,
          yearLabel,
          onPrevMonth: () => navigateMonth('prev'),
          onNextMonth: () => navigateMonth('next'),
          onPrevYear: () => navigateYear('prev'),
          onNextYear: () => navigateYear('next'),
          onToggleMonthDropdown: () => toggleDropdown('month'),
          onToggleYearDropdown: () => toggleDropdown('year'),
        })
      ) : mode !== 'time' ? (
        <HStack {...mergeStyle(calendarStyles.headerContainer, styles?.header)}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Previous month"
            onPress={() => navigateMonth('prev')}
          >
            <LucideIcon name="ChevronLeft" size={20} color={theme.text} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${monthLabel}, choose month`}
            onPress={() => toggleDropdown('month')}
          >
            <HStack {...calendarStyles.monthYearContainer}>
              <Text {...calendarStyles.monthYearText}>{monthLabel}</Text>
              <LucideIcon name="ChevronDown" size={16} color={theme.muted} />
            </HStack>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${yearLabel}, choose year`}
            onPress={() => toggleDropdown('year')}
          >
            <HStack {...calendarStyles.monthYearContainer}>
              <Text {...calendarStyles.monthYearText}>{yearLabel}</Text>
              <LucideIcon name="ChevronDown" size={16} color={theme.muted} />
            </HStack>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Next month"
            onPress={() => navigateMonth('next')}
          >
            <LucideIcon name="ChevronRight" size={20} color={theme.text} />
          </Pressable>
        </HStack>
      ) : null}

      {activeDropdown && (
        <>
          {/* Full-calendar click-catcher: guarantees taps meant to dismiss the
              dropdown can never "fall through" onto a day cell underneath,
              and that the panel itself always renders above the grid. */}
          <Pressable
            accessibilityRole="none"
            accessibilityLabel="Close dropdown"
            onPress={() => setActiveDropdown(null)}
            {...dropdownStyles.backdrop}
          />
          <Box
            {...mergeStyle(
              dropdownStyles.container,
              activeDropdown === 'month' ? styles?.monthDropdown : styles?.yearDropdown,
            )}
          >
            <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
              {activeDropdown === 'month'
                ? monthNames.map((name, index) => {
                    const isSelected = index === currentMonth.getMonth();
                    return (
                      <Pressable
                        key={name}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isSelected }}
                        onPress={() => handleSelectMonth(index)}
                      >
                        <Box {...dropdownStyles.option} {...getDropdownOptionStyle(isSelected, theme)}>
                          <Text
                            {...dropdownStyles.optionText}
                            {...getDropdownOptionTextStyle(isSelected, theme)}
                          >
                            {name}
                          </Text>
                        </Box>
                      </Pressable>
                    );
                  })
                : yearOptions.map(year => {
                    const isSelected = year === currentMonth.getFullYear();
                    return (
                      <Pressable
                        key={year}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isSelected }}
                        onPress={() => handleSelectYear(year)}
                      >
                        <Box {...dropdownStyles.option} {...getDropdownOptionStyle(isSelected, theme)}>
                          <Text
                            {...dropdownStyles.optionText}
                            {...getDropdownOptionTextStyle(isSelected, theme)}
                          >
                            {year}
                          </Text>
                        </Box>
                      </Pressable>
                    );
                  })}
            </ScrollView>
          </Box>
        </>
      )}

      {mode === 'date' && dayGridSection}

      {mode === 'time' && (
        <Box {...mergeStyle(timePickerStyles.standaloneWrapper, styles?.timeContainer)}>
          {timeColumnsRow}
        </Box>
      )}

      {mode === 'datetime' && (
        <HStack {...calendarStyles.dateTimeRow}>
          <VStack {...calendarStyles.calendarColumn}>{dayGridSection}</VStack>
          <Box {...mergeStyle(timePickerStyles.dateTimeColumn, styles?.timeContainer)}>
            {timeColumnsRow}
          </Box>
        </HStack>
      )}

      {renderFooter ? (
        renderFooter({
          onToday: handleNow,
          onClear: handleClear,
          onCancel: handleCancelPress,
          onDone: handleDone,
          labels,
        })
      ) : (
        <HStack {...mergeStyle(calendarStyles.footerContainer, styles?.footer)}>
          <HStack {...calendarStyles.footerGroup}>
            <Pressable accessibilityRole="button" accessibilityLabel={labels.clear} onPress={handleClear}>
              <Text {...mergeStyle(calendarStyles.footerButtonText, styles?.button)}>{labels.clear}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={mode === 'date' ? labels.today : labels.now}
              onPress={handleNow}
            >
              <Text {...mergeStyle(calendarStyles.footerButtonText, styles?.button)}>
                {mode === 'date' ? labels.today : labels.now}
              </Text>
            </Pressable>
          </HStack>
          <HStack {...calendarStyles.footerGroup}>
            <Pressable accessibilityRole="button" accessibilityLabel={labels.cancel} onPress={handleCancelPress}>
              <Text {...mergeStyle(calendarStyles.footerButtonText, styles?.button)}>{labels.cancel}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={labels.done} onPress={handleDone}>
              <Box {...calendarStyles.doneButton} {...getDoneButtonStyle(theme)}>
                <Text {...mergeStyle(calendarStyles.doneButtonText, styles?.button)}>{labels.done}</Text>
              </Box>
            </Pressable>
          </HStack>
        </HStack>
      )}
    </Box>
  );
};

export default React.memo(Calendar);
