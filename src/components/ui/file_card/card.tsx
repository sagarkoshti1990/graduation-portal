import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
} from 'react-native';
import { UploadedFile } from '../../../services/FileUploadService';
import { FileStorageService } from '../../../services/FileStorageService';

const FileCard: React.FC<{ file: UploadedFile }> = ({ file }) => {
  const [isPreviewVisible, setIsPreviewVisible] = useState<
    | {
        fileUri: string;
      }
    | false
  >(false);

  const getFileType = (mimeType = '') => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'other';
  };

  const type = getFileType(file.type);

  const handlePress = async () => {
    const data = await FileStorageService.getFile(file.id);
    const url = data?.base64Data;
    setIsPreviewVisible({ fileUri: url || '' });
  };

  const renderIcon = () => {
    switch (type) {
      case 'image':
        return <Text style={cardStyles.icon}>🖼️</Text>;
      case 'video':
        return <Text style={cardStyles.icon}>🎥</Text>;
      case 'pdf':
        return <Text style={cardStyles.icon}>📄</Text>;
      case 'audio':
        return <Text style={cardStyles.icon}>🎧</Text>;
      default:
        return <Text style={cardStyles.icon}>📁</Text>;
    }
  };

  return (
    <>
      <TouchableOpacity style={cardStyles.card} onPress={handlePress}>
        <View style={cardStyles.thumbnailContainer}>
          <View style={[cardStyles.thumbnail, cardStyles.centered]}>
            {renderIcon()}
          </View>
        </View>

        <View style={cardStyles.fileInfo}>
          <Text style={cardStyles.fileName} numberOfLines={1}>
            {file.name}
          </Text>
          <Text style={cardStyles.fileId}>ID: {file.id}</Text>
        </View>
      </TouchableOpacity>

      {/* Preview Modal */}
      <Modal
        visible={isPreviewVisible !== false}
        transparent
        animationType="fade"
        onRequestClose={() => setIsPreviewVisible(false)}
      >
        <View style={cardStyles.modalContainer}>
          <TouchableOpacity
            style={cardStyles.closeButton}
            onPress={() => setIsPreviewVisible(false)}
          >
            <Text style={{ color: '#fff', fontSize: 22 }}>✖</Text>
          </TouchableOpacity>

          {type === 'image' && (
            <Image
              source={{
                uri: isPreviewVisible !== false ? isPreviewVisible.fileUri : '',
              }}
              style={cardStyles.fullPreview}
              resizeMode="contain"
            />
          )}

          {type === 'video' && Platform.OS === 'web' && (
            <video
              src={isPreviewVisible !== false ? isPreviewVisible.fileUri : ''}
              controls
              autoPlay
              style={{ width: '90%', height: '80%' }}
            />
          )}

          {type === 'audio' && Platform.OS === 'web' && (
            <audio
              src={isPreviewVisible !== false ? isPreviewVisible.fileUri : ''}
              controls
              autoPlay
              style={{ width: '90%' }}
            />
          )}

          {type === 'pdf' && Platform.OS === 'web' && (
            <iframe
              src={isPreviewVisible !== false ? isPreviewVisible.fileUri : ''}
              title="PDF Preview"
              width="90%"
              height="80%"
              style={{ border: 'none' }}
            />
          )}

          {Platform.OS !== 'web' && type !== 'image' && (
            <Text style={{ color: '#fff' }}>
              Preview not supported on mobile
            </Text>
          )}
        </View>
      </Modal>
    </>
  );
};

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginVertical: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    flexDirection: 'row',
    width: '100%',
  },
  thumbnailContainer: {
    position: 'relative',
  },
  thumbnail: {
    // width: '100%',
    // height: 160,
    padding: 10,
    backgroundColor: '#f1f1f1',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 48,
  },
  fileInfo: {
    padding: 10,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
  },
  fileId: {
    fontSize: 12,
    color: '#6c757d',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 2,
  },
  fullPreview: {
    width: '90%',
    height: '80%',
  },
});

export default FileCard;
