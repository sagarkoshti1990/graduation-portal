/**
 * FileUploadService - Web Implementation
 * Handles file uploads, camera access, and file picking for Web platform only
 */

import { Alert } from 'react-native';

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
   * Check if running on desktop browser
   */
  private isDesktopBrowser(): boolean {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile =
      /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
        userAgent,
      );
    return !isMobile;
  }

  /**
   * Request camera permission (Web)
   */
  async requestCameraPermission(): Promise<PermissionStatus> {
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

  /**
   * Open camera stream and capture photo (Desktop Web)
   */
  private async openCameraStream(
    options?: UploadOptions,
  ): Promise<UploadedFile | null> {
    return new Promise((resolve, reject) => {
      // Create modal overlay
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        z-index: 10000;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      `;

      // Create video element
      const video = document.createElement('video');
      video.style.cssText = `
        max-width: 90%;
        max-height: 70%;
        background: black;
      `;
      video.autoplay = true;
      video.playsInline = true;

      // Create canvas for capturing
      const canvas = document.createElement('canvas');

      // Create controls container
      const controls = document.createElement('div');
      controls.style.cssText = `
        margin-top: 20px;
        display: flex;
        gap: 15px;
      `;

      // Create capture button
      const captureBtn = document.createElement('button');
      captureBtn.textContent = '📷 Capture Photo';
      captureBtn.style.cssText = `
        padding: 12px 24px;
        font-size: 16px;
        background: #0066CC;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
      `;

      // Create cancel button
      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = '❌ Cancel';
      cancelBtn.style.cssText = `
        padding: 12px 24px;
        font-size: 16px;
        background: #DC3545;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
      `;

      // Add hover effects
      captureBtn.onmouseover = () => (captureBtn.style.background = '#0052A3');
      captureBtn.onmouseout = () => (captureBtn.style.background = '#0066CC');
      cancelBtn.onmouseover = () => (cancelBtn.style.background = '#BD2130');
      cancelBtn.onmouseout = () => (cancelBtn.style.background = '#DC3545');

      controls.appendChild(captureBtn);
      controls.appendChild(cancelBtn);
      overlay.appendChild(video);
      overlay.appendChild(controls);
      document.body.appendChild(overlay);

      let stream: MediaStream | null = null;

      // Start camera
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'user' } })
        .then(mediaStream => {
          stream = mediaStream;
          video.srcObject = mediaStream;
        })
        .catch(error => {
          console.error('Error accessing camera:', error);
          cleanup();
          Alert.alert('Error', 'Failed to access camera');
          resolve(null);
        });

      // Cleanup function
      const cleanup = () => {
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        document.body.removeChild(overlay);
      };

      // Capture button click
      captureBtn.onclick = () => {
        // Set canvas size to video size
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw video frame to canvas
        const context = canvas.getContext('2d');
        if (context) {
          context.drawImage(video, 0, 0, canvas.width, canvas.height);

          // Convert to blob
          canvas.toBlob(
            blob => {
              if (!blob) {
                cleanup();
                Alert.alert('Error', 'Failed to capture photo');
                resolve(null);
                return;
              }

              // Check file size
              const maxSize = options?.maxSize || this.MAX_FILE_SIZE;
              if (blob.size > maxSize) {
                cleanup();
                Alert.alert(
                  'File Too Large',
                  `Photo size exceeds ${this.formatFileSize(maxSize)}`,
                );
                resolve(null);
                return;
              }

              // Convert blob to data URL
              const reader = new FileReader();
              reader.onload = event => {
                const uri = event.target?.result as string;
                cleanup();
                resolve({
                  id: Date.now().toString(),
                  name: `photo_${Date.now()}.jpg`,
                  uri: uri,
                  type: 'image/jpeg',
                  size: blob.size,
                  uploadedAt: new Date(),
                });
              };
              reader.readAsDataURL(blob);
            },
            'image/jpeg',
            options?.quality || 0.8,
          );
        }
      };

      // Cancel button click
      cancelBtn.onclick = () => {
        cleanup();
        resolve(null);
      };
    });
  }

  /**
   * Request storage permission (Web - always granted)
   */
  async requestStoragePermission(): Promise<PermissionStatus> {
    return { granted: true }; // Web doesn't need explicit storage permission
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission(): Promise<PermissionStatus> {
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
        permission === 'granted' ? undefined : 'Notification permission denied',
    };
  }

  /**
   * Open camera to take a photo (Web)
   */
  async openCamera(options?: UploadOptions): Promise<UploadedFile | null> {
    const permission = await this.requestCameraPermission();
    if (!permission.granted) {
      Alert.alert(
        'Permission Denied',
        permission.message || 'Camera access denied',
      );
      return null;
    }

    // Try to use getUserMedia for desktop/laptop browsers
    if (this.isDesktopBrowser()) {
      return this.openCameraStream(options);
    }

    // Use file input with capture for mobile browsers
    return this.openFilePicker(['image/*'], options, true);
  }

  /**
   * Open image library/gallery (Web)
   */
  async openImageLibrary(
    options?: UploadOptions,
  ): Promise<UploadedFile | null> {
    return this.openFilePicker(['image/*'], options);
  }

  /**
   * Open document picker (Web)
   */
  async openDocumentPicker(
    documentTypes?: string[],
    options?: UploadOptions,
  ): Promise<UploadedFile | null> {
    return this.openFilePicker(documentTypes, options);
  }

  /**
   * Open file picker for web platform
   */
  private async openFilePicker(
    acceptTypes?: string[],
    options?: UploadOptions,
    useCamera: boolean = false,
  ): Promise<UploadedFile | null> {
    return new Promise(resolve => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = acceptTypes?.join(',') || '*/*';

      // Use camera capture if specified
      if (useCamera) {
        input.setAttribute('capture', 'environment');
      }

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
   * Save file to device storage (Web - trigger download)
   */
  async saveToStorage(
    fileUri: string,
    fileName: string,
  ): Promise<{ success: boolean; path?: string; error?: string }> {
    try {
      const link = document.createElement('a');
      link.href = fileUri;
      link.download = fileName;
      link.click();
      return { success: true, path: fileUri };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to save file',
      };
    }
  }

  /**
   * Delete file from storage (Web - no-op)
   */
  async deleteFile(filePath: string): Promise<boolean> {
    return true; // Web doesn't need explicit file deletion
  }

  /**
   * Get file info (Web - not applicable)
   */
  async getFileInfo(filePath: string): Promise<{
    size: number;
    exists: boolean;
  } | null> {
    return null; // Not applicable for web
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
   * Show upload progress notification (Web)
   */
  showUploadNotification(fileName: string, progress: number): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`Uploading ${fileName}`, {
        body: `Upload progress: ${progress}%`,
        icon: '/icon.png',
      });
    }
  }
}

export const FileUploadService = new FileUploadServiceClass();
