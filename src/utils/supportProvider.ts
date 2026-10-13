import { LC_ROLES, PARTICIPANT } from '@constants/ROLES';
import { CERTIFICATE_OPTIONS, RECURRING_OPTIONS, SUPPORT_CATEGORIES, SUPPORT_OFFERING_TYPE_VALUES } from '@constants/SUPPORT_PROVIDER_CARDS';
import moment from 'moment';
import { uploadFiles } from '../project-player/services/projectPlayerService';

export type SupportOfferingFormType = 'training' | 'additional_service' | 'asset' | string;

export function valueMapping(
  formValues: any,
  isReverseMapping: boolean = false,
  optionsMap: any,
  formType: SupportOfferingFormType = SUPPORT_CATEGORIES.TRAINING,
): any {
  const effectiveFormType: SupportOfferingFormType = formType || SUPPORT_CATEGORIES.TRAINING;

  if (isReverseMapping) {
    let recommended_for = '';
    if (
      formValues.recommended_for &&
      Array.isArray(formValues.recommended_for)
    ) {
      let tempArray = formValues.recommended_for.map(
        (item: any) => item?.value ?? item,
      );
      let isLcRole = tempArray.some((item: string) => LC_ROLES.includes(item));
      let isParticipantRole = tempArray.some((item: string) =>
        PARTICIPANT.includes(item),
      );
      if (isLcRole && isParticipantRole) {
        recommended_for = 'both';
      } else if (isLcRole) {
        recommended_for = 'org_admin';
      } else if (isParticipantRole) {
        recommended_for = 'user';
      }
    }

    const rawProvinces = formValues?.provinces;
    const provinceVal = Array.isArray(rawProvinces) ? rawProvinces[0] : rawProvinces;

    const rawSites = formValues?.sites;
    const sitesVal: string[] = Array.isArray(rawSites)
      ? rawSites.filter(Boolean)
      : (rawSites ? [String(rawSites)] : []);

    const rawCategories = formValues?.categories;
    const categoryVal = Array.isArray(rawCategories) ? rawCategories[0] : rawCategories;

    // API returns unix seconds; the datetime field expects 'YYYY-MM-DDTHH:mm:ss'
    const toDateTimeValue = (val: any) => {
      if (!val) return '';
      const num = Number(val);
      const m = Number.isNaN(num) ? moment(val) : moment(num > 1e12 ? num : num * 1000);
      return m.isValid() ? m.format('YYYY-MM-DDTHH:mm:ss') : '';
    };
    const rawDeliveryMode = formValues?.delivery_mode;
    const deliveryModeVal = typeof rawDeliveryMode === 'object' ? rawDeliveryMode?.value : rawDeliveryMode;

    // Details API may return entity values as { value, label } objects
    const rawServiceTasks = formValues?.idp_additional_services_tasks;
    const serviceTasksVal: string[] = (Array.isArray(rawServiceTasks) ? rawServiceTasks : rawServiceTasks ? [rawServiceTasks] : [])
      .map((item: any) => item?.value ?? item)
      .filter(Boolean);

    return {
      title: formValues?.title,
      provinces: provinceVal || '',
      sites: sitesVal,
      categories: categoryVal || '',
      idp_training_task: formValues.idp_training_task,
      idp_additional_services_tasks: serviceTasksVal,
      sessionTypeOther: formValues.idp_training_task === "custom" ? formValues?.title : "",
      description: formValues?.description,
      learning_objectives: formValues?.learning_objectives,
      recommended_for,
      certificate_provided: `${formValues.certificate_provided}`,
      seats_limit: formValues?.seats_limit,
      can_be_copied: `${formValues.can_be_copied}`,
      max_capacity: formValues.seats_limit,
      resources: formValues?.resources,
      start_date: toDateTimeValue(formValues?.start_date),
      end_date: toDateTimeValue(formValues?.end_date),
      delivery_mode: deliveryModeVal || '',
      location: formValues?.meeting_info?.location ?? formValues?.location ?? '',
      meeting_link: formValues?.meeting_info?.link ?? formValues?.meeting_link ?? '',
    };
  }

  const { province, site, ...restFormValues } = formValues;

  let recommendedForPayload: string[] = [];
  if (effectiveFormType === SUPPORT_CATEGORIES.ADDITIONAL_SERVICE || effectiveFormType === SUPPORT_CATEGORIES.ASSET) {
    recommendedForPayload = ['user'];
  } else if (Array.isArray(formValues.recommended_for)) {
    recommendedForPayload = formValues.recommended_for;
  } else if (formValues.recommended_for === 'both') {
    recommendedForPayload = ['org_admin', 'user'];
  } else if (formValues.recommended_for) {
    recommendedForPayload = [formValues.recommended_for];
  }

  let startDate, endDate;
  if (effectiveFormType === SUPPORT_CATEGORIES.TRAINING) {
    startDate = formValues.start_date ? moment(formValues.start_date).unix() : undefined;
    endDate = formValues.end_date ? moment(formValues.end_date).unix() : undefined;
  } else {
    startDate = formValues.start_date ? moment(formValues.start_date).unix() : moment().unix();
    endDate = formValues.end_date ? moment(formValues.end_date).unix() : moment().add(2, 'years').unix();
  }

  return {
    ...formValues,
    title:
      formValues?.idp_training_task === 'custom'
        ? formValues?.sessionTypeOther
        : formValues?.title,
    categories: [formValues.categories],
    delivery_mode: formValues.delivery_mode || 'offline',
    provinces: [formValues.provinces],
    sites: formValues.sites,
    recommended_for: recommendedForPayload,
    start_date: startDate,
    end_date: endDate,
    certificate_provided: formValues.certificate_provided === "true",
    can_be_copied: formValues.can_be_copied === "true",
    session_type: 'Public',
    status: formValues.isDraft ? 'DRAFT' : 'PUBLISHED',
    seats_limit: formValues.seats_limit,
    meeting_info: {
      link: formValues?.meeting_link,
      location: formValues?.location,
    },
    support_offering_type: effectiveFormType
  };
}

export function requestSessionPayloadMapping(formValues: any, optionMap: any = {}): any {
  const { province, site } = formValues;
  const resolvedProvince = formValues.provinces ?? province;
  const resolvedSites = formValues.sites ?? site;

  return {
    support_offering_type: formValues.support_offering_type || SUPPORT_OFFERING_TYPE_VALUES.TRAINING_SESSION,
    provinces: Array.isArray(resolvedProvince) ? resolvedProvince : [resolvedProvince],
    sites: Array.isArray(resolvedSites) ? resolvedSites : (resolvedSites ? [resolvedSites] : []),
    categories: [formValues.categories],
    idp_training_task: formValues.idp_training_task,
    description: formValues.description,
    learning_objectives: formValues.learning_objectives,
    start_date: (formValues.start_date ? moment(formValues.start_date) : moment()).unix(),
    end_date: (formValues.end_date
      ? moment(formValues.end_date)
      : (formValues.start_date ? moment(formValues.start_date) : moment()).add(30, 'minutes')
    ).unix(),
    title:
      formValues.idp_training_task === 'custom'
        ? formValues.sessionTypeOther
        : formValues.title,
    agenda: formValues.description,
    requestees: formValues.requestees || [],
    status: formValues.isDraft ? 'DRAFT' : 'Requested',
    time_zone: 'Asia/Kolkata',
    can_be_copied: false,
    certificate_provided: false,
    delivery_mode: formValues.delivery_mode || 'offline',
    meeting_info: {
      link: formValues.meeting_link || '',
      location: formValues.location || '',
    },
  };
}

/**
 * Maps the Asset request form (ASSET_SCHEMA field names: province/site/assetType/...) to the
 * request-session API payload. Kept separate from requestSessionPayloadMapping because the Asset
 * form's fields don't line up with the training/additional-service field names that function expects.
 */
export function requestAssetPayloadMapping(formValues: any): any {
  const { province, site } = formValues;
  const resolvedProvince = formValues.provinces ?? province;
  const resolvedSites = formValues.sites ?? site;

  // Availability is optional on the Asset form, but the shared request-session API enforces a
  // 30 minute - 24 hour window on every request - default to a valid 30 minute slot when left blank.
  const startMoment = formValues.startDate ? moment(formValues.startDate) : moment();
  const endMoment = formValues.endDate ? moment(formValues.endDate) : moment(startMoment).add(30, 'minutes');

  return {
    support_offering_type: SUPPORT_OFFERING_TYPE_VALUES.ASSET,
    provinces: Array.isArray(resolvedProvince) ? resolvedProvince : (resolvedProvince ? [resolvedProvince] : []),
    sites: Array.isArray(resolvedSites) ? resolvedSites : (resolvedSites ? [resolvedSites] : []),
    title: formValues.assetTitle,
    agenda: formValues.assetDescription || formValues.assetTitle,
    start_date: startMoment.unix(),
    end_date: endMoment.unix(),
    requestees: formValues.requestees || [],
    status: formValues.isDraft ? 'DRAFT' : 'Requested',
    time_zone: 'Asia/Kolkata',
    can_be_copied: false,
    certificate_provided: false,
    // The shared request-session API requires these regardless of offering type, even though
    // they don't really apply to a physical asset - reuse the closest Asset-form equivalent.
    categories: formValues.livelihoodCategory ? [formValues.livelihoodCategory] : [],
    delivery_mode: 'offline',
    meeting_info: {
      link: '',
      location: '',
    },
    meta: {
      assetType: formValues.assetType,
      livelihoodCategory: formValues.livelihoodCategory,
      assetDescription: formValues.assetDescription,
      estimatedValue: formValues.estimatedValue,
      quantity: formValues.availableQuantity,
    },
  };
}

export const uploadService = async (file: any) => {
  const entityId = `trainingSession-${Date.now()}`;
  const uploaded = await uploadFiles(entityId, [
    { ...file, size: file.size ?? 0 },
  ]);
  const url = uploaded?.data?.[0]?.url;
  if (!url) {
    throw new Error(`Failed to upload file: ${file.name}`);
  }
  const data = uploaded?.data?.[0];
  const [f, s] = data?.type.split('/');
  return {
    name: data?.name,
    link: data?.url,
    sourcePath: data?.sourcePath,
    type: s || f,
    size: data?.size,
  };
};

interface TrainingFormOptionsMapParams {
  provinces?: any[];
  sites?: any[];
  pillers?: any[];
  sessionTypes?: any[];
  targetAudience?: any[];
  deliveryModes?: any[];
  deliveryModeIcons?: Record<string, string>;
}

/**
 * Builds the `optionsMap` consumed by SchemaFormRenderer for the training
 * session form, keyed by each field's `optionsSource` (see TRAINING_FORM_SCHEMA.ts).
 */
export function buildTrainingFormOptionsMap({
  provinces = [],
  sites = [],
  pillers = [],
  sessionTypes = [],
  targetAudience = [],
  deliveryModes = [],
  deliveryModeIcons = {},
}: TrainingFormOptionsMapParams): Record<string, { value: string; label: string }[]> {
  return {
    provinces: provinces.map((province: any) => ({
      value: province._id,
      label: province.name,
    })),
    sites: sites.map((site: any) => ({
      value: site._id,
      label: site.name,
    })),
    pillars: pillers,
    sessionTypes: sessionTypes,
    targetAudienceOptions: targetAudience,
    formatOptions: (Array.isArray(deliveryModes) ? deliveryModes : []).map((mode: any) => ({
      value: mode.value,
      label: mode.label,
      icon: deliveryModeIcons[mode.value?.toLowerCase()] || 'MapPin',
    })),
    certificateOptions: [...CERTIFICATE_OPTIONS],
    recurringOptions: [...RECURRING_OPTIONS],
  };
}
