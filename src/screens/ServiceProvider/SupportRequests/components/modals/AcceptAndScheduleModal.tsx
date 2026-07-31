import React, { useState, useEffect } from 'react';
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
import modalStyles from '../../styles';
import { useLanguage } from '@contexts/LanguageContext';

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
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState<string>(DURATION_OPTIONS[2].value);
  const [location, setLocation] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (item) {
      setDate(item?.preferredDate || t(`${BASE_PATH}.fallbacks.date`));
      setTime(
        item?.preferredTime
          ? `${item.preferredTime} AM`
          : t(`${BASE_PATH}.fallbacks.time`),
      );
      setLocation(
        item?.preferredLocation ||
          item?.location ||
          t(`${BASE_PATH}.fallbacks.location`),
      );
      setMeetingLink(t(`${BASE_PATH}.fallbacks.meetingLink`));
    }
  }, [item, t]);

  if (!isOpen) return <></>;

  const coachName = item?.coach || '';
  const participants = item?.participants || 0;
  const requestedDate =
    item?.requestedDate ||
    item?.preferredDate ||
    t(`${BASE_PATH}.fallbacks.date`);

  const handleSubmit = () => {
    onSubmit?.({
      date,
      time,
      duration,
      location,
      meetingLink,
      notes,
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

        {/* Date & Time Row */}
        <HStack {...modalStyles.modalRowFullWidth}>
          {/* Date Input */}
          <VStack {...modalStyles.modalColFlex1}>
            <HStack {...modalStyles.labelRow}>
              <Text {...modalStyles.labelText}>
                {t(`${BASE_PATH}.labels.date`)}
              </Text>
              <Text {...modalStyles.requiredAsterisk}>
                *
              </Text>
            </HStack>

            <Input {...modalStyles.inputStyle}>
              <InputField
                value={date}
                onChangeText={setDate}
                {...modalStyles.modalInputField}
              />
              <LucideIcon name="Calendar" {...modalStyles.iconInputCalendar} />
            </Input>
          </VStack>

          {/* Time Input */}
          <VStack {...modalStyles.modalColFlex1}>
            <HStack {...modalStyles.labelRow}>
              <Text {...modalStyles.labelText}>
                {t(`${BASE_PATH}.labels.time`)}
              </Text>
              <Text {...modalStyles.requiredAsterisk}>
                *
              </Text>
            </HStack>

            <Input {...modalStyles.inputStyle}>
              <InputField
                value={time}
                onChangeText={setTime}
                {...modalStyles.modalInputField}
              />
              <LucideIcon name="Clock" {...modalStyles.iconInputClock} />
            </Input>
          </VStack>
        </HStack>

        {/* Duration Select */}
        <VStack {...modalStyles.modalColFullWidth}>
          <HStack {...modalStyles.labelRow}>
            <Text {...modalStyles.labelText}>
              {t(`${BASE_PATH}.labels.duration`)}
            </Text>
            <Text {...modalStyles.requiredAsterisk}>
              *
            </Text>
          </HStack>

          <Select selectedValue={duration} onValueChange={setDuration}>
            <SelectTrigger {...modalStyles.selectTriggerStyle}>
              <SelectInput {...modalStyles.modalInputField} />
              <SelectIcon {...modalStyles.selectIconStyle}>
                <LucideIcon name="ChevronDown" {...modalStyles.iconSelectChevron} />
              </SelectIcon>
            </SelectTrigger>
            <SelectPortal>
              <SelectBackdrop />
              <SelectContent>
                {DURATION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} label={t(opt.label)} value={opt.value} />
                ))}
              </SelectContent>
            </SelectPortal>
          </Select>
        </VStack>

        {/* Location / Venue Input */}
        <VStack {...modalStyles.modalColFullWidth}>
          <Text {...modalStyles.labelText}>
            {t(`${BASE_PATH}.labels.locationVenue`)}
          </Text>

          <Input {...modalStyles.inputStyle}>
            <InputField
              value={location}
              onChangeText={setLocation}
              placeholder={t(`${BASE_PATH}.placeholders.location`)}
              {...modalStyles.modalInputPlaceholder}
            />
          </Input>
        </VStack>

        {/* Meeting Link Input */}
        <VStack {...modalStyles.modalColFullWidth}>
          <Text {...modalStyles.labelText}>
            {t(`${BASE_PATH}.labels.meetingLink`)}
          </Text>

          <Input {...modalStyles.inputStyle}>
            <InputField
              value={meetingLink}
              onChangeText={setMeetingLink}
              placeholder={t(`${BASE_PATH}.placeholders.meetingLink`)}
              {...modalStyles.modalInputPlaceholder}
            />
          </Input>
        </VStack>

        {/* Notes for Coach */}
        <VStack {...modalStyles.modalColFullWidth}>
          <Text {...modalStyles.labelText}>
            {t(`${BASE_PATH}.labels.notesForCoach`)}
          </Text>

          <Textarea {...modalStyles.textareaStyle}>
            <TextareaInput
              value={notes}
              onChangeText={setNotes}
              placeholder={t(`${BASE_PATH}.placeholders.notes`)}
              {...modalStyles.modalInputPlaceholder}
            />
          </Textarea>
        </VStack>
      </VStack>
    </Modal>
  );
}
