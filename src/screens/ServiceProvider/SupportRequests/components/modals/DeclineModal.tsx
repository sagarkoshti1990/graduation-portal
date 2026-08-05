import React, { useState, useMemo, useCallback } from 'react';
import {
  Box,
  HStack,
  VStack,
  Text,
  Pressable,
} from '@gluestack-ui/themed';
import Modal from '@components/ui/Modal';
import LucideIcon from '@components/ui/LucideIcon';
import modalStyles from '../../styles';
import { useLanguage } from '@contexts/LanguageContext';
import SchemaFormRenderer from '@components/SchemaFormRenderer';
import { DECLINE_FORM_SCHEMA } from '@constants/DECLINE_FORM_SCHEMA';

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
  const [values, setValues] = useState<Record<string, string>>({
    selectedReason: '',
    reasonDetails: '',
  });

  const handleFieldChange = useCallback((name: string, value: string) => {
    setValues(prev => ({ ...prev, [name]: value }));
  }, []);

  const optionsMap = useMemo(() => {
    return {
      declineReasonOptions: DECLINE_REASON_OPTIONS.map(reason => ({
        value: reason.value,
        label: t(reason.label) || reason.value,
      })),
    };
  }, [t]);

  if (!isOpen) return <></>;

  const requestTitle = item?.title || '';
  const coachName = item?.coach || '';

  const resetForm = () => {
    setValues({
      selectedReason: '',
      reasonDetails: '',
    });
  };

  const handleSubmit = () => {
    onSubmit?.(values.selectedReason || '', values.reasonDetails || '');
    resetForm();
    onClose();
  };

  const handleClose = () => {
    resetForm();
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
                {t(`${BASE_PATH}.labels.coach`)}:
              </Text>
              <Text {...modalStyles.declineSummaryValueText}>
                {coachName}
              </Text>
            </HStack>
          </VStack>
        </Box>

        {/* Form rendered via Schema */}
        <SchemaFormRenderer
          schema={DECLINE_FORM_SCHEMA}
          values={values}
          optionsMap={optionsMap}
          onFieldChange={handleFieldChange}
          t={t}
        />
      </VStack>
    </Modal>
  );
}
