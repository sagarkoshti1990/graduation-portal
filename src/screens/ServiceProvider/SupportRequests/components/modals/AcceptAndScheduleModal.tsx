import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { ACCEPT_AND_SCHEDULE_FORM_SCHEMA } from '@constants/ACCEPT_AND_SCHEDULE_FORM_SCHEMA';

const BASE_PATH = 'supportProvider.supportRequests';

const DURATION_OPTIONS = [
  { label: `${BASE_PATH}.durationOptions.1hour`, value: '1_hour' },
  { label: `${BASE_PATH}.durationOptions.1_5hours`, value: '1.5_hours' },
  { label: `${BASE_PATH}.durationOptions.2hours`, value: '2_hours' },
  { label: `${BASE_PATH}.durationOptions.3hours`, value: '3_hours' },
  { label: `${BASE_PATH}.durationOptions.fullDay`, value: 'full_day' },
];

export interface AcceptAndScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  item?: any;
  onSubmit?: (data: {
    date: string;
    time: string;
    duration: string;
    location: string;
    meetingLink: string;
    notes: string;
  }) => void;
}

export default function AcceptAndScheduleModal({
  isOpen,
  onClose,
  item,
  onSubmit,
}: AcceptAndScheduleModalProps): React.JSX.Element {
  const { t } = useLanguage();
  const [values, setValues] = useState<Record<string, string>>({
    date: '',
    time: '',
    duration: DURATION_OPTIONS[2].value,
    location: '',
    meetingLink: '',
    notes: '',
  });

  const handleFieldChange = useCallback((name: string, value: string) => {
    setValues(prev => ({ ...prev, [name]: value }));
  }, []);

  useEffect(() => {
    if (item) {
      setValues({
        date: item?.preferredDate || t(`${BASE_PATH}.fallbacks.date`),
        time: item?.preferredTime
          ? `${item.preferredTime} AM`
          : t(`${BASE_PATH}.fallbacks.time`),
        duration: DURATION_OPTIONS[2].value,
        location:
          item?.preferredLocation ||
          item?.location ||
          t(`${BASE_PATH}.fallbacks.location`),
        meetingLink: t(`${BASE_PATH}.fallbacks.meetingLink`),
        notes: '',
      });
    }
  }, [item, t]);

  const optionsMap = useMemo(() => {
    return {
      durationOptions: DURATION_OPTIONS.map(opt => ({
        value: opt.value,
        label: t(opt.label) || opt.value,
      })),
    };
  }, [t]);

  if (!isOpen) return <></>;

  const coachName = item?.coach || '';
  const participants = item?.participants || 0;
  const requestedDate =
    item?.requestedDate ||
    item?.preferredDate ||
    t(`${BASE_PATH}.fallbacks.date`);

  const handleSubmit = () => {
    onSubmit?.({
      date: values.date || '',
      time: values.time || '',
      duration: values.duration || DURATION_OPTIONS[2].value,
      location: values.location || '',
      meetingLink: values.meetingLink || '',
      notes: values.notes || '',
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      {...modalStyles.modalPropsLg}
      headerTitle={t(`${BASE_PATH}.titles.acceptSchedule`)}
      footerContent={
        <HStack {...modalStyles.modalFooterRow}>
          {/* Cancel Button */}
          <Pressable
            onPress={onClose}
            {...modalStyles.modalCancelBtn}
          >
            <Text {...modalStyles.modalCancelText}>
              {t(`${BASE_PATH}.buttonTexts.cancel`)}
            </Text>
          </Pressable>

          {/* Confirm & Schedule Button */}
          <Pressable
            onPress={handleSubmit}
            {...modalStyles.modalConfirmBtn}
          >
            <HStack {...modalStyles.modalConfirmRow}>
              <LucideIcon name="CheckCircle" {...modalStyles.iconConfirmCheck} />
              <Text {...modalStyles.modalConfirmText}>
                {t(`${BASE_PATH}.buttonTexts.confirmSchedule`)}
              </Text>
            </HStack>
          </Pressable>
        </HStack>
      }
    >
      <VStack {...modalStyles.modalBodyVStack}>
        {/* Light Blue Summary Box */}
        <Box {...modalStyles.summaryBox}>
          <VStack {...modalStyles.summaryVStack}>
            <HStack {...modalStyles.summaryTitleRow}>
              <LucideIcon name="Info" {...modalStyles.iconSummaryInfo} />
              <Text {...modalStyles.summaryTitleText}>
                {t(`${BASE_PATH}.titles.requestDetails`)}
              </Text>
            </HStack>
            <Text {...modalStyles.summaryDetailText}>
              • {t(`${BASE_PATH}.labels.coach`)}: {coachName}
            </Text>
            <Text {...modalStyles.summaryDetailText}>
              • {t(`${BASE_PATH}.labels.participants`)}: {participants}
            </Text>
            <Text {...modalStyles.summaryDetailText}>
              • {t(`${BASE_PATH}.labels.requestedDate`)}: {requestedDate}
            </Text>
          </VStack>
        </Box>

        {/* Form rendered via Schema */}
        <SchemaFormRenderer
          schema={ACCEPT_AND_SCHEDULE_FORM_SCHEMA}
          values={values}
          optionsMap={optionsMap}
          onFieldChange={handleFieldChange}
          t={t}
        />
      </VStack>
    </Modal>
  );
}
