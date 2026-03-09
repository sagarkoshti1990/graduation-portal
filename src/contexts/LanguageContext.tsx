import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { I18nManager } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  changeLanguage as changeI18nLanguage,
  initializeLanguage,
  isRTL as checkIsRTL,
  ChangeLanguageResult,
} from '@utils/i18n';
import logger from '@utils/logger';

interface LanguageContextType {
  currentLanguage: string;
  isRTL: boolean;
  changeLanguage: (languageCode: string) => Promise<ChangeLanguageResult>;
  t: (key: string, options?: Record<string, unknown>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({
  children,
}) => {
  const { i18n, t } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState<string>(
    i18n.language || 'en',
  );
  const [isRTL, setIsRTL] = useState<boolean>(I18nManager.isRTL);

  useEffect(() => {
    let mounted = true;
    // Initialize language on mount
    initializeLanguage()
      .then(() => {
        if (mounted) {
          setCurrentLanguage(i18n.language);
          setIsRTL(checkIsRTL(i18n.language));
        }
      })
      .catch(error => {
        logger.error('Failed to initialize language:', error);
      });

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changeLanguage = async (
    languageCode: string,
  ): Promise<ChangeLanguageResult> => {
    // Validate that languageCode is a valid string
    if (
      !languageCode ||
      typeof languageCode !== 'string' ||
      languageCode.trim() === ''
    ) {
      logger.warn('Invalid language code provided:', languageCode);
      return {
        restartRequired: false,
        error: new Error('Invalid language code provided'),
      };
    }

    const result = await changeI18nLanguage(languageCode);

    // Update state only if language change was successful
    if (!result.error) {
      setCurrentLanguage(languageCode);
      setIsRTL(checkIsRTL(languageCode));
    }

    // Return result so callers can handle restart requirement and errors
    return result;
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
