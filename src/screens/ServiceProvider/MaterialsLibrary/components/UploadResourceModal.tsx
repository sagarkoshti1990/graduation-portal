import React, { useState } from 'react';
import {
  Box,
  HStack,
  VStack,
  Text,
  Pressable,
  Input,
  InputField,
  Textarea,
  TextareaInput,
  Select,
  SelectTrigger,
  SelectInput,
  SelectIcon,
  SelectPortal,
  SelectBackdrop,
  SelectContent,
  SelectItem,
} from '@gluestack-ui/themed';
import Modal from '@components/ui/Modal';
import LucideIcon from '@components/ui/LucideIcon';
import styles from '../styles';
import { useLanguage } from '@contexts/LanguageContext';
import {
  MATERIAL_FORMATS,
  ALLOWED_MATERIAL_EXTENSIONS,
} from '../../../../services/serviceProvider/MaterialsLibrary/materialsLibraryService';

export interface UploadResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (payload: {
    title: string;
    description: string;
    category: string;
    format: string;
    fileName: string;
    associatedOffering: string;
  }) => void;
  /** Category options (from the categories API) */
  categoryOptions?: { label: string; value: string }[];
}

export default function UploadResourceModal({
  isOpen,
  onClose,
  onUpload,
  categoryOptions = [],
}: UploadResourceModalProps): React.JSX.Element {
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [format, setFormat] = useState('');
  const [fileName, setFileName] = useState('');
  const [associatedOffering, setAssociatedOffering] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const FORMAT_OPTIONS = [
    { label: t('supportProvider.materialsLibrary.formats.pdf'), value: MATERIAL_FORMATS.PDF },
    { label: t('supportProvider.materialsLibrary.formats.word'), value: MATERIAL_FORMATS.WORD },
  ];

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setCategory('');
    setFormat('');
    setFileName('');
    setAssociatedOffering('');
    setErrorMsg('');
    onClose();
  };

  const handleAdd = () => {
    if (!title.trim() || !description.trim() || !category || !format) {
      setErrorMsg(t('supportProvider.materialsLibrary.uploadModal.errorMsg'));
      return;
    }

    // Only PDF / Word files are allowed - the file name's extension must match the chosen format
    const ext = fileName.trim().includes('.') ? fileName.trim().split('.').pop()?.toLowerCase() || '' : '';
    const allowedForFormat = format === MATERIAL_FORMATS.PDF ? ['pdf'] : ['doc', 'docx'];
    if (fileName.trim() && (!ALLOWED_MATERIAL_EXTENSIONS.includes(ext) || !allowedForFormat.includes(ext))) {
      setErrorMsg(t('supportProvider.materialsLibrary.uploadModal.invalidFileType'));
      return;
    }

    onUpload({
      title,
      description,
      // Save the readable label; the filter still matches it since it compares names ignoring spaces/underscores
      category: categoryOptions.find((opt) => opt.value === category)?.label ?? category,
      format,
      fileName: fileName.trim(),
      associatedOffering: associatedOffering.trim(),
    });
    handleClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="lg"
      headerTitle={t('supportProvider.materialsLibrary.uploadModal.title')}
      headerProps={styles.modalHeaderProps}
      footerContent={
        <HStack {...styles.modalFooterRow}>
          {/* Cancel Button */}
          <Pressable
            onPress={handleClose}
            {...styles.modalCancelBtn}
          >
            <Text {...styles.modalCancelBtnText}>
              {t('supportProvider.materialsLibrary.uploadModal.cancel')}
            </Text>
          </Pressable>

          {/* Add to Library Button */}
          <Pressable
            onPress={handleAdd}
            {...styles.modalConfirmBtn}
          >
            <HStack {...styles.modalConfirmBtnRow}>
              <LucideIcon name="Upload" size={styles.modalConfirmBtnIcon.size} color={styles.modalConfirmBtnIcon.color} />
              <Text {...styles.modalConfirmBtnText}>
                {t('supportProvider.materialsLibrary.uploadModal.addLibrary')}
              </Text>
            </HStack>
          </Pressable>
        </HStack>
      }
    >
      <VStack {...styles.modalBodyVStack}>
        {errorMsg ? (
          <Box {...styles.errorMsgBox}>
            <Text {...styles.errorMsgText}>
              {errorMsg}
            </Text>
          </Box>
        ) : null}

        {/* Title Input */}
        <VStack {...styles.formInputGroup}>
          <HStack {...styles.formLabelRow}>
            <Text {...styles.formLabelText}>
              {t('supportProvider.materialsLibrary.uploadModal.labelTitle')}
            </Text>
            <Text {...styles.formRequiredText}>*</Text>
          </HStack>
          <Input {...styles.formInput}>
            <InputField
              value={title}
              onChangeText={setTitle}
              placeholder={t('supportProvider.materialsLibrary.uploadModal.placeholderTitle')}
              {...styles.formInputField}
            />
          </Input>
        </VStack>

        {/* Description Input */}
        <VStack {...styles.formInputGroup}>
          <HStack {...styles.formLabelRow}>
            <Text {...styles.formLabelText}>
              {t('supportProvider.materialsLibrary.uploadModal.labelDescription')}
            </Text>
            <Text {...styles.formRequiredText}>*</Text>
          </HStack>
          <Textarea {...styles.formTextarea}>
            <TextareaInput
              value={description}
              onChangeText={setDescription}
              placeholder={t('supportProvider.materialsLibrary.uploadModal.placeholderDescription')}
              {...styles.formInputField}
            />
          </Textarea>
        </VStack>

        {/* Category & Format Type Row */}
        <HStack {...styles.categoryFormatRow}>
          <VStack {...styles.formInputGroup} {...styles.categoryFormatCol}>
            <HStack {...styles.formLabelRow}>
              <Text {...styles.formLabelText}>
                {t('supportProvider.materialsLibrary.uploadModal.labelCategory')}
              </Text>
              <Text {...styles.formRequiredText}>*</Text>
            </HStack>
            <Select selectedValue={category} onValueChange={setCategory}>
              <SelectTrigger {...styles.selectTrigger}>
                <SelectInput placeholder={t('supportProvider.materialsLibrary.filters.allCategories')} {...styles.selectInputProps} />
                <SelectIcon {...styles.selectIconWrapper}>
                  <LucideIcon name="ChevronDown" size={styles.selectChevronIcon.size} color={styles.selectChevronIcon.color} />
                </SelectIcon>
              </SelectTrigger>
              <SelectPortal>
                <SelectBackdrop />
                <SelectContent>
                  {categoryOptions.map((opt) => (
                    <SelectItem key={opt.value} label={opt.label} value={opt.value} />
                  ))}
                </SelectContent>
              </SelectPortal>
            </Select>
          </VStack>

          <VStack {...styles.formInputGroup} {...styles.categoryFormatCol}>
            <HStack {...styles.formLabelRow}>
              <Text {...styles.formLabelText}>
                {t('supportProvider.materialsLibrary.uploadModal.labelFormatType')}
              </Text>
              <Text {...styles.formRequiredText}>*</Text>
            </HStack>
            <Select selectedValue={format} onValueChange={setFormat}>
              <SelectTrigger {...styles.selectTrigger}>
                <SelectInput placeholder={t('supportProvider.materialsLibrary.filters.allFormats')} {...styles.selectInputProps} />
                <SelectIcon {...styles.selectIconWrapper}>
                  <LucideIcon name="ChevronDown" size={styles.selectChevronIcon.size} color={styles.selectChevronIcon.color} />
                </SelectIcon>
              </SelectTrigger>
              <SelectPortal>
                <SelectBackdrop />
                <SelectContent>
                  {FORMAT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} label={opt.label} value={opt.value} />
                  ))}
                </SelectContent>
              </SelectPortal>
            </Select>
          </VStack>
        </HStack>

        {/* File Name Input */}
        <VStack {...styles.formInputGroup}>
          <Text {...styles.formLabelText}>
            {t('supportProvider.materialsLibrary.uploadModal.labelFileName')}
          </Text>
          <Input {...styles.formInput}>
            <InputField
              value={fileName}
              onChangeText={setFileName}
              placeholder={t('supportProvider.materialsLibrary.uploadModal.placeholderFileName')}
              {...styles.formInputField}
            />
          </Input>
        </VStack>

        {/* Associated Offering Input */}
        <VStack {...styles.formInputGroup}>
          <Text {...styles.formLabelText}>
            {t('supportProvider.materialsLibrary.uploadModal.labelAssociatedOffering')}
          </Text>
          <Input {...styles.formInput}>
            <InputField
              value={associatedOffering}
              onChangeText={setAssociatedOffering}
              placeholder={t('supportProvider.materialsLibrary.uploadModal.placeholderAssociatedOffering')}
              {...styles.formInputField}
            />
          </Input>
        </VStack>
      </VStack>
    </Modal>
  );
}
