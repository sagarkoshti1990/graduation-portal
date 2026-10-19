import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
} from '@ui';
import { LucideIcon } from '@ui/index';
import SPTitleHeader from '@components/Header/SPTitleHeader';
import SchemaFormRenderer, { validateSchema, resolveFileUploads } from '@components/SchemaFormRenderer';
import { useAuth } from '@contexts/AuthContext';
import { getUserProfile } from '../../../services/authenticationService';
import {
  getProviderTypeOptions,
  getMentoringProfile,
  createMentoringProfile,
  updateMentoringProfile,
} from '../../../services/mentoringService';
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

// Card header: icon + title on one row, subtitle below starting under the icon
const SectionHeader = ({ icon, title, subtitle, required = false }: { icon: string; title: string; subtitle: string; required?: boolean }) => (
  <VStack {...styles.sectionHeader}>
    <HStack {...styles.sectionTitleRow}>
      <LucideIcon name={icon} {...styles.sectionIcon} />
      <Text {...styles.sectionTitle}>{title}</Text>
      {required && <Text {...styles.requiredAsterisk}>*</Text>}
    </HStack>
    <Text {...styles.sectionSubtitle}>{subtitle}</Text>
  </VStack>
);

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
  
  const [profileExists, setProfileExists] = useState<boolean>(true);
  const [saving, setSaving] = useState(false);

  // Options map state for select fields
  const [providerTypeOptions, setProviderTypeOptions] = useState<{ value: string; label: string }[]>([]);

  const optionsMap = useMemo(() => ({
    organizationTypes: providerTypeOptions,
  }),[providerTypeOptions]);

  // Fetches dynamic options & logged-in user's organization profile on mount.
  useEffect(() => {
    const loadProfileData = async () => {
      // Fetch dynamic provider_type options from mentoring API
      try {
        const res: any = await getProviderTypeOptions();
        if (res && res.length > 0) {
          setProviderTypeOptions(res);
        }
      } catch (err) {
        console.error('Error fetching provider_type options:', err);
      }

      if (!user?.id) return;

      try {
        let profile: any = {};
        try {
          setProfileExists(false);
          const mentoringProfileRes = await getMentoringProfile();
          if (mentoringProfileRes?.result) {
            profile = mentoringProfileRes.result
            setProfileExists(true);
            console.log('Mentoring profile fetched successfully:', profile);
          }
        } catch (mErr: any) {
          console.warn('Mentoring profile check error:', mErr);
          if (mErr?.response?.status === 404) {
            setProfileExists(false);
            showAlert('warning', t('profile.mentorNotFound', 'Mentor profile not found. Please create your profile.'));
          }
        }

        // Fallback to user service profile if mentoring profile data is empty
        if (!profile || Object.keys(profile).length === 0) {
          const res = await getUserProfile(user.id);
          profile = res || {};
        }

        // Mentoring profile/read strips `phone` and the login user's phone is still encrypted,
        // so the decrypted number is taken from the user service profile
        let decryptedPhone = profile?.phone || '';
        if (!decryptedPhone) {
          try {
            const userServiceProfile = await getUserProfile(user.id);
            decryptedPhone = userServiceProfile?.phone || '';
          } catch (pErr) {
            console.warn('User profile phone fetch error:', pErr);
          }
        }

        // Don't overwrite unsaved changes while editing
        if (mode === 'edit') {
          return;
        }

        const getField = (key: string, fallback: any = '') => {
          const val = profile?.[key];
          
          if (val === undefined || val === null) {
            return fallback;
          }

          return val;
        };

        let orgType = getField('provider_type', []);

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

        orgType = orgType.map((type: any) => (typeof type === 'object' ? type?.value : type)).filter(Boolean);

        const mapped = {
          name: getField('provider_name') || '',
          organizationType: orgType[0] || '',
          contactPersonName: getField('name') || user?.name || '',
          contactEmail: getField('email') || user?.email || '',
          contactPhone: decryptedPhone,
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
  const contactErrors = validateSchema(CONTACT_PERSON_SCHEMA, values);
  const docErrors = validateSchema(DOCUMENTS_SCHEMA, values);

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
    provider_name: values.name,
    email: values.contactEmail,
    phone: values.contactPhone,
    phone_code: values.phone_code? values.phone_code.toString().replace('+', ''): '27',
    // Single select in UI, but backend still stores provider_type as an array
    provider_type: values.organizationType ? [values.organizationType] : [],
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
      // organizationType: values.organizationType,
      agreementMoU: resolvedValues.agreementMoU,
      organisationCredentials: resolvedValues.organisationCredentials,
    },
  };
  try {
    if (profileExists) {
      await updateMentoringProfile(payload);
    } else {
      await createMentoringProfile(payload);
      setProfileExists(true);
    }
  } catch (mentoringErr: any) {
    console.error('Error calling mentoring profile API:', mentoringErr);
    if (mentoringErr?.response?.status === 404) {
      await createMentoringProfile(payload);
      setProfileExists(true);
    }
  }

  showAlert('success', t('profile.saveSuccess', 'Profile updated successfully.'));
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
            <SectionHeader
              icon="Building"
              title={t('profile.basicInfo', 'Basic Information')}
              subtitle={t('profile.basicInfoSubtitle', 'General organisation profile details')}
            />

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
            <SectionHeader
              icon="User"
              title={t('profile.contactPerson', 'Contact Person')}
              subtitle={t('profile.contactPersonSubtitle', 'Focal person for this organisation')}
            />

            <SchemaFormRenderer
              schema={CONTACT_PERSON_SCHEMA}
              values={values}
              errors={errors}
              onFieldChange={handleFieldChange}
              disabled={saving}
              mode={mode}
              t={t as any}
            />
          </VStack>

          {/* Card 3: Coverage */}
          <VStack {...styles.sectionCard}>
            <SectionHeader
              icon="MapPin"
              title={t('profile.coverage', 'Coverage')}
              subtitle={t('profile.coverageSubtitle', 'Select province and multi-select sites, then click + Add Province')}
              required
            />

            <ProvinceCoverage
              value={provinceCoverage}
              onChange={setProvinceCoverage}
              mode={mode}
              t={t}
            />
          </VStack>

          {/* Card 4: Support Categories Offered */}
          <VStack {...styles.sectionCard}>
            <SectionHeader
              icon="Layers"
              title={t('profile.supportCategoriesOffered', 'Support Categories Offered')}
              subtitle={t('profile.supportCategoriesSubtitle', 'Choose categories and sub-options, then click + Add Category')}
              required
            />

            <SupportCategories
              value={supportCategories}
              onChange={setSupportCategories}
              mode={mode}
              t={t}
            />
          </VStack>

          {/* Card 5: Documents */}
          <VStack {...styles.sectionCard}>
            <SectionHeader
              icon="FileText"
              title={t('profile.documents', 'Documents')}
              subtitle={t('profile.documentsSubtitle', 'Upload organisation registration and certificates')}
            />

            <SchemaFormRenderer
              schema={DOCUMENTS_SCHEMA}
              values={values}
              errors={errors}
              onFieldChange={handleFieldChange}
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
