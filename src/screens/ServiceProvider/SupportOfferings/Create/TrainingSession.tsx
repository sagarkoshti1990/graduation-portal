import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, Container, VStack, useAlert } from '@ui';
import styles from '../styles';
import SPTitleHeader from '@components/Header/SPTitleHeader';
import { useNavigation, useRoute } from '@react-navigation/native';
import SchemaFormRenderer from '@components/SchemaFormRenderer';
import { TRAINING_FORM_SCHEMA } from '@constants/TRAINING_FORM_SCHEMA';
import { useLanguage } from '@contexts/LanguageContext';
import { useUserManagementFilters } from '@constants/USER_MANAGEMENT';
import { getSitesByProvince } from '../../../../services/usersService';
import { saveTrainingSession, getTrainingSessionById } from '../../../../services/SupportOfferingsServices/supportOfferingsService';
import { uploadFiles } from '../../../../project-player/services/projectPlayerService';


const PILLAR_SESSION_TYPES: Record<string, string[]> = {
  'Social Empowerment': [
    'Personal Mastery Training',
    'Parenting Skills Training',
    'GBV Awareness Session',
    'Substance Abuse Awareness Session',
  ],
  'Financial Inclusion': ['Financial Literacy Training'],
  Livelihoods: [
    'Generate Your Business Idea Training',
    'Start Your Business Training',
    'Diversification Strategy',
    'Market Growth Strategy',
    'Livelihood Specific Training',
    'Job Readiness Training',
    'Technical/Vocational Training',
  ],
};

// conflicts
const App = (): React.JSX.Element => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const sessionId = route.params?.sessionId;
  const { t } = useLanguage();
  const { provinces: dynamicProvinces } = useUserManagementFilters({});
  const [dynamicSites, setDynamicSites] = useState<any[]>([]);
  const [values, setValues] = useState<any>({});
  const { showAlert } = useAlert();

  useEffect(() => {
    if (sessionId) {
      getTrainingSessionById(Number(sessionId)).then((session) => {
        if (session) {
          setValues(session);
        }
      });
    }
  }, [sessionId]);

  const handleFieldChange = useCallback((name: string, value: string) => {
    setValues(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'province') next.site = '';
      if (name === 'pillar') {
        next.sessionType = '';
        next.sessionTitle = '';
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (!values.province) {
      setDynamicSites([]);
      return;
    }
    getSitesByProvince({ provinceId: values.province, page: 1, limit: 100 })
      .then(res => setDynamicSites(res.result?.data || []))
      .catch(() => setDynamicSites([]));
  }, [values.province]);

  const optionsMap = useMemo(() => {
    const provinceOpts =
      dynamicProvinces && dynamicProvinces.length > 0
        ? dynamicProvinces.map((p: any) => ({
            value: p._id || p.id || p.name,
            label: p.name || p.label,
          }))
        : [];

    const siteOpts = dynamicSites
      ? dynamicSites.map((s: any) => ({
          value: s._id || s.id || s.name,
          label: s.name || s.label,
        }))
      : [];

    const selectedPillar = values.pillar;
    const sessionTypeOpts = (PILLAR_SESSION_TYPES[selectedPillar] || []).map(v => ({
      value: v,
      label: v,
    }));

    return {
      provinces: provinceOpts,
      sites: siteOpts,
      pillars: [
        {
          value: 'Social Empowerment',
          label:'Social Empowerment',
        },
        {
          value: 'Financial Inclusion',
          label: 'Financial Inclusion',
        },
        {
          value: 'Livelihoods',
          label: 'Livelihoods',
        },
      ],
      sessionTypes: [...sessionTypeOpts,...[{value:"other",label:"Other"}]],
      targetAudienceOptions: [
        {
          value: 'Coach',
          label: 'Coach',
        },
        {
          value: 'Participant',
          label: 'Participant',
        },
        {
          value: 'Both',
          label: 'Both',
        },
      ],
      certificateOptions: [
        {
          value: 'Yes',
          label: 'Yes',
        },
        {
          value: 'No',
          label: 'No',
        },
      ],
      recurringOptions: [
        {
          value: 'Yes',
          label: 'Yes — recurring session',
        },
        {
          value: 'No',
          label: 'No — one-off session',
        },
      ],
      formatOptions: [
        {
          value: 'Offline',
          label: 'Offline',
          icon: 'MapPin',
        },
        {
          value: 'Online',
          label: 'Online',
          icon: 'Video',
        },
        {
          value: 'Hybrid',
          label: 'Hybrid',
          icon: 'Users',
        },
      ],
    };
  }, [dynamicProvinces, dynamicSites, values.pillar]);

  const handleSave = async (formValues: any, isDraft: boolean) => {
    try {
      const response = await saveTrainingSession(formValues, isDraft);

      if (response.success) {
        setValues(formValues);
        showAlert('success', response.message);
        // @ts-ignore
        navigation.navigate('opportunities');
      }
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
