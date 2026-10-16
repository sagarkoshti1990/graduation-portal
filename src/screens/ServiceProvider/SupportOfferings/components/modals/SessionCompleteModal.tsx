import React, { useEffect, useState } from 'react';
import Modal from '@components/ui/Modal';
import {
  VStack,
  HStack,
  Text,
  Button,
  ButtonText,
  ButtonIcon,
  Pressable,
  LucideIcon,
  Checkbox,
  CheckboxIndicator,
  CheckboxIcon,
  CheckIcon,
  ScrollView,
  Spinner,
  Badge,
  BadgeText,
} from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import type { ParticipantAttendanceItem } from '../../../../../types/supportOfferingsTypes';
import styles from '../../styles';

interface SessionCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionTitle: string;
  expectedParticipantsCount: number;
  initialParticipants?: ParticipantAttendanceItem[];
  isLoadingParticipants?: boolean;
  /** May return a promise; the modal closes only after it resolves and stays open if it rejects */
  onConfirmComplete: (selectedParticipantIds: string[]) => void | Promise<void>;
  title?: string;
  headerDescription?: React.ReactNode;
  headerBadge?: React.ReactNode;
  showParticipantStatusBadge?: boolean;
  cancelButtonText?: string;
  confirmButtonText?: string;
  onCancel?: () => void;
  /** Saved attendance is final: nothing can be ticked, unticked or confirmed */
  isReadOnly?: boolean;
}

// Stable reference so an omitted `initialParticipants` prop doesn't create a new
// array on every render — the effect below re-syncs whenever that reference changes.
const EMPTY_PARTICIPANTS: ParticipantAttendanceItem[] = [];

const SessionCompleteModal: React.FC<SessionCompleteModalProps> = ({
  isOpen,
  onClose,
  sessionTitle,
  expectedParticipantsCount,
  initialParticipants = EMPTY_PARTICIPANTS,
  isLoadingParticipants = false,
  onConfirmComplete,
  title,
  headerDescription,
  headerBadge,
  showParticipantStatusBadge = false,
  cancelButtonText,
  confirmButtonText,
  onCancel,
  isReadOnly = false,
}) => {
  const { t } = useLanguage();
  const [participants, setParticipants] = useState<ParticipantAttendanceItem[]>(initialParticipants);

  // The modal stays mounted while closed, so its own `participants` state must
  // be re-synced whenever the real enrolled list arrives (fetched by the
  // caller after this modal is opened) — it won't pick up prop changes on its own.
  useEffect(() => {
    setParticipants(initialParticipants);
  }, [initialParticipants]);

  const markedPresentCount = participants.filter((p) => p.isPresent).length;

  const handleToggleParticipant = (id: string) => {
    if (isReadOnly) return;
    setParticipants((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isPresent: !p.isPresent } : p))
    );
  };

  const handleMarkAll = () => {
    setParticipants((prev) => prev.map((p) => ({ ...p, isPresent: true })));
  };

  const handleClearAll = () => {
    setParticipants((prev) => prev.map((p) => ({ ...p, isPresent: false })));
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  // The modal stays mounted, so a previous submit must not block the next time it is opened
  useEffect(() => {
    if (isOpen) setIsSubmitting(false);
  }, [isOpen]);

  // Completion needs at least one enrolled participant; otherwise a session could be completed with nobody in it
  const hasNoParticipants = isLoadingParticipants || participants.length === 0;
  // Everyone was already marked present when opened and still is, so there is nothing new to save
  const isAllAlreadyPresent =
    initialParticipants.length > 0 &&
    initialParticipants.every((p) => p.isPresent) &&
    markedPresentCount === participants.length;
  const isConfirmDisabled = isReadOnly || hasNoParticipants || markedPresentCount === 0 || isAllAlreadyPresent;

  // Waits for the save so the modal only closes on success; on failure the caller shows the error and the user can retry
  const submitCompletion = async (selectedIds: string[]) => {
    setIsSubmitting(true);
    try {
      await onConfirmComplete(selectedIds);
      onClose();
    } catch {
      // Error message is shown by the caller
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirm = () => {
    if (isSubmitting || isConfirmDisabled) return;
    const selectedIds = participants
      .filter((p) => p.isPresent)
      .map((p) => String(p.id));
    submitCompletion(selectedIds);
  };

  // Without onCancel, "Skip" itself completes the session, so it follows the same rule
  const isSkipDisabled = !onCancel && hasNoParticipants;

  const handleSkip = () => {
    if (isSubmitting || isSkipDisabled) return;
    if (onCancel) {
      onCancel();
      onClose();
    } else {
      submitCompletion([]);
    }
  };

  const footerContent = (
    <HStack {...styles.modalFooterHStack}>
      <Button
        {...styles.modalFooterSkipButton}
        onPress={handleSkip}
        isDisabled={isSkipDisabled || isSubmitting}
      >
        <ButtonText {...styles.modalFooterSkipButtonText}>
          {cancelButtonText || t('supportProvider.supportOfferings.modal.skipAndMarkComplete')}
        </ButtonText>
      </Button>

      <Button
        {...styles.modalFooterConfirmButton}
        onPress={handleConfirm}
        isDisabled={isConfirmDisabled || isSubmitting}
      >
        {isSubmitting ? (
          <Spinner color="$white" />
        ) : (
          <ButtonIcon as={LucideIcon} name="Check" {...styles.modalButtonIconProps} />
        )}
        <ButtonText {...styles.modalFooterConfirmButtonText}>
          {confirmButtonText || t('supportProvider.supportOfferings.modal.confirmAndComplete')}
        </ButtonText>
      </Button>
    </HStack>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      headerContent={
        headerBadge ? (
          <VStack space="xs" flex={1}>
            {headerBadge}
            <Text fontSize="$lg" fontWeight="$bold" color="$textPrimary">
              {title || t('supportProvider.supportOfferings.modal.headerTitle')}
            </Text>
            {typeof (headerDescription ?? sessionTitle) === 'string' ? (
              <Text fontSize="$sm" color="$textSecondary">
                {headerDescription ?? sessionTitle}
              </Text>
            ) : (
              headerDescription
            )}
          </VStack>
        ) : undefined
      }
      headerTitle={headerBadge ? undefined : (title || t('supportProvider.supportOfferings.modal.headerTitle'))}
      headerDescription={headerBadge ? undefined : (headerDescription ?? sessionTitle)}
      showCloseButton={true}
      footerContent={footerContent}
    >
      <VStack {...styles.cardFullVStack}>
        {/* Top Bar: Count & Mark/Clear All */}
        <HStack {...styles.modalTopBarHStack}>
          <Text {...styles.modalCountText}>
            {t('supportProvider.supportOfferings.modal.markedPresentCount', {
              count: markedPresentCount,
              total: expectedParticipantsCount || participants.length,
            })}
          </Text>

          {!isReadOnly && (
          <HStack {...styles.modalActionsHStack}>
            <Pressable onPress={handleMarkAll}>
              <Text {...styles.modalMarkAllText}>
                {t('supportProvider.supportOfferings.modal.markAll')}
              </Text>
            </Pressable>
            <Text {...styles.modalDividerText}>
              |
            </Text>
            <Pressable onPress={handleClearAll}>
              <Text {...styles.modalClearAllText}>
                {t('supportProvider.supportOfferings.modal.clearAll')}
              </Text>
            </Pressable>
          </HStack>
          )}
        </HStack>

        {/* Participants List */}
        <ScrollView {...styles.modalScrollView}>
          {isLoadingParticipants ? (
            <HStack justifyContent="center" p="$4">
              <Spinner />
            </HStack>
          ) : participants.length === 0 ? (
            <Text {...styles.modalCountText} textAlign="center">
              {t('supportProvider.supportOfferings.modal.noEnrolledParticipants', 'No participants have enrolled in this session yet.')}
            </Text>
          ) : (
            <VStack {...styles.sectionSmVStack}>
              {participants.map((p, idx) => (
                <Pressable
                  key={p.id}
                  onPress={() => handleToggleParticipant(p.id)}
                  disabled={isReadOnly}
                  {...styles.modalParticipantCard}
                >
                  <HStack {...styles.modalParticipantInnerHStack} justifyContent="space-between">
                    <HStack space="md" alignItems="center" flex={1}>
                      <Checkbox
                        size="md"
                        value={p.id}
                        isChecked={p.isPresent}
                        isDisabled={isReadOnly}
                        onChange={() => handleToggleParticipant(p.id)}
                      >
                        <CheckboxIndicator {...styles.modalCheckboxIndicator(p.isPresent)}>
                          <CheckboxIcon as={CheckIcon} color="$white" />
                        </CheckboxIndicator>
                      </Checkbox>

                      <Text {...styles.modalParticipantNumberText}>
                        {String(idx + 1).padStart(2, '0')}
                      </Text>

                      <VStack {...styles.fileTextVStack}>
                        <Text {...styles.modalParticipantNameText}>
                          {p.name}
                        </Text>
                        <Text {...styles.modalParticipantLcText}>
                          {p.lcName}
                        </Text>
                      </VStack>
                    </HStack>

                    {showParticipantStatusBadge ? (
                      <Badge
                        bg={p.isPresent ? '$success50' : '$backgroundLight100'}
                        borderRadius="$full"
                        px="$2.5"
                        py="$0.5"
                      >
                        <BadgeText fontSize="$xs" color={p.isPresent ? '$success600' : '$textMuted'}>
                          {p.isPresent
                            ? t('supportProvider.supportOfferings.modal.completed', 'Completed')
                            : t('supportProvider.supportOfferings.modal.pending', 'Pending')}
                        </BadgeText>
                      </Badge>
                    ) : null}
                  </HStack>
                </Pressable>
              ))}
            </VStack>
          )}
        </ScrollView>
      </VStack>
    </Modal>
  );
};

export default SessionCompleteModal;
