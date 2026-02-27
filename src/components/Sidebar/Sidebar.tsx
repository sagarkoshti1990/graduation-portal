import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Pressable,
  Icon,
  Divider,
  ScrollView,
  Image,
  ChevronDownIcon,
  ChevronUpIcon,
  CloseIcon,
  LucideIcon,
  Drawer,
} from '@ui';
import LanguageSelector from '@components/LanguageSelector/LanguageSelector';
import { useNavigation, useRoute } from '@react-navigation/native';
import { sidebarStyles, sidebarItemStyles } from './Styles';
import logoImage from '../../assets/images/logo.png';
import { usePlatform } from '@utils/platform';
import {
  MAIN_MENU_ITEMS,
  MORE_INFORMATION_MENU_ITEMS,
} from '@constants/ADMIN_SIDEBAR_MENU';
import { useLanguage } from '@contexts/LanguageContext';
import { theme } from '@config/theme';

interface SidebarItem {
  key: string;
  label: string;
  icon: string; // Lucide icon name
  route?: string;
  children?: SidebarItem[];
}

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isMobile?: boolean;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isOpen = false,
  onClose,
  isMobile,
}) => {
  const navigation = useNavigation();
  const route = useRoute();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(
    new Set(['user-management']),
  );
  const [expandedMoreInfo, setExpandedMoreInfo] = useState(true);
  const [activeRoute, setActiveRoute] = useState<string>('');
  const { isWeb } = usePlatform();
  const { t } = useLanguage();

  // Sync activeRoute with the current route from navigation
  useEffect(() => {
    const currentRouteName = route.name;
    setActiveRoute(currentRouteName);
  }, [route.name]);

  // Also listen to navigation state changes to catch programmatic navigation
  useEffect(() => {
    const unsubscribe = navigation.addListener('state', () => {
      // @ts-ignore - navigation state may not be fully typed
      const state = navigation.getState();
      if (state) {
        const currentRoute = state.routes[state.index];
        if (currentRoute?.name) {
          setActiveRoute(currentRoute.name);
        }
      }
    });

    return unsubscribe;
  }, [navigation]);
  const handleClose = () => {
    if (onClose) {
      // Parent is controlling, notify parent to close
      onClose();
    }
  };

  const handleNavigation = (route?: string) => {
    if (route) {
      // @ts-ignore
      navigation.navigate(route);
      setActiveRoute(route);
      // Close drawer on mobile after navigation
      if (isMobile) {
        handleClose();
      }
    }
  };

  const toggleExpand = (key: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedItems(newExpanded);
  };

  const renderCollapsedItem = (item: SidebarItem) => {
    const isActive = activeRoute === item.route;
    const hasChildren = item.children && item.children.length > 0;

    return (
      <Pressable
        key={item.key}
        onPress={() => {
          // In collapsed mode, we don't support expanding children; just navigate
          if (!hasChildren) {
            handleNavigation(item.route);
          } else {
            toggleExpand(item.key);
          }
        }}
      >
        {(state: any) => {
          const isHovered = state?.hovered || state?.pressed || false;
          const bg = isActive || isHovered ? '$accent200' : 'transparent';
          const iconColor = isActive
            ? theme.tokens.colors.primary600
            : theme.tokens.colors.textLight600;

          return (
            <Box
              width={40}
              height={40}
              borderRadius="$md"
              alignItems="center"
              justifyContent="center"
              bg={bg as any}
              $web-cursor="pointer"
            >
              <LucideIcon name={item.icon} size={20} color={iconColor} />
            </Box>
          );
        }}
      </Pressable>
    );
  };

  const renderSidebarItem = (item: SidebarItem, isChild = false) => {
    const isExpanded = expandedItems.has(item.key);
    const hasChildren = item.children && item.children.length > 0;
    const isActive = activeRoute === item.route;

    return (
      <Box key={item.key}>
        <Pressable
          onPress={() => {
            if (hasChildren) {
              toggleExpand(item.key);
            } else {
              handleNavigation(item.route);
            }
          }}
          {...sidebarItemStyles.container(isChild, isActive)}
          $hover={sidebarItemStyles.pressableHover}
        >
          <HStack {...sidebarItemStyles.itemContainer}>
            <HStack {...sidebarItemStyles.itemContent}>
              <LucideIcon
                name={item.icon}
                size={16}
                color={
                  isActive
                    ? theme.tokens.colors.textForeground
                    : theme.tokens.colors.textLight600
                }
              />
              <Text {...sidebarItemStyles.itemText(isActive)}>
                {t(item.label)}
              </Text>
            </HStack>
            {hasChildren && (
              <Icon
                as={isExpanded ? ChevronUpIcon : ChevronDownIcon}
                {...sidebarItemStyles.chevronIcon}
              />
            )}
          </HStack>
        </Pressable>
        {hasChildren && isExpanded && (
          <VStack {...sidebarItemStyles.childContainer}>
            {item.children?.map(child => renderSidebarItem(child, true))}
          </VStack>
        )}
      </Box>
    );
  };

  const isCollapsedDesktop = !isMobile && !isOpen;

  const sidebarContent = (
    <>
      {/* Left: Menu Button (mobile only) & Logo */}
      <HStack {...sidebarStyles.mobileMenuButton}>
        <HStack {...sidebarStyles.logoContainer}>
          <Image
            source={logoImage}
            style={sidebarStyles.logoImage}
            resizeMode="contain"
          />
          <VStack {...sidebarStyles.brandContainer}>
            <HStack {...sidebarStyles.brandRow}>
              <Text {...sidebarStyles.brandTextSecondary}>
                {t('brand.secondaryName')}
              </Text>
            </HStack>
            <Text {...sidebarStyles.versionText}>{t('brand.version')}</Text>
          </VStack>
        </HStack>
      </HStack>
      <ScrollView {...sidebarStyles.scrollContent}>
        {/* MAIN Section */}
        <Box {...sidebarStyles.mainSection}>
          <Text {...sidebarStyles.sectionTitle}>{t('admin.menu.main')}</Text>
          <VStack space="xs">
            {MAIN_MENU_ITEMS.map(item => renderSidebarItem(item))}
          </VStack>
        </Box>

        {/* <Divider my="$4" /> */}

        {/* QUICK ACTIONS Section */}
        {/* <Box>
          <Pressable
            onPress={() => setExpandedQuickActions(!expandedQuickActions)}
            {...sidebarStyles.quickActionsHeader}
          >
            <HStack {...sidebarStyles.quickActionsTitleContainer}>
              <Text {...sidebarStyles.quickActionsTitle}>
                {t('admin.menu.quickActions')}
              </Text>
              <Icon
                as={expandedQuickActions ? ChevronUpIcon : ChevronDownIcon}
                {...sidebarStyles.quickActionsChevron}
              />
            </HStack>
          </Pressable>
          {expandedQuickActions && (
            <VStack {...sidebarStyles.quickActionsContent}>
              {QUICK_ACTION_MENU_ITEMS.map(item => renderSidebarItem(item))}
            </VStack>
          )}
        </Box> */}

        <Divider my="$4" />

        {/* MORE INFORMATION Section */}
        <Box>
          <Pressable
            onPress={() => setExpandedMoreInfo(!expandedMoreInfo)}
            {...sidebarStyles.quickActionsHeader}
          >
            <HStack {...sidebarStyles.quickActionsTitleContainer}>
              <Text {...sidebarStyles.quickActionsTitle}>
                {t('admin.menu.moreInformation')}
              </Text>
              <Icon
                as={expandedMoreInfo ? ChevronUpIcon : ChevronDownIcon}
                {...sidebarStyles.quickActionsChevron}
              />
            </HStack>
          </Pressable>
          {expandedMoreInfo && (
            <VStack {...sidebarStyles.quickActionsContent}>
              {MORE_INFORMATION_MENU_ITEMS.map(item => renderSidebarItem(item))}
            </VStack>
          )}
        </Box>
      </ScrollView>

      {/* Bottom: Language & System Status */}
      {/* <Box {...sidebarStyles.bottomSection}>
        <VStack {...sidebarStyles.bottomContent}> */}
          {/* Language Selector */}
          {/* <LanguageSelector
            menuTriggerProps={sidebarStyles.languageSelectorContainer}
          /> */}

          {/* System Status */}
          {/* <HStack {...sidebarStyles.statusContainer}>
            <Box {...sidebarStyles.statusIndicator} />
            <Text {...sidebarStyles.statusText}>{t('system.online')}</Text>
          </HStack> */}
        {/* </VStack>
      </Box> */}
    </>
  );

  const collapsedSidebarContent = (
    <>
      {/* Keep the same top "logo space" height as expanded sidebar */}
      <HStack {...sidebarStyles.mobileMenuButton} justifyContent="center">
        {/* Intentionally empty: keep spacing but hide logo in collapsed mode */}
      </HStack>

      <ScrollView
        flex={1}
        px="$2"
        py="$3"
        contentContainerStyle={{
          alignItems: 'center',
          paddingBottom: 16,
        }}
      >
        <VStack space="md" alignItems="center">
          {MAIN_MENU_ITEMS.map(item => renderCollapsedItem(item))}
        </VStack>

        <Divider my="$4" />

        <VStack space="md" alignItems="center">
          {MORE_INFORMATION_MENU_ITEMS.map(item => renderCollapsedItem(item))}
        </VStack>
      </ScrollView>
    </>
  );

  // Render as Drawer (using custom Drawer) for mobile, as fixed sidebar for desktop
  if (isMobile) {
    return (
      <Drawer isOpen={isOpen} onClose={handleClose}>
        <Drawer.Backdrop />
        <Drawer.Content>
          <Drawer.Header>
            <Text {...sidebarStyles.drawerTitle}>{t('navigation.menu')}</Text>
            <Drawer.CloseButton>
              <Box {...sidebarStyles.closeButton}>
                <Icon as={CloseIcon} size="md" />
              </Box>
            </Drawer.CloseButton>
          </Drawer.Header>
          <Drawer.Body>
            <Box {...sidebarStyles.drawerBody}>{sidebarContent}</Box>
          </Drawer.Body>
        </Drawer.Content>
      </Drawer>
    );
  }

  // Desktop: Render as fixed sidebar
  return (
    <Box
      {...sidebarStyles.container}
      width={isCollapsedDesktop ? (56 as any) : '$64'}
    >
      {isCollapsedDesktop ? collapsedSidebarContent : sidebarContent}
    </Box>
  );
};

export default AdminSidebar;
