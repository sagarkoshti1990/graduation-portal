import React, { useState, useRef, useCallback, useMemo, useEffect,memo } from 'react';
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
import { formatFileSize } from '../../utils/taskUtils';

// --- Helper Component for Selection Options ---

const UploadMethodOption: React.FC<UploadMethodOptionProps> = memo(({
  method,
  selectedMethod,
  title,
  subtitle,
  icon,
  onSelect,
}) => {
  const [hoveredOption, setHoveredOption] = useState<UploadMethod | null>(null);
  const isSelected = selectedMethod === method;
  const isActive = isSelected || hoveredOption;

  return (
    <Pressable
      onPress={() => onSelect(method)}
      onHoverIn={() => setHoveredOption(method)}
      onHoverOut={() => setHoveredOption(null)}
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
});
UploadMethodOption.displayName = "UploadMethodOption";

type UploadMethod = 'camera' | 'device';

type SelectedFileItem = {
  id: string;
  method: UploadMethod;
  file: any;
};

type ValidationErrorCode = 'empty' | 'invalid_type' | 'duplicate' | 'count_exceeded';

type ValidatedSelectedFileItem = SelectedFileItem & {
  isValid: boolean;
  errorCode?: ValidationErrorCode;
  errorMessage?: string;
};

type NormalizedAllowedType =
  | { kind: 'mime'; value: string; wildcardPrefix?: string }
  | { kind: 'ext'; value: string };

// Empty means "allow all types" (validation passes for any file type).
const DEFAULT_ALLOWED_FILE_TYPES: string[] = [];
const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'tiff', 'tif', 'heic']);

const getFileName = (file: any): string =>
  file?.fileName || file?.name || '';

const getFileSize = (file: any): number | undefined => {
  const size = file?.fileSize ?? file?.size;
  if (typeof size === 'number') return size;
  if (typeof size === 'string') {
    const n = Number(size);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
};

const getMimeType = (file: any): string | undefined => file?.type ?? file?.mimeType;

const getFileExtension = (file: any): string | undefined => {
  const name = getFileName(file);
  const match = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1];
};

const normalizeAllowedFileTypes = (allowedTypes: string[]): NormalizedAllowedType[] =>
  allowedTypes
    .map(t => t.trim().toLowerCase())
    .filter(Boolean)
    .map(token => {
      if (token.includes('/')) {
        const wildcardPrefix = token.endsWith('/*') ? token.split('/')[0] : undefined;
        return { kind: 'mime', value: token, wildcardPrefix };
      }
      const ext = token.startsWith('.') ? token.slice(1) : token;
      return { kind: 'ext', value: ext };
    });

const isFileTypeAllowed = (
  file: any,
  normalizedAllowedTypes: NormalizedAllowedType[],
): boolean => {
  if (!normalizedAllowedTypes || normalizedAllowedTypes.length === 0) return true;

  const mime = getMimeType(file)?.toLowerCase();
  const ext = getFileExtension(file)?.toLowerCase();

  let hasInferredType = false;
  let mimeMatch = false;
  let extMatch = false;

  if (mime) {
    hasInferredType = true;
    mimeMatch = normalizedAllowedTypes.some(t => {
      if (t.kind !== 'mime') return false;
      if (t.wildcardPrefix) {
        return mime.startsWith(`${t.wildcardPrefix}/`);
      }
      return mime === t.value;
    });
  }

  if (ext) {
    hasInferredType = true;
    extMatch = normalizedAllowedTypes.some(t => t.kind === 'ext' && t.value === ext);
  }

  if (mimeMatch || extMatch) return true;
  // If we can't infer type (no mime + no extension), don't block uploads to avoid regressions.
  if (!hasInferredType) return true;
  return false;
};

const normalizeAllowedTokenForDisplay = (token: string): string => {
  const t = token.trim();
  if (t.includes('/')) return t;
  return t.startsWith('.') ? t : `.${t}`;
};

const normalizeAllowedTokenForAccept = (token: string): string => {
  const t = token.trim();
  if (t.includes('/')) return t;
  return t.startsWith('.') ? t : `.${t}`;
};

const getImageAcceptString = (allowedTypes: string[]): string => {
  const imageTokens = allowedTypes.filter(token => {
    const t = token.trim().toLowerCase();
    if (t.startsWith('image/')) return true;
    if (!t.includes('/')) {
      const ext = t.startsWith('.') ? t.slice(1) : t;
      return IMAGE_EXTENSIONS.has(ext);
    }
    return false;
  });

  if (allowedTypes.length === 0) return '*/*';

  if (imageTokens.length === 0) return 'image/*';
  return imageTokens.map(normalizeAllowedTokenForAccept).join(',');
};

const getDeviceAcceptString = (allowedTypes: string[]): string =>
  allowedTypes.length === 0 ? '*/*' : allowedTypes.map(normalizeAllowedTokenForAccept).join(',');

const getComparableFileKey = (file: any): string | null => {
  const name = getFileName(file);
  const size = getFileSize(file);
  const mime = getMimeType(file);
  const ext = getFileExtension(file);

  const hasAny = Boolean(name) || typeof size === 'number' || Boolean(mime) || Boolean(ext);
  if (!hasAny) return null;

  const safeName = name ? name.toLowerCase() : '';
  const safeMime = mime ? mime.toLowerCase() : '';
  const safeExt = ext ? ext.toLowerCase() : '';

  // Prefer filename + size (most reliable across platforms).
  // Fall back to extension (or mime) + size if filename is missing.
  const safeSize = typeof size === 'number' ? size : '';
  const identifier = safeName || safeExt || safeMime;
  if (!identifier) return null;

  // If size is missing, we can't reliably dedupe.
  if (!safeSize && safeSize !== 0) return null;

  return `${identifier}|${safeSize}`;
};

const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  onConfirm,
  taskName,
  participantName,
  existingAttachments = [],
  maxFileUploadCount,
  allowedFileTypes,

}) => {
  const { t } = useLanguage();
  const { isMobile } = usePlatform();
  const [selectedMethod, setSelectedMethod] = useState<UploadMethod | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFileItem[]>([]);
  const [existingAttachmentsState, setExistingAttachmentsState] = useState<any[]>(existingAttachments ?? []);
  const [selectionAttemptError, setSelectionAttemptError] = useState<string | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const deviceInputRef = useRef<HTMLInputElement>(null);
  const isWeb = Platform.OS === 'web';

  const resolvedAllowedFileTypes = allowedFileTypes?.length
    ? allowedFileTypes
    : DEFAULT_ALLOWED_FILE_TYPES;

  const allowedFileTypesLabel = useMemo(() => {
    if (!resolvedAllowedFileTypes || resolvedAllowedFileTypes.length === 0) return '';
    return resolvedAllowedFileTypes.map(normalizeAllowedTokenForDisplay).join(', ');
  }, [resolvedAllowedFileTypes]);

  const normalizedAllowedTypes = useMemo(
    () => normalizeAllowedFileTypes(resolvedAllowedFileTypes),
    [resolvedAllowedFileTypes],
  );

  // Reset internal state when the modal opens.
  useEffect(() => {
    if (!isOpen) return;
    setExistingAttachmentsState(existingAttachments ?? []);
    setSelectedFiles([]);
    setSelectedMethod(null);
    setSelectionAttemptError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const existingAttachmentsArray = existingAttachmentsState;
  useEffect(() => {
    // Clear any "selection blocked" messaging when the user changes the selection
    // or removes previously uploaded files.
    setSelectionAttemptError(null);
  }, [existingAttachmentsState.length, selectedFiles.length]);
  const existingAttachmentKeys = useMemo(() => {
    const keys = existingAttachmentsArray
      .map(getComparableFileKey)
      .filter((k): k is string => Boolean(k));
    return new Set(keys);
  }, [existingAttachmentsArray]);

  const isMaxFinite =
    typeof maxFileUploadCount === 'number' && Number.isFinite(maxFileUploadCount);
  const maxUploadCount = isMaxFinite ? maxFileUploadCount as number : undefined;
  const isSingleMode = isMaxFinite && maxUploadCount === 1;
  const uploadSlots = useMemo(() => {
    if (typeof maxUploadCount !== 'number') return Infinity;
    const effectiveExistingCount = isSingleMode ? 0 : existingAttachmentsArray.length;
    return Math.max(0, maxUploadCount - effectiveExistingCount);
  }, [maxUploadCount, existingAttachmentsArray.length, isSingleMode]);

  const validatedSelectedFiles = useMemo<ValidatedSelectedFileItem[]>(() => {
    let acceptedCount = 0;
    // Tracks duplicates across the whole selection (not just already-counted uploads).
    // We only add keys to this set after a file passes empty + type validation.
    const seenKeys = isSingleMode ? new Set() : new Set(existingAttachmentKeys);

    return selectedFiles.map(item => {
      const file = item.file;

      const size = getFileSize(file);
      if (typeof size === 'number' && size === 0) {
        return {
          ...item,
          isValid: false,
          errorCode: 'empty',
          errorMessage: 'Empty files cannot be uploaded.',
        };
      }

      const isAllowed = isFileTypeAllowed(file, normalizedAllowedTypes);
      if (!isAllowed) {
        return {
          ...item,
          isValid: false,
          errorCode: 'invalid_type',
          errorMessage: `Unsupported file type. Allowed: ${allowedFileTypesLabel}.`,
        };
      }

      const comparableKey = getComparableFileKey(file);
      if (comparableKey && seenKeys.has(comparableKey)) {
        return {
          ...item,
          isValid: false,
          errorCode: 'duplicate',
          errorMessage: 'This file was already added.',
        };
      }

      if (comparableKey) seenKeys.add(comparableKey);

      if (acceptedCount < uploadSlots) {
        acceptedCount += 1;
        return {
          ...item,
          isValid: true,
        };
      }

      return {
        ...item,
        isValid: false,
        errorCode: 'count_exceeded',
        errorMessage:
          typeof maxUploadCount === 'number'
            ? `Upload limit exceeded. Max ${maxUploadCount} files allowed.`
            : 'Upload limit exceeded.',
      };
    });
  }, [
    selectedFiles,
    existingAttachmentKeys,
    normalizedAllowedTypes,
    allowedFileTypesLabel,
    uploadSlots,
    maxUploadCount,
    isSingleMode,
  ]);

  const validSelectedFiles = useMemo(
    () => validatedSelectedFiles.filter(f => f.isValid),
    [validatedSelectedFiles],
  );

  const hasInvalidSelectedFiles = validSelectedFiles.length !== validatedSelectedFiles.length;
  const remainingUploadsLabel = useMemo(() => {
    if (!isMaxFinite || typeof maxUploadCount !== 'number') return '';
    if (isSingleMode) return `1 / ${maxUploadCount}`;
    const remaining = Math.max(
      0,
      maxUploadCount - existingAttachmentsArray.length - validSelectedFiles.length,
    );
    return `${remaining} / ${maxUploadCount}`;
  }, [
    maxUploadCount,
    isMaxFinite,
    existingAttachmentsArray.length,
    validSelectedFiles.length,
    isSingleMode,
  ]);

  const errorMessages = useMemo(() => {
    const issues = new Map<ValidationErrorCode, string>();

    for (const item of validatedSelectedFiles) {
      if (item.isValid || !item.errorCode) continue;
      if (!issues.has(item.errorCode)) {
        issues.set(item.errorCode, item.errorMessage || '');
      }
    }

    // Keep deterministic order
    const order: ValidationErrorCode[] = ['count_exceeded', 'invalid_type', 'duplicate', 'empty'];
    return order
      .map(code => issues.get(code))
      .filter((m): m is string => Boolean(m));
  }, [validatedSelectedFiles]);

  const canSubmit = validSelectedFiles.length > 0 && !hasInvalidSelectedFiles;

  const addSelectedFiles = useCallback(
    (method: UploadMethod, filesToAdd: any[]) => {
      if (!filesToAdd || filesToAdd.length === 0) return;

      const incoming = filesToAdd.filter(Boolean);
      if (incoming.length === 0) return;

      // Single-file mode: always replace the current selection.
      if (isSingleMode) {
        const first = incoming[0];
        if (!first) return;

        setSelectionAttemptError(null);
        setSelectedFiles([
          {
            id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            method,
            file: first,
          },
        ]);
        onUpload(method, [first]);
        return;
      }

      if (typeof maxUploadCount === 'number') {
        const remainingForValid =
          maxUploadCount - existingAttachmentsArray.length - validSelectedFiles.length;

        if (remainingForValid <= 0) {
          setSelectionAttemptError(
            `Upload limit reached. Max ${maxUploadCount} files allowed.`,
          );
          return;
        }

        // Let validation handle per-file count_exceeded/duplicate/type rules.
        setSelectionAttemptError(null);

        const newItems: SelectedFileItem[] = incoming.map(file => ({
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          method,
          file,
        }));

        setSelectedFiles(prev => [...prev, ...newItems]);
        onUpload(method, incoming);
        return;
      }

      // Unlimited mode.
      setSelectionAttemptError(null);
      const newItems: SelectedFileItem[] = incoming.map(file => ({
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        method,
        file,
      }));
      setSelectedFiles(prev => [...prev, ...newItems]);
      onUpload(method, incoming);
    },
    [
      onUpload,
      isSingleMode,
      maxUploadCount,
      existingAttachmentsArray.length,
      validSelectedFiles.length,
    ],
  );

  // Handle camera/device selection
  const handleSelect = async (method: UploadMethod) => {
    setSelectedMethod(method);

    if (
      !isSingleMode &&
      typeof maxUploadCount === 'number' &&
      existingAttachmentsArray.length + validSelectedFiles.length >= maxUploadCount
    ) {
      setSelectionAttemptError(`Upload limit reached. Max ${maxUploadCount} files allowed.`);
      return;
    }

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
            addSelectedFiles(method, result.assets);
          }
        } else {
          const hasPermission = await requestStoragePermission(t);
          if (!hasPermission) {
            Alert.alert(t('common.error'), t('projectPlayer.storagePermissionDenied'));
            return;
          }
          // Use selectionLimit to avoid picking more than allowed (when configured).
          const remainingSlots = Number.isFinite(uploadSlots) ? uploadSlots - validSelectedFiles.length : Infinity;
          const selectionLimit =
            typeof remainingSlots === 'number' && remainingSlots > 0
              ? remainingSlots
              : 1;

          // For Android 13+ permissions we rely on requestStoragePermission update.
          const result = await launchImageLibrary({
            ...options,
            selectionLimit: typeof maxUploadCount === 'number' ? selectionLimit : 0,
          });
          if (result.assets && result.assets.length > 0) {
            addSelectedFiles(method, result.assets);
          }
        }
      } catch (error) {
        console.error('Image picker error:', error);
      }
    }
  };

  const handleWebFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    method: UploadMethod,
  ) => {
    setSelectedMethod(method);
    const files = event.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      addSelectedFiles(method, fileArray);
    }
  };

  const handleUploadConsent = () => {
    if (!canSubmit) return;
    if (onConfirm) {
      // In single-file mode, uploading a new file overrides/replaces the existing one.
      // So we only submit the newly selected file(s).
      const newFiles = validSelectedFiles.map(f => f.file);
      const allFiles = isSingleMode
        ? newFiles
        : [...existingAttachmentsArray, ...newFiles];
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

  const renderSelectedFilesList = () => {
    if (!validatedSelectedFiles || validatedSelectedFiles.length === 0) return null;

    return (
      <VStack {...fileUploadModalStyles.fileListContainer}>
        <Text {...fileUploadModalStyles.fileListTitle}>
          {t('projectPlayer.selectedFiles')} ({validSelectedFiles.length}/{validatedSelectedFiles.length})
        </Text>

        <ScrollView {...fileUploadModalStyles.fileListScrollView}>
          <VStack {...fileUploadModalStyles.fileListStack}>
            {validatedSelectedFiles.map((item) => (
              <Box
                key={item.id}
                {...fileUploadModalStyles.fileItemCard}
                borderColor={item.isValid ? '$accent200' : '$error300'}
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
                      {getFileName(item.file) || t('projectPlayer.untitledFile')}
                    </Text>

                    <Text
                      {...TYPOGRAPHY.bodySmall}
                      {...fileUploadModalStyles.fileItemSize}
                    >
                      {getFileSize(item.file) !== undefined
                        ? formatFileSize(getFileSize(item.file) as number)
                        : t('projectPlayer.unknownSize')}
                    </Text>

                    {!item.isValid && item.errorCode && (
                      <Text fontSize="$xs" color="$error700" marginTop="$1">
                        {item.errorMessage}
                      </Text>
                    )}
                  </VStack>

                  <Pressable
                    onPress={() => {
                      setSelectedFiles(prev => prev.filter(f => f.id !== item.id));
                      if (selectedFiles.length === 1) setSelectedMethod(null);
                    }}
                  >
                    <GluestackIcon as={CloseIcon} size="sm" color="$textLight400" />
                  </Pressable>
                </HStack>
              </Box>
            ))}
          </VStack>
        </ScrollView>
      </VStack>
    );
  };

  const renderExistingFilesList = useCallback(() => {
    const files = existingAttachmentsArray;
    if (!files || files.length === 0) return null;

    return (
      <VStack {...fileUploadModalStyles.fileListContainer}>
        <Text {...fileUploadModalStyles.fileListTitle}>
          {t('projectPlayer.previouslyUploadedFiles')} ({files.length})
        </Text>
        <ScrollView {...fileUploadModalStyles.fileListScrollView}>
          <VStack {...fileUploadModalStyles.fileListStack}>
            {files.map((file: any, index: number) => (
              <Box
                key={`existing-${file._id || file.name || file.fileName || index}`}
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
                      {getFileName(file) || t('projectPlayer.untitledFile')}
                    </Text>
                    <Text
                      {...TYPOGRAPHY.bodySmall}
                      {...fileUploadModalStyles.fileItemSize}
                    >
                      {getFileSize(file) !== undefined
                        ? formatFileSize(getFileSize(file) as number)
                        : t('projectPlayer.unknownSize')}
                    </Text>
                  </VStack>

                  <Pressable
                    onPress={() => {
                      setExistingAttachmentsState(prev =>
                        prev.filter(f => f !== file),
                      );
                    }}
                  >
                    <GluestackIcon
                      as={CloseIcon}
                      size="sm"
                      color="$textLight400"
                    />
                  </Pressable>
                </HStack>
              </Box>
            ))}
          </VStack>
        </ScrollView>
      </VStack>
    );
  }, [existingAttachmentsArray,t]);

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
        opacity={canSubmit ? 1 : 0.5}
        isDisabled={!canSubmit}
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
        {isMobile && (
          <UploadMethodOption
            method="camera"
            selectedMethod={selectedMethod}
            title={t('projectPlayer.takePhoto')}
            subtitle={t('projectPlayer.useDeviceCamera')}
            icon="Camera"
            onSelect={handleSelect}
          />
        )}

        {/* Upload from Device */}
        <UploadMethodOption
          method="device"
          selectedMethod={selectedMethod}
          title={t('projectPlayer.uploadFromDevice')}
          subtitle={t('projectPlayer.chooseFromGallery')}
          icon="Upload"
          onSelect={handleSelect}
        />

        {/* Selected Files Section */}
        <Box>
          {allowedFileTypesLabel !== "" && (
            <Text fontSize="$sm" color="$textSecondary">
              {t("projectPlayer.allowedFileTypes")} {allowedFileTypesLabel}
            </Text>
          )}
          {remainingUploadsLabel !== "" && remainingUploadsLabel !== "1 / 1" && (
            <Text fontSize="$xs" color="$textSecondary" marginTop="$1">
              {t("projectPlayer.remainingUploads")} {remainingUploadsLabel}
            </Text>
          )}
          {isSingleMode && (
            <Text fontSize="$sm" color="$textSecondary" marginTop="$1">
              {t('projectPlayer.SingleUploadMessage')}
            </Text>
          )}
        </Box>

        {(selectionAttemptError || errorMessages.length > 0) && (
          <Box
            bg="$error100"
            borderColor="$error300"
            borderWidth={1}
            padding="$3"
            borderRadius="$md"
          >
            <VStack space="xs">
              {selectionAttemptError && (
                <Text fontSize="$xs" color="$error700">
                  {selectionAttemptError}
                </Text>
              )}
              {errorMessages.map((msg, idx) => (
                <Text key={`${msg}-${idx}`} fontSize="$xs" color="$error700">
                  {msg}
                </Text>
              ))}
            </VStack>
          </Box>
        )}

        {renderSelectedFilesList()}

        {/* Previously Uploaded Files Section */}
        {renderExistingFilesList()}

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
            accept={getImageAcceptString(resolvedAllowedFileTypes)}
            capture="environment"
            style={{ display: 'none' }}
            onChange={(e) => handleWebFileChange(e, 'camera')}
          />
          <input
            ref={deviceInputRef}
            type="file"
            accept={getDeviceAcceptString(resolvedAllowedFileTypes)}
            multiple={!isSingleMode}
            style={{ display: 'none' }}
            onChange={(e) => handleWebFileChange(e, 'device')}
          />
        </>
      )}
    </Modal>
  );
};

export default FileUploadModal;
