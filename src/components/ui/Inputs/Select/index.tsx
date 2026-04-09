import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { I18nManager, Platform, Pressable, ScrollView } from 'react-native';
import i18n from '@config/i18n';
import {
  SelectItem,
  SelectDragIndicatorWrapper,
  SelectDragIndicator,
  SelectContent,
  SelectBackdrop,
  Select as GluestackSelect,
  SelectIcon,
  SelectInput,
  SelectTrigger,
  ChevronDownIcon,
  SelectPortal,
  Box,
  HStack,
  Text,
} from '@gluestack-ui/themed';
import { LucideIcon } from '@ui';
import { getSelectTriggerStyles } from './Styles';

let ReactDOM: any = null;
if (Platform.OS === 'web') {
  ReactDOM = require('react-dom');
}

type Option = {
  value: string;
  name?: string;
  nativeName?: string;
  isRTL?: boolean;
};

type RawOption = string | { label?: string; name?: string; value: string | null } | Option;

type DropdownPosition = {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  maxHeight: number;
};

type SelectProps = {
  options: RawOption[];
  value: string;
  onChange: (value: string, label: string) => void;
  placeholder?: string;
  bg?: string;
  borderColor?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  borderRadius?: string;
  disabled?: boolean;
};

function normalizeOptions(options: RawOption[]): Option[] {
  return options.map((e: RawOption, index: number) => {
    if (
      typeof e === 'object' &&
      'value' in e &&
      typeof e.value === 'string' &&
      ('name' in e || 'nativeName' in e)
    ) {
      return e as Option;
    }
    if (typeof e === 'string') {
      return { value: e, name: e };
    }
    if (typeof e === 'object' && e !== null) {
      let optionValue: string;
      let optionName: string;
      if ('value' in e && e.value !== undefined) {
        optionValue = e.value === null ? '__NULL_VALUE__' : String(e.value);
      } else {
        optionValue = '';
      }
      optionName =
        ('label' in e ? e.label : undefined) ??
        ('name' in e ? e.name : undefined) ??
        optionValue;
      return { value: optionValue, name: optionName };
    }
    return { value: String(index), name: 'Unknown' };
  });
}

function resolveRefToDom(node: unknown): HTMLElement | null {
  if (!node) return null;
  const n = node as any;
  if (typeof n.getBoundingClientRect === 'function') {
    return n as HTMLElement;
  }
  const inner = n._nativeNode ?? n.current ?? n;
  if (inner && typeof inner.getBoundingClientRect === 'function') {
    return inner as HTMLElement;
  }
  return null;
}

const DROPDOWN_Z = 100000;
const DROPDOWN_GAP = 4;
const VIEWPORT_MARGIN = 12;
const DEFAULT_DROPDOWN_MAX_HEIGHT = 280;

const SELECT_SIZE_HEIGHT: Record<NonNullable<SelectProps['size']>, string> = {
  xs: '$8',
  sm: '$9',
  md: '$10',
  lg: '$11',
  xl: '$12',
};

/** Web: custom dropdown portaled to document.body so it stacks above modals and escapes overflow clipping. */
function WebSelect({
  options,
  value,
  onChange,
  placeholder,
  bg = '$white',
  borderColor = '$borderColor',
  size = 'sm',
  borderRadius = '$xl',
  disabled = false,
}: SelectProps) {
  const normalizedOptions = useMemo(() => normalizeOptions(options), [options]);
  const valueKey = String(value ?? '');
  const selectedOption = normalizedOptions.find(opt => opt.value === valueKey);
  const displayValue =
    selectedOption?.nativeName || selectedOption?.name || selectedOption?.value || '';

  const localizedPlaceholder =
    placeholder ?? i18n.t('common.selectOption', 'Select an option');

  const writingDirection = I18nManager.isRTL ? 'rtl' : 'ltr';
  const listId = useId().replace(/:/g, '');
  const triggerRef = useRef<any>(null);
  /** Must use ref for outside-click checks — RN Web may not forward `data-*` to the DOM, so querySelector was null and every click closed the menu before onPress. */
  const dropdownRef = useRef<any>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<DropdownPosition>({
    top: 0,
    left: 0,
    width: 0,
    maxHeight: DEFAULT_DROPDOWN_MAX_HEIGHT,
  });

  const getDropdownRoot = useCallback((): HTMLElement | null => {
    const fromRef = resolveRefToDom(dropdownRef.current);
    if (fromRef) return fromRef;
    return document.getElementById(`select-list-${listId}`);
  }, [listId]);

  const isEventTargetWithinSelect = useCallback(
    (target: Node | null) => {
      if (!target) return false;
      const triggerEl = resolveRefToDom(triggerRef.current);
      const dropdownEl = getDropdownRoot();
      return !!(triggerEl?.contains(target) || dropdownEl?.contains(target));
    },
    [getDropdownRoot],
  );

  const updatePosition = useCallback(() => {
    const el = resolveRefToDom(triggerRef.current);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
    const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
    const availableBelow = Math.max(
      0,
      viewportHeight - rect.bottom - VIEWPORT_MARGIN - DROPDOWN_GAP,
    );
    const availableAbove = Math.max(
      0,
      rect.top - VIEWPORT_MARGIN - DROPDOWN_GAP,
    );
    const shouldOpenUp =
      availableBelow < DEFAULT_DROPDOWN_MAX_HEIGHT &&
      availableAbove > availableBelow;
    const availableHeight = shouldOpenUp ? availableAbove : availableBelow;
    const width = Math.min(rect.width, viewportWidth - VIEWPORT_MARGIN * 2);
    const left = Math.min(
      Math.max(rect.left, VIEWPORT_MARGIN),
      Math.max(VIEWPORT_MARGIN, viewportWidth - width - VIEWPORT_MARGIN),
    );

    setPos({
      top: shouldOpenUp ? undefined : rect.bottom + DROPDOWN_GAP,
      bottom: shouldOpenUp
        ? viewportHeight - rect.top + DROPDOWN_GAP
        : undefined,
      left,
      width,
      maxHeight: Math.max(
        96,
        Math.min(DEFAULT_DROPDOWN_MAX_HEIGHT, availableHeight),
      ),
    });
  }, []);

  useEffect(() => {
    if (!open || Platform.OS !== 'web') return;
    updatePosition();
    const onScrollOrResize = () => updatePosition();
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open || Platform.OS !== 'web') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (!open || Platform.OS !== 'web') return;
    let removeListeners: (() => void) | undefined;
    const timeoutId = window.setTimeout(() => {
      const handlePointer = (e: MouseEvent | TouchEvent) => {
        const target = e.target as Node | null;
        if (isEventTargetWithinSelect(target)) return;
        setOpen(false);
      };
      const handleFocusIn = (e: FocusEvent) => {
        const target = e.target as Node | null;
        if (isEventTargetWithinSelect(target)) return;
        setOpen(false);
      };
      const handleWindowBlur = () => {
        setOpen(false);
      };
      document.addEventListener('click', handlePointer, false);
      document.addEventListener('touchend', handlePointer, false);
      document.addEventListener('focusin', handleFocusIn, false);
      window.addEventListener('blur', handleWindowBlur);
      removeListeners = () => {
        document.removeEventListener('click', handlePointer, false);
        document.removeEventListener('touchend', handlePointer, false);
        document.removeEventListener('focusin', handleFocusIn, false);
        window.removeEventListener('blur', handleWindowBlur);
      };
    }, 0);
    return () => {
      window.clearTimeout(timeoutId);
      removeListeners?.();
    };
  }, [open, isEventTargetWithinSelect]);

  const emitChange = (stringValue: string) => {
    const opt = normalizedOptions.find(o => o.value === stringValue);
    const label = opt?.nativeName || opt?.name || '';
    onChange(stringValue, label);
  };

  const triggerStyles = getSelectTriggerStyles(bg, borderColor, size, borderRadius) as any;

  const dropdownPanelWebStyle = {
    position: 'fixed' as const,
    top: pos.top,
    bottom: pos.bottom,
    left: pos.left,
    width: pos.width,
    zIndex: DROPDOWN_Z,
    maxHeight: pos.maxHeight,
    borderRadius: 12,
    overflow: 'hidden' as const,
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
  };

  const dropdown = open ? (
    <Box
      ref={dropdownRef}
      data-select-dropdown={listId}
      nativeID={`select-list-${listId}`}
      id={`select-list-${listId}`}
      bg="$white"
      borderWidth={1}
      borderColor="$borderColor"
      // RN Web ViewStyle omits `position: fixed`; this panel is web-only (portaled).
      style={dropdownPanelWebStyle as any}
      {...(Platform.OS === 'web'
        ? {
            // Prevent document outside-click listener from seeing clicks that started inside the menu
            onClick: (e: any) => e.stopPropagation(),
          }
        : {})}
    >
      <ScrollView
        nestedScrollEnabled
        style={{ maxHeight: pos.maxHeight } as any}
        contentContainerStyle={{ flexGrow: 0 } as any}
      >
        {normalizedOptions.map((option, index) => {
          const label = option.nativeName || option.name || option.value;
          const isSelected = option.value === valueKey;
          return (
            <Pressable
              key={option?.value ?? option?.name ?? String(index)}
              onPress={() => {
                emitChange(option.value);
                setOpen(false);
              }}
              accessibilityRole="menuitem"
              accessibilityState={{ selected: isSelected }}
            >
              <HStack
                alignItems="center"
                justifyContent="space-between"
                py="$2.5"
                px="$3"
                bg={isSelected ? '$background50' : 'transparent'}
              >
                <Text
                  flex={1}
                  fontSize="$sm"
                  fontFamily="Inter"
                  color="$textForeground"
                  style={{ writingDirection }}
                >
                  {label}
                </Text>
                {isSelected ? (
                  <LucideIcon name="Check" size={18} color="$textForeground" />
                ) : (
                  <Box w="$4.5" h="$4.5" />
                )}
              </HStack>
            </Pressable>
          );
        })}
      </ScrollView>
    </Box>
  ) : null;

  return (
    <>
      <Box ref={triggerRef} position="relative" w="$full" style={{ overflow: 'visible' } as any}>
        <Pressable
          disabled={disabled}
          onPress={() => !disabled && setOpen(o => !o)}
          accessibilityRole="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={`select-list-${listId}`}
        >
          <HStack
            {...triggerStyles}
            h={SELECT_SIZE_HEIGHT[size]}
            alignItems="center"
            opacity={disabled ? 0.5 : 1}
            pointerEvents={disabled ? 'none' : 'auto'}
          >
            <Text
              flex={1}
              fontSize="$sm"
              lineHeight="$sm"
              fontFamily="Inter"
              color={displayValue ? '$textForeground' : '$text500'}
              px="$3"
              numberOfLines={1}
              style={{ writingDirection }}
            >
              {displayValue || localizedPlaceholder}
            </Text>
            <Box mr="$3">
              <LucideIcon name="ChevronDown" size={16} color="$textMutedForeground" />
            </Box>
          </HStack>
        </Pressable>
      </Box>
      {Platform.OS === 'web' && ReactDOM && dropdown
        ? ReactDOM.createPortal(dropdown, document.body)
        : null}
    </>
  );
}

function NativeSelect({
  options,
  value,
  onChange,
  placeholder,
  bg = '$white',
  borderColor = '$borderColor',
  size = 'sm',
  borderRadius = '$xl',
  disabled = false,
}: SelectProps) {
  const normalizedOptions = useMemo(() => normalizeOptions(options), [options]);
  const valueKey = String(value ?? '');
  const selectedOption = normalizedOptions.find(opt => opt.value === valueKey);
  const displayValue =
    selectedOption?.nativeName || selectedOption?.name || selectedOption?.value || '';

  const localizedPlaceholder =
    placeholder ?? i18n.t('common.selectOption', 'Select an option');

  const writingDirection = I18nManager.isRTL ? 'rtl' : 'ltr';

  const handleValueChange = (newValue: string | undefined) => {
    if (newValue !== undefined && newValue !== null) {
      const stringValue = String(newValue);
      const opt = normalizedOptions.find(o => o.value === stringValue);
      onChange(stringValue, opt?.nativeName || opt?.name || '');
    }
  };

  return (
    <GluestackSelect
      selectedValue={valueKey}
      onValueChange={handleValueChange}
      isDisabled={disabled}
    >
      <SelectTrigger
        {...((getSelectTriggerStyles as any)(bg, borderColor, size, borderRadius) as any)}
        disabled={disabled}
        opacity={disabled ? 0.5 : 1}
      >
        <SelectInput
          placeholder={localizedPlaceholder}
          value={displayValue}
          bg={bg}
          backgroundColor={bg}
          editable={!disabled}
          // @ts-ignore - writingDirection is a valid style prop but may not be in types
          style={{ writingDirection, backgroundColor: bg }}
          fontFamily="Inter"
        />
        <SelectIcon mr="$3">
          <ChevronDownIcon />
        </SelectIcon>
      </SelectTrigger>
      <SelectPortal>
        <SelectBackdrop />
        <SelectContent>
          <SelectDragIndicatorWrapper>
            <SelectDragIndicator />
          </SelectDragIndicatorWrapper>
          {normalizedOptions.map((option: Option, index: number) => (
            <SelectItem
              key={option?.value ?? option?.name ?? index.toString()}
              label={option?.nativeName || option?.name || option?.value}
              value={option?.value ?? option?.name ?? ''}
            />
          ))}
        </SelectContent>
      </SelectPortal>
    </GluestackSelect>
  );
}

export default function Select(props: SelectProps) {
  if (Platform.OS === 'web') {
    return <WebSelect {...props} />;
  }
  return <NativeSelect {...props} />;
}
