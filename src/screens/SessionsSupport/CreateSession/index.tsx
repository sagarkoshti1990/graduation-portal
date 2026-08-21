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
import { CERTIFICATE_OPTIONS, RECURRING_OPTIONS } from '@constants/SUPPORT_PROVIDER_CARDS';

const DELIVERY_MODE_ICONS: Record<string, string> = {
  offline: 'MapPin',
  online: 'Video',
  hybrid: 'Users',
};

import { useTrainingFormOptions } from '@hooks';
import styles from '../styles';

const CreateSessionScreen = (): React.JSX.Element => {
  const navigation = useNavigation();
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

  const handleSave = async (formValues: any, isDraft: boolean) => {
    try {
      setValues(formValues);
      const payload: any = valueMapping({ ...formValues, isDraft }, false, optionsMap);

      const result = await createSession(payload);

      const successMsg = isDraft
        ? t('supportProvider.createSupport.training.alerts.draftSaved', 'Draft saved successfully!')
        : t('supportProvider.createSupport.training.alerts.sessionSaved', 'Training session saved successfully!');

      showAlert('success', successMsg);

      // Build a session object from the form values to immediately show in My Sessions
      const newSession = {
        id: result?.data?._id || result?.data?.id || result?._id || result?.id || `local-${Date.now()}`,
        title: formValues.title || formValues.idp_training_task_label || '',
        status: isDraft ? 'DRAFT' : 'UPCOMING',
        start_date: formValues.start_date,
        end_date: formValues.end_date,
        seats_limit: formValues.max_participants || formValues.seats_limit,
        seats_remaining: formValues.max_participants || formValues.seats_limit,
        delivery_mode: formValues.delivery_mode,
        ...formValues,
      };

      // Navigate back and pass the new session as a param
      (navigation as any).navigate('sessions-support', { newSession });
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
    <HStack {...styles.headerTitleHStack}>
      <Text {...styles.headerSubTitleText}>
        {t('lc.createSession.title')}
      </Text>
      <Box {...styles.headerBadgeBox}>
        <Text {...styles.headerBadgeText}>
          {t('lc.createSession.badge')}
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
