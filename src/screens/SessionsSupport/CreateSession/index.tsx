import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Card, Container, HStack, Loader, Text, VStack, useAlert } from '@ui';
import PageHeader from '@components/PageHeader';
import { useNavigation } from '@react-navigation/native';
import SchemaFormRenderer from '@components/SchemaFormRenderer';
import { TRAINING_FORM_SCHEMA, CREATE_SESSION_HIDE_FIELDS } from '@constants/TRAINING_FORM_SCHEMA';
import { useLanguage } from '@contexts/LanguageContext';
import { getSitesByProvince, getProvincesList } from '../../../services/usersService';
import { uploadFiles } from '../../../project-player/services/projectPlayerService';
import {
  getSessionCategories,
  getRecommendedFor,
  getSessionTypesByPillar,
  getDeliveryModes,
  createSession,
  MentoringOption,
} from '../../../services/mentoringService';
import { valueMapping } from '@utils/supportProvider';

const DELIVERY_MODE_ICONS: Record<string, string> = {
  offline: 'MapPin',
  online: 'Video',
  hybrid: 'Users',
};

const CreateSessionScreen = (): React.JSX.Element => {
  const navigation = useNavigation();
  const { t } = useLanguage();
  const [provinces, setProvinces] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [pillers, setPillers] = useState<MentoringOption[]>([]);
  const [sessionTypes, setSessionTypes] = useState<MentoringOption[]>([]);
  const [targetAudience, setTargetAudience] = useState<MentoringOption[]>([]);
  const [deliveryModes, setDeliveryModes] = useState<MentoringOption[]>([]);
  const [values, setValues] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const { showAlert } = useAlert();

  useEffect(() => {
    const init = async () => {
      try {
        const results = await Promise.allSettled([
          getProvincesList(),
          getSessionCategories(),
          getRecommendedFor(),
          getDeliveryModes(),
        ]);

        const [resProvinces, resCategories, resTarget, resDeliveryModes] = results;

        setProvinces(resProvinces.status === 'fulfilled' ? resProvinces.value || [] : []);
        setPillers(resCategories.status === 'fulfilled' ? resCategories.value || [] : []);
        setTargetAudience(resTarget.status === 'fulfilled' ? resTarget.value || [] : []);
        setDeliveryModes(resDeliveryModes.status === 'fulfilled' ? resDeliveryModes.value || [] : []);
      } catch (error: any) {
        console.error('Error loading form data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

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
      Array.isArray(provinces) && provinces.length > 0
        ? provinces.map((p: any) => ({
          value: p._id || p.id || p.name,
          label: p.name || p.label,
        }))
        : [];

    const siteOpts =
      Array.isArray(sites) && sites.length > 0
        ? sites.map((s: any) => ({
          value: s._id || s.id || s.name,
          label: s.name || s.label,
        }))
        : [];

    return {
      provinces: provinceOpts,
      sites: siteOpts,
      pillars: Array.isArray(pillers) ? pillers : [],
      sessionTypes: Array.isArray(sessionTypes) ? sessionTypes : [],
      targetAudienceOptions: Array.isArray(targetAudience) ? targetAudience : [],
      certificateOptions: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' },
      ],
      recurringOptions: [
        { value: 'true', label: 'Yes — recurring session' },
        { value: 'false', label: 'No — one-off session' },
      ],
      formatOptions: (Array.isArray(deliveryModes) ? deliveryModes : []).map((mode) => ({
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

      await createSession(payload);

      const successMsg = isDraft
        ? t('supportProvider.createSupport.training.alerts.draftSaved', 'Draft saved successfully!')
        : t('supportProvider.createSupport.training.alerts.sessionSaved', 'Training session saved successfully!');

      showAlert('success', successMsg);
      navigation.navigate('sessions-support' as never);
    } catch (error: any) {
      console.error('Error saving training session:', error);
      const errMsg =
        error?.data?.message ||
        error?.message ||
        t('supportProvider.createSupport.training.errors.saveFailed', 'Something went wrong while saving. Please try again.');
      showAlert('error', errMsg);
    }
  };

  const handleBackPress = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('sessions-support' as never);
    }
  };

  if (isLoading) {
    return <Loader fullScreen message="Loading..." />;
  }

  const headerTitle = (
    <HStack alignItems="center" space="sm">
      <Text fontSize="$xl" fontWeight="600" color="$textForeground">
        {t('lc.createSession.title', { defaultValue: 'Create a Session' })}
      </Text>
      <Box bg="#FEE2E2" px="$2.5" py="$0.5" borderRadius="$full">
        <Text fontSize="$xs" fontWeight="500" color="#8B2842">
          {t('lc.createSession.badge', { defaultValue: 'Training Session' })}
        </Text>
      </Box>
    </HStack>
  );

  return (
    <VStack flex={1}>
      <PageHeader
        title={headerTitle}
        backButtonText={t('supportProvider.createSupport.changeType', 'Change Type')}
        onBackPress={handleBackPress}
      />
      <Container py="$6">
        <Card borderRadius="$2xl" bg="$white">
          <SchemaFormRenderer
            schema={TRAINING_FORM_SCHEMA(CREATE_SESSION_HIDE_FIELDS)}
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
              ] as any);
              const url = uploaded?.data?.[0]?.url;
              if (!url) {
                throw new Error(`Failed to upload file: ${file.name}`);
              }
              const data = uploaded?.data?.[0];
              const [f, s] = data?.type.split('/');
              return {
                name: data?.name,
                link: data?.url,
                sourcePath: data?.sourcePath,
                type: s || f,
                size: data?.size,
              };
            }}
          />
        </Card>
      </Container>
    </VStack>
  );
};

export default CreateSessionScreen;
