import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@constants/STORAGE_KEYS';
import logger from '@utils/logger';
import { usePlatform } from '@utils/platform';

interface GlobalContextType {
  // Add global state here as needed
  // Example: user preferences, app settings, etc.
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  colorMode: 'light' | 'dark';
  setColorMode: (mode: 'light' | 'dark') => void;
  setGlobleComponent?:any,
  globleComponent?:any
  refComponent?:{bottom:ReactNode}
  setRefComponent?: (component: { bottom?: ReactNode } | undefined) => void;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

interface GlobalProviderProps {
  children: ReactNode;
}

export const GlobalProvider: React.FC<GlobalProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [colorMode, setColorMode] = useState<'light' | 'dark'>('light');
  const { isWeb } = usePlatform();
  const [globleComponent,setGlobleComponent] = useState();
  const [refComponent,setRefComponent] = useState<{bottom?:ReactNode}>()
  useEffect(() => {
    // Load color mode preference
    const loadColorMode = async () => {
      try {
        if (isWeb) {
          // For web, use localStorage
          if (typeof localStorage !== 'undefined') {
            const savedMode = localStorage.getItem(STORAGE_KEYS.COLOR_MODE);
            if (savedMode === 'light' || savedMode === 'dark') {
              setColorMode(savedMode);
            }
          }
        } else {
          // For React Native, use AsyncStorage
          const savedMode = await AsyncStorage.getItem(STORAGE_KEYS.COLOR_MODE);
          if (savedMode === 'light' || savedMode === 'dark') {
            setColorMode(savedMode);
          }
        }
      } catch (error) {
        logger.error('Error loading color mode:', error);
      }
    };

    loadColorMode();
  }, [isWeb]);

  // Wrapper function to persist color mode changes
  const handleSetColorMode = async (mode: 'light' | 'dark') => {
    try {
      setColorMode(mode);
      // Persist to storage
      if (isWeb) {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.COLOR_MODE, mode);
        }
      } else {
        await AsyncStorage.setItem(STORAGE_KEYS.COLOR_MODE, mode);
      }
    } catch (error) {
      logger.error('Error saving color mode:', error);
    }
  };

  const value: GlobalContextType = {
    isLoading,
    setIsLoading,
    colorMode,
    setColorMode: handleSetColorMode,
    globleComponent,
    setGlobleComponent,
    refComponent,setRefComponent
  };

  return (
    <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>
  );
};

export const useGlobal = (): GlobalContextType => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error('useGlobal must be used within a GlobalProvider');
  }
  return context;
};

export default GlobalContext;
