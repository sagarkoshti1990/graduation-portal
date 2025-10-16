import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import {
  I18nManager,
  Platform,
  View,
  Text,
  ActivityIndicator,
} from 'react-native';
import ProjectListScreen from '../screens/ProjectListScreen';
import ProjectDetailScreen from '../screens/ProjectDetailScreen';
import SyncStatusScreen from '../screens/SyncStatusScreen';
import WebComponentScreen from '../screens/WebComponentScreen';
import { useLanguage } from '../contexts/LanguageContext';
// import '../styles/style.css';
import FileUploadExample from '../examples/FileUploadExample';
import GluestackUIExample from '../examples/GluestackUIExample';
import UploadExampleScreen from '../screens/UploadExampleScreen';

const Stack = createStackNavigator();

// Linking configuration for web URL routing
const linking = {
  prefixes: ['http://localhost:3000', 'https://yourapp.com'],
  config: {
    screens: {
      ProjectList: '',
      ProjectDetail: 'project/:id',
      UploadExample: 'upload',
      UploadExampleScreen: 'upload-example',
      GluestackUIExample: 'gluestack-ui',
      SyncStatus: 'sync',
      WebComponentDemo: 'demo',
    },
  },
};

const AppNavigator: React.FC = () => {
  const { t, isRTL } = useLanguage();

  // Update I18nManager when RTL changes (for React Native)
  useEffect(() => {
    // Note: On React Native (not web), changing RTL requires app restart
    // This ensures the correct direction is applied
    if (I18nManager.isRTL !== isRTL) {
      console.log(
        'RTL direction changed, app may need restart on native platforms',
      );
    }
  }, [isRTL]);

  // Log current URL on web for debugging
  useEffect(() => {
    if (Platform.OS === 'web') {
      console.log('Current URL:', window.location.href);
      console.log('Pathname:', window.location.pathname);
    }
  }, []);

  return (
    <NavigationContainer
      linking={linking}
      fallback={
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <ActivityIndicator size="large" color="#0000ff" />
          <Text>Loading...</Text>
        </View>
      }
    >
      <Stack.Navigator
        initialRouteName="ProjectList"
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#FFFFFF' },
        }}
      >
        <Stack.Screen
          name="ProjectList"
          component={ProjectListScreen}
          options={{
            title: t('navigation.myProjects'),
          }}
        />
        <Stack.Screen
          name="ProjectDetail"
          component={ProjectDetailScreen}
          options={{
            title: t('navigation.projectDetails'),
          }}
        />
        <Stack.Screen
          name="UploadExample"
          component={FileUploadExample}
          options={{
            title: t('navigation.fileUpload'),
          }}
        />
        <Stack.Screen
          name="UploadExampleScreen"
          component={UploadExampleScreen}
          options={{
            title: t('navigation.uploadExample'),
          }}
        />
        <Stack.Screen
          name="GluestackUIExample"
          component={GluestackUIExample}
          options={{
            title: t('navigation.gluestackUI'),
          }}
        />
        <Stack.Screen
          name="SyncStatus"
          component={SyncStatusScreen}
          options={{
            title: t('navigation.syncStatus'),
          }}
        />
        <Stack.Screen
          name="WebComponentDemo"
          component={WebComponentScreen}
          options={{
            title: t('navigation.webComponentDemo'),
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
