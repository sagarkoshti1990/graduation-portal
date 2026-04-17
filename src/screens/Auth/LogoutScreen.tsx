import React, { useEffect } from 'react';
import { ScrollView } from 'react-native';
import {
  Box,
  VStack,
  Text,
  Heading,
  Spinner,
  Image,
} from '@gluestack-ui/themed';
import { useAuth } from '@contexts/AuthContext';
import { useLanguage } from '@contexts/LanguageContext';
import { loginStyles } from './Styles';
import logoImage from '../../assets/images/logo.png';
import logger from '@utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';
import offlineStorage from '../../services/offlineStorage';
import { STORAGE_KEYS } from '@constants/STORAGE_KEYS';
import { resetToScreen } from '@utils/navigationRef';

const LogoutScreen: React.FC = () => {
  const { logout, isLoggedIn } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    const performLogout = async () => {
      try {
        logger.info('Logging out user - clearing all tokens and data');
        
        // Clear all tokens from AsyncStorage
        await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        await AsyncStorage.removeItem(STORAGE_KEYS.INTERNAL_ACCESS_TOKEN);
        
        // Clear all data from offline storage
        await offlineStorage.remove(STORAGE_KEYS.AUTH_USER);
        await offlineStorage.remove(STORAGE_KEYS.AUTH_REFRESH_TOKEN);
        await offlineStorage.remove(STORAGE_KEYS.ENTITY_TYPES);
        
        // Also call logout from AuthContext to update state
        await logout();
        
        logger.info('All tokens and data cleared successfully');
      } catch (error) {
        logger.error('Error during logout:', error);
        // Even if logout fails, try to clear state
        try {
          await logout();
        } catch (logoutError) {
          logger.error('Error calling logout:', logoutError);
        }
      }
    };

    // Perform logout immediately when component mounts
    performLogout();
  }, [logout]);

  // Navigate to login screen when logout completes (isLoggedIn becomes false)
  useEffect(() => {
    if (!isLoggedIn) {
      // Small delay to ensure navigation is ready
      const timer = setTimeout(() => {
        try {
          resetToScreen('login');
          logger.info('Redirected to login screen after logout');
        } catch (error) {
          logger.warn('Error navigating to login:', error);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoggedIn]);

  return (
    <ScrollView {...loginStyles.scrollView}>
      <Box
        {...loginStyles.container}
        $web-backgroundImage={
          'linear-gradient(148.729deg, rgba(117, 0, 63, 0.05) 0%, rgba(117, 0, 63, 0.1) 100%), linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%)'
        }
      >
        <Box {...loginStyles.box} $web-boxShadow={loginStyles.containerBoxShadow}>
          <VStack {...loginStyles.vstack}>
            {/* Logo/Brand */}
            <Image {...loginStyles.imageLogo} source={logoImage} />

            {/* Heading */}
            <Heading {...loginStyles.heading}>
              {t('logout.sessionExpired')}
            </Heading>

            {/* Message */}
            <VStack {...loginStyles.vstack2}>
              <Text {...loginStyles.text2}>
                {t('logout.sessionExpiredMessage')}
              </Text>
            </VStack>

            {/* Loading Spinner */}
            <Spinner size="large" color="$primary500" />
          </VStack>
        </Box>
      </Box>
    </ScrollView>
  );
};

export default LogoutScreen;

