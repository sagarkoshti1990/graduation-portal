import React from 'react';
import { Box, HStack, VStack, Text, Pressable } from '@gluestack-ui/themed';
import Modal from '@components/ui/Modal';
import LucideIcon from '@components/ui/LucideIcon';
import styles from '../styles';
import { useLanguage } from '@contexts/LanguageContext';
import { MaterialItem } from '../../../../services/serviceProvider/MaterialsLibrary/materialsLibraryService';

export interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MaterialItem | null;
  onDownload: (id: string) => void;
}

export default function PreviewModal({
  isOpen,
  onClose,
  item,
  onDownload,
}: PreviewModalProps): React.JSX.Element {
  const { t } = useLanguage();

  if (!item || !isOpen) return <></>;

  const getFormatTag = (format: string, fileName: string) => {
    if (fileName && fileName.includes('.')) {
      return fileName.split('.').pop()?.toUpperCase() || 'FILE';
    }
    if (format === 'PDF Document') return 'PDF';
    if (format === 'Templates & Decks') return 'TPL';
    if (format === 'Video Guide') return 'VIDEO';
    return 'FILE';
  };

  const tagText = getFormatTag(item.format, item.fileName);

  // Tag styling based on format type using theme tokens
  const getTagColors = (tag: string) => {
    switch (tag) {
      case 'PDF':
        return { bg: '$error50', border: '$error200', text: '$error600' };
      case 'XLSX':
      case 'XLS':
      case 'TPL':
        return { bg: '$success50', border: '$success300', text: '$success700' };
      case 'PPTX':
      case 'PPT':
      case 'DOCX':
      case 'DOC':
        return { bg: '$purple50', border: '$purple300', text: '$purple600' };
      case 'MP4':
      case 'VIDEO':
        return { bg: '$blue50', border: '$blue200', text: '$blue600' };
      default:
        return { bg: '$gray50', border: '$gray300', text: '$gray700' };
    }
  };

  const colors = getTagColors(tagText);

  const handleDownload = () => {
    onDownload(item.id);
  };

  // Header Title component to match design: Tag next to Title and Red Close Button on far right
  const headerContent = (
    <HStack {...styles.previewHeaderRow}>
      <HStack {...styles.previewHeaderLeft}>
        <Box
          {...styles.previewHeaderTag}
          bg={colors.bg as any}
          borderColor={colors.border as any}
        >
          <Text {...styles.previewHeaderTagText} color={colors.text as any}>
            {tagText}
          </Text>
        </Box>
        <Text {...styles.previewHeaderTitle} numberOfLines={1}>
          {item.title}
        </Text>
      </HStack>

      {/* Custom Red Close Button */}
      <Pressable onPress={onClose} {...styles.previewCloseBtn}>
        <LucideIcon name="X" size={styles.previewCloseIcon.size} color={styles.previewCloseIcon.color} />
      </Pressable>
    </HStack>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      headerContent={headerContent}
      headerProps={styles.modalHeaderProps}
      showCloseButton={false}
      footerContent={
        <HStack {...styles.previewFooterRow}>
          {/* Close Button */}
          <Pressable
            onPress={onClose}
            {...styles.modalCancelBtn}
          >
            <Text {...styles.modalCancelBtnText}>
              {t('supportProvider.materialsLibrary.previewModal.close')}
            </Text>
          </Pressable>

          {/* Download File Button */}
          <Pressable
            onPress={handleDownload}
            {...styles.modalDownloadBtn}
          >
            <HStack {...styles.previewDownloadBtnRow}>
              <LucideIcon name="Download" size={styles.previewDownloadBtnIcon.size} color={styles.previewDownloadBtnIcon.color} />
              <Text {...styles.modalDownloadBtnText}>
                {t('supportProvider.materialsLibrary.previewModal.downloadFile')}
              </Text>
            </HStack>
          </Pressable>
        </HStack>
      }
    >
      <VStack {...styles.previewBodyVStack}>
        {/* Category & Purpose Section */}
        <Box {...styles.previewDetailsBox}>
          <Text {...styles.previewPurposeTitle}>
            {t('supportProvider.materialsLibrary.previewModal.title')}
          </Text>
          <Text {...styles.previewPurposeValue}>
            {item.category}
          </Text>
          <Text {...styles.previewPurposeDesc}>
            {item.description}
          </Text>
        </Box>

        {/* Associated offering if exists */}
        {item.associatedOffering ? (
          <HStack {...styles.previewLinkedOfferingBox}>
            <LucideIcon name="Link2" size={styles.previewLinkedOfferingIcon.size} color={styles.previewLinkedOfferingIcon.color} />
            <VStack {...styles.previewLinkedOfferingTextCol}>
              <Text {...styles.linkedOfferingLabel}>
                {t('supportProvider.materialsLibrary.previewModal.associatedOffering')}
              </Text>
              <Text {...styles.linkedOfferingValue}>
                {item.associatedOffering}
              </Text>
            </VStack>
          </HStack>
        ) : null}

        {/* Properties Grid */}
        <Box {...styles.previewMetaGrid}>
          {/* File Name */}
          <Box {...styles.previewGridItem}>
            <Text {...styles.previewGridLabel}>
              {t('supportProvider.materialsLibrary.previewModal.fileName')}
            </Text>
            <Text {...styles.previewGridValue} numberOfLines={1}>
              {item.fileName || t('common.notAvailable')}
            </Text>
          </Box>

          {/* File Size */}
          <Box {...styles.previewGridItem}>
            <Text {...styles.previewGridLabel}>
              {t('supportProvider.materialsLibrary.previewModal.fileSize')}
            </Text>
            <Text {...styles.previewGridValue}>
              {item.fileSize || 'N/A'}
            </Text>
          </Box>

          {/* Upload Date */}
          <Box {...styles.previewGridItem}>
            <Text {...styles.previewGridLabel}>
              {t('supportProvider.materialsLibrary.previewModal.uploadDate')}
            </Text>
            <Text {...styles.previewGridValue}>
              {item.uploadDate}
            </Text>
          </Box>

          {/* Downloads */}
          <Box {...styles.previewGridItem}>
            <Text {...styles.previewGridLabel}>
              {t('supportProvider.materialsLibrary.previewModal.downloads')}
            </Text>
            <Text {...styles.previewGridValue}>
              {item.downloads}
            </Text>
          </Box>
        </Box>
      </VStack>
    </Modal>
  );
}
