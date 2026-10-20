import React, { useState, useCallback } from 'react';
import { Platform } from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Button,
  ButtonText,
  Pressable,
  ButtonIcon,
  Spinner,
} from '@gluestack-ui/themed';
import Modal from '@components/ui/Modal';
import LucideIcon from '@components/ui/LucideIcon';
import { useLanguage } from '@contexts/LanguageContext';
import { useAlert } from '@components/ui/Alert';
import { openDownload } from '@utils/helper';
import { styles } from './Styles';

// @ts-ignore - process.env is injected by webpack DefinePlugin on web
const APK_DOWNLOAD_URL = process.env.APK_DOWNLOAD_URL || '';

interface DownloadApkModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  navigation?: any;
}

export const DownloadApkModal: React.FC<DownloadApkModalProps> = ({
  isOpen = true,
  onClose,
  navigation,
}) => {
  const { t } = useLanguage();
  const { showAlert } = useAlert();
  const [ isDownloading, setIsDownloading ] = useState(false);

  const handleClose = useCallback(() => {
    onClose?.();
    if (navigation && typeof navigation.goBack === 'function' && navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [onClose, navigation]);

  const isConfigured = Boolean(APK_DOWNLOAD_URL.trim());
  const [showGuide, setShowGuide] = useState(false);

  const handleDownload = useCallback(async() => {
    setIsDownloading(true)
    if (!APK_DOWNLOAD_URL.trim()) {
      showAlert('error', t('downloadApk.urlNotConfigured'));
      setIsDownloading(false)
      return;
    }
    await openDownload(APK_DOWNLOAD_URL, t, showAlert);
    setIsDownloading(false)
  }, [t, showAlert]);

  const handleToggleGuide = useCallback(() => {
    setShowGuide(prev => !prev);
  }, []);

  // Web only component
  if (Platform.OS !== 'web') {
    return null;
  }

  const getApkNameFromUrl = (url: string): string => {
    if (url && url.trim()) {
      try {
        const cleanUrl = url.split('?')[0].split('#')[0];
        const lastSegment = cleanUrl.substring(cleanUrl.lastIndexOf('/') + 1);
        if (lastSegment) {
          const nameWithoutExt = lastSegment.replace(/\.[^/.]+$/, '');
          if (nameWithoutExt.trim()) {
            return nameWithoutExt.trim();
          }
        }
      } catch {
        // Fallback
      }
    }
    return '';
  };

  const dynamicName = getApkNameFromUrl(APK_DOWNLOAD_URL);
  const readyStatusText = dynamicName
    ? `100% Ready · ${dynamicName}`
    : '100% Ready';

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      showCloseButton={false}
      size="md"
      contentProps={styles.modalContent}
    >
      <Box {...styles.modalContainer}>
        {/* Close Button X */}
        <Pressable  {...styles.closeButton}  onPress={handleClose}  accessibilityLabel={t('downloadApk.close')}  accessibilityRole="button"  >
          <LucideIcon name="X" size={18} />
        </Pressable>

        <VStack {...styles.contentWrapper}>
          {/* Top Phone Icon Circle */}
          <Box {...styles.iconWrapper}>
            <LucideIcon name="Smartphone" size={22} color={styles.smartphoneIconColor} />
          </Box>

          {/* CONFIGURED STATE CONTENT */}
          {isConfigured ? (
            <>
              {/* Badge: 100% Ready · version (if version present) */}
              <HStack {...styles.badgeReady}>
                <LucideIcon name="CheckCircle2" size={13} color={styles.badgeReadyIconColor} />
                <Text {...styles.badgeReadyText}>{readyStatusText}</Text>
              </HStack>

              {/* Title */}
              <Heading {...styles.appName}>{t('downloadApk.appName')}</Heading>

              {/* Description */}
              <Text {...styles.description}>{t('downloadApk.description')}</Text>

              {/* Download APK Button */}
              <Button  variant="solid"  {...styles.downloadButton}
                onPress={handleDownload}
                accessibilityRole="button"
                isDisabled={isDownloading}
              >
                {isDownloading ? (
                  <Spinner size="small" color="white" mr="$2" />
                ) : (
                  <ButtonIcon as={LucideIcon} name="Download" size={16} color={styles.downloadButtonIconColor} />
                )}
                <ButtonText {...styles.downloadButtonText}>
                  {t('downloadApk.downloadButton')}
                </ButtonText>
              </Button>

              {/* Installation Guide Toggle */}
              <Pressable {...styles.guideToggle} onPress={handleToggleGuide} accessibilityRole="button">
                <LucideIcon name="HelpCircle" size={14} color={styles.guideToggleIconColor} />
                <Text {...styles.guideToggleText}>
                  {t('downloadApk.installationGuide')}
                </Text>
                <LucideIcon  name={showGuide ? 'ChevronUp' : 'ChevronDown'} size={15}color={styles.guideToggleIconColor}/>
              </Pressable>

              {/* Installation Guide Expandable Content */}
              {showGuide && (
                <Box {...styles.guideBox}>
                  <Box {...styles.guideStep}>
                    <Text>
                      <Text {...styles.guideStepTitle}>
                        {t('downloadApk.step1Title')}{' '}
                      </Text>
                      <Text {...styles.guideStepDesc}>
                        {t('downloadApk.step1Desc')}
                      </Text>
                    </Text>
                  </Box>

                  <Box {...styles.guideStep}>
                    <Text>
                      <Text {...styles.guideStepTitle}>
                        {t('downloadApk.step2Title')}{' '}
                      </Text>
                      <Text {...styles.guideStepDesc}>
                        {t('downloadApk.step2Desc')}
                      </Text>
                    </Text>
                  </Box>

                  <Box {...styles.guideStep}>
                    <Text>
                      <Text {...styles.guideStepTitle}>
                        {t('downloadApk.step3Title')}{' '}
                      </Text>
                      <Text {...styles.guideStepDesc}>
                        {t('downloadApk.step3Desc')}
                      </Text>
                    </Text>
                  </Box>

                  <Box {...styles.guideStepLast}>
                    <Text>
                      <Text {...styles.guideStepTitle}>
                        {t('downloadApk.step4Title')}{' '}
                      </Text>
                      <Text {...styles.guideStepDesc}>
                        {t('downloadApk.step4Desc')}
                      </Text>
                    </Text>
                  </Box>
                </Box>
              )}
            </>
          ) : (
            /* UNCONFIGURED STATE CONTENT */
            <>
              {/* Badge: Setup Required */}
              <HStack {...styles.badgeUnconfigured}>
                <LucideIcon name="AlertTriangle" size={13} color={styles.badgeUnconfiguredIconColor} />
                <Text {...styles.badgeUnconfiguredText}>
                  {t('downloadApk.setupRequired')}
                </Text>
              </HStack>

              {/* Title */}
              <Heading {...styles.appName}>
                {t('downloadApk.unconfiguredTitle')}
              </Heading>

              {/* Description */}
              <Text {...styles.description}>
                {t('downloadApk.unconfiguredDescription')}
              </Text>

              {/* Yellow Notice Warning Box */}
              <Box {...styles.noticeBox}>
                <HStack space="xs" alignItems="flex-start">
                  <LucideIcon name="AlertTriangle" size={16} color={styles.noticeBoxIconColor} />
                  <Text {...styles.noticeText}>
                    <Text {...styles.noticeTitle}>
                      {t('downloadApk.noticeTitle')}{' '}
                    </Text>
                    {t('downloadApk.noticeMessage')}
                  </Text>
                </HStack>
              </Box>

              {/* Continue in Web Browser Button */}
              <Button {...styles.continueButton}  onPress={handleClose}  accessibilityRole="button"  variant='outlineghost' >
                <ButtonText {...styles.continueButtonText}>
                  {t('downloadApk.continueInBrowser')}
                </ButtonText>
              </Button>
            </>
          )}
        </VStack>
      </Box>
    </Modal>
  );
};

export default DownloadApkModal;
