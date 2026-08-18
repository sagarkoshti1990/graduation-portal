import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, Container, VStack, useAlert } from '@ui';
import styles from '../styles';
import SPTitleHeader from '@components/Header/SPTitleHeader';
import { useNavigation } from '@react-navigation/native';
import SchemaFormRenderer from '@components/SchemaFormRenderer';
import { ASSET_FORM_SCHEMA } from '@constants/ASSET_SCHEMA';
import { useLanguage } from '@contexts/LanguageContext';
import { getSitesByProvince, getProvincesList } from '../../../../services/usersService';
import { getProjectCategoryList } from '../../../../services/projectService';
import { useProfileCompletion } from '@hooks';
import NotFound from '@components/NotFound';

const App = (): React.JSX.Element => {
  const navigation = useNavigation();
  const { t } = useLanguage();
  const { showAlert } = useAlert();
  const { isProfileComplete } = useProfileCompletion();
  
  const [provinces, setProvinces] = useState<any[]>([]);
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

    const livelihoodOpts =
      livelihoodCats.length > 0
        ? livelihoodCats
        : [
            {
              value: 'Agriculture & Farming',
              label:'Agriculture & Farming',
            },
            {
              value: 'Livestock & Poultry',
              label:'Livestock & Poultry',
            },
            {
              value: 'Small Business & Retail',
              label:'Small Business & Retail',
            },
            {
              value: 'Vocational & Skills Trades',
              label:'Vocational & Skills Trades',
            },
            {
              value: 'Fisheries & Aquaculture',
              label:'Fisheries & Aquaculture',
            },
            {
              value: 'Services & Micro-enterprise',
              label:'Services & Micro-enterprise',
            },
            {
              value: 'Other',
              label:'Other',
            },
          ];

    return {
      provinces: provinceOpts,
      sites: siteOpts,
      assetTypes: [
        {
          value: 'Cash',
          label: 'Cash',
        },
        {
          value: 'In-kind',
          label: 'In-kind',
        },
        {
          value: 'Voucher',
          label: 'Voucher',
        },
      ],
      livelihoodCategories: livelihoodOpts,
    };
  }, [provinces, dynamicSites, livelihoodCats, t]);

  const handleSaveDraft = useCallback(async (formValues: any) => {
    try {
      showAlert(
        'success',
        'supportProvider.assetForm.draftSuccessMessage',
      );
      navigation.goBack();
    } catch (err: any) {
      showAlert('error', err?.message || 'common.somethingWentWrong');
    }
  }, [navigation, showAlert, t]);

  const handleBackPress = () => {
    if (navigation.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // @ts-ignore
      navigation.navigate('create-opportunity');
    }
  }

  if (isProfileComplete === false) {
    return (
      <NotFound
        message={t(
          'supportProvider.createSupport.errors.incompleteWarning',
          'Please Complete your Profile before proceeding.'
        )}
      />
    );
  }

  return (
    <VStack flex={1}>
      <SPTitleHeader
        title={t('supportProvider.createSupport.asset.title', 'Create Asset')}
        backButtonText={t('supportProvider.createSupport.changeType', 'Change type')}
        onNavigateBack={handleBackPress}
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
