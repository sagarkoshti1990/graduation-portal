import { I18nManager } from 'react-native';
import i18n from '@config/i18n';
import { STORAGE_KEYS } from '@constants/STORAGE_KEYS';
import logger from '@utils/logger';
import { isWeb } from '@utils/platform';
import offlineStorage from '../services/offlineStorage';

const LANGUAGE_STORAGE_KEY = STORAGE_KEYS.LANGUAGE;

// RTL languages
export const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'];
// Check if language is RTL
export const isRTL = (languageCode: string): boolean => {
  return RTL_LANGUAGES.includes(languageCode);
};

// Get device language
const getDeviceLanguage = (): string => {
  // For React Native, you might want to use a language detector library
  // For now, we'll default to English
  return 'en';
};

// Save language preference
export const saveLanguagePreference = async (
  languageCode: string,
): Promise<void> => {
  try {
    // Validate that languageCode is a valid string
    if (!languageCode || typeof languageCode !== 'string') {
      logger.warn('Invalid language code provided:', languageCode);
      return;
    }
    await offlineStorage.create(LANGUAGE_STORAGE_KEY, languageCode);
  } catch (error) {
    logger.error('Error saving language preference:', error);
  }
};

// Status object for language change result
export interface ChangeLanguageResult {
  restartRequired: boolean;
  error?: Error;
}

// Change language and update RTL setting
export const changeLanguage = async (
  languageCode: string,
): Promise<ChangeLanguageResult> => {
  try {
    await i18n.changeLanguage(languageCode);
    await saveLanguagePreference(languageCode);

    // Update RTL setting for React Native
    const isRTLLanguage = isRTL(languageCode);
    let restartRequired = false;

    // Only update if RTL setting needs to change
    if (I18nManager.isRTL !== isRTLLanguage) {
      I18nManager.forceRTL(isRTLLanguage);
      I18nManager.allowRTL(isRTLLanguage);
      restartRequired = true;
      logger.log(`RTL mode changed to ${isRTLLanguage}. App restart required.`);
    }

    // Update document direction for web
    if (isWeb && typeof document !== 'undefined') {
      document.documentElement.dir = isRTLLanguage ? 'rtl' : 'ltr';
      logger.log(`Document direction set to: ${isRTLLanguage ? 'rtl' : 'ltr'}`);
    }

    return { restartRequired };
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    logger.error('Error changing language:', errorObj);
    return { restartRequired: false, error: errorObj };
  }
};

// Load saved language preference
export const loadSavedLanguage = async (): Promise<string | null> => {
  try {
    return await offlineStorage.read<string>(LANGUAGE_STORAGE_KEY);
  } catch (error) {
    logger.error('Error loading saved language:', error);
    return null;
  }
};

// Initialize language on app start
export const initializeLanguage = async (): Promise<void> => {
  try {
    const savedLanguage = await loadSavedLanguage();
    const languageToUse = savedLanguage || getDeviceLanguage();

    await changeLanguage(languageToUse);
  } catch (error) {
    logger.error('Error initializing language:', error);
  }
};
