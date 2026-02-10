import React, { useEffect, useState } from 'react';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import ObservationContent from './ObservationContent';
import { Loader, useAlert } from '@ui';
import { getParticipantsList } from '../../services/participantService';
import { useAuth } from '@contexts/AuthContext';

/**
 * Route parameters type definition for Observation screen
 */
type ObservationRouteParams = {
  id?: string;
  solutionId?: string;
  submissionNumber?: number;
};

/**
 * Route type for Observation screen
 */
type ObservationRouteProp = RouteProp<{
  params: ObservationRouteParams;
}>;

/**
 * Observation Component
 * Screen component for viewing/editing observations
 * Uses ObservationContent for the actual content and adds navigation handling
 */
const Observation: React.FC = () => {
  const route = useRoute<ObservationRouteProp>();
  const navigation = useNavigation();
  
  // Use props if provided, otherwise fall back to route params
  const routeParams = route.params as ObservationRouteParams | undefined;
  const id = routeParams?.id || '';
  const solutionId = routeParams?.solutionId || '';
  const submissionNumber = routeParams?.submissionNumber;
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const {user} = useAuth();
  const { showAlert } = useAlert();
  const handleBackPress = () => {
    if (navigation.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // Fallback: Navigate to participant detail if there's no previous screen
      // @ts-ignore
      navigation.navigate('participant-detail', { id });
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      const userDataResponse = await getParticipantsList({userId:user?.id as string,entityId:id});
      const newData = userDataResponse?.result?.data?.[0];
      const preFillData = {
        "Facilitator Name":user?.name,
        "Province":{value:user?.province?.value, readonly: user?.province?.value ? true : false},
        "Pilot Site":{value:user?.site?.value, readonly: user?.site?.value ? true : false},
        "Date of Collection":{value:new Date().toISOString().split('T')[0], readonly: false},
        "What is your name?":{value:newData?.name, readonly: false},
        "What is your ID number?":newData?.userId,
        // "Is the respondent a man or a woman? (record from observation)":newData?.userDetails?.gender,
        "What is your cell phone number?":{value:newData?.phone, readonly: false},
        "And what is your email address?":{value:newData?.email, readonly: true},
      };
      setUserData(preFillData);
      setIsLoading(false);
    };
    fetchUserData();
  }, [id,user]);
  
  if (isLoading) {
    return <Loader fullScreen message="Loading observation..." />;
  }

  if (!id || !solutionId || !userData) {
    return null;
  }
  
  return (
    <ObservationContent
      id={id}
      solutionId={solutionId}
      submissionNumber={submissionNumber}
      onClose={handleBackPress}
      showAlert={(type, message, options) => showAlert(type as any, message, options)}
      userData={userData}
    />
  );
};

export default Observation;
