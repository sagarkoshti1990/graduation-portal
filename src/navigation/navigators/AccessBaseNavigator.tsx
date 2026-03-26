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
    const layoutProps: Record<string, any> = {
      pageName, // Pass page name for title setting
    };

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

function titleNamespaceForRole(role?: string): 'admin' | 'lc' {
  const r = role?.toLowerCase();
  if (r === 'admin' || r === 'supervisor') {
    return 'admin';
  }
  return 'lc';
}

const AccessBaseNavigator: React.FC<{
  accessPages: {
    name: string;
    path?: string;
    component: React.ComponentType<any>;
    /** i18n key prefix for page titles, e.g. admin.pageTitle vs lc.pageTitle */
    namespace?: string;
  }[];
}> = ({ accessPages }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const defaultTitleNamespace = titleNamespaceForRole(user?.role);

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
            title: t(
              `${page.namespace ?? defaultTitleNamespace}.pageTitle.${page.name}`,
            ),
          }}
        />
      ))}
    </Stack.Navigator>
  );
};

export default AccessBaseNavigator;
