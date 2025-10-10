/**
 * FileUploadExample
 * Demonstrates various ways to use the FileUploadModal component
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import FileUploadModal from '../components/FileUploadModal';
import { UploadedFile } from '../services/FileUploadService';
import { FileStorageService } from '../services/FileStorageService';
import Alert from '../components/ui/alert';
import FileCard from '../components/ui/file_card/card';
import Layout from '../components/layout/Layout';

const defaultButtons = [
  {
    key: 'both',
    title: 'Both Modes',
    subtitle: 'Store + Process',
    isDefault: true,
  },
];
const otherButtons = [
  {
    key: 'legacy',
    title: 'Legacy Mode',
    subtitle: 'Backward compatible',
    isDefault: true,
  },
  {
    key: 'function',
    title: 'Function Mode',
    subtitle: 'Process without storing',
    isDefault: true,
  },
  {
    key: 'storage',
    title: 'Storage Mode',
    subtitle: 'Store and get ID',
    isDefault: true,
  },
];

const FileUploadExample: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [uploadMode, setUploadMode] = useState<
    'legacy' | 'function' | 'storage' | 'both'
  >('legacy');
  const [uploadedFiles, setUploadedFiles] = useState<Array<UploadedFile>>([]);
  const [storageInfo, setStorageInfo] = useState<string>('');

  useEffect(() => {
    updateStorageInfo();
  }, []);

  /**
   * Example 1: Legacy mode - backward compatible
   */
  const handleLegacyUpload = async (file: UploadedFile) => {
    console.log('Legacy upload:', file);
    setUploadedFiles(prev => [...prev, file]);

    Alert.alert('Success', `File uploaded: ${file.name}`);
  };

  /**
   * Example 2: Function mode - process without storing
   */
  const handleFunctionUpload = async (fileData: UploadedFile) => {
    console.log('Function upload:', fileData);

    // Simulate uploading to server
    await new Promise(resolve => setTimeout(resolve, 1000));

    setUploadedFiles(prev => [...prev, fileData]);

    Alert.alert(
      'Success',
      `File processed: ${fileData.name}\nNot stored locally`,
    );
  };

  /**
   * Example 3: Storage mode - store and get ID
   */
  const handleStorageUpload = async (
    fileData: { fileId: string } | UploadedFile,
  ) => {
    if ('fileId' in fileData) {
      console.log('File stored with ID:', fileData.fileId);

      // Retrieve the file to show preview
      const storedFile = await FileStorageService.getFile(fileData.fileId);
      if (storedFile) {
        setUploadedFiles(prev => [...prev, storedFile as UploadedFile]);
      }

      await updateStorageInfo();
      Alert.alert('Success', `File stored with ID: ${fileData.fileId}`);
    }
  };

  /**
   * Example 4: Both modes - store and process
   */
  const handleBothModeUpload = async (fileData: { fileId: string }) => {
    console.log('File stored and ready for processing:', fileData.fileId);

    // Retrieve the file
    const storedFile = await FileStorageService.getFile(fileData.fileId);
    if (storedFile) {
      setUploadedFiles(prev => [...prev, storedFile as UploadedFile]);

      // Here you could save to evidence records, sync queue, etc.
      console.log('File ready for evidence record:', {
        evidenceId: `ev_${Date.now()}`,
        fileStorageId: fileData.fileId,
        fileName: storedFile.name,
        fileSize: storedFile.size,
      });
    }

    await updateStorageInfo();
    Alert.alert('Success', `File stored and processed: ${fileData.fileId}`);
  };

  /**
   * Update storage information
   */
  const updateStorageInfo = async () => {
    const totalSize = await FileStorageService.getStorageSize();
    const metadata = await FileStorageService.getAllFilesMetadata();
    const formatted = FileStorageService.formatFileSize(totalSize);
    console.log('metadata', metadata);
    setUploadedFiles(metadata as UploadedFile[]);
    setStorageInfo(`Files: ${metadata.length}, Total: ${formatted}`);
  };

  /**
   * Clear all stored files
   */
  const handleClearStorage = async () => {
    Alert.alert(
      'Clear Storage',
      'Are you sure you want to delete all stored files?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await FileStorageService.clearAllFiles();
            setUploadedFiles([]);
            await updateStorageInfo();
            Alert.alert('Success', 'All files cleared');
          },
        },
      ],
    );
  };

  const openUploadModal = (mode: typeof uploadMode) => {
    setUploadMode(mode);
    setModalVisible(true);
  };

  return (
    <Layout
      title="File Upload Examples"
      statusBarStyle="dark-content"
      statusBarBackgroundColor="#FFFFFF"
    >
      <View style={styles.uploadTitleContainer}>
        <TouchableOpacity
          style={[styles.button, styles.dangerButton]}
          onPress={handleClearStorage}
        >
          <Text style={styles.buttonText}>Clear All Storage</Text>
        </TouchableOpacity>
      </View>

      {/* Upload Buttons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upload Methods</Text>

        {defaultButtons.map(item => (
          <TouchableOpacity
            key={item.key}
            style={styles.button}
            onPress={() =>
              openUploadModal(
                item.key as 'legacy' | 'function' | 'storage' | 'both',
              )
            }
          >
            <Text style={styles.buttonText}>{item.title}</Text>
            <Text style={styles.buttonSubtext}>{item.subtitle}</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[styles.button]}
          onPress={() => setShowMore(prev => !prev)}
        >
          <Text style={styles.buttonText}>
            {showMore ? 'Hide Other Options ▲' : 'Other Options ▼'}
          </Text>
        </TouchableOpacity>

        {showMore &&
          otherButtons.map(item => (
            <TouchableOpacity
              key={item.key}
              style={[styles.button]}
              onPress={() =>
                openUploadModal(
                  item.key as 'legacy' | 'function' | 'storage' | 'both',
                )
              }
            >
              <Text style={styles.buttonText}>{item.title}</Text>
              <Text style={styles.buttonSubtext}>{item.subtitle}</Text>
            </TouchableOpacity>
          ))}
      </View>

      {/* Uploaded Files Preview */}
      <View style={styles.section}>
        <View style={styles.uploadTitleContainer}>
          <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>
            Uploaded Files ({uploadedFiles.length})
          </Text>
          {storageInfo && <Text style={styles.infoText}>{storageInfo}</Text>}
        </View>

        {uploadedFiles.length === 0 ? (
          <Text style={styles.emptyText}>No files uploaded yet</Text>
        ) : (
          uploadedFiles.map((file, index) => (
            <View key={file.id + index}>
              <FileCard file={file} />
            </View>
          ))
        )}
      </View>

      {/* Modal */}
      <FileUploadModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        // Conditional props based on upload mode
        {...(uploadMode === 'legacy' && { onFileSelect: handleLegacyUpload })}
        {...(uploadMode === 'function' && { file: handleFunctionUpload })}
        {...(uploadMode === 'storage' && { fileId: 'stored_file' })}
        {...(uploadMode === 'storage' && {
          onFileSelect: handleStorageUpload as any,
        })}
        {...(uploadMode === 'both' && {
          file: handleBothModeUpload,
          fileId: 'evidence_file',
        })}
        title={`Upload File - ${uploadMode.toUpperCase()}`}
        description={getModeDescription(uploadMode)}
        maxFileSize={100 * 1024 * 1024} // 100mb
      />
    </Layout>
  );
};

const getModeDescription = (mode: string): string => {
  switch (mode) {
    case 'legacy':
      return 'Using onFileSelect prop (backward compatible)';
    case 'function':
      return 'Using file prop - process without storing';
    case 'storage':
      return 'Using fileId prop - store and return ID';
    case 'both':
      return 'Using file + fileId props - store and process';
    default:
      return 'Select an upload method';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 16,
  },
  uploadTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
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
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#ffa634',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonSubtext: {
    color: '#FFFFFF',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
    opacity: 0.8,
  },
  infoButton: {
    backgroundColor: '#2196F3',
  },
  dangerButton: {
    backgroundColor: '#DC3545',
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#1976D2',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 20,
  },
  fileCard: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  preview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  fileId: {
    fontSize: 12,
    color: '#6C757D',
  },
});

export default FileUploadExample;
