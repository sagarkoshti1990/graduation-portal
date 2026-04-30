import React, { memo, useCallback, useMemo, useState } from 'react';
import { Box, Button, ButtonIcon, LucideIcon, Modal, useAlert, Tooltip, TooltipContent, TooltipText, ButtonText } from '@ui';
import type { ParticipantData } from '@app-types/participant';
import { FILTER_KEYWORDS, PARTICIPANT_LOG_VISIT_KEYWORD } from '@constants/LOG_VISIT_CARDS';
import CheckInsListContent from './Check-ins-list/CheckInsListContent';
import ObservationContent from '../Observation/ObservationContent';
import { useLanguage } from '@contexts/LanguageContext';
import { getTargetedSolutions } from '../../services/solutionService';

type ModulePopupProps = {
  participant: ParticipantData;
  solutions?: any[];
  observationLogsTitle: string;
  noSolutionsMessage: string;
  buttonText?:string;
};

function LogVisitModulePopupComponent({
  participant,
  solutions,
  observationLogsTitle,
  noSolutionsMessage,
  buttonText
}: ModulePopupProps) {
  const [selectedSolutionId, setSelectedSolutionId] = useState<string>('');
  const [selectedSubmissionNumber, setSelectedSubmissionNumber] = useState<number | null>(null);
  const { showAlert } = useAlert()
  const { t } = useLanguage();

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
        } catch (err) {
          // Optionally handle error (maybe showAlert or similar, not shown here)
        }
      };
      fetchLogVisitSolution();
    }
    // Only run when logVisitSolution or solutions changes
  }, [logVisitSolution, solutions]);

  const isOpen = useMemo(() => selectedSolutionId !== '', [selectedSolutionId]);

  const bodyProps = useMemo(
    () => (selectedSubmissionNumber || buttonText ? { padding: 0, paddingTop: 0, paddingBottom: 0 } : {}),
    [selectedSubmissionNumber,buttonText],
  );

  const headerProps = useMemo(
    () => (selectedSubmissionNumber || buttonText ? { paddingBottom: 0, paddingTop: '$4' } : {}),
    [selectedSubmissionNumber,buttonText],
  );

  const hideElements = useMemo(
    () => ({ header: ['title', 'progress-bar', 'status-badge',...(buttonText ? ["backButton"] : [])] }),
    [buttonText],
  );

  const observationCss = useMemo(
    () => ({
      _header: {
        pageHeader: {
          _container: { '$md-px': '$6', px: '$4', pb: '$4', backgroundColor: '$backgroundColor' },
        },
      },
    }),
    [],
  );

  const userData = useMemo(
    () => ({
      'Visit Date': { value: new Date().toISOString().split('T')[0], readonly: false },
    }),
    [],
  );

  const checkInsContainer = useMemo(
    () => ({ px: '$0', py: '$0', '$md-px': '$0', '$md-py': '$0' }),
    [],
  );

  const handleOpenLogVisit = useCallback(() => {
    if (logVisitSolution?.solutionId) {
      setSelectedSolutionId(logVisitSolution.solutionId);
      return;
    }
    showAlert('error', noSolutionsMessage);
  }, [logVisitSolution, noSolutionsMessage, showAlert]);

  const handleCloseModal = useCallback(() => {
    setSelectedSolutionId('');
    setSelectedSubmissionNumber(null);
  }, []);

  const handleCloseObservation = useCallback(() => {
    if(buttonText) {
      handleCloseModal()
    } else {
      setSelectedSubmissionNumber(null);
    }
  }, [buttonText,handleCloseModal]);

  const handleSelectSubmission = useCallback((submission: { submissionNumber: number }) => {
    setSelectedSubmissionNumber(submission.submissionNumber);
  }, []);

  const renderButton = useCallback((triggerProps: any) =>
    <Button
      {...triggerProps}
      {...(buttonText ? {size:"sm"} : {
        position: "absolute",
        bottom: "$4",
        right: "$4",
        zIndex: 999,
        rounded: "$full",
        w: "$16",
        h: "$16",
      })}
      onPress={handleOpenLogVisit}
    >
      <ButtonIcon size={buttonText ? 16 : 20} as={LucideIcon} name={buttonText ? "ClipboardCheck" :"FileText"} />
      {buttonText && <ButtonText>{buttonText}</ButtonText>}
    </Button>
    , [handleOpenLogVisit, buttonText])
    
  return (
    <>
      <Tooltip
        placement="right"
        trigger={renderButton}
      >
        <TooltipContent backgroundColor='$textMutedForeground' rounded={"lg"}>
          <TooltipText>{buttonText || t('actions.viewVisitLogs')}</TooltipText>
        </TooltipContent>
      </Tooltip>
      
      <Modal
        isOpen={isOpen}
        onClose={handleCloseModal}
        headerTitle={observationLogsTitle}
        size="lg"
        bodyProps={bodyProps}
        headerProps={headerProps}
      >
        <Box flex={1} minHeight="$64">
          {selectedSubmissionNumber || buttonText ? (
            <ObservationContent
              participant={participant}
              hideElements={hideElements}
              _css={observationCss}
              solutionId={selectedSolutionId}
              onClose={handleCloseObservation}
              // @ts-ignore - showAlert is a valid prop
              showAlert={showAlert}
              submissionNumber={(selectedSubmissionNumber || undefined) as any}
              userData={userData}
            />
          ) : (
            <CheckInsListContent
              id={participant.userId}
              solutions={solutions}
              preSelectedSolution={selectedSolutionId}
              participant={participant}
              onFormSelect={handleSelectSubmission}
              _container={checkInsContainer}
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
