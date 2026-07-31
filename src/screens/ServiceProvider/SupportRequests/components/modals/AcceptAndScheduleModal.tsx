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
} from '../../constants/supportRequests.constants';

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
      size="lg"
      maxWidth={680}
      headerTitle={SUPPORT_REQUEST_TITLES.ACCEPT_SCHEDULE}
      footerContent={
        <HStack space="sm" width="$full" justifyContent="flex-end" alignItems="center">
          {/* Cancel Button */}
          <Pressable
            onPress={onClose}
            {...modalStyles.modalCancelBtn}
          >
            <Text fontSize="$sm" fontWeight="$bold" color="$textDark700">
              {SUPPORT_REQUEST_BUTTON_TEXTS.CANCEL}
            </Text>
          </Pressable>

          {/* Confirm & Schedule Button */}
          <Pressable
            onPress={handleSubmit}
            {...modalStyles.modalConfirmBtn}
          >
            <HStack space="sm" alignItems="center">
              <LucideIcon name="CheckCircle" size={16} color="$white" />
              <Text fontSize="$sm" fontWeight="$bold" color="$white">
                {SUPPORT_REQUEST_BUTTON_TEXTS.CONFIRM_SCHEDULE}
              </Text>
            </HStack>
          </Pressable>
        </HStack>
      }
    >
      <VStack space="md" width="100%" py="$2">
        {/* Light Blue Summary Box */}
        <Box {...modalStyles.summaryBox}>
          <VStack space="xs">
            <HStack space="xs" alignItems="center" mb="$1">
              <LucideIcon name="Info" size={16} color="$blue800" />
              <Text fontSize="$sm" fontWeight="$bold" color="$blue900">
                {SUPPORT_REQUEST_TITLES.REQUEST_DETAILS}
              </Text>
            </HStack>
            <Text fontSize="$sm" color="$blue800" ml="$6">
              • {SUPPORT_REQUEST_LABELS.COACH}: {coachName}
            </Text>
            <Text fontSize="$sm" color="$blue800" ml="$6">
              • {SUPPORT_REQUEST_LABELS.PARTICIPANTS}: {participants}
            </Text>
            <Text fontSize="$sm" color="$blue800" ml="$6">
              • {SUPPORT_REQUEST_LABELS.REQUESTED_DATE}: {requestedDate}
            </Text>
          </VStack>
        </Box>

        {/* Date & Time Row */}
        <HStack space="sm" width="100%">
          {/* Date Input */}
          <VStack space="xs" flex={1}>
            <HStack space="xs" alignItems="center">
              <Text fontSize="$sm" fontWeight="$bold" color="$textDark900">
                {SUPPORT_REQUEST_LABELS.DATE}
              </Text>
              <Text fontSize="$sm" fontWeight="$bold" color="$red600">
                *
              </Text>
            </HStack>

            <Input {...modalStyles.inputStyle}>
              <InputField
                value={date}
                onChangeText={setDate}
                fontSize="$sm"
                color="$textDark900"
              />
              <LucideIcon name="Calendar" size={16} color="$textDark500" />
            </Input>
          </VStack>

          {/* Time Input */}
          <VStack space="xs" flex={1}>
            <HStack space="xs" alignItems="center">
              <Text fontSize="$sm" fontWeight="$bold" color="$textDark900">
                {SUPPORT_REQUEST_LABELS.TIME}
              </Text>
              <Text fontSize="$sm" fontWeight="$bold" color="$red600">
                *
              </Text>
            </HStack>

            <Input {...modalStyles.inputStyle}>
              <InputField
                value={time}
                onChangeText={setTime}
                fontSize="$sm"
                color="$textDark900"
              />
              <LucideIcon name="Clock" size={16} color="$textDark500" />
            </Input>
          </VStack>
        </HStack>

        {/* Duration Select */}
        <VStack space="xs">
          <HStack space="xs" alignItems="center">
            <Text fontSize="$sm" fontWeight="$bold" color="$textDark900">
              {SUPPORT_REQUEST_LABELS.DURATION}
            </Text>
            <Text fontSize="$sm" fontWeight="$bold" color="$red600">
              *
            </Text>
          </HStack>

          <Select selectedValue={duration} onValueChange={setDuration}>
            <SelectTrigger
              {...modalStyles.inputStyle}
              justifyContent="space-between"
              alignItems="center"
              py="$2.5"
            >
              <SelectInput fontSize="$sm" color="$textDark900" />
              <SelectIcon mr="$1">
                <LucideIcon name="ChevronDown" size={18} color="$textDark500" />
              </SelectIcon>
            </SelectTrigger>
            <SelectPortal>
              <SelectBackdrop />
              <SelectContent>
                {DURATION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} label={opt.label} value={opt.value} />
                ))}
              </SelectContent>
            </SelectPortal>
          </Select>
        </VStack>

        {/* Location / Venue Input */}
        <VStack space="xs">
          <Text fontSize="$sm" fontWeight="$bold" color="$textDark900">
            {SUPPORT_REQUEST_LABELS.LOCATION_VENUE}
          </Text>

          <Input {...modalStyles.inputStyle}>
            <InputField
              value={location}
              onChangeText={setLocation}
              placeholder={SUPPORT_REQUEST_PLACEHOLDERS.LOCATION}
              placeholderTextColor="$textDark400"
              fontSize="$sm"
              color="$textDark900"
            />
          </Input>
        </VStack>

        {/* Meeting Link Input */}
        <VStack space="xs">
          <Text fontSize="$sm" fontWeight="$bold" color="$textDark900">
            {SUPPORT_REQUEST_LABELS.MEETING_LINK}
          </Text>

          <Input {...modalStyles.inputStyle}>
            <InputField
              value={meetingLink}
              onChangeText={setMeetingLink}
              placeholder={SUPPORT_REQUEST_PLACEHOLDERS.MEETING_LINK}
              placeholderTextColor="$textDark400"
              fontSize="$sm"
              color="$textDark900"
            />
          </Input>
        </VStack>

        {/* Notes for Coach */}
        <VStack space="xs">
          <Text fontSize="$sm" fontWeight="$bold" color="$textDark900">
            {SUPPORT_REQUEST_LABELS.NOTES_FOR_COACH}
          </Text>

          <Textarea {...modalStyles.textareaStyle}>
            <TextareaInput
              value={notes}
              onChangeText={setNotes}
              placeholder={SUPPORT_REQUEST_PLACEHOLDERS.NOTES}
              placeholderTextColor="$textDark400"
              fontSize="$sm"
              color="$textDark900"
            />
          </Textarea>
        </VStack>
      </VStack>
    </Modal>
  );
}
