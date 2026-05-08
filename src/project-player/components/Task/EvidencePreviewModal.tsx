import React from 'react';
import { Linking, Platform, Alert, Image } from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Text,
  Pressable,
  ScrollView,
  Button,
  ButtonText,
} from '@gluestack-ui/themed';
import { LucideIcon } from '@ui';
import { theme } from '../../../config/theme';
import Modal from '@ui/Modal';
import { useLanguage } from '@contexts/LanguageContext';
import { evidencePreviewModalStyles as styles } from './Styles';
import { EvidencePreviewModalProps, EvidenceAttachment } from '../../types/components.types';
import logger from '@utils/logger';

const EvidencePreviewModal: React.FC<EvidencePreviewModalProps> = ({
  isOpen,
  onClose,
  taskName,
  attachments,
}) => {
  const { t } = useLanguage();

  // Format date helper
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Handle download - cross-platform support
  const handleDownload = async (attachment: EvidenceAttachment) => {
    if (!attachment.url) return;

    try {
      if (Platform.OS === 'web') {
        window.open(attachment.url, '_blank');
      } else {
        // For React Native mobile (iOS/Android)
        const canOpen = await Linking.canOpenURL(attachment.url);
        if (canOpen) {
          await Linking.openURL(attachment.url);
        } else {
          Alert.alert(t('projectPlayer.cannotOpenFile'), t('projectPlayer.unableToOpenFile'));
          logger.warn('Cannot open URL:', attachment.url);
        }
      }
    } catch (error) {
      logger.error('Failed to open URL:', error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      headerTitle={`${t('projectPlayer.evidencePreview')} - ${taskName}`}
      headerAlignment="baseline"
      size="lg"
      footerContent={
        <HStack justifyContent="flex-end" width="$full">
          <Button
            variant="outline"
            onPress={onClose}
            {...styles.closeButton}
            $hover-bg="$hoverPink"
            $web-cursor="pointer"
          >
            <ButtonText {...styles.closeButtonText}>
              {t('common.close')}
            </ButtonText>
          </Button>
        </HStack>
      }
    >
      <VStack {...styles.container}>
        <Text {...styles.descriptionText}>
          {t('projectPlayer.viewAllUploadedEvidence')}
        </Text>

        <ScrollView {...styles.scrollView}>
          <VStack {...styles.fileListContainer}>
            {attachments.map((attachment, index) => (
              <Box
                key={attachment._id || index}
                {...styles.fileCard}
              >
                {/* File header with name and download */}
                <HStack {...styles.fileHeader}>
                  <VStack {...styles.fileInfoContainer}>
                    <HStack {...styles.fileNameRow}>
                      <LucideIcon
                        name="FileText"
                        size={styles.fileIconSize}
                        color={theme.tokens.colors.primary500}
                      />
                      <Text {...styles.fileNameText}>
                        {attachment.name}
                      </Text>
                    </HStack>
                    <Text {...styles.uploadInfoText}>
                      {attachment.uploadedBy && t('projectPlayer.uploadedBy', { name: attachment.uploadedBy })}
                      {attachment.uploadedBy && attachment.uploadedAt && ' • '}
                      {attachment.uploadedAt && formatDate(attachment.uploadedAt)}
                    </Text>
                  </VStack>

                  {/* Download button */}
                  <Pressable onPress={() => handleDownload(attachment)}>
                    {(state: any) => {
                      const isHovered = state?.hovered || state?.pressed || false;
                      return (
                        <Box
                          {...styles.downloadButton}
                          bg={isHovered ? '$hoverPink' : 'transparent'}
                          $web-cursor="pointer"
                        >
                          <LucideIcon
                            name="Download"
                            size={styles.downloadIconSize}
                            color={isHovered ? theme.tokens.colors.primary500 : theme.tokens.colors.textSecondary}
                          />
                        </Box>
                      );
                    }}
                  </Pressable>
                </HStack>

                {/* Image preview placeholder */}
                {attachment.type?.includes('image') ? (
                  <Image source={{ uri: attachment.url }} style={{ width: '100%', height: 200 }} />
                ) : (
                  <Box {...styles.imagePreviewPlaceholder}>
                    <LucideIcon
                      name="ImageOff"
                      size={styles.previewIconSize}
                      color={theme.tokens.colors.textMuted}
                    />
                    <Text {...styles.imagePreviewText}>
                      {t('projectPlayer.imagePreviewPlaceholder')}
                    </Text>
                    <Text {...styles.imageTypeText}>
                      {attachment.type || 'image/png'}
                    </Text>
                  </Box>
                )}
              </Box>
            ))}

            {attachments.length === 0 && (
              <Box {...styles.emptyStateContainer}>
                <LucideIcon
                  name="FileX"
                  size={styles.previewIconSize}
                  color={theme.tokens.colors.textMuted}
                />
                <Text {...styles.emptyStateText}>
                  {t('projectPlayer.noFilesUploaded')}
                </Text>
              </Box>
            )}
          </VStack>
        </ScrollView>
      </VStack>
    </Modal>
  );
};

export default EvidencePreviewModal;
