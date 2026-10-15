import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Box, HStack, VStack, Text, Button, ButtonText, ButtonIcon } from '@gluestack-ui/themed';
import Modal from '@components/ui/Modal';
import LucideIcon from '@components/ui/LucideIcon';
import modalStyles from '../../styles';
import { useLanguage } from '@contexts/LanguageContext';
import SchemaFormRenderer, { validateSchema } from '@components/SchemaFormRenderer';
import { ACCEPT_AND_SCHEDULE_FORM_SCHEMA, DURATION_OPTIONS } from '@constants/ACCEPT_AND_SCHEDULE_FORM_SCHEMA';
import { getProvincesList, getSitesByProvince } from '../../../../../services/usersService';
import { getSessionCategories, getDeliveryModes } from '../../../../../services/mentoringService';
// import { useNavigation } from '@react-navigation/native';
import moment from 'moment';

const BASE_PATH = 'supportProvider.supportRequests';
export interface AcceptAndScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  item?: any;
  onSubmit?: (data: {
    requestId: string | number;
    province: string;
    sites: string[];
    category: string;
    idp_training_task: string;
    title: string;
    description: string;
    targetAudience: string;
    date: string;
    time: string;
    duration: string;
    delivery_mode: string;
    capacity: string;
    location: string;
    meetingLink: string;
    notes: string;
  }) => void;
}

export default function AcceptAndScheduleModal({
  isOpen,
  onClose,
  item,
  onSubmit,
}: AcceptAndScheduleModalProps): React.JSX.Element {
  const { t } = useLanguage();
  // const navigation = useNavigation();

  const [provinces, setProvinces] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [deliveryModes, setDeliveryModes] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const coachName = item?.coach || '';
  const hubName = item?.hub && item.hub !== '-' ? ` (${item.hub} Hub)` : '';

  const [values, setValues] = useState<Record<string, any>>({
    province: '',
    sites: [] as string[],
    category: '',
    idp_training_task: '',
    title: '',
    description: '',
    targetAudience: '',
    date: '',
    time: '',
    duration: DURATION_OPTIONS[2].value,
    delivery_mode: 'online',
    capacity: '',
    location: '',
    meetingLink: '',
    notes: '',
  });

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [provs, cats, modes] = await Promise.all([
          getProvincesList(),
          getSessionCategories(),
          getDeliveryModes(),
        ]);

        setProvinces(provs || []);
        setCategories(cats || []);
        setDeliveryModes(modes || []);
      } catch (error) {
        console.error('[AcceptAndScheduleModal] Error fetching options:', error);
      }
    };

    fetchOptions();
  }, []);

  // Fetch sites whenever the selected province changes - mirrors the Training/Additional
  // Service request forms' province -> site cascading pattern.
  useEffect(() => {
    let isCurrent = true;

    const fetchSites = async () => {
      if (!values.province) {
        setSites([]);
        return;
      }
      try {
        const res = await getSitesByProvince({ provinceId: values.province });
        if (!isCurrent) return;
        setSites(res?.result?.data || []);
      } catch (error) {
        console.error('[AcceptAndScheduleModal] Error fetching sites:', error);
        if (isCurrent) setSites([]);
      }
    };

    fetchSites();

    return () => {
      isCurrent = false;
    };
  }, [values.province]);

  useEffect(() => {
    if (!item) return;

    const rawStartDate = item.raw?.session?.start_date ?? item.raw?.start_date;
    let date = '';
    let time = '';

    if (rawStartDate) {
      const startMoment = moment(rawStartDate * 1000);

      if (startMoment.isValid()) {
        date = startMoment.format('YYYY-MM-DD');
        time = startMoment.format('HH:mm');
      }
    }

    if (!date && item.preferredDate && item.preferredDate !== '-') {
      const parsedDate = moment(item.preferredDate, 'DD MMM YYYY');

      if (parsedDate.isValid()) {
        date = parsedDate.format('YYYY-MM-DD');
      }
    }

    if (!time && item.preferredTime && item.preferredTime !== '-') {
      const parsedTime = moment(item.preferredTime, 'hh:mm A');

      if (parsedTime.isValid()) {
        time = parsedTime.format('HH:mm');
      }
    }

    // The original LC request can carry multiple sites (multiselect on the request form) -
    // pre-fill all of them here rather than dropping down to just one.
    const requestedSites: string[] = Array.isArray(item.raw?.meta?.sites)
      ? item.raw.meta.sites
      : (item.raw?.meta?.site ? [item.raw.meta.site] : []);

    setValues({
      province: item.raw?.meta?.provinces?.[0] || item.raw?.meta?.province || '',
      sites: requestedSites,
      category: item.raw?.meta?.categories?.[0] || '',
      idp_training_task: item.raw?.meta?.idp_training_task || item.raw?.idp_training_task || '',
      title: item.title || '',
      description: item.raw?.description || item.justification || '',
      targetAudience: item.raw?.targetAudience || '',
      date: date || moment().format('YYYY-MM-DD'),
      time: time || moment().format('HH:mm'),
      duration: DURATION_OPTIONS[2].value,
      delivery_mode: item.raw?.delivery_mode || 'online',
      capacity: '',
      location: '',
      meetingLink: '',
      notes: '',
    });

    setErrors({});
  }, [item, t]);

  const handleFieldChange = useCallback((name: string, value: any) => {
    setValues(prev => {
      const next = { ...prev, [name]: value };
      // Site options depend on province - clear the stale selection when province changes.
      if (name === 'province') {
        next.sites = [];
      }
      return next;
    });

    setErrors(prev => {
      if (!prev[name]) return prev;

      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  const optionsMap = useMemo(
    () => ({
      provinces: provinces.map(p => ({
        value: p._id || p.id || p.value,
        label: p.name || p.title || p.label,
      })),
      sites: sites.map(s => ({
        value: s._id || s.id || s.value,
        label: s.name || s.title || s.label,
      })),
      pillars: categories.map(c => ({
        value: c.value || c._id || c.id,
        label: c.label || c.name || c.title,
      })),
      formatOptions: deliveryModes.map(m => ({
        value: m.value || m._id || m.id,
        label: m.label || m.name || m.title || m.value,
      })),
      durationOptions: DURATION_OPTIONS.map(opt => ({
        value: opt.value,
        label: t(opt.label) || opt.value,
      })),
    }),
    [provinces, sites, categories, deliveryModes, t]
  );

  function handleConfirmAndSchedule() {
    const validationErrors = validateSchema(ACCEPT_AND_SCHEDULE_FORM_SCHEMA, values, optionsMap);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    onSubmit?.({ ...values, requestId: item?.id } as any);
    onClose();
  }

  // The full wizard is a different screen per offering type - route there based on which
  // Support Requests tab this request actually belongs to, not always Training.
  // const FULL_WIZARD_ROUTE: Record<string, string> = {
  //   sessions: 'form-training-session',
  //   additional_services: 'create-additional-service',
  //   assets: 'create-asset',
  // };

  // function handleOpenFullWizard() {
  //   onClose();
  //   const routeName = FULL_WIZARD_ROUTE[item?.type] || 'form-training-session';
  //   (navigation as any).navigate(routeName, { type: 'create' });
  // }

  if (!isOpen) return <></>;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      {...modalStyles.modalPropsLg}
      headerTitle={
        <HStack {...modalStyles.acceptScheduleHeaderTitleRow}>
          <Box {...modalStyles.acceptScheduleBadge}>
            <Text {...modalStyles.acceptScheduleBadgeText}>
              {t(`${BASE_PATH}.labels.sessionForm`, 'Session Form')}
            </Text>
          </Box>
          <Text {...modalStyles.acceptScheduleTitleText}>
            {t(`${BASE_PATH}.titles.acceptSchedule`, 'Accept & Schedule Training')}
          </Text>
        </HStack>
      }
      headerDescription={
        <VStack space="xs" width="$full">
          <Text {...modalStyles.acceptScheduleHeaderDescText}>
            {t(`${BASE_PATH}.subtitles.preFilledFrom`, 'Pre-filled details from request by ')}
            <Text {...modalStyles.acceptScheduleCoachNameText}>{coachName}</Text>
            {hubName}
          </Text>

          <Box {...modalStyles.openWizard}>
            <HStack {...modalStyles.openWizardTextRow}>
              <Text {...modalStyles.openWizardLabelText}>
                {t(`${BASE_PATH}.banner.requested`, 'Requested')}:
              </Text>

              <Text {...modalStyles.openWizardValueText}>
                {item?.title || ''}
              </Text>

              <Text {...modalStyles.openWizardBulletText}>•</Text>

              <Text {...modalStyles.openWizardLabelText}>
                {t(`${BASE_PATH}.banner.participants`, 'Participants')}:
              </Text>

              <Text {...modalStyles.openWizardValueText}>
                {item?.participants || 0}
              </Text>

              {item?.province && item.province !== '-' && (
                <>
                  <Text {...modalStyles.openWizardBulletText}>•</Text>

                  <Text {...modalStyles.openWizardLabelText}>
                    {t(`${BASE_PATH}.banner.province`, 'Province')}:
                  </Text>

                  <Text {...modalStyles.openWizardValueText}>
                    {item.province}
                  </Text>
                </>
              )}
            </HStack>

            {/* <Button variant="outline" action="primary" {...modalStyles.openWizardBtn} onPress={handleOpenFullWizard}>
              <ButtonText {...modalStyles.openWizardBtnText}>{t(`${BASE_PATH}.buttonTexts.openFullWizard`, 'Open Full Wizard')}</ButtonText>
            </Button> */}
          </Box>
        </VStack>
      }
      footerContent={
        <HStack {...modalStyles.footer}>
          <Button variant="outline" action="secondary" onPress={onClose}  {...modalStyles.cancelButton}>
            <ButtonText {...modalStyles.modalCancelText}>
              {t(`${BASE_PATH}.buttonTexts.cancel`, 'Cancel')}
            </ButtonText>
          </Button>

          <Button variant="solid" action="primary" onPress={handleConfirmAndSchedule}  {...modalStyles.confirmButton}>
            <ButtonIcon as={LucideIcon} name="CheckCircle" {...modalStyles.iconConfirmCheck} />
            <ButtonText {...modalStyles.modalConfirmText}>
              {t(`${BASE_PATH}.buttonTexts.confirmSchedule`, 'Confirm & Schedule')}
            </ButtonText>
          </Button>
        </HStack>
      }
      bodyProps={{ p: 0 }}>
      <Box px="$6" py="$2">
        <SchemaFormRenderer
          schema={ACCEPT_AND_SCHEDULE_FORM_SCHEMA}
          values={values}
          errors={errors}
          optionsMap={optionsMap}
          onFieldChange={handleFieldChange}
          t={t}
        />
      </Box>
    </Modal>
  );
}