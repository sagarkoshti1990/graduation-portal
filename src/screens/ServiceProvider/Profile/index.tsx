import React, { useEffect, useState, useCallback } from 'react';
import { ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  VStack,
  HStack,
  Button,
  ButtonText,
  ButtonIcon,
  Container,
  Text,
  Spinner,
  useAlert,
  Box,
} from '@ui';
import { LucideIcon } from '@ui/index';
import SPTitleHeader from '@components/Header/SPTitleHeader';
import SchemaFormRenderer, { validateSchema } from '@components/SchemaFormRenderer';
import { useAuth } from '@contexts/AuthContext';
import { getEntityDetails, updateEntityDetails } from '../../../services/participantService';
import { uploadFiles } from '../../../project-player/services/projectPlayerService';
import { BASIC_INFO_SCHEMA } from './constants/profileSchema/BASIC_INFO_SCHEMA';
import { CONTACT_PERSON_SCHEMA } from './constants/profileSchema/CONTACT_PERSON_SCHEMA';
import { DOCUMENTS_SCHEMA } from './constants/profileSchema/DOCUMENTS_SCHEMA';
import ProvinceCoverage, { CoverageItem } from './components/ProvinceCoverage';
import SupportCategories, { SupportCategoryItem } from './components/SupportCategories';
import styles from './styles';

const DEFAULT_CATEGORIES = [
  {
    id: 'Training / Sessions-1',
    categoryName: 'Training / Sessions',
    trainingData: {
      socialEmpowerment: ['Personal Mastery Training', 'Parenting Skills Training'],
      financialInclusion: ['Financial Literacy Training'],
      livelihoods: ['Job Readiness Training', 'Technical/Vocational Training'],
    },
  },
];

const OrganizationProfile = (): React.JSX.Element => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showAlert } = useAlert();

  const [mode, setMode] = useState<'preview' | 'edit'>('preview');
  const [values, setValues] = useState<any>({});
  const [originalValues, setOriginalValues] = useState<any>({});
  const [errors, setErrors] = useState<any>({});
  
  const [provinceCoverage, setProvinceCoverage] = useState<CoverageItem[]>([]);
  const [originalProvinceCoverage, setOriginalProvinceCoverage] = useState<CoverageItem[]>([]);
  
  const [supportCategories, setSupportCategories] = useState<SupportCategoryItem[]>([]);
  const [originalSupportCategories, setOriginalSupportCategories] = useState<SupportCategoryItem[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Extract orgId from user context
  const orgId = user?.user_organizations?.[0]?.organization?.id || 
                user?.user_organizations?.[0]?.organization?._id ||
                user?.organizations?.[0]?.id || 
                user?.organizations?.[0]?._id;

  // Options map for select fields
  const optionsMap = {
    organizationTypes: [
      { value: 'NGO', label: 'NGO' },
      { value: 'Government agency', label: 'Government agency' },
      { value: 'Private company', label: 'Private company' },
      { value: 'Training provider', label: 'Training provider' },
      { value: 'Service provider', label: 'Service provider' },
      { value: 'Financial institution', label: 'Financial institution' },
      { value: 'Others', label: 'Others' },
    ],
  };

  // Fetch organization profile details on mount
  useEffect(() => {
    if (!orgId) {
      const emptyValues = {
        name: '',
        organizationType: [],
        contactPersonName: '',
        contactEmail: '',
        contactPhone: '',
        agreementMoU: null,
        organisationCredentials: null,
      };
      setValues(emptyValues);
      setOriginalValues(emptyValues);
      setProvinceCoverage([]);
      setOriginalProvinceCoverage([]);
      setSupportCategories(DEFAULT_CATEGORIES);
      setOriginalSupportCategories(DEFAULT_CATEGORIES);
      setLoading(false);
      return;
    }

    setLoading(true);
    getEntityDetails(orgId)
      .then((res: any) => {
        const profileData = res?.data || {};
        const mapped = {
          name: profileData?.name || '',
          organizationType: profileData?.organizationType || profileData?.meta?.organizationType || [],
          contactPersonName: profileData?.contactPersonName || profileData?.meta?.contactPersonName || '',
          contactEmail: profileData?.contactEmail || profileData?.meta?.contactEmail || '',
          contactPhone: profileData?.contactPhone || profileData?.meta?.contactPhone || '',
          agreementMoU: profileData?.agreementMoU || profileData?.meta?.agreementMoU || null,
          organisationCredentials: profileData?.organisationCredentials || profileData?.meta?.organisationCredentials || null,
        };
        const cov = profileData?.provinceCoverage || profileData?.meta?.provinceCoverage || [];
        const cat = profileData?.supportCategories || profileData?.meta?.supportCategories || DEFAULT_CATEGORIES;

        setValues(mapped);
        setOriginalValues(mapped);
        setProvinceCoverage(cov);
        setOriginalProvinceCoverage(cov);
        setSupportCategories(cat);
        setOriginalSupportCategories(cat);
      })
      .catch((err: any) => {
        console.error('Error fetching org profile:', err);
        const emptyValues = {
          name: '',
          organizationType: [],
          contactPersonName: '',
          contactEmail: '',
          contactPhone: '',
          agreementMoU: null,
          organisationCredentials: null,
        };
        setValues(emptyValues);
        setOriginalValues(emptyValues);
        setProvinceCoverage([]);
        setOriginalProvinceCoverage([]);
        setSupportCategories(DEFAULT_CATEGORIES);
        setOriginalSupportCategories(DEFAULT_CATEGORIES);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [orgId]);

  const handleFieldChange = useCallback((name: string, value: any) => {
    setValues((prev: any) => ({ ...prev, [name]: value }));
    setErrors((prev: any) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  const handleCancel = () => {
    setValues(originalValues);
    setProvinceCoverage(originalProvinceCoverage);
    setSupportCategories(originalSupportCategories);
    setErrors({});
    setMode('preview');
  };

  const handleSave = async () => {
    // Validate the three schemas
    const basicErrors = validateSchema(BASIC_INFO_SCHEMA, values, optionsMap);
    const contactErrors = validateSchema(CONTACT_PERSON_SCHEMA, values, optionsMap);
    const docErrors = validateSchema(DOCUMENTS_SCHEMA, values, optionsMap);
    
    const allErrors = { ...basicErrors, ...contactErrors, ...docErrors };
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      showAlert('error', t('profile.pleaseFixErrors', 'Please correct the highlighted fields before saving.'));
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...values,
        provinceCoverage,
        supportCategories,
      };

      await updateEntityDetails({
        userId: user?.id || '',
        entityId: orgId || user?.id || '',
        entityUpdates: payload,
      });

      setOriginalValues(values);
      setOriginalProvinceCoverage(provinceCoverage);
      setOriginalSupportCategories(supportCategories);
      setMode('preview');
      showAlert('success', t('profile.saveSuccess', 'Profile updated successfully.'));
    } catch (err) {
      console.error('Failed to update organization profile:', err);
      showAlert('error', t('profile.saveError', 'Failed to update profile.'));
    } finally {
      setSaving(false);
    }
  };

  // Upload service implementation for documents
  const handleUpload = async (file: any): Promise<string> => {
    const entityId = `orgDoc-${Date.now()}`;
    const uploaded = await uploadFiles(entityId, [
      { ...file, size: file.size ?? 0 },
    ]);
    const url = uploaded?.data?.[0]?.url;
    if (!url) {
      throw new Error(`Failed to upload file: ${file.name}`);
    }
    return url;
  };

  if (loading) {
    return (
      <VStack flex={1} justifyContent="center" alignItems="center" bg="$background50">
        <Spinner size="large" />
      </VStack>
    );
  }

  const isEdit = mode === 'edit';

  return (
    <VStack flex={1}>
      <SPTitleHeader
        title={t('profile.title', 'Organisation Profile')}
        subTitle={t('profile.subTitle', "Manage your organisation's information and support coverage")}
        rightSection={
          !isEdit ? (
            <Button
              onPress={() => setMode('edit')}
              style={{
                borderRadius: 6,
                height: 40,
                paddingHorizontal: 16,
              }}
            >
              <ButtonIcon as={LucideIcon} name={'SquarePen'} mr="$2" />
              <ButtonText>{t('profile.editProfile', 'Edit Profile')}</ButtonText>
            </Button>
          ) : (
            <HStack space="sm">
              <Button
                variant="outline"
                borderColor="$borderColor"
                onPress={handleCancel}
                isDisabled={saving}
                style={{
                  borderRadius: 10,
                  height: 40,
                  paddingHorizontal: 16,
                  backgroundColor: 'transparent',
                }}
              >
                <ButtonIcon as={LucideIcon} name="X" color="#6b7280" mr="$2" />
                <ButtonText color="#4b5563" fontWeight="600">
                  {t('common.cancel', 'Cancel')}
                </ButtonText>
              </Button>
              <Button
                variant="solid"
                bg="$success600"
                borderColor="$success600"
                onPress={handleSave}
                isDisabled={saving}
                style={{
                  borderRadius: 10,
                  height: 40,
                  paddingHorizontal: 16,
                }}
              >
                {saving ? (
                  <Spinner size="small" color="$white" mr="$2" />
                ) : (
                  <ButtonIcon as={LucideIcon} name="Save" color="$white" mr="$2" />
                )}
                <ButtonText color="$white" fontWeight="600">
                  {t('common.saveChanges', 'Save Changes')}
                </ButtonText>
              </Button>
            </HStack>
          )
        }
      />

      <Container {...styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Card 1: Basic Information */}
          <VStack {...styles.sectionCard}>
            <HStack {...styles.sectionHeader}>
              <Box {...styles.sectionIconContainer}>
                <LucideIcon name="Building" size={20} color="$primary500" />
              </Box>
              <VStack>
                <Text {...styles.sectionTitle}>{t('profile.basicInfo', 'Basic Information')}</Text>
                <Text {...styles.sectionSubtitle}>
                  {t('profile.basicInfoSubtitle', 'General organisation profile details')}
                </Text>
              </VStack>
            </HStack>

            <SchemaFormRenderer
              schema={BASIC_INFO_SCHEMA}
              values={values}
              errors={errors}
              onFieldChange={handleFieldChange}
              optionsMap={optionsMap}
              disabled={saving}
              mode={mode}
              t={t as any}
            />
          </VStack>

          {/* Card 2: Contact Person */}
          <VStack {...styles.sectionCard}>
            <HStack {...styles.sectionHeader}>
              <Box {...styles.sectionIconContainer}>
                <LucideIcon name="User" size={20} color="$primary500" />
              </Box>
              <VStack>
                <Text {...styles.sectionTitle}>{t('profile.contactPerson', 'Contact Person')}</Text>
                <Text {...styles.sectionSubtitle}>
                  {t('profile.contactPersonSubtitle', 'Focal person for this organisation')}
                </Text>
              </VStack>
            </HStack>

            <SchemaFormRenderer
              schema={CONTACT_PERSON_SCHEMA}
              values={values}
              errors={errors}
              onFieldChange={handleFieldChange}
              optionsMap={optionsMap}
              disabled={saving}
              mode={mode}
              t={t as any}
            />
          </VStack>

          {/* Card 3: Coverage */}
          <VStack {...styles.sectionCard}>
            <HStack {...styles.sectionHeader}>
              <Box {...styles.sectionIconContainer}>
                <LucideIcon name="MapPin" size={20} color="$primary500" />
              </Box>
              <VStack>
                <HStack alignItems="center">
                  <Text {...styles.sectionTitle}>{t('profile.coverage', 'Coverage')}</Text>
                  <Text color="$red500" fontSize={16} fontWeight="700"> *</Text>
                </HStack>
                <Text {...styles.sectionSubtitle}>
                  {t('profile.coverageSubtitle', 'Select province and multi-select sites, then click + Add Province')}
                </Text>
              </VStack>
            </HStack>

            <ProvinceCoverage
              value={provinceCoverage}
              onChange={setProvinceCoverage}
              mode={mode}
              t={t}
            />
          </VStack>

          {/* Card 4: Support Categories Offered */}
          <VStack {...styles.sectionCard}>
            <HStack {...styles.sectionHeader}>
              <Box {...styles.sectionIconContainer}>
                <LucideIcon name="Layers" size={20} color="$primary500" />
              </Box>
              <VStack>
                <HStack alignItems="center">
                  <Text {...styles.sectionTitle}>{t('profile.supportCategoriesOffered', 'Support Categories Offered')}</Text>
                  <Text color="$red500" fontSize={16} fontWeight="700"> *</Text>
                </HStack>
                <Text {...styles.sectionSubtitle}>
                  {t('profile.supportCategoriesSubtitle', 'Choose categories and sub-options, then click + Add Category')}
                </Text>
              </VStack>
            </HStack>

            <SupportCategories
              value={supportCategories}
              onChange={setSupportCategories}
              mode={mode}
              t={t}
            />
          </VStack>

          {/* Card 5: Documents */}
          <VStack {...styles.sectionCard}>
            <HStack {...styles.sectionHeader}>
              <Box {...styles.sectionIconContainer}>
                <LucideIcon name="FileText" size={20} color="$primary500" />
              </Box>
              <VStack>
                <Text {...styles.sectionTitle}>{t('profile.documents', 'Documents')}</Text>
                <Text {...styles.sectionSubtitle}>
                  {t('profile.documentsSubtitle', 'Upload organisation registration and certificates')}
                </Text>
              </VStack>
            </HStack>

            <SchemaFormRenderer
              schema={DOCUMENTS_SCHEMA}
              values={values}
              errors={errors}
              onFieldChange={handleFieldChange}
              optionsMap={optionsMap}
              disabled={saving}
              uploadService={handleUpload}
              mode={mode}
              t={t as any}
            />
          </VStack>
        </ScrollView>
      </Container>
    </VStack>
  );
};

export default OrganizationProfile;
