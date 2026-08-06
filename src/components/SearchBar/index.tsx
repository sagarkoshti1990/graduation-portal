import React, { useState, useEffect, useCallback } from 'react';
import { Box, Input, InputField, InputSlot } from '@gluestack-ui/themed';
import { LucideIcon } from '@ui/index';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';
import { SearchBarProps } from '@app-types/components';
import { useLanguage } from '@contexts/LanguageContext';

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder,
  onSearch,
  debounceMs = 500,
  defaultValue = '',
}) => {
  const { t } = useLanguage();
  const [searchText, setSearchText] = useState(defaultValue);

  const finalPlaceholder = placeholder || t('common.search');
  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchText);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchText, debounceMs, onSearch]);

  const handleChange = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  return (
    <Box width="$full">
      <Input
        variant="outline"
        size="sm"
        borderColor="$borderColor"
        borderRadius={10}
        bg="$white"
        alignItems="center"
      >
        <InputSlot pl="$2.5">
          <LucideIcon
            name="Search"
            size={16}
            color="$textMutedForeground"
          />
        </InputSlot>
        <InputField
          placeholder={t(finalPlaceholder)}
          value={searchText}
          onChangeText={handleChange}
          {...TYPOGRAPHY.input}
          placeholderTextColor="$textMutedForeground"
          borderColor="$borderColor"
          bg="$white"
          mr="$2.5"
          px="$0"
          pl="$2.5"
          height="$9"
          lineHeight="$md"
        />
      </Input>
    </Box>
  );
};

export default SearchBar;
