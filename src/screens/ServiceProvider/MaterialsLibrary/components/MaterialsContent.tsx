import React, { useState } from 'react';
import { Box, HStack, VStack, Text } from '@gluestack-ui/themed';
import { useAlert } from '@ui';
import LucideIcon from '@components/ui/LucideIcon';
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
}

export default function MaterialsContent({
  materials,
  fetchMaterials,
  isUploadOpen,
  onUploadClose,
}: MaterialsContentProps): React.JSX.Element {
  const { showAlert } = useAlert();

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
    try {
      const res = await incrementDownloads(id);
      if (res.success) {
        showAlert('success', 'supportProvider.materialsLibrary.previewModal.downloadFile');
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
    <VStack space="lg" width="100%">
      {/* Card Grid list */}
      {materials.length === 0 ? (
        <Box py="$10" alignItems="center" justifyContent="center">
          <LucideIcon name="FileX" size={48} color="$textMuted" />
          <Text color="$textSecondary" mt="$3" fontSize="$sm">
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
