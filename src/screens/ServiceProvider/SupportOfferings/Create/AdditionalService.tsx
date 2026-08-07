import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, Container, VStack, useAlert } from '@ui';
import styles from '../styles';
import SPTitleHeader from '@components/Header/SPTitleHeader';
import { useNavigation } from '@react-navigation/native';
import SchemaFormRenderer from '@components/SchemaFormRenderer';
import { ADDITIONAL_SERVICES_FORM_SCHEMA,tabs } from '@constants/ADDITIONAL_SERVICES_SCHEMA';
import { useLanguage } from '@contexts/LanguageContext';
import { getProvincesList, getSitesByProvince } from '../../../../services/usersService';

const App = (): React.JSX.Element => {
  const navigation = useNavigation();
  const { t } = useLanguage();
  const { showAlert } = useAlert();

  const [provinces, setProvinces] = useState<any[]>([]);
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
    const init = async () => {
      const result = await getProvincesList();
      setProvinces(result);
    }
    init();
  },[])

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
      provinces && provinces.length > 0
        ? provinces.map((p: any) => ({
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
          label:'Special Attention',
        },
        {
          value: 'Immediate Attention',
          label:'Immediate Attention',
        },
        {
          value: 'Other',
          label:'Other',
        },
      ],
      tags: tabs.filter(item => (!values.servicesCategory) || values.servicesCategory === item.parent)
    };
  }, [provinces, dynamicSites, values.servicesCategory]);

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
        title={t('supportProvider.createSupport.additionalService.title', 'Create Additional Service')}
        backButtonText={t('supportProvider.createSupport.changeType', 'Change type')}
        onNavigateBack={handleBackPress}
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
