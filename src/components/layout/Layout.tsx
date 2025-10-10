import React, { useState } from 'react';
import {
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBarStyle,
  Modal,
  Platform,
} from 'react-native';
import { useLanguage } from '../../contexts/LanguageContext';
import { createRTLStyle } from '../../utils/rtlUtils';
import LanguageSelector from '../LanguageSelector';

interface LayoutProps {
  title: string;
  children: React.ReactNode;
  statusBarStyle: string;
  statusBarBackgroundColor: string;
  navigation?: any;
  pendingSyncCount?: number;
}

const Layout: React.FC<LayoutProps> = ({
  title,
  children,
  statusBarStyle = 'dark-content',
  statusBarBackgroundColor = '#FFFFFF',
  navigation,
  pendingSyncCount,
}) => {
  const { t, isRTL } = useLanguage();
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle={statusBarStyle as StatusBarStyle}
        backgroundColor={statusBarBackgroundColor}
      />

      {/* Header */}
      <View style={[styles.header, createRTLStyle(styles.header)]}>
        <View style={[styles.headerTop, createRTLStyle(styles.headerTop)]}>
          <Text style={[styles.userName, createRTLStyle(styles.userName)]}>
            {title}
          </Text>
          <View
            style={[styles.headerRight, createRTLStyle(styles.headerRight)]}
          >
            {/* <TouchableOpacity
              style={styles.hamburgerButton}
              onPress={() => {
                if (navigation && navigation.openDrawer) {
                  navigation.openDrawer();
                }
              }}
              accessibilityLabel="Open menu"
            >
              <View style={styles.hamburgerIcon}>
                
                <View style={styles.hamburgerLine} />
                <View
                  style={[styles.hamburgerLine, styles.hamburgerLineMiddle]}
                />
                <View style={styles.hamburgerLine} />
              </View>
            </TouchableOpacity> */}

            {/* Dropdown Menu */}
            <View
              style={[
                { position: 'relative' },
                isRTL ? { marginLeft: 12 } : { marginRight: 12 },
              ]}
            >
              <TouchableOpacity
                style={styles.menuDropdownButton}
                onPress={() => setShowMenuDropdown?.(true)}
                accessibilityLabel={t('navigation.menu')}
                accessibilityRole="button"
              >
                <Text style={styles.menuDropdownButtonText}>
                  ☰ {t('navigation.menu')}
                </Text>
              </TouchableOpacity>
              <Modal
                visible={showMenuDropdown}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setShowMenuDropdown?.(false)}
              >
                <TouchableOpacity
                  activeOpacity={1}
                  style={{
                    flex: 1,
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                  onPress={() => setShowMenuDropdown?.(false)}
                >
                  <View
                    style={[
                      styles.menuDropdown,
                      createRTLStyle(styles.menuDropdown),
                      {
                        position: 'absolute',
                        top: 60,
                        right: isRTL ? undefined : 16,
                        left: isRTL ? 16 : undefined,
                        zIndex: 2000,
                      },
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.menuDropdownItem}
                      onPress={() => {
                        navigation.navigate('WebComponentDemo');
                        setShowMenuDropdown?.(false);
                      }}
                      accessibilityLabel={t('navigation.webComponentDemo')}
                      accessibilityRole="menuitem"
                    >
                      <Text
                        style={[
                          styles.menuDropdownItemText,
                          createRTLStyle(styles.menuDropdownItemText),
                        ]}
                      >
                        🎓 {t('navigation.webComponentDemo')}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.menuDropdownItem}
                      onPress={() => {
                        navigation.navigate('UploadExample');
                        setShowMenuDropdown?.(false);
                      }}
                      accessibilityLabel={t('navigation.upload')}
                      accessibilityRole="menuitem"
                    >
                      <Text
                        style={[
                          styles.menuDropdownItemText,
                          createRTLStyle(styles.menuDropdownItemText),
                        ]}
                      >
                        📤 {t('navigation.upload')}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.menuDropdownItem}
                      onPress={() => {
                        navigation.navigate('SyncStatus');
                        setShowMenuDropdown?.(false);
                      }}
                      accessibilityLabel={t('navigation.sync')}
                      accessibilityRole="menuitem"
                    >
                      <View
                        style={{
                          flexDirection: isRTL ? 'row-reverse' : 'row',
                          alignItems: 'center',
                        }}
                      >
                        <Text
                          style={[
                            styles.menuDropdownItemText,
                            createRTLStyle(styles.menuDropdownItemText),
                          ]}
                        >
                          🔄 {t('navigation.sync')}
                        </Text>
                        {pendingSyncCount && pendingSyncCount > 0 && (
                          <View style={styles.syncBadge}>
                            <Text style={styles.syncBadgeText}>
                              {pendingSyncCount}
                            </Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </Modal>
            </View>

            {/* Language Selector */}
            <View style={isRTL ? { marginLeft: 12 } : { marginRight: 12 }}>
              <LanguageSelector compact={true} />
            </View>

            <View style={styles.profileIcon} />
          </View>
        </View>
      </View>

      {/* Main Content */}
      <View
        style={[
          styles.content,
          // @ts-ignore
          Platform.OS === 'web' ? { zIndex: -1 } : {},
        ]}
      >
        {children}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F4',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222222',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    marginLeft: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#F5F6FA',
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 15,
    color: '#222222',
  },
  badge: {
    marginLeft: 4,
    backgroundColor: '#FF5252',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    // padding: 16,
  },
  hamburgerButton: {
    marginRight: 16,
    padding: 4,
  },
  hamburgerIcon: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hamburgerLine: {
    width: 22,
    height: 2,
    backgroundColor: '#222',
    borderRadius: 1,
  },
  hamburgerLineMiddle: {
    marginVertical: 4,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
  },
  languageSelector: {
    fontSize: 14,
    color: '#6C757D',
    marginRight: 16,
  },
  profileIcon: {
    width: 24,
    height: 24,
    backgroundColor: '#6C757D',
    borderRadius: 12,
  },
  webComponentDemoButton: {
    backgroundColor: '#F3E5F5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#9C27B0',
  },
  webComponentDemoButtonText: {
    fontSize: 11,
    color: '#7B1FA2',
    fontWeight: '600',
  },
  uploadDemoButton: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  uploadDemoButtonText: {
    fontSize: 11,
    color: '#1976D2',
    fontWeight: '600',
  },
  syncButton: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#FF9800',
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncButtonText: {
    fontSize: 11,
    color: '#F57C00',
    fontWeight: '600',
  },
  syncBadge: {
    backgroundColor: '#DC3545',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
    minWidth: 18,
    alignItems: 'center',
  },
  syncBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  menuDropdownButton: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: '#F5F5F5',
    zIndex: 1000,
  },
  menuDropdownButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  menuDropdown: {
    minWidth: 120,
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  menuDropdownItem: {
    padding: 4,
    marginVertical: 2,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  menuDropdownItemText: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '600',
  },
});

export default Layout;
