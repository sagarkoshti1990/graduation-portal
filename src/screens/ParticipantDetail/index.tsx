import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import {
  VStack,
  HStack,
  Box,
  Text,
  Input,
  InputField,
  Pressable,
  Container,
} from '@ui';
import ParticipantHeader from './ParticipantHeader';
import {
  getParticipantsList,
  // getSitesByProvince,
  updateParticipantAddress,
  verifyParticipantCompletionActions
} from '../../services/participantService';
import { useLanguage } from '@contexts/LanguageContext';
import { useDocumentTitle } from '../../hooks';
import NotFound from '@components/NotFound';
import { TabButton } from '@components/Tabs';
import { PARTICIPANT_DETAIL_TABS } from '@constants/TABS';
// import { PROVINCES } from '@constants/PARTICIPANTS_LIST';
import InterventionPlan from './InterventionPlan';
import AssessmentSurveys from './AssessmentSurveys';
import type {
  ParticipantData,
  ParticipantStatus,
  // PathwayType,
} from '@app-types/participant';
import { Modal, useAlert, LucideIcon, Loader } from '@ui';
import { usePlatform } from '@utils/platform';
import { profileStyles } from '@components/ui/Modal/Styles';
import { theme } from '@config/theme';
import ProjectPlayer, { ProjectPlayerData } from '../../project-player/index';
import {
  MODE,
  // DUMMY_PROJECT_DATA,
  PROJECT_PLAYER_CONFIGS,
} from '@constants/PROJECTDATA';
import { PARTICIPANT_DETAILS_TABS, STATUS } from '@constants/app.constant';
import { useAuth, User } from '@contexts/AuthContext';
import DownloadFormsCard from './ParticipantHeader/DownloadFormsCard';
import { ProjectData } from 'src/project-player/types/project.types';

/**
 * Route parameters type definition for ParticipantDetail screen
 * The route path is configured as '/participants/:id', so the parameter is extracted as 'id'
 * @example navigate('ParticipantDetail', { id: 'P-006' })
 */
type ParticipantDetailRouteParams = {
  id?: string;
};

/**
 * Route type for ParticipantDetail screen
 */
type ParticipantDetailRouteProp = RouteProp<{
  params: ParticipantDetailRouteParams;
}>;

export default function ParticipantDetail() {
  const route = useRoute<ParticipantDetailRouteProp>();
  const { user, setNavbarData } = useAuth()
  const { t } = useLanguage();
  const { showAlert } = useAlert();
  const { isWeb } = usePlatform();
  // Extract the id parameter from the route
  const participantId = route.params?.id;
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('intervention-plan');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [status, setStatus] = useState('');
  const [idpCreated, setIdpCreated] = useState(false);
  const [editedAddress, setEditedAddress] = useState<{
    email: string;
    street: string;
    province: string;
    site: string;
  }>({
    email: '',
    street: '',
    province: '',
    site: '',
  });
  const [participant, setParticipant] = useState<User | undefined>();
  const [areAllTasksCompleted, setAreAllTasksCompleted] = useState(false);
  const [updatedProgress, setUpdatedProgress] = useState<number | undefined>(
    undefined,
  );
  const [hasProgressBaseline, setHasProgressBaseline] = useState(false);
  const [configData, setConfigData] = useState<any>(null);
  const [projectPlayerConfigData, setProjectPlayerConfigData] = useState<ProjectPlayerData | null>(null);
  const isFetchingRef = useRef(false);
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  // Set document title with participant name
  const pageTitle = participant?.name
    ? `${participant.name} - ${t('admin.pageTitle.participant-detail')}`
    : t('admin.pageTitle.participant-detail');
  useDocumentTitle(pageTitle);

  const fetchEntityDetails = useCallback(async () => {
    if (participantId && user?.id && !isFetchingRef.current) {
      try {
        isFetchingRef.current = true;
        const response = await getParticipantsList({ entityId: participantId, userId: user?.id })
        const { userDetails, ...rest } = response?.result?.data?.[0]
        const participantData = { ...(userDetails || {}), ...rest }

        if (participantData?.status === STATUS.COMPLETED) {
          // Verify participant completion conditions and perform certificate/graduation actions
          await verifyParticipantCompletionActions({
            participantData,
            userId: user?.id
          });
        }

        setParticipant(participantData);
        setNavbarData({
          subtitle: participantData?.name,
        });
        setStatus(participantData?.status);
        setEditedAddress({
          email: participantData?.email || '',
          street: participantData?.location || '',
          province: participantData?.province?.label || '',
          site: participantData?.site?.label || participantData?.site || '',
        });
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
        isFetchingRef.current = false;
      }
    }
    // @ts-ignore
  }, [participantId, user?.id, setNavbarData]);

  // Re-fetch data when screen comes into focus (e.g., navigating back)
  useFocusEffect(
    useCallback(() => {
      fetchEntityDetails();
    }, [fetchEntityDetails])
  );
  // Cleanup navbar data on component unmount
  useEffect(() => {
    return () => {
      setNavbarData(null);
      setParticipant(undefined);
      setStatus("");
      setIdpCreated(false);
      setEditedAddress({
        email: '',
        street: '',
        province: '',
        site: '',
      });
      setAreAllTasksCompleted(false);
      setUpdatedProgress(undefined);
      setHasProgressBaseline(false);
      setConfigData(null);
      setProjectPlayerConfigData(null);
      setIsLoading(true);
    };
  }, [setNavbarData]);

  // Re-fetch when idpCreated changes
  useEffect(() => {
    if (idpCreated) {
      fetchEntityDetails();
    }
  }, [idpCreated, fetchEntityDetails]);

  const handleIdpCreated = () => {
    setIdpCreated(true)
  }

  useEffect(() => {
    setUpdatedProgress(undefined);
    setHasProgressBaseline(false);
  }, [participantId]);

  // Update configData and ProjectPlayerConfigData when participant or status changes
  useEffect(() => {
    if (!participant) {
      setConfigData(null);
      setProjectPlayerConfigData(null);
      return;
    }

    // Determine ProjectPlayer config and data based on participant status
    const config = PROJECT_PLAYER_CONFIGS;
    const selectedMode = MODE.editMode;

    const newConfigData = {
      ...config,
      ...selectedMode,
      showAddCustomTaskButton: false,
      profileInfo: participant,
    };

    const newProjectPlayerConfigData: ProjectPlayerData = {
      projectId: status === STATUS.IN_PROGRESS
        ? participant?.idpProjectId
        : status === STATUS.NOT_ENROLLED
          ? participant?.onBoardedProjectId
          : participant?.onBoardedProjectId,
      entityId: participant?.entityId,
      userStatus: participant?.status,
      province: participant?.province?.value
    };

    setConfigData(newConfigData);
    setProjectPlayerConfigData(newProjectPlayerConfigData);

    // Cleanup function: clear state when component unmounts or dependencies change
    return () => {
      setConfigData(null);
      setProjectPlayerConfigData(null);
    };
  }, [participant, status]);


  const handleProgressChange = (progress: number) => {
    if (!hasProgressBaseline) {
      setHasProgressBaseline(true);
      return;
    }
    setUpdatedProgress(progress);
  };

  if (isLoading) {
    return <Loader fullScreen message="Loading participant details..." />;
  }

  // Error State: Participant Not Found
  if (!participant) {
    return <NotFound message="participantDetail.notFound.title" />;
  }

  const handleSaveAddress = async () => {
    if (
      !editedAddress.street || !editedAddress.email) {
      showAlert('warning', t('participantDetail.profileModal.fillAllFields'), {
        placement: 'bottom',
      });
      return;
    }

    try {
      setParticipant(
        (prev: User | undefined) =>
        ({
          ...(prev as User),
          location: `${editedAddress.street || ""}`,
          email: `${editedAddress.email || ""}`,
          // ${editedAddress.province}, ${editedAddress.site}
        } as User),
      );

      const programId = process.env.GLOBAL_LC_PROGRAM_ID;
      if (!programId) {
        showAlert('error', t('common.error'), { placement: 'bottom' });
        return;
      }
      const reqBody = {
        entityId: String(participant?.id),
        programId,
        updateData: {
          location: editedAddress.street,
          email: editedAddress.email,
        },
      };
      const res = await updateParticipantAddress(reqBody);
      if (res) {
        setIsEditingAddress(false);
        showAlert('success', t('participantDetail.profileModal.addressUpdated'), {
          placement: 'bottom',
        });
      }
    } catch (error) {
      showAlert('error', t('common.error'), {
        placement: 'bottom',
      });
    }
  };

  return (
    <Box flex={1} bg="$accent100">
      {/* Participant Header with status-based variations */}
      <ParticipantHeader
        participant={participant}
        pathway={'employment'}
        graduationDate={''}
        updatedProgress={updatedProgress}
        onViewProfile={() => setIsProfileModalOpen(true)}
        areAllTasksCompleted={areAllTasksCompleted}
        onStatusUpdate={newStatus => {
          setStatus(newStatus);
        }}
        projectData={projectData}
      />

      <Container px="$4" py="$6" $md-px="$6">
        {status === STATUS.NOT_ENROLLED ? (
          <>
            <DownloadFormsCard />
            {configData && projectPlayerConfigData && (
              <ProjectPlayer
                key={`project-player-${participantId}`}
                config={configData}
                data={projectPlayerConfigData}
                onTaskCompletionChange={setAreAllTasksCompleted}
                onProgressChange={handleProgressChange}
              />
            )}
          </>
        ) : (
          // ENROLLED, IN_PROGRESS, DROPOUT: Show tabs with ProjectPlayer in InterventionPlan
          <Box>
            {/* Tabs */}
            <Box width="$full" mt="$2" mb="$0">
              <Box width="$full">
                <HStack
                  width="$full"
                  bg="$backgroundLight50"
                  borderRadius={50}
                  p={4}
                  gap={4}
                  alignItems="center"
                >
                  {PARTICIPANT_DETAIL_TABS?.map(tab => (
                    <TabButton
                      key={tab.key}
                      tab={tab}
                      isActive={activeTab === tab.key}
                      onPress={setActiveTab}
                      variant="ButtonTab"
                    />
                  ))}
                </HStack>
              </Box>
            </Box>

            {/* Tab Content */}
            <Box flex={1} mt="$2" mb="$4" bg="transparent">
              <Box width="$full">
                <Box width="$full">
                  {activeTab ===
                    PARTICIPANT_DETAILS_TABS.INTERVENTION_PLAN && (
                      <InterventionPlan
                        participantStatus={status as ParticipantStatus}
                        participantId={participant?.id}
                        participantProfile={participant}
                        onIdpCreation={handleIdpCreated}
                        onProgressChange={handleProgressChange}
                        getProjectData={setProjectData}
                      />
                    )}
                  {activeTab ===
                    PARTICIPANT_DETAILS_TABS.ASSESSMENTS_SURVEYS && (
                      <Box mt="$6">
                        <AssessmentSurveys
                          participant={participant as ParticipantData}
                          projectData={projectData}
                        />
                      </Box>
                    )}
                </Box>
              </Box>
            </Box>
          </Box>
        )}
      </Container>

      {/* Profile Modal */}
      <Modal
        isOpen={isProfileModalOpen}
        onClose={() => {
          setIsProfileModalOpen(false);
          setIsEditingAddress(false);
          setEditedAddress({
            email: participant?.email,
            street: participant?.location,
            province: participant?.province?.label,
            site: '',
          });
        }}
        headerTitle={t('participantDetail.profileModal.title')}
        headerDescription={t('participantDetail.profileModal.subtitle', {
          name: participant?.name,
        })}
        showCloseButton={false}
        headerRightContent={
            <Pressable
            onPress={() => {
              setIsEditingAddress(editing => !editing);
            }}
          >
            <LucideIcon
              name="Pencil"
              size={16}
              color={theme.tokens.colors.primary500}
            />
          </Pressable>
        }
        size={isWeb ? 'sm' : 'lg'}
        cancelButtonText={t('common.cancel')}
        confirmButtonText={
          isEditingAddress
            ? t('participantDetail.profileModal.saveLocation')
            : undefined
        }
        onCancel={() => {
          setIsProfileModalOpen(false);
          setIsEditingAddress(false);
          setEditedAddress({
            email: participant?.email,
            street: participant?.location,
            province: participant?.province?.label,
            site: participant?.site?.label,
          });
        }}
        onConfirm={handleSaveAddress}
      >
        <VStack space="lg">
          {/* Name Field */}
          <VStack space="xs" {...profileStyles.fieldSection}>
            <Text {...profileStyles.fieldLabel}>
              {t('common.profileFields.name')}
            </Text>
            <Text {...profileStyles.fieldValue}>{participant!.name}</Text>
          </VStack>

          {/* ID Field (externalId) */}
          <VStack space="xs" {...profileStyles.fieldSection}>
            <Text {...profileStyles.fieldLabel}>
              {t('common.profileFields.id')}
            </Text>
            <Text {...profileStyles.fieldValue}>{participant!.id}</Text>
          </VStack>

          {/* Contact Section */}
          <VStack
            space="xs"
            {...(participant!.location ? profileStyles.fieldSection : {})}
          >
            <Text {...profileStyles.fieldLabel}>
              {t('common.profileFields.contact')}
            </Text>
            <VStack space="sm">
              <Text {...profileStyles.fieldValue}>{participant!.phone_code || ""} {participant!.phone || ""}</Text>
              {isEditingAddress ? (
                <VStack space="sm">
                  {/* Street Address Input */}
                  <VStack space="xs">
                    <Input
                      {...profileStyles.input}
                      $focus-borderColor={theme.tokens.colors.inputFocusBorder}
                    >
                      <InputField
                        placeholder={t(
                          'common.profileFields.email',
                        )}
                        value={editedAddress?.email || ''}
                        onChangeText={value => setEditedAddress(prev => ({ ...prev, email: value }))}
                      />
                    </Input>
                  </VStack>
                </VStack>
              ) : (
                <Text {...profileStyles.fieldValue}>{editedAddress?.email || '-'}</Text>
              )}
            </VStack>
          </VStack>

          {/* Address Section */}
          <VStack space="xs" {...profileStyles.fieldSection}>
            <Text {...profileStyles.fieldLabel}>
              {t('common.profileFields.address')}
            </Text>
            {isEditingAddress ? (
              <VStack space="sm">
                {/* Street Address Input */}
                <VStack space="xs">
                  <Input
                    {...profileStyles.input}
                    $focus-borderColor={theme.tokens.colors.inputFocusBorder}
                  >
                    <InputField
                      placeholder={t(
                        'common.profileFields.addressFields.street',
                      )}
                      value={editedAddress?.street || ''}
                      onChangeText={value => {
                        setEditedAddress(prev => ({
                          ...prev,
                          street: value,
                        }));
                      }}
                    />
                  </Input>
                </VStack>
              </VStack>
            ) : (
              <Text {...profileStyles.fieldValue}>{participant?.location || '-'}</Text>
            )}
            <Text {...profileStyles.fieldValue} color={'$textMutedForeground' as const}>
              {t('common.profileFields.addressFields.province')}: {participant?.province?.label || "-"}
            </Text>
            <Text {...profileStyles.fieldValue} color={'$textMutedForeground' as const}>
              {t('common.profileFields.addressFields.site')}: {participant?.site?.label || '-'}
            </Text>
          </VStack>
        </VStack>
      </Modal>
    </Box>
  );
}
