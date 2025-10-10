import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useLanguage } from '../contexts/LanguageContext';
import { createRTLStyle } from '../utils/rtlUtils';
import LanguageSelector from './LanguageSelector';

interface CustomDrawerContentProps {
  navigation: any;
  pendingSyncCount?: number;
}

const CustomDrawerContent: React.FC<CustomDrawerContentProps> = props => {
  const { navigation, pendingSyncCount } = props;
  const { t } = useLanguage();

  const menuItems = [
    {
      label: t('navigation.webComponentDemo'),
      icon: '🎓',
      route: 'WebComponentDemo',
      style: styles.webComponentItem,
      textStyle: styles.webComponentText,
    },
    {
      label: t('navigation.upload'),
      icon: '📤',
      route: 'UploadExample',
      style: styles.uploadItem,
      textStyle: styles.uploadText,
    },
    {
      label: t('navigation.sync'),
      icon: '🔄',
      route: 'SyncStatus',
      style: styles.syncItem,
      textStyle: styles.syncText,
      badge: pendingSyncCount,
    },
  ];

  return (
    <View style={styles.scrollView}>
      <View style={styles.container}>
        <View
          style={[styles.drawerHeader, createRTLStyle(styles.drawerHeader)]}
        >
          <Text
            style={[styles.drawerTitle, createRTLStyle(styles.drawerTitle)]}
          >
            {t('navigation.menu')}
          </Text>
        </View>

        <View style={styles.menuItems}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuItem,
                item.style,
                createRTLStyle(styles.menuItem),
              ]}
              onPress={() => {
                navigation.navigate(item.route);
                navigation.closeDrawer();
              }}
              accessibilityLabel={`Navigate to ${item.label}`}
              accessibilityRole="button"
            >
              <Text style={[styles.menuIcon, createRTLStyle(styles.menuIcon)]}>
                {item.icon}
              </Text>
              <Text
                style={[
                  styles.menuText,
                  item.textStyle,
                  createRTLStyle(styles.menuText),
                ]}
              >
                {item.label}
              </Text>
              {item.badge && item.badge > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.divider} />

        {/* Language Selector */}
        <View style={styles.languageContainer}>
          <LanguageSelector showInDrawer={true} />
        </View>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.closeDrawer()}
          accessibilityLabel={t('common.close')}
          accessibilityRole="button"
        >
          <Text
            style={[
              styles.closeButtonText,
              createRTLStyle(styles.closeButtonText),
            ]}
          >
            {t('navigation.closeMenu')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    paddingTop: 20,
  },
  drawerHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginBottom: 10,
  },
  drawerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222222',
  },
  menuItems: {
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  webComponentItem: {
    backgroundColor: '#F3E5F5',
    borderColor: '#9C27B0',
  },
  webComponentText: {
    color: '#7B1FA2',
  },
  uploadItem: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  uploadText: {
    color: '#1976D2',
  },
  syncItem: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FF9800',
  },
  syncText: {
    color: '#F57C00',
  },
  badge: {
    backgroundColor: '#DC3545',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 16,
    marginHorizontal: 20,
  },
  closeButton: {
    marginHorizontal: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  languageContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});

export default CustomDrawerContent;
