import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  HStack,
  SafeAreaView,
  ScrollView,
  useColorMode,
} from '@ui';
import AdminHeader from '@components/Header';
import AdminSidebar from '@components/Sidebar/Sidebar';
import { layoutStyles } from './Styles';
import { usePlatform } from '@utils/platform';
import { useLanguage } from '@contexts/LanguageContext';
import { useDocumentTitle } from '@hooks';

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
    setIsDrawerOpen(!isMobile);
  }, [isMobile]);

  return (
    <SafeAreaView
      {...layoutStyles.container}
      bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}
      style={isWeb ? ({ height: '100vh' } as Record<string, string>) : undefined}
    >
      {/* Sidebar */}
      <AdminSidebar
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        isMobile={isMobile}
      />

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
              onToggleSidebar={() => setIsDrawerOpen(!isDrawerOpen)}
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
