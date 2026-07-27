import React, { useState, useRef, useEffect } from 'react';
import { Pressable, Platform } from 'react-native';
import { Input, InputField, Box, HStack } from '@ui';
import { LucideIcon } from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import Calendar from './Calendar';
import { datePickerStyles } from './Styles';

// For web portal (similar to SelectPortal)
let ReactDOM: any = null;
if (Platform.OS === 'web') {
  ReactDOM = require('react-dom');
}

interface DatePickerProps {
  value?: string; // Date value in YYYY-MM-DD format
  onChange: (date: string) => void;
  placeholder?: string;
  maximumDate?: Date;
  minimumDate?: Date;
  isOpen?: boolean; // Controlled open state
  onOpenChange?: (isOpen: boolean) => void; // Callback when open state changes
  iconSize?: number; // Size of the calendar icon
  isReadOnly?: boolean;
  [key: string]: any; // Allow additional props for styling
}

/**
 * DatePicker Component
 * Custom calendar component that works on all platforms (Web, iOS, Android)
 * Uses Gluestack UI components for consistent styling
 * UI matches reference design with month/year navigation, date grid, and Clear/Today buttons
 * Calendar opens below the input field without backdrop
 */
const DatePicker: React.FC<DatePickerProps> = ({
  value,
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
  ...inputProps
}) => {
  const { t } = useLanguage();
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
  const [calendarPosition, setCalendarPosition] = useState({ top: 0, left: 0 });

  // Convert string value (YYYY-MM-DD) to Date object
  const getDateFromValue = (): Date | null => {
    if (value && typeof value === 'string' && value.trim() !== '') {
      // Handle YYYY-MM-DD format
      // Parse the date string properly (YYYY-MM-DD)
      const dateParts = value.split('-');
      if (dateParts.length === 3) {
        const year = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1; // Month is 0-indexed
        const day = parseInt(dateParts[2], 10);
        const date = new Date(year, month, day);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
      // Fallback: try standard Date parsing
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    return null;
  };

  // Convert Date object to YYYY-MM-DD string (for API/storage)
  const formatDateToString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Format date for display (user-friendly format)
  const formatDateForDisplay = (date: Date): string => {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Handle date selection from calendar
  const handleDateSelect = (date: Date) => {
    const formattedDate = formatDateToString(date);
    // Call onChange to update parent component
    onChange(formattedDate);
    setShowPicker(false);
    // Also notify parent if controlled
    if (onOpenChange) {
      onOpenChange(false);
    }
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

  // Handle click outside to close (all platforms)
  useEffect(() => {
    if (showPicker) {
      if (Platform.OS === 'web') {
        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
          const target = event.target as HTMLElement;
          if (!target) return;
          
          // Find calendar element using unique ID
          const calendarElement = document.querySelector(`[data-calendar-container="${calendarIdRef.current}"]`);
          
          // Check if click is inside calendar - if so, don't close
          // (Date selection will be handled by the Calendar component's onPress)
          if (calendarElement && calendarElement.contains(target)) {
            return; // Don't close if clicking inside calendar
          }
          
          // Close if click is outside calendar
          setShowPicker(false);
          // Also notify parent if controlled
          if (onOpenChange) {
            onOpenChange(false);
          }
        };

        // Use a longer delay and bubble phase to allow date selection to complete first
        const timeoutId = setTimeout(() => {
          // Use bubble phase (false) instead of capture (true) to let date selection fire first
          document.addEventListener('click', handleClickOutside, false);
          document.addEventListener('touchend', handleClickOutside, false);
        }, 300);

        return () => {
          clearTimeout(timeoutId);
          document.removeEventListener('click', handleClickOutside, false);
          document.removeEventListener('touchend', handleClickOutside, false);
        };
      }
    }
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

  // Get display value - show formatted date if value exists, otherwise placeholder
  const displayValue = React.useMemo(() => {
    // Check if value is a valid non-empty string
    if (value && typeof value === 'string' && value.trim() !== '') {
      const date = getDateFromValue();
      if (date && !isNaN(date.getTime())) {
        const formatted = formatDateForDisplay(date);
        return formatted;
      }
    }
    return placeholder || t('common.selectOption');
  }, [value, placeholder, t]);

  const calendarContentStyle = datePickerStyles.getCalendarContentStyle(Platform.OS, calendarPosition);
  const calendarContent = showPicker ? (
    <Box
      {...(calendarContentStyle as any)}
            data-calendar-container={Platform.OS === 'web' ? calendarIdRef.current : undefined}
    >
      <Calendar
        value={getDateFromValue() || new Date()}
        onChange={handleDateSelect}
        onClose={() => setShowPicker(false)}
        maximumDate={maximumDate}
        minimumDate={minimumDate}
        calendarId={calendarIdRef.current}
      />
    </Box>
  ) : null;

  return (
    <>
      <Box 
        {...datePickerStyles.containerBox}
        ref={inputRef}
        style={datePickerStyles.getContainerBoxStyle(Platform.OS) as any}
      >
        <Pressable onPress={handleToggle} disabled={isDisabled || disabled || isReadOnly}>
          <Box {...datePickerStyles.inputContainer} data-date-input={Platform.OS === 'web'}>
            <Input pointerEvents="none" isDisabled={isDisabled || disabled} isReadOnly={isReadOnly} {...inputProps}>
              <HStack {...datePickerStyles.inputHStack}>
                <LucideIcon name="Calendar" size={iconSize} color="$textMutedForeground" />
                <InputField
                  placeholder={placeholder}
                  value={displayValue}
                  editable={false}
                  flex={1}
                />
                <LucideIcon name="ChevronDown" size={16} color="$textMutedForeground" />
              </HStack>
            </Input>
          </Box>
        </Pressable>

        {Platform.OS !== 'web' && (
          <>
            {/* Full-screen backdrop for native - closes calendar on press */}
            {showPicker && (
              <Pressable
                style={{
                  position: 'absolute' as any,
                  top: -1000,
                  left: -1000,
                  right: -1000,
                  bottom: -1000,
                  zIndex: 99998,
                }}
                onPress={() => setShowPicker(false)}
              />
            )}
            {calendarContent}
          </>
        )}
      </Box>

      {/* Portal for web - renders at document.body level to overlap all elements */}
      {Platform.OS === 'web' && ReactDOM && calendarContent
        ? ReactDOM.createPortal(calendarContent, document.body)
        : null}
    </>
  );
};

export default DatePicker;
