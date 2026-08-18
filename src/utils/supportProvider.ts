import { LC_ROLES, PARTICIPANT } from '@constants/ROLES';
import { CERTIFICATE_OPTIONS, RECURRING_OPTIONS } from '@constants/SUPPORT_PROVIDER_CARDS';
import moment from 'moment';
import { uploadFiles } from '../project-player/services/projectPlayerService';

export type SupportOfferingFormType = 'training' | 'additional_service' | 'asset' | string;

export function valueMapping(
  formValues: any,
  isReverseMapping: boolean = false,
  optionsMap: any,
  formType: SupportOfferingFormType = 'training',
): any {
  const effectiveFormType: SupportOfferingFormType = formType || 'training';

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
    return {
      // ...formValues,
      title: formValues?.title,
      provinces: formValues?.provinces,
      sites: formValues?.sites,
      categories: formValues.categories?.[0],
      idp_training_task: formValues.idp_training_task,
      sessionTypeOther: formValues.idp_training_task === "custom" ? formValues?.title : "",
      description: formValues?.description,
      learning_objectives: formValues?.learning_objectives,
      recommended_for,
      certificate_provided: `${formValues.certificate_provided}`,
      seats_limit: formValues?.seats_limit,
      can_be_copied: `${formValues.can_be_copied}`,
      max_capacity: formValues.seats_limit,
    };
  }

  const { province, site, ...restFormValues } = formValues;

  let recommendedForPayload: string[] = [];
  if (effectiveFormType === 'additional_service' || effectiveFormType === 'asset') {
    recommendedForPayload = ['user'];
  } else if (Array.isArray(formValues.recommended_for)) {
    recommendedForPayload = formValues.recommended_for;
  } else if (formValues.recommended_for === 'both') {
    recommendedForPayload = ['org_admin', 'user'];
  } else if (formValues.recommended_for) {
    recommendedForPayload = [formValues.recommended_for];
  }

  let startDate, endDate;
  if (effectiveFormType === 'training') {
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
    categories: formValues.categories
      ? (Array.isArray(formValues.categories) ? formValues.categories.filter(Boolean) : [formValues.categories])
      : (formValues.idp_training_task ? [formValues.idp_training_task] : []),
    delivery_mode: formValues.delivery_mode || 'offline',
    provinces: [formValues.provinces],
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
    support_offering_type: formValues.support_offering_type || 'training_session',
    provinces: Array.isArray(resolvedProvince) ? resolvedProvince : [resolvedProvince],
    sites: Array.isArray(resolvedSites) ? resolvedSites : (resolvedSites ? [resolvedSites] : []),
    categories: formValues.categories
      ? (Array.isArray(formValues.categories) ? formValues.categories.filter(Boolean) : [formValues.categories])
      : (formValues.idp_training_task ? [formValues.idp_training_task] : []),
    idp_training_task: formValues.idp_training_task,
    description: formValues.description,
    learning_objectives: formValues.learning_objectives,
    start_date: moment(formValues.start_date).unix(),
    end_date: moment(formValues.end_date).unix(),
    title: formValues.title,
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

export const uploadService = async (file : any) => {
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
