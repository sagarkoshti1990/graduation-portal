import React from 'react';
import Modal from '@components/ui/Modal';
import { VStack, HStack, Text, Button, ButtonText, LucideIcon, Box } from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import moment from 'moment';
import styles from '../styles';

interface ConfirmAssignmentProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<any>;
  session: any;
  selectedParticipants: any[];
  title?: string;
  subtitle?: string;
  confirmButtonLabel?: string;
}

export default function ConfirmAssignment({
  isOpen,
  onClose,
  onConfirm,
  session,
  selectedParticipants,
  title,
  subtitle,
  confirmButtonLabel,
}: ConfirmAssignmentProps): React.JSX.Element {
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  if (!isOpen) return <></>;

  const sessionName = session?.title || session?.name || '';
  const dateStr = session?.start_date || session?.createdAt
    ? moment(session?.start_date || session?.createdAt).format('YYYY/MM/DD')
    : '';

  const formatText = session?.delivery_mode === 'in_person' || session?.delivery_mode === 'in-person'
    ? t('lc.sessionsSupport.confirmAssignment.inPerson')
    : session?.delivery_mode === 'online'
      ? t('lc.sessionsSupport.confirmAssignment.online')
      : t('lc.sessionsSupport.confirmAssignment.hybrid');

  const sessionMeta = dateStr && formatText ? `${dateStr}  •  ${formatText}` : (dateStr || formatText || '');

  const footerContent = (
    <HStack {...styles.confirmAssignmentFooter}>
      <Button
        variant="outline"
        {...styles.confirmAssignmentCancelButton}
        onPress={onClose}
        isDisabled={isSubmitting}
      >
        <ButtonText {...styles.confirmAssignmentCancelButtonText}>
          {t('lc.sessionsSupport.confirmAssignment.cancel')}
        </ButtonText>
      </Button>
      <Button
        {...styles.confirmAssignmentConfirmButton}
        variant="solid"
        onPress={async () => {
          setIsSubmitting(true);
          try {
            await onConfirm();
          } finally {
            setIsSubmitting(false);
          }
        }}
        isDisabled={isSubmitting}
      >
        <ButtonText {...styles.confirmAssignmentConfirmButtonText}>
          {confirmButtonLabel || t('lc.sessionsSupport.confirmAssignment.confirm')}
        </ButtonText>
      </Button>
    </HStack>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      headerTitle={title || t('lc.sessionsSupport.confirmAssignment.title')}
      headerDescription={subtitle || t('lc.sessionsSupport.confirmAssignment.subtitle')}
      showCloseButton={true}
      footerContent={footerContent}
    >
      <VStack {...styles.confirmAssignmentContainer}>
        {/* Session details box */}
        <Box {...styles.confirmAssignmentSessionBox}>
          <Text {...styles.confirmAssignmentSessionName}>{sessionName}</Text>
          {sessionMeta ? (
            <Text {...styles.confirmAssignmentSessionMeta}>{sessionMeta}</Text>
          ) : null}
        </Box>

        {/* Selected participants list */}
        <Text {...styles.confirmAssignmentSectionHeader}>
          {t('lc.sessionsSupport.confirmAssignment.participantsCount', {
            count: selectedParticipants.length,
          })}
        </Text>

        <VStack space="xs" width="100%" mb="$6">
          {selectedParticipants.map((p, idx) => (
            <HStack key={p.userId || idx} {...styles.confirmAssignmentParticipantRow}>
              <LucideIcon name="CheckCircle2" size={16} color="$green600" />
              <HStack {...styles.confirmAssignmentParticipantNameTextContainer}>
                <Text {...styles.confirmAssignmentParticipantName}>{p.name}</Text>
                <Text {...styles.confirmAssignmentParticipantId}>({p.userId})</Text>
              </HStack>
            </HStack>
          ))}
        </VStack>
      </VStack>
    </Modal>
  );
}
