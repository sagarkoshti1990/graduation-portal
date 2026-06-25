import React from 'react';
import { Image } from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Text,
  ScrollView,
  Button,
  ButtonIcon,
} from '@gluestack-ui/themed';
import { LucideIcon } from '@ui';
import { theme } from '@config/theme';
import Modal from '@ui/Modal';
import { useLanguage } from '@contexts/LanguageContext';
import { evidencePreviewModalStyles as styles } from './styles';
import { EvidencePreviewModalProps } from '../../../types/components.types';
import { openDownload } from '@utils/helper';

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      headerTitle={`${t('projectPlayer.evidencePreview')} - ${taskName}`}
      headerDescription={t('projectPlayer.viewAllUploadedEvidence')}
      headerAlignment="baseline"
      size="lg"
    >
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
                      {attachment.originalName ?? attachment.name}
                    </Text>
                  </HStack>
                  {attachment.uploadedBy && <Text {...styles.uploadInfoText}>
                    {attachment.uploadedBy && t('projectPlayer.uploadedBy', { name: attachment.uploadedBy })}
                    {attachment.uploadedBy && attachment.uploadedAt && ' • '}
                    {attachment.uploadedAt && formatDate(attachment.uploadedAt)}
                  </Text>}
                </VStack>

                {/* Download button */}
                {attachment?.url &&
                  <Button
                  // @ts-ignore
                  variant="ghost"
                    onPress={() => openDownload(attachment?.url || "")}
                  >
                    <ButtonIcon as={LucideIcon}
                      name="Download"
                      // size={styles.downloadIconSize}
                    />
                  </Button>
                }
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
    </Modal>
  );
};

export default EvidencePreviewModal;
