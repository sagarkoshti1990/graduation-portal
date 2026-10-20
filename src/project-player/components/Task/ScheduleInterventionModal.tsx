import React, { memo, useCallback } from 'react';
import { Box, Modal, Pressable, Text, VStack } from '@ui';
import { useNavigation } from '@react-navigation/native';
import { useLanguage } from '@contexts/LanguageContext';

const OPTIONS = [
  { key: 'myself', title: 'projectPlayer.conductMyself', desc: 'projectPlayer.conductMyselfDesc' },
  { key: 'supportProvider', title: 'projectPlayer.conductSupportProvider', desc: 'projectPlayer.conductSupportProviderDesc' },
] as const;

interface ScheduleInterventionModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskName?: string;
}

/**
 * "Who will be conducting <task>?" prompt. Picking either option opens the sessions-support page.
 */
const ScheduleInterventionModal = memo<ScheduleInterventionModalProps>(({ isOpen, onClose, taskName }) => {
  const { t } = useLanguage();
  const navigation = useNavigation();

  const handleSelect = useCallback(() => {
    onClose();
    // @ts-ignore
    navigation.navigate('sessions-support');
  }, [navigation, onClose]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      headerTitle={t('projectPlayer.scheduleIntervention')}
      headerAlignment="baseline"
      size="lg"
      cancelButtonText={t('projectPlayer.cancel')}
      confirmButtonText={t('projectPlayer.close')}
    >
      <VStack space="md">
        <Text>
          {taskName
            ? t('projectPlayer.whoWillConduct', { taskName })
            : t('projectPlayer.whoWillConductGeneric')}
        </Text>
        {OPTIONS.map((opt) => (
          <Pressable key={opt.key} onPress={handleSelect}>
            <Box borderWidth={1} borderColor="$borderLight200" borderRadius="$lg" padding="$4" $web-cursor="pointer">
              <Text fontWeight="$semibold">{t(opt.title)}</Text>
              <Text size="sm">{t(opt.desc)}</Text>
            </Box>
          </Pressable>
        ))}
      </VStack>
    </Modal>
  );
});
ScheduleInterventionModal.displayName = 'ScheduleInterventionModal';
export default ScheduleInterventionModal;
