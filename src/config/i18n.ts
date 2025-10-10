import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { Platform, I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translations
import en from '../locales/en.json';
import ar from '../locales/ar.json';
import es from '../locales/es.json';
import hi from '../locales/hi.json';

const LANGUAGE_STORAGE_KEY = '@app_language';

// RTL languages
export const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'];

// Get device language
const getDeviceLanguage = (): string => {
  // For React Native, you might want to use a language detector library
  // For now, we'll default to English
  return 'en';
};

// Check if language is RTL
export const isRTL = (languageCode: string): boolean => {
  return RTL_LANGUAGES.includes(languageCode);
};

// Initialize i18next
i18n.use(initReactI18next).init({
  compatibilityJSON: 'v3',
  resources: {
    en: { translation: en },
    ar: { translation: ar },
    es: { translation: es },
    hi: { translation: hi },
  },
  lng: 'en', // Default language
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

// Load saved language preference
export const loadSavedLanguage = async (): Promise<string | null> => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    return savedLanguage;
  } catch (error) {
    console.error('Error loading saved language:', error);
    return null;
  }
};

// Save language preference
export const saveLanguagePreference = async (
  languageCode: string,
): Promise<void> => {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);
  } catch (error) {
    console.error('Error saving language preference:', error);
  }
};

// Change language and update RTL setting
export const changeLanguage = async (languageCode: string): Promise<void> => {
  try {
    await i18n.changeLanguage(languageCode);
    await saveLanguagePreference(languageCode);

    // Update RTL setting for React Native
    const isRTLLanguage = isRTL(languageCode);

    // Only update if RTL setting needs to change
    if (I18nManager.isRTL !== isRTLLanguage) {
      I18nManager.forceRTL(isRTLLanguage);
      I18nManager.allowRTL(isRTLLanguage);

      // Note: On React Native, changing RTL requires app restart
      // You might want to show a message to the user about this
      console.log(
        `RTL mode changed to ${isRTLLanguage}. App restart may be required.`,
      );
    }
  } catch (error) {
    console.error('Error changing language:', error);
  }
};

// Initialize language on app start
export const initializeLanguage = async (): Promise<void> => {
  try {
    const savedLanguage = await loadSavedLanguage();
    const languageToUse = savedLanguage || getDeviceLanguage();

    await changeLanguage(languageToUse);
  } catch (error) {
    console.error('Error initializing language:', error);
  }
};

export default i18n;
