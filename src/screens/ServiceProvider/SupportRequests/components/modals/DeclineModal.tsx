import React, { useState } from 'react';
import {
  Box,
  HStack,
  VStack,
  Text,
  Pressable,
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
import {
  SUPPORT_REQUEST_BUTTON_TEXTS,
  SUPPORT_REQUEST_TITLES,
  SUPPORT_REQUEST_LABELS,
  SUPPORT_REQUEST_PLACEHOLDERS,
  SUPPORT_REQUEST_HINTS,
  DECLINE_REASON_OPTIONS,
} from '@constants/SUPPORT_REQUESTS';
import modalStyles from '../../styles';
import { useLanguage } from '@contexts/LanguageContext';

export interface DeclineModalProps {
  isOpen: boolean;
  onClose: () => void;
  item?: any;
  onSubmit?: (reason: string, details: string) => void;
}

export default function DeclineModal({
  isOpen,
  onClose,
  item,
  onSubmit,
}: DeclineModalProps): React.JSX.Element {
  const { t } = useLanguage();
  const [selectedReason, setSelectedReason] = useState('');
  const [reasonDetails, setReasonDetails] = useState('');

  if (!isOpen) return <></>;

  const requestTitle = item?.title || '';
  const coachName = item?.coach || '';

  const handleSubmit = () => {
    onSubmit?.(selectedReason, reasonDetails);
    setSelectedReason('');
    setReasonDetails('');
    onClose();
  };

  const handleClose = () => {
    setSelectedReason('');
    setReasonDetails('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      {...modalStyles.modalPropsMd}
      headerTitle={t(SUPPORT_REQUEST_TITLES.DECLINE)}
      footerContent={
        <HStack {...modalStyles.modalFooterRow}>
          {/* Cancel Button */}
          <Pressable
            onPress={handleClose}
            {...modalStyles.declineCancelBtn}
          >
            <Text {...modalStyles.declineModalCancelText}>
              {t(SUPPORT_REQUEST_BUTTON_TEXTS.CANCEL)}
            </Text>
          </Pressable>

          {/* Confirm Decline Button */}
          <Pressable
            onPress={handleSubmit}
            {...modalStyles.declineConfirmBtn}
          >
            <HStack {...modalStyles.modalConfirmRow}>
              <LucideIcon name="X" {...modalStyles.iconDeclineConfirm} />
              <Text {...modalStyles.modalConfirmText}>
                {t(SUPPORT_REQUEST_BUTTON_TEXTS.CONFIRM_DECLINE)}
              </Text>
            </HStack>
          </Pressable>
        </HStack>
      }
    >
      <VStack {...modalStyles.modalBodyVStack}>
        {/* Light Orange Summary Box */}
        <Box {...modalStyles.declineSummaryBox}>
          <VStack {...modalStyles.summaryVStack}>
            <HStack {...modalStyles.labelRow}>
              <Text {...modalStyles.declineSummaryTitleText}>
                {t(SUPPORT_REQUEST_LABELS.REQUEST)}
              </Text>
              <Text {...modalStyles.declineSummaryValueText}>
                {requestTitle}
              </Text>
            </HStack>

            <HStack {...modalStyles.labelRow}>
              <Text {...modalStyles.declineSummaryTitleText}>
                {t(SUPPORT_REQUEST_LABELS.COACH)}
              </Text>
              <Text {...modalStyles.declineSummaryValueText}>
                {coachName}
              </Text>
            </HStack>
          </VStack>
        </Box>

        {/* Select Reason Dropdown */}
        <VStack {...modalStyles.modalColFullWidth}>
          <HStack {...modalStyles.labelRow}>
            <Text {...modalStyles.labelText}>
              {t(SUPPORT_REQUEST_LABELS.SELECT_REASON)}
            </Text>
            <Text {...modalStyles.requiredAsterisk}>
              *
            </Text>
          </HStack>

          <Select
            selectedValue={selectedReason}
            onValueChange={setSelectedReason}
          >
            <SelectTrigger {...modalStyles.declineSelectTrigger}>
              <SelectInput
                placeholder={t(SUPPORT_REQUEST_PLACEHOLDERS.DECLINE_REASON)}
                {...modalStyles.declineSelectInputPlaceholder}
              />
              <SelectIcon {...modalStyles.selectIconStyle}>
                <LucideIcon name="ChevronDown" {...modalStyles.iconDeclineChevron} />
              </SelectIcon>
            </SelectTrigger>
            <SelectPortal>
              <SelectBackdrop />
              <SelectContent>
                {DECLINE_REASON_OPTIONS.map((reason) => (
                  <SelectItem
                    key={reason.value}
                    label={t(reason.label)}
                    value={reason.value}
                  />
                ))}
              </SelectContent>
            </SelectPortal>
          </Select>
        </VStack>

        {/* Reason Details Input */}
        <VStack {...modalStyles.modalColFullWidth}>
          <Text {...modalStyles.labelText}>
            {t(SUPPORT_REQUEST_LABELS.REASON_DETAILS)}
          </Text>

          <Textarea {...modalStyles.declineTextarea}>
            <TextareaInput
              value={reasonDetails}
              onChangeText={setReasonDetails}
              placeholder={t(SUPPORT_REQUEST_PLACEHOLDERS.DECLINE_DETAILS)}
              {...modalStyles.declineSelectInputPlaceholder}
            />
          </Textarea>

          <Text {...modalStyles.declineHintText}>
            {t(SUPPORT_REQUEST_HINTS.DECLINE)}
          </Text>
        </VStack>
      </VStack>
    </Modal>
  );
}
