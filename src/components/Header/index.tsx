import React, { useState } from 'react';

import {
  Box,
  HStack,
  Text,
  Icon,
  MoonIcon,
  SunIcon,
  Menu,
  Pressable,
  Avatar,
  AvatarFallbackText,
  Input,
  InputSlot,
  InputIcon,
  InputField,
  Badge,
  VStack,
  SearchIcon,
  BellIcon,
  ChevronDownIcon,
  Modal,
  LucideIcon,
} from '@ui';
import { useGlobal } from '@contexts/GlobalContext';
import { stylesHeader } from './Styles';
import LanguageSelector from '@components/LanguageSelector/LanguageSelector';
import { useAuth, User } from '@contexts/AuthContext';
import { usePlatform } from '@utils/platform';
import PROFILE_MENU_OPTIONS from '@constants/PROFILE_MENU_OPTIONS';
import logger from '@utils/logger';
import { useLanguage } from '@contexts/LanguageContext';
import { theme } from '@config/theme';
import { profileStyles, LCProfileStyles } from '@components/ui/Modal/Styles';
import { MenuItemData } from '@components/ui/Menu';
import { getUserProfile } from '../../services/authenticationService';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';

/**
 * Header Component - Enhanced for LC Layout Support
 * 
 * - Added `userMenuPosition` prop to control profile menu placement (left for LC, right for Admin)
 * - Added `hamburgerMenuItems` and `onHamburgerMenuSelect` props for LC hamburger menu integration
 * - Conditional rendering: Shows hamburger menu when LC props provided, otherwise shows default rightSideContent
 * - Left-aligned profile menu: When `userMenuPosition="left"`, displays avatar with gradient background and user icon
 * - Gradient avatar: Uses `$web-style` for CSS gradient on web, solid color fallback on native platforms
 */
const Header: React.FC<{
  title?: string;
  rightSideContent?: React.ReactNode;
  leftSideContent?: React.ReactNode;
  search?: string;
  setSearch?: (search: string) => void;
  // Props for controlling the visibility of language and theme sections
  showLanguage?: boolean;
  showTheme?: boolean;
  showNotification?: boolean;
  // Control user menu position (left or right) - for LC layout
  userMenuPosition?: 'left' | 'right';
  // For LC: menu items and handler for hamburger menu
  hamburgerMenuItems?: MenuItemData[];
  onHamburgerMenuSelect?: (key: string | undefined) => void;
}> = ({
  title,
  rightSideContent,
  leftSideContent,
  search,
  setSearch,
  showLanguage,
  showTheme,
  showNotification,
  userMenuPosition = 'right',
  hamburgerMenuItems,
  onHamburgerMenuSelect,
}) => {
  const { colorMode, setColorMode } = useGlobal();
  const isDark = colorMode === 'dark';
  const { user, logout, isLoggedIn } = useAuth();
  const { isMobile } = usePlatform();
  const { t, currentLanguage, changeLanguage } = useLanguage();
  const [authUser, setAuthUser] = useState<User | null>(null);

  const languageCodes =
    Array.isArray(authUser?.languages) && authUser.languages.filter(Boolean).length > 0
      ? (authUser.languages.filter(Boolean) as string[])
      : (['en'] as string[]);

  const handleMenuSelect = async (key: string | undefined) => {
    // Handle menu item selection
    logger.log('Menu selected:', key);
    if (key === 'myProfile') {
      const userProfile = await getUserProfile();
      setAuthUser(userProfile);
    } else if (key === 'logout') {
      logout();
    }
  };
  // Wrapper for hamburger menu selection - handles myProfile in Header, passes others to parent
  const handleHamburgerMenuSelect = async (key: string | undefined) => {
    // Check if the selected menu item is coming soon
    const selectedItem = hamburgerMenuItems?.find(item => item.key === key);
    if (selectedItem?.isComingSoon) {
      // Don't proceed if item is coming soon
      return;
    }

    if (key === 'myProfile') {
      const userProfile = await getUserProfile();
      setAuthUser(userProfile);
    } else if (onHamburgerMenuSelect) {
      // Pass other menu items to parent handler (for navigation, logout, etc.)
      onHamburgerMenuSelect(key);
    }
  };

  return (
    <Box
      {...stylesHeader.container}
      borderBottomColor={isDark ? '$borderDark200' : '$borderLight200'}
      bg={isDark ? '$backgroundDark950' : '$white'}
      shadowColor={isDark ? '$backgroundDark950' : '$shadowColor'}
    >
      <HStack {...stylesHeader.hStack}>
        {/* 
          Hamburger Menu with Dropdown (for LC)
          - Conditionally renders hamburger menu when LC props (hamburgerMenuItems, onHamburgerMenuSelect) are provided
          - Uses MenuIcon as trigger, opens menu at "bottom left" placement
          - Falls back to default rightSideContent if LC props not provided (Admin layout)
        */}
        {rightSideContent && hamburgerMenuItems && onHamburgerMenuSelect ? (
          <Menu
            items={hamburgerMenuItems}
            placement="bottom left"
            offset={15}
            trigger={triggerProps => (
              <Pressable {...triggerProps} px="$3">
                <LucideIcon name="Menu" size={16} color={isDark ? '$textLight100' : '$textDark900'} />
              </Pressable>
            )}
            onSelect={handleHamburgerMenuSelect}
          />
        ) : (
          rightSideContent
        )}
        
        {/* 
          Left: Avatar with User Info (only if userMenuPosition is 'left' - LC layout)
          - Displays avatar with gradient background on web, solid color on native
          - Gradient: Uses $web-style prop for CSS linear-gradient (web only)
          - Avatar contains User icon overlay positioned absolutely in center
          - Shows user name next to avatar (role commented out for future use)
        */}
        {isLoggedIn && userMenuPosition === 'left' && (
          <HStack {...stylesHeader.userMenuTrigger} alignItems="center" space="sm">
            <Avatar {...stylesHeader.userAvatar} $web-style={{
              backgroundImage: 'linear-gradient(to right bottom, rgb(139, 40, 66) 0%, oklab(0.999994 0.0000455678 0.0000200868 / 0.9) 100%)',
            }}>
              <AvatarFallbackText>
                {' '}
              </AvatarFallbackText>
              <Box position="absolute" justifyContent="center" alignItems="center" width="100%" height="100%">
                <LucideIcon name="User" size={20} color="#fff" />
              </Box>
            </Avatar>
            <VStack {...stylesHeader.userInfoContainer}>
              <Text {...stylesHeader.userNameText}>
                {user?.name || ''}
              </Text>
              {/* <HStack {...stylesHeader.userRoleContainer}>
                <Text {...stylesHeader.userRoleText}>
                  {user?.role || ''}
                </Text>
              </HStack> */}
            </VStack>
          </HStack>
        )}
        
        {/* Title */}
        {title && (
          <Text
            {...TYPOGRAPHY.h4}
            color={isDark ? '$textLight100' : '$textDark900'}
          >
            {title}
          </Text>
        )}
        {/* Center: Search Bar */}
        {setSearch && (
          <>
            <Box {...stylesHeader.searchContainer}>
              <Input {...stylesHeader.searchInput}>
                <InputSlot pl="$3">
                  <InputIcon as={SearchIcon} />
                </InputSlot>
                <InputField
                  placeholder={t('common.search')}
                  {...stylesHeader.searchInputField}
                  value={search || ''}
                  onChangeText={text => setSearch(text)}
                />
              </Input>
            </Box>
          </>
        )}
        {/* Right: Notifications, Language & Theme */}
        <HStack {...stylesHeader.rightActionsContainer}>
          {/* Notifications */}
          {showNotification && (
            <Pressable position="relative">
              <Icon as={BellIcon} {...stylesHeader.notificationIcon} />
              <Badge {...stylesHeader.notificationBadge}>
                <Text {...stylesHeader.notificationBadgeText}>3</Text>
              </Badge>
            </Pressable>
          )}
          {showLanguage && <LanguageSelector />}
          {showTheme && (
            <Icon
              {...stylesHeader.rightColorModeIcon}
              as={colorMode === 'dark' ? MoonIcon : SunIcon}
              onPress={() => {
                const newMode = colorMode === 'dark' ? 'light' : 'dark';
                setColorMode(newMode);
              }}
            />
          )}
          {/* Right: User Menu (only if userMenuPosition is 'right' or default) */}
          {isLoggedIn && userMenuPosition === 'right' && (
            <Menu
              items={PROFILE_MENU_OPTIONS}
              placement="bottom right"
              offset={5}
              trigger={triggerProps => (
                <Pressable {...triggerProps} {...stylesHeader.userMenuTrigger}>
                  <Avatar {...stylesHeader.userAvatar}>
                    <AvatarFallbackText>
                      {user?.name
                        ?.split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase() || 'AD'}
                    </AvatarFallbackText>
                  </Avatar>
                  {!isMobile && (
                    <>
                      <VStack {...stylesHeader.userInfoContainer}>
                        <Text {...stylesHeader.userNameText}>
                          {user?.name || ''}
                        </Text>
                        <HStack {...stylesHeader.userRoleContainer}>
                          <Text {...stylesHeader.userRoleText}>
                            {user?.role || ''}
                          </Text>
                        </HStack>
                      </VStack>
                      <Icon
                        as={ChevronDownIcon}
                        {...stylesHeader.chevronIcon}
                      />
                    </>
                  )}
                </Pressable>
              )}
              onSelect={handleMenuSelect}
            />
          )}
        </HStack>
        {leftSideContent && leftSideContent}
      </HStack>

      {/* Profile Modal */}
      <Modal
        isOpen={!!authUser}
        onClose={() => setAuthUser(null)}
        headerTitle={t('lcProfile.myProfile')}
        headerDescription={t('lcProfile.linkageChampionProfile')}
        headerIcon={
          <Box {...stylesHeader.headerIcon}>
            <LucideIcon name="User" size={24} color="#ffffff" />
          </Box>
        }
        size="lg"
        
      >
        <VStack
          {...LCProfileStyles.lcProfileCard}
          $md-p="$6"
        >
          <Box
            {...LCProfileStyles.lcFieldWrapper}
            $md-flexDirection="row"
            $md-gap="$6"
          >
            {/* Full Name */}
            <Box {...LCProfileStyles.lcItem} $md-width="auto">
              <HStack mb="$2" space="sm">
                <LucideIcon name="User" size={16} color={theme.tokens.colors.textMutedForeground} />
                <Text {...profileStyles.fieldValue}>{t('lcProfile.fullName')}</Text>
              </HStack>
              <Box {...LCProfileStyles.lcValueField} width="$full" overflow="hidden">
                <Text 
                  {...profileStyles.fieldLabel}
                  flexShrink={1}
                >
                  {authUser?.name}
                </Text>
              </Box>
            </Box>

            {/* LC ID */}
            <Box {...LCProfileStyles.lcItem} $md-width="auto">
              <HStack mb="$2" space="sm">
                <LucideIcon name="Award" size={16} color={theme.tokens.colors.textMutedForeground} />
                <Text {...profileStyles.fieldValue}>{t('lcProfile.lcId')}</Text>
              </HStack>
              <Box {...LCProfileStyles.lcValueField} width="$full" overflow="hidden">
                <Text 
                  {...profileStyles.fieldLabel}
                  flexShrink={1}
                >
                  {authUser?.id}
                </Text>
              </Box>
            </Box>

            {/* Email Address */}
            <Box {...LCProfileStyles.lcItem} $md-width="auto">
              <HStack mb="$2" space="sm">
                <LucideIcon name="Mail" size={16} color={theme.tokens.colors.textMutedForeground} />
                <Text {...profileStyles.fieldValue}>{t('lcProfile.emailAddress')}</Text>
              </HStack>
              <Box {...LCProfileStyles.lcValueField} width="$full" overflow="hidden">
                <Text 
                  {...profileStyles.fieldLabel}
                  flexShrink={1}
                >
                  {authUser?.email}
                </Text>
              </Box>
            </Box>

            {/* Phone Number */}
            <Box {...LCProfileStyles.lcItem} $md-width="auto">
              <HStack mb="$2" space="sm">
                <LucideIcon name="Phone" size={16} color={theme.tokens.colors.textMutedForeground} />
                <Text {...profileStyles.fieldValue}>{t('lcProfile.phoneNumber')}</Text>
              </HStack>
              <Box {...LCProfileStyles.lcValueField} width="$full" overflow="hidden">
                <Text 
                  {...profileStyles.fieldLabel}
                  flexShrink={1}
                >
                  {`${authUser?.phone_code} ${authUser?.phone}`}
                </Text>
              </Box>
            </Box>

            {/* Service Area - Full Width */}
            <Box width="$full">
              <HStack mb="$2" space="sm">
                <LucideIcon name="MapPin" size={16} color={theme.tokens.colors.textMutedForeground} />
                <Text {...profileStyles.fieldValue}>{t('lcProfile.serviceArea')}</Text>
              </HStack>
              <Box {...LCProfileStyles.lcValueField} width="$full" overflow="hidden">
                <Text 
                  {...profileStyles.fieldLabel}
                  flexShrink={1}
                >
                  {authUser?.location}
                </Text>
              </Box>
            </Box>

            {/* Start Date */}
            <Box {...LCProfileStyles.lcItem} $md-width="auto">
              <HStack mb="$2" space="sm">
                <LucideIcon name="Calendar" size={16} color={theme.tokens.colors.textMutedForeground} />
                <Text {...profileStyles.fieldValue}>{t('lcProfile.startDate')}</Text>
              </HStack>
              <Box {...LCProfileStyles.lcValueField} width="$full" overflow="hidden">
                <Text 
                  {...profileStyles.fieldLabel}
                  flexShrink={1}
                >
                  {authUser?.created_at 
                    ? new Date(authUser.created_at).toLocaleDateString('en-GB')
                    : ''}
                </Text>
              </Box>
            </Box>

            {/* Language Preference */}
            <Box {...LCProfileStyles.lcItem} $md-width="auto">
              <HStack mb="$2" space="sm">
                <Text {...profileStyles.fieldValue}>{t('lcProfile.languagePreference')}</Text>
              </HStack>
              <HStack space="sm">
                {languageCodes.map((langCode) => {
                  const isActive = currentLanguage === langCode;
                  return (
                    <Pressable key={langCode} onPress={() => changeLanguage(langCode)}>
                      <Box
                        {...profileStyles.languageButton}
                        {...(isActive
                          ? profileStyles.languageButtonActive
                          : profileStyles.languageButtonInactive)}
                      >
                        <Text
                          {...profileStyles.languageButtonText}
                          {...(isActive
                            ? profileStyles.languageButtonTextActive
                            : profileStyles.languageButtonTextInactive)}
                        >
                          {t(`languages.${langCode}`)}
                        </Text>
                      </Box>
                    </Pressable>
                  );
                })}
              </HStack>
            </Box>
          </Box>
        </VStack>
      </Modal>
    </Box>
  );
};

export default Header;
