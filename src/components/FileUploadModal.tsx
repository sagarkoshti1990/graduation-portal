/**
 * FileUploadModal Component
 * Reusable modal for file uploads with Camera, Gallery, and Document options
 * Can be used anywhere in the app by passing onFileSelect callback
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { FileUploadService, UploadedFile } from '../services/FileUploadService';

interface FileUploadModalProps {
  visible: boolean;
  onClose: () => void;
  onFileSelect: (file: UploadedFile) => void | Promise<void>;
  title?: string;
  description?: string;
}

const FileUploadModal: React.FC<FileUploadModalProps> = ({
  visible,
  onClose,
  onFileSelect,
  title = 'Upload File',
  description,
}) => {
  const [uploading, setUploading] = useState(false);

  const handleUploadCamera = useCallback(async () => {
    try {
      setUploading(true);
      const file = await FileUploadService.openCamera({
        maxSize: 5 * 1024 * 1024, // 5MB
        quality: 0.8,
      });

      if (file) {
        await onFileSelect(file);
        onClose();
        Alert.alert('Success', 'Photo captured successfully');
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to capture photo');
    } finally {
      setUploading(false);
    }
  }, [onFileSelect, onClose]);

  const handleUploadGallery = useCallback(async () => {
    try {
      setUploading(true);
      const file = await FileUploadService.openImageLibrary({
        maxSize: 10 * 1024 * 1024, // 10MB
        quality: 0.9,
      });

      if (file) {
        await onFileSelect(file);
        onClose();
        Alert.alert('Success', 'Image selected successfully');
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Failed to select image');
    } finally {
      setUploading(false);
    }
  }, [onFileSelect, onClose]);

  const handleUploadDocument = useCallback(async () => {
    try {
      setUploading(true);
      const file = await FileUploadService.openDocumentPicker(undefined, {
        maxSize: 15 * 1024 * 1024, // 15MB
      });

      if (file) {
        await onFileSelect(file);
        onClose();
        Alert.alert('Success', 'Document selected successfully');
      }
    } catch (error) {
      console.error('Document error:', error);
      Alert.alert('Error', 'Failed to select document');
    } finally {
      setUploading(false);
    }
  }, [onFileSelect, onClose]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} disabled={uploading}>
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

          {/* Loading Indicator */}
          {uploading && (
            <View style={styles.modalLoadingContainer}>
              <ActivityIndicator size="large" color="#8B0000" />
              <Text style={styles.modalLoadingText}>Processing...</Text>
            </View>
          )}

          {/* Cancel Button */}
          <TouchableOpacity
            style={styles.modalCancelButton}
            onPress={onClose}
            disabled={uploading}
          >
            <Text style={styles.modalCancelText}>Cancel</Text>
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
  modalLoadingText: {
    marginTop: 12,
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
