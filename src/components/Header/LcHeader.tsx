import React, { Suspense, lazy, useCallback, useState } from 'react';
import {
  Avatar,
  AvatarFallbackText,
  Box,
  HStack,
  Pressable,
  Spinner,
  Text,
  VStack,
  useColorMode,
} from '@gluestack-ui/themed';
import { useAuth } from '@contexts/AuthContext';
import { theme } from '@config/theme';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';
import type { MenuItemData } from '@components/ui/Menu';
import Menu from '@components/ui/Menu';
import LucideIcon from '@components/ui/LucideIcon';
import { stylesHeader } from './Styles';

const LcProfileModal = lazy(() => import('./LcProfileModal'));
const lcAvatarWebStyle = {
  backgroundImage:
    'linear-gradient(to right bottom, rgb(139, 40, 66) 0%, oklab(0.999994 0.0000455678 0.0000200868 / 0.9) 100%)',
};

interface LcHeaderProps {
  title?: string;
  subTitle?: string;
  hamburgerMenuItems?: MenuItemData[];
  onHamburgerMenuSelect?: (key: string | undefined) => void;
}

const LcHeader: React.FC<LcHeaderProps> = ({
  title,
  subTitle,
  hamburgerMenuItems,
  onHamburgerMenuSelect,
}) => {
  const mode = useColorMode();
  const isDark = mode === 'dark';
  const { user, isLoggedIn } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const handleCloseProfile = useCallback(() => {
    setIsProfileOpen(false);
  }, []);
  const renderMenuTrigger = useCallback(
    (triggerProps: any) => (
      <Pressable {...triggerProps} px="$3">
        <LucideIcon
          name="Menu"
          size={16}
          color={isDark ? '$textLight100' : '$textDark900'}
        />
      </Pressable>
    ),
    [isDark],
  );

  const handleHamburgerMenuSelect = (key: string | undefined) => {
    const selectedItem = hamburgerMenuItems?.find(item => item.key === key);
    if (selectedItem?.isComingSoon) {
      return;
    }

    if (key === 'myProfile') {
      setIsProfileOpen(true);
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
          <HStack {...stylesHeader.userMenuTrigger}>
            <Avatar
              {...stylesHeader.userAvatar}
              $web-style={lcAvatarWebStyle}
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

      {isProfileOpen ? (
        <Suspense
          fallback={
            <Box position="absolute" right="$4" top="$4">
              <Spinner size="small" color={theme.tokens.colors.primary500} />
            </Box>
          }
        >
          <LcProfileModal isOpen={isProfileOpen} onClose={handleCloseProfile} />
        </Suspense>
      ) : null}
    </Box>
  );
};

export default LcHeader;
