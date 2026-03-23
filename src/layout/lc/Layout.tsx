import React, { useMemo } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaView, ScrollView, useColorMode, Pressable, Icon, MenuIcon, VStack } from '@gluestack-ui/themed';
import { useNavigation } from '@react-navigation/native';
import Header from '@components/Header';
import { stylesLayout } from './Styles';
import { LC_MENU_OPTIONS } from '@constants/PROFILE_MENU_OPTIONS';
import { useAuth } from '@contexts/AuthContext';
import { useLanguage } from '@contexts/LanguageContext';
import { useDocumentTitle } from '@hooks';
import logger from '@utils/logger';

/**
 * LC Layout Component - Enhanced Header Integration
 * 
 * - Integrates Header component with LC-specific configuration (left-aligned profile menu, hamburger menu)
 * - Menu selection handler: Uses navigation routes from LC_MENU_OPTIONS config, handles logout separately
 */
interface LayoutProps {
  title: string;
  children: React.ReactNode;
  navigation?: any;
  pendingSyncCount?: number;
  disableScroll?: boolean;
  pageName?: string; // Page name for title setting
}

const Layout: React.FC<LayoutProps> = ({ title, children, disableScroll, pageName }) => {
  const mode = useColorMode();
  const isDark = mode === 'dark';
  const { logout, navbarData } = useAuth();
  const { t } = useLanguage();
  const navigation = useNavigation();

  // Set document title for web - memoize to avoid recalculation
  const pageTitle = useMemo(() => 
    pageName ? t(`lc.pageTitle.${pageName}`) : title,
    [pageName, title, t]
  );
  useDocumentTitle(pageTitle);

  // Handle menu item selection - uses route from menu config for navigation
  const handleMenuSelect = (key: string | undefined) => {
    logger.log('Menu selected:', key);
    
    if (key === 'logout') {
      logout();
      return;
    }
    
    // Find the menu item in LC_MENU_OPTIONS and use its route for navigation
    const menuItem = LC_MENU_OPTIONS.find(item => item.key === key);
    if (menuItem?.route) {
      navigation.navigate(menuItem.route as never);
    }
  };

  const rightSideContent = (
    <Pressable>
      <Icon as={MenuIcon} />
    </Pressable>
  );

  return (
    <SafeAreaView
      style={stylesLayout.safeAreaView}
      bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}
    >
      {/* Status Bar */}
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? '$backgroundDark950' : '$backgroundLight0'}
      />

      {/* 
        Header with LC-specific configuration
        - userMenuPosition="left": Places profile menu on left side (LC layout)
        - hamburgerMenuItems: Passes all LC menu items including Home
        - onHamburgerMenuSelect: Handles menu item selection (navigation/logout)
        - showLanguage/showTheme: Disabled for LC layout
      */}
      <Header 
        title={title} 
        subTitle={navbarData?.subtitle}
        showLanguage={false} 
        showTheme={false} 
        userMenuPosition="left"
        rightSideContent={rightSideContent}
        hamburgerMenuItems={LC_MENU_OPTIONS}
        onHamburgerMenuSelect={handleMenuSelect}
      />

      {/* Main Content */}
      {(() => {
        const content = <>{children}</>;
        if (disableScroll) {
          return (
            <VStack flex={1} bg={isDark ? '$backgroundDark950' : '$accent100'}>
              {content}
            </VStack>
          );
        }
        return (
          <ScrollView
            {...stylesLayout.mainContent}
            bg={isDark ? '$backgroundDark950' : '$accent100'}
          >
            {content}
          </ScrollView>
        );
      })()}
    </SafeAreaView>
  );
};

export default Layout;
