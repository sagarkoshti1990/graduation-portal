import React, {
  useEffect,
  Suspense,
  useMemo,
  lazy,
  Component,
  ErrorInfo,
  ReactNode,
} from 'react';
import { Spinner } from '@gluestack-ui/themed';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { I18nManager } from 'react-native';
import { useLanguage } from '@contexts/LanguageContext';
import { useAuth } from '@contexts/AuthContext';
import logger from '@utils/logger';
import { isWeb as isWebPlatform, usePlatform } from '@utils/platform';
import { navigationRef, resetToScreen } from '@utils/navigationRef';
import AccessBaseNavigator from './navigators/AccessBaseNavigator';

type ScreenComponent = React.ComponentType<any>;
type AccessPage = { name: string; path?: string; component: ScreenComponent };

const lazyScreen = (
  loader: () => Promise<{ default: ScreenComponent }>,
): ScreenComponent => lazy(loader) as unknown as ScreenComponent;

const HomeScreen = lazyScreen(() => import('../screens/Home'));
const UserManagementScreen = lazyScreen(() => import('../screens/UserManagement'));
const SelectLanguageScreen = lazyScreen(() => import('../screens/Language/Index'));
const WelcomePage = lazyScreen(() => import('../screens/Welcome'));
const LoginScreen = lazyScreen(() => import('../screens/Auth/LoginScreen'));
const LogoutScreen = lazyScreen(() => import('../screens/Auth/LogoutScreen'));
const ParticipantDetail = lazyScreen(() => import('../screens/ParticipantDetail'));
const ParticipantsList = lazyScreen(() => import('../screens/ParticipantsList'));
const ProjectPlayer = lazyScreen(() => import('../screens/ProjectPlayer'));
const LogVisit = lazyScreen(() => import('../screens/ParticipantDetail/LogVisit'));
const Observation = lazyScreen(() => import('../screens/Observation/Observation'));
const TemplateScreen = lazyScreen(() => import('../screens/Template'));
const CheckInsList = lazyScreen(() => import('../screens/ParticipantDetail/Check-ins-list'));
const TemplateManagementScreen = lazyScreen(() => import('../screens/TemplateManagement'));
const CsvImportTemplates = lazyScreen(() => import('../screens/CsvImportTemplates'));
const PasswordPolicy = lazyScreen(() => import('../screens/PasswordPolicy'));
const AuditLogScreen = lazyScreen(() => import('../screens/AuditLog'));
const AssignUsersScreen = lazyScreen(() => import('../screens/AssignUsers'));
const AdminDashboard = lazyScreen(() => import('../screens/AdminDashboard'));
const ProfilePermissions = lazyScreen(() => import('../screens/ProfilePermissions'));

const spinnerHeight = (isWebPlatform ? '$100vh' : '$full') as any;
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
        this.props.fallback || <Spinner height={spinnerHeight} size="large" color="$primary500" />
      );
    }
    return this.props.children;
  }
}

const Stack = createStackNavigator();

// Shared function to generate accessPages based on user role
const getAccessPages = (
  userRole?: string,
): AccessPage[] => {
  const role = userRole?.toLowerCase();

  switch (role) {
    case 'admin':
      return [
        // { name: 'home', path: '/', component: HomeScreen },
        {
          name: 'user-management',
          path: '/',
          component: UserManagementScreen,
        },
        { name: 'admin-dashboard', path: '/admin-dashboard', component: AdminDashboard },
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
      return [
        {
          name: 'user-management',
          path: '/',
          component: UserManagementScreen,
        },
        { name: 'admin-dashboard', path: '/admin-dashboard', component: AdminDashboard },
        {
          name: 'assign-users',
          path: '/assign-users',
          component: AssignUsersScreen,
        },
        {
          name: 'csv-templates',
          path: '/csv-templates',
          component: CsvImportTemplates,
        },
        {
          name: 'PasswordPolicy',
          path: '/password-policy',
          component: PasswordPolicy,
        },
        {
          name: 'ProfilePermissions',
          path: '/profile-permissions',
          component: ProfilePermissions,
        },
      ];
    case 'lc':
      return [
        { name: 'welcome', component: WelcomePage },
        { name: 'select-language', component: SelectLanguageScreen },
        { name: 'dashboard', component: HomeScreen },
        { name: 'participant-detail', path: '/participants/:id', component: ParticipantDetail },
        { name: 'log-visit', path: '/participants/:id/log-visit', component: LogVisit },
        { name: 'check-ins-list', path: '/participants/:id/check-ins-list/:solutionId?', component: CheckInsList },
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
  accessPages: AccessPage[],
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
  const accessPages = useMemo(() => getAccessPages(user?.role), [user?.role]);

  if (accessPages.length === 0) {
    return (
      <Suspense fallback={<Spinner height={spinnerHeight} size="large" color="$primary500" />}>
        <LoginScreen />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<Spinner height={spinnerHeight} size="large" color="$primary500" />}>
      <AccessBaseNavigator accessPages={accessPages} />
    </Suspense>
  );
};

const AppNavigator: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const { isLoggedIn, loading, user } = useAuth();
  const { isWeb: isWebClient } = usePlatform();
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
            logout: 'logout',
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
    if (I18nManager.isRTL !== isRTL && !isWebClient) {
      logger.log(
        'RTL direction changed, app may need restart on native platforms',
      );
    }
  }, [isRTL, isWebClient]);

  // Log current URL on web for debugging
  useEffect(() => {
    if (isWebClient) {
      logger.log('Current URL:', window.location.href);
      logger.log('Pathname:', window.location.pathname);
    }
  }, [isWebClient]);

  // Navigate to main screen when user logs in successfully
  useEffect(() => {
    if (isLoggedIn && accessPages.length > 0 && navigationRef.isReady()) {
      // Check current route to avoid unnecessary navigation
      const currentRoute = navigationRef.getCurrentRoute();
      if (currentRoute?.name !== 'main') {
        // Small delay to ensure navigation stack is updated after navigationKey change
        const timer = setTimeout(() => {
          try {
            resetToScreen('main');
            logger.info('Navigated to main screen after successful login');
          } catch (error) {
            logger.warn('Error navigating to main after login:', error);
          }
        }, 200);
        return () => clearTimeout(timer);
      }
    }
  }, [isLoggedIn, accessPages.length]);


  // Create a stable key for NavigationContainer to prevent state issues
  // MUST be called before any conditional returns (Rules of Hooks)
  const navigationKey = useMemo(() => {
    return isLoggedIn
      ? `nav-${user?.role || 'guest'}-${accessPages.length}`
      : 'nav-login';
  }, [isLoggedIn, user?.role, accessPages.length]);

  if (loading) {
    return <Spinner height={spinnerHeight} size="large" color="$primary500" />;
  }

  return (
    <NavigationErrorBoundary>
      <NavigationContainer
        ref={navigationRef}
        key={navigationKey}
        linking={linking}
        fallback={<Spinner height={spinnerHeight} size="large" color="$primary500" />}
        onReady={() => {
          if (isWebClient) {
            logger.log('Navigation container ready');
          }
        }}
        onStateChange={state => {
          if (isWebClient && state) {
            logger.log('Navigation state changed:', state);
          }
        }}
      >
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            cardStyle: isWebClient
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
          {/* Logout screen - always available for navigation from API interceptor */}
          <Stack.Screen
            name="logout"
            component={LogoutScreen}
            options={{
              title: t('logout.sessionExpired') || 'Session expired.',
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </NavigationErrorBoundary>
  );
};
export default AppNavigator;
