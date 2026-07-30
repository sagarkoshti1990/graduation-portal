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
  const [duration, setDuration] = useState(DURATION_OPTIONS[2].value);
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
            borderWidth={1}
            borderColor="#E2E8F0"
            bg="$white"
            px="$4"
            py="$2.5"
            borderRadius="$lg"
            sx={{ ':active': { bg: '#F8FAFC' } }}
          >
            <Text fontSize="$sm" fontWeight="$bold" color="#334155">
              {SUPPORT_REQUEST_BUTTON_TEXTS.CANCEL}
            </Text>
          </Pressable>

          {/* Confirm & Schedule Button */}
          <Pressable
            onPress={handleSubmit}
            bg="#00a63e"
            px="$5"
            py="$2.5"
            borderRadius="$lg"
            shadowColor="#15803D"
            shadowOffset={{ width: 0, height: 2 }}
            shadowOpacity={0.25}
            shadowRadius={6}
            elevation={2}
            sx={{ ':active': { bg: '#15803D' } }}
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
        <Box
          bg="#EFF6FF"
          borderWidth={1}
          borderColor="#BFDBFE"
          p="$4"
          borderRadius="$xl"
        >
          <VStack space="xs">
            <HStack space="xs" alignItems="center" mb="$1">
              <LucideIcon name="Info" size={16} color="#1E40AF" />
              <Text fontSize="$sm" fontWeight="$bold" color="#1E3A8A">
                Request Details
              </Text>
            </HStack>
            <Text fontSize="$sm" color="#1E40AF" ml="$6">
              • Coach: {coachName}
            </Text>
            <Text fontSize="$sm" color="#1E40AF" ml="$6">
              • Participants: {participants}
            </Text>
            <Text fontSize="$sm" color="#1E40AF" ml="$6">
              • Requested Date: {requestedDate}
            </Text>
          </VStack>
        </Box>

        {/* Date & Time Row */}
        <HStack space="sm" width="100%">
          {/* Date Input */}
          <VStack space="xs" flex={1}>
            <HStack space="xs" alignItems="center">
              <Text fontSize="$sm" fontWeight="$bold" color="$textDark900">
                Date
              </Text>
              <Text fontSize="$sm" fontWeight="$bold" color="#DC2626">
                *
              </Text>
            </HStack>

            <Input
              borderWidth={1}
              borderColor="#CBD5E1"
              borderRadius="$lg"
              bg="$white"
              px="$3"
              py="$2"
              $focus-borderColor="#800020"
            >
              <InputField
                value={date}
                onChangeText={setDate}
                fontSize="$sm"
                color="$textDark900"
              />
              <LucideIcon name="Calendar" size={16} color="#64748B" />
            </Input>
          </VStack>

          {/* Time Input */}
          <VStack space="xs" flex={1}>
            <HStack space="xs" alignItems="center">
              <Text fontSize="$sm" fontWeight="$bold" color="$textDark900">
                Time
              </Text>
              <Text fontSize="$sm" fontWeight="$bold" color="#DC2626">
                *
              </Text>
            </HStack>

            <Input
              borderWidth={1}
              borderColor="#CBD5E1"
              borderRadius="$lg"
              bg="$white"
              px="$3"
              py="$2"
              $focus-borderColor="#800020"
            >
              <InputField
                value={time}
                onChangeText={setTime}
                fontSize="$sm"
                color="$textDark900"
              />
              <LucideIcon name="Clock" size={16} color="#64748B" />
            </Input>
          </VStack>
        </HStack>

        {/* Duration Select */}
        <VStack space="xs">
          <HStack space="xs" alignItems="center">
            <Text fontSize="$sm" fontWeight="$bold" color="$textDark900">
              Duration
            </Text>
            <Text fontSize="$sm" fontWeight="$bold" color="#DC2626">
              *
            </Text>
          </HStack>

          <Select selectedValue={duration} onValueChange={setDuration}>
            <SelectTrigger
              borderWidth={1}
              borderColor="#CBD5E1"
              borderRadius="$lg"
              bg="$white"
              px="$3"
              py="$2.5"
              justifyContent="space-between"
              alignItems="center"
              $focus-borderColor="#800020"
            >
              <SelectInput fontSize="$sm" color="$textDark900" />
              <SelectIcon mr="$1">
                <LucideIcon name="ChevronDown" size={18} color="#64748B" />
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
            Location / Venue
          </Text>

          <Input
            borderWidth={1}
            borderColor="#CBD5E1"
            borderRadius="$lg"
            bg="$white"
            px="$3"
            py="$2"
            $focus-borderColor="#800020"
          >
            <InputField
              value={location}
              onChangeText={setLocation}
              placeholder="e.g. Online via Zoom or BRAC Hub Room 1"
              placeholderTextColor="#94A3B8"
              fontSize="$sm"
              color="$textDark900"
            />
          </Input>
        </VStack>

        {/* Meeting Link Input */}
        <VStack space="xs">
          <Text fontSize="$sm" fontWeight="$bold" color="$textDark900">
            Meeting Link (if online)
          </Text>

          <Input
            borderWidth={1}
            borderColor="#CBD5E1"
            borderRadius="$lg"
            bg="$white"
            px="$3"
            py="$2"
            $focus-borderColor="#800020"
          >
            <InputField
              value={meetingLink}
              onChangeText={setMeetingLink}
              placeholder="https://..."
              placeholderTextColor="#94A3B8"
              fontSize="$sm"
              color="$textDark900"
            />
          </Input>
        </VStack>

        {/* Notes for Coach */}
        <VStack space="xs">
          <Text fontSize="$sm" fontWeight="$bold" color="$textDark900">
            Notes for Coach (optional)
          </Text>

          <Textarea
            borderWidth={1}
            borderColor="#CBD5E1"
            borderRadius="$lg"
            bg="$white"
            h={85}
            p="$1"
            $focus-borderColor="#800020"
          >
            <TextareaInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Any additional information or instructions..."
              placeholderTextColor="#94A3B8"
              fontSize="$sm"
              color="$textDark900"
            />
          </Textarea>
        </VStack>
      </VStack>
    </Modal>
  );
}
