import { FileUploadService } from '../services/FileUploadService';

export type PermissionType = 'camera' | 'storage' | 'notification' | 'all';

export const checkPermissions = async (type: PermissionType = 'all') => {
  let permissions: { [key: string]: boolean } = {};

  if (type === 'camera' || type === 'all') {
    const cameraPermission = await FileUploadService.requestCameraPermission();
    permissions.camera = cameraPermission.granted;
    if (type !== 'all') return { camera: cameraPermission.granted };
  }

  if (type === 'storage' || type === 'all') {
    const storagePermission =
      await FileUploadService.requestStoragePermission();
    permissions.storage = storagePermission.granted;
    if (type !== 'all') return { storage: storagePermission.granted };
  }

  if (type === 'notification' || type === 'all') {
    const notificationPermission =
      await FileUploadService.requestNotificationPermission();
    permissions.notification = notificationPermission.granted;
    if (type !== 'all') return { notification: notificationPermission.granted };
  }

  // If type is "all", return all gathered
  return permissions;
};
