/**
 * FileUploadModal Component
 * Reusable modal for file uploads with Camera, Gallery, and Document options
 * Can be used anywhere in the app by passing onFileSelect callback
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { FileUploadService, UploadedFile } from '../services/FileUploadService';
import { FileStorageService } from '../services/FileStorageService';
import Alert from '../components/ui/alert';
import { checkPermissions } from '../utils/permision';
interface FileUploadModalProps {
  visible: boolean;
  onClose: () => void;
  // Legacy prop for backward compatibility
  onFileSelect?: (file: UploadedFile) => void | Promise<void>;
  // New props
  file?: (fileData: UploadedFile | { fileId: string }) => void | Promise<void>; // Function to receive file
  fileId?: string; // If provided, file will be saved to storage
  title?: string;
  description?: string;
  maxFileSize?: number; // Optional max file size override
}

const FileUploadModal: React.FC<FileUploadModalProps> = ({
  visible,
  onClose,
  onFileSelect,
  file,
  fileId,
  title = 'Upload File',
  description,
  maxFileSize,
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const abortControllerRef = useRef<{ cancelled: boolean }>({
    cancelled: false,
  });

  /**
   * Reset upload state
   */
  const resetState = useCallback(() => {
    setUploading(false);
    setUploadProgress(0);
    setUploadStatus('');
    abortControllerRef.current.cancelled = false;
  }, []);

  /**
   * Handle cancel - reset state and close
   */
  const handleCancel = useCallback(() => {
    if (uploading) {
      abortControllerRef.current.cancelled = true;
      setUploadStatus('Cancelling...');
    }
    resetState();
    onClose();
  }, [uploading, onClose, resetState]);

  /**
   * Handle file processing: either store or pass to function
   */
  const processFile = useCallback(
    async (uploadedFile: UploadedFile) => {
      try {
        // Check for cancellation
        if (abortControllerRef.current.cancelled) {
          return null;
        }

        // If file function is provided, pass the file to it (don't store)
        if (file) {
          setUploadStatus('Processing file...');
          setUploadProgress(60);

          // If fileId is also provided, store the file and pass the fileId
          if (fileId) {
            setUploadStatus('Saving to storage...');
            setUploadProgress(70);

            const result = await FileStorageService.saveFile(
              uploadedFile.base64Data || uploadedFile.uri,
              uploadedFile.name,
              uploadedFile.type,
              uploadedFile.size,
              { originalId: uploadedFile.id },
            );

            if (abortControllerRef.current.cancelled) {
              return null;
            }

            setUploadProgress(90);

            if (result.success && result.fileId) {
              await file({ fileId: result.fileId });
              return result.fileId;
            } else {
              throw new Error(result.error || 'Failed to save file');
            }
          } else {
            // Just pass the file data without storing
            setUploadProgress(80);
            await file(uploadedFile);
            return uploadedFile.id;
          }
        }
        // If fileId is provided without file function, just store
        else if (fileId) {
          setUploadStatus('Saving to storage...');
          setUploadProgress(70);

          const result = await FileStorageService.saveFile(
            uploadedFile.base64Data || uploadedFile.uri,
            uploadedFile.name,
            uploadedFile.type,
            uploadedFile.size,
            { originalId: uploadedFile.id },
          );

          if (abortControllerRef.current.cancelled) {
            return null;
          }

          setUploadProgress(90);

          if (result.success && result.fileId) {
            // Call legacy onFileSelect if provided
            if (onFileSelect) {
              await onFileSelect({ ...uploadedFile, id: result.fileId });
            }
            return result.fileId;
          } else {
            throw new Error(result.error || 'Failed to save file');
          }
        }
        // Legacy behavior: just call onFileSelect
        else if (onFileSelect) {
          setUploadProgress(80);
          await onFileSelect(uploadedFile);
          return uploadedFile.id;
        }

        return uploadedFile.id;
      } catch (error) {
        console.error('Error processing file:', error);
        throw error;
      }
    },
    [file, fileId, onFileSelect],
  );

  /**
   * Handle camera upload (Web & Mobile)
   */
  const handleUploadCamera = useCallback(async () => {
    try {
      abortControllerRef.current.cancelled = false;
      setUploading(true);
      setUploadProgress(0);
      setUploadStatus('Opening camera...');
      const permissions = await checkPermissions('camera');

      if (!permissions.camera) {
        Alert.alert('Error', 'Camera permission denied');
        resetState();
        return;
      }

      if (abortControllerRef.current.cancelled) {
        resetState();
        return;
      }

      const uploadedFile = await FileUploadService.openCamera({
        maxSize: maxFileSize || 10 * 1024 * 1024, // 10MB default
        quality: 0.8,
        includeBase64: true,
        onProgress: progress => {
          if (!abortControllerRef.current.cancelled) {
            setUploadProgress(progress);
            setUploadStatus(`Capturing photo... ${progress}%`);
          }
        },
      });

      // Check if cancelled after file picker returns
      if (abortControllerRef.current.cancelled) {
        resetState();
        return;
      }

      if (uploadedFile) {
        // processFile will handle progress updates from here
        await processFile(uploadedFile);

        if (!abortControllerRef.current.cancelled) {
          setUploadProgress(100);
          setUploadStatus('Complete!');
          // Small delay to show 100% before closing
          await new Promise(resolve => setTimeout(resolve, 300));
          resetState();
          onClose();
          Alert.alert('Success', 'Photo captured and saved successfully');
        } else {
          resetState();
        }
      } else {
        // User cancelled from native picker
        resetState();
      }
    } catch (error) {
      console.error('Camera error:', error);
      if (!abortControllerRef.current.cancelled) {
        Alert.alert(
          'Error',
          error instanceof Error ? error.message : 'Failed to capture photo',
        );
      }
      resetState();
    }
  }, [maxFileSize, processFile, onClose, resetState]);

  const handleUploadGallery = useCallback(async () => {
    try {
      abortControllerRef.current.cancelled = false;
      setUploading(true);
      setUploadProgress(0);
      setUploadStatus('Opening gallery...');

      if (abortControllerRef.current.cancelled) {
        resetState();
        return;
      }

      const uploadedFile = await FileUploadService.openImageLibrary({
        maxSize: maxFileSize || 15 * 1024 * 1024, // 15MB default
        quality: 0.9,
        includeBase64: true,
        onProgress: progress => {
          if (!abortControllerRef.current.cancelled) {
            setUploadProgress(progress);
            setUploadStatus(`Loading image... ${progress}%`);
          }
        },
      });

      // Check if cancelled after file picker returns
      if (abortControllerRef.current.cancelled) {
        resetState();
        return;
      }

      if (uploadedFile) {
        // processFile will handle progress updates from here
        await processFile(uploadedFile);

        if (!abortControllerRef.current.cancelled) {
          setUploadProgress(100);
          setUploadStatus('Complete!');
          // Small delay to show 100% before closing
          await new Promise(resolve => setTimeout(resolve, 300));
          resetState();
          onClose();
          Alert.alert('Success', 'Image selected and saved successfully');
        } else {
          resetState();
        }
      } else {
        // User cancelled from native picker
        resetState();
      }
    } catch (error) {
      console.error('Gallery error:', error);
      if (!abortControllerRef.current.cancelled) {
        Alert.alert(
          'Error',
          error instanceof Error ? error.message : 'Failed to select image',
        );
      }
      resetState();
    }
  }, [maxFileSize, processFile, onClose, resetState]);

  const handleUploadDocument = useCallback(async () => {
    try {
      abortControllerRef.current.cancelled = false;
      setUploading(true);
      setUploadProgress(0);
      setUploadStatus('Opening file picker...');

      if (abortControllerRef.current.cancelled) {
        resetState();
        return;
      }

      const uploadedFile = await FileUploadService.openDocumentPicker(
        undefined,
        {
          maxSize: maxFileSize || 20 * 1024 * 1024, // 20MB default
          includeBase64: true,
          onProgress: progress => {
            if (!abortControllerRef.current.cancelled) {
              setUploadProgress(progress);
              setUploadStatus(`Loading document... ${progress}%`);
            }
          },
        },
      );

      // Check if cancelled after file picker returns
      if (abortControllerRef.current.cancelled) {
        resetState();
        return;
      }

      if (uploadedFile) {
        // processFile will handle progress updates from here
        await processFile(uploadedFile);

        if (!abortControllerRef.current.cancelled) {
          setUploadProgress(100);
          setUploadStatus('Complete!');
          // Small delay to show 100% before closing
          await new Promise(resolve => setTimeout(resolve, 300));
          resetState();
          onClose();
          Alert.alert('Success', 'Document selected and saved successfully');
        } else {
          resetState();
        }
      } else {
        // User cancelled from native picker
        resetState();
      }
    } catch (error) {
      console.error('Document error:', error);
      if (!abortControllerRef.current.cancelled) {
        Alert.alert(
          'Error',
          error instanceof Error ? error.message : 'Failed to select document',
        );
      }
      resetState();
    }
  }, [maxFileSize, processFile, onClose, resetState]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={handleCancel} disabled={uploading}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Description */}
          {description && (
            <View style={styles.modalItemInfo}>
              <Text style={styles.modalItemText}>{description}</Text>
            </View>
          )}

          <Text style={styles.modalSectionTitle}>Upload Options</Text>

          {/* Camera Button */}
          <TouchableOpacity
            style={[styles.uploadButton, styles.cameraButton]}
            onPress={handleUploadCamera}
            disabled={uploading}
            accessibilityLabel="Take a photo with camera"
            accessibilityRole="button"
          >
            <Text style={styles.uploadButtonIcon}>📷</Text>
            <View style={styles.uploadButtonContent}>
              <Text style={styles.uploadButtonText}>Take Photo</Text>
              <Text style={styles.uploadButtonSubtext}>
                Use camera to capture image
              </Text>
            </View>
          </TouchableOpacity>

          {/* Gallery Button */}
          <TouchableOpacity
            style={[styles.uploadButton, styles.galleryButton]}
            onPress={handleUploadGallery}
            disabled={uploading}
            accessibilityLabel="Select image from gallery"
            accessibilityRole="button"
          >
            <Text style={styles.uploadButtonIcon}>🖼️</Text>
            <View style={styles.uploadButtonContent}>
              <Text style={styles.uploadButtonText}>Select Image</Text>
              <Text style={styles.uploadButtonSubtext}>
                Choose from gallery
              </Text>
            </View>
          </TouchableOpacity>

          {/* Document Button */}
          <TouchableOpacity
            style={[styles.uploadButton, styles.documentButton]}
            onPress={handleUploadDocument}
            disabled={uploading}
            accessibilityLabel="Select document file"
            accessibilityRole="button"
          >
            <Text style={styles.uploadButtonIcon}>📄</Text>
            <View style={styles.uploadButtonContent}>
              <Text style={styles.uploadButtonText}>Select Document</Text>
              <Text style={styles.uploadButtonSubtext}>
                PDF, DOC, TXT, etc.
              </Text>
            </View>
          </TouchableOpacity>

          {/* Loading Indicator with Progress */}
          {uploading && (
            <View style={styles.modalLoadingContainer}>
              <ActivityIndicator size="large" color="#8B0000" />
              <View style={styles.progressContainer}>
                <View style={styles.progressBarBackground}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${uploadProgress}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>{uploadProgress}%</Text>
              </View>
              <Text style={styles.modalLoadingText}>
                {uploadStatus || 'Processing...'}
              </Text>
            </View>
          )}

          {/* Cancel Button */}
          <TouchableOpacity
            style={styles.modalCancelButton}
            onPress={handleCancel}
          >
            <Text style={styles.modalCancelText}>
              {uploading ? 'Cancel Upload' : 'Cancel'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  modalCloseText: {
    fontSize: 28,
    color: '#6C757D',
    fontWeight: '300',
  },
  modalItemInfo: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  modalItemText: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '500',
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 12,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  cameraButton: {
    backgroundColor: '#E3F2FD',
    borderLeftColor: '#2196F3',
  },
  galleryButton: {
    backgroundColor: '#F3E5F5',
    borderLeftColor: '#9C27B0',
  },
  documentButton: {
    backgroundColor: '#FFF3E0',
    borderLeftColor: '#FF9800',
  },
  uploadButtonIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  uploadButtonContent: {
    flex: 1,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  uploadButtonSubtext: {
    fontSize: 13,
    color: '#6C757D',
  },
  modalLoadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  progressContainer: {
    width: '100%',
    marginTop: 16,
    marginBottom: 8,
  },
  progressBarBackground: {
    width: '100%',
    height: 8,
    backgroundColor: '#E9ECEF',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#8B0000',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    textAlign: 'center',
  },
  modalLoadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6C757D',
  },
  modalCancelButton: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#6C757D',
    fontWeight: '600',
  },
});

export default FileUploadModal;
