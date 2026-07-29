import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ActivityIndicator, I18nManager, Pressable, StyleSheet } from 'react-native';
import {
  Modal as GluestackModal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalBody,
  HStack,
  VStack,
  Text,
  Box,
  Input,
  InputField,
  ScrollView,
  CloseIcon,
  Icon as GluestackIcon,
  Divider,
  ModalFooter,
} from '@gluestack-ui/themed';
import { LucideIcon } from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import { theme } from '@config/theme';
import { getSelectTriggerStyles } from '../ui/Inputs/Select/Styles';
import { commonModalContainerStyles, commonModalContentStyles } from '@components/ui/Modal/Styles';
import type { PaginatedSelectFetchParams, PaginatedSelectFetchResult } from '@constants/USER_MANAGEMENT';

export type { PaginatedSelectFetchParams, PaginatedSelectFetchResult };

export type PaginatedSelectProps = {
  fetchFn: (params: PaginatedSelectFetchParams) => Promise<PaginatedSelectFetchResult>;
  value?: string;
  /** Label text to display on the trigger when value is set but items haven't loaded yet */
  displayValue?: string;
  onChange: (value: string, label: string, item: any) => void;
  /** Field name to use as label from fetched items (auto-detects label/labelKey/name if omitted) */
  labelKey?: string;
  /** Field name to use as value from fetched items (default: 'value') */
  valueKey?: string;
  placeholder?: string;
  disabled?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Title displayed at the top of the selection modal */
  modalTitle?: string;
  bg?: string;
  borderColor?: string;
  borderRadius?: string | number;
  /** Items per page (default: 20) */
  pageSize?: number;
  /**
   * When this value changes, the loaded list is reset and the selection is cleared.
   * Use to re-fetch when a parent filter changes (e.g., province for supervisor list).
   */
  dependencyKey?: string | number | null;
  /** Show search input inside the modal (default: true) */
  showSearch?: boolean;
};

const SELECT_SIZE_HEIGHT: Record<string, number> = {
  xs: 32,
  sm: 36,
  md: 40,
  lg: 44,
  xl: 48,
};

const DEBOUNCE_MS = 500;

const PaginatedSelect: React.FC<PaginatedSelectProps> = ({
  fetchFn,
  value,
  displayValue,
  onChange,
  labelKey,
  valueKey = 'value',
  placeholder,
  disabled = false,
  size = 'sm',
  modalTitle,
  bg = '$white',
  borderColor = '$borderColor',
  borderRadius = 10,
  pageSize = 20,
  dependencyKey,
  showSearch = true,
}) => {
  const { t } = useLanguage();

  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [internalLabel, setInternalLabel] = useState('');
  // Tracks the item highlighted inside the modal (not yet applied to the trigger)
  const [tempValue, setTempValue] = useState('');
  // Holds the full item object of the in-modal selection until "Select" is confirmed
  const tempItemRef = useRef<{ value: string; label: string; item: any } | null>(null);

  const isLoadingRef = useRef(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevDependencyKeyRef = useRef(dependencyKey);
  const isOpenRef = useRef(false);
  isOpenRef.current = isOpen;
  // Always keep fetchFn ref up-to-date so effects use the latest version
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  const hasMore = total === null || items.length < total;

  const getLabel = useCallback(
    (item: any): string => {
      if (labelKey) return String(item[labelKey] ?? '');
      return String(
        item.label ??
          item.labelKey ??
          item.name ??
          item.full_name ??
          item[valueKey] ??
          '',
      );
    },
    [labelKey, valueKey],
  );

  const getValue = useCallback(
    (item: any): string => String(item[valueKey] ?? item.value ?? item.id ?? ''),
    [valueKey],
  );

  // Resolve display text: loaded items first, then displayValue prop, then internal label
  const triggerDisplayText = (() => {
    if (!value) return '';
    const found = items.find(item => getValue(item) === value);
    if (found) return getLabel(found);
    return displayValue || internalLabel || '';
  })();

  // Core fetch — uses ref so the effect that watches `isOpen` always calls latest version
  const doFetch = useCallback(
    async (page: number, search: string, reset: boolean) => {
      if (isLoadingRef.current || isLoading) return;
      isLoadingRef.current = true;
      setIsLoading(true);

      try {
        const result = await fetchFnRef.current({
          page,
          limit: pageSize,
          search: search || undefined,
        });
        const newItems = result.data || [];
        const newTotal = result.total ?? 0;

        setTotal(newTotal);
        setCurrentPage(page);
        setItems(prev => (reset ? newItems : [...prev, ...newItems]));
      } catch (e) {
        console.error('[PaginatedSelect] fetch error', e);
      } finally {
        isLoadingRef.current = false;
        setIsLoading(false);
      }
    },
    [pageSize],
  );

  // Reset list when dependency changes (e.g., province changed → reset supervisor list)
  useEffect(() => {
    if (prevDependencyKeyRef.current === dependencyKey) return;
    prevDependencyKeyRef.current = dependencyKey;

    setItems([]);
    setTotal(null);
    setCurrentPage(1);
    setSearchText('');
    isLoadingRef.current = false;
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    // Re-fetch immediately if the modal is currently open
    if (isOpenRef.current) {
      doFetch(1, '', false);
    }
  }, [dependencyKey, doFetch]);

  // Fetch first page whenever the modal opens; seed tempValue from current applied value
  useEffect(() => {
    if (!isOpen) return;
    setItems([]);
    setTotal(null);
    setCurrentPage(1);
    setSearchText('');
    isLoadingRef.current = false;
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    // Seed the in-modal highlight with whatever is currently applied
    setTempValue(value || '');
    tempItemRef.current = null;
    doFetch(1, '', false);
    // doFetch is stable (only depends on pageSize); linter suppressed intentionally
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Infinite scroll — triggers next-page load when user scrolls near the bottom
  const handleScroll = useCallback(
    (event: any) => {
      const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
      const isNearBottom =
        layoutMeasurement.height + contentOffset.y >= contentSize.height - 60;
      if (isNearBottom && !isLoadingRef.current && hasMore && total !== null) {
        doFetch(currentPage + 1, searchText, false);
      }
    },
    [hasMore, total, currentPage, searchText, doFetch],
  );

  // Debounced search: reset list and re-fetch with new query
  const handleSearch = useCallback(
    (text: string) => {
      setSearchText(text);
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      searchTimerRef.current = setTimeout(() => {
        isLoadingRef.current = false;
        setItems([]);
        setTotal(null);
        setCurrentPage(1);
        doFetch(1, text, false);
      }, DEBOUNCE_MS);
    },
    [doFetch],
  );

  // Tapping a row only marks it as the temporary selection — does not apply or close
  const handleTempSelect = useCallback(
    (item: any) => {
      const val = getValue(item);
      const lbl = getLabel(item);
      setTempValue(val);
      tempItemRef.current = { value: val, label: lbl, item };
    },
    [getValue, getLabel],
  );

  // "Select" button — apply the in-modal selection and close
  const handleConfirm = useCallback(() => {
    if (tempItemRef.current) {
      const { value: val, label: lbl, item } = tempItemRef.current;
      setInternalLabel(lbl);
      onChange(val, lbl, item);
    }
    // If nothing was clicked (tempItemRef still null) the user hasn't changed
    // their selection, so just close without calling onChange.
    setIsOpen(false);
  }, [onChange]);

  const writingDirection = I18nManager.isRTL ? 'rtl' : 'ltr';
  const triggerStyles = getSelectTriggerStyles(bg, borderColor, size, borderRadius as any) as any;
  const localizedPlaceholder = placeholder ?? t('common.selectOption', 'Select an option');

  return (
    <>
      {/* Trigger — full-width wrapper ensures tap area fills available space */}
      <Box w="$full">
        <Pressable disabled={disabled} onPress={() => !disabled && setIsOpen(true)}>
          <HStack
            {...triggerStyles}
            h={SELECT_SIZE_HEIGHT[size]}
            alignItems="center"
            justifyContent="space-between"
            borderWidth={1}
            opacity={disabled ? 0.5 : 1}
          >
            <Text
              flex={1}
              px="$3"
              numberOfLines={1}
              fontSize="$sm"
              fontFamily="Inter"
              color={triggerDisplayText ? '$textForeground' : '$text500'}
              style={{ writingDirection }}
            >
              {triggerDisplayText || localizedPlaceholder}
            </Text>
            <Box mr="$3">
              <LucideIcon name="ChevronDown" size={16} color="$textMutedForeground" />
            </Box>
          </HStack>
        </Pressable>
      </Box>

      {/* Selection modal */}
      <GluestackModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        size="lg"
        closeOnOverlayClick
        {...commonModalContainerStyles}
      >
        <ModalBackdrop />
        <ModalContent {...commonModalContentStyles} maxHeight="80%">
          {/* ── Header ── */}
          <ModalHeader pt="$5" pb="$3" px="$5">
            <HStack flex={1} alignItems="flex-start" justifyContent="space-between">
              <Text
                fontSize="$lg"
                fontWeight="$semibold"
                fontFamily="Inter"
                color={theme.tokens.colors.textPrimary}
                flex={1}
                pr="$3"
                numberOfLines={2}
              >
                {modalTitle || localizedPlaceholder}
              </Text>

              {/* Close button */}
              <Pressable
                onPress={() => setIsOpen(false)}
                hitSlop={8}
                accessibilityLabel={t('common.close')}
              >
                <Box
                  w={32}
                  h={32}
                  alignItems="center"
                  justifyContent="center"
                  borderRadius="$full"
                  bg="$backgroundLight100"
                >
                  <GluestackIcon as={CloseIcon} size="sm" color="$textLight600" />
                </Box>
              </Pressable>
            </HStack>
          </ModalHeader>

          <Divider bg="$borderLight100" />

          {/* ── Search input ── */}
          {showSearch && (
            <Box px="$5" pt="$4" pb="$2">
              <Input
                borderRadius="$lg"
                borderColor="$borderLight200"
                bg="$backgroundLight50"
                h={40}
              >
                <HStack alignItems="center" flex={1} px="$3">
                  <LucideIcon name="Search" size={16} color="$textMutedForeground" />
                  <InputField
                    placeholder={t('admin.filters.searchPlaceholder', 'Search...')}
                    value={searchText}
                    onChangeText={handleSearch}
                    autoCapitalize="none"
                    autoCorrect={false}
                    pl="$2"
                    fontSize="$sm"
                    fontFamily="Inter"
                  />
                </HStack>
              </Input>
            </Box>
          )}

          {/* ── Scrollable list ── */}
          <ScrollView
            onScroll={handleScroll}
            scrollEventThrottle={16}
            // showsVerticalScrollIndicator={false}
            style={styles.scrollView}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
          >
            {/* Initial loading spinner */}
            {isLoading && items.length === 0 && (
              <Box py="$10" alignItems="center" justifyContent="center">
                <ActivityIndicator
                  size="small"
                  color={theme.tokens.colors.primary500}
                />
              </Box>
            )}

            {/* Empty state */}
            {!isLoading && items.length === 0 && total !== null && (
              <Box py="$10" alignItems="center" justifyContent="center" px="$6">
                <LucideIcon
                  name="SearchX"
                  size={36}
                  color={theme.tokens.colors.textMutedForeground}
                />
                <Text
                  mt="$3"
                  fontSize="$sm"
                  fontWeight="$medium"
                  color="$textMutedForeground"
                  fontFamily="Inter"
                  textAlign="center"
                >
                  {t('common.noDataFound', 'No results found')}
                </Text>
              </Box>
            )}

            {/* ── Item cards ── */}
            <VStack px="$6" pt="$1" pb="$2" space="md">
              {items.map((item, index) => {
                const itemValue = getValue(item);
                const itemLabel = getLabel(item);

                // Optional secondary info line (status, site, etc.)
                const secondaryText: string | null = item.status
                  ? `- ${item.status}`
                  : item.site_name
                  ? `- ${item.site_name}`
                  : item.province_name
                  ? `- ${item.province_name}`
                  : null;

                // Use tempValue (in-modal highlight) — not the applied value prop
                const isActive = itemValue === tempValue;

                return (
                  <Pressable
                    key={`${itemValue}-${index}`}
                    onPress={() => handleTempSelect(item)}
                  >
                    <HStack
                      alignItems="center"
                      py="$3"
                      px="$4"
                      borderWidth={1}
                      borderColor={isActive ? '$borderColor' : '$borderColor'}
                      borderRadius="$xl"
                      space="md"
                      bg={isActive ? '$backgroundColor' : '$backgroundColor'}
                    >
                      {/* Radio indicator */}
                      <Box
                        bg={isActive ? '$primary600' : 'transparent'}
                        borderRadius="$full"
                      >
                        <LucideIcon
                          size={14}
                          name={isActive ? 'Check' : 'Circle'}
                          color={isActive ? '$white' : '$borderColor'}
                        />
                      </Box>

                      {/* Label + optional secondary text */}
                      <VStack flex={1} space="xs">
                        <Text
                          fontSize="$sm"
                          fontWeight={isActive ? '$semibold' : '$medium'}
                          fontFamily="Inter"
                          color="$textForeground"
                          numberOfLines={2}
                        >
                          {itemLabel}
                        </Text>
                        {secondaryText && (
                          <Text
                            fontSize="$xs"
                            fontFamily="Inter"
                            color="$textMutedForeground"
                            numberOfLines={1}
                          >
                            {secondaryText}
                          </Text>
                        )}
                      </VStack>
                    </HStack>
                  </Pressable>
                );
              })}
            </VStack>

            {/* Pagination loading indicator */}
            {isLoading && items.length > 0 && (
              <Box py="$4" alignItems="center">
                <ActivityIndicator
                  size="small"
                  color={theme.tokens.colors.primary500}
                />
              </Box>
            )}

            {/* End of list */}
            {!isLoading && !hasMore && items.length > 0 && (
              <Box py="$3" alignItems="center">
                <Text fontSize="$xs" color="$textMutedForeground" fontFamily="Inter">
                  {'— ' + t('common.allLoaded', 'end of list') + ' —'}
                </Text>
              </Box>
            )}
          </ScrollView>
          <ModalFooter gap="$4" borderTopWidth="$1" borderTopColor="$borderLight100" >
            {/* Cancel — closes without applying */}
            <Pressable
              onPress={() => setIsOpen(false)}
              accessibilityLabel={t('common.cancel', 'Cancel')}
              style={styles.footerButton}
            >
              <Box
                py="$3"
                borderRadius="$md"
                borderWidth={1}
                borderColor="$borderLight300"
                bg="$white"
                alignItems="center"
              >
                <Text fontSize="$sm" fontFamily="Inter" fontWeight="$medium" color="$textForeground">
                  {t('common.cancel', 'Cancel')}
                </Text>
              </Box>
            </Pressable>

            {/* Select — applies the highlighted item; disabled until something is highlighted */}
            <Pressable
              onPress={handleConfirm}
              disabled={!tempValue}
              accessibilityLabel={t('common.select', 'Select')}
              style={styles.footerButton}
            >
              <Box
                py="$3"
                borderRadius="$md"
                bg={tempValue ? '$primary600' : '$borderLight200'}
                alignItems="center"
                opacity={tempValue ? 1 : 0.6}
              >
                <Text
                  fontSize="$sm"
                  fontFamily="Inter"
                  fontWeight="$semibold"
                  color={tempValue ? '$white' : '$textMutedForeground'}
                >
                  {t('common.select', 'Select')}
                </Text>
              </Box>
            </Pressable>
          </ModalFooter>
        </ModalContent>
      </GluestackModal>
    </>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    maxHeight: 380,
  },
  footerButton: {
    flex: 1,
  },
});

export default PaginatedSelect;
