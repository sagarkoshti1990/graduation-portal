import React from 'react';
import { Box, HStack, VStack, Text, Pressable } from '@gluestack-ui/themed';
import LucideIcon from '@components/ui/LucideIcon';
import styles from '../styles';
import { useLanguage } from '@contexts/LanguageContext';
import { MaterialItem, MATERIAL_FORMATS } from '../../../../services/serviceProvider/MaterialsLibrary/materialsLibraryService';

export interface MaterialCardProps {
  item: MaterialItem;
  onPreview: (item: MaterialItem) => void;
  onDelete: (item: MaterialItem) => void;
  onDownload: (id: string) => void;
}

export default function MaterialCard({
  item,
  onPreview,
  onDelete,
  onDownload,
}: MaterialCardProps): React.JSX.Element {
  const { t } = useLanguage();

  // The icon shows the file format only: blue for Word documents, red for PDFs (and anything else)
  const badge =
    item.format === MATERIAL_FORMATS.WORD
      ? { icon: 'FileText', iconBg: '$blue50', iconBorder: '$blue200', iconColor: '$blue600' }
      : { icon: 'FileText', iconBg: '$error50', iconBorder: '$error200', iconColor: '$error600' };

  return (
    <Box {...styles.materialCard}>
      <VStack>
        {/* Card Header with Icon Box on left, Pill and Title on right */}
        <HStack {...styles.cardHeaderRow}>
          <Box
            {...styles.cardHeaderIconBox}
            bg={(badge.iconBg) as any}
            borderColor={(badge.iconBorder) as any}
          >
            <LucideIcon name={badge.icon} size={styles.cardHeaderIconProps.size} color={badge.iconColor} />
          </Box>
          <VStack {...styles.cardHeaderTextCol}>
            {item.category ? (
              <Box {...styles.cardBadgeWrapper}>
                <HStack {...styles.categoryBadgeCard}>
                  <Text {...styles.categoryBadgeTextCard}>
                    {item.category}
                  </Text>
                </HStack>
              </Box>
            ) : null}
            <Text {...styles.cardTitle} numberOfLines={1}>
              {item.title}
            </Text>
          </VStack>
        </HStack>

        {/* Card Description */}
        {item.description ? (
          <Text {...styles.cardDescription} numberOfLines={3}>
            {item.description}
          </Text>
        ) : null}

        {/* File Info Box */}
        <Box {...styles.fileInfoBox}>
          <HStack {...styles.fileInfoLeft}>
            <LucideIcon name="FileText" size={styles.fileInfoIcon.size} color={styles.fileInfoIcon.color} />
            <Text {...styles.fileNameText} numberOfLines={1}>
              {item.fileName || 'file'}
            </Text>
          </HStack>
        </Box>

        {/* Associated offering if exists */}
        {item.associatedOffering ? (
          <HStack {...styles.linkedOfferingBox}>
            <LucideIcon name="BookOpen" size={styles.linkedOfferingIcon.size} color={styles.linkedOfferingIcon.color} />
            <Text {...styles.linkedOfferingText} numberOfLines={1}>
              {t('supportProvider.materialsLibrary.card.linked', { offering: item.associatedOffering })}
            </Text>
          </HStack>
        ) : null}
      </VStack>

      <VStack>
        {/* Metadata Row: Upload Date */}
        <Box {...styles.metaRow}>
          <Text {...styles.metaItemText}>
            {t('supportProvider.materialsLibrary.card.uploaded', { date: item.uploadDate })}
          </Text>
        </Box>

        {/* Card Footer Actions */}
        <Box {...styles.cardFooterActions}>
          {/* Preview Button */}
          <Pressable
            onPress={() => onPreview(item)}
            {...styles.previewBtn}
          >
            <HStack {...styles.previewBtnRow}>
              <LucideIcon name="Eye" size={styles.previewBtnIcon.size} color={styles.previewBtnIcon.color} />
              <Text {...styles.previewBtnText}>
                {t('supportProvider.materialsLibrary.card.preview')}
              </Text>
            </HStack>
          </Pressable>

          {/* Download Button */}
          <Pressable
            onPress={() => onDownload(item.id)}
            {...styles.downloadBtn}
          >
            <HStack {...styles.downloadBtnRow}>
              <LucideIcon name="Download" size={styles.downloadBtnIcon.size} color={styles.downloadBtnIcon.color} />
              <Text {...styles.downloadBtnText}>
                {t('supportProvider.materialsLibrary.card.download')}
              </Text>
            </HStack>
          </Pressable>
        </Box>
      </VStack>
    </Box>
  );
}
