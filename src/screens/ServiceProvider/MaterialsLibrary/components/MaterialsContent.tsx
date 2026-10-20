import React, { useState } from 'react';
import { Box, VStack, Text } from '@gluestack-ui/themed';
import { useAlert } from '@ui';
import LucideIcon from '@components/ui/LucideIcon';
import { useLanguage } from '@contexts/LanguageContext';
import { openDownload } from '@utils/helper';
import MaterialCard from './MaterialCard';
import UploadResourceModal from './UploadResourceModal';
import PreviewModal from './PreviewModal';
import styles from '../styles';
import {
  uploadMaterial,
  deleteMaterial,
  incrementDownloads,
  MaterialItem,
} from '../../../../services/serviceProvider/MaterialsLibrary/materialsLibraryService';

export interface MaterialsContentProps {
  materials: MaterialItem[];
  fetchMaterials: () => Promise<void>;
  isUploadOpen: boolean;
  onUploadClose: () => void;
  /** Category options (from the categories API) for the upload form */
  categoryOptions?: { label: string; value: string }[];
}

export default function MaterialsContent({
  materials,
  fetchMaterials,
  isUploadOpen,
  onUploadClose,
  categoryOptions = [],
}: MaterialsContentProps): React.JSX.Element {
  const { showAlert } = useAlert();
  const { t } = useLanguage();

  // Modal State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<MaterialItem | null>(null);

  // Upload handler
  const handleUpload = async (payload: {
    title: string;
    description: string;
    category: string;
    format: string;
    fileName: string;
    associatedOffering: string;
  }) => {
    try {
      const res = await uploadMaterial(payload);
      if (res.success) {
        showAlert('success', 'supportProvider.materialsLibrary.uploadModal.successMsg');
        fetchMaterials();
      }
    } catch (error) {
      showAlert('error', 'supportProvider.materialsLibrary.uploadModal.errorMsg');
    }
  };

  // Immediate delete handler
  const handleDeleteImmediate = async (id: string) => {
    try {
      const res = await deleteMaterial(id);
      if (res.success) {
        showAlert('success', 'supportProvider.materialsLibrary.deleteModal.successMsg');
        fetchMaterials();
      }
    } catch (error) {
      showAlert('error', 'common.serverError500');
    }
  };

  // Download handler
  const handleDownload = async (id: string) => {
    const item = materials.find(material => material.id === id) || activeItem;

    if (!item?.fileUrl) {
      showAlert('error', 'supportProvider.materialsLibrary.card.fileNotAvailable');
      return;
    }

    await openDownload(item.fileUrl, t, showAlert);

    try {
      const res = await incrementDownloads(id);
      if (res.success) {
        if (activeItem && activeItem.id === id) {
          setActiveItem(prev => (prev ? { ...prev, downloads: res.downloads } : null));
        }
        fetchMaterials();
      }
    } catch (error) {
      console.error('[MaterialsContent] Error incrementing downloads:', error);
    }
  };

  const handleOpenPreview = (item: MaterialItem) => {
    setActiveItem(item);
    setIsPreviewOpen(true);
  };

  return (
    <VStack {...styles.contentVStack}>
      {/* Card Grid list */}
      {materials.length === 0 ? (
        <Box {...styles.emptyStateBox}>
          <LucideIcon name="FileX" size={styles.emptyStateIcon.size} color={styles.emptyStateIcon.color} />
          <Text {...styles.emptyStateText}>
            No resources found matching the filter criteria.
          </Text>
        </Box>
      ) : (
        <Box {...styles.cardsGrid}>
          {materials.map((item) => (
            <Box key={item.id} {...styles.cardWrapper}>
              <MaterialCard
                item={item}
                onPreview={handleOpenPreview}
                onDelete={(card) => handleDeleteImmediate(card.id)}
                onDownload={handleDownload}
              />
            </Box>
          ))}
        </Box>
      )}

      {/* Modals */}
      <UploadResourceModal
        isOpen={isUploadOpen}
        onClose={onUploadClose}
        onUpload={handleUpload}
        categoryOptions={categoryOptions}
      />

      <PreviewModal
        isOpen={isPreviewOpen}
        onClose={() => {
          setIsPreviewOpen(false);
          setActiveItem(null);
        }}
        item={activeItem}
        onDownload={handleDownload}
      />
    </VStack>
  );
}
