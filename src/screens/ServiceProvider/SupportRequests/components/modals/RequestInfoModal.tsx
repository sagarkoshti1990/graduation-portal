import React, { useState } from 'react';
import { Box, HStack, VStack, Text, Pressable, Textarea, TextareaInput } from '@gluestack-ui/themed';
import Modal from '@components/ui/Modal';
import LucideIcon from '@components/ui/LucideIcon';
import {
  SUPPORT_REQUEST_BUTTON_TEXTS,
  SUPPORT_REQUEST_TITLES,
  SUPPORT_REQUEST_LABELS,
  SUPPORT_REQUEST_PLACEHOLDERS,
  SUPPORT_REQUEST_HINTS,
} from '../../constants/supportRequests.constants';

export interface RequestInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  item?: any;
  onSubmit?: (message: string) => void;
}

export default function RequestInfoModal({
  isOpen,
  onClose,
  item,
  onSubmit,
}: RequestInfoModalProps): React.JSX.Element {
  const [message, setMessage] = useState('');

  if (!isOpen) return <></>;

  const requestTitle = item?.title || '';
  const coachName = item?.coach || '';

  const handleSubmit = () => {
    onSubmit?.(message);
    setMessage('');
    onClose();
  };

  const handleClose = () => {
    setMessage('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="md"
      headerTitle={SUPPORT_REQUEST_TITLES.REQUEST_INFO}
      footerContent={
        <HStack space="sm" width="$full" justifyContent="flex-end" alignItems="center">
          {/* Cancel Button */}
          <Pressable
            onPress={handleClose}
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

          {/* Send Request Button */}
          <Pressable
            onPress={handleSubmit}
            bg="#800020"
            px="$5"
            py="$2.5"
            borderRadius="$lg"
            sx={{ ':active': { opacity: 0.85 } }}
          >
            <HStack space="sm" alignItems="center">
              <LucideIcon name="MessageSquare" size={15} color="$white" />
              <Text fontSize="$sm" fontWeight="$bold" color="$white">
                {SUPPORT_REQUEST_BUTTON_TEXTS.SEND_REQUEST}
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
            <HStack space="xs" alignItems="center">
              <Text fontSize="$sm" fontWeight="$bold" color="#1E3A8A">
                {SUPPORT_REQUEST_LABELS.REQUEST}
              </Text>
              <Text fontSize="$sm" fontWeight="$medium" color="#1E40AF">
                {requestTitle}
              </Text>
            </HStack>

            <HStack space="xs" alignItems="center">
              <Text fontSize="$sm" fontWeight="$bold" color="#1E3A8A">
                {SUPPORT_REQUEST_LABELS.COACH}
              </Text>
              <Text fontSize="$sm" fontWeight="$medium" color="#1E40AF">
                {coachName}
              </Text>
            </HStack>
          </VStack>
        </Box>

        {/* Input Form Section */}
        <VStack space="xs">
          <HStack space="xs" alignItems="center">
            <Text fontSize="$sm" fontWeight="$bold" color="$textDark900">
              {SUPPORT_REQUEST_LABELS.YOUR_QUESTION}
            </Text>
            <Text fontSize="$sm" fontWeight="$bold" color="#DC2626">
              *
            </Text>
          </HStack>

          {/* Multiline Text Input */}
          <Textarea
            borderWidth={1}
            borderColor="#CBD5E1"
            borderRadius="$lg"
            bg="$white"
            h={110}
            p="$1"
            $focus-borderColor="#800020"
          >
            <TextareaInput
              value={message}
              onChangeText={setMessage}
              placeholder={SUPPORT_REQUEST_PLACEHOLDERS.REQUEST_INFO}
              placeholderTextColor="#94A3B8"
              fontSize="$sm"
              color="$textDark900"
            />
          </Textarea>

          <Text fontSize="$xs" color="#64748B" mt="$1">
            {SUPPORT_REQUEST_HINTS.REQUEST_INFO}
          </Text>
        </VStack>
      </VStack>
    </Modal>
  );
}
