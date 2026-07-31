import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, Container, VStack } from '@ui';
import styles from '../styles';
import SPTitleHeader from '@components/Header/SPTitleHeader';
import { useNavigation } from '@react-navigation/native';
import SchemaFormRenderer from '@components/SchemaFormRenderer';
import { TRAINING_FORM_SCHEMA } from '@constants/TRAINING_FORM_SCHEMA';
import { useLanguage } from '@contexts/LanguageContext';
import { useUserManagementFilters } from '@constants/USER_MANAGEMENT';
import { getSitesByProvince } from '../../../../services/usersService';


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
  const { t } = useLanguage();
  const { provinces: dynamicProvinces } = useUserManagementFilters({});
  const [dynamicSites, setDynamicSites] = useState<any[]>([]);
  const [values, setValues] = useState<any>({});

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
    const sessionTypeOpts =
      selectedPillar && selectedPillar !== 'Others'
        ? (PILLAR_SESSION_TYPES[selectedPillar] || []).map(v => ({
            value: v,
            label: v,
          }))
        : [];

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
        {
          value: 'Others',
          label: 'Others',
        },
      ],
      sessionTypes: sessionTypeOpts,
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

  return (
    <VStack flex={1}>
      <SPTitleHeader
        title={t('supportProvider.createSupport.training.title', 'Create Training Session')}
        backButtonText={t('supportProvider.createSupport.changeType', 'Change type')}
        onNavigateBack={() => navigation.goBack()}
      />
      <Container {...styles.container}>
        <Card borderRadius={"$2xl"} bg="$white">
          <SchemaFormRenderer
            schema={TRAINING_FORM_SCHEMA}
            optionsMap={optionsMap}
            values={values}
            t={t}
            onFieldChange={handleFieldChange}
          />
        </Card>
      </Container>
    </VStack>
  );
};

export default App;
