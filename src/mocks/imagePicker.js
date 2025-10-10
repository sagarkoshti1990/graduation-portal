/**
 * Mock for react-native-image-picker (Web)
 * This module is not used on web, FileUploadService.web.ts handles it
 */

export const launchCamera = () => {
  console.warn('launchCamera is not available on web');
  return Promise.resolve({ didCancel: true });
};

export const launchImageLibrary = () => {
  console.warn('launchImageLibrary is not available on web');
  return Promise.resolve({ didCancel: true });
};

export default {
  launchCamera,
  launchImageLibrary,
};
