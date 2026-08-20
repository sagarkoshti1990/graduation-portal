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
import SchemaFormRenderer, { validateSchema, resolveFileUploads, FileUploadError, } from '@components/SchemaFormRenderer';
import { useAuth } from '@contexts/AuthContext';
import { getUserProfile } from '../../../services/authenticationService';
import {
  updateUser,
  getProvincesList,
  getSitesByProvince,
} from '../../../services/usersService';
import { getProviderTypeOptions } from '../../../services/mentoringService';
import { MENTORING_ENTITY_TYPES } from '@constants/SP_MENU_OPTIONS';
import { SUPPORT_CATEGORIES } from '@constants/SUPPORT_PROVIDER_CARDS';
import { uploadFiles } from '../../../project-player/services/projectPlayerService';
import { BASIC_INFO_SCHEMA } from './constants/profileSchema/BASIC_INFO_SCHEMA';
import { CONTACT_PERSON_SCHEMA } from './constants/profileSchema/CONTACT_PERSON_SCHEMA';
import { DOCUMENTS_SCHEMA } from './constants/profileSchema/DOCUMENTS_SCHEMA';
import ProvinceCoverage, { CoverageItem } from './components/ProvinceCoverage';
import SupportCategories, { SupportCategoryItem } from './components/SupportCategories';
import styles from './styles';

const DEFAULT_CATEGORIES: SupportCategoryItem[] = [];

// Main screen component for viewing and managing the organization profile.
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
  
  const [saving, setSaving] = useState(false);

  // Options map state for select fields
  const [providerTypeOptions, setProviderTypeOptions] = useState<{ value: string; label: string }[]>([]);

  const optionsMap = {
    organizationTypes: providerTypeOptions,
  };

  // Fetches dynamic options & logged-in user's organization profile on mount.
  useEffect(() => {
    const loadProfileData = async () => {
      // Fetch dynamic provider_type options from mentoring API
      try {
        const res: any = await getProviderTypeOptions();
        if (res && res.length > 0) {
          const formatted = res.map((item: any) => ({
            value: item.value,
            label: item.label
          }));
          setProviderTypeOptions(formatted);
        }
      } catch (err) {
        console.error('Error fetching provider_type options:', err);
      }

      if (!user?.id) return;

      try {
        const res = await getUserProfile(user.id);
        // Don't overwrite unsaved changes while editing
        if (mode === 'edit') {
          return;
        }

        const profileData = res || {};

        const getField = (key: string, fallback: any = '') => {
          const val =
            profileData[key] ??
            profileData?.meta?.[key] ??
            profileData?.extra?.[key] ??
            profileData?.userDetails?.[key] ??
            profileData?.userDetails?.meta?.[key] ??
            profileData?.userDetails?.extra?.[key] ??
            profileData?.custom_entity_text?.[key];

          if (val === undefined || val === null) {
            return fallback;
          }

          return val;
        };

        let orgType = getField('organizationType', []);

        if (typeof orgType === 'string') {
          try {
            orgType = JSON.parse(orgType);
          } catch {
            orgType = [orgType];
          }
        }

        if (!Array.isArray(orgType)) {
          orgType = [];
        }

        const mapped = {
          name: getField('about') || getField('name') || user?.name || '',
          organizationType: orgType,
          contactPersonName: getField('name') || user?.name || '',
          contactEmail: getField('email') || user?.email || '',
          contactPhone: getField('phone') || user?.phone || '',
          phone_code:
            getField('phone_code') ||
            getField('phoneCode') ||
            user?.phone_code ||
            '27',
          agreementMoU: getField('agreementMoU', null),
          organisationCredentials: getField(
            'organisationCredentials',
            null,
          ),
        };

        const rawProvinces = getField('provinces', []);
        const rawSites = getField('sites', []);
        const rawCov = getField('provinceCoverage', null);
        const rawCat = getField(
          'supportCategories',
          DEFAULT_CATEGORIES,
        );

        let cov: CoverageItem[] = [];

        if (Array.isArray(rawProvinces) && rawProvinces.length > 0) {
          const siteIds = Array.isArray(rawSites) ? rawSites : [];
          cov = rawProvinces.map((pId: string) => ({
            provinceId: String(pId),
            siteIds,
          }));
        } else if (rawCov) {
          if (typeof rawCov === 'object') {
            cov = rawCov;
          } else {
            try {
              cov = JSON.parse(rawCov);
            } catch {
              cov = [];
            }
          }
        }

        if (!Array.isArray(cov)) {
          cov = [];
        }

        let cat: any[] = [];

        if (rawCat && Array.isArray(rawCat) && rawCat.length > 0) {
          cat = rawCat;
        } else if (rawCat && typeof rawCat === 'string') {
          try {
            cat = JSON.parse(rawCat);
          } catch {
            cat = [];
          }
        }

        if (!Array.isArray(cat) || cat.length === 0) {
          const rawCategories = getField('categories', []);
          if (Array.isArray(rawCategories) && rawCategories.length > 0) {
            cat = rawCategories.map((cName: string) => {
              const item: any = {
                id: `${cName}-${Date.now()}`,
                categoryName: cName,
              };
              if (cName === SUPPORT_CATEGORIES.ASSET) {
                item.assetsData = { assetTypes: getField(MENTORING_ENTITY_TYPES.ASSET_TYPES, []) };
              } else if (cName === SUPPORT_CATEGORIES.ADDITIONAL_SERVICE) {
                item.linkageData = {
                  specialAttention: getField(MENTORING_ENTITY_TYPES.SPECIAL_ATTENTION, []),
                  immediateAttention: getField(MENTORING_ENTITY_TYPES.IMMEDIATE_ATTENTION, []),
                };
              } else if (cName === SUPPORT_CATEGORIES.TRAINING) {
                item.trainingData = {
                  livelihoods: getField(MENTORING_ENTITY_TYPES.LIVELIHOODS, []),
                  socialEmpowerment: getField(MENTORING_ENTITY_TYPES.SOCIAL_EMPOWERMENT, []),
                  financialInclusion: getField(MENTORING_ENTITY_TYPES.FINANCIAL_INCLUSION, []),
                };
              }
              return item;
            });
          } else {
            cat = [];
          }
        }

        setValues(mapped);
        setOriginalValues(mapped);
        setProvinceCoverage(cov);
        setOriginalProvinceCoverage(cov);
        setSupportCategories(cat);
        setOriginalSupportCategories(cat);
      } catch (err: any) {
        console.error('Error fetching org profile:', err);
      }
    };

    loadProfileData();
  }, [user?.id]);

  // Updates a form field value and clears its validation error.
  const handleFieldChange = useCallback((name: string, value: any) => {
    setValues((prev: any) => ({ ...prev, [name]: value }));
    setErrors((prev: any) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  // Cancels editing mode and restores the previous saved values.
  const handleCancel = () => {
    setValues(originalValues);
    setProvinceCoverage(originalProvinceCoverage);
    setSupportCategories(originalSupportCategories);
    setErrors({});
    setMode('preview');
  };

  // Validates forms, constructs payload, updates profile via API, and updates local original values on success.
const handleSave = async () => {
  // Validate the three schemas
  const basicErrors = validateSchema(BASIC_INFO_SCHEMA, values, optionsMap);
  const contactErrors = validateSchema(CONTACT_PERSON_SCHEMA, values, optionsMap);
  const docErrors = validateSchema(DOCUMENTS_SCHEMA, values, optionsMap);

  const allErrors = {
    ...basicErrors,
    ...contactErrors,
    ...docErrors,
  };

  if (provinceCoverage.length === 0) {
    allErrors.provinceCoverage = t(
      'errors.coverageRequired',
      'Add at least one province coverage entry.',
    );
  }

  if (supportCategories.length === 0) {
    allErrors.supportCategories = t(
      'errors.categoriesRequired',
      'Add at least one support category.',
    );
  }

  if (Object.keys(allErrors).length > 0) {
    setErrors(allErrors);
    showAlert(
      'error',
      t(
        'profile.pleaseFixErrors',
        'Please correct the highlighted fields before saving.',
      ),
    );
    return;
  }

setSaving(true);

try {
  const resolvedValues = await resolveFileUploads(
    DOCUMENTS_SCHEMA,
    values,
    handleUpload,
  );

  const provinces = Array.from(
    new Set(
      provinceCoverage
        .map(item => item.provinceId)
        .filter(Boolean),
    ),
  );

  const sites = Array.from(
    new Set(
      provinceCoverage
        .flatMap(item => item.siteIds || [])
        .filter(Boolean),
    ),
  );

  const categories = Array.from(
    new Set(
      supportCategories
        .map(item => item.categoryName)
        .filter(Boolean),
    ),
  );

  const livelihoods = Array.from(
    new Set(
      supportCategories
        .flatMap(item => item.trainingData?.livelihoods)
        .filter(Boolean),
    ),
  );

  const social_empowerment = Array.from(
    new Set(
      supportCategories
        .flatMap(item => item.trainingData?.socialEmpowerment)
        .filter(Boolean),
    ),
  );

  const financial_inclusion = Array.from(
    new Set(
      supportCategories
        .flatMap(item => item.trainingData?.financialInclusion)
        .filter(Boolean),
    ),
  );

  const special_attention = Array.from(
    new Set(
      supportCategories
        .flatMap(item => item.linkageData?.specialAttention)
        .filter(Boolean),
    ),
  );

  const immediate_attention = Array.from(
    new Set(
      supportCategories
        .flatMap(item => item.linkageData?.immediateAttention)
        .filter(Boolean),
    ),
  );

  const asset_types = Array.from(
    new Set(
      supportCategories
        .flatMap(item => item.assetsData?.assetTypes)
        .filter(Boolean),
    ),
  );

  const payload = {
    name: values.contactPersonName,
    about: values.name,
    email: values.contactEmail,
    phone: values.contactPhone,
    phone_code: values.phone_code? values.phone_code.toString().replace('+', ''): '27',
    meta: {
      provinces,
      sites,
      categories,
      livelihoods,
      social_empowerment,
      financial_inclusion,
      special_attention,
      immediate_attention,
      asset_types,
      organizationType: values.organizationType,
      agreementMoU: resolvedValues.agreementMoU,
      organisationCredentials: resolvedValues.organisationCredentials,
    },
  };

  await updateUser(user?.id || '', payload);

    showAlert('success',t('profile.saveSuccess', 'Profile updated successfully.'),)
    setMode('preview');

    setOriginalValues(values);
    setOriginalProvinceCoverage(provinceCoverage);
    setOriginalSupportCategories(supportCategories);
  } catch (err) {
    console.error('Failed to update organization profile:', err);
    showAlert('error',t('profile.saveError', 'Failed to update profile.'),);
  } finally {
    setSaving(false);
  }
};

  // Uploads the selected document to the server and returns the uploaded file URL.
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

  return (
    <VStack {...styles.root}>
      <SPTitleHeader
        title={t('profile.title', 'Organisation Profile')}
        subTitle={t('profile.subTitle', "Manage your organisation's information and support coverage")}
        rightSection={
          mode !== 'edit' ? (
            <Button
              onPress={() => setMode('edit')}
              {...styles.editButton}
            >
              <ButtonIcon as={LucideIcon} name={'SquarePen'} {...styles.editButtonIcon} />
              <ButtonText>{t('profile.editProfile', 'Edit Profile')}</ButtonText>
            </Button>
          ) : (
            <HStack {...styles.headerActions}>
              <Button
                onPress={handleCancel}
                isDisabled={saving}
                {...styles.cancelButton}
              >
                <ButtonIcon as={LucideIcon} name="X" {...styles.cancelButtonIcon} />
                <ButtonText {...styles.cancelButtonText}>
                  {t('common.cancel', 'Cancel')}
                </ButtonText>
              </Button>
              <Button
                onPress={handleSave}
                isDisabled={saving}
                {...styles.saveButton}
              >
                {saving ? (
                  <Spinner {...styles.saveSpinner} />
                ) : (
                  <ButtonIcon as={LucideIcon} name="Save" {...styles.saveButtonIcon} />
                )}
                <ButtonText {...styles.saveButtonText}>
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
                <LucideIcon name="Building" {...styles.sectionIcon} />
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
                <LucideIcon name="User" {...styles.sectionIcon} />
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
                <LucideIcon name="MapPin" {...styles.sectionIcon} />
              </Box>
              <VStack>
                <HStack {...styles.alignCenterRow}>
                  <Text {...styles.sectionTitle}>{t('profile.coverage', 'Coverage')}</Text>
                  <Text {...styles.requiredAsterisk}> *</Text>
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
                <LucideIcon name="Layers" {...styles.sectionIcon} />
              </Box>
              <VStack>
                <HStack {...styles.alignCenterRow}>
                  <Text {...styles.sectionTitle}>{t('profile.supportCategoriesOffered', 'Support Categories Offered')}</Text>
                  <Text {...styles.requiredAsterisk}> *</Text>
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
                <LucideIcon name="FileText" {...styles.sectionIcon} />
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
