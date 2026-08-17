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
      ...formValues,
      categories: formValues.categories?.[0],
      idp_training_task: formValues.idp_training_task,
      recommended_for,
      certificate_provided: `${formValues.certificate_provided}`,
      can_be_copied: `${formValues.can_be_copied}`,
      max_capacity: formValues.seats_limit,
    };
  }

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
    delivery_mode: formValues.delivery_mode || 'offline',
    categories: [formValues.categories],
    provinces: [formValues.provinces],
    recommended_for: recommendedForPayload,
    start_date: startDate,
    end_date: endDate,
    certificate_provided: formValues.certificate_provided === true,
    can_be_copied: formValues.can_be_copied === true,
    type: 'Public',
    support_offering_type: effectiveFormType,
    status: formValues.isDraft ? 'DRAFT' : 'PUBLISHED',
    seats_limit: formValues.max_capacity,
    meeting_info: {
      link: formValues?.meeting_link,
      location: formValues?.location,
    },
  };
}

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
    formatOptions: deliveryModes.map((mode: any) => ({
      value: mode.value,
      label: mode.label,
      icon: deliveryModeIcons[mode.value],
    })),
    certificateOptions: [...CERTIFICATE_OPTIONS],
    recurringOptions: [...RECURRING_OPTIONS],
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
