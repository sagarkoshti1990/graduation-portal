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
  MentoringOption,
} from '../../../../services/mentoringService';
import moment from 'moment';

// Icon shown next to each delivery mode option in the format-type pill selector
const DELIVERY_MODE_ICONS: Record<string, string> = {
  offline: 'MapPin',
  online: 'Video',
  hybrid: 'Users',
};

const App = (): React.JSX.Element => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const sessionId = route.params?.sessionId;
  const { t } = useLanguage();
  const [provinces, setProvinces] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [pillers, setPillers] = useState<MentoringOption[]>([]);
  const [sessionTypes, setSessionTypes] = useState<MentoringOption[]>([]);
  const [targetAudience, setTargetAudience] = useState<MentoringOption[]>([]);
  const [deliveryModes, setDeliveryModes] = useState<MentoringOption[]>([]);
  const [values, setValues] = useState<any>({});
  const { showAlert } = useAlert();

  useEffect(() => {
    
  const init = async () => {
    
    const [result, getCategories, getTarget, getDeliveryModeOptions] = await Promise.all([
      getProvincesList(),
      getSessionCategories(),
      getRecommendedFor(),
      getDeliveryModes(),
    ]);
    setProvinces(result)
    setPillers(getCategories)
    setTargetAudience(getTarget)
    setDeliveryModes(getDeliveryModeOptions)
  };
  
  init();
  }, []);

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
      if (name === 'categories') {
        if (!value) {
          setSessionTypes([]);
          return;
        }
        const selectedPillarObj = pillers.find(
          p => p.value === value || p.label === value
        );
        const pillarCode = (selectedPillarObj?.value || value).toLowerCase();
        if (pillarCode) {
          getSessionTypesByPillar(pillarCode).then(res => setSessionTypes(res || []));
        } else {
          setSessionTypes([]);
        }
      }
    },
    [pillers]
  );

  useEffect(() => {
    if (!values.province) {
      setSites([]);
      return;
    }
    getSitesByProvince({ provinceId: values.province, page: 1, limit: 100 })
      .then(res => setSites(res.result?.data || []))
      .catch(() => setSites([]));
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
      const payload = {
        ...formValues,
        categories: [formValues.categories],
        province: [formValues.province],
        recommended_for: [formValues.recommended_for],
        start_date: moment(formValues.start_date).unix(),
        end_date: moment(formValues.end_date).unix(),
        certificate_provided: formValues.certificate_provided === true,
        can_be_copied: formValues.can_be_copied === true,
        time_zone: 'Asia/Kolkata',
        session_type: "Public",
        status: isDraft ? 'DRAFT' : 'PUBLISHED',
        meeting_info: {
          link: formValues.meeting_link,
          location: formValues.location
        },
      };
      await createSession(payload);

      showAlert('success', isDraft ? 'Draft saved successfully!' : 'Training session saved successfully!');
      // @ts-ignore
      navigation.navigate('opportunities');
    } catch (error) {
      console.error('Error saving training session:', error);
      showAlert('error', 'Something went wrong.');
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

  return (
    <VStack flex={1}>
      <SPTitleHeader
        title={t('supportProvider.createSupport.training.title', 'Create Training Session')}
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
