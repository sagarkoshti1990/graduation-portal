import React, { useState, useCallback, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { HStack, Text, Box, VStack, Input, InputField, Modal, ButtonText, ButtonIcon, Button, Spinner, useAlert } from '@ui';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';
import { theme } from '@config/theme';
import { useLanguage } from '@contexts/LanguageContext';
import { useAuth } from '@contexts/AuthContext';
import { LucideIcon, Menu } from '@ui';
import { Participant } from '@app-types/screens';
import { styles as dataTableStyles } from '@components/DataTable/Styles';
import { getParticipantsMenuItems } from '@constants/PARTICIPANTS_LIST';
import logger from '@utils/logger';
import { usePlatform } from '@utils/platform';
import ObservationContent from '../Observation/ObservationContent';
import CheckInsListContent from '../ParticipantDetail/Check-ins-list/CheckInsListContent';
import { getTargetedSolutions } from '../../services/solutionService';
import { FILTER_KEYWORDS } from '@constants/LOG_VISIT_CARDS';
import { updateEntityDetails } from '../../services/participantService';
import { STATUS } from '@constants/app.constant';

interface ActionColumnProps {
  participant: Participant;
}

/**
 * Custom trigger for actions menu
 */
const getCustomTrigger = (triggerProps: any) => (
  // @ts-ignore: Button variant
  <Button variant="ghost" {...triggerProps}>
    <ButtonIcon as={LucideIcon} name="MoreVertical" size={16} color="$primary500" />
  </Button>
);

/**
 * ActionColumn Component
 * Manages all action column functionality: View Details button, Actions menu, and Dropout modal
 */
export const ActionColumn: React.FC<ActionColumnProps> = ({ participant }) => {
  const navigation = useNavigation();
  const { t } = useLanguage();
  const { isMobile } = usePlatform();
  const { user } = useAuth();
  const { showAlert } = useAlert();
  // Single modal state - tracks which modal is open (null = closed)
  const [modalType, setModalType] = useState<'dropout' | 'log-visit' | 'view-log' | null>(null);
  
  // Dropout modal specific state
  const [dropoutReason, setDropoutReason] = useState('');
  const [dropoutLoading, setDropoutLoading] = useState(false);
  
  // Log visit modal specific states
  const [selectedSolutionId, setSelectedSolutionId] = useState<string>('');
  const [logVisitLoading, setLogVisitLoading] = useState(false);
  const [selectedSubmissionNumber, setSelectedSubmissionNumber] = useState<number | null>(null);
  const handleViewDetails = () => {
    // @ts-ignore - Navigation type inference
    navigation.navigate('participant-detail', { id: participant.userId });
  };

  const handleMenuSelect = (key: string) => {
    // const participantId = participant.userId;
    
    switch (key) {
      case 'view-log':
        setModalType('view-log');
        setSelectedSolutionId('');
        setSelectedSubmissionNumber(null);
        break;
      case 'log-visit':
        setModalType('log-visit');
        setSelectedSolutionId('');
        setSelectedSubmissionNumber(null);
        break;
      case 'dropout':
        setModalType('dropout');
        break;
      default:
        logger.log('Action:', key, 'for participant:');
    }
  };
  
  // Fetch solutions for log visit modal and auto-select first solution
  useEffect(() => {
    const fetchLogVisitSolutions = async () => {
      if (modalType !== 'log-visit' && modalType !== 'view-log') return;
      
      setLogVisitLoading(true);
      try {
        const data = await getTargetedSolutions({
          type: 'observation',
          // @ts-ignore - filter[keywords] is a valid parameter
          "filter[keywords]": FILTER_KEYWORDS.PARTICIPANT_LOG_VISIT.join(',')
        });
        // Automatically select the first solution
        if (data && data.length > 0) {
          const firstSolution = data[0];
          setSelectedSolutionId(firstSolution.solutionId || firstSolution.id || '');
        } else {
          setSelectedSolutionId('');
        }
      } catch (error) {
        logger.error('Error fetching log visit solutions:', error);
        setSelectedSolutionId('');
      } finally {
        setLogVisitLoading(false);
      }
    };

    fetchLogVisitSolutions();
  }, [modalType]);

  const handleCloseModal = useCallback(() => {
    setModalType(null);
    setDropoutReason('');
    setSelectedSolutionId('');
  }, []);

  const handleDropoutConfirm = useCallback(async (reason?: string) => {
    if (!user?.id) {
      showAlert('error', t('common.error') || 'User not authenticated');
      return;
    }

    // Get entityId from participant - it might be in different fields
    const userEntityId = (participant as any).entityId || (participant as any).entity_id || participant.userId;
    
    if (!userEntityId) {
      showAlert('error', t('common.error') || 'Participant entity ID not found');
      return;
    }

    setDropoutLoading(true);
    try {
      await updateEntityDetails({
        userId: `${user?.id}`,
        entityId: userEntityId,
        entityUpdates: {
          status: STATUS.DROPOUT,
          dropoutReason: reason || '',
        },
      });

      showAlert('success', t('actions.dropoutSuccess'));
      
      // Close modal and reset state
      setDropoutReason('');
      setModalType(null);
      
      // Optionally refresh the page or trigger a callback to refresh participants list
      // You might want to add a callback prop or use navigation to refresh
    } catch (error: any) {
      logger.error('Error marking participant as dropout:', error);
      const errorMessage = error?.response?.data?.message || error?.message || t('actions.dropoutError');
      showAlert('error', errorMessage);
    } finally {
      setDropoutLoading(false);
    }
  }, [participant, user?.id, showAlert, t]);

  const handleFormSelect = (submission: any) => {
    setModalType('log-visit');
    setSelectedSolutionId(submission.solutionId);
    setSelectedSubmissionNumber(submission.submissionNumber);
  };

  // Check if participant is Graduated or Dropout - hide menu for these statuses
  const isReadOnlyStatus = participant.status === STATUS.GRADUATED || participant.status === STATUS.DROPOUT;

  return (
    <Box>
      <HStack {...dataTableStyles.cardActionsSection}>
      {/* @ts-ignore: Back Button */}
        <Button variant={isMobile ? "outlineghost" : "ghost"} flex="1" onPress={handleViewDetails}>
          <ButtonText {...TYPOGRAPHY.bodySmall} color="$primary500" fontWeight="$medium">{t('actions.viewDetails')}</ButtonText>
        </Button>
        {!isReadOnlyStatus && (
          <Menu
            items={getParticipantsMenuItems}
            placement="bottom right"
            offset={5}
            trigger={getCustomTrigger}
            onSelect={handleMenuSelect}
          />
        )}
      </HStack>

      {/* Single Modal - renders different content based on modalType */}
      <Modal
        isOpen={modalType !== null}
        onClose={handleCloseModal}
        headerTitle={
          modalType === 'dropout'
            ? t('actions.confirmDropout') || 'Confirm Dropout'
            : modalType === 'log-visit'
            ? t('actions.logVisit')
            : modalType === 'view-log'
            ? t('actions.observationLogs')
            : ''
        }
        headerIcon={
          modalType === 'dropout' ? (
            <LucideIcon
              name="UserX"
              size={24}
              color={theme.tokens.colors.error.light}
            />
          ) : undefined
        }
        size="lg"
        maxWidth={500}
        showCloseButton={modalType !== 'dropout'}
        cancelButtonText={modalType === 'dropout' ? t('common.cancel') || 'Cancel' : undefined}
        confirmButtonText={modalType === 'dropout' ? (dropoutLoading ? (t('common.loading') || 'Loading...') : (t('actions.confirmDropout') || 'Confirm Dropout')) : undefined}
        onCancel={modalType === 'dropout' ? (dropoutLoading ? undefined : handleCloseModal) : undefined}
        onConfirm={modalType === 'dropout' ? (dropoutLoading ? undefined : () => handleDropoutConfirm(dropoutReason)) : undefined}
        confirmButtonColor={modalType === 'dropout' ? '$primary500' : undefined}
        bodyProps={modalType !== 'dropout' ? {padding: 0,paddingTop: 0,paddingBottom: 0} : {}}
        headerProps={modalType !== 'dropout' ? {paddingBottom: 0,paddingTop: "$2"} : {}}
      >
        {modalType === 'dropout' && (
          <VStack space="lg">
            <Text
              {...TYPOGRAPHY.paragraph}
              color="$textSecondary"
              lineHeight="$xl"
            >
              {t('actions.dropoutMessage', { name: participant.name || participant.userId || 'participant' }) ||
                `Mark ${participant.name || participant.userId || 'participant'} as dropout from the program`}
            </Text>

            <VStack space="sm">
              <Text
                {...TYPOGRAPHY.label}
                color="$textPrimary"
                fontWeight="$medium"
              >
                {t('actions.dropoutReasonLabel') || 'Reason for Dropout'}
              </Text>
              <Input
                {...dataTableStyles.modalInput}
                borderColor="$inputBorder"
                bg="$modalBackground"
                $focus-borderColor="$inputFocusBorder"
                $focus-borderWidth={2}
              >
                <InputField
                  placeholder={
                    t('actions.dropoutReasonPlaceholder') || 'Enter reason for dropout...'
                  }
                  value={dropoutReason}
                  onChangeText={setDropoutReason}
                  {...dataTableStyles.modalInputField}
                  placeholderTextColor="$textMutedForeground"
                />
              </Input>
              <Text
                {...TYPOGRAPHY.bodySmall}
                color="$textSecondary"
                lineHeight="$sm"
              >
                {t('actions.dropoutHint') ||
                  'This will change the participant\'s status to "Not Enrolled" and log the action in their history.'}
              </Text>
            </VStack>
          </VStack>
        )}

        {(modalType === 'log-visit' || modalType === 'view-log') && (
          <Box flex={1}>
            {logVisitLoading ? (
              <Box flex={1} justifyContent="center" alignItems="center">
                <Spinner size="large" color="$primary500" />
              </Box>
            ) : selectedSolutionId && modalType === 'log-visit' ? (
              <ObservationContent
                id={participant.userId}
                solutionId={selectedSolutionId}
                onClose={handleCloseModal}
                // @ts-ignore - showAlert is a valid prop
                showAlert={showAlert}
                submissionNumber={selectedSubmissionNumber || undefined as any}
              />
            ) : selectedSolutionId && modalType === 'view-log' ? (
              <Box flex={1}>
                <CheckInsListContent
                  id={participant.userId}
                  userName={user?.name}
                  preSelectedSolution={selectedSolutionId}
                  onFormSelect={handleFormSelect}
                />
              </Box>
            ) : (
              <Box flex={1} justifyContent="center" alignItems="center">
                <Text color="$textMutedForeground">
                  {t('logVisit.noSolutions') || 'No solutions available'}
                </Text>
              </Box>
            )}
          </Box>
        )}
      </Modal>
    </Box>
  );
};

