/**
 * IDP / Project / Bundle Task Management App
 * Features offline support with sync capabilities
 */

import React from 'react';
import './src/config/i18n'; // Initialize i18n
import { GlobalProvider, useGlobal } from './src/contexts/GlobalContext';
import { LanguageProvider } from './src/contexts/LanguageContext';
import AppNavigator from './src/navigation/AppNavigator';
import { GluestackUIProvider, useColorMode, useToken } from '@gluestack-ui/themed';
import { theme } from './src/config/theme';
import { AuthProvider } from './src/contexts/AuthContext';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';

const stylesLayout = {
  safeAreaView: {
    flex: 1,
  },
}

function App() {
  const mode = useColorMode();
  const isDark = mode === 'dark';
  const backgroundDark = useToken("colors", "backgroundDark950")
  const backgroundLight = useToken("colors", "primary500")

  return (
    <SafeAreaView
      style={stylesLayout.safeAreaView}
    >
      {/* Status Bar */}
      <StatusBar
        barStyle={isDark ? 'dark-content' : 'light-content'}
        backgroundColor={isDark ? backgroundDark : backgroundLight}
      />
      <AppNavigator />
    </SafeAreaView>
  );
}

const AppWrap = () => {
  const { colorMode } = useGlobal();
  return <GluestackUIProvider config={theme} colorMode={colorMode}>
    <AuthProvider>
      <SafeAreaProvider>
        <App />
      </SafeAreaProvider>
    </AuthProvider>
  </GluestackUIProvider>
}


const RootApp = () => {
  return (
    <GlobalProvider>
      <LanguageProvider>
        <AppWrap />
      </LanguageProvider>
    </GlobalProvider>
  );
};

export default RootApp;
