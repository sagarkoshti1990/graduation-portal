import React from 'react';
import { Box, HStack, VStack, Text, Pressable } from '@gluestack-ui/themed';
import LucideIcon from '@components/ui/LucideIcon';
import styles from '../styles';
import { useLanguage } from '@contexts/LanguageContext';
import { MaterialItem } from '../../../../services/serviceProvider/MaterialsLibrary/materialsLibraryService';

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

  const getCategoryBadgeProps = (category: string, format: string) => {
    const normCat = category.toLowerCase().trim();
    const normForm = format.toLowerCase().trim();

    let icon = 'FileText';
    let iconBg = '$error50'; // light red
    let iconBorder = '$error200';
    let iconColor = '$error600'; // dark red

    if (normCat.includes('management') || normCat.includes('business')) {
      icon = 'TrendingUp';
      iconBg = '$success50'; // light green
      iconBorder = '$success300';
      iconColor = '$success700'; // dark green
    } else if (normForm.includes('video')) {
      icon = 'Video';
      iconBg = '$purple50'; // light purple
      iconBorder = '$purple300';
      iconColor = '$purple600'; // dark purple
    } else if (normCat.includes('financial') || normCat.includes('literacy')) {
      icon = 'BookOpen';
      iconBg = '$primary100'; // light primary/reddish
      iconBorder = '$primary300';
      iconColor = '$primary500'; // dark primary
    } else if (normCat.includes('asset') || normCat.includes('equipment')) {
      icon = 'Package';
      iconBg = '$blue50'; // light blue
      iconBorder = '$blue200';
      iconColor = '$blue600'; // dark blue
    }

    return { icon, iconBg, iconBorder, iconColor };
  };

  const badge = getCategoryBadgeProps(item.category, item.format);

  return (
    <Box {...styles.materialCard}>
      <VStack>
        {/* Card Header with Icon Box on left, Pill and Title on right */}
        <HStack space="md" alignItems="center" mb="$3" width="100%">
          <Box
            {...styles.cardHeaderIconBox}
            bg={(badge.iconBg) as any}
            borderColor={(badge.iconBorder) as any}
          >
            <LucideIcon name={badge.icon} size={20} color={badge.iconColor} />
          </Box>
          <VStack flex={1}>
            <Box alignSelf="flex-start">
              <HStack {...styles.categoryBadgeCard}>
                <Text {...styles.categoryBadgeTextCard}>
                  {item.category}
                </Text>
              </HStack>
            </Box>
            <Text {...styles.cardTitle} numberOfLines={1}>
              {item.title}
            </Text>
          </VStack>
        </HStack>

        {/* Card Description */}
        <Text {...styles.cardDescription} numberOfLines={3}>
          {item.description}
        </Text>

        {/* File Info Box */}
        <Box {...styles.fileInfoBox}>
          <HStack {...styles.fileInfoLeft}>
            <LucideIcon name="FileText" size={14} color="$textSecondary" />
            <Text {...styles.fileNameText} numberOfLines={1}>
              {item.fileName || 'file'}
            </Text>
          </HStack>
          <Text {...styles.fileSizeText}>
            {item.fileSize}
          </Text>
        </Box>

        {/* Associated offering if exists */}
        {item.associatedOffering ? (
          <HStack {...styles.linkedOfferingBox}>
            <LucideIcon name="Link2" size={14} color="$blue700" />
            <Text {...styles.linkedOfferingText} numberOfLines={1}>
              {t('supportProvider.materialsLibrary.card.linked', { offering: item.associatedOffering })}
            </Text>
          </HStack>
        ) : null}
      </VStack>

      <VStack>
        {/* Metadata Row: Upload Date and Downloads */}
        <Box {...styles.metaRow}>
          <Text {...styles.metaItemText}>
            {t('supportProvider.materialsLibrary.card.uploaded', { date: item.uploadDate })}
          </Text>
          <HStack {...styles.downloadsBox}>
            <LucideIcon name="Download" size={12} color="$success700" />
            <Text {...styles.downloadsText}>
              {t('supportProvider.materialsLibrary.card.downloads', { count: item.downloads })}
            </Text>
          </HStack>
        </Box>

        {/* Card Footer Actions */}
        <Box {...styles.cardFooterActions}>
          <HStack space="xs" alignItems="center">
            {/* Preview Button */}
            <Pressable
              onPress={() => onPreview(item)}
              {...styles.previewBtn}
            >
              <HStack space="xs" alignItems="center">
                <LucideIcon name="Eye" size={14} color="$textPrimary" />
                <Text {...styles.previewBtnText}>
                  {t('supportProvider.materialsLibrary.card.preview')}
                </Text>
              </HStack>
            </Pressable>

            {/* Delete Button */}
            <Pressable
              onPress={() => onDelete(item)}
              {...styles.deleteBtn}
            >
              <LucideIcon name="Trash2" size={14} color="$red600" />
            </Pressable>
          </HStack>

          {/* Download Button */}
          <Pressable
            onPress={() => onDownload(item.id)}
            {...styles.downloadBtn}
          >
            <HStack space="xs" alignItems="center">
              <LucideIcon name="Download" size={14} color="$white" />
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
