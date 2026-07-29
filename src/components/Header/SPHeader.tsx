import React, { useCallback, useMemo } from 'react';
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
import { stylesHeader } from './Styles';
import openExternalLink from '@utils/openExternalLink';

const SPAvatarWebStyle = {
  backgroundImage:
    'linear-gradient(to right bottom, rgb(139, 40, 66) 0%, oklab(0.999994 0.0000455678 0.0000200868 / 0.9) 100%)',
};

interface SPHeaderProps {
  title?: string;
  subTitle?: string;
  hamburgerMenuItems?: MenuItemData[];
  onHamburgerMenuSelect?: (key: string | undefined) => void;
}

const SPHeader: React.FC<SPHeaderProps> = ({
  title,
  subTitle,
  hamburgerMenuItems,
  onHamburgerMenuSelect,
}) => {
  const mode = useColorMode();
  const isDark = mode === 'dark';
  const { t } = useLanguage();
  const { user, isLoggedIn } = useAuth();
  
  const orgName = useMemo(() => {
    const userOrgs = user?.user_organizations;
    if (userOrgs && userOrgs.length > 0) {
      const org = userOrgs[0]?.organization || userOrgs[0]?.organisation;
      if (org) {
        return org.name || org.title || org.label || '';
      }
    }
    const orgs = user?.organizations;
    if (orgs && orgs.length > 0) {
      const org = orgs[0];
      return org?.name || org?.title || org?.label || '';
    }
    return '';
  }, [user]);

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
          color={isDark ? '$textDark900' : '$textLight100'}
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
      bg={isDark ? '$backgroundDark950' : '$primary500'}
      shadowColor={isDark ? '$backgroundDark950' : '$shadowColor'}
      minHeight={subTitle ? 69 : 64}
    >
      <HStack {...stylesHeader.hStack} justifyContent="space-between">
        <HStack alignItems="center" space="md">
          {hamburgerMenuItems ? (
            <Menu
              items={hamburgerMenuItems}
              placement="bottom left"
              offset={15}
              trigger={renderMenuTrigger}
              onSelect={handleHamburgerMenuSelect}
            />
          ) : null}

          {isLoggedIn && false && (
            <HStack {...stylesHeader.userMenuTrigger}>
              <Avatar
                {...stylesHeader.userAvatar}
                $web-style={SPAvatarWebStyle}
              >
                <AvatarFallbackText> </AvatarFallbackText>
                <Box
                  position="absolute"
                  justifyContent="center"
                  alignItems="center"
                  width="100%"
                  height="100%"
                >
                  <LucideIcon name="User" size={20} color="$white" />
                </Box>
              </Avatar>
              <VStack {...stylesHeader.userInfoContainer}>
                <Text {...stylesHeader.userNameText} color="$white">{user?.name || ''}</Text>
                {subTitle ? (
                  <HStack {...stylesHeader.userRoleContainer}>
                    <Text {...stylesHeader.userRoleText}>{subTitle}</Text>
                  </HStack>
                ) : null}
              </VStack>
            </HStack>
          )}
          <Text
            {...TYPOGRAPHY.h3}
            lineHeight="$md"
            fontWeight="$bold"
            color={isDark ? '$textLight100' : '$textDark100'}
          >
            {t('supportProvider.header.gblPartnerPlatform', 'GBL Partner Platform')}
          </Text>

          {title ? (
            <Text
              {...TYPOGRAPHY.h4}
              color={isDark ? '$textLight100' : '$textDark900'}
            >
              {title}
            </Text>
          ) : null}
        </HStack>

        <HStack alignItems="center" space="md">
          {orgName ? (
            <Text
              fontSize="$md"
              fontWeight="$semibold"
              color="$white"
            >
              {orgName}
            </Text>
          ) : null}
          <Pressable position="relative" p="$2">
            <LucideIcon
              name="Bell"
              size={20}
              color={isDark ? '$textDark900' : '$white'}
            />
            <Box
              position="absolute"
              top={2}
              right={2}
              bg="$error600"
              rounded="$full"
              minWidth={16}
              height={16}
              justifyContent="center"
              alignItems="center"
              px="$1"
            >
              <Text
                fontSize={9}
                color="$white"
                fontWeight="$bold"
                lineHeight={10}
              >
                3
              </Text>
            </Box>
          </Pressable>
        </HStack>
      </HStack>
    </Box>
  );
};

export default SPHeader;
