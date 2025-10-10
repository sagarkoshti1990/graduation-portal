import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { I18nManager } from 'react-native';
import ProjectListScreen from '../screens/ProjectListScreen';
import ProjectDetailScreen from '../screens/ProjectDetailScreen';
import UploadExampleScreen from '../screens/UploadExampleScreen';
import SyncStatusScreen from '../screens/SyncStatusScreen';
import WebComponentScreen from '../screens/WebComponentScreen';
import { useLanguage } from '../contexts/LanguageContext';

const Stack = createStackNavigator();

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

  return (
    <NavigationContainer>
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
          component={UploadExampleScreen}
          options={{
            title: t('navigation.fileUpload'),
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
