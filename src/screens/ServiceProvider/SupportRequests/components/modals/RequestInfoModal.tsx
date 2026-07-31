import React, { useState } from 'react';
import { Box, HStack, VStack, Text, Pressable, Textarea, TextareaInput } from '@gluestack-ui/themed';
import Modal from '@components/ui/Modal';
import LucideIcon from '@components/ui/LucideIcon';
import modalStyles from '../../styles';
import { useLanguage } from '@contexts/LanguageContext';

const BASE_PATH = 'supportProvider.supportRequests';

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
      headerTitle={t(`${BASE_PATH}.titles.requestInfo`)}
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

          {/* Send Request Button */}
          <Pressable
            onPress={handleSubmit}
            {...modalStyles.requestInfoBtnSend}
          >
            <HStack {...modalStyles.modalConfirmRow}>
              <LucideIcon name="MessageSquare" {...modalStyles.iconDeclineConfirm} />
              <Text {...modalStyles.modalConfirmText}>
                {t(`${BASE_PATH}.buttonTexts.sendRequest`)}
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
                {t(`${BASE_PATH}.labels.request`)}
              </Text>
              <Text {...modalStyles.requestInfoSummaryValueText}>
                {requestTitle}
              </Text>
            </HStack>

            <HStack {...modalStyles.labelRow}>
              <Text {...modalStyles.requestInfoSummaryTitleText}>
                {t(`${BASE_PATH}.labels.coach`)}
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
              {t(`${BASE_PATH}.labels.yourQuestion`)}
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
              placeholder={t(`${BASE_PATH}.placeholders.requestInfo`)}
              {...modalStyles.declineSelectInputPlaceholder}
            />
          </Textarea>

          <Text {...modalStyles.requestInfoHintText}>
            {t(`${BASE_PATH}.hints.requestInfo`)}
          </Text>
        </VStack>
      </VStack>
    </Modal>
  );
}
