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
import { styles as umStyles } from '../../../../screens/UserManagement/Styles';
import { assetStyles } from './assetStyles';

const App = (): React.JSX.Element => {
  const navigation = useNavigation();
  const { t } = useLanguage();
  const { showAlert } = useAlert();
  
  const { provinces: dynamicProvinces } = useUserManagementFilters({});
  const [dynamicSites, setDynamicSites] = useState<any[]>([]);
  const [livelihoodCats, setLivelihoodCats] = useState<any[]>([]);
  const [values, setValues] = useState<any>({});

  // Dynamically swap User Management styles with Asset specific styles
  useEffect(() => {
    const originalInput = (umStyles as any).createUserFormInput;
    const originalSelect = (umStyles as any).createUserFormSelect;

    (umStyles as any).createUserFormInput = assetStyles.input;
    (umStyles as any).createUserFormSelect = assetStyles.select;

    return () => {
      (umStyles as any).createUserFormInput = originalInput;
      (umStyles as any).createUserFormSelect = originalSelect;
    };
  }, []);

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
              label:
                t(
                  'supportProvider.assetForm.livelihoodCategories.agriculture',
                  'Agriculture & Farming',
                ),
            },
            {
              value: 'Livestock & Poultry',
              label:
                t(
                  'supportProvider.assetForm.livelihoodCategories.livestock',
                  'Livestock & Poultry',
                ),
            },
            {
              value: 'Small Business & Retail',
              label:
                t(
                  'supportProvider.assetForm.livelihoodCategories.smallBusiness',
                  'Small Business & Retail',
                ),
            },
            {
              value: 'Vocational & Skills Trades',
              label:
                t(
                  'supportProvider.assetForm.livelihoodCategories.vocational',
                  'Vocational & Skills Trades',
                ),
            },
            {
              value: 'Fisheries & Aquaculture',
              label:
                t(
                  'supportProvider.assetForm.livelihoodCategories.fisheries',
                  'Fisheries & Aquaculture',
                ),
            },
            {
              value: 'Services & Micro-enterprise',
              label:
                t(
                  'supportProvider.assetForm.livelihoodCategories.services',
                  'Services & Micro-enterprise',
                ),
            },
            {
              value: 'Other',
              label:
                t(
                  'supportProvider.assetForm.livelihoodCategories.other',
                  'Other',
                ),
            },
          ];

    return {
      provinces: provinceOpts,
      sites: siteOpts,
      assetTypes: [
        {
          value: 'Cash',
          label: t('supportProvider.assetForm.assetTypes.cash', 'Cash'),
        },
        {
          value: 'In-kind',
          label: t('supportProvider.assetForm.assetTypes.inKind', 'In-kind'),
        },
        {
          value: 'Voucher',
          label: t('supportProvider.assetForm.assetTypes.voucher', 'Voucher'),
        },
      ],
      livelihoodCategories: livelihoodOpts,
    };
  }, [dynamicProvinces, dynamicSites, livelihoodCats, t]);

  const handleSubmit = useCallback(async (formValues: any) => {
    try {
      console.log('Creating asset with payload:', formValues);
      showAlert(
        'success',
        t(
          'supportProvider.assetForm.successMessage',
          'Asset created successfully!',
        ),
      );
      navigation.goBack();
    } catch (err: any) {
      showAlert('error', err?.message || t('common.somethingWentWrong'));
    }
  }, [navigation, showAlert, t]);

  const handleSaveDraft = useCallback(async (formValues: any) => {
    try {
      console.log('Saving draft with payload:', formValues);
      showAlert(
        'success',
        t(
          'supportProvider.assetForm.draftSuccessMessage',
          'Draft saved successfully!',
        ),
      );
      navigation.goBack();
    } catch (err: any) {
      showAlert('error', err?.message || t('common.somethingWentWrong'));
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
            onSubmit={handleSubmit}
            onSaveDraft={handleSaveDraft}
          />
        </Card>
      </Container>
    </VStack>
  );
};

export default App;
