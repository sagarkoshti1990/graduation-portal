import React, { useCallback, useState } from 'react';
import { Card, Container, Loader, VStack, useAlert } from '@ui';
import styles from '../styles';
import SPTitleHeader from '@components/Header/SPTitleHeader';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import SchemaFormRenderer from '@components/SchemaFormRenderer';
import { TRAINING_FORM_SCHEMA } from '@constants/TRAINING_FORM_SCHEMA';
import { useLanguage } from '@contexts/LanguageContext';
import { getProvincesList } from '../../../../services/usersService';
import {
  getSessionCategories,
  getRecommendedFor,
  getDeliveryModes,
  createSession,
  getSessionDetails,
  MentoringOption,
} from '../../../../services/mentoringService';
import NotFound from '@components/NotFound';
import { uploadService, valueMapping } from '@utils/supportProvider';
import { FORM_MODE, SESSION_STATUS } from '@constants/SUPPORT_PROVIDER_CARDS';
import logger from '@utils/logger';
import { useTrainingFormOptions, useProfileCompletion } from '@hooks';

// Icon shown next to each delivery mode option in the format-type pill selector
const DELIVERY_MODE_ICONS: Record<string, string> = {
  offline: 'MapPin',
  online: 'Video',
  hybrid: 'Users',
};

const App = (): React.JSX.Element => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const modeType: String = route.params?.type;
  const sessionId = route.params?.id;
  const { t } = useLanguage();
  const [provinces, setProvinces] = useState<any[]>([]);
  const [pillers, setPillers] = useState<MentoringOption[]>([]);
  const [targetAudience, setTargetAudience] = useState<MentoringOption[]>([]);
  const [deliveryModes, setDeliveryModes] = useState<MentoringOption[]>([]);
  const [values, setValues] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [lodingButton, setLodingButton] = useState<false | "saveDraft" | "submit">(false);
  const { showAlert } = useAlert();
  const { isProfileComplete } = useProfileCompletion();

  const { optionsMap } = useTrainingFormOptions({
    values,
    provinces,
    pillers,
    targetAudience,
    deliveryModes,
    deliveryModeIcons: DELIVERY_MODE_ICONS,
  });

  const getHeaderTitle = () => {
    switch (modeType) {
      case FORM_MODE.EDIT:
        return t('supportProvider.createSupport.training.editTitle', 'Edit Training Session');
      case FORM_MODE.COPY:
        return t('supportProvider.createSupport.training.copyTitle', 'Copy Training Session');
      case FORM_MODE.CREATE:
      default:
        return t('supportProvider.createSupport.training.title', 'Create Training Session');
    }
  };

  const init = useCallback(async () => {
    try {
      const [result, getCategories, getTarget, getDeliveryModeOptions] = await Promise.all([
        getProvincesList(),
        getSessionCategories(),
        getRecommendedFor(),
        getDeliveryModes(),
      ]);
      setProvinces(result);
      setPillers(getCategories);
      setTargetAudience(getTarget);
      setDeliveryModes(getDeliveryModeOptions);

      // Fetch session data via getSessionDetails API when in Copy or Edit mode
      if (sessionId && (modeType === FORM_MODE.COPY || modeType === FORM_MODE.EDIT)) {
        const rawResponse = await getSessionDetails(sessionId);
        const rawData = rawResponse?.result;
        if (rawData) {
          const formattedValues: any = valueMapping(rawData, true, {}, 'training'); // Reverse mapping to form values
          setValues(formattedValues);
        }
      }
    } catch (error: any) {
      logger.error('Error loading form data:', error);
      showAlert('error', error?.message || 'Failed to load form options. Please refresh and try again.');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, modeType]);

  useFocusEffect(
    useCallback(() => {
      init();
      return () => {
        setIsLoading(true);
        setValues({});
      };
    }, [init])
  );

  const handleFieldChange = useCallback(
    (name: string, value: string, other?: any) => {
      setValues((prev: Record<string, any>) => {
        const next = { ...prev, [name]: value };
        if (name === 'provinces') next.sites = '';
        if (name === 'categories') {
          next.idp_training_task = '';
          next.title = '';
        }
        if (name === 'idp_training_task') {
          next.title = other?.label;
        }
        return next;
      });
    },
    []
  );

  const handleSave = async (formValues: any, isDraft: boolean) => {
    try {
      setValues(formValues);
      setLodingButton(isDraft ? "saveDraft" : "submit")
      const payload: any = valueMapping({ ...formValues, isDraft }, false, optionsMap);

      if (modeType === 'edit') {
        // update code api call
      }
      else {
        await createSession(payload);
      }

      const successMsg = isDraft
        ? t('supportProvider.supportOfferings.cards.alerts.draftSaved', 'Support offering saved as draft!')
        : modeType === FORM_MODE.COPY
          ? t('supportProvider.supportOfferings.cards.alerts.supportCopied', 'Support copied successfully!')
          : t('supportProvider.supportOfferings.cards.alerts.supportPublished', 'Support published successfully!');

      showAlert('success', successMsg);
      // @ts-ignore
      navigation.navigate('opportunities');
    } catch (error: any) {
      logger.error('Error saving training session:', error);
      // Show specific API error message if available, otherwise generic message
      const errMsg =
        error?.data?.message ||
        error?.message ||
        t('supportProvider.createSupport.errors.saveFailed', 'Something went wrong while saving. Please try again.');
      showAlert('error', errMsg);
    } finally {
      setLodingButton(false);
    }
  };

  const handleBackPress = () => {
    if (navigation.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // @ts-ignore
      navigation.navigate('create-opportunity');
    }
  }

  if (isProfileComplete === false) {
    return (
      <NotFound
        message={t(
          'supportProvider.createSupport.errors.incompleteWarning'
        )}
      />
    );
  }

  if (isLoading) {
    return <Loader fullScreen message="Loading..." />;
  }

  if ((modeType === FORM_MODE.CREATE && sessionId) || ((modeType === FORM_MODE.COPY || modeType === FORM_MODE.EDIT) && !sessionId)) {
    return <NotFound message="Routes Not Found" />;
  }

  if (modeType === FORM_MODE.EDIT && values.status === SESSION_STATUS.PUBLISHED) {
    return <NotFound message="Published sessions cannot be edited" />;
  }

  return (
    <VStack flex={1}>
      <SPTitleHeader
        title={getHeaderTitle()}
        backButtonText={t('supportProvider.createSupport.changeType', 'Change type')}
        onNavigateBack={handleBackPress}
      />
      <Container {...styles.container}>
        <Card borderRadius={"$2xl"} bg="$white">
          <SchemaFormRenderer
            schema={TRAINING_FORM_SCHEMA()}
            optionsMap={optionsMap}
            values={values}
            t={t}
            onFieldChange={handleFieldChange}
            onSubmit={(formValues) => handleSave(formValues, false)}
            onSaveDraft={(formValues) => handleSave(formValues, true)}
            lodingButton={lodingButton}
            uploadService={uploadService}
            saveDraftButtonProps={{ _icon: { color: "$textForeground" } }}
            submitButtonProps={{ bg: "green", icon: "Check", _icon: { color: "$white" } }}
            submitButtonText={t("supportProvider.supportOfferings.buttonTexts.publishSupport")}
          />
        </Card>
      </Container>
    </VStack>
  );
};

export default App;
