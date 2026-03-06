import { Platform, PermissionsAndroid } from 'react-native';
import logger from '@utils/logger';

export const requestCameraPermission = async (t: (key: string) => string) => {
    if (Platform.OS === 'android') {
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.CAMERA,
                {
                    title: t('permissions.camera.title'),
                    message: t('permissions.camera.message'),
                    buttonNeutral: t('permissions.camera.buttonNeutral'),
                    buttonNegative: t('permissions.camera.buttonNegative'),
                    buttonPositive: t('permissions.camera.buttonPositive'),
                },
            );
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        } catch (err) {
            logger.warn(err);
            return false;
        }
    }
    return true;
};

export const requestStoragePermission = async (t: (key: string) => string) => {
    if (Platform.OS === 'android') {
        try {
            // Android 13+ (API 33) requires granular media permissions
            if (Number(Platform.Version) >= 33) {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
                    {
                        title: t('permissions.storage.title'),
                        message: t('permissions.storage.message'),
                        buttonNeutral: t('permissions.storage.buttonNeutral'),
                        buttonNegative: t('permissions.storage.buttonNegative'),
                        buttonPositive: t('permissions.storage.buttonPositive'),
                    },
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            } else {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
                    {
                        title: t('permissions.storage.title'),
                        message: t('permissions.storage.message'),
                        buttonNeutral: t('permissions.storage.buttonNeutral'),
                        buttonNegative: t('permissions.storage.buttonNegative'),
                        buttonPositive: t('permissions.storage.buttonPositive'),
                    },
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            }
        } catch (err) {
            logger.warn(err);
            return false;
        }
    }
    return true;
};
