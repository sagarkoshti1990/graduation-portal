import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  HStack,
  Pressable,
  SafeAreaView,
  ScrollView,
  useColorMode,
  LucideIcon,
} from '@ui';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AdminHeader from '@components/Header';
import AdminSidebar from '@components/Sidebar/Sidebar';
import { layoutStyles } from './Styles';
import { usePlatform } from '@utils/platform';
import { useLanguage } from '@contexts/LanguageContext';
import { useDocumentTitle } from '@hooks';
import { STORAGE_KEYS } from '@constants/STORAGE_KEYS';

interface AdminLayoutProps {
  children: React.ReactNode;
  pageName?: string; // Page name for title setting
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, pageName }) => {
  const mode = useColorMode();
  const isDark = mode === 'dark';
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  // Determine if we're on mobile/tablet (< 768px)
  const { isMobile, isWeb } = usePlatform();
  const { t } = useLanguage();

  // Set document title for web - memoize to avoid recalculation
  const pageTitle = useMemo(() => 
    pageName ? t(`admin.pageTitle.${pageName}`) : '', 
    [pageName, t]
  );
  useDocumentTitle(pageTitle);

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  useEffect(() => {
    const loadSidebarState = async () => {
      // Mobile: keep drawer closed by default
      if (isMobile) {
        setIsDrawerOpen(false);
        return;
      }

      try {
        if (isWeb) {
          if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem(STORAGE_KEYS.ADMIN_SIDEBAR_OPEN);
            if (raw === 'true' || raw === 'false') {
              setIsDrawerOpen(raw === 'true');
              return;
            }
          }
          // Default for desktop web
          setIsDrawerOpen(true);
          return;
        }

        const raw = await AsyncStorage.getItem(STORAGE_KEYS.ADMIN_SIDEBAR_OPEN);
        if (raw === 'true' || raw === 'false') {
          setIsDrawerOpen(raw === 'true');
        } else {
          // Default for desktop native/tablet
          setIsDrawerOpen(true);
        }
      } catch {
        // Safe fallback
        setIsDrawerOpen(true);
      }
    };

    loadSidebarState();
  }, [isMobile, isWeb]);

  const setDrawerOpen = async (next: boolean) => {
    setIsDrawerOpen(next);
    try {
      if (isWeb) {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.ADMIN_SIDEBAR_OPEN, String(next));
        }
      } else {
        await AsyncStorage.setItem(STORAGE_KEYS.ADMIN_SIDEBAR_OPEN, String(next));
      }
    } catch {
      // ignore persistence failures
    }
  };

  return (
    <SafeAreaView
      {...layoutStyles.container}
      bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}
      style={isWeb ? ({ height: '100vh' } as any) : undefined}
    >
      {/* Sidebar */}
      <AdminSidebar
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        isMobile={isMobile}
      />

      {/* Desktop sidebar toggle (matches design: circular chevron at sidebar edge) */}
      {isWeb && !isMobile && (
        <Pressable
          onPress={() => setDrawerOpen(!isDrawerOpen)}
          style={layoutStyles.desktopSidebarToggleWrapper(isDrawerOpen)}
        >
          {(state: any) => {
            const isHovered = state?.hovered || state?.pressed || false;
            return (
              <Box {...layoutStyles.desktopSidebarToggleButton(isHovered)}>
                <LucideIcon
                  name={isDrawerOpen ? 'ChevronLeft' : 'ChevronRight'}
                  size={16}
                  color={isHovered ? '$primary600' : '$textLight600'}
                />
              </Box>
            );
          }}
        </Pressable>
      )}

      {/* Scrollable Content Area (Header + Main Content) */}
      <ScrollView
        flex={1}
        contentContainerStyle={layoutStyles.scrollContent}
      >
        <HStack
          flex={1}
          width="$full"
          flexDirection="column"
        >
          {/* @ts-ignore - Header */}
          <Box {...layoutStyles.headerContent}>
            <AdminHeader
              showNotification={true}
              // Hide hamburger menu on desktop; sidebar is controlled by the chevron toggler
              onToggleSidebar={
                isMobile ? () => setDrawerOpen(!isDrawerOpen) : undefined
              }
            />
          </Box>
          {/* @ts-ignore - Main Content */}
          <Box {...layoutStyles.mainContent}>{children}</Box>
        </HStack>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AdminLayout;
