import React, { useEffect, useState } from 'react';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import ObservationContent from './ObservationContent';
import { Loader, useAlert } from '@ui';
import { getParticipantsList } from '../../services/participantService';
import { useAuth } from '@contexts/AuthContext';
import { ParticipantData } from '@app-types/participant';

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
  const [participant, setParticipant] = useState<ParticipantData | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const {user, setNavbarData} = useAuth();
  const { showAlert } = useAlert();
  const handleBackPress = () => {
      // @ts-ignore
    if (routeParams?.redirectUrl) {
      // @ts-ignore
      navigation.navigate(routeParams.redirectUrl);
      return;
    }
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
      if(user?.id == id) {
        setParticipant({...user, userId: user?.id, name: user?.name, contact: user?.phone, address: user?.address, status: user?.status} as ParticipantData);
        setNavbarData({
          subtitle: user?.name,
        });
        setUserData({});
        setIsLoading(false);
        return;
      } else {
        const userDataResponse = await getParticipantsList({userId:user?.id as string,entityId:id});
        const newData = userDataResponse?.result?.data?.[0];
        setParticipant(newData as ParticipantData);
        setNavbarData({
          subtitle: newData?.name,
        });
        const preFillData = {
          "Facilitator Name":user?.name,
          "Province":{value:user?.province?.label, readonly: user?.province?.label ? true : false},
          "Pilot Site":{value:user?.site?.label, readonly: user?.site?.label ? true : false},
          "Date of Collection":{value:new Date().toISOString().split('T')[0], readonly: false},
          "What is your name?":{value:newData?.name, readonly: false},
          "What is your ID number?":newData?.userId,
          // "Is the respondent a man or a woman? (record from observation)":newData?.userDetails?.gender,
          "What is your cell phone number?":{value:newData?.userDetails?.phone, readonly: false},
          "And what is your email address?":{value:newData?.userDetails?.email, readonly: true},
        };
        setUserData(preFillData);
      }
      setIsLoading(false);
    };
    fetchUserData();

    return () => {
      setUserData(null);
      setIsLoading(true);
      setNavbarData(null);
    };
  }, [id,user, setNavbarData]);
  
  if (isLoading) {
    return <Loader fullScreen message="Loading observation..." />;
  }

  if (!id || !solutionId || !userData) {
    return null;
  }
  console.log('participant', participant);
  return (
    <ObservationContent
      participant={participant}
      solutionId={solutionId}
      submissionNumber={submissionNumber}
      onClose={handleBackPress}
      showAlert={(type, message, options) => showAlert(type as any, message, options)}
      userData={userData}
    />
  );
};

export default Observation;
