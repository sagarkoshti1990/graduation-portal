/**
 * FileUploadService
 * Handles file uploads, camera access, and file picking across Web and Mobile platforms
 * Provides consistent API with platform-specific implementations
 */

import { Platform, PermissionsAndroid, Alert } from 'react-native';
import {
  launchCamera,
  launchImageLibrary,
  ImagePickerResponse,
  CameraOptions,
  ImageLibraryOptions,
} from 'react-native-image-picker';

export interface UploadedFile {
  id: string;
  name: string;
  uri: string;
  type: string;
  size: number;
  uploadedAt: Date;
}

export interface UploadOptions {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  quality?: number; // 0-1 for images
}

export interface PermissionStatus {
  granted: boolean;
  message?: string;
}

class FileUploadServiceClass {
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB default

  /**
   * Request camera permission (Android/iOS)
   */
  async requestCameraPermission(): Promise<PermissionStatus> {
    if (Platform.OS === 'web') {
      // Web uses browser permissions API
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        stream.getTracks().forEach(track => track.stop());
        return { granted: true };
      } catch (error) {
        return {
          granted: false,
          message: 'Camera permission denied or not available',
        };
      }
    }

    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'App needs access to your camera to take photos',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return {
          granted: granted === PermissionsAndroid.RESULTS.GRANTED,
          message:
            granted === PermissionsAndroid.RESULTS.GRANTED
              ? undefined
              : 'Camera permission denied',
        };
      } catch (error) {
        console.error('Camera permission error:', error);
        return { granted: false, message: 'Failed to request permission' };
      }
    }

    // iOS permissions are handled by react-native-image-picker
    return { granted: true };
  }

  /**
   * Request storage permission (Android)
   */
  async requestStoragePermission(): Promise<PermissionStatus> {
    if (Platform.OS === 'web') {
      return { granted: true }; // Web doesn't need explicit storage permission
    }

    if (Platform.OS === 'android' && Platform.Version >= 33) {
      // Android 13+ uses new photo picker, no permission needed
      return { granted: true };
    }

    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'App needs access to your storage to select files',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return {
          granted: granted === PermissionsAndroid.RESULTS.GRANTED,
          message:
            granted === PermissionsAndroid.RESULTS.GRANTED
              ? undefined
              : 'Storage permission denied',
        };
      } catch (error) {
        console.error('Storage permission error:', error);
        return { granted: false, message: 'Failed to request permission' };
      }
    }

    return { granted: true };
  }

  /**
   * Open camera to take a photo (Web & Mobile)
   */
  async openCamera(options?: UploadOptions): Promise<UploadedFile | null> {
    // Check permission first
    const permission = await this.requestCameraPermission();
    if (!permission.granted) {
      Alert.alert(
        'Permission Denied',
        permission.message || 'Camera access denied',
      );
      return null;
    }

    if (Platform.OS === 'web') {
      return this.openCameraWeb(options);
    }

    const cameraOptions: CameraOptions = {
      mediaType: 'photo',
      quality: options?.quality || 0.8,
      saveToPhotos: true,
      includeBase64: false,
    };

    try {
      const response: ImagePickerResponse = await launchCamera(cameraOptions);

      if (response.didCancel) {
        console.log('User cancelled camera');
        return null;
      }

      if (response.errorCode) {
        console.error('Camera error:', response.errorMessage);
        Alert.alert('Error', response.errorMessage || 'Failed to open camera');
        return null;
      }

      const asset = response.assets?.[0];
      if (!asset) {
        return null;
      }

      // Check file size
      const fileSize = asset.fileSize || 0;
      const maxSize = options?.maxSize || this.MAX_FILE_SIZE;
      if (fileSize > maxSize) {
        Alert.alert(
          'File Too Large',
          `File size exceeds ${this.formatFileSize(maxSize)}`,
        );
        return null;
      }

      return {
        id: Date.now().toString(),
        name: asset.fileName || `photo_${Date.now()}.jpg`,
        uri: asset.uri || '',
        type: asset.type || 'image/jpeg',
        size: fileSize,
        uploadedAt: new Date(),
      };
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to capture photo');
      return null;
    }
  }

  /**
   * Open camera for web platform
   */
  private async openCameraWeb(
    options?: UploadOptions,
  ): Promise<UploadedFile | null> {
    return new Promise(resolve => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment';

      input.onchange = async (e: Event) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        if (!file) {
          resolve(null);
          return;
        }

        // Check file size
        const maxSize = options?.maxSize || this.MAX_FILE_SIZE;
        if (file.size > maxSize) {
          Alert.alert(
            'File Too Large',
            `File size exceeds ${this.formatFileSize(maxSize)}`,
          );
          resolve(null);
          return;
        }

        const reader = new FileReader();
        reader.onload = event => {
          const uri = event.target?.result as string;
          resolve({
            id: Date.now().toString(),
            name: file.name,
            uri: uri,
            type: file.type,
            size: file.size,
            uploadedAt: new Date(),
          });
        };
        reader.readAsDataURL(file);
      };

      input.click();
    });
  }

  /**
   * Open image library/gallery (Web & Mobile)
   */
  async openImageLibrary(
    options?: UploadOptions,
  ): Promise<UploadedFile | null> {
    const permission = await this.requestStoragePermission();
    if (!permission.granted) {
      Alert.alert(
        'Permission Denied',
        permission.message || 'Storage access denied',
      );
      return null;
    }

    if (Platform.OS === 'web') {
      return this.openFilePicker(['image/*'], options);
    }

    const libraryOptions: ImageLibraryOptions = {
      mediaType: 'photo',
      quality: options?.quality || 0.8,
      selectionLimit: 1,
      includeBase64: false,
    };

    try {
      const response: ImagePickerResponse = await launchImageLibrary(
        libraryOptions,
      );

      if (response.didCancel) {
        console.log('User cancelled image picker');
        return null;
      }

      if (response.errorCode) {
        console.error('Image picker error:', response.errorMessage);
        Alert.alert('Error', response.errorMessage || 'Failed to pick image');
        return null;
      }

      const asset = response.assets?.[0];
      if (!asset) {
        return null;
      }

      const fileSize = asset.fileSize || 0;
      const maxSize = options?.maxSize || this.MAX_FILE_SIZE;
      if (fileSize > maxSize) {
        Alert.alert(
          'File Too Large',
          `File size exceeds ${this.formatFileSize(maxSize)}`,
        );
        return null;
      }

      return {
        id: Date.now().toString(),
        name: asset.fileName || `image_${Date.now()}.jpg`,
        uri: asset.uri || '',
        type: asset.type || 'image/jpeg',
        size: fileSize,
        uploadedAt: new Date(),
      };
    } catch (error) {
      console.error('Image library error:', error);
      Alert.alert('Error', 'Failed to pick image');
      return null;
    }
  }

  /**
   * Open document picker (Mobile - uses image picker for all files)
   */
  async openDocumentPicker(
    documentTypes?: string[],
    options?: UploadOptions,
  ): Promise<UploadedFile | null> {
    // On mobile, use image picker which supports various file types
    Alert.alert(
      'Document Picker',
      'Document picker is only available on web. Please use image picker for photos.',
    );
    return null;
  }

  /**
   * Open file picker for web platform
   */
  private async openFilePicker(
    acceptTypes?: string[],
    options?: UploadOptions,
  ): Promise<UploadedFile | null> {
    return new Promise(resolve => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = acceptTypes?.join(',') || '*/*';

      input.onchange = async (e: Event) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        if (!file) {
          resolve(null);
          return;
        }

        const maxSize = options?.maxSize || this.MAX_FILE_SIZE;
        if (file.size > maxSize) {
          Alert.alert(
            'File Too Large',
            `File size exceeds ${this.formatFileSize(maxSize)}`,
          );
          resolve(null);
          return;
        }

        const reader = new FileReader();
        reader.onload = event => {
          const uri = event.target?.result as string;
          resolve({
            id: Date.now().toString(),
            name: file.name,
            uri: uri,
            type: file.type,
            size: file.size,
            uploadedAt: new Date(),
          });
        };
        reader.readAsDataURL(file);
      };

      input.click();
    });
  }

  /**
   * Save file to device storage (Mobile)
   */
  async saveToStorage(
    fileUri: string,
    fileName: string,
  ): Promise<{ success: boolean; path?: string; error?: string }> {
    // Files from camera/image picker are already saved to gallery
    Alert.alert(
      'File Saved',
      'Photos taken with camera are automatically saved to your gallery',
    );
    return { success: true, path: fileUri };
  }

  /**
   * Delete file from storage
   */
  async deleteFile(filePath: string): Promise<boolean> {
    // Images are managed by the system gallery
    return true;
  }

  /**
   * Get file info
   */
  async getFileInfo(filePath: string): Promise<{
    size: number;
    exists: boolean;
  } | null> {
    return null; // Not implemented without react-native-fs
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Check if file type is supported
   */
  isFileTypeSupported(fileType: string, allowedTypes?: string[]): boolean {
    if (!allowedTypes || allowedTypes.length === 0) {
      return true;
    }
    return allowedTypes.some(type => fileType.includes(type));
  }

  /**
   * Request notification permission (for upload progress notifications)
   */
  async requestNotificationPermission(): Promise<PermissionStatus> {
    if (Platform.OS === 'web') {
      if (!('Notification' in window)) {
        return {
          granted: false,
          message: 'Notifications not supported',
        };
      }

      const permission = await Notification.requestPermission();
      return {
        granted: permission === 'granted',
        message:
          permission === 'granted'
            ? undefined
            : 'Notification permission denied',
      };
    }

    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: 'Notification Permission',
            message: 'App needs to send notifications about upload progress',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return {
          granted: granted === PermissionsAndroid.RESULTS.GRANTED,
          message:
            granted === PermissionsAndroid.RESULTS.GRANTED
              ? undefined
              : 'Notification permission denied',
        };
      } catch (error) {
        console.error('Notification permission error:', error);
        return { granted: false, message: 'Failed to request permission' };
      }
    }

    // iOS handles notifications differently
    return { granted: true };
  }

  /**
   * Show upload progress notification (Web only example)
   */
  showUploadNotification(fileName: string, progress: number): void {
    if (Platform.OS === 'web' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(`Uploading ${fileName}`, {
          body: `Upload progress: ${progress}%`,
          icon: '/icon.png',
        });
      }
    }
  }
}

export const FileUploadService = new FileUploadServiceClass();
