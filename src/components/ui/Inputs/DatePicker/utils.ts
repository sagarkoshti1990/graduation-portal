// Pure helper functions for DatePicker/Calendar — no UI/React code here.
// Only the JavaScript Date API + Intl is used (no moment/dayjs/date-fns).

export type StyleObject = Record<string, any>;

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
}

export const pad2 = (value: number): string => String(value).padStart(2, '0');

export const isValidDate = (date: Date | null | undefined): date is Date =>
  !!date && !isNaN(date.getTime());

export const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export const startOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const isDateDisabled = (
  date: Date,
  minimumDate?: Date,
  maximumDate?: Date,
): boolean => {
  if (maximumDate && date > maximumDate) return true;
  if (minimumDate && date < minimumDate) return true;
  return false;
};

// Keeps the year/month/day from `datePart` and the hour/minute/second from `timePart`.
export const combineDateAndTime = (datePart: Date, timePart: Date): Date =>
  new Date(
    datePart.getFullYear(),
    datePart.getMonth(),
    datePart.getDate(),
    timePart.getHours(),
    timePart.getMinutes(),
    timePart.getSeconds(),
  );

export const to12Hour = (hour24: number): number => {
  const hour = hour24 % 12;
  return hour === 0 ? 12 : hour;
};

export const to24Hour = (hour12: number, isPM: boolean): number => {
  const hour = hour12 % 12;
  return isPM ? hour + 12 : hour;
};

// 6 rows x 7 days, Monday-first, including the leading/trailing days from the
// adjacent months — matches the existing calendar grid convention.
export const getMonthGrid = (monthDate: Date): CalendarDay[] => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = (firstDay.getDay() + 6) % 7; // Monday = 0

  const days: CalendarDay[] = [];

  // Day 0 of `month` normalizes back to the last day of `month - 1` — the
  // actual previous month. Using `month - 1` here (last day of `month - 2`)
  // was the bug: it could overcount the previous month's length, causing the
  // leading-day Date objects below to overflow forward and duplicate day 1
  // of the current month as a mislabeled "previous month" cell.
  const prevMonth = new Date(year, month, 0);
  const daysInPrevMonth = prevMonth.getDate();
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, daysInPrevMonth - i),
      isCurrentMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    days.push({ date: new Date(year, month, day), isCurrentMonth: true });
  }

  const remainingDays = 42 - days.length;
  for (let day = 1; day <= remainingDays; day++) {
    days.push({ date: new Date(year, month + 1, day), isCurrentMonth: false });
  }

  return days;
};

export const getHourList = (hourFormat: 12 | 24): number[] =>
  hourFormat === 24
    ? Array.from({ length: 24 }, (_, i) => i)
    : Array.from({ length: 12 }, (_, i) => i + 1);

export const getMinuteList = (): number[] =>
  Array.from({ length: 60 }, (_, i) => i);

export const getYearRange = (
  centerYear: number,
  minimumDate?: Date,
  maximumDate?: Date,
  span = 100,
): number[] => {
  const minYear = minimumDate ? minimumDate.getFullYear() : centerYear - span;
  const maxYear = maximumDate ? maximumDate.getFullYear() : centerYear + span;
  const years: number[] = [];
  for (let year = minYear; year <= maxYear; year++) years.push(year);
  return years;
};

// ---- Locale-aware month/day names via Intl — no hardcoded English arrays ----

const monthNameCache = new Map<string, string[]>();
const dayNameCache = new Map<string, string[]>();

export const getMonthNames = (
  locale: string,
  style: 'long' | 'short' = 'long',
): string[] => {
  const cacheKey = `${locale}:${style}`;
  const cached = monthNameCache.get(cacheKey);
  if (cached) return cached;
  const formatter = new Intl.DateTimeFormat(locale, { month: style });
  const names = Array.from({ length: 12 }, (_, month) =>
    formatter.format(new Date(2000, month, 1)),
  );
  monthNameCache.set(cacheKey, names);
  return names;
};

// Monday-first, matching getMonthGrid's convention. 2001-01-01 was a Monday.
export const getDayNames = (
  locale: string,
  style: 'long' | 'short' | 'narrow' = 'narrow',
): string[] => {
  const cacheKey = `${locale}:${style}`;
  const cached = dayNameCache.get(cacheKey);
  if (cached) return cached;
  const formatter = new Intl.DateTimeFormat(locale, { weekday: style });
  const names = Array.from({ length: 7 }, (_, day) =>
    formatter.format(new Date(2001, 0, day + 1)),
  );
  dayNameCache.set(cacheKey, names);
  return names;
};

// ---- Format engine: YYYY MMM MM DD HH hh mm ss A ----

const TOKEN_PATTERN = /YYYY|MMM|MM|DD|HH|hh|mm|ss|A/g;

export const formatDate = (
  date: Date,
  format: string,
  monthNamesShort: string[],
): string => {
  const hour24 = date.getHours();
  const hour12 = to12Hour(hour24);
  const replacements: Record<string, string> = {
    YYYY: String(date.getFullYear()),
    MMM: monthNamesShort[date.getMonth()] ?? '',
    MM: pad2(date.getMonth() + 1),
    DD: pad2(date.getDate()),
    HH: pad2(hour24),
    hh: pad2(hour12),
    mm: pad2(date.getMinutes()),
    ss: pad2(date.getSeconds()),
    A: hour24 < 12 ? 'AM' : 'PM',
  };
  return format.replace(TOKEN_PATTERN, token => replacements[token]);
};

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const TOKEN_TO_GROUP: Record<string, string> = {
  YYYY: '(\\d{4})',
  MMM: '([^\\d\\s/,-]+)',
  MM: '(\\d{1,2})',
  DD: '(\\d{1,2})',
  HH: '(\\d{1,2})',
  hh: '(\\d{1,2})',
  mm: '(\\d{1,2})',
  ss: '(\\d{1,2})',
  A: '([AaPp][Mm])',
};

// Builds a regex from a display/api format string (e.g. "DD/MM/YYYY") and maps
// matched groups back onto a Date. Supports 12/24 hour via `hh` + `A`.
export const parseWithFormat = (
  value: string,
  format: string,
  monthNamesShort: string[],
  referenceDate: Date = new Date(),
): Date | null => {
  if (!value || !value.trim()) return null;

  const tokens: string[] = [];
  const pattern = escapeRegExp(format).replace(TOKEN_PATTERN, matched => {
    tokens.push(matched);
    return TOKEN_TO_GROUP[matched];
  });

  const match = new RegExp(`^${pattern}$`).exec(value.trim());
  if (!match) return null;

  let year = referenceDate.getFullYear();
  let month = referenceDate.getMonth();
  let day = referenceDate.getDate();
  let hour = 0;
  let minute = 0;
  let second = 0;
  let hour12: number | null = null;
  let isPM = false;

  tokens.forEach((token, index) => {
    const raw = match[index + 1];
    switch (token) {
      case 'YYYY':
        year = parseInt(raw, 10);
        break;
      case 'MM':
        month = parseInt(raw, 10) - 1;
        break;
      case 'MMM': {
        const found = monthNamesShort.findIndex(
          name => name.toLowerCase() === raw.toLowerCase(),
        );
        if (found >= 0) month = found;
        break;
      }
      case 'DD':
        day = parseInt(raw, 10);
        break;
      case 'HH':
        hour = parseInt(raw, 10);
        break;
      case 'hh':
        hour12 = parseInt(raw, 10);
        break;
      case 'mm':
        minute = parseInt(raw, 10);
        break;
      case 'ss':
        second = parseInt(raw, 10);
        break;
      case 'A':
        isPM = raw.toUpperCase() === 'PM';
        break;
    }
  });

  if (hour12 !== null) {
    hour = to24Hour(hour12, isPM);
  }

  const date = new Date(year, month, day, hour, minute, second);
  return isValidDate(date) ? date : null;
};

// Parses a stored value using `apiFormat`, falling back to native Date parsing
// (mirrors the previous DatePicker's YYYY-MM-DD-then-native-Date fallback).
export const parseDateValue = (
  value: string | undefined,
  apiFormat: string,
  monthNamesShort: string[],
): Date | null => {
  if (!value || typeof value !== 'string' || value.trim() === '') return null;
  const parsed = parseWithFormat(value, apiFormat, monthNamesShort);
  if (parsed) return parsed;
  const fallback = new Date(value);
  return isValidDate(fallback) ? fallback : null;
};

export const mergeStyle = <T extends StyleObject>(
  base: T,
  override?: Partial<T>,
): T => (override ? { ...base, ...override } : base);
