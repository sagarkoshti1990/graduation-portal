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
} from '@constants/SUPPORT_REQUESTS';
import modalStyles from '../../styles';
import { useLanguage } from '@contexts/LanguageContext';

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
  const { t } = useLanguage();
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
      {...modalStyles.modalPropsMd}
      headerTitle={t(SUPPORT_REQUEST_TITLES.REQUEST_INFO)}
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

          {/* Send Request Button */}
          <Pressable
            onPress={handleSubmit}
            {...modalStyles.requestInfoBtnSend}
          >
            <HStack {...modalStyles.modalConfirmRow}>
              <LucideIcon name="MessageSquare" {...modalStyles.iconDeclineConfirm} />
              <Text {...modalStyles.modalConfirmText}>
                {t(SUPPORT_REQUEST_BUTTON_TEXTS.SEND_REQUEST)}
              </Text>
            </HStack>
          </Pressable>
        </HStack>
      }
    >
      <VStack {...modalStyles.modalBodyVStack}>
        {/* Light Blue Summary Box */}
        <Box {...modalStyles.requestInfoSummaryBox}>
          <VStack {...modalStyles.summaryVStack}>
            <HStack {...modalStyles.labelRow}>
              <Text {...modalStyles.requestInfoSummaryTitleText}>
                {t(SUPPORT_REQUEST_LABELS.REQUEST)}
              </Text>
              <Text {...modalStyles.requestInfoSummaryValueText}>
                {requestTitle}
              </Text>
            </HStack>

            <HStack {...modalStyles.labelRow}>
              <Text {...modalStyles.requestInfoSummaryTitleText}>
                {t(SUPPORT_REQUEST_LABELS.COACH)}
              </Text>
              <Text {...modalStyles.requestInfoSummaryValueText}>
                {coachName}
              </Text>
            </HStack>
          </VStack>
        </Box>

        {/* Input Form Section */}
        <VStack {...modalStyles.modalColFullWidth}>
          <HStack {...modalStyles.labelRow}>
            <Text {...modalStyles.labelText}>
              {t(SUPPORT_REQUEST_LABELS.YOUR_QUESTION)}
            </Text>
            <Text {...modalStyles.requiredAsterisk}>
              *
            </Text>
          </HStack>

          {/* Multiline Text Input */}
          <Textarea {...modalStyles.declineTextarea}>
            <TextareaInput
              value={message}
              onChangeText={setMessage}
              placeholder={t(SUPPORT_REQUEST_PLACEHOLDERS.REQUEST_INFO)}
              {...modalStyles.declineSelectInputPlaceholder}
            />
          </Textarea>

          <Text {...modalStyles.requestInfoHintText}>
            {t(SUPPORT_REQUEST_HINTS.REQUEST_INFO)}
          </Text>
        </VStack>
      </VStack>
    </Modal>
  );
}
