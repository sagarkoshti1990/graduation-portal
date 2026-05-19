import React, { useState, useCallback, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  HStack,
  Text,
  Box,
  VStack,
  Input,
  InputField,
  Modal,
  ButtonText,
  ButtonIcon,
  Button,
  Spinner,
  useAlert,
} from '@ui';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';
import { theme } from '@config/theme';
import { useLanguage } from '@contexts/LanguageContext';
import { useAuth } from '@contexts/AuthContext';
import { LucideIcon, Menu } from '@ui';
import { styles as dataTableStyles } from '@components/DataTable/Styles';
import {
  getParticipantsMenuItems,
  DROPOUT_REASON_OPTIONS,
  OTHER_DROPOUT_REASON,
} from '@constants/PARTICIPANTS_LIST';
import logger from '@utils/logger';
import { usePlatform } from '@utils/platform';
import ObservationContent from '../Observation/ObservationContent';
import CheckInsListContent from '../ParticipantDetail/Check-ins-list/CheckInsListContent';
import { getTargetedSolutions } from '../../services/solutionService';
import { FILTER_KEYWORDS } from '@constants/LOG_VISIT_CARDS';
import { updateEntityDetails } from '../../services/participantService';
import { STATUS, USER_STATUS } from '@constants/app.constant';
import Select from '@components/ui/Inputs/Select';
import {
  AssessmentSurveyCardData,
  ParticipantData,
} from '@app-types/participant';
import { openDownload } from '@utils/helper';
import { ACTION_COLUMN } from '@constants/GET_ANSWER_DATA';
import DownloadConfigModal from '@components/DownloadConfigModal';
import OfflineBadge from '@components/OfflineBadge';
import dataService from '../../services/dataService';
import offlineStorage from '../../services/offlineStorage';
import { PARTICIPANT_KEYS } from '@constants/STORAGE_KEYS';
import { observationCss } from '../ParticipantDetail/LogVisitModulePopup';

interface ActionColumnProps {
  participant: ParticipantData;
  onDropoutSuccess?: (participantId: string) => void;
}

/**
 * Custom trigger for actions menu
 */
const getCustomTrigger = (triggerProps: any) => (
  // @ts-ignore: Button variant
  <Button size="sm" variant="ghost" {...triggerProps}>
    <ButtonIcon
      as={LucideIcon}
      name="MoreVertical"
      size={16}
      color="$primary500"
    />
  </Button>
);

/**
 * ActionColumn Component
 * Manages all action column functionality: View Details button, Actions menu, and Dropout modal
 */
export const ActionColumn: React.FC<ActionColumnProps> = ({
  participant,
  onDropoutSuccess,
}) => {
  const navigation:any = useNavigation();
  const { t } = useLanguage();
  const { isMobile } = usePlatform();
  const { user } = useAuth();
  const { showAlert } = useAlert();
  // Single modal state - tracks which modal is open (null = closed)
  const [modalType, setModalType] = useState<
    'dropout' | 'log-visit' | 'view-log' | 'view-check-ins-Logs' | 'download' | null
  >(null);

  // Incremented after download completes so OfflineBadge re-reads storage
  const [badgeRefreshKey, setBadgeRefreshKey] = useState(0);

  // Dropout modal specific state
  const [selectedDropoutReason, setSelectedDropoutReason] = useState('');
  const [customDropoutReason, setCustomDropoutReason] = useState('');
  const [dropoutValidationError, setDropoutValidationError] = useState('');
  const [dropoutLoading, setDropoutLoading] = useState(false);

  // Log visit modal specific states
  const [selectedSolutionId, setSelectedSolutionId] = useState<string>('');
  const [solutions, setSolutions] = useState<AssessmentSurveyCardData[]>([]);
  const [logVisitLoading, setLogVisitLoading] = useState(false);
  const [selectedSubmissionNumber, setSelectedSubmissionNumber] = useState<
    number | null
  >(null);
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
        setDropoutValidationError('');
        break;
      case 'download':
        setModalType('download');
        break;
      case 'view-check-ins-Logs' :
        setModalType("view-check-ins-Logs")
        break;
      default:
        logger.log('Action:', key, 'for participant:');
    }
  };

  // Fetch solutions for log visit modal and auto-select first solution.
  // When offline, resolve the log-visit solutionId from the participant's cached project tasks
  // instead of hitting the API (which would fail without network).
  useEffect(() => {
    const fetchLogVisitSolutions = async () => {
      if (modalType !== 'log-visit' && modalType !== 'view-log' && modalType !== "view-check-ins-Logs") return;

      setLogVisitLoading(true);
      try {
        const isOffline = dataService.isNetworkOffline();

        if (isOffline) {
          // Read the participant's cached project and find the log-visit observation task
          const project = await offlineStorage.read<any>(PARTICIPANT_KEYS.project(participant.userId));
          const tasks: any[] = project?.tasks
            ?? (project?.children ?? []).flatMap((c: any) => c.tasks ?? []);

          const logVisitTask = tasks.find((t: any) => {
            if (t.type !== 'observation') return false;
            const name = (t.name ?? '').toLowerCase();
            return name.includes('log visit') || name.includes('logvisit') || name.includes('log_visit');
          });

          const solutionId: string =
            logVisitTask?.solutionDetails?._id ??
            logVisitTask?.solutionDetails?.observationId ??
            logVisitTask?.solutionDetails?.id ?? '';

          if (solutionId) {
            const fakeSolution = { solutionId, id: solutionId };
            setSolutions([fakeSolution] as any);
            if (modalType === 'view-check-ins-Logs') {
              navigation.navigate('check-ins-list', {
                id: participant.userId as string,
                solutionId,
              });
            } else {
              setSelectedSolutionId(solutionId);
            }
          } else {
            setSolutions([]);
            setSelectedSolutionId('');
          }
          return;
        }

        const data = await getTargetedSolutions({
          type: 'observation',
          // @ts-ignore - filter[keywords] is a valid parameter
          'filter[keywords]': FILTER_KEYWORDS.PARTICIPANT_LOG_VISIT.join(','),
        });
        setSolutions(data);
        if (data && data.length > 0) {
          const firstSolution = data[0];
          if (modalType === 'view-check-ins-Logs') {
            navigation.navigate('check-ins-list', {
              id: participant.userId as string,
              solutionId: firstSolution.solutionId,
            });
          } else {
            setSelectedSolutionId(
              firstSolution.solutionId || firstSolution.id || '',
            );
          }
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
    setDropoutValidationError('');
    setSelectedSolutionId('');
  }, []);

  const handleDropoutConfirm = useCallback(async () => {
    if (!user?.id) {
      showAlert('error', t('common.error') || 'User not authenticated');
      return;
    }

    // Validate that a reason is selected
    if (!selectedDropoutReason) {
      const errorMessage =
        t('actions.selectDropoutReason') ||
        'Please select a reason for dropout';
      setDropoutValidationError(errorMessage);
      return;
    }

    // If "other" is selected, validate that custom reason is provided
    if (
      selectedDropoutReason === OTHER_DROPOUT_REASON &&
      !customDropoutReason.trim()
    ) {
      const errorMessage =
        t('actions.enterCustomReason') || 'Please enter a custom reason';
      setDropoutValidationError(errorMessage);
      return;
    }

    setDropoutValidationError('');

    // Get entityId from participant - it might be in different fields
    const userEntityId =
      (participant as any).entityId ||
      (participant as any).entity_id ||
      participant.userId;

    if (!userEntityId) {
      showAlert(
        'error',
        t('common.error') || 'Participant entity ID not found',
      );
      return;
    }

    // Determine the final reason to save
    const finalReason =
      selectedDropoutReason === OTHER_DROPOUT_REASON
        ? customDropoutReason
        : DROPOUT_REASON_OPTIONS.find(
            option => option.value === selectedDropoutReason,
          )?.label || selectedDropoutReason;

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
      setDropoutValidationError('');
      setModalType(null);

      // Notify parent list so UI updates immediately (no full page refresh)
      onDropoutSuccess?.(participant.userId);

      // Optionally refresh the page or trigger a callback to refresh participants list
      // You might want to add a callback prop or use navigation to refresh
    } catch (error: any) {
      logger.error('Error marking participant as dropout:', error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        t('actions.dropoutError');
      showAlert('error', errorMessage);
    } finally {
      setDropoutLoading(false);
    }
  }, [
    participant,
    user?.id,
    showAlert,
    t,
    selectedDropoutReason,
    customDropoutReason,
    onDropoutSuccess,
  ]);

  const handleFormSelect = (submission: any) => {
    setModalType('log-visit');
    setSelectedSolutionId(submission.solutionId);
    setSelectedSubmissionNumber(submission.submissionNumber);
  };
  // Check if participant is Graduated or Dropout - hide menu for these statuses
  const isReadOnlyStatus =
    participant?.status === STATUS.GRADUATED ||
    participant?.status === STATUS.DROPOUT ||
    participant?.userDetails?.status === USER_STATUS.INACTIVE;
  const isNotOnboarded =
    participant?.userDetails?.status === USER_STATUS.INACTIVE
      ? false
      : participant?.status === STATUS.NOT_ONBOARDED;

  // Build menu items — always include Download Offline (Section 8.5)
  const menuItemsWithDownload = [
    ...getParticipantsMenuItems,
    {
      key: 'download',
      label: 'actions.downloadOffline',
      textValue: 'Download Offline',
      iconName: 'Download',
      iconColor: theme.tokens.colors.textForegroundColor,
      iconSizeValue: 20,
    },
  ] as typeof getParticipantsMenuItems;

  return (
    <Box>
      <HStack {...dataTableStyles.cardActionsSection} alignItems="center">
        {/* Offline availability badge — reads download status from local storage */}
        <OfflineBadge participantId={participant.userId} refreshKey={badgeRefreshKey} />

        {/* @ts-ignore: Back Button */}
        <Button
          // @ts-ignore: variant outlineghost
          variant={isMobile ? 'outlineghost' : 'ghost'}
          flex={1}
          onPress={isNotOnboarded ? handleLogVisit : handleViewDetails}
          size="sm"
        >
          {isNotOnboarded && (
            <LucideIcon
              name="ClipboardCheck"
              size={20}
              color={"$primary500"}
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
            items={
              isNotOnboarded
                ? menuItemsWithDownload.filter(
                    e => !(isNotOnboarded && ["actions.logVisit","actions.viewCheckInsLogs"].includes(e?.label || "")),
                  )
                :  menuItemsWithDownload.filter(
                    e => !(["actions.viewLog"].includes(e?.label || "")),
                  )
            }
            placement="bottom right"
            offset={5}
            trigger={getCustomTrigger}
            onSelect={handleMenuSelect}
          />
        )}
      </HStack>

      {/* Single Modal - renders different content based on modalType */}
      <Modal
        isOpen={modalType !== null && modalType !== 'view-check-ins-Logs' && modalType !== 'download'}
        onClose={handleCloseModal}
        headerContent={
          modalType === 'dropout' ? (
            t('actions.confirmDropout') || 'Confirm Dropout'
          ) : modalType === 'log-visit' ? (
            <HStack
              space="md"
              alignItems="center"
              justifyContent="space-between"
              flex={1}
            >
              <Text fontSize={'$lg'} fontWeight={'$semibold'}>
                {t('actions.logVisit')}
              </Text>
              <Button
                // @ts-ignore
                variant="outlineghost"
                $md-mr="$6"
                mr="$8"
                // @ts-ignore
                onPress={() =>
                  // @ts-ignore
                  openDownload(process.env.ENGAGEMENT_SCRIPT_URL, t, showAlert)
                }
              >
                <ButtonIcon
                  as={LucideIcon}
                  name="Download"
                  size={16}
                  color={'$error.light'}
                />
                {!isMobile &&
                <ButtonText fontSize={'$xs'} fontWeight={'$medium'}>
                  {t('actions.downloadScript')}
                </ButtonText>}
              </Button>
            </HStack>
          ) : modalType === 'view-log' ? (
            <VStack space='sm'>
              <Text fontSize={"$lg"} color='$textForegroundColor' fontWeight={600}>
                {t('actions.observationLogs')}
              </Text>
              <Text fontSize={"$sm"} color='$textMutedForeground'>
                {t('actions.viewAllActivity',{name:participant.name})}
              </Text>
            </VStack>
          ) : (
            ''
          )
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
        cancelButtonText={
          modalType === 'dropout' ? t('common.cancel') || 'Cancel' : undefined
        }
        confirmButtonText={
          modalType === 'dropout'
            ? dropoutLoading
              ? t('common.loading') || 'Loading...'
              : t('actions.confirmDropout') || 'Confirm Dropout'
            : undefined
        }
        onCancel={
          modalType === 'dropout'
            ? dropoutLoading
              ? undefined
              : handleCloseModal
            : undefined
        }
        onConfirm={
          modalType === 'dropout'
            ? dropoutLoading
              ? undefined
              : handleDropoutConfirm
            : undefined
        }
        confirmButtonColor={modalType === 'dropout' ? '$primary500' : undefined}
        bodyProps={
          modalType !== 'dropout'
            ? { padding: 0, paddingTop: 0, paddingBottom: 0, paddingRight:0,paddingLeft:0 }
            : {}
        }
        headerProps={
          modalType === 'log-visit'
            ? { paddingBottom: "$1", paddingTop: '$4' }
            : {}
        }
      >
        {modalType === 'dropout' && (
          <VStack space="lg">
            <Text
              {...TYPOGRAPHY.paragraph}
              color="$textSecondary"
              lineHeight="$xl"
            >
              {t('actions.dropoutMessage', {
                name: participant.name || participant.userId || 'participant',
              }) ||
                `Mark ${
                  participant.name || participant.userId || 'participant'
                } as dropout from the program`}
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
                onChange={value => {
                  setSelectedDropoutReason(value);
                  setDropoutValidationError('');
                }}
                placeholder={
                  t('actions.selectDropoutReason') || 'Select a reason'
                }
                bg="$modalBackground"
                borderColor="$inputBorder"
                size="md"
                borderRadius="$md"
              />

              {selectedDropoutReason === OTHER_DROPOUT_REASON && (
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
                        t('actions.customReasonPlaceholder') ||
                        'Enter custom reason...'
                      }
                      value={customDropoutReason}
                      onChangeText={value => {
                        setCustomDropoutReason(value);
                        setDropoutValidationError('');
                      }}
                      {...dataTableStyles.modalInputField}
                      placeholderTextColor="$textMutedForeground"
                    />
                  </Input>
                </Box>
              )}

              {!!dropoutValidationError && (
                <Text
                  {...TYPOGRAPHY.bodySmall}
                  color="$error500"
                  lineHeight="$sm"
                >
                  {dropoutValidationError}
                </Text>
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
                participant={participant}
                hideElements={{
                  header: [
                    'title',
                    'backButton',
                    'progress-bar',
                    'status-badge',
                  ],
                }}
                _css={observationCss}
                _webComponent={{styleObject:{
                  ".d-flex.pt-24.px-24.flex-ai-start.flex-gap-10:has(mat-icon)":{display: "none !important"},
                  ".page-group-container":{background: "transparent !important",border: "0 !important"},
                  ".questions-grid":{"padding":"0 !important"}
                }}}
                solutionId={selectedSolutionId}
                onClose={handleCloseModal}
                // @ts-ignore - showAlert is a valid prop
                showAlert={showAlert}
                submissionNumber={
                  selectedSubmissionNumber || (undefined as any)
                }
                userData={ACTION_COLUMN}
              />
            ) : selectedSolutionId && modalType === 'view-log' ? (
              <Box flex={1}>
                <CheckInsListContent
                  id={participant.userId}
                  solutions={solutions}
                  preSelectedSolution={selectedSolutionId}
                  onFormSelect={handleFormSelect}
                  participant={participant}
                  _dataNotFoundCard={{variant:"ghost"}}
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

      {/* Download Offline modal — outside the main Modal to avoid nesting */}
      <DownloadConfigModal
        isOpen={modalType === 'download'}
        onClose={handleCloseModal}
        participantId={participant.userId}
        projectId={(participant as any).onBoardedProjectId ?? (participant as any).idpProjectId}
        participantStatus={participant.status}
        participantData={participant}
        onBoardedProjectId={(participant as any).onBoardedProjectId}
        onSuccess={() => {
          setBadgeRefreshKey(k => k + 1);
          // handleCloseModal();
        }}
      />
    </Box>
  );
};
