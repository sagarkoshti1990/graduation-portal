import React from 'react';
import {
  Menu,
  MenuItem,
  MenuItemLabel,
  Icon,
  ButtonText,
  Button,
  Box,
  Text,
} from '@gluestack-ui/themed';
import LucideIcon from '@components/ui/LucideIcon';
import { useLanguage } from '@contexts/LanguageContext';
import type { MenuItemData, CustomMenuProps } from './types';

export type { MenuItemData, CustomMenuProps } from './types';

// Web implementation, backed by Gluestack's Menu — it has correct portal
// rendering, positioning, and z-index handling on React Native Web already,
// so there's no need for react-native-popup-menu here (that's used on
// native instead — see index.tsx — where Gluestack's Menu is unreliable).

const DefaultTrigger: React.FC<{ label: string; triggerProps: any }> = ({
  label,
  triggerProps,
}) => {
  return (
    <Button {...triggerProps}>
      <ButtonText>{label}</ButtonText>
    </Button>
  );
};

export const CustomMenu: React.FC<CustomMenuProps> = ({
  items,
  placement = 'bottom',
  offset = 5,
  disabledKeys = [],
  triggerLabel = 'Menu',
  triggerProps = {},
  trigger,
  onSelect,
  ...menuProps
}) => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = React.useState(false);
  const handleMenuItemPress = (key: string) => {
    if (onSelect) {
      onSelect(key);
    }
  };

  const renderTrigger = React.useCallback(
    (defaultTriggerProps: any) => {
      // If custom trigger provided, use it
      if (trigger) {
        return trigger({
          ...defaultTriggerProps,
          ...triggerProps,
        });
      }
      // Otherwise use default trigger
      return (
        <DefaultTrigger
          label={t(triggerLabel)}
          triggerProps={{ ...defaultTriggerProps, ...triggerProps }}
        />
      );
    },
    [triggerProps, triggerLabel, t, trigger],
  );

  return (
    <Menu
      isOpen={isOpen}
      onOpen={() => setIsOpen(true)}
      onClose={() => setIsOpen(false)}
      placement={placement}
      offset={offset}
      crossOffset={0}
      shouldFlip
      disabledKeys={disabledKeys}
      trigger={renderTrigger}
      {...menuProps}
    >
      {items?.map((item: MenuItemData, index: number) => {
        const isDisabled = item.isComingSoon || disabledKeys.includes(item.key);

        // Render menu item with icon support (priority: iconElement > iconName > icon)
        const menuItem = (
          <MenuItem
            key={item.key || index.toString()}
            textValue={item.textValue}
            onPress={() => {
              setIsOpen(false);
              if (!item.isComingSoon) {
                handleMenuItemPress(item.key);
              }
            }}
            disabled={isDisabled}
            opacity={item.isComingSoon ? 0.6 : 1}
          >
            <Box flexDirection="row" alignItems="center" justifyContent="space-between" flex={1}>
              <Box flexDirection="row" alignItems="center" flex={1}>
                {item.iconElement ? (
                  // Custom ReactNode icon (used in constants for React.createElement pattern)
                  <Box mr="$2">
                    {item.iconElement}
                  </Box>
                ) : item.iconName ? (
                  // LucideIcon by name (flexible icon rendering)
                  <Box mr="$2">
                    <LucideIcon
                      name={item.iconName}
                      size={item.iconSizeValue || 16}
                      color={item.iconColor}
                    />
                  </Box>
                ) : item.icon ? (
                  // Gluestack Icon component
                  <Icon as={item.icon} size={item.iconSize || 'sm'} me="$2" />
                ) : null}
                <MenuItemLabel size="sm" color={item.color}>
                  {t(item.label)}
                </MenuItemLabel>
              </Box>
              {/* Coming soon badge */}
              {item.isComingSoon && (
                <Box
                  bg="$warning500"
                  px="$1.5"
                  py="$0.5"
                  borderRadius="$xs"
                  ml="$2"
                >
                  <Text fontSize="$2xs" fontWeight="$semibold" color="$white">
                    {t('common.comingSoon') || 'Coming soon.'}
                  </Text>
                </Box>
              )}
            </Box>
          </MenuItem>
        );

        // Render divider after menu item if showDividerAfter is true
        // Uses disabled MenuItem wrapper with Box separator for consistent menu structure
        if (item.showDividerAfter) {
          return (
            <React.Fragment key={item.key || index.toString()}>
              {menuItem}
              <MenuItem
                key={item.key ? `${item.key}-separator` : `separator-${index}`}
                textValue="separator"
                disabled={true}
                onPress={() => {}} padding="$0"
              >
                <Box height={1} width="100%" bg="$borderLight200" my="$1" />
              </MenuItem>
            </React.Fragment>
          );
        }

        return menuItem;
      })}
    </Menu>
  );
};

export default CustomMenu;
