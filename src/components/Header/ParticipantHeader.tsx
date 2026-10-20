import React, { useCallback } from 'react';
import {
  Avatar,
  AvatarFallbackText,
  Box,
  HStack,
  Pressable,
  Text,
  VStack,
  useColorMode,
} from '@gluestack-ui/themed';
import { useAuth } from '@contexts/AuthContext';
import { useLanguage } from '@contexts/LanguageContext';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';
import type { MenuItemData } from '@components/ui/Menu';
import Menu from '@components/ui/Menu';
import LucideIcon from '@components/ui/LucideIcon';
import { stylesHeader, participantAvatarWebStyle } from './Styles';
import openExternalLink from '@utils/openExternalLink';

interface ParticipantHeaderProps {
  title?: string;
  subTitle?: string;
  hamburgerMenuItems?: MenuItemData[];
  onHamburgerMenuSelect?: (key: string | undefined) => void;
  onAvatarPress?: () => void;
}

const ParticipantHeader: React.FC<ParticipantHeaderProps> = ({
  title,
  subTitle,
  hamburgerMenuItems,
  onHamburgerMenuSelect,
  onAvatarPress,
}) => {
  const mode = useColorMode();
  const isDark = mode === 'dark';
  const { t } = useLanguage();
  const { user, isLoggedIn } = useAuth();

  const renderMenuTrigger = useCallback(
    (triggerProps: any) => (
      <Pressable
        {...triggerProps}
        px="$3"
        accessibilityRole="button"
        accessibilityLabel={t('navigation.menu')}
      >
        <LucideIcon
          name="Menu"
          size={16}
          color={isDark ? '$textLight100' : '$textDark900'}
        />
      </Pressable>
    ),
    [isDark, t],
  );

  const handleHamburgerMenuSelect = async (key: string | undefined) => {
    const selectedItem = hamburgerMenuItems?.find(item => item.key === key);
    if (selectedItem?.isComingSoon) {
      return;
    }

    if (selectedItem?.href) {
      await openExternalLink(selectedItem.href);
      return;
    }

    onHamburgerMenuSelect?.(key);
  };

  return (
    <Box
      {...stylesHeader.container}
      borderBottomColor={isDark ? '$borderDark200' : '$borderLight200'}
      bg={isDark ? '$backgroundDark950' : '$white'}
      shadowColor={isDark ? '$backgroundDark950' : '$shadowColor'}
      minHeight={subTitle ? 69 : 57}
    >
      <HStack {...stylesHeader.hStack} justifyContent="flex-start">
        {hamburgerMenuItems ? (
          <Menu
            items={hamburgerMenuItems}
            placement="bottom left"
            offset={15}
            trigger={renderMenuTrigger}
            onSelect={handleHamburgerMenuSelect}
          />
        ) : null}

        {isLoggedIn && (
          <Pressable onPress={onAvatarPress} disabled={!onAvatarPress}>
            <HStack {...stylesHeader.userMenuTrigger}>
              <Avatar
                {...stylesHeader.userAvatar}
                $web-style={participantAvatarWebStyle}
              >
                <AvatarFallbackText> </AvatarFallbackText>
                <Box
                  position="absolute"
                  justifyContent="center"
                  alignItems="center"
                  width="100%"
                  height="100%"
                >
                  <LucideIcon name="User" size={20} color="#fff" />
                </Box>
              </Avatar>
              <VStack {...stylesHeader.userInfoContainer}>
                <Text {...stylesHeader.userNameText}>{user?.name || ''}</Text>
                {subTitle ? (
                  <HStack {...stylesHeader.userRoleContainer}>
                    <Text {...stylesHeader.userRoleText}>{subTitle}</Text>
                  </HStack>
                ) : null}
              </VStack>
            </HStack>
          </Pressable>
        )}

        {title ? (
          <Text
            {...TYPOGRAPHY.h4}
            color={isDark ? '$textLight100' : '$textDark900'}
          >
            {title}
          </Text>
        ) : null}
      </HStack>
    </Box>
  );
};

export default ParticipantHeader;
