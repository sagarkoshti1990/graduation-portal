import React, { useState } from 'react';
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
} from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import type { ParticipantAttendanceItem } from '../../../../../constants/SUPPORT_OFFERINGS_MOCK';
import styles from '../../styles';

interface SessionCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionTitle: string;
  expectedParticipantsCount: number;
  initialParticipants?: ParticipantAttendanceItem[];
  onConfirmComplete: (presentCount: number) => void;
}

const SessionCompleteModal: React.FC<SessionCompleteModalProps> = ({
  isOpen,
  onClose,
  sessionTitle,
  expectedParticipantsCount,
  initialParticipants = [],
  onConfirmComplete,
}) => {
  const { t } = useLanguage();
  const [participants, setParticipants] = useState<ParticipantAttendanceItem[]>(
    initialParticipants.length > 0
      ? initialParticipants
      : Array.from({ length: expectedParticipantsCount || 6 }).map((_, idx) => ({
          id: String(idx + 1),
          name: `Participant ${idx + 1}`,
          lcName: 'LC: Thandiwe Ndlovu',
          isPresent: false,
        }))
  );

  const markedPresentCount = participants.filter((p) => p.isPresent).length;

  const handleToggleParticipant = (id: string) => {
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

  const handleConfirm = () => {
    onConfirmComplete(markedPresentCount);
    onClose();
  };

  const handleSkip = () => {
    onConfirmComplete(0);
    onClose();
  };

  const footerContent = (
    <HStack {...styles.modalFooterHStack}>
      <Button
        {...styles.modalFooterSkipButton}
        onPress={handleSkip}
      >
        <ButtonText {...styles.modalFooterSkipButtonText}>
          {t('supportProvider.supportOfferings.modal.skipAndMarkComplete')}
        </ButtonText>
      </Button>

      <Button
        {...styles.modalFooterConfirmButton}
        onPress={handleConfirm}
      >
        <ButtonIcon as={LucideIcon} name="Check" {...styles.modalButtonIconProps} />
        <ButtonText {...styles.modalFooterConfirmButtonText}>
          {t('supportProvider.supportOfferings.modal.confirmAndComplete')}
        </ButtonText>
      </Button>
    </HStack>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      headerTitle={t('supportProvider.supportOfferings.modal.headerTitle')}
      headerDescription={sessionTitle}
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
        </HStack>

        {/* Participants List */}
        <ScrollView {...styles.modalScrollView}>
          <VStack {...styles.sectionSmVStack}>
            {participants.map((p, idx) => (
              <Pressable
                key={p.id}
                onPress={() => handleToggleParticipant(p.id)}
                {...styles.modalParticipantCard}
              >
                <HStack {...styles.modalParticipantInnerHStack}>
                  <Checkbox
                    size="md"
                    value={p.id}
                    isChecked={p.isPresent}
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
              </Pressable>
            ))}
          </VStack>
        </ScrollView>
      </VStack>
    </Modal>
  );
};

export default SessionCompleteModal;
