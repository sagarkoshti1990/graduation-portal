import { LC_ROLES, PARTICIPANT } from '@constants/ROLES';
import moment from 'moment';
import { uploadFiles } from '../project-player/services/projectPlayerService';

export function valueMapping(
  formValues: any,
  isReverseMapping: boolean = false,
  optionMap: any = {},
): any {
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

  if (formValues.isRequestSession) {
    // The actual form fields are the plural `provinces` (single-select) and
    // `sites` (multi-select) - see TRAINING_FORM_SCHEMA. `province`/`site`
    // (singular) are only ever set by RequestSession's handleFieldChange as
    // a province mirror/reset and are NOT where the selected sites live, so
    // read the real fields here instead (falling back to the singular ones
    // for back-compat) or every request went out with sites/requestees empty.
    const resolvedProvince = formValues.provinces ?? province;
    const resolvedSites = formValues.sites ?? site;

    // Requesting a session only needs a handful of fields, plus a few technical
    // fields the backend requires to accept the request (title/agenda/requestees/status).
    return {
      support_offering_type: formValues.support_offering_type || 'training_session',
      provinces: Array.isArray(resolvedProvince) ? resolvedProvince : [resolvedProvince],
      sites: Array.isArray(resolvedSites) ? resolvedSites : (resolvedSites ? [resolvedSites] : []),
      categories: [formValues.categories],
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

  let recommendedForPayload: string[] = [];
  if (Array.isArray(formValues.recommended_for)) {
    recommendedForPayload = formValues.recommended_for;
  } else if (formValues.recommended_for === 'both') {
    recommendedForPayload = ['org_admin', 'user'];
  } else if (formValues.recommended_for) {
    recommendedForPayload = [formValues.recommended_for];
  }

  return {
    ...formValues,
    title:
      formValues?.idp_training_task === 'custom'
        ? formValues?.sessionTypeOther
        : formValues?.title,
    categories: [formValues.categories],
    provinces: [formValues.provinces],
    recommended_for: recommendedForPayload,
    start_date: moment(formValues.start_date).unix(),
    end_date: moment(formValues.end_date).unix(),
    certificate_provided: formValues.certificate_provided === "true",
    can_be_copied: formValues.can_be_copied === "true",
    time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    session_type: 'Public',
    status: formValues.isDraft ? 'DRAFT' : 'PUBLISHED',
    seats_limit: formValues.seats_limit,
    meeting_info: {
      link: formValues.meeting_link,
      location: formValues.location,
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

export function buildTrainingFormOptionsMap({
  provinces = [],
  sites = [],
  pillers = [],
  sessionTypes = [],
  targetAudience = [],
  deliveryModes = [],
  deliveryModeIcons = {},
}: {
  provinces?: any[];
  sites?: any[];
  pillers?: any[];
  sessionTypes?: any[];
  targetAudience?: any[];
  deliveryModes?: any[];
  deliveryModeIcons?: Record<string, string>;
}) {
  const provinceOpts =
    Array.isArray(provinces) && provinces.length > 0
      ? provinces.map((p: any) => ({
          value: p._id || p.id || p.name,
          label: p.name || p.label,
        }))
      : [];

  const siteOpts =
    Array.isArray(sites) && sites.length > 0
      ? sites.map((s: any) => ({
          value: s._id || s.id || s.name,
          label: s.name || s.label,
        }))
      : [];

  return {
    provinces: provinceOpts,
    sites: siteOpts,
    pillars: Array.isArray(pillers) ? pillers : [],
    sessionTypes: Array.isArray(sessionTypes) ? sessionTypes : [],
    targetAudienceOptions: Array.isArray(targetAudience) ? targetAudience : [],
    certificateOptions: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' },
    ],
    recurringOptions: [
      { value: 'true', label: 'Yes — recurring session' },
      { value: 'false', label: 'No — one-off session' },
    ],
    formatOptions: (Array.isArray(deliveryModes) ? deliveryModes : []).map((mode: any) => ({
      value: mode.value,
      label: mode.label,
      icon: deliveryModeIcons[mode.value?.toLowerCase()] || 'MapPin',
    })),
  };
}