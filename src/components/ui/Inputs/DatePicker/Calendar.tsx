import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable } from 'react-native';
import { Box, HStack, Text, VStack } from '@ui';
import {
  calendarStyles,
  timePickerStyles,
  getContainerSizeStyle,
  mergeStyle,
} from './Styles';
import type { DatePickerTheme, DatePickerStyles, DatePickerMode } from './Styles';
import type {
  RenderDayParams,
  RenderHeaderParams,
  RenderFooterParams,
} from './index';
import {
  isSameDay,
  startOfDay,
  isDateDisabled,
  combineDateAndTime,
  to12Hour,
  to24Hour,
  pad2,
  getHourList,
  getMinuteList,
} from './utils';
import { useCalendarNavigation } from './useCalendarNavigation';
import CalendarHeader from './CalendarHeader';
import CalendarGrid from './CalendarGrid';
import PickerGrid from './PickerGrid';
import TimeColumn from './TimeColumn';

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
  const [focusedDayIndex, setFocusedDayIndex] = useState<number | null>(null);
  const dayRefs = useRef<Array<any>>([]);

  // Preserves the original behavior: when no maximumDate is supplied for a
  // pure date picker, future dates are disabled by default. New time/datetime
  // modes are not artificially capped at "now" since there's no legacy usage
  // to preserve there.
  const effectiveMaxDate = useMemo(
    () => maximumDate,
    [maximumDate],
  );

  const {
    currentMonth,
    viewMode,
    monthGrid,
    yearOptions,
    goToPrevMonth,
    goToNextMonth,
    goToPrevYear,
    goToNextYear,
    showMonthPicker,
    showYearPicker,
    backToDays,
    selectMonth,
    selectYear,
    setCurrentMonth,
  } = useCalendarNavigation(value, minimumDate, effectiveMaxDate);

  const handleDaySelect = useCallback(
    (date: Date) => {
      if (isDateDisabled(date, minimumDate, effectiveMaxDate)) return;
      const next = mode === 'date' ? date : combineDateAndTime(date, value);
      onChange(next);
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
      if (mode === 'time') onClose();
    },
    [mode, value, hourFormat, onChange, onClose],
  );

  const handleMinuteSelect = useCallback(
    (minute: number) => {
      const next = new Date(value);
      next.setMinutes(minute);
      onChange(next);
      if (mode === 'time') onClose();
    },
    [mode, value, onChange, onClose],
  );

  const handleAmPmSelect = useCallback(
    (isPM: boolean) => {
      const next = new Date(value);
      const hour12 = to12Hour(value.getHours());
      next.setHours(to24Hour(hour12, isPM));
      onChange(next);
      if (mode === 'time') onClose();
    },
    [mode, value, onChange, onClose],
  );

  const handleNow = useCallback(() => {
    const now = new Date();
    if (mode === 'time') {
      onChange(combineDateAndTime(value, now));
      onClose();
      return;
    }
    if (isDateDisabled(startOfDay(now), minimumDate, effectiveMaxDate)) return;
    onChange(mode === 'datetime' ? now : startOfDay(now));
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    if (mode === 'date') onClose();
  }, [mode, value, minimumDate, effectiveMaxDate, onChange, onClose, setCurrentMonth]);

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

  // "Selected" reflects the true chosen `value` (which defaults to today when
  // nothing has been picked yet — see index.tsx's `selectedDate || new Date()`),
  // not merely which month/year is currently being *browsed* (`currentMonth`).
  // Using `currentMonth` here would highlight whatever the user last navigated
  // to via the chevrons even if they never actually picked a date there, and
  // would never fall back to the current year/month when nothing is selected.
  const monthPickerItems = useMemo(
    () =>
      monthNames.map((name, index) => ({
        value: index,
        label: name,
        isSelected: index === value.getMonth() && currentMonth.getFullYear() === value.getFullYear(),
      })),
    [monthNames, currentMonth, value],
  );

  const yearPickerItems = useMemo(
    () =>
      yearOptions.map(year => ({
        value: year,
        label: String(year),
        isSelected: year === value.getFullYear(),
      })),
    [yearOptions, value],
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
          onPrevMonth: goToPrevMonth,
          onNextMonth: goToNextMonth,
          onPrevYear: goToPrevYear,
          onNextYear: goToNextYear,
          onToggleMonthDropdown: showMonthPicker,
          onToggleYearDropdown: showYearPicker,
        })
      ) : mode !== 'time' ? (
        <CalendarHeader
          viewMode={viewMode}
          monthLabel={monthLabel}
          yearLabel={yearLabel}
          theme={theme}
          styles={styles}
          onPrevMonth={goToPrevMonth}
          onNextMonth={goToNextMonth}
          onShowMonthPicker={showMonthPicker}
          onShowYearPicker={showYearPicker}
          onBackToDays={backToDays}
        />
      ) : null}

      {/* Month/year picker grids replace the day grid (and, for datetime, the
          whole day+time row) in place — no floating overlay. */}
      {mode !== 'time' && viewMode === 'months' && (
        <PickerGrid
          items={monthPickerItems}
          onSelect={selectMonth}
          theme={theme}
          columns={4}
          scrollable={false}
          style={styles?.monthDropdown}
        />
      )}

      {mode !== 'time' && viewMode === 'years' && (
        <PickerGrid
          items={yearPickerItems}
          onSelect={selectYear}
          theme={theme}
          columns={4}
          scrollable
          style={styles?.yearDropdown}
        />
      )}

      {viewMode === 'days' && mode === 'date' && (
        <CalendarGrid
          monthGrid={monthGrid}
          value={value}
          minimumDate={minimumDate}
          effectiveMaxDate={effectiveMaxDate}
          dayNames={dayNames}
          monthNamesShort={monthNamesShort}
          theme={theme}
          styles={styles}
          onSelectDay={handleDaySelect}
          renderDay={renderDay}
          dayRefs={dayRefs}
        />
      )}

      {viewMode === 'days' && mode === 'time' && (
        <Box {...mergeStyle(timePickerStyles.standaloneWrapper, styles?.timeContainer)}>
          {timeColumnsRow}
        </Box>
      )}

      {viewMode === 'days' && mode === 'datetime' && (
        <HStack {...calendarStyles.dateTimeRow}>
          <VStack {...calendarStyles.calendarColumn}>
            <CalendarGrid
              monthGrid={monthGrid}
              value={value}
              minimumDate={minimumDate}
              effectiveMaxDate={effectiveMaxDate}
              dayNames={dayNames}
              monthNamesShort={monthNamesShort}
              theme={theme}
              styles={styles}
              onSelectDay={handleDaySelect}
              renderDay={renderDay}
              dayRefs={dayRefs}
            />
          </VStack>
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
        </HStack>
      )}
    </Box>
  );
};

export default React.memo(Calendar);
