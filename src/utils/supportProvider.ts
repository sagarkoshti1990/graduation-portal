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
    certificate_provided: formValues.certificate_provided === true,
    can_be_copied: formValues.can_be_copied === true,
    time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    session_type: 'Public',
    status: formValues.isDraft ? 'DRAFT' : 'PUBLISHED',
    max_capacity: formValues.max_capacity,
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
