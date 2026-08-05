import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, Container, VStack, useAlert } from '@ui';
import styles from '../styles';
import SPTitleHeader from '@components/Header/SPTitleHeader';
import { useNavigation } from '@react-navigation/native';
import SchemaFormRenderer from '@components/SchemaFormRenderer';
import { ASSET_FORM_SCHEMA } from '@constants/ASSET_SCHEMA';
import { useLanguage } from '@contexts/LanguageContext';
import { useUserManagementFilters } from '@constants/USER_MANAGEMENT';
import { getSitesByProvince } from '../../../../services/usersService';
import { getProjectCategoryList } from '../../../../services/projectService';

const App = (): React.JSX.Element => {
  const navigation = useNavigation();
  const { t } = useLanguage();
  const { showAlert } = useAlert();
  
  const { provinces: dynamicProvinces } = useUserManagementFilters({});
  const [dynamicSites, setDynamicSites] = useState<any[]>([]);
  const [livelihoodCats, setLivelihoodCats] = useState<any[]>([]);
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
      .then(res => setDynamicSites(res.result?.data || []))
      .catch(() => setDynamicSites([]));
  }, [values.province]);

  useEffect(() => {
    getProjectCategoryList()
      .then((res: any[]) => {
        // Collect all child categories under root IDP templates
        const allChildren = res?.flatMap((root: any) => root.children || []) || [];
        if (allChildren.length > 0) {
          setLivelihoodCats(
            allChildren.map((c: any) => ({
              value: c.name || c.label || c._id,
              label: c.name || c.label,
            })),
          );
        }
      })
      .catch(err => {
        console.warn('Failed to fetch livelihood categories, using fallback:', err);
      });
  }, []);

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

    const livelihoodOpts =
      livelihoodCats.length > 0
        ? livelihoodCats
        : [
            {
              value: 'Agriculture & Farming',
              label:'supportProvider.assetForm.livelihoodCategories.agriculture',
            },
            {
              value: 'Livestock & Poultry',
              label:'supportProvider.assetForm.livelihoodCategories.livestock',
            },
            {
              value: 'Small Business & Retail',
              label:'supportProvider.assetForm.livelihoodCategories.smallBusiness',
            },
            {
              value: 'Vocational & Skills Trades',
              label:'supportProvider.assetForm.livelihoodCategories.vocational',
            },
            {
              value: 'Fisheries & Aquaculture',
              label:'supportProvider.assetForm.livelihoodCategories.fisheries',
            },
            {
              value: 'Services & Micro-enterprise',
              label:'supportProvider.assetForm.livelihoodCategories.services',
            },
            {
              value: 'Other',
              label:'supportProvider.assetForm.livelihoodCategories.other',
            },
          ];

    return {
      provinces: provinceOpts,
      sites: siteOpts,
      assetTypes: [
        {
          value: 'Cash',
          label: 'supportProvider.assetForm.assetTypes.cash',
        },
        {
          value: 'In-kind',
          label: 'supportProvider.assetForm.assetTypes.inKind',
        },
        {
          value: 'Voucher',
          label: 'supportProvider.assetForm.assetTypes.voucher',
        },
      ],
      livelihoodCategories: livelihoodOpts,
    };
  }, [dynamicProvinces, dynamicSites, livelihoodCats, t]);

  const handleSaveDraft = useCallback(async (formValues: any) => {
    try {
      console.log('Saving draft with payload:', formValues);
      showAlert(
        'success',
        'supportProvider.assetForm.draftSuccessMessage',
      );
      navigation.goBack();
    } catch (err: any) {
      showAlert('error', err?.message || 'common.somethingWentWrong');
    }
  }, [navigation, showAlert, t]);

  return (
    <VStack flex={1}>
      <SPTitleHeader
        title={t('supportProvider.createSupport.asset.title', 'Create Asset')}
        backButtonText={t('supportProvider.createSupport.changeType', 'Change type')}
        onNavigateBack={() => navigation.goBack()}
      />
      <Container {...styles.container}>
        <Card borderRadius={"$2xl"} bg="$white">
          <SchemaFormRenderer
            schema={ASSET_FORM_SCHEMA}
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
