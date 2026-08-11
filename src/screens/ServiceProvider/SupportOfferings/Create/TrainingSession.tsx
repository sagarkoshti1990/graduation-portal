import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, Container, VStack, useAlert } from '@ui';
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
import { FORM_MODE } from '@constants/SUPPORT_PROVIDER_CARDS';

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
  const initialSessionData = route.params?.sessionData;
  const { t } = useLanguage();
  const [provinces, setProvinces] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [pillers, setPillers] = useState<MentoringOption[]>([]);
  const [sessionTypes, setSessionTypes] = useState<MentoringOption[]>([]);
  const [targetAudience, setTargetAudience] = useState<MentoringOption[]>([]);
  const [deliveryModes, setDeliveryModes] = useState<MentoringOption[]>([]);
  const [values, setValues] = useState<any>({});
  const { showAlert } = useAlert();

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
      }
    };

    init();
  }, [sessionId, modeType]);

  const handleFieldChange = useCallback(
    (name: string, value: string, other?:any) => {
      setValues((prev: Record<string, any>) => {
        const next = { ...prev, [name]: value };
        if (name === 'province') next.site = '';
        if (name === 'categories') {
          next.idp_training_task = '';
          next.title = '';
        }
        if(name === 'idp_training_task'){
          next.title = other?.label;
        }
        return next;
      });
    },
    [pillers]
  );

  useEffect(() => {
    const init = async () => {
      if (!values.categories) {
        setSessionTypes([]);
        return;
      }
      const selectedPillarObj = pillers.find(
        p => p.value === values.categories || p.label === values.categories
      );
      const pillarCode = (selectedPillarObj?.value || values.categories).toLowerCase();
      if (pillarCode) {
        try {
          const res = await getSessionTypesByPillar(pillarCode);
          setSessionTypes(res || []);
        } catch (err) {
          console.error('Error fetching session types:', err);
          setSessionTypes([]);
        }
      } else {
        setSessionTypes([]);
      }
    };

    init();
  }, [values.categories]);


  useEffect(() => {
    const init = async () => {
      if (!values.province) {
        setSites([]);
        return;
      }
      try {
        const res = await getSitesByProvince({ provinceId: values.province, page: 1, limit: 100 });
        setSites(res.result?.data || []);
      } catch (err) {
        console.error('Error fetching sites:', err);
        setSites([]);
      }
    };

    init();
  }, [values.province]);

  const optionsMap = useMemo(() => {
    const provinceOpts =
      provinces && provinces.length > 0
        ? provinces.map((p: any) => ({
            value: p._id || p.id || p.name,
            label: p.name || p.label,
          }))
        : [];

    const siteOpts = sites
      ? sites.map((s: any) => ({
          value: s._id || s.id || s.name,
          label: s.name || s.label,
        }))
      : [];

    return {
      provinces: provinceOpts,
      sites: siteOpts,
      pillars: pillers,
      sessionTypes: sessionTypes,
      targetAudienceOptions: targetAudience,
      certificateOptions: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' },
      ],
      recurringOptions: [
        { value: 'true', label: 'Yes — recurring session' },
        { value: 'false', label: 'No — one-off session' },
      ],
      formatOptions: deliveryModes.map((mode) => ({
        value: mode.value,
        label: mode.label,
        icon: DELIVERY_MODE_ICONS[mode.value?.toLowerCase()] || 'MapPin',
      })),
    };
  }, [provinces, sites, pillers, sessionTypes, targetAudience, deliveryModes, values.categories]);

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

  // Route Validation:
  // 1. 'create' mode WITH an ID -> Not Found
  // 2. 'copy' or 'edit' mode WITHOUT an ID -> Not Found
  if (modeType === FORM_MODE.CREATE && sessionId) {
    return <NotFound message="Routes Not Found" />;
  }

  if ((modeType === FORM_MODE.COPY || modeType === FORM_MODE.EDIT) && !sessionId && !initialSessionData) {
    return <NotFound message="Routes Not Found" />;
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
            schema={TRAINING_FORM_SCHEMA}
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
              return uploaded?.data?.[0];
            }}
            submitButtonProps={{bg:"green", icon: "Check"}}
            submitButtonText={t("supportProvider.supportOfferings.buttonTexts.publishSupport")}
          />
        </Card>
      </Container>
    </VStack>
  );
};

export default App;
