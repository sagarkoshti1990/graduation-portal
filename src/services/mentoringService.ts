import api from './api';
import { API_ENDPOINTS } from './apiEndpoints';

export interface MentoringOption {
  value: string;
  label: string;
}

/**
 * Get mentoring entities by type name
 * (e.g. 'provider_type', 'support_categories', 'training_areas', 'asset_types')
 *
 * Uses POST /mentoring/v1/entity-type/read with { value: <type_name> } in body.
 * The response includes the entity type record along with its nested entities list —
 * so a single call returns everything we need, no second request required.
 *
 * @param params - Params object containing the entity type name to fetch
 * @returns A promise resolving to the formatted list of mentoring options
 */
export const getMentoringEntities = async (
  params: { value: string }
): Promise<MentoringOption[]> => {
  const value = params?.value || '';
  try {
    const response = await api.post(API_ENDPOINTS.MENTORING_READ_ENTITY_TYPE, {
      value: [value],
    });

    const result = response?.data?.result;
    const entityTypeRecord = Array.isArray(result?.entity_types)
      ? result.entity_types[0]
      : result;

    const entitiesList: any[] = entityTypeRecord?.entities ?? [];

    return entitiesList
      .map((item: any) => ({
        value: item.value || String(item.id || ''),
        label: item.label || item.name || item.value || '',
      }))
      .filter((item: any) => Boolean(item.value));
  } catch (error: any) {
    console.error(`Error fetching mentoring entities for '${value}':`, error);
    return [];
  }
};

/**
 * Get session categories (pillars) list
 */
export const getSessionCategories = async (): Promise<MentoringOption[]> => {
  return getMentoringEntities({ value: 'session_categories' });
};

/**
 * Get recommended target audience list
 */
export const getRecommendedFor = async (): Promise<MentoringOption[]> => {
  return getMentoringEntities({ value: 'recommended_for' });
};

/**
 * Get session types by pillar code
 */
export const getSessionTypesByPillar = async (pillarCode: string): Promise<MentoringOption[]> => {
  if (!pillarCode) return [];
  return getMentoringEntities({ value: pillarCode });
};

/**
 * Get delivery mode options (e.g. Online / Offline / Hybrid) list
 */
export const getDeliveryModes = async (): Promise<MentoringOption[]> => {
  return getMentoringEntities({ value: 'delivery_mode' });
};

/**
 * Get certificate provided options list
 */
export const getCertificateProvided = async (): Promise<MentoringOption[]> => {
  return getMentoringEntities({ value: 'certificate_provided' });
};

/**
 * Convert a date value into epoch seconds.
 * Accepts a Date object, epoch number, ISO string, or "DD/MM/YYYY" string.
 * Falls back to the current time (plus an optional offset) when the value is
 * missing or cannot be parsed.
 *
 * @param dateVal - The date value to normalize
 * @param fallbackOffsetSec - Optional offset (in seconds) applied to the fallback "now" value
 * @returns Epoch seconds representing the date
 */
const getEpochSeconds = (dateVal: any, fallbackOffsetSec: number = 0): number => {
  if (!dateVal) {
    return Math.floor(Date.now() / 1000) + fallbackOffsetSec;
  }
  if (typeof dateVal === 'number') return dateVal;

  const parsed = new Date(dateVal).getTime();
  if (!isNaN(parsed)) return Math.floor(parsed / 1000);

  // Handle "DD/MM/YYYY" format if passed
  if (typeof dateVal === 'string' && dateVal.includes('/')) {
    const parts = dateVal.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      const iso = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      const isoMs = new Date(iso).getTime();
      if (!isNaN(isoMs)) return Math.floor(isoMs / 1000);
    }
  }

  return Math.floor(Date.now() / 1000) + fallbackOffsetSec;
};

/**
 * Build/transform raw form values into an API-compliant payload for a Mentoring/Training session
 *
 * @param formValues - Raw form values from the session create/edit form
 * @param isDraft - Whether the session should be saved as a draft
 * @returns The session payload accepted by the create/update session API
 */
export const buildMentoringSessionPayload = (formValues: any, isDraft: boolean = false) => {
  // If startDate is missing, fallback to 1 hour in future (+3600 seconds)
  const startTimestamp = getEpochSeconds(formValues.startDate, 3600);
  const rawEnd = formValues.endDate ? getEpochSeconds(formValues.endDate) : null;

  // API requires start and end to fall on the same calendar day (local time)
  const startDateObj = new Date(startTimestamp * 1000);
  const endOfStartDay = new Date(
    startDateObj.getFullYear(),
    startDateObj.getMonth(),
    startDateObj.getDate(),
    23, 59, 59
  );
  const endOfStartDayTimestamp = Math.floor(endOfStartDay.getTime() / 1000);

  // Guarantee endTimestamp is at least 30 minutes (1800 seconds) after startTimestamp,
  // but never past the end of the start day
  const minEndTimestamp = Math.min(startTimestamp + 1800, endOfStartDayTimestamp);
  let endTimestamp = (rawEnd && rawEnd >= minEndTimestamp) ? rawEnd : minEndTimestamp;
  if (endTimestamp > endOfStartDayTimestamp) {
    endTimestamp = endOfStartDayTimestamp;
  }

  const provincesArray = Array.isArray(formValues.province)
    ? formValues.province
    : formValues.province
    ? [formValues.province]
    : [];

  const sitesArray = Array.isArray(formValues.site)
    ? formValues.site
    : formValues.site
    ? [formValues.site]
    : [];

  let recommendedForArray: string[] = [];
  const rawTarget = formValues.targetAudience || formValues.recommended_for;
  if (rawTarget === 'both' || rawTarget === 'Both') {
    recommendedForArray = ['org_admin', 'user'];
  } else if (typeof rawTarget === 'string') {
    recommendedForArray = [rawTarget];
  } else if (Array.isArray(rawTarget)) {
    recommendedForArray = rawTarget.map((item: any) => typeof item === 'object' ? item.value : item);
  }

  const payload = {
    title: formValues.title || formValues.sessionTitle || formValues.description || 'Training Session',
    description: formValues.description || '',
    training_type: (formValues.formatType || formValues.training_type || 'online').toLowerCase(),
    session_type: formValues.session_type || 'public',
    delivery_mode: formValues.delivery_mode || formValues.formatType || 'online',
    idp_training_task: formValues.idp_training_task || 'general_training',
    can_be_copied: typeof formValues.can_be_copied !== 'undefined'
      ? (formValues.can_be_copied === true || formValues.can_be_copied === 'true')
      : (formValues.recurringSession === 'true' || formValues.recurringSession === true || formValues.recurringSession === 'Yes'),
    certificate_provided: Boolean(
      formValues.certificateProvided === 'true' ||
      formValues.certificateProvided === true ||
      formValues.certificate_provided === 'true' ||
      formValues.certificate_provided === true ||
      formValues.certificateProvided === 'Yes'
    ),
    start_date: startTimestamp,
    end_date: endTimestamp,
    provinces: provincesArray,
    sites: sitesArray,
    recommended_for: recommendedForArray,
    categories: formValues.sessionType ? [formValues.sessionType] : [],
    status: isDraft ? 'DRAFT' : 'PUBLISHED',
    max_capacity: formValues.maxCapacity ? Number(formValues.maxCapacity) : undefined,
    meeting_info: formValues.meeting_info || {
      link: formValues.meetingLink || '',
    },
    location: formValues.venueLocation || '',
  };

  return payload;
};

/**
 * Create/Update Mentoring Session
 * Endpoint: POST /mentoring/v1/sessions/update
 *
 * @param payloadOrFormValues - Session payload or raw form values to create/update
 * @param isDraft - Optional flag if passing formValues
 * @returns A promise resolving to the API response
 */
export const createMentoringSession = async (payloadOrFormValues: any, isDraft?: boolean): Promise<any> => {
  try {
    const payload = payloadOrFormValues.title && payloadOrFormValues.start_date
      ? payloadOrFormValues
      : buildMentoringSessionPayload(payloadOrFormValues, isDraft);

    const response = await api.post(API_ENDPOINTS.MENTORING_CREATE_SESSION, payload);
    return response.data;
  } catch (error: any) {
    // Error is already handled by axios interceptor
    throw error;
  }
};


