import React, { useEffect, useState, useCallback, useRef } from 'react';
import WebComponentPlayer from '@components/WebComponent/WebComponentPlayer';
import { Container, Spinner, VStack, Box } from '@ui';
import { getToken } from '../../services/api';
import {
  createObservationSubmission,
  getObservationEntities,
  getObservationSolution,
  getObservationSubmissions,
  searchObservationEntities,
  updateObservationEntities,
} from '../../services/solutionService';
import { useLanguage } from '@contexts/LanguageContext';
import Header from './Header';
import offlineStorage from '../../services/offlineStorage';
import { observationStyles } from './Styles';
import { CARD_STATUS } from '@constants/app.constant';
import logger from '@utils/logger';
import { STATUS } from '@constants/PARTICIPANTS_LIST';
import { ParticipantData } from '@app-types/participant';

interface ObservationData {
  entityId: string;
  observationId: string;
}

/**
 * ObservationContent Component Props
 * Component without navigation dependencies - can be used in modals
 */
interface ObservationContentProps {
  participant?: ParticipantData;
  solutionId: string;
  submissionNumber?: number;
  onClose?: () => void;
  showAlert: (type: string, message: string, options?: any) => void;
  defaultValues?: any;
  userData?: any;
  hideElements?: any;
  _css?: any;
}

/**
 * ObservationContent Component
 * Component for viewing/editing observations without navigation dependencies
 */
const ObservationContent: React.FC<ObservationContentProps> = ({
  participant,
  solutionId,
  submissionNumber,
  onClose,
  showAlert,
  userData,
  hideElements,
  _css,
}) => {
  const { t } = useLanguage();
  const [observation, setObservation] = useState<ObservationData | null>(null);
  const [defaultValuesLocal, setDefaultValuesLocal] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [token, setToken] = useState<string | null>(null);
  const [mockData, setMockData] = useState<any>();
  const [submission, setSubmission] = useState<any>(null);
  // Use ref to store progress callback to avoid prop changes causing rerenders
  const progressCallbackRef =
    useRef<
      (
        progressValue: number | { data: { percentage: number }; type: string },
      ) => void | undefined
    >(undefined);

  const fetchObservationSolution = async ({
    entityId,
    observationId,
    submissionNumberInput
  }: {
    entityId: string;
    observationId: string;
    submissionNumberInput: number | undefined;
  }) => {
    try {
      let observationSubmissions = await getObservationSubmissions({
        observationId,
        entityId,
      });
      if(!observationSubmissions.result || observationSubmissions.result.length === 0) {
        await createObservationSubmission({
          observationId: observationId,
          entityId: entityId,
        });
        observationSubmissions = await getObservationSubmissions({
          observationId,
          entityId,
        });
      }
      let observationSubmissionsLast;
      let observationSolution: any = null;
      if(submissionNumberInput) {
        observationSubmissionsLast = observationSubmissions.result.find((submissionItem: any) => submissionItem.submissionNumber == submissionNumberInput);
        if(!observationSubmissionsLast && submissionNumberInput !== 1) {
          showAlert( 'error', `${t('logVisit.thisFormNotFound')} ${submissionNumberInput}`,
            {duration: 10000},
          );
          return;
        }
      } else {
        observationSubmissionsLast = observationSubmissions.result.find((submissionItem: any) => submissionItem.status === CARD_STATUS.IN_PROGRESS || submissionItem.status === CARD_STATUS.NOT_STARTED || submissionItem.status === CARD_STATUS.DRAFT);
        if (!observationSubmissionsLast) {
          observationSubmissionsLast = observationSubmissions.result?.[0] || null;
        }
      }
      if (observationSubmissionsLast && observationSubmissionsLast.status !== CARD_STATUS.COMPLETED) {
        const submissionId = observationSubmissionsLast._id;
        observationSolution = await offlineStorage.read(submissionId, {
          dbName: 'questionnairePlayer',
          storeName: 'questionnaire',
        });
      }

      setSubmission(observationSubmissionsLast);
      let numsub;
      if(submissionNumberInput) {
        numsub = submissionNumberInput;
      } else if(observationSubmissionsLast?.status === CARD_STATUS.COMPLETED){
        numsub = observationSubmissionsLast?.submissionNumber + 1;
        setSubmission({status:CARD_STATUS.IN_PROGRESS});
      } else if(observationSubmissionsLast?.submissionNumber){
        numsub = observationSubmissionsLast?.submissionNumber;
      } else {
        numsub = 1;
      }

      if (!observationSolution) {
        
        const response = await getObservationSolution({
          observationId,
          entityId,
          submissionNumber:numsub,
          evidenceCode:observationSubmissionsLast?.evidencesStatus?.[0]?.code,
        });
        observationSolution = response.result;
      }

      if(userData) {
        const defaultValues = buildDefaultValuesFromObservation(observationSolution, userData);
        setDefaultValuesLocal(defaultValues);
      }
      setMockData(observationSolution);
      setObservation({
        entityId: entityId,
        observationId: observationId,
      });
    } catch (error: any) {
      showAlert(
        'error',
        `${t('observation.noParticipantFoundError')} : ${error.message}`,
        {
          duration: 10000,
        },
      );
    }
  };
  
  const setLoadingOff = () => {
    setTimeout(() => {
      setLoading(false);
    }, 500);
  };

  useEffect(() => {
    const fetchObservation = async () => {
      const tokenData = await getToken();
      setToken(tokenData);
      try {
        const observationData = await getObservationEntities({
          solutionId,
          profileData: {},
        });
        if(!observationData.result?.allowMultipleAssessemts && submissionNumber && submissionNumber > 1){
          showAlert('error', t('logVisit.multipleAssessemtsNotAllowed'));
          return;
        }
        const observationId = observationData?.result?._id;
        if (observationId) {
          const newData = observationData?.result?.entities?.find(
            (entity: any) => entity.externalId == participant?.userId,
          );
          if (newData) {
            fetchObservationSolution({
              entityId: newData._id,
              observationId: observationId,
              submissionNumberInput: !observationData.result?.allowMultipleAssessemts ? 1 : submissionNumber,
            });
            setLoadingOff();
          } else {
            const entitiesData = await searchObservationEntities({
              observationId: observationId,
              search: participant?.name,
            });
            const entityData = entitiesData.result?.[0]?.data.find(
              (entity: any) => entity.externalId == participant?.userId,
            );
            if (entityData) {
              try {
                const data = await updateObservationEntities({
                  observationId,
                  data: [entityData._id],
                });
                if (data) {
                  fetchObservationSolution({
                    entityId: entityData._id,
                    observationId: observationId,
                    submissionNumberInput: !observationData.result?.allowMultipleAssessemts ? 1 : submissionNumber,
                  });
                  setLoadingOff();
                }
              } catch (error: any) {
                showAlert(
                  'error',
                  `${t('observation.noParticipantFoundError')} : ${
                    error.message
                  }`,
                  { duration: 10000 },
                );
                setLoadingOff();
              }
            } else {
              showAlert('error', t('observation.noParticipantFound'));
              setLoadingOff();
            }
          }
        } else {
          showAlert('error', t('observation.noParticipantFound'));
          setLoadingOff();
        }
      } catch (error: any) {
        showAlert('error', t('observation.noParticipantFoundError') + ' : ' + error.message);
        setLoadingOff();
      }
    };
    if (solutionId && participant?.userId) {
      fetchObservation();
    }

    return () => {
      setMockData(null);
      setObservation(null);
      setProgress(0);
      setLoading(true);
      setDefaultValuesLocal(null);
      setSubmission(null);
      setToken(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solutionId, participant?.userId, submissionNumber]);

  const handleBackPress = useCallback(() => {
    if (onClose) {
      onClose();
      return false;
    }
    return false;
  }, [onClose]);

  // Update ref whenever callback changes
  useEffect(() => {
    progressCallbackRef.current = (
      progressValue: number | { data: { percentage: number }; type: string },
    ) => {
      setProgress(
        Math.round(
          (progressValue as { data: { percentage: number } }).data
            ?.percentage || 0,
        ),
      );
    };
  }, []);

  // Stable callback that uses ref - this won't change between renders
  const handleProgressUpdate = useCallback(
    (
      progressValue: number | { data: { percentage: number }; type: string },
    ) => {
      progressCallbackRef.current?.(progressValue);
    },
    [],
  );

  const handleToast = useCallback(
    (toastValue: { message: string; toastType: string }) => {
      showAlert(toastValue.toastType, toastValue.message);
    },
    [showAlert],
  );

  // Memoize playerConfig to prevent WebComponentPlayer rerenders
  const playerConfigMemoized = React.useMemo(
    () => ({
      // @ts-ignore - process.env is injected by webpack DefinePlugin on web
      baseURL: `${process.env.API_BASE_URL}/api`,
      fileSizeLimit: 50,
      userAuthToken: token,
      solutionType: 'observation' as const,
      observationId: observation?.observationId,
      entityId: observation?.entityId,
      evidenceCode: mockData?.assessment?.evidences[0]?.code,
      index: 0,
      submissionNumber: submissionNumber,
      solutionId: observation?.observationId,
      showSaveDraftButton: true,
      progressCountOptionalFields:false,
      progressCalculationLevel: 'input' as const,
      mockData: mockData,
      defaultValues: defaultValuesLocal,
      usePageQuestionsGrid: true,
      showPrivacyPopup: false,
      showToast: false,
      saveProgressStorageType: "server",
      showNextTabButton: true,
      dynamicEntityTyperequireDynamicAnswers:{
        lableMapping:{
          status:STATUS
        }
      }
    }),
    [token, observation?.observationId, observation?.entityId, mockData, submissionNumber, defaultValuesLocal],
  );

  const handleAfterSubmit = (event?: any) => {
    logger.info('event', event);
    handleBackPress();
  };

  return (
    <>
      <VStack
        {...observationStyles.loadingContainer}
        display={loading ? 'flex' : 'none'}
      >
        <Spinner size="large" color="$primary500" />
      </VStack>

      <VStack
        {...observationStyles.contentContainer}
        display={loading ? 'none' : 'flex'}
      >
        {/* Header Section */}
        <Header
          hideElements={hideElements?.header}
          _css={_css?._header}
          title={mockData?.solution?.name || ''}
          progress={progress}
          participantInfo={participant as any}
          onBackPress={handleBackPress}
          status={submission?.status || ''}
        />

        <Container>
          {/* Web Component Player */}
          <Box {...observationStyles.webComponentPlayerContainer}>
            {mockData &&
              <WebComponentPlayer
                getProgress={handleProgressUpdate}
                getToast={handleToast}
                // @ts-ignore - afterSubmitCallback exists in web version
                afterSubmitCallback={handleAfterSubmit}
                playerConfig={playerConfigMemoized}
              />
            }
          </Box>
        </Container>
      </VStack>
    </>
  );
};

export default ObservationContent;

/**
 * Extracts and builds default values from observationSolution using question externalIds and userData.
 * This function can be used to prefill form data for an observation, using userData keys as source.
 *
 * @param observationSolution The observation solution object structure containing evidences & questions
 * @param userData The participant/user object from which to pick default values
 * @returns An object mapping question externalIds to userData values (or undefined if not present)
 */
const buildDefaultValuesFromObservation = (
  observationSolution: any,
  userData: any
): Record<string, any> => {
  if (!observationSolution?.assessment?.evidences) return {};

  const userDataKeys = Object.keys(userData);
  const defaultValues: Record<string, any> = {};

  for (const evidence of observationSolution.assessment.evidences) {
    if (!evidence.sections) continue;
    for (const section of evidence.sections) {
      if (!section.questions) continue;
      for (const question of section.questions) {
        // Handle questions with pageQuestions separately
        if (question.responseType === 'pageQuestions' && Array.isArray(question.pageQuestions)) {
          for (const pageQuestion of question.pageQuestions) {
            // pageQuestion.question is an array of strings, key is a string. Compare lowercase.
            const keyFound = userDataKeys.find(key => 
              Array.isArray(pageQuestion?.question)
                ? pageQuestion.question
                    .map((q: string) => (typeof q === 'string' ? q?.toLowerCase() : ''))
                    .some(
                      (qString: string) =>
                        (typeof key === 'string' && typeof qString === 'string'
                          ? key.toLowerCase() === qString.toLowerCase()
                          : false)
                    )
                : (() => { 
                    throw new Error("pageQuestion.question is not an array"); 
                  })()
            );
            if (keyFound !== undefined) {
              let value = typeof userData[keyFound] === "string" ? userData[keyFound] : userData[keyFound]?.value;
              if (pageQuestion.responseType === "radio") {
                value = pageQuestion.options.find(
                  (option: any) =>
                    option.value === value ||
                    option.label === value ||
                    (option.label != null &&
                      value != null &&
                      option.label?.toString().toLowerCase().includes(value?.toString().toLowerCase()))
                )?.value;
              }
              defaultValues[pageQuestion._id] = { value: value, readonly: userData[keyFound]?.readonly === false ? false : true };
            }
          }
        } else {
          const keyFound = userDataKeys.find(key => question.question.includes(key));
          if (keyFound !== undefined && question.externalId) {
            defaultValues[question.externalId] = { value: typeof userData[keyFound] === "string" ? userData[keyFound] : userData[keyFound]?.value, readonly: userData[keyFound]?.readonly === false ? false : true };
          }
        }
      }
    }
  }

  return defaultValues;
};
