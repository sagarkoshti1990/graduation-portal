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

// Title key mapping for proper translation namespacing
// Maps page names to their correct translation keys based on role context
const PAGE_TITLE_MAP: Record<string, string> = {
  // Admin/Supervisor pages (admin namespace)
  'user-management': 'admin.pageTitle.user-management',
  'admin-dashboard': 'admin.pageTitle.admin-dashboard',
  'template-management': 'admin.pageTitle.template-management',
  'csv-templates': 'admin.pageTitle.csv-templates',
  'ProfilePermissions': 'admin.pageTitle.ProfilePermissions',
  'PasswordPolicy': 'admin.pageTitle.PasswordPolicy',
  'audit-log': 'admin.pageTitle.audit-log',
  'assign-users': 'admin.pageTitle.assign-users',
  
  // LC pages (lc namespace or specific namespaces)
  'welcome': 'admin.pageTitle.welcome', // LC welcome page
  'select-language': 'admin.pageTitle.select-language', // LC language selection
  'dashboard': 'admin.pageTitle.dashboard', // LC dashboard
  'participants': 'admin.pageTitle.participants', // LC participants list
  'participant-detail': 'admin.pageTitle.participant-detail',
  'log-visit': 'admin.pageTitle.log-visit',
  'check-ins-list': 'admin.pageTitle.check-ins-list',
  'observation': 'admin.pageTitle.observation',
  'template': 'template.pageTitle', // Template has its own namespace
  'project': 'admin.pageTitle.project', // Project player
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

  // Helper function to get the title for a page with proper fallback
  const getPageTitle = (pageName: string): string => {
    // Get the mapped translation key or construct a default one
    const translationKey = PAGE_TITLE_MAP[pageName] || `admin.pageTitle.${pageName}`;
    
    // Try to get the translation with the mapped key
    const translatedTitle = t(translationKey, { defaultValue: '' });
    
    // If translation exists, return it
    if (translatedTitle) {
      return translatedTitle;
    }
    
    // Fallback: Format the page name nicely (convert kebab-case to Title Case)
    return pageName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

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
            title: getPageTitle(page.name),
          }}
        />
      ))}
    </Stack.Navigator>
  );
};

export default AccessBaseNavigator;
