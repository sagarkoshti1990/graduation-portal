import React, { useCallback, useState } from 'react';
import { Card, Container, VStack, useAlert } from '@ui';
import styles from '../styles';
import SPTitleHeader from '@components/Header/SPTitleHeader';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import SchemaFormRenderer from '@components/SchemaFormRenderer';
import { ADDITIONAL_SERVICES_FORM_SCHEMA } from '@constants/ADDITIONAL_SERVICES_SCHEMA';
import { useLanguage } from '@contexts/LanguageContext';
import { getProvincesList } from '../../../../services/usersService';
import {
  getAdditionalServiceCategories,
  getSessionDetails,
  MentoringOption,
  createSession
} from '../../../../services/mentoringService';
import logger from '@utils/logger';
import { FORM_MODE, SESSION_STATUS } from '@constants/SUPPORT_PROVIDER_CARDS';
import { uploadService, valueMapping } from '@utils/supportProvider';
import { useTrainingFormOptions } from '@hooks';
import NotFound from '@components/NotFound';

const App = (): React.JSX.Element => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const modeType: String = route.params?.type;
  const sessionId = route.params?.id;

  const { t } = useLanguage();
  const { showAlert } = useAlert();
  const { isProfileComplete } = useProfileCompletion();

  const [provinces, setProvinces] = useState<any[]>([]);
  const [pillers, setPillers] = useState<MentoringOption[]>([]);

  const [values, setValues] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [lodingButton, setLodingButton] = useState<false | "saveDraft" | "submit">(false);

  const handleFieldChange = useCallback((name: string, value: string) => {
    setValues((prev: any) => {
      const next = { ...prev, [name]: value };
      if (name === 'provinces') next.sites = '';
      if (name === 'categories') next.idp_additional_services_tasks = [];
      return next;
    });
  }, []);

  const init = useCallback(async () => {
    try {
      const result = await getProvincesList();
      const getCategories = await getAdditionalServiceCategories();
      setProvinces(result);
      setPillers(getCategories);

      // Fetch session data via getSessionDetails API when in Copy or Edit mode
      if (sessionId && (modeType === FORM_MODE.COPY || modeType === FORM_MODE.EDIT)) {
        const rawResponse = await getSessionDetails(sessionId);
        const rawData = rawResponse?.result;
        if (rawData) {
          const formattedValues: any = valueMapping(rawData, true, {}, 'additional_service'); // Reverse mapping to form values
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

  const { sessionTypes, optionsMap } = useTrainingFormOptions({ values, provinces, pillers });

  const hideFileds = sessionTypes.length === 0 ? ['idp_additional_services_tasks'] : [];

  const handleSave = async (formValues: any, isDraft: boolean) => {
    try {
      setValues(formValues);
      setLodingButton(isDraft ? "saveDraft" : "submit")
      const payload: any = valueMapping({ ...formValues, isDraft }, false, optionsMap, 'additional_service');

      if (modeType === 'edit') {
        // update code api call
      }
      else {
        await createSession(payload);
      }

      const successMsg = isDraft
        ? t('supportProvider.supportOfferings.cards.alerts.draftSaved', 'Draft saved successfully!')
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
          'supportProvider.createSupport.errors.incompleteWarning',
          'Please Complete your Profile before proceeding.'
        )}
      />
    );
  }

  return (
    <VStack flex={1}>
      <SPTitleHeader
        title={t('supportProvider.createSupport.additionalService.title', 'Create Additional Service')}
        backButtonText={t('supportProvider.createSupport.changeType', 'Change type')}
        onNavigateBack={handleBackPress}
      />
      <Container {...styles.container}>
        <Card borderRadius={"$2xl"} bg="$white">
          <SchemaFormRenderer
            schema={ADDITIONAL_SERVICES_FORM_SCHEMA(hideFileds)}
            optionsMap={optionsMap}
            values={values}
            t={t}
            onFieldChange={handleFieldChange}
            onSubmit={(formValues) => handleSave(formValues, false)}
            onSaveDraft={(formValues) => handleSave(formValues, true)}
          />
        </Card>
      </Container>
    </VStack>
  );
};

export default App;
