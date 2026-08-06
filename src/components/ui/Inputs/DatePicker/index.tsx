import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Pressable, Platform } from 'react-native';
import { Input, InputField, Box, HStack, Text, Modal } from '@ui';
import { LucideIcon } from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import Calendar from './Calendar';
import { datePickerStyles, buildTheme, mergeStyle } from './Styles';
import type {
  DatePickerMode,
  DatePickerColor,
  DatePickerTheme,
  DatePickerStyles,
} from './Styles';
import { parseDateValue, formatDate, getMonthNames, getDayNames } from './utils';

// For web portal (similar to SelectPortal)
let ReactDOM: any = null;
if (Platform.OS === 'web') {
  ReactDOM = require('react-dom');
}

// Module-level singleton: every DatePicker instance shares this import, so a
// plain Map here coordinates across independent instances with no new props,
// Context, or architecture — only one popup stays open across the whole app.
const openPickers = new Map<string, () => void>();

const closeOtherPickers = (exceptId: string) => {
  openPickers.forEach((close, id) => {
    if (id !== exceptId) close();
  });
};

export type { DatePickerMode, DatePickerColor, DatePickerTheme, DatePickerStyles };

export interface RenderDayParams {
  date: Date;
  isSelected: boolean;
  isToday: boolean;
  isCurrentMonth: boolean;
  isDisabled: boolean;
  onPress: () => void;
}

export interface RenderHeaderParams {
  monthLabel: string;
  yearLabel: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onPrevYear: () => void;
  onNextYear: () => void;
  onToggleMonthDropdown: () => void;
  onToggleYearDropdown: () => void;
}

export interface RenderFooterParams {
  onToday: () => void;
  onClear: () => void;
  onCancel: () => void;
  onDone: () => void;
  labels: { today: string; now: string; clear: string; cancel: string; done: string };
}

export interface RenderInputParams {
  value: string;
  displayValue: string;
  isOpen: boolean;
  isDisabled: boolean;
  onPress: () => void;
}

export interface DatePickerProps {
  mode?: DatePickerMode;
  value?: string;
  defaultValue?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maximumDate?: Date;
  minimumDate?: Date;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isInvalid?: boolean;
  errorMessage?: string;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  hourFormat?: 12 | 24;
  displayFormat?: string;
  apiFormat?: string;
  locale?: string;
  color?: DatePickerColor;
  theme?: Partial<DatePickerTheme>;
  styles?: DatePickerStyles;
  renderInput?: (params: RenderInputParams) => React.ReactNode;
  renderHeader?: (params: RenderHeaderParams) => React.ReactNode;
  renderFooter?: (params: RenderFooterParams) => React.ReactNode;
  renderDay?: (params: RenderDayParams) => React.ReactNode;
  // Legacy props kept for backward compatibility
  iconSize?: number;
  disabled?: boolean;
  // Passthrough to the underlying Input (existing behavior)
  [key: string]: any;
}

const DEFAULT_API_FORMATS: Record<DatePickerMode, string> = {
  date: 'YYYY-MM-DD',
  time: 'HH:mm',
  datetime: 'YYYY-MM-DDTHH:mm:ss',
};

const getDefaultDisplayFormat = (mode: DatePickerMode, hourFormat: 12 | 24): string => {
  const timeFormat = hourFormat === 24 ? 'HH:mm' : 'hh:mm A';
  if (mode === 'date') return 'DD/MM/YYYY';
  if (mode === 'time') return timeFormat;
  return `DD/MM/YYYY ${timeFormat}`;
};

/**
 * DatePicker Component
 * Reusable date / time / datetime picker that works on all platforms (Web, iOS, Android).
 * Uses Gluestack UI components for consistent styling.
 * Calendar opens below the input field without backdrop (web) / with a full-screen
 * dismiss backdrop (native).
 */
const DatePicker: React.FC<DatePickerProps> = ({
  mode = 'date',
  value,
  defaultValue,
  onChange,
  placeholder,
  maximumDate,
  minimumDate,
  isOpen: controlledIsOpen,
  onOpenChange,
  iconSize = 16,
  isDisabled,
  disabled,
  isReadOnly = false,
  isInvalid,
  errorMessage,
  hourFormat = 12,
  displayFormat,
  apiFormat,
  locale,
  color,
  theme: themeOverride,
  styles,
  renderInput,
  renderHeader,
  renderFooter,
  renderDay,
  ...inputProps
}) => {
  const { t, currentLanguage } = useLanguage();
  const [internalShowPicker, setInternalShowPicker] = useState(false);
  const calendarIdRef = useRef(`calendar-${Math.random().toString(36).substr(2, 9)}`);

  // Use controlled state if provided, otherwise use internal state
  const showPicker = controlledIsOpen !== undefined ? controlledIsOpen : internalShowPicker;

  const setShowPicker = (newValue: boolean) => {
    if (controlledIsOpen !== undefined && onOpenChange) {
      onOpenChange(newValue);
    } else {
      setInternalShowPicker(newValue);
    }
  };

  const closePicker = () => {
    setShowPicker(false);
    if (onOpenChange) onOpenChange(false);
  };

  // Always call through this ref so the registry below invokes the LATEST
  // closePicker (which closes over the current controlledIsOpen/onOpenChange),
  // never a stale one captured when this instance first opened.
  const closePickerRef = useRef(closePicker);
  closePickerRef.current = closePicker;

  // Opening this picker closes any other DatePicker popup currently open
  // anywhere on the page — only one stays open at a time.
  useEffect(() => {
    const id = calendarIdRef.current;
    if (showPicker) {
      closeOtherPickers(id);
      openPickers.set(id, () => closePickerRef.current());
    }
    return () => {
      openPickers.delete(id);
    };
  }, [showPicker]);

  // Sync controlled state changes
  useEffect(() => {
    if (controlledIsOpen !== undefined) {
      // If controlled, sync internal state (for position calculation, etc.)
      if (controlledIsOpen && Platform.OS === 'web') {
        const newPosition = calculatePosition();
        setCalendarPosition(newPosition);
      }
    }
  }, [controlledIsOpen]);
  const inputRef = useRef<any>(null);
  const calendarPopupRef = useRef<any>(null);
  const [calendarPosition, setCalendarPosition] = useState({ top: 0, left: 0 });

  // ---- controlled/uncontrolled value ----
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<string | undefined>(defaultValue);
  const currentValue = isControlled ? value : internalValue;

  const emitChange = (newValue: string) => {
    if (!isControlled) setInternalValue(newValue);
    onChange(newValue);
  };

  // ---- formats / locale / theme ----
  const effectiveApiFormat = apiFormat ?? DEFAULT_API_FORMATS[mode];
  const effectiveDisplayFormat = displayFormat ?? getDefaultDisplayFormat(mode, hourFormat);
  const effectiveLocale = locale ?? currentLanguage;

  // const monthNames = useMemo(() => getMonthNames(effectiveLocale, 'long'), [effectiveLocale]);
  const monthNamesShort = useMemo(() => getMonthNames(effectiveLocale, 'short'), [effectiveLocale]);
  const dayNames = useMemo(() => getDayNames(effectiveLocale, 'short'), [effectiveLocale]);

  const resolvedTheme = useMemo(() => buildTheme(color, themeOverride), [color, themeOverride]);

  const labels = useMemo(
    () => ({
      today: t('datePicker.today'),
      now: t('datePicker.now'),
      clear: t('common.clear'),
      cancel: t('common.cancel'),
      done: t('datePicker.done'),
    }),
    [t],
  );

  const selectedDate = useMemo(
    () => parseDateValue(currentValue, effectiveApiFormat, monthNamesShort),
    [currentValue, effectiveApiFormat, monthNamesShort],
  );

  // Snapshot the value whenever the popup opens, so Cancel can revert to it.
  const openSnapshotRef = useRef<Date | null>(null);
  useEffect(() => {
    if (showPicker) {
      openSnapshotRef.current = selectedDate;
    }
    // Only snapshot on the open transition, not on every value change while open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPicker]);

  const handleCalendarChange = (date: Date) => {
    emitChange(formatDate(date, effectiveApiFormat, monthNamesShort));
  };

  const handleClear = () => {
    emitChange('');
    closePicker();
  };

  const handleCancel = () => {
    const snapshot = openSnapshotRef.current;
    emitChange(snapshot ? formatDate(snapshot, effectiveApiFormat, monthNamesShort) : '');
    closePicker();
  };

  // Calculate position synchronously when opening
  const calculatePosition = () => {
    if (Platform.OS === 'web' && inputRef.current) {
      const inputElement = inputRef.current;
      // Try to get the actual DOM element
      const domElement = (inputElement as any)?._node ||
                       (inputElement as any)?.current ||
                       inputElement;

      if (domElement && typeof domElement.getBoundingClientRect === 'function') {
        const rect = domElement.getBoundingClientRect();
        return {
          top: rect.bottom + window.scrollY + 8, // 8px margin
          left: rect.left + window.scrollX,
        };
      }
    }
    return { top: 0, left: 0 };
  };

  // Update position on scroll/resize (web only)
  useEffect(() => {
    if (Platform.OS === 'web' && showPicker) {
      const updatePosition = () => {
        const newPosition = calculatePosition();
        setCalendarPosition(newPosition);
      };

      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);

      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [showPicker]);

  // Handle click outside / Escape to close (all platforms)
  useEffect(() => {
    if (showPicker) {
      if (Platform.OS === 'web') {
        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
          const target = event.target as HTMLElement;
          if (!target) return;

          // Resolve the popup DOM node from the ref instead of a `data-*` query
          // to ensure inside clicks don't incorrectly close the calendar.
          const popupNode =
            (calendarPopupRef.current as any)?._node ||
            (calendarPopupRef.current as any)?.current ||
            calendarPopupRef.current;

          // Check if click is inside the popup - if so, don't close
          // (Date selection will be handled by the Calendar component's onPress)
          if (popupNode && typeof popupNode.contains === 'function' && popupNode.contains(target)) {
            return; // Don't close if clicking inside the popup
          }

          // Close on outside click and restore the value from when the popup opened.
          // Discards unconfirmed time changes, matching the Cancel action.
          handleCancel();
        };

        const handleKeyDown = (event: KeyboardEvent) => {
          if (event.key === 'Escape') {
            closePicker();
          }
        };

        // Use a longer delay and bubble phase to allow date selection to complete first
        const timeoutId = setTimeout(() => {
          // Use bubble phase (false) instead of capture (true) to let date selection fire first
          document.addEventListener('click', handleClickOutside, false);
          document.addEventListener('touchend', handleClickOutside, false);
          document.addEventListener('keydown', handleKeyDown, false);
        }, 300);

        return () => {
          clearTimeout(timeoutId);
          document.removeEventListener('click', handleClickOutside, false);
          document.removeEventListener('touchend', handleClickOutside, false);
          document.removeEventListener('keydown', handleKeyDown, false);
        };
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPicker]);

  // Handle toggle with position calculation
  const handleToggle = () => {
    if (isDisabled || disabled || isReadOnly) return;
    const newState = !showPicker;
    if (newState && Platform.OS === 'web') {
      // Calculate position before showing
      const newPosition = calculatePosition();
      setCalendarPosition(newPosition);
    }
    setShowPicker(newState);
  };

  // Get display value - show formatted value if one exists, otherwise placeholder
  const displayValue = useMemo(() => {
    if (selectedDate) {
      return formatDate(selectedDate, effectiveDisplayFormat, monthNamesShort);
    }
    if (placeholder) return placeholder;
    if (mode === 'time') return t('datePicker.selectTime');
    if (mode === 'datetime') return t('datePicker.selectDateTime');
    return t('common.selectOption');
  }, [selectedDate, effectiveDisplayFormat, monthNamesShort, placeholder, mode, t]);

  // Modal title (native only) — reuses the same locale keys as the trigger's
  // own empty-state placeholder text.
  const modalTitle =
    mode === 'time'
      ? t('datePicker.selectTime')
      : mode === 'datetime'
      ? t('datePicker.selectDateTime')
      : t('datePicker.selectDate');

  const calendarElement = (
    <Calendar
      mode={mode}
      value={selectedDate || new Date()}
      onChange={handleCalendarChange}
      onClose={closePicker}
      onClear={handleClear}
      onCancel={handleCancel}
      maximumDate={maximumDate}
      minimumDate={minimumDate}
      calendarId={calendarIdRef.current}
      hourFormat={hourFormat}
      theme={resolvedTheme}
      styles={styles}
      monthNames={monthNamesShort}
      monthNamesShort={monthNamesShort}
      dayNames={dayNames}
      labels={labels}
      renderHeader={renderHeader}
      renderFooter={renderFooter}
      renderDay={renderDay}
    />
  );

  const calendarContentStyle = datePickerStyles.getCalendarContentStyle(Platform.OS, calendarPosition);
  const webCalendarContent =
    Platform.OS === 'web' && showPicker ? (
      <Box
        ref={calendarPopupRef}
        {...mergeStyle(calendarContentStyle as any, styles?.popup)}
        data-calendar-container={calendarIdRef.current}
      >
        {calendarElement}
      </Box>
    ) : null;

  return (
    <>
      <Box
        {...mergeStyle(datePickerStyles.containerBox, styles?.container)}
        ref={inputRef}
        style={datePickerStyles.getContainerBoxStyle(Platform.OS) as any}
      >
        {renderInput ? (
          renderInput({
            value: currentValue || '',
            displayValue,
            isOpen: showPicker,
            isDisabled: !!(isDisabled || disabled || isReadOnly),
            onPress: handleToggle,
          })
        ) : (
          <Pressable
            onPress={handleToggle}
            disabled={isDisabled || disabled || isReadOnly}
            accessibilityRole="button"
            accessibilityLabel={displayValue}
          >
            <Box {...mergeStyle(datePickerStyles.inputContainer, styles?.input)} data-date-input={Platform.OS === 'web'}>
              <Input
                pointerEvents="none"
                isDisabled={isDisabled || disabled}
                isReadOnly={isReadOnly}
                isInvalid={isInvalid}
                {...inputProps}
              >
                <HStack {...datePickerStyles.inputHStack}>
                  <LucideIcon name="Calendar" size={iconSize} color={resolvedTheme.muted} />
                  <InputField
                    placeholder={placeholder}
                    value={displayValue}
                    editable={false}
                    flex={1}
                  />
                  <LucideIcon
                    name={isReadOnly ? 'Lock' : 'ChevronDown'}
                    size={16}
                    color={resolvedTheme.muted}
                  />
                </HStack>
              </Input>
            </Box>
          </Pressable>
        )}

        {errorMessage ? <Text {...datePickerStyles.errorText}>{errorMessage}</Text> : null}
      </Box>

      {/* Web: portal the popup to document.body so it overlaps everything else. */}
      {Platform.OS === 'web' && ReactDOM && webCalendarContent
        ? ReactDOM.createPortal(webCalendarContent, document.body)
        : null}

      {/* Native: a real Modal instead of an absolutely-positioned popup — reliable
          touch handling/overlay dismissal instead of the ad hoc giant backdrop this
          used to render, and matches this app's existing Modal usage elsewhere. */}
      {Platform.OS !== 'web' && (
        <Modal
          isOpen={showPicker}
          onClose={handleCancel}
          headerTitle={modalTitle}
          size="md"
          contentProps={styles?.popup as any}
        >
          {calendarElement}
        </Modal>
      )}
    </>
  );
};

export default DatePicker;
