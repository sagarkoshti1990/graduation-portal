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
} from '../../constants/supportRequests.constants';

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
      size="md"
      headerTitle={SUPPORT_REQUEST_TITLES.DECLINE}
      footerContent={
        <HStack space="sm" width="$full" justifyContent="flex-end" alignItems="center">
          {/* Cancel Button */}
          <Pressable
            onPress={handleClose}
            borderWidth={1}
            borderColor="$gray200"
            bg="$white"
            px="$4"
            py="$2.5"
            borderRadius="$lg"
            sx={{ ':active': { bg: '$gray50' } }}
          >
            <Text fontSize="$sm" fontWeight="$bold" color="$textDark900">
              {SUPPORT_REQUEST_BUTTON_TEXTS.CANCEL}
            </Text>
          </Pressable>

          {/* Confirm Decline Button */}
          <Pressable
            onPress={handleSubmit}
            bg="$red600"
            px="$5"
            py="$2.5"
            borderRadius="$lg"
            sx={{ ':active': { opacity: 0.85 } }}
          >
            <HStack space="sm" alignItems="center">
              <LucideIcon name="X" size={15} color="$white" />
              <Text fontSize="$sm" fontWeight="$bold" color="$white">
                {SUPPORT_REQUEST_BUTTON_TEXTS.CONFIRM_DECLINE}
              </Text>
            </HStack>
          </Pressable>
        </HStack>
      }
    >
      <VStack space="md" width="100%" py="$2">
        {/* Light Orange Summary Box */}
        <Box
          bg="$orange50"
          borderWidth={1}
          borderColor="$orange100"
          p="$4"
          borderRadius="$xl"
        >
          <VStack space="xs">
            <HStack space="xs" alignItems="center">
              <Text fontSize="$sm" fontWeight="$bold" color="$orange800">
                {SUPPORT_REQUEST_LABELS.REQUEST}
              </Text>
              <Text fontSize="$sm" fontWeight="$medium" color="$orange600">
                {requestTitle}
              </Text>
            </HStack>

            <HStack space="xs" alignItems="center">
              <Text fontSize="$sm" fontWeight="$bold" color="$orange800">
                {SUPPORT_REQUEST_LABELS.COACH}
              </Text>
              <Text fontSize="$sm" fontWeight="$medium" color="$orange600">
                {coachName}
              </Text>
            </HStack>
          </VStack>
        </Box>

        {/* Select Reason Dropdown */}
        <VStack space="xs">
          <HStack space="xs" alignItems="center">
            <Text fontSize="$sm" fontWeight="$bold" color="$textDark900">
              {SUPPORT_REQUEST_LABELS.SELECT_REASON}
            </Text>
            <Text fontSize="$sm" fontWeight="$bold" color="$red600">
              *
            </Text>
          </HStack>

          <Select
            selectedValue={selectedReason}
            onValueChange={setSelectedReason}
          >
            <SelectTrigger
              borderWidth={1}
              borderColor="$gray200"
              borderRadius="$lg"
              bg="$white"
              px="$3"
              py="$2.5"
              justifyContent="space-between"
              alignItems="center"
              $focus-borderColor="$red600"
            >
              <SelectInput
                placeholder={SUPPORT_REQUEST_PLACEHOLDERS.DECLINE_REASON}
                placeholderTextColor="$gray300"
                fontSize="$sm"
                color="$textDark900"
              />
              <SelectIcon mr="$1">
                <LucideIcon name="ChevronDown" size={18} color="$gray300" />
              </SelectIcon>
            </SelectTrigger>
            <SelectPortal>
              <SelectBackdrop />
              <SelectContent>
                {DECLINE_REASON_OPTIONS.map((reason) => (
                  <SelectItem
                    key={reason.value}
                    label={reason.label}
                    value={reason.value}
                  />
                ))}
              </SelectContent>
            </SelectPortal>
          </Select>
        </VStack>

        {/* Reason Details Input */}
        <VStack space="xs">
          <Text fontSize="$sm" fontWeight="$bold" color="$textDark900">
            {SUPPORT_REQUEST_LABELS.REASON_DETAILS}
          </Text>

          <Textarea
            borderWidth={1}
            borderColor="$gray200"
            borderRadius="$lg"
            bg="$white"
            h={100}
            p="$1"
            $focus-borderColor="$red600"
          >
            <TextareaInput
              value={reasonDetails}
              onChangeText={setReasonDetails}
              placeholder={SUPPORT_REQUEST_PLACEHOLDERS.DECLINE_DETAILS}
              placeholderTextColor="$gray300"
              fontSize="$sm"
              color="$textDark900"
            />
          </Textarea>

          <Text fontSize="$xs" color="$gray400" mt="$1">
            {SUPPORT_REQUEST_HINTS.DECLINE}
          </Text>
        </VStack>
      </VStack>
    </Modal>
  );
}
