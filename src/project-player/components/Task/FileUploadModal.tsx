import React, { useState, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import {
    VStack,
    HStack,
    Text,
    Box,
    Pressable,
    Button,
    ButtonText,
    CloseIcon,
    Icon as GluestackIcon,
    ScrollView,
} from '@gluestack-ui/themed';
import { launchCamera, launchImageLibrary, CameraOptions, ImageLibraryOptions } from 'react-native-image-picker';
import { useLanguage } from '@contexts/LanguageContext';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';
import { LucideIcon } from '@ui';
import { theme } from '../../../config/theme';
import { requestCameraPermission, requestStoragePermission } from '@utils/permissions';
import { usePlatform } from '@utils/platform';
import Modal from '@components/ui/Modal';
import { fileUploadModalStyles } from './Styles';
import { UploadMethodOptionProps, FileUploadModalProps } from '../../types/components.types';

// --- Helper Component for Selection Options ---
const UploadMethodOption: React.FC<UploadMethodOptionProps> = ({
    method,
    selectedMethod,
    hoveredOption,
    title,
    subtitle,
    icon,
    onSelect,
    onHoverIn,
    onHoverOut,
}) => {
    const isSelected = selectedMethod === method;
    const isHovered = hoveredOption === method;
    const isActive = isSelected || isHovered;

    return (
        <Pressable
            onPress={() => onSelect(method)}
            onHoverIn={() => onHoverIn(method)}
            onHoverOut={onHoverOut}
            accessibilityLabel={title}
            accessibilityRole="button"
        >
            <Box
                {...fileUploadModalStyles.optionBox}
                {...(isActive ? fileUploadModalStyles.optionBoxActive : fileUploadModalStyles.optionBoxDefault)}
                $web-cursor="pointer"
                $web-transition="all 0.2s ease"
            >
                <HStack {...fileUploadModalStyles.optionContent}>
                    <Box
                        {...fileUploadModalStyles.optionIconContainer}
                        {...(isActive ? fileUploadModalStyles.optionIconContainerActive : fileUploadModalStyles.optionIconContainerDefault)}
                    >
                        <LucideIcon
                            name={icon}
                            size={fileUploadModalStyles.optionIconSize}
                            color={isActive ? theme.tokens.colors.primary500 : theme.tokens.colors.textSecondary}
                        />
                    </Box>
                    <VStack {...fileUploadModalStyles.optionTextContainer}>
                        <Text
                            {...fileUploadModalStyles.optionTitle}
                            color={isActive ? '$primary500' : '$textPrimary'}
                        >
                            {title}
                        </Text>
                        <Text {...fileUploadModalStyles.optionSubtitle}>
                            {subtitle}
                        </Text>
                    </VStack>
                </HStack>
            </Box>
        </Pressable>
    );
};

const FileUploadModal: React.FC<FileUploadModalProps> = ({
    isOpen,
    onClose,
    onUpload,
    onConfirm,
    taskName,
    participantName,
    existingAttachments = [],

}) => {
    const { t } = useLanguage();
    const { isMobile } = usePlatform();
    const [selectedMethod, setSelectedMethod] = useState<'camera' | 'device' | null>(null);
    const [hoveredOption, setHoveredOption] = useState<'camera' | 'device' | null>(null);
    const [selectedFiles, setSelectedFiles] = useState<any[]>([]);

    const cameraInputRef = useRef<HTMLInputElement>(null);
    const deviceInputRef = useRef<HTMLInputElement>(null);
    const isWeb = Platform.OS === 'web';

    // Handle camera/device selection
    const handleSelect = async (method: 'camera' | 'device') => {
        setSelectedMethod(method);

        if (isWeb) {
            // Trigger click immediately to ensure browser doesn't block it
            if (method === 'camera') {
                cameraInputRef.current?.click();
            } else {
                deviceInputRef.current?.click();
            }
        } else {
            const options: CameraOptions & ImageLibraryOptions = {
                mediaType: 'photo',
                includeBase64: false,
                maxHeight: 2000,
                maxWidth: 2000,
                quality: 0.8,
            };

            try {
                if (method === 'camera') {
                    const hasPermission = await requestCameraPermission(t);
                    if (!hasPermission) {
                        Alert.alert(t('common.error'), t('projectPlayer.cameraPermissionDenied'));
                        return;
                    }
                    const result = await launchCamera(options);
                    if (result.assets && result.assets.length > 0) {
                        setSelectedFiles(result.assets);
                        onUpload(method, result.assets);
                    }
                } else {
                    const hasPermission = await requestStoragePermission(t);
                    if (!hasPermission) {
                        Alert.alert(t('common.error'), t('projectPlayer.storagePermissionDenied'));
                        return;
                    }
                    // For Android 13+ permissions we rely on requestStoragePermission update
                    // but we still need to be careful with selectionLimit
                    const result = await launchImageLibrary({ ...options, selectionLimit: 0 });
                    if (result.assets && result.assets.length > 0) {
                        setSelectedFiles(result.assets);
                        onUpload(method, result.assets);
                    }
                }
            } catch (error) {
                console.error('Image picker error:', error);
            }
        }
    };

    const handleWebFileChange = (event: React.ChangeEvent<HTMLInputElement>, method: 'camera' | 'device') => {
        const files = event.target.files;
        if (files && files.length > 0) {
            const fileArray = Array.from(files);
            // Append new files to existing selected files
            setSelectedFiles(prev => [...prev, ...fileArray]);
            onUpload(method, fileArray);
        }
    };

    const handleUploadConsent = () => {
        if (onConfirm) {
            // Combine existing attachments with newly selected files
            const allFiles = [...existingAttachments, ...selectedFiles];
            onConfirm(allFiles);
        }
        setSelectedMethod(null);
        setSelectedFiles([]);
        onClose();
    };

    const handleCancel = () => {
        setSelectedMethod(null);
        setSelectedFiles([]);
        onClose();
    };

    // If participant name is available, prioritize it (e.g. for "Upload for [Name]")
    const displayName = participantName || taskName;

    const renderFileList = (files: any[], title: string, showDelete: boolean = false) => {
        if (!files || files.length === 0) return null;
        return (
            <VStack {...fileUploadModalStyles.fileListContainer}>
                <Text {...fileUploadModalStyles.fileListTitle}>
                    {title} ({files.length})
                </Text>
                <ScrollView {...fileUploadModalStyles.fileListScrollView}>
                    <VStack {...fileUploadModalStyles.fileListStack}>
                        {files.map((file, index) => (
                            <Box
                                key={`${title}-${index}`}
                                {...fileUploadModalStyles.fileItemCard}
                            >
                                <HStack {...fileUploadModalStyles.fileItemContent}>
                                    <Box {...fileUploadModalStyles.fileItemIconContainer}>
                                        <LucideIcon
                                            name="FileText"
                                            size={fileUploadModalStyles.fileIconSize}
                                            color={theme.tokens.colors.textMutedForeground}
                                        />
                                    </Box>
                                    <VStack {...fileUploadModalStyles.fileItemTextContainer}>
                                        <Text
                                            {...TYPOGRAPHY.h4}
                                            {...fileUploadModalStyles.fileItemName}
                                        >
                                            {file.fileName || file.name || t('projectPlayer.untitledFile')}
                                        </Text>
                                        <Text
                                            {...TYPOGRAPHY.bodySmall}
                                            {...fileUploadModalStyles.fileItemSize}
                                        >
                                            {(file.fileSize || file.size ? ((file.fileSize || file.size) / 1024).toFixed(1) + ' KB' : t('projectPlayer.unknownSize'))}
                                        </Text>
                                    </VStack>
                                    {showDelete && (
                                        <Pressable onPress={() => {
                                            const newFiles = [...selectedFiles];
                                            newFiles.splice(index, 1);
                                            setSelectedFiles(newFiles);
                                            if (newFiles.length === 0) setSelectedMethod(null);
                                        }}>
                                            <GluestackIcon as={CloseIcon} size="sm" color="$textLight400" />
                                        </Pressable>
                                    )}
                                </HStack>
                            </Box>
                        ))}
                    </VStack>
                </ScrollView>
            </VStack>
        );
    };

    const footerContent = (
        <HStack space="md" width="$full" justifyContent="flex-end">
            <Button
                {...fileUploadModalStyles.cancelButton}
                onPress={handleCancel}
                $web-cursor="pointer"
                $hover-bg="$backgroundLight50"
            >
                <ButtonText color="$textPrimary" fontSize="$sm">
                    {t('common.cancel')}
                </ButtonText>
            </Button>

            <Button
                {...fileUploadModalStyles.submitButton}
                onPress={handleUploadConsent}
                opacity={selectedFiles.length > 0 ? 1 : 0.5}
                isDisabled={selectedFiles.length === 0}
                $web-cursor="pointer"
                $hover-bg="$primary600"
            >
                <ButtonText {...fileUploadModalStyles.submitButtonText}>
                    {t('projectPlayer.upload')}
                </ButtonText>
            </Button>
        </HStack>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleCancel}
            size={isMobile ? 'lg' : 'md'}
            headerTitle={t('projectPlayer.chooseUploadMethod')}
            headerDescription={t('projectPlayer.uploadDocumentationFor', { name: displayName })}
            showCloseButton={true}
            headerAlignment="baseline"
            footerContent={footerContent}
        >
            <VStack space="md">
                {/* Take a Photo */}
                <UploadMethodOption
                    method="camera"
                    selectedMethod={selectedMethod}
                    hoveredOption={hoveredOption}
                    title={t('projectPlayer.takePhoto')}
                    subtitle={t('projectPlayer.useDeviceCamera')}
                    icon="Camera"
                    onSelect={handleSelect}
                    onHoverIn={setHoveredOption}
                    onHoverOut={() => setHoveredOption(null)}
                />

                {/* Upload from Device */}
                <UploadMethodOption
                    method="device"
                    selectedMethod={selectedMethod}
                    hoveredOption={hoveredOption}
                    title={t('projectPlayer.uploadFromDevice')}
                    subtitle={t('projectPlayer.chooseFromGallery')}
                    icon="Upload"
                    onSelect={handleSelect}
                    onHoverIn={setHoveredOption}
                    onHoverOut={() => setHoveredOption(null)}
                />

                {/* Selected Files Section */}
                {renderFileList(selectedFiles, t('projectPlayer.selectedFiles'), true)}

                {/* Previously Uploaded Files Section */}
                {renderFileList(existingAttachments, t('projectPlayer.previouslyUploadedFiles'), false)}

                {/* Note Box - Blue Theme */}
                <Box {...fileUploadModalStyles.noteBox}>
                    <Text {...fileUploadModalStyles.noteText}>
                        <Text {...fileUploadModalStyles.noteBoldText}>Note: </Text>
                        {t('projectPlayer.uploadSignedDocumentation')}
                    </Text>
                </Box>
            </VStack>

            {isWeb && (
                <>
                    <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        style={{ display: 'none' }}
                        onChange={(e) => handleWebFileChange(e, 'camera')}
                    />
                    <input
                        ref={deviceInputRef}
                        type="file"
                        accept="image/*,application/pdf,.doc,.docx"
                        multiple
                        style={{ display: 'none' }}
                        onChange={(e) => handleWebFileChange(e, 'device')}
                    />
                </>
            )}
        </Modal>
    );
};

export default FileUploadModal;
