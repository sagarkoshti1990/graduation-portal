import React, { useMemo } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useLanguage } from '@contexts/LanguageContext';
import { useAuth } from '@contexts/AuthContext';
import LayoutWrapper from '@layout/LayoutWrapper';

const Stack = createStackNavigator();

// Component wrapper that applies layout based on role
// This component is defined outside to avoid recreation on every render
const createScreenWithLayout = (
  ScreenComponent: React.ComponentType<any>,
  pageName: string,
) => {
  const ScreenWithLayout: React.FC<any> = props => {
    const { user } = useAuth();
    const { t } = useLanguage();

    // Determine layout props based on screen name and role
    const layoutProps: Record<string, any> = {};

    // For LC role screens, pass title if needed
    if (user?.role?.toLowerCase() === 'lc' && pageName === 'home') {
      layoutProps.title = t('settings.selectLanguage');
    }

    if (pageName === 'template') {
      layoutProps.disableScroll = true;
    }

    return (
      <LayoutWrapper layoutProps={layoutProps}>
        <ScreenComponent {...props} />
      </LayoutWrapper>
    );
  };

  ScreenWithLayout.displayName = `ScreenWithLayout(${pageName})`;
  return ScreenWithLayout;
};

const AccessBaseNavigator: React.FC<{
  accessPages: {
    name: string;
    path?: string;
    component: React.ComponentType<any>;
  }[];
}> = ({ accessPages }) => {
  const { t } = useLanguage();

  // Memoize wrapped components to prevent recreation on every render
  const wrappedPages = useMemo(
    () =>
      accessPages.map(page => ({
        ...page,
        wrappedComponent: createScreenWithLayout(page.component, page.name),
      })),
    [accessPages],
  );

  return (
    <Stack.Navigator
      initialRouteName={accessPages[0].name}
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#FFFFFF' },
      }}
    >
      {wrappedPages.map(page => (
        <Stack.Screen
          key={page.name}
          name={page.name}
          component={page.wrappedComponent}
          options={{
            title: t(`admin.${page.name}`),
          }}
        />
      ))}
    </Stack.Navigator>
  );
};

export default AccessBaseNavigator;
