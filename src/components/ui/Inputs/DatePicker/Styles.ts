import type { StyleObject } from './utils';
import { mergeStyle } from './utils';

// ---------------------------------------------------------------------------
// Theme tokens + color presets
// ---------------------------------------------------------------------------

export type DatePickerColor =
  | 'blue'
  | 'green'
  | 'orange'
  | 'red'
  | 'purple'
  | 'gray';

export type DatePickerMode = 'date' | 'time' | 'datetime';

export interface DatePickerTheme {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  text: string;
  muted: string;
  border: string;
  background: string;
  hover: string;
  disabled: string;
  danger: string;
  success: string;
}

// Matches the original hardcoded tokens exactly, so the default (no `color`
// prop) look is byte-for-byte identical to the previous implementation.
const DEFAULT_THEME: DatePickerTheme = {
  primary: '$primary500',
  primaryLight: '$primary100',
  primaryDark: '$primary700',
  text: '$textForeground',
  muted: '$textMutedForeground',
  border: '$borderLight200',
  background: '$white',
  hover: '$primary600',
  disabled: '$textMutedForeground',
  danger: '$red600',
  success: '$green600',
};

type ColorPresetTokens = Pick<
  DatePickerTheme,
  'primary' | 'primaryLight' | 'primaryDark' | 'hover'
>;

// Only references tokens that already exist in src/config/theme.ts /
// @gluestack-ui/config. `gray` only has 50/100/300/600/700 defined app-wide,
// so it (and every other preset, for consistency) sticks to that subset.
const COLOR_PRESETS: Record<DatePickerColor, ColorPresetTokens> = {
  blue: {
    primary: '$blue600',
    primaryLight: '$blue100',
    primaryDark: '$blue700',
    hover: '$blue50',
  },
  green: {
    primary: '$green600',
    primaryLight: '$green100',
    primaryDark: '$green700',
    hover: '$green50',
  },
  orange: {
    primary: '$orange600',
    primaryLight: '$orange100',
    primaryDark: '$orange700',
    hover: '$orange50',
  },
  red: {
    primary: '$red600',
    primaryLight: '$red100',
    primaryDark: '$red700',
    hover: '$red50',
  },
  purple: {
    primary: '$purple600',
    primaryLight: '$purple100',
    primaryDark: '$purple700',
    hover: '$purple50',
  },
  gray: {
    primary: '$gray600',
    primaryLight: '$gray100',
    primaryDark: '$gray700',
    hover: '$gray50',
  },
};

export const buildTheme = (
  color?: DatePickerColor,
  themeOverride?: Partial<DatePickerTheme>,
): DatePickerTheme => ({
  ...DEFAULT_THEME,
  ...(color ? COLOR_PRESETS[color] : null),
  ...themeOverride,
});

// `date` keeps the original fixed width exactly (backward compatible sizing);
// `time`/`datetime` need more room for the hour/minute/AM-PM columns.
export const getContainerSizeStyle = (mode: DatePickerMode) => {
  if (mode === 'time') return { maxWidth: 300 };
  if (mode === 'datetime') return { maxWidth: 460 };
  return {};
};

// ---------------------------------------------------------------------------
// Style override shape — every element below can be overridden via the
// `styles` prop. Never use inline styles; everything comes from this file.
// ---------------------------------------------------------------------------

export interface DatePickerStyles {
  container?: StyleObject;
  input?: StyleObject;
  popup?: StyleObject;
  calendar?: StyleObject;
  header?: StyleObject;
  footer?: StyleObject;
  monthDropdown?: StyleObject;
  yearDropdown?: StyleObject;
  dayCell?: StyleObject;
  selectedDay?: StyleObject;
  today?: StyleObject;
  disabledDay?: StyleObject;
  timeContainer?: StyleObject;
  hourColumn?: StyleObject;
  minuteColumn?: StyleObject;
  ampmColumn?: StyleObject;
  button?: StyleObject;
}

export { mergeStyle };

// ---------------------------------------------------------------------------
// Calendar (day grid) styles — unchanged from the original implementation
// ---------------------------------------------------------------------------

export const calendarStyles = {
  container: {
    bg: '$white' as const,
    borderRadius: '$lg' as const,
    borderWidth: 1,
    borderColor: '$borderLight200' as const,
    p: '$3' as const,
    maxWidth: 300,
    shadowColor: '$foreground' as const,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  headerContainer: {
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    mb: '$3' as const,
  },
  monthYearText: {
    fontSize: '$sm' as const,
    fontWeight: '$medium' as const,
    color: '$textForeground' as const,
  },
  // Bordered "select box" look for the month/year header controls, matching
  // the design's pill-shaped dropdown triggers instead of plain text.
  monthYearContainer: {
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    space: 'xs' as const,
    borderWidth: 1,
    borderColor: '$borderLight200' as const,
    borderRadius: '$md' as const,
    px: '$2' as const,
    py: '$1.5' as const,
  },
  yearNavigationContainer: {
    space: 'xs' as const,
  },
  dayHeaderContainer: {
    justifyContent: 'space-around' as const,
    my: '$2' as const,
  },
  dayHeaderBox: {
    width: 32,
    alignItems: 'center' as const,
  },
  dayHeaderText: {
    fontSize: '$xs' as const,
    fontWeight: '$medium' as const,
    color: '$textMutedForeground' as const,
  },
  calendarGrid: {
    space: 'xs' as const,
  },
  calendarRow: {
    justifyContent: 'space-around' as const,
  },
  // datetime mode: calendar on the left, time columns on the right.
  dateTimeRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    space: 'md' as const,
  },
  calendarColumn: {
    flexShrink: 0,
  },
  dateCell: {
    width: 32,
    height: 32,
    borderRadius: '$md' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  dateText: {
    fontSize: '$sm' as const,
  },
  // Two groups: Clear/Today (or Now) on the left, Cancel/Done on the right —
  // matches the design instead of evenly spacing all four buttons.
  footerContainer: {
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    mt: '$3' as const,
    pt: '$3' as const,
    borderTopWidth: 1,
    borderColor: '$borderLight200' as const,
  },
  footerGroup: {
    alignItems: 'center' as const,
    space: 'md' as const,
  },
  footerButtonText: {
    fontSize: '$sm' as const,
    fontWeight: '$medium' as const,
    color: '$primary500' as const,
  },
  doneButton: {
    borderRadius: '$md' as const,
    px: '$4' as const,
    py: '$1.5' as const,
  },
  doneButtonText: {
    fontSize: '$sm' as const,
    fontWeight: '$medium' as const,
    color: '$white' as const,
  },
};

export const getDoneButtonStyle = (theme: DatePickerTheme = DEFAULT_THEME) => ({
  bg: theme.primary,
});

// Helper functions for dynamic styles — now theme-aware so `color` presets
// actually change the selected/today highlight, while the default `theme`
// (no `color` prop) reproduces the exact previous hardcoded values.
export const getDateCellStyle = (
  isSelectedDay: boolean,
  isTodayDay: boolean,
  isCurrentMonth: boolean,
  isDisabledDay: boolean,
  theme: DatePickerTheme = DEFAULT_THEME,
) => {
  return {
    bg: isSelectedDay ? theme.primary : 'transparent',
    borderWidth: isTodayDay && !isSelectedDay ? 1.5 : 0,
    borderColor: isTodayDay && !isSelectedDay ? theme.primary : 'transparent',
    opacity: isDisabledDay ? 0.4 : 1,
  };
};

export const getDateTextStyle = (
  isSelectedDay: boolean,
  isTodayDay: boolean,
  isCurrentMonth: boolean,
  theme: DatePickerTheme = DEFAULT_THEME,
) => {
  return {
    fontWeight: isSelectedDay || isTodayDay ? ('$semibold' as const) : ('$normal' as const),
    color: isSelectedDay ? '$white' : isTodayDay ? theme.primary : !isCurrentMonth ? theme.muted : theme.text,
  };
};

// ---------------------------------------------------------------------------
// Month/year mini-dropdowns (calendar header)
// ---------------------------------------------------------------------------

export const dropdownStyles = {
  // Invisible full-calendar click-catcher, rendered only while a dropdown is
  // open. Sits above the day grid (which has no z-index of its own) so a tap
  // meant to dismiss the dropdown can never "fall through" onto a day cell,
  // and below the panel itself so option rows stay clickable.
  backdrop: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 15,
  },
  // Positioned relative to the calendar's own container (not the small
  // month/year label) so its stacking never has to compete with sibling
  // header/grid content for who's "on top".
  container: {
    position: 'absolute' as const,
    top: 44,
    left: '$3' as const,
    right: '$3' as const,
    zIndex: 20,
    bg: '$white' as const,
    borderRadius: '$md' as const,
    borderWidth: 1,
    borderColor: '$borderLight200' as const,
    maxHeight: 180,
    shadowColor: '$foreground' as const,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  option: {
    px: '$3' as const,
    py: '$2' as const,
  },
  optionText: {
    fontSize: '$sm' as const,
    color: '$textForeground' as const,
  },
};

export const getDropdownOptionStyle = (
  isSelected: boolean,
  theme: DatePickerTheme = DEFAULT_THEME,
) => ({
  bg: isSelected ? theme.primaryLight : 'transparent',
});

export const getDropdownOptionTextStyle = (
  isSelected: boolean,
  theme: DatePickerTheme = DEFAULT_THEME,
) => ({
  color: isSelected ? theme.primaryDark : theme.text,
  fontWeight: isSelected ? ('$semibold' as const) : ('$normal' as const),
});

// ---------------------------------------------------------------------------
// Time picker (hour / minute / AM-PM columns)
// ---------------------------------------------------------------------------

export const timePickerStyles = {
  // Row of Hour/Minute/AM-PM columns, shared by both the standalone time
  // picker and the datetime layout.
  columnsRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
    alignItems: 'flex-start' as const,
    space: 'xs' as const,
  },
  // mode="time": columns sit below a top divider, centered.
  standaloneWrapper: {
    mt: '$3' as const,
    pt: '$3' as const,
    borderTopWidth: 1,
    borderColor: '$borderLight200' as const,
  },
  // mode="datetime": columns sit beside the calendar behind a left divider.
  dateTimeColumn: {
    pl: '$3' as const,
    borderLeftWidth: 1,
    borderColor: '$borderLight200' as const,
  },
  columnWrapper: {
    alignItems: 'center' as const,
  },
  columnHeaderText: {
    fontSize: '$xs' as const,
    fontWeight: '$medium' as const,
    color: '$textMutedForeground' as const,
    mb: '$1' as const,
  },
  stepperButton: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    py: '$0.5' as const,
  },
  column: {
    maxHeight: 160,
    width: 52,
  },
  row: {
    height: 32,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderRadius: '$md' as const,
  },
  rowText: {
    fontSize: '$sm' as const,
  },
};

export const getTimeRowStyle = (
  isSelected: boolean,
  theme: DatePickerTheme = DEFAULT_THEME,
) => ({
  bg: isSelected ? theme.primary : 'transparent',
});

export const getTimeRowTextStyle = (
  isSelected: boolean,
  theme: DatePickerTheme = DEFAULT_THEME,
) => ({
  color: isSelected ? '$white' : theme.text,
  fontWeight: isSelected ? ('$semibold' as const) : ('$normal' as const),
});

// ---------------------------------------------------------------------------
// DatePicker (input trigger + popup positioning) — unchanged from the
// original implementation
// ---------------------------------------------------------------------------

export const datePickerStyles = {
  containerBox: {
    position: 'relative' as const,
  },
  inputContainer: {
    position: 'relative' as const,
  },
  inputHStack: {
    alignItems: 'center' as const,
    space: 'sm' as const,
    px: '$3' as const,
    width: '$full' as const,
  },
  // Matches the app's existing field-error convention (e.g. SchemaFormRenderer's
  // FieldContainer): $error600, $xs, no extra margin beyond parent spacing.
  errorText: {
    color: '$error600' as const,
    fontSize: '$xs' as const,
    mt: '$1' as const,
  },
  getCalendarContentStyle: (platform: string, calendarPosition: { top: number; left: number }) => {
    const baseStyle: any = {
      position: 'absolute' as const,
    };

    if (platform !== 'web') {
      baseStyle.top = '100%';
      baseStyle.left = '$0';
      baseStyle.mt = '$2';
    }

    const platformStyles = [
      platform === 'web' && {
        position: 'fixed' as any,
        top: calendarPosition.top,
        left: calendarPosition.left,
        zIndex: 99999,
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
        width: "-webkit-fill-available"
      },
      platform === 'android' && {
        zIndex: 99999,
        elevation: 10,
      },
      platform === 'ios' && {
        zIndex: 99999,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
    ].filter(Boolean);

    return {
      ...baseStyle,
      style: platformStyles as any,
    };
  },
  getContainerBoxStyle: (platform: string) => {
    return platform === 'web' ? { overflow: 'visible' as const } : {};
  },
};
