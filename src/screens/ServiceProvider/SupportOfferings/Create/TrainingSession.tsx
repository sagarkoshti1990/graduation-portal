import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, Container, Loader, VStack, useAlert } from '@ui';
import styles from '../styles';
import SPTitleHeader from '@components/Header/SPTitleHeader';
import { useNavigation, useRoute } from '@react-navigation/native';
import SchemaFormRenderer from '@components/SchemaFormRenderer';
import { TRAINING_FORM_SCHEMA } from '@constants/TRAINING_FORM_SCHEMA';
import { useLanguage } from '@contexts/LanguageContext';
import { getSitesByProvince, getProvincesList } from '../../../../services/usersService';
import { uploadFiles } from '../../../../project-player/services/projectPlayerService';
import {
  getSessionCategories,
  getRecommendedFor,
  getSessionTypesByPillar,
  getDeliveryModes,
  createSession,
  getSessionDetails,
  MentoringOption,
} from '../../../../services/mentoringService';
import NotFound from '@components/NotFound';
import { valueMapping } from '@utils/supportProvider';
import { FORM_MODE, SESSION_STATUS } from '@constants/SUPPORT_PROVIDER_CARDS';
import { useTrainingFormOptions } from '@hooks';


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
  const sessionId = route.params?.id || route.params?.sessionId;
  const { t } = useLanguage();
  const [provinces, setProvinces] = useState<any[]>([]);
  const [pillers, setPillers] = useState<MentoringOption[]>([]);
  const [targetAudience, setTargetAudience] = useState<MentoringOption[]>([]);
  const [deliveryModes, setDeliveryModes] = useState<MentoringOption[]>([]);
  const [values, setValues] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const { showAlert } = useAlert();

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

  useEffect(() => {
    const init = async () => {
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
        if (modeType === FORM_MODE.COPY || modeType === FORM_MODE.EDIT) {
          const rawResponse = await getSessionDetails(sessionId);
          const rawData = rawResponse?.result;
          if (rawData) {
            const formattedValues: any = valueMapping(rawData, true); // Reverse mapping to form values
            setValues(formattedValues);
          }
        }
      } catch (error: any) {
        console.error('Error loading form data:', error);
        showAlert('error', error?.message || 'Failed to load form options. Please refresh and try again.');
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [sessionId, modeType]);

  const handleFieldChange = useCallback(
    (name: string, value: string, other?: any) => {
      setValues((prev: Record<string, any>) => {
        const next = { ...prev, [name]: value };
        if (name === 'province') next.site = '';
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
    [pillers]
  );

  const handleSave = async (formValues: any, isDraft: boolean) => {
    try {
      setValues(formValues);
      const payload: any = valueMapping({ ...formValues, isDraft }, false, optionsMap);

      if (modeType === 'edit') {
        // update code api call
      }
      else {
        await createSession(payload);
      }

      const successMsg = isDraft
        ? t('supportProvider.createSupport.training.alerts.draftSaved', 'Draft saved successfully!')
        : modeType === FORM_MODE.COPY
          ? t('supportProvider.createSupport.training.alerts.sessionCopied', 'Training session copied successfully!')
          : t('supportProvider.createSupport.training.alerts.sessionSaved', 'Training session saved successfully!');

      showAlert('success', successMsg);
      // @ts-ignore
      navigation.navigate('opportunities');
    } catch (error: any) {
      console.error('Error saving training session:', error);
      // Show specific API error message if available, otherwise generic message
      const errMsg =
        error?.data?.message ||
        error?.message ||
        t('supportProvider.createSupport.training.errors.saveFailed', 'Something went wrong while saving. Please try again.');
      showAlert('error', errMsg);
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
            uploadService={async (file) => {
              const entityId = `trainingSession-${Date.now()}`;
              const uploaded = await uploadFiles(entityId, [
                { ...file, size: file.size ?? 0 },
              ]);
              const url = uploaded?.data?.[0]?.url;
              if (!url) {
                throw new Error(`Failed to upload file: ${file.name}`);
              }
              const data = uploaded?.data?.[0];
              const [f, s] = data?.type.split("/");
              return {
                name: data?.name,
                link: data?.url,
                sourcePath: data?.sourcePath,
                type: s || f,
                size: data?.size
              }
            }}
            submitButtonProps={{ bg: "green", icon: "Check" }}
            submitButtonText={t("supportProvider.supportOfferings.buttonTexts.publishSupport")}
          />
        </Card>
      </Container>
    </VStack>
  );
};

export default App;
