import moment from 'moment';

export const parseMomentDate = (val: any) => {
  if (val === undefined || val === null || val === '') return null;
  if (typeof val === 'number') {
    const mom = val < 1e11 ? moment.unix(val) : moment(val);
    return mom.isValid() ? mom : null;
  }
  const str = String(val).trim();
  if (!str) return null;
  if (/^\d+$/.test(str)) {
    const num = Number(str);
    const mom = num < 1e11 ? moment.unix(num) : moment(num);
    return mom.isValid() ? mom : null;
  }
  const mom = moment(str);
  return mom.isValid() ? mom : null;
};

export const formatSessionStartDateTimeParts = (item: any) => {
  if (!item) return { date: '', time: '' };
  const rawStart = item?.start_date || item?.startDate || item?.start_datetime || item?.startDateTime || item?.scheduledDate || item?.date;
  const rawTime = item?.start_time || item?.startTime || item?.time;

  const startMom = parseMomentDate(rawStart);
  if (startMom) {
    const datePart = startMom.format('ddd, D MMM YYYY');
    const timePart = rawTime || startMom.format('HH:mm');
    return { date: datePart, time: timePart };
  }

  if (rawStart) {
    const str = String(rawStart);
    if (str.includes(',')) {
      const parts = str.split(',');
      return { date: parts[0].trim(), time: parts.slice(1).join(',').trim() };
    }
    return { date: str, time: rawTime ? String(rawTime) : '' };
  }

  return { date: '', time: '' };
};

export const formatSessionStartDateTime = (item: any) => {
  const { date, time } = formatSessionStartDateTimeParts(item);
  if (date && time) {
    return `${date}, ${time}`;
  }
  return date || time || '';
};

export const calculateSessionDuration = (item: any) => {
  if (!item) return '';
  const rawStart = item.start_date || item.startDate || item.start_datetime || item.startDateTime || item.scheduledDate || item.date;
  const rawEnd = item.end_date || item.endDate || item.end_datetime || item.endDateTime;

  const startMom = parseMomentDate(rawStart);
  const endMom = parseMomentDate(rawEnd);

  if (startMom && endMom && endMom.isAfter(startMom)) {
    const diffHours = Math.round(endMom.diff(startMom, 'hours', true));
    if (diffHours > 0) {
      return diffHours === 1 ? '1 hour' : `${diffHours} hours`;
    }
  }

  const durationVal = item.duration || item.hours || item.session_duration || item.sessionDuration;
  if (durationVal !== undefined && durationVal !== null && durationVal !== '') {
    const durStr = String(durationVal).trim();
    if (/^\d+$/.test(durStr)) {
      const num = parseInt(durStr, 10);
      return num === 1 ? '1 hour' : `${num} hours`;
    }
    return durStr;
  }

  return '';
};

export const getDeliveryMode = (item: any) => {
  if (!item) return '';
  const meta = item.meta || item.metaInformation || {};
  const rawMode = meta.delivery_mode || meta.deliveryMode || item.delivery_mode || item.deliveryMode || item.mode || item.format || '';
  // API may return delivery_mode as an object ({ id, label, value }) instead of a plain string
  const mode = typeof rawMode === 'object' ? rawMode?.label || rawMode?.value || rawMode?.name || '' : rawMode;
  if (!mode || typeof mode === 'object') return '';
  const trimmed = String(mode).trim();
  if (/^offline$/i.test(trimmed)) return 'Offline';
  if (/^online$/i.test(trimmed)) return 'Online';
  if (/^hybrid$/i.test(trimmed)) return 'Hybrid';
  return trimmed;
};

export const resolveProvinceNames = (rawProvinceData: any, provinceMap: Record<string, string>): string => {
  if (!rawProvinceData) return '';

  let list: any[] = [];
  if (Array.isArray(rawProvinceData)) {
    list = rawProvinceData;
  } else {
    list = [rawProvinceData];
  }

  const resolvedNames: string[] = [];
  for (const p of list) {
    if (!p) continue;
    let valStr = '';
    if (typeof p === 'object') {
      valStr = p.name || p.label || p.title || p._id || p.id || '';
    } else {
      valStr = String(p).trim();
    }

    if (!valStr) continue;

    if (provinceMap[valStr]) {
      resolvedNames.push(provinceMap[valStr]);
    } else if (/^[a-fA-F0-9]{24}$/.test(valStr)) {
      // Do NOT display raw Mongo ObjectIds
      continue;
    } else {
      resolvedNames.push(valStr);
    }
  }

  return resolvedNames.join(', ');
};

/**
 * Returns the translation key for the participant status badge shown in the participant portal headers.
 */
export const getParticipantStatusBadgeKey = (
  status?: string,
  accountStatus?: string,
  pendingChangeRequest?: any[],
): string | null => {
  const normStatus = (status || '').toString().trim().toUpperCase().replace(/\s+/g, '_');
  const normAccount = (accountStatus || '').toString().trim().toUpperCase().replace(/\s+/g, '_');

  const isDropoutRequestSentForApproval = Array.isArray(pendingChangeRequest) && pendingChangeRequest.some(
    (request: any) => request?.action === 'PROGRAM_USER_DROPPING_OUT' && request?.status === 'PENDING'
  );
  if (isDropoutRequestSentForApproval) {
    return 'participantDetail.header.dropoutUnderReview';
  }
  if (normAccount === 'INACTIVE' || normStatus === 'INACTIVE' || normStatus === 'DEACTIVATED') {
    return 'participantDetail.header.inactiveAccount';
  }
  if (normStatus === 'NOT_ELIGIBLE') {
    return 'participantDetail.header.notEligible';
  }
  if (normStatus === 'DROPOUT' || normStatus === 'DROPPED_OUT') {
    return 'participantDetail.header.droppedOut';
  }
  if (normStatus === 'NOT_ONBOARDED') {
    return 'participants.notEnrolled';
  }
  if (normStatus === 'ONBOARDED') {
    return 'participants.enrolled';
  }
  return null;
};

// Statuses for which IDP progress and My Sessions content is hidden in the participant portal.
const RESTRICTED_STATUS_BADGE_KEYS = [
  'participantDetail.header.dropoutUnderReview',
  'participantDetail.header.inactiveAccount',
  'participantDetail.header.notEligible',
  'participantDetail.header.droppedOut',
  'participants.notEnrolled',
];

export const isRestrictedParticipantStatus = (statusBadgeKey?: string | null): boolean =>
  !!statusBadgeKey && RESTRICTED_STATUS_BADGE_KEYS.includes(statusBadgeKey);
