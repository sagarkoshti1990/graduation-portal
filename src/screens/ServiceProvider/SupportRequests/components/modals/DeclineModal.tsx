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
import modalStyles from '../../styles';
import { useLanguage } from '@contexts/LanguageContext';

const BASE_PATH = 'supportProvider.supportRequests';

const DECLINE_REASON_OPTIONS = [
  { label: `${BASE_PATH}.declineReasons.capacity`, value: 'capacity' },
  { label: `${BASE_PATH}.declineReasons.outsideScope`, value: 'outside_scope' },
  { label: `${BASE_PATH}.declineReasons.scheduleConflict`, value: 'schedule_conflict' },
  { label: `${BASE_PATH}.declineReasons.other`, value: 'other' },
];

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
      headerTitle={t(`${BASE_PATH}.titles.decline`)}
      footerContent={
        <HStack {...modalStyles.modalFooterRow}>
          {/* Cancel Button */}
          <Pressable
            onPress={handleClose}
            {...modalStyles.declineCancelBtn}
          >
            <Text {...modalStyles.declineModalCancelText}>
              {t(`${BASE_PATH}.buttonTexts.cancel`)}
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
                {t(`${BASE_PATH}.buttonTexts.confirmDecline`)}
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
                {t(`${BASE_PATH}.labels.request`)}
              </Text>
              <Text {...modalStyles.declineSummaryValueText}>
                {requestTitle}
              </Text>
            </HStack>

            <HStack {...modalStyles.labelRow}>
              <Text {...modalStyles.declineSummaryTitleText}>
                {t(`${BASE_PATH}.labels.coach`)}
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
              {t(`${BASE_PATH}.labels.selectReason`)}
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
                placeholder={t(`${BASE_PATH}.placeholders.declineReason`)}
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
            {t(`${BASE_PATH}.labels.reasonDetails`)}
          </Text>

          <Textarea {...modalStyles.declineTextarea}>
            <TextareaInput
              value={reasonDetails}
              onChangeText={setReasonDetails}
              placeholder={t(`${BASE_PATH}.placeholders.declineDetails`)}
              {...modalStyles.declineSelectInputPlaceholder}
            />
          </Textarea>

          <Text {...modalStyles.declineHintText}>
            {t(`${BASE_PATH}.hints.decline`)}
          </Text>
        </VStack>
      </VStack>
    </Modal>
  );
}
