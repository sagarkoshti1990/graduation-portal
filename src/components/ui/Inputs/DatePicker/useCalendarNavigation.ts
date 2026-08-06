import { useCallback, useMemo, useState } from 'react';
import { getMonthGrid, getYearRange } from './utils';

export type CalendarViewMode = 'days' | 'months' | 'years';

/**
 * Owns the calendar's month/year navigation state — which month is being
 * displayed, and whether the day grid, a month-picker grid, or a year-picker
 * grid is currently showing. Pure bookkeeping/derivations only; selecting a
 * day is handled by the caller (it needs `value`/`onChange`/`onClose`, which
 * this hook deliberately doesn't touch).
 */
export function useCalendarNavigation(
  value: Date,
  minimumDate?: Date,
  maximumDate?: Date,
) {
  const [currentMonth, setCurrentMonth] = useState(
    () => new Date(value.getFullYear(), value.getMonth(), 1),
  );
  const [viewMode, setViewMode] = useState<CalendarViewMode>('days');

  const monthGrid = useMemo(() => getMonthGrid(currentMonth), [currentMonth]);
  const yearOptions = useMemo(
    () => getYearRange(currentMonth.getFullYear(), minimumDate, maximumDate),
    [currentMonth, minimumDate, maximumDate],
  );

  const goToPrevMonth = useCallback(() => {
    setCurrentMonth(prev => {
      const next = new Date(prev);
      next.setMonth(prev.getMonth() - 1);
      return next;
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentMonth(prev => {
      const next = new Date(prev);
      next.setMonth(prev.getMonth() + 1);
      return next;
    });
  }, []);

  // Kept for the `renderHeader` render-prop's `onPrevYear`/`onNextYear`
  // params (public API, backward compatible) — the default header UI itself
  // navigates years via the year-picker grid instead of dedicated buttons.
  const goToPrevYear = useCallback(() => {
    setCurrentMonth(prev => {
      const next = new Date(prev);
      next.setFullYear(prev.getFullYear() - 1);
      return next;
    });
  }, []);

  const goToNextYear = useCallback(() => {
    setCurrentMonth(prev => {
      const next = new Date(prev);
      next.setFullYear(prev.getFullYear() + 1);
      return next;
    });
  }, []);

  const showMonthPicker = useCallback(() => setViewMode('months'), []);
  const showYearPicker = useCallback(() => setViewMode('years'), []);
  const backToDays = useCallback(() => setViewMode('days'), []);

  // Selecting a month/year only ever moves `currentMonth` and returns to the
  // day grid — it never touches the selected `value`/calls `onChange`, same
  // as the dropdown it replaces.
  const selectMonth = useCallback((monthIndex: number) => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), monthIndex, 1));
    setViewMode('days');
  }, []);

  const selectYear = useCallback((year: number) => {
    setCurrentMonth(prev => new Date(year, prev.getMonth(), 1));
    setViewMode('days');
  }, []);

  return {
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
  };
}
