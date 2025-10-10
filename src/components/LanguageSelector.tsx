import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
} from 'react-native';
import { useLanguage } from '../contexts/LanguageContext';
import { createRTLStyle } from '../utils/rtlUtils';
import Alert from '../components/ui/alert';
interface Language {
  code: string;
  name: string;
  nativeName: string;
  isRTL: boolean;
}

const AVAILABLE_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', isRTL: false },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', isRTL: true },
  { code: 'es', name: 'Spanish', nativeName: 'Español', isRTL: false },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', isRTL: false },
];

interface LanguageSelectorProps {
  compact?: boolean;
  showInDrawer?: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  compact = false,
  showInDrawer = false,
}) => {
  const { currentLanguage, changeLanguage, t, isRTL } = useLanguage();
  const [modalVisible, setModalVisible] = useState(false);

  const currentLang =
    AVAILABLE_LANGUAGES.find(lang => lang.code === currentLanguage) ||
    AVAILABLE_LANGUAGES[0];

  const handleLanguageChange = async (languageCode: string) => {
    const selectedLang = AVAILABLE_LANGUAGES.find(
      lang => lang.code === languageCode,
    );

    if (selectedLang && selectedLang.isRTL !== isRTL && Platform.OS !== 'web') {
      // Show alert for native platforms that changing RTL requires restart
      Alert.alert(
        t('settings.language'),
        'Changing language direction requires an app restart. Please close and reopen the app.',
        [
          {
            text: t('common.cancel'),
            style: 'cancel',
          },
          {
            text: t('common.confirm'),
            onPress: async () => {
              await changeLanguage(languageCode);
              setModalVisible(false);
            },
          },
        ],
      );
    } else {
      await changeLanguage(languageCode);
      setModalVisible(false);
    }
  };

  const renderCompactButton = () => (
    <TouchableOpacity
      style={[styles.compactButton, createRTLStyle(styles.compactButton)]}
      onPress={() => setModalVisible(true)}
      accessibilityLabel={t('settings.selectLanguage')}
      accessibilityRole="button"
    >
      <Text style={styles.compactButtonText}>
        🌐 {currentLang.code.toUpperCase()}
      </Text>
    </TouchableOpacity>
  );

  const renderDrawerButton = () => (
    <TouchableOpacity
      style={[styles.drawerButton, createRTLStyle(styles.drawerButton)]}
      onPress={() => setModalVisible(true)}
      accessibilityLabel={t('settings.selectLanguage')}
      accessibilityRole="button"
    >
      <Text style={styles.drawerIcon}>🌐</Text>
      <Text
        style={[
          styles.drawerButtonText,
          createRTLStyle(styles.drawerButtonText),
        ]}
      >
        {t('settings.language')}
      </Text>
      <Text style={styles.currentLangText}>{currentLang.nativeName}</Text>
    </TouchableOpacity>
  );

  const renderFullButton = () => (
    <TouchableOpacity
      style={[styles.fullButton, createRTLStyle(styles.fullButton)]}
      onPress={() => setModalVisible(true)}
      accessibilityLabel={t('settings.selectLanguage')}
      accessibilityRole="button"
    >
      <View
        style={[
          styles.fullButtonContent,
          createRTLStyle(styles.fullButtonContent),
        ]}
      >
        <Text style={styles.fullButtonIcon}>🌐</Text>
        <View style={styles.fullButtonTextContainer}>
          <Text
            style={[
              styles.fullButtonLabel,
              createRTLStyle(styles.fullButtonLabel),
            ]}
          >
            {t('settings.language')}
          </Text>
          <Text
            style={[
              styles.fullButtonValue,
              createRTLStyle(styles.fullButtonValue),
            ]}
          >
            {currentLang.nativeName}
          </Text>
        </View>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );

  return (
    <>
      {compact
        ? renderCompactButton()
        : showInDrawer
        ? renderDrawerButton()
        : renderFullButton()}

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, createRTLStyle(styles.modalContent)]}
          >
            <View
              style={[styles.modalHeader, createRTLStyle(styles.modalHeader)]}
            >
              <Text
                style={[styles.modalTitle, createRTLStyle(styles.modalTitle)]}
              >
                {t('settings.selectLanguage')}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
                accessibilityLabel={t('common.close')}
                accessibilityRole="button"
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.languageList}>
              {AVAILABLE_LANGUAGES.map(language => {
                const isSelected = language.code === currentLanguage;
                return (
                  <TouchableOpacity
                    key={language.code}
                    style={[
                      styles.languageItem,
                      isSelected && styles.selectedLanguageItem,
                      createRTLStyle(styles.languageItem),
                    ]}
                    onPress={() => handleLanguageChange(language.code)}
                    accessibilityLabel={`Select ${language.name}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                  >
                    <View
                      style={[
                        styles.languageItemContent,
                        createRTLStyle(styles.languageItemContent),
                      ]}
                    >
                      <Text style={styles.languageNativeName}>
                        {language.nativeName}
                      </Text>
                      <Text style={styles.languageEnglishName}>
                        {language.name}
                      </Text>
                    </View>
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>

            {Platform.OS !== 'web' && (
              <View
                style={[
                  styles.noticeContainer,
                  createRTLStyle(styles.noticeContainer),
                ]}
              >
                <Text
                  style={[styles.noticeText, createRTLStyle(styles.noticeText)]}
                >
                  ℹ️ Changing to a different text direction (RTL/LTR) may
                  require restarting the app.
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  // Compact button (for headers)
  compactButton: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 12,
  },
  compactButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333333',
  },

  // Drawer button
  drawerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F3E5F5',
    borderWidth: 1,
    borderColor: '#9C27B0',
  },
  drawerIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  drawerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7B1FA2',
    flex: 1,
  },
  currentLangText: {
    fontSize: 14,
    color: '#7B1FA2',
    opacity: 0.8,
  },

  // Full button (for settings screen)
  fullButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  fullButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fullButtonIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  fullButtonTextContainer: {
    flex: 1,
  },
  fullButtonLabel: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 4,
  },
  fullButtonValue: {
    fontSize: 14,
    color: '#666666',
  },
  chevron: {
    fontSize: 24,
    color: '#CCCCCC',
    transform: [{ rotate: '0deg' }],
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666666',
  },
  languageList: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F8F9FA',
  },
  selectedLanguageItem: {
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  languageItemContent: {
    flex: 1,
  },
  languageNativeName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  languageEnglishName: {
    fontSize: 14,
    color: '#666666',
  },
  checkmark: {
    fontSize: 24,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  noticeContainer: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 12,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  noticeText: {
    fontSize: 12,
    color: '#E65100',
    lineHeight: 18,
  },
});

export default LanguageSelector;
