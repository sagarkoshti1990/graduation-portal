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
}

export default function UploadResourceModal({
  isOpen,
  onClose,
  onUpload,
}: UploadResourceModalProps): React.JSX.Element {
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [format, setFormat] = useState('');
  const [fileName, setFileName] = useState('');
  const [associatedOffering, setAssociatedOffering] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const CATEGORY_OPTIONS = [
    { label: t('supportProvider.materialsLibrary.categories.financialLiteracy'), value: 'Financial Literacy' },
    { label: t('supportProvider.materialsLibrary.categories.businessManagement'), value: 'Business Management' },
    { label: t('supportProvider.materialsLibrary.categories.assetEquipment'), value: 'Asset & Equipment Support' },
    { label: t('supportProvider.materialsLibrary.categories.legalCompliance'), value: 'Legal & Compliance' },
  ];

  const FORMAT_OPTIONS = [
    { label: t('supportProvider.materialsLibrary.formats.pdf'), value: 'PDF Document' },
    { label: t('supportProvider.materialsLibrary.formats.template'), value: 'Templates & Decks' },
    { label: t('supportProvider.materialsLibrary.formats.video'), value: 'Video Guide' },
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

    onUpload({
      title,
      description,
      category,
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
                  {CATEGORY_OPTIONS.map((opt) => (
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
