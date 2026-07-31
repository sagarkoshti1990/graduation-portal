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
import {
  SUPPORT_REQUEST_BUTTON_TEXTS,
  SUPPORT_REQUEST_TITLES,
  SUPPORT_REQUEST_LABELS,
  SUPPORT_REQUEST_PLACEHOLDERS,
  SUPPORT_REQUEST_FALLBACKS,
  DURATION_OPTIONS,
} from '@constants/SUPPORT_REQUESTS';
import { useLanguage } from '@contexts/LanguageContext';

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
      setDate(item.preferredDate || SUPPORT_REQUEST_FALLBACKS.DATE);
      setTime(
        item.preferredTime
          ? `${item.preferredTime} AM`
          : SUPPORT_REQUEST_FALLBACKS.TIME,
      );
      setLocation(
        item.preferredLocation ||
          item.location ||
          SUPPORT_REQUEST_FALLBACKS.LOCATION,
      );
      setMeetingLink(SUPPORT_REQUEST_FALLBACKS.MEETING_LINK);
    }
  }, [item]);

  if (!isOpen) return <></>;

  const coachName = item?.coach || 'Coach';
  const participants = item?.participants || 0;
  const requestedDate =
    item?.requestedDate ||
    item?.preferredDate ||
    SUPPORT_REQUEST_FALLBACKS.DATE;

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
      headerTitle={t(SUPPORT_REQUEST_TITLES.ACCEPT_SCHEDULE)}
      footerContent={
        <HStack {...modalStyles.modalFooterRow}>
          {/* Cancel Button */}
          <Pressable
            onPress={onClose}
            {...modalStyles.modalCancelBtn}
          >
            <Text {...modalStyles.modalCancelText}>
              {t(SUPPORT_REQUEST_BUTTON_TEXTS.CANCEL)}
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
                {t(SUPPORT_REQUEST_BUTTON_TEXTS.CONFIRM_SCHEDULE)}
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
                {t(SUPPORT_REQUEST_TITLES.REQUEST_DETAILS)}
              </Text>
            </HStack>
            <Text {...modalStyles.summaryDetailText}>
              • {t(SUPPORT_REQUEST_LABELS.COACH)}: {coachName}
            </Text>
            <Text {...modalStyles.summaryDetailText}>
              • {t(SUPPORT_REQUEST_LABELS.PARTICIPANTS)}: {participants}
            </Text>
            <Text {...modalStyles.summaryDetailText}>
              • {t(SUPPORT_REQUEST_LABELS.REQUESTED_DATE)}: {requestedDate}
            </Text>
          </VStack>
        </Box>

        {/* Date & Time Row */}
        <HStack {...modalStyles.modalRowFullWidth}>
          {/* Date Input */}
          <VStack {...modalStyles.modalColFlex1}>
            <HStack {...modalStyles.labelRow}>
              <Text {...modalStyles.labelText}>
                {t(SUPPORT_REQUEST_LABELS.DATE)}
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
                {t(SUPPORT_REQUEST_LABELS.TIME)}
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
              {t(SUPPORT_REQUEST_LABELS.DURATION)}
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
            {t(SUPPORT_REQUEST_LABELS.LOCATION_VENUE)}
          </Text>

          <Input {...modalStyles.inputStyle}>
            <InputField
              value={location}
              onChangeText={setLocation}
              placeholder={t(SUPPORT_REQUEST_PLACEHOLDERS.LOCATION)}
              {...modalStyles.modalInputPlaceholder}
            />
          </Input>
        </VStack>

        {/* Meeting Link Input */}
        <VStack {...modalStyles.modalColFullWidth}>
          <Text {...modalStyles.labelText}>
            {t(SUPPORT_REQUEST_LABELS.MEETING_LINK)}
          </Text>

          <Input {...modalStyles.inputStyle}>
            <InputField
              value={meetingLink}
              onChangeText={setMeetingLink}
              placeholder={t(SUPPORT_REQUEST_PLACEHOLDERS.MEETING_LINK)}
              {...modalStyles.modalInputPlaceholder}
            />
          </Input>
        </VStack>

        {/* Notes for Coach */}
        <VStack {...modalStyles.modalColFullWidth}>
          <Text {...modalStyles.labelText}>
            {t(SUPPORT_REQUEST_LABELS.NOTES_FOR_COACH)}
          </Text>

          <Textarea {...modalStyles.textareaStyle}>
            <TextareaInput
              value={notes}
              onChangeText={setNotes}
              placeholder={t(SUPPORT_REQUEST_PLACEHOLDERS.NOTES)}
              {...modalStyles.modalInputPlaceholder}
            />
          </Textarea>
        </VStack>
      </VStack>
    </Modal>
  );
}
