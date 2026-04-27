/**
 * IDP / Project / Bundle Task Management App
 * Features offline support with sync capabilities
 */

import React from 'react';
import './src/config/i18n'; // Initialize i18n
import { GlobalProvider, useGlobal } from './src/contexts/GlobalContext';
import { LanguageProvider } from './src/contexts/LanguageContext';
import AppNavigator from './src/navigation/AppNavigator';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { theme } from './src/config/theme';
import { AuthProvider } from './src/contexts/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

function App() {
  const { colorMode } = useGlobal();

  return (
    <SafeAreaProvider>
      <GluestackUIProvider config={theme} colorMode={colorMode}>
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </GluestackUIProvider>
    </SafeAreaProvider>
  );
}

const RootApp = () => {
  return (
    <GlobalProvider>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </GlobalProvider>
  );
};

export default RootApp;
