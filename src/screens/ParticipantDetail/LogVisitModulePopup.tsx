import React, { memo, useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { Box,  Modal, useAlert } from '@ui';
import type { ParticipantData } from '@app-types/participant';
import { FILTER_KEYWORDS, PARTICIPANT_LOG_VISIT_KEYWORD } from '@constants/LOG_VISIT_CARDS';
import CheckInsListContent from './Check-ins-list/CheckInsListContent';
import ObservationContent from '../Observation/ObservationContent';
import { getTargetedSolutions } from '../../services/solutionService';
import { LOG_VISIT_MODULE_POPUP } from '@constants/GET_ANSWER_DATA';
import { Animated, Easing } from 'react-native';
import ExpandableFab from '@components/FlotingButton';

type ModulePopupProps = {
  participant: ParticipantData;
  solutions?: any[];
  observationLogsTitle: string;
  noSolutionsMessage: string;
  buttonText?:string;
};
export const observationCss = {
  _header: {
    pageHeader: {
      _container: { '$md-px': '$6', px: '$4', pb: '$4', backgroundColor: '$backgroundColor' },
    },
  },
}
function LogVisitModulePopupComponent({
  participant,
  solutions,
  observationLogsTitle,
  noSolutionsMessage,
  buttonText
}: ModulePopupProps) {
  const [selectedSolutionId, setSelectedSolutionId] = useState<string>('');
  const [selectedSubmissionNumber, setSelectedSubmissionNumber] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [openForm,setOpenForm] = useState(false);

  const { showAlert } = useAlert()

  const animatedValue = useRef(new Animated.Value(0)).current;

  const [logVisitSolution, setLogVisitSolution] = useState(() =>
    solutions?.find(e => e?.keywords?.includes(PARTICIPANT_LOG_VISIT_KEYWORD))
  );
  
  React.useEffect(() => {
    if (!logVisitSolution) {
      const fetchLogVisitSolution = async () => {
        try {
          const solutionsData = await getTargetedSolutions({
            type: 'observation',
            'filter[keywords]': FILTER_KEYWORDS.PARTICIPANT_LOG_VISIT.join(','),
          });
    
          setLogVisitSolution(solutionsData?.[0]);
        } catch (err) {}
      };
      fetchLogVisitSolution();
    }
  }, [logVisitSolution, solutions]);

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: expanded ? 1 : 0,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [expanded]);

  const isOpen = useMemo(() => selectedSolutionId !== '', [selectedSolutionId]);
  
  const bodyProps = useMemo(
    () => (selectedSubmissionNumber || openForm ? { padding: 0, paddingTop: 0, paddingBottom: 0 } : {}),
    [selectedSubmissionNumber,openForm],
  );

  const headerProps = useMemo(
    () => (selectedSubmissionNumber || openForm ? { paddingBottom: 0, paddingTop: '$4' } : {}),
    [selectedSubmissionNumber,openForm],
  );

  const hideElements = useMemo(
    () => ({ header: ['title', 'progress-bar', 'status-badge',...(buttonText ? ["backButton"] : ["backButton"])] }),
    [buttonText],
  );

  const checkInsContainer = useMemo(
    () => ({ px: '$0', py: '$0', '$md-px': '$0', '$md-py': '$0' }),
    [],
  );

  const handleOpenLogVisit = useCallback((isOpenf:"expand" | "openForm" | "openList" = "expand") => {
    if(isOpenf === "expand") {
      setExpanded(prev => !prev)
    } else if(["openForm","openList"].includes(isOpenf)) {
      setOpenForm(isOpenf === "openForm" ? true : false);
      if (logVisitSolution?.solutionId) {
        setSelectedSolutionId(logVisitSolution.solutionId);
        return;
      }
      showAlert('error', noSolutionsMessage);
    } else if(!buttonText) {
    }
  }, [logVisitSolution, noSolutionsMessage, showAlert]);

  const handleCloseModal = useCallback(() => {
    setSelectedSolutionId('');
    setSelectedSubmissionNumber(null);
    setOpenForm(false)
  }, []);

  // const handleCloseObservation = useCallback(() => {
  //   if(buttonText) {
  //     handleCloseModal()
  //   } else {
  //     setSelectedSubmissionNumber(null);
  //   }
  // }, [buttonText,handleCloseModal]);

  const handleSelectSubmission = useCallback((submission: { submissionNumber: number }) => {
    setSelectedSubmissionNumber(submission.submissionNumber);
  }, []);
    
  return (
    <>
      <ExpandableFab {...(buttonText ? {buttonText,onPress:() => handleOpenLogVisit("openForm")} : {})} actions={[
        {
          label: "actions.logVisit",
          icon: "ClipboardCheck",
          onPress:() => handleOpenLogVisit("openForm")
        },{
          label:"actions.viewLog",
          icon: "FileText",
          onPress:() => handleOpenLogVisit("openList")
        }
      ]} />
      <Modal
        isOpen={isOpen}
        onClose={handleCloseModal}
        headerTitle={observationLogsTitle}
        size="lg"
        bodyProps={bodyProps}
        headerProps={headerProps}
      >
        <Box flex={1} minHeight="$64">
          {selectedSubmissionNumber || openForm ? (
            <ObservationContent
              participant={participant}
              hideElements={hideElements}
              _css={observationCss}
              solutionId={selectedSolutionId}
              // onClose={handleCloseObservation}
              onClose={handleCloseModal}
              // @ts-ignore - showAlert is a valid prop
              showAlert={showAlert}
              submissionNumber={(selectedSubmissionNumber || undefined) as any}
              userData={LOG_VISIT_MODULE_POPUP}
              _webComponent={{styleObject:{
                ".d-flex.pt-24.px-24.flex-ai-start.flex-gap-10:has(mat-icon)":{display: "none !important"},
                ".page-group-container":{background: "transparent !important",border: "0 !important"},
                ".questions-grid":{"padding":"0 !important"}
              }}}
            />
          ) : (
            <CheckInsListContent
              id={participant?.userId}
              solutions={solutions}
              preSelectedSolution={selectedSolutionId}
              participant={participant}
              onFormSelect={handleSelectSubmission}
              _container={checkInsContainer}
              _dataNotFoundCard={{variant:"ghost"}}
            />
          )}
        </Box>
      </Modal>
    </>
  );
}

const LogVisitModulePopup = memo(LogVisitModulePopupComponent, (prev, next) => {
  return (
    prev.participant === next.participant &&
    prev.solutions === next.solutions &&
    prev.observationLogsTitle === next.observationLogsTitle &&
    prev.noSolutionsMessage === next.noSolutionsMessage
  );
});

export default LogVisitModulePopup;