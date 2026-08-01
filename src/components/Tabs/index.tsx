import React from 'react';
import { TabButtonProps } from '@app-types/components';
import { theme } from '@config/theme';
import { Text, Pressable, HStack, Box } from '@gluestack-ui/themed';
import { LucideIcon } from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import { usePlatform } from '@utils/platform';
import { tabButtonStyles } from './Styles';

export const TabButton: React.FC<TabButtonProps> = ({
  tab,
  isActive,
  onPress,
  variant = 'default',
  _text,
  _container,
  iconSize,
}) => {
  const { t } = useLanguage();
  const { isMobile } = usePlatform();
  const { key, label, mobileLabel, icon, count, badge, isDisabled = false } = tab;
  
  // Use mobileLabel on mobile (plain string), otherwise translate regular label
  const displayText = isMobile && mobileLabel ? mobileLabel : t(label);

  const isButtonTabVariant = variant === 'ButtonTab';

  const containerStyles = isButtonTabVariant
    ? tabButtonStyles.buttonTabContainer(isActive)
    : tabButtonStyles.defaultContainer(isActive);

  const textStyles = isButtonTabVariant
    ? tabButtonStyles.buttonTabText(isActive)
    : tabButtonStyles.defaultText(isActive);

  const iconColor = isButtonTabVariant
    ? tabButtonStyles.buttonTabIconColor
    : isActive
    ? theme.tokens.colors.primary500
    : theme.tokens.colors.mutedForeground;

  const displayBadge = count ?? badge;

  return (
    <Pressable
      onPress={() => !isDisabled && onPress(key)}
      {...containerStyles}
      {..._container}
      {...tabButtonStyles.pressableOpacity(isDisabled)}
    >
      <HStack {...tabButtonStyles.tabRow}>
        {icon ? (
          <LucideIcon name={icon} size={iconSize || 20} color={iconColor} />
        ) : null}
        <Text {...textStyles} {..._text}>{displayText}</Text>
        {displayBadge !== undefined && (
          <Box {...tabButtonStyles.badgeContainer(isActive)}>
            <Text {...tabButtonStyles.badgeText(isActive)}>
              {displayBadge}
            </Text>
          </Box>
        )}
      </HStack>
    </Pressable>
  );
};