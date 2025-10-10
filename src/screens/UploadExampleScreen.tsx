/**
 * UploadExampleScreen
 * Demonstrates file upload functionality across Web & Mobile platforms
 * Features: Camera, Image Library, Document Picker, Storage, Notifications
 * Accessible via Keyboard and Screen Reader
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  FileUploadService,
  UploadedFile,
  PermissionStatus,
} from '../services/FileUploadService';

interface UploadExampleScreenProps {
  navigation: any;
}

const UploadExampleScreen: React.FC<UploadExampleScreenProps> = ({
  navigation,
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState({
    camera: false,
    storage: false,
    notification: false,
  });

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const cameraPermission = await FileUploadService.requestCameraPermission();
    const storagePermission =
      await FileUploadService.requestStoragePermission();
    const notificationPermission =
      await FileUploadService.requestNotificationPermission();

    setPermissions({
      camera: cameraPermission.granted,
      storage: storagePermission.granted,
      notification: notificationPermission.granted,
    });
  };

  const handleCameraCapture = async () => {
    setLoading(true);
    try {
      const file = await FileUploadService.openCamera({
        maxSize: 5 * 1024 * 1024, // 5MB
        quality: 0.8,
      });

      if (file) {
        setUploadedFiles(prev => [...prev, file]);
        Alert.alert('Success', `Photo captured: ${file.name}`);

        // Simulate upload notification
        if (permissions.notification) {
          FileUploadService.showUploadNotification(file.name, 100);
        }
      }
    } catch (error) {
      console.error('Camera capture error:', error);
      Alert.alert('Error', 'Failed to capture photo');
    } finally {
      setLoading(false);
    }
  };

  const handleImageLibrary = async () => {
    setLoading(true);
    try {
      const file = await FileUploadService.openImageLibrary({
        maxSize: 10 * 1024 * 1024, // 10MB
        quality: 0.9,
      });

      if (file) {
        setUploadedFiles(prev => [...prev, file]);
        Alert.alert('Success', `Image selected: ${file.name}`);
      }
    } catch (error) {
      console.error('Image library error:', error);
      Alert.alert('Error', 'Failed to select image');
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentPicker = async () => {
    setLoading(true);
    try {
      const file = await FileUploadService.openDocumentPicker(undefined, {
        maxSize: 15 * 1024 * 1024, // 15MB
      });

      if (file) {
        setUploadedFiles(prev => [...prev, file]);
        Alert.alert('Success', `Document selected: ${file.name}`);
      }
    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert('Error', 'Failed to select document');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToStorage = async (file: UploadedFile) => {
    setLoading(true);
    try {
      const result = await FileUploadService.saveToStorage(file.uri, file.name);
      if (result.success) {
        Alert.alert('Success', `File saved to: ${result.path}`, [
          { text: 'OK' },
        ]);
      } else {
        Alert.alert('Error', result.error || 'Failed to save file');
      }
    } catch (error) {
      console.error('Save to storage error:', error);
      Alert.alert('Error', 'Failed to save file');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFile = async (file: UploadedFile) => {
    Alert.alert(
      'Delete File',
      `Are you sure you want to delete ${file.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const deleted = await FileUploadService.deleteFile(file.uri);
            if (deleted || Platform.OS === 'web') {
              setUploadedFiles(prev => prev.filter(f => f.id !== file.id));
              Alert.alert('Success', 'File deleted');
            } else {
              Alert.alert('Error', 'Failed to delete file');
            }
          },
        },
      ],
    );
  };

  const renderPermissionStatus = () => (
    <View style={styles.permissionsCard}>
      <Text style={styles.sectionTitle}>Permissions Status</Text>
      <View style={styles.permissionRow}>
        <Text style={styles.permissionLabel}>📷 Camera:</Text>
        <Text
          style={[
            styles.permissionStatus,
            permissions.camera ? styles.granted : styles.denied,
          ]}
        >
          {permissions.camera ? 'Granted' : 'Denied'}
        </Text>
      </View>
      <View style={styles.permissionRow}>
        <Text style={styles.permissionLabel}>📁 Storage:</Text>
        <Text
          style={[
            styles.permissionStatus,
            permissions.storage ? styles.granted : styles.denied,
          ]}
        >
          {permissions.storage ? 'Granted' : 'Denied'}
        </Text>
      </View>
      <View style={styles.permissionRow}>
        <Text style={styles.permissionLabel}>🔔 Notifications:</Text>
        <Text
          style={[
            styles.permissionStatus,
            permissions.notification ? styles.granted : styles.denied,
          ]}
        >
          {permissions.notification ? 'Granted' : 'Denied'}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.refreshButton}
        onPress={checkPermissions}
        accessibilityLabel="Refresh permissions status"
        accessibilityRole="button"
      >
        <Text style={styles.refreshButtonText}>🔄 Refresh Permissions</Text>
      </TouchableOpacity>
    </View>
  );

  const renderUploadButtons = () => (
    <View style={styles.uploadButtonsCard}>
      <Text style={styles.sectionTitle}>Upload Options</Text>

      <TouchableOpacity
        style={[styles.uploadButton, styles.cameraButton]}
        onPress={handleCameraCapture}
        disabled={loading || !permissions.camera}
        accessibilityLabel="Open camera to take a photo"
        accessibilityRole="button"
        accessibilityHint="Takes a photo using your device camera"
      >
        <Text style={styles.uploadButtonIcon}>📷</Text>
        <View style={styles.uploadButtonContent}>
          <Text style={styles.uploadButtonText}>Take Photo</Text>
          <Text style={styles.uploadButtonSubtext}>
            Use camera to capture image
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.uploadButton, styles.galleryButton]}
        onPress={handleImageLibrary}
        disabled={loading || !permissions.storage}
        accessibilityLabel="Open image library to select a photo"
        accessibilityRole="button"
        accessibilityHint="Opens your image gallery to select a photo"
      >
        <Text style={styles.uploadButtonIcon}>🖼️</Text>
        <View style={styles.uploadButtonContent}>
          <Text style={styles.uploadButtonText}>Select Image</Text>
          <Text style={styles.uploadButtonSubtext}>Choose from gallery</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.uploadButton, styles.documentButton]}
        onPress={handleDocumentPicker}
        disabled={loading}
        accessibilityLabel="Open document picker to select a file"
        accessibilityRole="button"
        accessibilityHint="Opens file browser to select any document"
      >
        <Text style={styles.uploadButtonIcon}>📄</Text>
        <View style={styles.uploadButtonContent}>
          <Text style={styles.uploadButtonText}>Select Document</Text>
          <Text style={styles.uploadButtonSubtext}>PDF, DOC, TXT, etc.</Text>
        </View>
      </TouchableOpacity>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B0000" />
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      )}
    </View>
  );

  const renderFileItem = (file: UploadedFile) => {
    const isImage = file.type.startsWith('image/');

    return (
      <View key={file.id} style={styles.fileCard}>
        <View style={styles.fileHeader}>
          {isImage && file.uri ? (
            <Image
              source={{ uri: file.uri }}
              style={styles.fileThumbnail}
              accessibilityLabel={`Thumbnail of ${file.name}`}
            />
          ) : (
            <View style={styles.fileIconContainer}>
              <Text style={styles.fileIcon}>📎</Text>
            </View>
          )}
          <View style={styles.fileInfo}>
            <Text style={styles.fileName} numberOfLines={1}>
              {file.name}
            </Text>
            <Text style={styles.fileSize}>
              {FileUploadService.formatFileSize(file.size)}
            </Text>
            <Text style={styles.fileDate}>
              {file.uploadedAt.toLocaleDateString()}
            </Text>
          </View>
        </View>

        <View style={styles.fileActions}>
          <TouchableOpacity
            style={styles.fileActionButton}
            onPress={() => handleSaveToStorage(file)}
            accessibilityLabel={`Save ${file.name} to device storage`}
            accessibilityRole="button"
          >
            <Text style={styles.fileActionText}>💾 Save</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.fileActionButton, styles.deleteButton]}
            onPress={() => handleDeleteFile(file)}
            accessibilityLabel={`Delete ${file.name}`}
            accessibilityRole="button"
          >
            <Text style={[styles.fileActionText, styles.deleteButtonText]}>
              🗑️ Delete
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderUploadedFiles = () => (
    <View style={styles.filesCard}>
      <Text style={styles.sectionTitle}>
        Uploaded Files ({uploadedFiles.length})
      </Text>
      {uploadedFiles.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>📂</Text>
          <Text style={styles.emptyStateText}>No files uploaded yet</Text>
          <Text style={styles.emptyStateSubtext}>
            Use the buttons above to upload files
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.filesList}
          showsVerticalScrollIndicator={false}
        >
          {uploadedFiles.map(renderFileItem)}
        </ScrollView>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back to previous screen"
          accessibilityRole="button"
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>File Upload Example</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Platform Info */}
      <View style={styles.platformInfo}>
        <Text style={styles.platformText}>
          Platform: {Platform.OS === 'web' ? '🌐 Web' : '📱 Mobile'} (
          {Platform.OS})
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {renderPermissionStatus()}
        {renderUploadButtons()}
        {renderUploadedFiles()}

        {/* Usage Notes */}
        <View style={styles.notesCard}>
          <Text style={styles.sectionTitle}>📝 Usage Notes</Text>
          <Text style={styles.noteText}>
            • <Text style={styles.noteBold}>Camera:</Text> Takes photos on both
            web and mobile
          </Text>
          <Text style={styles.noteText}>
            • <Text style={styles.noteBold}>Image Library:</Text> Selects from
            gallery/photos
          </Text>
          <Text style={styles.noteText}>
            • <Text style={styles.noteBold}>Documents:</Text> Picks any file
            type (PDF, DOC, etc.)
          </Text>
          <Text style={styles.noteText}>
            • <Text style={styles.noteBold}>Storage:</Text> Saves files to
            device storage
          </Text>
          <Text style={styles.noteText}>
            • <Text style={styles.noteBold}>Notifications:</Text> Shows upload
            progress
          </Text>
          <Text style={styles.noteText}>
            • <Text style={styles.noteBold}>Accessibility:</Text> Keyboard &
            screen reader support
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#8B0000',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 60,
  },
  platformInfo: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    alignItems: 'center',
  },
  platformText: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  permissionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 16,
  },
  permissionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  permissionLabel: {
    fontSize: 16,
    color: '#495057',
  },
  permissionStatus: {
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  granted: {
    color: '#28A745',
    backgroundColor: '#D4EDDA',
  },
  denied: {
    color: '#DC3545',
    backgroundColor: '#F8D7DA',
  },
  refreshButton: {
    backgroundColor: '#E9ECEF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  refreshButtonText: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '500',
  },
  uploadButtonsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  cameraButton: {
    backgroundColor: '#E3F2FD',
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  galleryButton: {
    backgroundColor: '#F3E5F5',
    borderLeftWidth: 4,
    borderLeftColor: '#9C27B0',
  },
  documentButton: {
    backgroundColor: '#FFF3E0',
    borderLeftWidth: 4,
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
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6C757D',
  },
  filesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    maxHeight: 400,
  },
  filesList: {
    flex: 1,
  },
  fileCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  fileHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  fileThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 6,
    backgroundColor: '#E9ECEF',
  },
  fileIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 6,
    backgroundColor: '#E9ECEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileIcon: {
    fontSize: 28,
  },
  fileInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 12,
    color: '#6C757D',
    marginBottom: 2,
  },
  fileDate: {
    fontSize: 12,
    color: '#6C757D',
  },
  fileActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  fileActionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#E9ECEF',
  },
  fileActionText: {
    fontSize: 12,
    color: '#495057',
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#F8D7DA',
  },
  deleteButtonText: {
    color: '#DC3545',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6C757D',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#ADB5BD',
  },
  notesCard: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  noteText: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 22,
    marginBottom: 8,
  },
  noteBold: {
    fontWeight: '600',
    color: '#2C3E50',
  },
});

export default UploadExampleScreen;
