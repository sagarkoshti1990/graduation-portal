import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, Container, VStack, useAlert } from '@ui';
import styles from '../styles';
import SPTitleHeader from '@components/Header/SPTitleHeader';
import { useNavigation } from '@react-navigation/native';
import SchemaFormRenderer from '@components/SchemaFormRenderer';
import { ADDITIONAL_SERVICES_FORM_SCHEMA } from '@constants/ADDITIONAL_SERVICES_SCHEMA';
import { useLanguage } from '@contexts/LanguageContext';
import { useUserManagementFilters } from '@constants/USER_MANAGEMENT';
import { getSitesByProvince } from '../../../../services/usersService';

const App = (): React.JSX.Element => {
  const navigation = useNavigation();
  const { t } = useLanguage();
  const { showAlert } = useAlert();

  const { provinces: dynamicProvinces } = useUserManagementFilters({});
  const [dynamicSites, setDynamicSites] = useState<any[]>([]);
  const [values, setValues] = useState<any>({});

  const handleFieldChange = useCallback((name: string, value: string) => {
    setValues((prev: any) => {
      const next = { ...prev, [name]: value };
      if (name === 'province') next.site = '';
      return next;
    });
  }, []);

  useEffect(() => {
    if (!values.province) {
      setDynamicSites([]);
      return;
    }
    getSitesByProvince({ provinceId: values.province, page: 1, limit: 100 })
      .then((res) => setDynamicSites(res.result?.data || []))
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

    return {
      provinces: provinceOpts,
      sites: siteOpts,
      servicesCategories: [
        {
          value: 'Special Attention',
          label:'supportProvider.additionalServicesForm.categories.specialAttention',
        },
        {
          value: 'Immediate Attention',
          label:'supportProvider.additionalServicesForm.categories.immediateAttention',
        },
        {
          value: 'Other',
          label:'supportProvider.additionalServicesForm.categories.other',
        },
      ],
    };
  }, [dynamicProvinces, dynamicSites, t]);

  const handleSaveDraft = useCallback(async (formValues: any) => {
    try {
      console.log('Saving draft with payload:', formValues);
      showAlert(
        'success',
        'supportProvider.additionalServicesForm.draftSuccessMessage',
      );
      navigation.goBack();
    } catch (err: any) {
      showAlert('error', err?.message || 'common.somethingWentWrong');
    }
  }, [navigation, showAlert]);

  return (
    <VStack flex={1}>
      <SPTitleHeader
        title={t('supportProvider.createSupport.additionalService.title', 'Create Additional Service')}
        backButtonText={t('supportProvider.createSupport.changeType', 'Change type')}
        onNavigateBack={() => navigation.goBack()}
      />
      <Container {...styles.container}>
        <Card borderRadius={"$2xl"} bg="$white">
          <SchemaFormRenderer
            schema={ADDITIONAL_SERVICES_FORM_SCHEMA}
            optionsMap={optionsMap}
            values={values}
            t={t}
            onFieldChange={handleFieldChange}
            onSaveDraft={handleSaveDraft}
          />
        </Card>
      </Container>
    </VStack>
  );
};

export default App;
