import React from 'react';
import { StyleSheet } from 'react-native';
import {
  Menu as PopupMenu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
  renderers,
} from 'react-native-popup-menu';
import {
  Box,
  Text,
  Icon,
  ButtonText,
  Button,
  useColorMode,
} from '@gluestack-ui/themed';
import LucideIcon from '@components/ui/LucideIcon';
import { useLanguage } from '@contexts/LanguageContext';
import type { MenuItemData, CustomMenuProps } from './types';

export type { MenuItemData, CustomMenuProps } from './types';

// Native (Android/iOS) implementation, backed by react-native-popup-menu.
// Gluestack's Menu is unreliable on native (won't reopen after a selection,
// inconsistent positioning) but works fine on web — see index.web.tsx for
// the web implementation used there instead.

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
  disabledKeys = [],
  triggerLabel = 'Menu',
  triggerProps = {},
  trigger,
  onSelect,
  ...menuProps
}) => {
  const { t } = useLanguage();
  const mode = useColorMode();
  const isDark = mode === 'dark';
  const menuRef = React.useRef<any>(null);

  const handleMenuItemPress = (key: string) => {
    if (onSelect) {
      onSelect(key);
    }
  };

  // Gluestack's Pressable/Button always attach their own press responder
  // (via usePress()), so they win RN's touch-responder negotiation over
  // MenuTrigger's wrapping touchable — opening must be driven from here,
  // through the trigger's own onPress, rather than relying on MenuTrigger.
  const openMenu = () => {
    menuRef.current?.open();
  };

  const renderTrigger = () => {
    const mergedTriggerProps = { ...triggerProps, onPress: openMenu };
    if (trigger) {
      return trigger(mergedTriggerProps);
    }
    return (
      <DefaultTrigger label={t(triggerLabel)} triggerProps={mergedTriggerProps} />
    );
  };

  return (
    <PopupMenu ref={menuRef} renderer={renderers.ContextMenu} onSelect={handleMenuItemPress} {...menuProps}>
      <MenuTrigger>{renderTrigger()}</MenuTrigger>
      <MenuOptions customStyles={{ optionsContainer: styles.optionsContainerReset }}>
        <Box
          bg={isDark ? '$backgroundDark900' : '$white'}
          borderColor={isDark ? '$borderDark700' : '$borderLight200'}
          style={styles.surface}
        >
          {items?.map((item: MenuItemData, index: number) => {
            const isKeyDisabled = disabledKeys.includes(item.key);

            return (
              <React.Fragment key={item.key || index.toString()}>
                <MenuOption
                  value={item.key}
                  disabled={isKeyDisabled}
                  onSelect={item.isComingSoon ? () => {} : undefined}
                  accessibilityRole="menuitem"
                  accessibilityLabel={item.textValue}
                  customStyles={{ optionWrapper: styles.optionWrapperReset }}
                >
                  <Box
                    flexDirection="row"
                    alignItems="center"
                    justifyContent="space-between"
                    flex={1}
                    px="$3"
                    py="$2.5"
                    opacity={item.isComingSoon ? 0.6 : 1}
                  >
                    <Box flexDirection="row" alignItems="center" flex={1}>
                      {item.iconElement ? (
                        // Custom ReactNode icon (used in constants for React.createElement pattern)
                        <Box mr="$2">{item.iconElement}</Box>
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
                      <Text size="sm" color={item.color}>
                        {t(item.label)}
                      </Text>
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
                </MenuOption>

                {/* Divider after menu item if showDividerAfter is true */}
                {item.showDividerAfter && (
                  <Box bg={isDark ? '$borderDark700' : '$borderLight200'} style={styles.divider} />
                )}
              </React.Fragment>
            );
          })}
        </Box>
      </MenuOptions>
    </PopupMenu>
  );
};

const styles = StyleSheet.create({
  optionsContainerReset: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    width: undefined,
    shadowOpacity: 0,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 0,
    zIndex: 9999,
    elevation: 9999,
  },
  optionWrapperReset: {
    padding: 0,
  },
  surface: {
    minWidth: 200,
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 4,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    zIndex: 9999,
    elevation: 6,
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 4,
  },
});

export default CustomMenu;
