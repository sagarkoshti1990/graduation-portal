import React, { useEffect, useState } from 'react';
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

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const mode = useColorMode();
  const isDark = mode === 'dark';
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  // Determine if we're on mobile/tablet (< 768px)
  const { isMobile, isWeb } = usePlatform();

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
      style={isWeb ? ({ height: '100vh' } as any) : undefined}
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
          {/* Header */}
          <Box {...layoutStyles.headerContent}>
            <AdminHeader
              showNotification={true}
              onToggleSidebar={() => setIsDrawerOpen(!isDrawerOpen)}
            />
          </Box>
          {/* Main Content */}
          <Box {...layoutStyles.mainContent}>{children}</Box>
        </HStack>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AdminLayout;
