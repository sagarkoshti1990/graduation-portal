/**
 * IDP / Project / Bundle Task Management App
 * Features offline support with sync capabilities
 */

import React from 'react';
import './src/config/i18n'; // Initialize i18n
import { LanguageProvider } from './src/contexts/LanguageContext';
import AppNavigator from './src/navigation/AppNavigator';
import { GluestackUIProvider } from '@gluestack-ui/themed';

const config = {
  theme: {
    colors: {
      primary: '#1976d2',
      secondary: '#9c27b0',
      background: '#f5f5f5',
      surface: '#fff',
      error: '#d32f2f',
      text: '#212121',
      onPrimary: '#fff',
      onSecondary: '#fff',
      onBackground: '#212121',
      onSurface: '#212121',
      onError: '#fff',
    },
    fonts: {
      body: 'System',
      heading: 'System',
      monospace: 'monospace',
    },
    fontSizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 20,
      xl: 24,
      '2xl': 32,
    },
    radii: {
      sm: 4,
      md: 8,
      lg: 16,
      xl: 24,
      full: 9999,
    },
    spacing: {
      none: 0,
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
      '2xl': 40,
    },
  },
};

function App() {
  return (
    <GluestackUIProvider config={config}>
      <LanguageProvider>
        <AppNavigator />
      </LanguageProvider>
    </GluestackUIProvider>
  );
}

export default App;
