import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { I18nManager, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  changeLanguage as changeI18nLanguage,
  initializeLanguage,
  isRTL as checkIsRTL,
} from '../config/i18n';

interface LanguageContextType {
  currentLanguage: string;
  isRTL: boolean;
  changeLanguage: (languageCode: string) => Promise<void>;
  t: (key: string, options?: any) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const { i18n, t } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState<string>(i18n.language || 'en');
  const [isRTL, setIsRTL] = useState<boolean>(I18nManager.isRTL);

  useEffect(() => {
    // Initialize language on mount
    initializeLanguage().then(() => {
      setCurrentLanguage(i18n.language);
      setIsRTL(checkIsRTL(i18n.language));
    });
  }, []);

  const changeLanguage = async (languageCode: string) => {
    try {
      await changeI18nLanguage(languageCode);
      setCurrentLanguage(languageCode);
      setIsRTL(checkIsRTL(languageCode));
      
      // For web, we can change direction immediately
      if (Platform.OS === 'web') {
        const htmlElement = document.documentElement;
        if (checkIsRTL(languageCode)) {
          htmlElement.setAttribute('dir', 'rtl');
          htmlElement.setAttribute('lang', languageCode);
        } else {
          htmlElement.setAttribute('dir', 'ltr');
          htmlElement.setAttribute('lang', languageCode);
        }
      }
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  const value: LanguageContextType = {
    currentLanguage,
    isRTL,
    changeLanguage,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;

