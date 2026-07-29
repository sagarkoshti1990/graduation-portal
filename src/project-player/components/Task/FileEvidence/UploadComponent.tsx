import React, { useState } from 'react';
import { Box, VStack, HStack, Text, Pressable } from '@gluestack-ui/themed';
import { useTaskActions } from '../../../hooks/useTaskActions';
import { useProjectContext } from '../../../context/ProjectContext';
import { useLanguage } from '@contexts/LanguageContext';
import { UploadComponentProps } from '../../../types/components.types';

const UploadComponent: React.FC<UploadComponentProps> = ({
  taskId,
  attachments = [],
}) => {
  const { handleFileUpload } = useTaskActions();
  const { config } = useProjectContext();
  const { t } = useLanguage();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxFileSize = config.maxFileSize || 10; // Default 10MB

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setError(null);

    // Validate file sizes
    const maxSizeBytes = maxFileSize * 1024 * 1024;
    const invalidFiles = Array.from(files).filter(
      file => file.size > maxSizeBytes,
    );

    if (invalidFiles.length > 0) {
      setError(t('projectPlayer.fileSizeError', { maxSize: maxFileSize }));
      return;
    }

    setUploading(true);
    try {
      const fileArray = Array.from(files);
      await handleFileUpload(taskId, fileArray);
    } catch (error) {
      console.error('Upload failed:', error);
      setError(t('projectPlayer.uploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <VStack space="sm">
      <Pressable>
        <Box
          borderWidth={2}
          borderColor="$borderLight300"
          borderStyle="dashed"
          borderRadius="$md"
          padding="$4"
          alignItems="center"
        >
          <input
            type="file"
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            id={`file-upload-${taskId}`}
          />
          <label
            htmlFor={`file-upload-${taskId}`}
            style={{ cursor: 'pointer' }}
          >
            <VStack space="xs" alignItems="center">
              <Text fontSize="$sm" color="$primary500">
                {uploading
                  ? t('projectPlayer.uploading')
                  : t('projectPlayer.clickToUpload')}
              </Text>
              <Text fontSize="$xs" color="$textLight500">
                {t('projectPlayer.maxFileSize', { size: maxFileSize })}
              </Text>
            </VStack>
          </label>
        </Box>
      </Pressable>

      {error && (
        <Box
          bg="$error100"
          padding="$2"
          borderRadius="$sm"
          borderWidth={1}
          borderColor="$error300"
        >
          <Text fontSize="$xs" color="$error700">
            {error}
          </Text>
        </Box>
      )}

      {attachments.length > 0 && (
        <VStack space="xs">
          <Text fontSize="$sm" fontWeight="$medium">
            {t('projectPlayer.uploadedFiles')}:
          </Text>
          {attachments.map(attachment => (
            <HStack
              key={attachment._id}
              space="sm"
              alignItems="center"
              padding="$2"
              bg="$backgroundLight50"
              borderRadius="$sm"
            >
              <Text fontSize="$sm" flex={1}>
                {attachment.originalName ?? attachment.name}
              </Text>
              <Text fontSize="$xs" color="$textLight500">
                {(attachment.size / 1024).toFixed(1)} KB
              </Text>
            </HStack>
          ))}
        </VStack>
      )}
    </VStack>
  );
};

export default UploadComponent;
