/**
 * IDP / Project / Bundle Task Management App
 * Features offline support with sync capabilities
 */

import React from 'react';
import './src/config/i18n'; // Initialize i18n
import { GlobalProvider, useGlobal } from './src/contexts/GlobalContext';
import { LanguageProvider } from './src/contexts/LanguageContext';
import AppNavigator from './src/navigation/AppNavigator';
import {
  GluestackUIProvider,
  useColorMode,
  useToken,
} from '@gluestack-ui/themed';
import { theme } from './src/config/theme';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { OfflineSyncProvider } from './src/contexts/OfflineSyncContext';
import OfflineBanner from './src/components/OfflineBanner';
import DeploymentStateBanner from './src/components/DeploymentStateBanner';
import OnlineSyncBanner from './src/components/OnlineSyncBanner';
import SyncOverviewModal from './src/components/SyncOverviewModal';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Platform, StatusBar } from 'react-native';
import { OverlayProvider } from '@react-native-aria/overlays';
import { MenuProvider } from 'react-native-popup-menu';

const stylesLayout = {
  safeAreaView: {
    flex: 1,
  },
};

function App() {
  const mode = useColorMode();
  const isDark = mode === 'dark';
  const backgroundDark = useToken('colors', 'backgroundDark950');
  const backgroundLight = useToken('colors', 'primary500');
  // Only show sync-related UI when the user is authenticated
  const { isLoggedIn } = useAuth();

  return (
    <SafeAreaView style={stylesLayout.safeAreaView}>
      {/* Status Bar */}
      <StatusBar
        barStyle={isDark ? 'dark-content' : 'light-content'}
        backgroundColor={isDark ? backgroundDark : backgroundLight}
      />
      {/* Offline/sync UI is only relevant for authenticated users */}
      {isLoggedIn && <OfflineBanner />}
      <DeploymentStateBanner />
      {isLoggedIn && <OnlineSyncBanner />}
      {Platform.OS === 'web' ? (
        // Web uses Gluestack's Menu (see src/components/ui/Menu/index.web.tsx),
        // which needs no provider; react-native-popup-menu's MenuProvider is
        // native-only infrastructure for src/components/ui/Menu/index.tsx.
        <AppNavigator />
      ) : (
        <MenuProvider backHandler>
          <AppNavigator />
        </MenuProvider>
      )}
      {isLoggedIn && <SyncOverviewModal />}
    </SafeAreaView>
  );
}

const AppWrap = () => {
  const { colorMode } = useGlobal();
  return (
    <GluestackUIProvider config={theme} colorMode={colorMode}>
      <AuthProvider>
        <OfflineSyncProvider>
          <SafeAreaProvider>
            <App />
          </SafeAreaProvider>
        </OfflineSyncProvider>
      </AuthProvider>
    </GluestackUIProvider>
  );
};

const RootApp = () => {
  return (
    <GlobalProvider>
      <OverlayProvider>
        <LanguageProvider>
          <AppWrap />
        </LanguageProvider>
      </OverlayProvider>
    </GlobalProvider>
  );
};

export default RootApp;
