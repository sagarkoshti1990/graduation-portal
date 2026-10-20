import React, { useEffect, useState } from 'react';
import Modal from '@components/ui/Modal';
import { VStack, Text, Box, LucideIcon, Textarea, TextareaInput } from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import { theme } from '@config/theme';

const REASON_MAX_LENGTH = 500;

interface CancelInterventionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  statusLabel: string;
  participantsInfo?: string;
  supportTypeLabel: string;
  location?: string;
  isSubmitting?: boolean;
  onConfirmCancel: (reason: string) => void;
}

const CancelInterventionModal: React.FC<CancelInterventionModalProps> = ({
  isOpen,
  onClose,
  title,
  statusLabel,
  participantsInfo,
  supportTypeLabel,
  location,
  isSubmitting = false,
  onConfirmCancel,
}) => {
  const { t } = useLanguage();
  const [reason, setReason] = useState('');
  const [showReasonError, setShowReasonError] = useState(false);

  // Start with an empty reason every time the modal is opened
  useEffect(() => {
    if (isOpen) {
      setReason('');
      setShowReasonError(false);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      setShowReasonError(true);
      return;
    }
    onConfirmCancel(trimmedReason);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      headerIcon={<LucideIcon name="XCircle" size={22} color={theme.tokens.colors.error600} />}
      headerTitle={t('supportProvider.supportOfferings.cancelModal.title', 'Cancel Support Intervention')}
      headerDescription={title}
      showCloseButton
      cancelButtonText={t('supportProvider.supportOfferings.cancelModal.keep', 'Keep Intervention')}
      confirmButtonText={t('supportProvider.supportOfferings.cancelModal.confirm', 'Confirm Cancel Intervention')}
      confirmButtonColor={theme.tokens.colors.error600}
      confirmLoading={isSubmitting}
      onCancel={onClose}
      onConfirm={handleConfirm}
    >
      <VStack space="md">
        <Text fontSize="$sm" color="$textPrimary">
          {t(
            'supportProvider.supportOfferings.cancelModal.confirmText',
            'Are you sure you want to cancel this upcoming intervention?',
          )}
        </Text>

        <Box bg="$error50" borderWidth={1} borderColor="$error200" borderRadius="$lg" p="$3.5">
          <VStack space="xs">
            <Text fontWeight="$bold" fontSize="$sm" color="$error700">
              {title}
            </Text>
            <Text fontSize="$xs" color="$error700">
              {`• ${t('supportProvider.supportOfferings.cancelModal.status', 'Status')}: ${statusLabel}${participantsInfo ? ` (${participantsInfo})` : ''}`}
            </Text>
            <Text fontSize="$xs" color="$error700">
              {`• ${t('supportProvider.supportOfferings.cancelModal.supportType', 'Support Type')}: ${supportTypeLabel}`}
            </Text>
            {location ? (
              <Text fontSize="$xs" color="$error700">
                {`• ${t('supportProvider.supportOfferings.cancelModal.location', 'Location')}: ${location}`}
              </Text>
            ) : null}
          </VStack>
        </Box>

        <VStack space="xs">
          <Text fontSize="$sm" fontWeight="$medium" color="$textPrimary">
            {t('supportProvider.supportOfferings.cancelModal.reasonLabel', 'Reason for cancellation')}
            <Text color="$error600"> *</Text>
          </Text>
          <Textarea
            isDisabled={isSubmitting}
            isInvalid={showReasonError}
            borderColor={showReasonError ? '$error600' : undefined}
          >
            <TextareaInput
              value={reason}
              maxLength={REASON_MAX_LENGTH}
              placeholder={t(
                'supportProvider.supportOfferings.cancelModal.reasonPlaceholder',
                'Enter the reason for cancelling this intervention',
              )}
              placeholderTextColor="$textMuted"
              onChangeText={(value: string) => {
                setReason(value);
                if (showReasonError && value.trim()) setShowReasonError(false);
              }}
            />
          </Textarea>
          {showReasonError ? (
            <Text fontSize="$xs" color="$error600">
              {t('supportProvider.supportOfferings.cancelModal.reasonRequired', 'Please enter a reason for cancellation.')}
            </Text>
          ) : null}
        </VStack>

        <Text fontSize="$xs" color="$textMuted">
          {t(
            'supportProvider.supportOfferings.cancelModal.note',
            'Cancelling this intervention will update its status to cancelled in your offerings portfolio.',
          )}
        </Text>
      </VStack>
    </Modal>
  );
};

export default CancelInterventionModal;
