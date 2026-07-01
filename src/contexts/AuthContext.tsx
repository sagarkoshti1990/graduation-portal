import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useMemo,
} from 'react';
import logger from '@utils/logger';
import { login as loginService } from '../services/authenticationService';
import offlineStorage from '../services/offlineStorage';
import { STORAGE_KEYS } from '@constants/STORAGE_KEYS';
import { getToken, removeToken } from '../services/api';
import { ADMIN_ROLES, SUPERVISOR_ROLES, LC_ROLES } from '@constants/ROLES';
import { useLanguage } from './LanguageContext';
// import { setupTabCloseHandler } from '@utils/tabCloseHandler';

export type UserRole = 'Admin' | 'Supervisor' | 'LC';

export interface User {
  id: string;
  email: string;
  name: string;
  role?: UserRole;
  languages?: string[] | null;
  [key: string]: any; // Allow additional user properties from API
}

interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  login: (
    email: string,
    password: string,
    isAdmin?: boolean,
    rememberMe?: boolean,
  ) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  setIsLoggedIn: (value: boolean) => void;
  loading: boolean;
  navbarData: any;
  setNavbarData: (data: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Determines user role based on organizations and roles.
 * Checks admin roles first (priority), then supervisor roles, then LC roles.
 * Throws error if user doesn't have any authorized role.
 * @param userData - User data from API response
 * @returns UserRole based on role priority (Admin > Supervisor > LC)
 * @throws Error if user doesn't have any authorized role
 */
const determineUserRole = (
  userData: any,
  unauthorizedMessage: string,
): UserRole => {
  // Check for admin roles first (priority) - only 'admin', not 'tenant_admin'
  const adminOrganizations = userData.organizations.filter((org: any) => {
    if (!org?.roles || !Array.isArray(org.roles)) {
      return false;
    }
    return org.roles.some((role: any) => ADMIN_ROLES.includes(role?.title));
  });

  if (adminOrganizations.length > 0) {
    logger.info('User has admin role based on organizations');
    return 'Admin';
  }

  // Check for supervisor roles (tenant_admin, supervisor)
  const supervisorOrganizations = userData.organizations.filter((org: any) => {
    if (!org?.roles || !Array.isArray(org.roles)) {
      return false;
    }
    return org.roles.some((role: any) => SUPERVISOR_ROLES.includes(role?.title));
  });

  if (supervisorOrganizations.length > 0) {
    logger.info('User has supervisor role based on organizations');
    return 'Supervisor';
  }

  // Check for LC roles
  const lcOrganizations = userData.organizations.filter((org: any) => {
    if (!org?.roles || !Array.isArray(org.roles)) {
      return false;
    }
    return org.roles.some((role: any) => LC_ROLES.includes(role?.title));
  });

  if (lcOrganizations.length > 0) {
    logger.info('User has LC role based on organizations');
    return 'LC';
  }

  // If no matching roles found in organizations, throw unauthorized error
  // Note: Error message will be translated in the login function
  throw new Error(unauthorizedMessage);
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [navbarData, setNavbarData] = useState<any>(null);

  useEffect(() => {
    // Setup tab close handler for web platform (config-driven)
    // const cleanupTabCloseHandler = setupTabCloseHandler();

    const loadUser = async () => {
      try {
        // Check for both user data and token
        // Both must exist for user to be considered logged in
        const [storedUser, token, rememberMe] = await Promise.all([
          offlineStorage.read<User>(STORAGE_KEYS.AUTH_USER),
          getToken(),
          offlineStorage.read<boolean>(STORAGE_KEYS.AUTH_REMEMBER_ME),
        ]);

        // Validate that user object has required fields and token exists
        const isValidUser =
          storedUser &&
          typeof storedUser === 'object' &&
          Object.keys(storedUser).length > 0 &&
          (storedUser.id || storedUser.email); // At least one identifier should exist

        // Only set logged in if both user and token exist and user is valid
        if (isValidUser && token) {
          // Check if rememberMe is false - if so, we should clear on tab close
          // But for now, just log it
          if (rememberMe === false) {
            logger.info(
              'User logged in with Remember Me = false. Auth data will be cleared on tab close.',
            );
          }
          setUser(storedUser);
          setIsLoggedIn(true);
          logger.info(
            'User session restored from storage:',
            storedUser.email || storedUser.id,
          );
        } else {
          // If either is missing or invalid, clear everything to ensure clean state
          if (storedUser && !token) {
            logger.warn('User data found but no token - clearing user data');
          } else if (token && !isValidUser) {
            logger.warn(
              'Token found but invalid user data - clearing auth data',
            );
          }

          // Clear all auth data
          await offlineStorage.remove(STORAGE_KEYS.AUTH_USER);
          await offlineStorage.remove(STORAGE_KEYS.AUTH_REFRESH_TOKEN);
          await offlineStorage.remove(STORAGE_KEYS.AUTH_REMEMBER_ME);
          if (token) {
            await removeToken();
          }

          setUser(null);
          setIsLoggedIn(false);
        }
      } catch (error) {
        logger.error('Error loading user from storage:', error);
        // On error, ensure clean state
        setUser(null);
        setIsLoggedIn(false);
      } finally {
        setLoading(false);
      }
    };
    
    loadUser();

    // Cleanup on unmount
    return () => {
      // cleanupTabCloseHandler();
    };
  }, []);

  const login = async (
    email: string,
    password: string,
    isAdmin: boolean = false,
    rememberMe: boolean = false,
  ): Promise<{ success: boolean; message: string }> => {
    try {
      if (!email || !password) {
        const message = isAdmin
          ? t('auth.loginAttemptedEmptyCredentialsAdmin')
          : t('auth.loginAttemptedEmptyCredentials');
        logger.warn(message);
        return { success: false, message };
      }

      // Call the authentication service with the isAdmin flag and rememberMe
      const loginResponse = await loginService(email, password, isAdmin, rememberMe);
      // Check if login response has user data
      if (loginResponse.result?.user) {
        const userData = loginResponse.result.user;
        // Determine user role (admin priority), throws if unauthorized
        let determinedRole: UserRole;
        try {
          determinedRole = determineUserRole(
            userData,
            t('auth.roleNotAuthorized'),
          );
        } catch (roleError: any) {
          // Check if error message matches our known unauthorized message
          const isUnauthorizedError =
            roleError.message?.includes('Unauthorized') ||
            roleError.message?.includes('not authorized');
          const message = isUnauthorizedError
            ? t('auth.roleNotAuthorized')
            : roleError.message || t('auth.roleNotAuthorized');
          logger.warn(
            `${isAdmin ? 'Admin ' : ''}User role not authorized:`,
            message,
          );
          return { success: false, message };
        }

        // Map API user data to User interface
        const mappedUser: User = {
          role: determinedRole,
          ...userData, // Include any additional properties from API
        };

        // Save the mapped user data to storage in one line
        await offlineStorage.create(STORAGE_KEYS.AUTH_USER, mappedUser);

        // Update the context state
        setUser(mappedUser);
        setIsLoggedIn(true);

        const message = isAdmin
          ? t('auth.userLoggedInSuccessfullyAdmin')
          : t('auth.userLoggedInSuccessfully');
        logger.info(message, mappedUser.email || mappedUser.id);
        return { success: true, message };
      } else {
        const message = loginResponse.message || t('auth.noUserDataInResponse');
        logger.warn(`${isAdmin ? 'Admin ' : ''}Login failed:`, message);
        return { success: false, message };
      }
    } catch (error: any) {
      const message = error?.message || t('auth.errorOccurredDuringLogin');
      logger.error(`${isAdmin ? 'Admin ' : ''}Login error:`, error);
      return { success: false, message };
    }
  };

  const logout = async () => {
    try {
      // Remove tokens
      await removeToken();

      // Remove user data from storage
      await offlineStorage.remove(STORAGE_KEYS.AUTH_USER);
      await offlineStorage.remove(STORAGE_KEYS.AUTH_REFRESH_TOKEN);
      await offlineStorage.remove(STORAGE_KEYS.AUTH_REMEMBER_ME);

      // Clear context state
      setUser(null);
      setIsLoggedIn(false);

      logger.info('User logged out successfully');
    } catch (error) {
      logger.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ isLoggedIn, user, login, logout, setIsLoggedIn, loading,navbarData, setNavbarData }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Custom hook to check if the current logged-in user is a Supervisor
 * 
 * This hook checks both:
 * 1. The mapped role from AuthContext ('Supervisor')
 * 2. The user's actual role titles from organizations ('tenant_admin' or 'supervisor')
 * 
 * @returns {boolean} - true if the user is a supervisor, false otherwise
 * 
 * @example
 * ```tsx
 * const MyComponent = () => {
 *   const isSupervisor = useIsSupervisor();
 *   
 *   if (isSupervisor) {
 *     return <SupervisorOnlyContent />;
 *   }
 *   
 *   return <RegularContent />;
 * };
 * ```
 */
export const useIsSupervisor = (): boolean => {
  const { user } = useAuth();
  const currentUserRole = user?.role;

  return useMemo(() => {
    // Check mapped role first
    if (currentUserRole === 'Supervisor' || currentUserRole?.toLowerCase() === 'supervisor') {
      return true;
    }
    
    // Also check user's actual organizations for supervisor role titles
    if (user && (user as any).organizations) {
      const organizations = (user as any).organizations;
      const hasSupervisorRole = organizations.some((org: any) => {
        if (!org?.roles || !Array.isArray(org.roles)) {
          return false;
        }
        return org.roles.some((role: any) => {
          const roleTitle = role?.title?.toLowerCase() || '';
          return roleTitle === 'admin' || roleTitle === 'tenant_admin' || roleTitle === 'supervisor';
        });
      });
      return hasSupervisorRole;
    }
    
    return false;
  }, [user, currentUserRole]);
};
