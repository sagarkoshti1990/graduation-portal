import React, { useMemo, useState } from 'react';
import { ScrollView, useColorMode,  VStack } from '@gluestack-ui/themed';
import { useNavigation } from '@react-navigation/native';
import LcHeader from '@components/Header/LcHeader';
import { stylesLayout } from './Styles';
import { LC_MENU_OPTIONS } from '@constants/PROFILE_MENU_OPTIONS';
import { useAuth } from '@contexts/AuthContext';
import { useLanguage } from '@contexts/LanguageContext';
import { useDocumentTitle } from '@hooks';
import logger from '@utils/logger';
import { useGlobal } from '@contexts/GlobalContext';
import { Modal, HStack, Text, Button, ButtonText } from '@ui';
import { useOfflineSync } from '@contexts/OfflineSyncContext';

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
  const {refComponent} = useGlobal()
  const { pendingBreakdown } = useOfflineSync();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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
      if (pendingBreakdown.total > 0) {
        setShowLogoutConfirm(true);
      } else {
        logout();
      }
      return;
    }

    // Find the menu item in LC_MENU_OPTIONS and use its route for navigation
    const menuItem = LC_MENU_OPTIONS.find(item => item.key === key);
    if (menuItem?.route) {
      navigation.navigate(menuItem.route as never);
    }
  };
  
  return (<>

      {/* 
        Header with LC-specific configuration
        - userMenuPosition="left": Places profile menu on left side (LC layout)
        - hamburgerMenuItems: Passes all LC menu items including Home
        - onHamburgerMenuSelect: Handles menu item selection (navigation/logout)
        - showLanguage/showTheme: Disabled for LC layout
      */}
      <LcHeader
        title={title}
        subTitle={navbarData?.subtitle}
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
      {refComponent?.bottom || ""}

      <Modal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        headerTitle={t('offlineSync.logoutConfirmTitle')}
        size="sm"
      >
        <Text fontSize="$sm" color="$textSecondary" mb="$4">
          {t('offlineSync.logoutConfirmMessage', { count: pendingBreakdown.total })}
        </Text>
        <HStack space="md" justifyContent="flex-end">
          <Button variant="outline" size="sm" onPress={() => setShowLogoutConfirm(false)}>
            <ButtonText>{t('common.cancel')}</ButtonText>
          </Button>
          <Button variant="solid" size="sm" onPress={() => { setShowLogoutConfirm(false); logout(); }}>
            <ButtonText>{t('offlineSync.logoutAnyway')}</ButtonText>
          </Button>
        </HStack>
      </Modal>
    </>
  );
};

export default Layout;
