import { LC_ROLES, PARTICIPANT_ROLES } from '@constants/ROLES';
import { CERTIFICATE_OPTIONS, RECURRING_OPTIONS, SUPPORT_CATEGORIES, SUPPORT_OFFERING_TYPE_VALUES } from '@constants/SUPPORT_PROVIDER_CARDS';
import moment from 'moment';
import { uploadFiles } from '../project-player/services/projectPlayerService';

export type SupportOfferingFormType = 'training' | 'additional_service' | 'asset' | string;

// ---------- shared helpers ----------

const firstOf = (val: any) => (Array.isArray(val) ? val[0] : val);
const unwrap = (item: any) => item?.value ?? item;
const toArray = (val: any): any[] => (Array.isArray(val) ? val : val ? [val] : []);

// ---------- API -> form (edit / copy) ----------

// Collapses the stored recommended_for list into the form's single value
const toRecommendedForValue = (list: any): string => {
  const roles = toArray(list).map(unwrap);
  const isLc = roles.some((r: string) => LC_ROLES.includes(r));
  const isParticipant = roles.some((r: string) => PARTICIPANT_ROLES.includes(r));
  if (isLc && isParticipant) return 'both';
  if (isLc) return 'org_admin';
  if (isParticipant) return 'user';
  return '';
};

// API returns unix seconds; the datetime field expects 'YYYY-MM-DDTHH:mm:ss'
const toDateTimeValue = (val: any): string => {
  if (!val) return '';
  const num = Number(val);
  const m = Number.isNaN(num) ? moment(val) : moment(num > 1e12 ? num : num * 1000);
  return m.isValid() ? m.format('YYYY-MM-DDTHH:mm:ss') : '';
};

function mapApiToFormValues(data: any, formType: SupportOfferingFormType): any {
  // Stored as idp_tasks: string[]; Training's select is single-value, Additional Services is multi
  const tasks = toArray(data?.idp_tasks).map(unwrap).filter(Boolean);
  const isTraining = formType === SUPPORT_CATEGORIES.TRAINING;
  const isCustomTask = isTraining && tasks[0] === 'custom';
  return {
    title: data?.title,
    provinces: firstOf(data?.provinces) || '',
    sites: toArray(data?.sites).filter(Boolean).map(String),
    categories: firstOf(data?.categories) || '',
    idp_tasks: isTraining ? (tasks[0] ?? '') : tasks,
    sessionTypeOther: isCustomTask ? data?.title : '',
    description: data?.description,
    learning_objectives: data?.learning_objectives,
    recommended_for: toRecommendedForValue(data.recommended_for),
    certificate_provided: `${data.certificate_provided}`,
    can_be_copied: `${data.can_be_copied}`,
    seats_limit: data?.seats_limit,
    max_capacity: data.seats_limit,
    resources: data?.resources,
    start_date: toDateTimeValue(data?.start_date),
    end_date: toDateTimeValue(data?.end_date),
    delivery_mode: unwrap(data?.delivery_mode) || '',
    location: data?.meeting_info?.location ?? data?.location ?? '',
    meeting_link: data?.meeting_info?.link ?? data?.meeting_link ?? '',
  };
}

// ---------- form -> API (create / update) ----------

const toRecommendedForPayload = (value: any, formType: SupportOfferingFormType): string[] => {
  if (formType === SUPPORT_CATEGORIES.ADDITIONAL_SERVICE || formType === SUPPORT_CATEGORIES.ASSET) return ['user'];
  if (Array.isArray(value)) return value;
  if (value === 'both') return ['org_admin', 'user'];
  return value ? [value] : [];
};

// Training keeps dates optional; other types default to now .. now + 2 years
const toDatePayload = (formValues: any, formType: SupportOfferingFormType) => {
  const isTraining = formType === SUPPORT_CATEGORIES.TRAINING;
  const toUnix = (val: any, fallback: () => moment.Moment) =>
    val ? moment(val).unix() : isTraining ? undefined : fallback().unix();
  return {
    start_date: toUnix(formValues.start_date, () => moment()),
    end_date: toUnix(formValues.end_date, () => moment().add(4, 'years')),
  };
};

// idp_tasks is always string[]; Asset has no task picker so it uses the id from .env
export const toIdpTasksPayload = (value: any, formType?: SupportOfferingFormType): string[] =>
  formType === SUPPORT_CATEGORIES.ASSET
    ? [process.env.ASSET_IDP_TASK_ID].filter(Boolean) as string[]
    : toArray(value).map(unwrap).filter(Boolean);

function mapFormToPayload(formValues: any, formType: SupportOfferingFormType): any {
  return {
    ...formValues,
    title: toArray(formValues?.idp_tasks)[0] === 'custom' ? formValues?.sessionTypeOther : formValues?.title,
    idp_tasks: toIdpTasksPayload(formValues?.idp_tasks, formType),
    categories: [formValues.categories],
    provinces: [formValues.provinces],
    delivery_mode: formValues.delivery_mode || 'offline',
    recommended_for: toRecommendedForPayload(formValues.recommended_for, formType),
    ...toDatePayload(formValues, formType),
    certificate_provided: formValues.certificate_provided === 'true',
    can_be_copied: formValues.can_be_copied === 'true',
    session_type: 'Public',
    status: formValues.isDraft ? 'DRAFT' : 'PUBLISHED',
    meeting_info: {
      link: formValues?.meeting_link,
      location: formValues?.location,
    },
    support_offering_type: formType,
  };
}

// isReverseMapping = true: API response -> form values (edit / copy)
// isReverseMapping = false: form values -> API payload (create / update)
export function valueMapping(
  formValues: any,
  isReverseMapping: boolean = false,
  optionsMap: any,
  formType: SupportOfferingFormType = SUPPORT_CATEGORIES.TRAINING,
): any {
  const effectiveFormType: SupportOfferingFormType = formType || SUPPORT_CATEGORIES.TRAINING;
  return isReverseMapping
    ? mapApiToFormValues(formValues, effectiveFormType)
    : mapFormToPayload(formValues, effectiveFormType);
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
    idp_tasks: toIdpTasksPayload(formValues.idp_tasks),
    description: formValues.description,
    learning_objectives: formValues.learning_objectives,
    start_date: (formValues.start_date ? moment(formValues.start_date) : moment()).unix(),
    end_date: (formValues.end_date
      ? moment(formValues.end_date)
      : (formValues.start_date ? moment(formValues.start_date) : moment()).add(30, 'minutes')
    ).unix(),
    title:
      toArray(formValues.idp_tasks)[0] === 'custom'
        ? formValues.sessionTypeOther
        : formValues.title,
    agenda: formValues.description,
    requestees: formValues.requestees || [],
    recommended_for: formValues.recommended_for?.length ? formValues.recommended_for : ['user'],
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
    recommended_for: formValues.recommended_for?.length ? formValues.recommended_for : ['user'],
    status: formValues.isDraft ? 'DRAFT' : 'Requested',
    time_zone: 'Asia/Kolkata',
    can_be_copied: false,
    certificate_provided: false,
    // The shared request-session API requires these regardless of offering type, even though
    // they don't really apply to a physical asset - reuse the closest Asset-form equivalent.
    categories: formValues.livelihoodCategory ? [formValues.livelihoodCategory] : [],
    idp_tasks: toIdpTasksPayload(null, SUPPORT_CATEGORIES.ASSET),
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

type DraftDefault = string | ((values: any, optionsMap: any) => any);

export interface DraftConfig {
  requiredFields: string[];
  defaults: Record<string, DraftDefault>;
}

const DATE_TIME_FORMAT = 'YYYY-MM-DDTHH:mm:ss';

const isEmptyValue = (val: any) =>
  val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0);

// Fills only the fields the user left empty, in order, so later defaults can use earlier ones
export function applyDraftDefaults(formValues: any, defaults: Record<string, DraftDefault>, optionsMap: any = {}): any {
  return Object.entries(defaults).reduce((next, [name, fallback]) => {
    if (!isEmptyValue(next[name])) return next;
    const value = typeof fallback === 'function' ? fallback(next, optionsMap) : fallback;
    return { ...next, [name]: value };
  }, { ...formValues });
}

const getSelectedSiteLabels = (values: any, optionsMap: any) => {
  const selectedSites: string[] = Array.isArray(values.sites) ? values.sites : [values.sites].filter(Boolean);
  return (optionsMap.sites || [])
    .filter((site: any) => selectedSites.includes(site.value))
    .map((site: any) => site.label)
    .join(', ');
};

// Save Draft only requires `requiredFields`; `defaults` fill the rest so the backend accepts the draft
export const TRAINING_DRAFT_CONFIG: DraftConfig = {
  requiredFields: ['provinces', 'sites', 'categories', 'idp_tasks', 'sessionTypeOther'],
  defaults: {
    description: (values) => (values.idp_tasks === 'custom' ? values.sessionTypeOther : values.title),
    recommended_for: 'user',
    certificate_provided: 'false',
    seats_limit: '10',
    delivery_mode: 'offline',
    location: (values, optionsMap) => (values.delivery_mode === 'online' ? '' : getSelectedSiteLabels(values, optionsMap)),
    start_date: () => moment().format(DATE_TIME_FORMAT),
    end_date: (values) => moment(values.start_date).add(1, 'hour').format(DATE_TIME_FORMAT),
  },
};

export const ADDITIONAL_SERVICE_DRAFT_CONFIG: DraftConfig = {
  requiredFields: ['provinces', 'sites', 'categories', 'title'],
  defaults: {
    description: (values) => values.title,
    seats_limit: '10',
  },
};

export const ASSET_DRAFT_CONFIG: DraftConfig = {
  requiredFields: ['province', 'site', 'assetType', 'livelihoodCategory', 'assetTitle'],
  defaults: {
    assetDescription: (values) => values.assetTitle,
    estimatedValue: '0',
    availableQuantity: '10',
  },
};
