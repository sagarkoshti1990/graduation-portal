import React, { useState } from 'react';
import { ScrollView, useColorMode, VStack } from '@gluestack-ui/themed';
import { useNavigation } from '@react-navigation/native';
import ParticipantHeader from '@components/Header/ParticipantHeader';
import { PARTICIPANT_MENU_OPTIONS } from '@constants/PROFILE_MENU_OPTIONS';
import { useAuth } from '@contexts/AuthContext';
import { useLanguage } from '@contexts/LanguageContext';
import { useOfflineSync } from '@contexts/OfflineSyncContext';
import { Modal, HStack, Text, Button, ButtonText } from '@ui';

import ParticipantProfileModal from '@components/Header/ParticipantProfileModal';

const stylesLayout = {
  mainContent: {
    flex: 1,
    contentContainerStyle: { flexGrow: 1 },
  },
} as const;

interface LayoutProps {
  title?: string;
  children: React.ReactNode;
  disableScroll?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ title = '', children, disableScroll }) => {
  const mode = useColorMode();
  const isDark = mode === 'dark';
  const { logout, navbarData } = useAuth();
  const { t } = useLanguage();
  const { pendingBreakdown } = useOfflineSync();
  const navigation = useNavigation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleAvatarPress = () => {
    // @ts-ignore
    navigation.navigate('participant-portal');
  };

  const handleMenuSelect = (key: string | undefined) => {
    if (key === 'myProfile') {
      setIsProfileOpen(true);
    } else if (key === 'logout') {
      if (pendingBreakdown.total > 0) {
        setShowLogoutConfirm(true);
      } else {
        logout();
      }
    }
  };

  return (
    <>
      <ParticipantHeader
        title={title}
        subTitle={navbarData?.subtitle}
        hamburgerMenuItems={PARTICIPANT_MENU_OPTIONS}
        onHamburgerMenuSelect={handleMenuSelect}
        onAvatarPress={handleAvatarPress}
      />

      <ParticipantProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      {disableScroll ? (
        <VStack flex={1} bg={isDark ? '$backgroundDark950' : '$accent100'}>
          {children}
        </VStack>
      ) : (
        <ScrollView
          {...stylesLayout.mainContent}
          bg={isDark ? '$backgroundDark950' : '$accent100'}
        >
          {children}
        </ScrollView>
      )}

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
