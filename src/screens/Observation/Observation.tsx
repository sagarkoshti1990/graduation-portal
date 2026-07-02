import React, { useEffect, useState } from 'react';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import ObservationContent from './ObservationContent';
import { Loader, useAlert } from '@ui';
import { getParticipantsList } from '../../services/participantService';
import dataService from '../../services/dataService';
import { useAuth, useIsdminPanalAccess } from '@contexts/AuthContext';
import { ParticipantData } from '@app-types/participant';
import { buildObservationPrefillData } from '@constants/OBSERVATION_PREFILL';

const DEFAULT_COUNTRY_CODE = 27;

const formatCountryCode = (phoneCode?: string | number | null) =>
  `(+${phoneCode || DEFAULT_COUNTRY_CODE})`;

/**
 * Route parameters type definition for Observation screen
 */
type ObservationRouteParams = {
  id?: string;
  solutionId?: string;
  submissionNumber?: number;
  taskId?: string;
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
  const taskId = routeParams?.taskId;
  const [userData, setUserData] = useState<any>(null);
  const [participant, setParticipant] = useState<ParticipantData | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const {user, setNavbarData} = useAuth();
  const isAdminPanalAccess = useIsdminPanalAccess();
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
      try {
        if(user?.id == id) {
          setParticipant({...user, userId: user?.id, name: user?.name, contact: user?.phone, address: user?.address, status: user?.status} as ParticipantData);
          setNavbarData({
            subtitle: user?.name,
          });
          setUserData({});
          return;
        } else {
          // Use offline-aware fetch so participant data loads from cache when offline
          const result = await dataService.getParticipantDetails(id, user?.id as string);
          const newData = result.data as any;

          if (!newData) {
            // Online fallback in case the offline cache has no data and
            // dataService.getParticipantDetails returned null
            try {
              const userDataResponse = await getParticipantsList({userId:user?.id as string,entityId:id});
              const fallbackData = userDataResponse?.result?.data?.[0];
              if (fallbackData) {
                const { userDetails: ud, ...rest } = fallbackData;
                const mapped = { ...(ud || {}), ...rest, accountUserStatus: ud?.status };
                setParticipant(mapped as ParticipantData);
                setNavbarData({ subtitle: mapped?.name });
                const alternatePhoneCode = ud?.alternate_phone_code ?? ud?.phone_code;
                setUserData(buildObservationPrefillData({
                  facilitatorName: user?.name,
                  provinceLabel: user?.province?.label,
                  siteLabel: user?.site?.label,
                  participantName: mapped?.name,
                  nationalIdLabel: ud?.national_id?.label || '',
                  phoneCode: ud?.phone_code,
                  phone: ud?.phone,
                  alternatePhoneCode,
                  email: ud?.email,
                }, formatCountryCode));
              }
            } catch { /* ignore — participant stays undefined */ }
            return;
          }

          setParticipant(newData as ParticipantData);
          setNavbarData({ subtitle: newData?.name });

          // Cached data is already flattened (userDetails merged); fields may also,
          // live under userDetails when reading raw API response as fallback.
          const ud = newData?.userDetails;
          const alternatePhoneCode =
            ud?.alternate_phone_code ?? ud?.phone_code ??
            newData?.alternate_phone_code ?? newData?.phone_code;
          const preFillData = buildObservationPrefillData({
            facilitatorName: user?.name,
            provinceLabel: user?.province?.label,
            siteLabel: user?.site?.label,
            participantName: newData?.name,
            nationalIdLabel: (ud?.national_id?.label || newData?.national_id?.label) || '',
            phoneCode: ud?.phone_code ?? newData?.phone_code,
            phone: ud?.phone ?? newData?.phone,
            alternatePhoneCode,
            email: ud?.email ?? newData?.email,
            gender: newData?.userDetails?.gender?.label || "",
            dob: newData?.userDetails?.dob?.label ? newData.userDetails.dob.label.split("_").reverse().join("-") : ""
          }, formatCountryCode);
          setUserData(preFillData);
        }
      } catch (error: any) {
        showAlert(
          'error',
          error?.message || 'Failed to load observation details. Please try again.',
          { duration: 10000 },
        );
      } finally {
        setIsLoading(false);
      }
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

  return (
    <ObservationContent
      participant={participant}
      solutionId={solutionId}
      submissionNumber={submissionNumber}
      taskId={taskId}
      onClose={handleBackPress}
      showAlert={(type, message, options) => showAlert(type as any, message, options)}
      userData={userData}
      canAccessCoachObservations={isAdminPanalAccess}
    />
  );
};

export default Observation;
