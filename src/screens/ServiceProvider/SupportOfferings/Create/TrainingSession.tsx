import React, { useCallback, useRef, useState } from 'react';
import { Button, ButtonIcon, ButtonText, Card, Container, Loader, VStack, useAlert, Modal, HStack, Text } from '@ui';
import styles from '../styles';
import SPTitleHeader from '@components/Header/SPTitleHeader';
import LucideIcon from '@components/ui/LucideIcon';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import SchemaFormRenderer from '@components/SchemaFormRenderer';
import { TRAINING_FORM_SCHEMA } from '@constants/TRAINING_FORM_SCHEMA';
import { useLanguage } from '@contexts/LanguageContext';
import { useAuth } from '@contexts/AuthContext';
import { getProvincesList } from '../../../../services/usersService';
import {
  getSessionCategories,
  getRecommendedFor,
  getDeliveryModes,
  createSession,
  updateSessionWithResources,
  getSessionDetails,
  deleteSession,
  MentoringOption,
} from '../../../../services/mentoringService';
import NotFound from '@components/NotFound';
import { uploadService, valueMapping, applyDraftDefaults, TRAINING_DRAFT_CONFIG } from '@utils/supportProvider';
import { FORM_MODE, SESSION_STATUS, SUPPORT_CATEGORIES } from '@constants/SUPPORT_PROVIDER_CARDS';
import logger from '@utils/logger';
import { useTrainingFormOptions, useProfileCompletion } from '@hooks';

// Icon shown next to each delivery mode option in the format-type pill selector
const DELIVERY_MODE_ICONS: Record<string, string> = {
  in_person: 'MapPin',
  online: 'Video',
  hybrid: 'Users',
};

const App = (): React.JSX.Element => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const modeType: String = route.params?.type;
  const sessionId = route.params?.id;
  const { t } = useLanguage();
  const { user } = useAuth() || {};
  const isLc = user?.role === 'org_admin';
  const [provinces, setProvinces] = useState<any[]>([]);
  const [pillers, setPillers] = useState<MentoringOption[]>([]);
  const [targetAudience, setTargetAudience] = useState<MentoringOption[]>([]);
  const [deliveryModes, setDeliveryModes] = useState<MentoringOption[]>([]);
  const [values, setValues] = useState<any>({});
  // Resources as loaded in edit mode - needed to work out which ones the user removed
  const originalResourcesRef = useRef<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lodingButton, setLodingButton] = useState<false | "saveDraft" | "submit">(false);
  const { showAlert } = useAlert();
  const { isCardAllowed, allowedSubOptions, allowedProvinces, allowedSites, isProfileLoading } = useProfileCompletion();
  const isAllowed = isLc || Boolean(isCardAllowed(SUPPORT_CATEGORIES.TRAINING));
  const [showDiscardModal, setShowDiscardModal] = useState(false);

  const { optionsMap } = useTrainingFormOptions({
    values,
    provinces,
    pillers,
    targetAudience,
    deliveryModes,
    deliveryModeIcons: DELIVERY_MODE_ICONS,
    allowedSubOptions,
    allowedProvinces,
    allowedSites,
  });

  const getHeaderTitle = () => {
    switch (modeType) {
      case FORM_MODE.EDIT:
        return t('supportProvider.createSupport.training.editTitle', 'Edit Training Session');
      case FORM_MODE.COPY:
        return t('supportProvider.createSupport.training.copyTitle', 'Copy Training Session');
      case FORM_MODE.CREATE:
      default:
        return t('supportProvider.createSupport.training.title', 'Create Training Session');
    }
  };

  const init = useCallback(async () => {
    try {
      const [result, getCategories, getTarget, getDeliveryModeOptions] = await Promise.all([
        getProvincesList(),
        getSessionCategories(),
        getRecommendedFor(),
        getDeliveryModes(),
      ]);
      setProvinces(result);
      setPillers(getCategories);
      setTargetAudience(getTarget);
      setDeliveryModes(getDeliveryModeOptions);

      // Fetch session data via getSessionDetails API when in Copy or Edit mode
      if (sessionId && (modeType === FORM_MODE.COPY || modeType === FORM_MODE.EDIT)) {
        const rawResponse = await getSessionDetails(sessionId);
        const rawData = rawResponse?.result;
        originalResourcesRef.current = Array.isArray(rawData?.resources) ? rawData.resources : [];
        if (rawData) {
          const formattedValues: any = valueMapping(rawData, true, {}, 'training'); // Reverse mapping to form values
          // A copy must be scheduled fresh - don't carry over the original session's date/time
          if (modeType === FORM_MODE.COPY) {
            formattedValues.start_date = '';
            formattedValues.end_date = '';
          }
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
      };
    }, [init])
  );

  const handleFieldChange = useCallback(
    (name: string, value: string, other?: any) => {
      setValues((prev: Record<string, any>) => {
        const next = { ...prev, [name]: value };
        if (name === 'provinces') next.sites = '';
        if (name === 'categories') {
          next.idp_training_task = '';
          next.title = '';
        }
        if (name === 'idp_training_task') {
          next.title = other?.label;
        }
        return next;
      });
    },
    []
  );

  const handleSave = async (submittedValues: any, isDraft: boolean) => {
    try {
      const formValues = isDraft ? applyDraftDefaults(submittedValues, TRAINING_DRAFT_CONFIG.defaults, optionsMap) : submittedValues;
      setValues(formValues);
      setLodingButton(isDraft ? "saveDraft" : "submit")
      const payload: any = valueMapping({ ...formValues, isDraft }, false, optionsMap);

      if (modeType === FORM_MODE.EDIT) {
        await updateSessionWithResources(sessionId, payload, originalResourcesRef.current);
      }
      else {
        await createSession(payload);
      }

      const successMsg = isDraft
        ? t('supportProvider.supportOfferings.cards.alerts.draftSaved', 'Support offering saved as draft!')
        : modeType === FORM_MODE.COPY
          ? t('supportProvider.supportOfferings.cards.alerts.supportCopied', 'Support copied successfully!')
          : t('supportProvider.supportOfferings.cards.alerts.supportPublished', 'Support published successfully!');

      showAlert('success', successMsg);
      // @ts-ignore
      navigation.navigate('opportunities');
    } catch (error: any) {
      logger.error('Error saving training session:', error);
      // Show specific API error message if available, otherwise generic message
      const errMsg =
        error?.data?.message ||
        error?.message ||
        t('supportProvider.createSupport.errors.saveFailed', 'Something went wrong while saving. Please try again.');
      showAlert('error', errMsg);
    } finally {
      setLodingButton(false);
    }
  };


  const handleDiscard = async () => {
    try {
      await deleteSession(sessionId);
      showAlert('success', t('supportProvider.createSupport.training.discardSuccess', 'Draft discarded successfully!'));
      // @ts-ignore
      navigation.navigate('opportunities');
    } catch (error: any) {
      logger.error('Error discarding draft session:', error);
      const errMsg =
        error?.data?.message ||
        error?.message ||
        t('supportProvider.createSupport.errors.discardFailed', 'Something went wrong while discarding. Please try again.');
      showAlert('error', errMsg);
    }
  };

  const handleBackPress = () => {
    if (navigation.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // @ts-ignore
      navigation.navigate('create-opportunity');
    }
  }

  if (isLoading || isProfileLoading) {
    return <Loader fullScreen message="Loading..." />;
  }

  if (modeType === FORM_MODE.CREATE && !isAllowed) {
    return (
      <NotFound
        message={t(
          'supportProvider.createSupport.errors.incompleteWarning'
        )}
      />
    );
  }

  if ((modeType === FORM_MODE.CREATE && sessionId) || ((modeType === FORM_MODE.COPY || modeType === FORM_MODE.EDIT) && !sessionId)) {
    return <NotFound message="Routes Not Found" />;
  }

  if (modeType === FORM_MODE.EDIT && values.status === SESSION_STATUS.PUBLISHED) {
    return <NotFound message="Published sessions cannot be edited" />;
  }

  return (
    <VStack flex={1}>
      <SPTitleHeader
        title={getHeaderTitle()}
        backButtonText={t('supportProvider.createSupport.changeType', 'Change type')}
        onNavigateBack={handleBackPress}
      />
      <Container {...styles.container}>
        <Card borderRadius={"$2xl"} bg="$white">
          <SchemaFormRenderer
            schema={TRAINING_FORM_SCHEMA()}
            optionsMap={optionsMap}
            values={values}
            t={t}
            onFieldChange={handleFieldChange}
            onSubmit={(formValues) => handleSave(formValues, false)}
            onSaveDraft={(formValues) => handleSave(formValues, true)}
            draftRequiredFields={TRAINING_DRAFT_CONFIG.requiredFields}
            lodingButton={lodingButton}
            uploadService={uploadService}
            saveDraftButtonProps={{ _icon: { color: "$textForeground" } }}
            submitButtonProps={{ bg: "green", icon: "Check", _icon: { color: "$white" } }}
            submitButtonText={t("supportProvider.supportOfferings.buttonTexts.publishSupport")}
            customButton={
              modeType === FORM_MODE.EDIT ? (
                <Button variant="outlineghost" onPress={() => setShowDiscardModal(true)} isDisabled={!!lodingButton}>
                  <ButtonIcon as={LucideIcon} name="X" />
                  <ButtonText>{t('supportProvider.createSupport.training.discard', 'Discard Draft')}</ButtonText>
                </Button>
              ) : undefined
            }
          />
        </Card>
      <Modal
        isOpen={showDiscardModal}
        onClose={() => setShowDiscardModal(false)}
        headerContent={<Text fontSize="$lg" fontWeight="$bold" color="$text900"> {t('supportProvider.createSupport.training.discard' )} </Text>} >
        <VStack bg="$white" borderRadius="$xl" gap="$4" width="$full">
          <Text fontSize="$sm"  color="$text600"  lineHeight="$lg" > {t( 'supportProvider.createSupport.training.discardMessage')} </Text>
            <HStack  justifyContent="flex-end"  alignItems="center"  gap="$3"  >
            <Button  variant="outlineghost"  onPress={() => setShowDiscardModal(false)}  isDisabled={!!lodingButton}  >
              <ButtonText>  {t('common.cancel')}  </ButtonText>
            </Button>

            <Button  variant="solid"  bg="$primary500"  onPress={handleDiscard}  isDisabled={!!lodingButton}  >
              <ButtonText color="$white">
                {t(  'supportProvider.createSupport.training.discard' )}
              </ButtonText>
            </Button>
          </HStack>
        </VStack>
      </Modal>
        
      </Container>
    </VStack>
  );
};

export default App;
