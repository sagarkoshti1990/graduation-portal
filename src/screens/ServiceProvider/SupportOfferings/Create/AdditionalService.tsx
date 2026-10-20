import React, { useCallback, useRef, useState } from 'react';
import { Box, Card, Container, HStack, Text, VStack, useAlert,Loader } from '@ui';
import styles from '../styles';
import lcStyles from '../../../SessionsSupport/styles';
import SPTitleHeader from '@components/Header/SPTitleHeader';
import PageHeader from '@components/PageHeader';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import SchemaFormRenderer from '@components/SchemaFormRenderer';
import { ADDITIONAL_SERVICES_FORM_SCHEMA, REQUEST_ADDITIONAL_SERVICE_HIDE_FIELDS } from '@constants/ADDITIONAL_SERVICES_SCHEMA';
import { useLanguage } from '@contexts/LanguageContext';
import { useAuth } from '@contexts/AuthContext';
import { getProvincesList } from '../../../../services/usersService';
import {
  getAdditionalServiceCategories,
  getSessionDetails,
  MentoringOption,
  createSession,
  updateSessionWithResources,
  requestSession,
} from '../../../../services/mentoringService';
import logger from '@utils/logger';
import {
  FORM_MODE,
  SESSION_STATUS,
  SUPPORT_CATEGORIES,
  ADDITIONAL_SERVICE_FORM_FIELDS as FORM_FIELDS,
  SUPPORT_PROVIDER_ROUTES as ROUTES,
  SESSIONS_SUPPORT_TABS,
  BUTTON_LOADING_STATE,
} from '@constants/SUPPORT_PROVIDER_CARDS';
import { ROLE_NAMES } from '@constants/ROLES';
import { uploadService, valueMapping, requestSessionPayloadMapping, applyDraftDefaults, ADDITIONAL_SERVICE_DRAFT_CONFIG } from '@utils/supportProvider';
import { useTrainingFormOptions, useProfileCompletion } from '@hooks';
import NotFound from '@components/NotFound';

// White card applies only to the form body, not the progress bar or step tabs
const FORM_CARD_PROPS = { bg: '$white', borderRadius: '$2xl', p: '$6' };

const App = (): React.JSX.Element => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const modeType: String = route.params?.type;
  const sessionId = route.params?.id;

  const { t } = useLanguage();
  const { showAlert } = useAlert();
  const { user } = useAuth() || {};
  const isLc = user?.role === ROLE_NAMES.LC;
  const { isCardAllowed, allowedSubOptions, allowedProvinces, allowedSites, isProfileLoading } = useProfileCompletion();
  const isAllowed = Boolean(isCardAllowed(SUPPORT_CATEGORIES.ADDITIONAL_SERVICE));

  const [provinces, setProvinces] = useState<any[]>([]);
  const [pillers, setPillers] = useState<MentoringOption[]>([]);

  const [values, setValues] = useState<any>({});

  // Resources as loaded in edit mode - needed to work out which ones the user removed

  const originalResourcesRef = useRef<any[]>([]);
  // Saved start time in edit mode, so the min lead time check only runs when it is changed
  const originalStartDateRef = useRef<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [lodingButton, setLodingButton] = useState<false | typeof BUTTON_LOADING_STATE[keyof typeof BUTTON_LOADING_STATE]>(false);

  const handleFieldChange = useCallback((name: string, value: string) => {
    setValues((prev: any) => {
      const next = { ...prev, [name]: value };
      if (name === FORM_FIELDS.PROVINCES) next[FORM_FIELDS.SITES] = '';
      if (name === FORM_FIELDS.CATEGORIES) next[FORM_FIELDS.IDP_ADDITIONAL_SERVICES_TASKS] = [];
      return next;
    });
  }, []);

  const init = useCallback(async () => {
    try {
      const result = await getProvincesList();
      const getCategories = await getAdditionalServiceCategories();
      setProvinces(result);
      setPillers(getCategories);

      // Fetch session data via getSessionDetails API when in Copy or Edit mode
      if (sessionId && (modeType === FORM_MODE.COPY || modeType === FORM_MODE.EDIT)) {
        const rawResponse = await getSessionDetails(sessionId);
        const rawData = rawResponse?.result;
        originalResourcesRef.current = Array.isArray(rawData?.resources) ? rawData.resources : [];
        if (rawData) {
          const formattedValues: any = valueMapping(rawData, true, {}, SUPPORT_CATEGORIES.ADDITIONAL_SERVICE); // Reverse mapping to form values
          // A copy must be scheduled fresh - don't carry over the original session's date/time
          if (modeType === FORM_MODE.COPY) {
            formattedValues.start_date = '';
            formattedValues.end_date = '';
          }
          // Drafts carry an auto-filled start time, so they must always pass the lead time check on publish
          const isDraft = String(rawData.status?.value ?? rawData.status ?? '').toUpperCase() === SESSION_STATUS.DRAFT;
          originalStartDateRef.current = modeType === FORM_MODE.EDIT && !isDraft ? formattedValues.start_date : undefined;
          setValues(formattedValues);
        }
      }
    } catch (error: any) {
      logger.error('Error loading form data:', error);
      showAlert('error', error?.message || 'Failed to load form options. Please refresh and try again.');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, modeType]);

  useFocusEffect(
    useCallback(() => {
      init();
      return () => {
        setIsLoading(true);
        setValues({});
        originalStartDateRef.current = undefined;
      };
    }, [init])
  );

  const { sessionTypes, optionsMap } = useTrainingFormOptions({
    values,
    provinces,
    pillers,
    // LC has no SP sub-option coverage, but province/site are still restricted to the LC's own profile
    ...(isLc
      ? {
          allowedProvinces: allowedProvinces.length > 0 ? allowedProvinces : undefined,
          allowedSites: allowedSites.length > 0 ? allowedSites : undefined,
        }
      : { allowedSubOptions, allowedProvinces, allowedSites }),
  });

  const hideFields = [
    ...(sessionTypes.length === 0 ? [FORM_FIELDS.IDP_ADDITIONAL_SERVICES_TASKS] : []),
    ...(isLc ? REQUEST_ADDITIONAL_SERVICE_HIDE_FIELDS : []),
  ];

  const handleBackPress = () => {
    if (navigation.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // @ts-ignore
      navigation.navigate(isLc ? ROUTES.SESSIONS_SUPPORT : ROUTES.CREATE_OPPORTUNITY);
    }
  };

  const handleSave = async (submittedValues: any, isDraft: boolean) => {
    try {
      const formValues = isDraft && !isLc ? applyDraftDefaults(submittedValues, ADDITIONAL_SERVICE_DRAFT_CONFIG.defaults) : submittedValues;
      setValues(formValues);
      setLodingButton(isDraft ? BUTTON_LOADING_STATE.SAVE_DRAFT : BUTTON_LOADING_STATE.SUBMIT);

      if (isLc) {
        const payload: any = requestSessionPayloadMapping(
          { ...formValues, isDraft, support_offering_type: SUPPORT_CATEGORIES.ADDITIONAL_SERVICE },
          optionsMap
        );
        await requestSession(payload);

        const successMsg = isDraft
          ? t('supportProvider.createSupport.training.alerts.draftSaved')
          : t('supportProvider.createSupport.training.alerts.sessionSaved');

        showAlert('success', successMsg);
        // @ts-ignore
        navigation.navigate(ROUTES.SESSIONS_SUPPORT, {
          activeTab: SESSIONS_SUPPORT_TABS.ACTIVE_TAB,
          activeSubTab: SESSIONS_SUPPORT_TABS.ACTIVE_SUB_TAB,
          refreshRequests: Date.now(),
        });
      } else {
        const payload: any = valueMapping({ ...formValues, isDraft }, false, optionsMap, SUPPORT_CATEGORIES.ADDITIONAL_SERVICE);

        if (modeType === FORM_MODE.EDIT) {
          await updateSessionWithResources(sessionId, payload, originalResourcesRef.current);
        } else {
          await createSession(payload);
        }

        const successMsg = isDraft
          ? t('supportProvider.supportOfferings.cards.alerts.draftSaved')
          : modeType === FORM_MODE.COPY
            ? t('supportProvider.supportOfferings.cards.alerts.supportCopied')
            : t('supportProvider.supportOfferings.cards.alerts.supportPublished');

        showAlert('success', successMsg);
        // @ts-ignore
        navigation.navigate(ROUTES.OPPORTUNITIES);
      }
    } catch (error: any) {
      logger.error('Error saving additional service:', error);
      const errMsg =
        error?.data?.message ||
        error?.message ||
        t('supportProvider.createSupport.errors.saveFailed');
      showAlert('error', errMsg);
    } finally {
      setLodingButton(false);
    }
  };

  if (isLoading || isProfileLoading) {
    return <Loader fullScreen message="Loading..." />;
  }

  if (!isLc && modeType === FORM_MODE.CREATE && !isAllowed) {
    return (
      <NotFound
        message={t(
          'supportProvider.createSupport.errors.incompleteWarning'
        )}
      />
    );
  }

  const lcHeaderBadge = (
    <HStack {...lcStyles.headerTitleHStack}>
      <Text {...lcStyles.headerSubTitleText}>
        {t('lc.requestAdditionalService.title')}
      </Text>
      <Box {...lcStyles.headerBadgeBox}>
        <Text {...lcStyles.headerBadgeText}>
          {t('lc.requestAdditionalService.badge')}
        </Text>
      </Box>
    </HStack>
  );

  return (
    <VStack flex={1}>
      {isLc ? (
        <PageHeader
          rightSection={lcHeaderBadge}
          backButtonText={t('supportProvider.createSupport.changeType')}
          onBackPress={handleBackPress}
        />
      ) : (
        <SPTitleHeader
          title={t('supportProvider.createSupport.additionalService.title')}
          backButtonText={t('supportProvider.createSupport.changeType')}
          onNavigateBack={handleBackPress}
        />
      )}
      <Container {...styles.container}>
        <Card borderRadius="$2xl" bg="transparent" p="$0" shadowOpacity={0} elevation={0}>
          <SchemaFormRenderer
            schema={ADDITIONAL_SERVICES_FORM_SCHEMA(hideFields, originalStartDateRef.current)}
            optionsMap={optionsMap}
            values={values}
            t={t}
            onFieldChange={handleFieldChange}
            disableStepNavigation={isLc}
            _formContainer={FORM_CARD_PROPS}
            onSubmit={(formValues) => handleSave(formValues, false)}
            onSaveDraft={(formValues) => handleSave(formValues, true)}
            draftRequiredFields={isLc ? undefined : ADDITIONAL_SERVICE_DRAFT_CONFIG.requiredFields}
            uploadService={uploadService}
          />
        </Card>
      </Container>
    </VStack>
  );
};
export default App; 
