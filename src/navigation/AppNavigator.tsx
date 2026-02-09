import React, {
  useState,
  useEffect,
  Suspense,
  useMemo,
  Component,
  ErrorInfo,
  ReactNode,
} from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { I18nManager } from 'react-native';
import { useLanguage } from '@contexts/LanguageContext';
import { useAuth } from '@contexts/AuthContext';
import { Spinner } from '@ui';
import logger from '@utils/logger';
import { isWeb, usePlatform } from '@utils/platform';
import AccessBaseNavigator from './navigators/AccessBaseNavigator';
import HomeScreen from '../screens/Home';
import UserManagementScreen from '../screens/UserManagement';
import LoginScreen from '../screens/Auth/LoginScreen';
import SelectLanguageScreen from '../screens/Language/Index';
import WelcomePage from '../screens/Welcome/index';
import ParticipantDetail from '../screens/ParticipantDetail';
import ParticipantsList from '../screens/ParticipantsList/index';
import ProjectPlayer from '../screens/ProjectPlayer';
import LogVisit from '../screens/ParticipantDetail/LogVisit';
import Observation from '../screens/Observation/Observation';
import TemplateScreen from '../screens/Template';
import CheckInsList from '../screens/ParticipantDetail/Check-ins-list';
import TemplateManagementScreen from '../screens/TemplateManagement';
import CsvImportTemplates from '../screens/CsvImportTemplates';
import PasswordPolicy from '../screens/PasswordPolicy';
import AuditLogScreen from '../screens/AuditLog';
import AssignUsersScreen from '../screens/AssignUsers';
import AdminDashboard from '../screens/AdminDashboard';
import ProfilePermissions from '../screens/ProfilePermissions';
// Error Boundary for Navigation
class NavigationErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('Navigation error:', error, errorInfo);
    // Reset error state after a short delay to allow recovery
    setTimeout(() => {
      this.setState({ hasError: false });
    }, 1000);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || <Spinner height={isWeb ? '$100vh' : '$full'} size="large" color="$primary500" />
      );
    }
    return this.props.children;
  }
}

const Stack = createStackNavigator();

// Shared function to generate accessPages based on user role
const getAccessPages = (
  userRole?: string,
): { name: string; path?: string; component: React.ComponentType<any> }[] => {
  const role = userRole?.toLowerCase();

  switch (role) {
    case 'admin':
      return [
        { name: 'home', path: '/', component: HomeScreen },
        { name: 'admin-dashboard', path: '/admin-dashboard', component: AdminDashboard },
        {
          name: 'user-management',
          path: '/user-management',
          component: UserManagementScreen,
        },
        {
          name: 'template-management',
          path: '/template-managemnt',
          component: TemplateManagementScreen,
        },
        {
          name: 'csv-templates',
          path: '/csv-templates',
          component: CsvImportTemplates,
        },
       {
          name: 'ProfilePermissions',
          path: '/profile-permissions',
          component: ProfilePermissions,
        },
        {
          name: 'PasswordPolicy',
          path: '/password-policy',
          component: PasswordPolicy,
        },
        {
          name: 'audit-log',
          path: '/audit-log',
          component: AuditLogScreen,
        },
        {
          name: 'assign-users',
          path: '/assign-users',
          component: AssignUsersScreen,
        },
      ];
    case 'supervisor':
      return [{ name: 'home', path: '/home', component: HomeScreen }];
    case 'lc':
      return [
        { name: 'welcome', component: WelcomePage },
        { name: 'select-language', component: SelectLanguageScreen },
        { name: 'dashboard', component: HomeScreen },
        { name: 'participant-detail', path: '/participants/:id', component: ParticipantDetail },
        { name: 'log-visit', path: '/participants/:id/log-visit', component: LogVisit },
        { name: 'check-ins-list', path: '/participants/:id/check-ins-list', component: CheckInsList },
        { name: 'observation', path: '/participants/:id/observation/:solutionId/:submissionNumber?', component: Observation },
        { name: 'template', path: '/participants/:id/template', component: TemplateScreen },
        { name: 'participants', component: ParticipantsList },
        { name: 'project', path: '/project', component: ProjectPlayer },
      ];
    default:
      return []; // Always return an array even if empty
  }
};

// Function to generate linking configuration based on accessPages
const getLinkingConfig = (
  accessPages: {
    name: string;
    path?: string;
    component: React.ComponentType<any>;
  }[],
) => {
  // Define the base screens that are always available in linking
  const screens: Record<string, any> = {
    login: 'login',
    main: {
      path: '/',
      screens: {},
    },
  };
  // Dynamically generate nested routes from accessPages array
  if (accessPages.length > 0) {
    const mainScreens: Record<string, string> = {};
    accessPages.forEach(page => {
      // Prefer explicit 'path' property for each page, else fallback to name
      const screenPath = page.path
        ? // Remove leading slash for react-navigation config consistency
        page.path.startsWith('/')
          ? page.path.slice(1)
          : page.path
        : page.name;

      // Special handling for LC role:
      // If there are multiple pages (e.g., 'home' and 'home1') and this is 'home', map it to select-language
      if (
        page.name === 'home' &&
        accessPages.length > 1 &&
        accessPages.some(p => p.name === 'home1')
      ) {
        mainScreens[page.name] = 'select-language';
      } else {
        // Handle dynamic routes with parameters (e.g., /participants/:id)
        // React Navigation will automatically extract parameters from the path
        mainScreens[page.name] = screenPath;
      }
    });
    screens.main.screens = mainScreens;
  }

  return {
    prefixes: [],
    config: {
      screens,
    },
  };
};

// Component to render role-based navigator
const RoleBasedNavigator: React.FC = () => {
  const { user } = useAuth();
  const [accessPages, setAccessPages] = useState<
    { name: string; path?: string; component: React.ComponentType<any> }[]
  >([]);

  useEffect(() => {
    // Use shared function to get accessPages based on user role
    setAccessPages(getAccessPages(user?.role));
  }, [user]);

  if (accessPages.length === 0) {
    return <LoginScreen />;
  }

  return (
    <Suspense fallback={<Spinner height={isWeb ? '$100vh' : '$full'} size="large" color="$primary500" />}>
      <AccessBaseNavigator accessPages={accessPages} />
    </Suspense>
  );
};

const AppNavigator: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const { isLoggedIn, loading, user } = useAuth();
  const { isWeb } = usePlatform();
  // Generate accessPages based on user role
  const accessPages = useMemo(() => getAccessPages(user?.role), [user?.role]);

  // Generate dynamic linking configuration based on accessPages
  // Memoize to prevent unnecessary recalculations
  // Only generate linking when accessPages is stable and not empty
  const linking = useMemo(() => {
    if (accessPages.length === 0) {
      // Return minimal config when no access pages (e.g., during logout)
      return {
        prefixes: [],
        config: {
          screens: {
            login: 'login',
          },
        },
      };
    }
    return getLinkingConfig(accessPages);
  }, [accessPages]);

  // Update I18nManager when RTL changes (for React Native)
  useEffect(() => {
    // Note: On React Native (not web), changing RTL requires app restart
    // This ensures the correct direction is applied
    if (I18nManager.isRTL !== isRTL && !isWeb) {
      logger.log(
        'RTL direction changed, app may need restart on native platforms',
      );
    }
  }, [isRTL, isWeb]);

  // Log current URL on web for debugging
  useEffect(() => {
    if (isWeb) {
      logger.log('Current URL:', window.location.href);
      logger.log('Pathname:', window.location.pathname);
    }
  }, [isWeb]);

  // Create a stable key for NavigationContainer to prevent state issues
  // MUST be called before any conditional returns (Rules of Hooks)
  const navigationKey = useMemo(() => {
    return isLoggedIn
      ? `nav-${user?.role || 'guest'}-${accessPages.length}`
      : 'nav-login';
  }, [isLoggedIn, user?.role, accessPages.length]);

  if (loading) {
    return <Spinner height={isWeb ? '$100vh' : '$full'} size="large" color="$primary500" />;
  }

  return (
    <NavigationErrorBoundary>
      <NavigationContainer
        key={navigationKey}
        linking={linking}
        fallback={<Spinner height={isWeb ? '$100vh' : '$full'} size="large" color="$primary500" />}
        onReady={() => {
          if (isWeb) {
            logger.log('Navigation container ready');
          }
        }}
        onStateChange={state => {
          if (isWeb && state) {
            logger.log('Navigation state changed:', state);
          }
        }}
      >
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            cardStyle: isWeb
              ? ({
                width: '100%',
                minHeight: '100vh',
                height: 'auto',
              } as any)
              : ({ width: '100%' } as any),
          }}
        >
          {!isLoggedIn ? (
            // Show login screen when not logged in
            <Stack.Screen
              name="login"
              component={LoginScreen}
              options={{
                title: t('login.logIn'),
              }}
            />
          ) : (
            // Show role-based navigator when logged in
            <Stack.Screen
              name="main"
              component={RoleBasedNavigator}
              options={{
                title: t('navigation.menu'),
              }}
            />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </NavigationErrorBoundary>
  );
};
export default AppNavigator;
