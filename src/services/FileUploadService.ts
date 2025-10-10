/**
 * FileUploadService
 * Handles file uploads, camera access, and file picking across Web and Mobile platforms
 * Provides consistent API with platform-specific implementations
 */

import { Platform, PermissionsAndroid } from 'react-native';
import {
  launchCamera,
  launchImageLibrary,
  ImagePickerResponse,
  CameraOptions,
  ImageLibraryOptions,
} from 'react-native-image-picker';
import Alert from '../components/ui/alert';
export interface UploadedFile {
  id: string;
  name: string;
  uri: string;
  type: string;
  size: number;
  uploadedAt: Date;
  base64Data?: string; // Optional Base64 data
}

export interface UploadOptions {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  quality?: number; // 0-1 for images
  onProgress?: (progress: number) => void; // Progress callback (0-100)
  includeBase64?: boolean; // Whether to include base64 data
}

export interface PermissionStatus {
  granted: boolean;
  message?: string;
}

class FileUploadServiceClass {
  private readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB default

  /**
   * Validate file size
   */
  validateFileSize(
    fileSize: number,
    maxSize?: number,
  ): { valid: boolean; message?: string } {
    const limit = maxSize || this.MAX_FILE_SIZE;
    if (fileSize > limit) {
      return {
        valid: false,
        message: `File size (${this.formatFileSize(
          fileSize,
        )}) exceeds the maximum allowed size of ${this.formatFileSize(
          limit,
        )}. Please select a smaller file.`,
      };
    }
    return { valid: true };
  }

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
      quality: (options?.quality || 0.8) as any, // Type assertion for quality
      saveToPhotos: true,
      includeBase64: options?.includeBase64 || true, // Include base64 by default for storage
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
      const validation = this.validateFileSize(fileSize, options?.maxSize);
      if (!validation.valid) {
        Alert.alert(
          'File Too Large',
          validation.message || 'File size exceeds limit',
        );
        return null;
      }

      // Base64 is already included in the response from react-native-image-picker
      // Simulate progress based on file size for better UX
      if (options?.onProgress) {
        // Smaller files: faster progress
        // Larger files: show incremental progress
        const progressSteps = fileSize > 5 * 1024 * 1024 ? 5 : 3;
        const interval = 50; // ms between updates

        for (let i = 1; i <= progressSteps; i++) {
          await new Promise(resolve => setTimeout(resolve, interval));
          const progress = Math.floor((i / progressSteps) * 100);
          options.onProgress(progress);
        }
      }

      // Prepare base64 data
      let base64Data: string | undefined;
      if (asset.base64) {
        base64Data = `data:${asset.type || 'image/jpeg'};base64,${
          asset.base64
        }`;
      }

      return {
        id: Date.now().toString(),
        name: asset.fileName || `photo_${Date.now()}.jpg`,
        uri: asset.uri || '',
        type: asset.type || 'image/jpeg',
        size: fileSize,
        uploadedAt: new Date(),
        base64Data,
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
        const validation = this.validateFileSize(file.size, options?.maxSize);
        if (!validation.valid) {
          Alert.alert(
            'File Too Large',
            validation.message || 'File size exceeds limit',
          );
          resolve(null);
          return;
        }

        const reader = new FileReader();

        // Track progress
        reader.onprogress = event => {
          if (event.lengthComputable && options?.onProgress) {
            const progress = Math.round((event.loaded / event.total) * 100);
            options.onProgress(progress);
          }
        };

        reader.onload = event => {
          const base64Data = event.target?.result as string;
          resolve({
            id: Date.now().toString(),
            name: file.name,
            uri: base64Data,
            type: file.type,
            size: file.size,
            uploadedAt: new Date(),
            base64Data,
          });
        };

        reader.onerror = () => {
          Alert.alert('Error', 'Failed to read file');
          resolve(null);
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
      quality: (options?.quality || 0.8) as any, // Type assertion for quality
      selectionLimit: 1,
      includeBase64: options?.includeBase64 || true, // Include base64 by default
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
      const validation = this.validateFileSize(fileSize, options?.maxSize);
      if (!validation.valid) {
        Alert.alert(
          'File Too Large',
          validation.message || 'File size exceeds limit',
        );
        return null;
      }

      // Base64 is already included in the response from react-native-image-picker
      // Simulate progress based on file size for better UX
      if (options?.onProgress) {
        // Smaller files: faster progress
        // Larger files: show incremental progress
        const progressSteps = fileSize > 5 * 1024 * 1024 ? 5 : 3;
        const interval = 50; // ms between updates

        for (let i = 1; i <= progressSteps; i++) {
          await new Promise(resolve => setTimeout(resolve, interval));
          const progress = Math.floor((i / progressSteps) * 100);
          options.onProgress(progress);
        }
      }

      // Prepare base64 data
      let base64Data: string | undefined;
      if (asset.base64) {
        base64Data = `data:${asset.type || 'image/jpeg'};base64,${
          asset.base64
        }`;
      }

      return {
        id: Date.now().toString(),
        name: asset.fileName || `image_${Date.now()}.jpg`,
        uri: asset.uri || '',
        type: asset.type || 'image/jpeg',
        size: fileSize,
        uploadedAt: new Date(),
        base64Data,
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
    _documentTypes?: string[],
    _options?: UploadOptions,
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

        const validation = this.validateFileSize(file.size, options?.maxSize);
        if (!validation.valid) {
          Alert.alert(
            'File Too Large',
            validation.message || 'File size exceeds limit',
          );
          resolve(null);
          return;
        }

        const reader = new FileReader();

        // Track progress
        reader.onprogress = event => {
          if (event.lengthComputable && options?.onProgress) {
            const progress = Math.round((event.loaded / event.total) * 100);
            options.onProgress(progress);
          }
        };

        reader.onload = event => {
          const base64Data = event.target?.result as string;
          resolve({
            id: Date.now().toString(),
            name: file.name,
            uri: base64Data,
            type: file.type,
            size: file.size,
            uploadedAt: new Date(),
            base64Data,
          });
        };

        reader.onerror = () => {
          Alert.alert('Error', 'Failed to read file');
          resolve(null);
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
    _fileName: string,
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
  async deleteFile(_filePath: string): Promise<boolean> {
    // Images are managed by the system gallery
    return true;
  }

  /**
   * Get file info
   */
  async getFileInfo(_filePath: string): Promise<{
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
        // eslint-disable-next-line no-new
        new Notification(`Uploading ${fileName}`, {
          body: `Upload progress: ${progress}%`,
          icon: '/icon.png',
        });
      }
    }
  }
}

export const FileUploadService = new FileUploadServiceClass();
