import React, { useState, useCallback, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { HStack, Text, Box, VStack, Input, InputField, Modal, ButtonText, ButtonIcon, Button, Spinner, useAlert } from '@ui';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';
import { theme } from '@config/theme';
import { useLanguage } from '@contexts/LanguageContext';
import { useAuth } from '@contexts/AuthContext';
import { LucideIcon, Menu } from '@ui';
import { styles as dataTableStyles } from '@components/DataTable/Styles';
import { getParticipantsMenuItems, DROPOUT_REASON_OPTIONS } from '@constants/PARTICIPANTS_LIST';
import logger from '@utils/logger';
import { usePlatform } from '@utils/platform';
import ObservationContent from '../Observation/ObservationContent';
import CheckInsListContent from '../ParticipantDetail/Check-ins-list/CheckInsListContent';
import { getTargetedSolutions } from '../../services/solutionService';
import { FILTER_KEYWORDS } from '@constants/LOG_VISIT_CARDS';
import { updateEntityDetails } from '../../services/participantService';
import { STATUS } from '@constants/app.constant';
import Select from '@components/ui/Inputs/Select';
import { AssessmentSurveyCardData, ParticipantData } from '@app-types/participant';

interface ActionColumnProps {
  participant: ParticipantData;
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
  const [selectedDropoutReason, setSelectedDropoutReason] = useState('');
  const [customDropoutReason, setCustomDropoutReason] = useState('');
  const [dropoutLoading, setDropoutLoading] = useState(false);
  
  // Log visit modal specific states
  const [selectedSolutionId, setSelectedSolutionId] = useState<string>('');
  const [solutions, setSolutions] = useState<AssessmentSurveyCardData[]>([]);
  const [logVisitLoading, setLogVisitLoading] = useState(false);
  const [selectedSubmissionNumber, setSelectedSubmissionNumber] = useState<number | null>(null);
  const handleViewDetails = () => {
    // @ts-ignore - Navigation type inference
    navigation.navigate('participant-detail', { id: participant.userId });
  };

  const handleLogVisit = () => {
    setModalType('log-visit');
    setSelectedSolutionId('');
    setSelectedSubmissionNumber(null);
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
        setSolutions(data);
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
    setSelectedDropoutReason('');
    setCustomDropoutReason('');
    setSelectedSolutionId('');
  }, []);

  const handleDropoutConfirm = useCallback(async () => {
    if (!user?.id) {
      showAlert('error', t('common.error') || 'User not authenticated');
      return;
    }

    // Validate that a reason is selected
    if (!selectedDropoutReason) {
      showAlert('error', t('actions.selectDropoutReason') || 'Please select a reason for dropout');
      return;
    }

    // If "other" is selected, validate that custom reason is provided
    if (selectedDropoutReason === 'other' && !customDropoutReason.trim()) {
      showAlert('error', t('actions.enterCustomReason') || 'Please enter a custom reason');
      return;
    }

    // Get entityId from participant - it might be in different fields
    const userEntityId = (participant as any).entityId || (participant as any).entity_id || participant.userId;
    
    if (!userEntityId) {
      showAlert('error', t('common.error') || 'Participant entity ID not found');
      return;
    }

    // Determine the final reason to save
    const finalReason = selectedDropoutReason === 'other' 
      ? customDropoutReason 
      : DROPOUT_REASON_OPTIONS.find(option => option.value === selectedDropoutReason)?.label || selectedDropoutReason;

    setDropoutLoading(true);
    try {
      await updateEntityDetails({
        userId: `${user?.id}`,
        entityId: userEntityId,
        entityUpdates: {
          status: STATUS.DROPOUT,
          dropoutReason: finalReason,
        },
      });

      showAlert('success', t('actions.dropoutSuccess'));
      
      // Close modal and reset state
      setSelectedDropoutReason('');
      setCustomDropoutReason('');
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
  }, [participant, user?.id, showAlert, t, selectedDropoutReason, customDropoutReason]);

  const handleFormSelect = (submission: any) => {
    setModalType('log-visit');
    setSelectedSolutionId(submission.solutionId);
    setSelectedSubmissionNumber(submission.submissionNumber);
  };

  // Check if participant is Graduated or Dropout - hide menu for these statuses
  const isReadOnlyStatus = participant.status === STATUS.GRADUATED || participant.status === STATUS.DROPOUT;
  const isNotOnboarded = participant?.status === STATUS.NOT_ONBOARDED;

  return (
    <Box>
      <HStack {...dataTableStyles.cardActionsSection}>
        {/* @ts-ignore: Back Button */}
        <Button
          // @ts-ignore: variant outlineghost
          variant={isMobile ? 'outlineghost' : 'ghost'}
          flex={1}
          onPress={isNotOnboarded ? handleLogVisit : handleViewDetails}
        >
          {isNotOnboarded && (
            <LucideIcon
              name="ClipboardCheck"
              size={20}
              color={theme.tokens.colors.primary500}
            />
          )}

          <ButtonText
            {...TYPOGRAPHY.bodySmall}
            color="$primary500"
            fontWeight="$medium"
          >
            {t(isNotOnboarded ? 'actions.logVisit' : 'actions.viewDetails')}
          </ButtonText>
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
        showCloseButton={modalType !== 'dropout'}
        cancelButtonText={modalType === 'dropout' ? t('common.cancel') || 'Cancel' : undefined}
        confirmButtonText={modalType === 'dropout' ? (dropoutLoading ? (t('common.loading') || 'Loading...') : (t('actions.confirmDropout') || 'Confirm Dropout')) : undefined}
        onCancel={modalType === 'dropout' ? (dropoutLoading ? undefined : handleCloseModal) : undefined}
        onConfirm={modalType === 'dropout' ? (dropoutLoading ? undefined : handleDropoutConfirm) : undefined}
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
              
              <Select
                options={DROPOUT_REASON_OPTIONS}
                value={selectedDropoutReason}
                onChange={(value) => setSelectedDropoutReason(value)}
                placeholder={t('actions.selectDropoutReason') || 'Select a reason'}
                bg="$modalBackground"
                borderColor="$inputBorder"
                size="md"
                borderRadius="$md"
              />

              {selectedDropoutReason === 'other' && (
                <Box mt="$3">
                  <Text
                    {...TYPOGRAPHY.label}
                    color="$textPrimary"
                    fontWeight="$medium"
                    mb="$2"
                  >
                    {t('actions.customReasonLabel') || 'Please specify'}
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
                        t('actions.customReasonPlaceholder') || 'Enter custom reason...'
                      }
                      value={customDropoutReason}
                      onChangeText={setCustomDropoutReason}
                      {...dataTableStyles.modalInputField}
                      placeholderTextColor="$textMutedForeground"
                    />
                  </Input>
                </Box>
              )}

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
          <Box flex={1} minHeight={400}>
            {logVisitLoading ? (
              <Box flex={1} justifyContent="center" alignItems="center">
                <Spinner size="large" color="$primary500" />
              </Box>
            ) : selectedSolutionId && modalType === 'log-visit' ? (
              <ObservationContent
                hideElements={{ header: ['title', 'backButton'] }}
                _css={{_header:{pageHeader:{_container:{ "$md-px": '$6', px: '$4', pb: '$4', backgroundColor: "$backgroundColor" }}}}}
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
                  solutions={solutions}
                  preSelectedSolution={selectedSolutionId}
                  onFormSelect={handleFormSelect}
                  participant={participant}
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

