import api from './api';
import { API_ENDPOINTS } from './apiEndpoints';
import { getMentoringEntities, MentoringOption, updateMentorExtension } from './mentoringService';
import { MENTORING_ENTITY_TYPES } from '@constants/SP_MENU_OPTIONS';
import { SUPPORT_OFFERING_TYPE_VALUES } from '@constants/SUPPORT_PROVIDER_CARDS';

export interface SupportDashboardFilters {
  provinces?: string[];
  sites?: string[];
  mentorId?: string;
  supportOfferingType?: string;
  pillar?: string;
  /** Renamed from subCategory — maps to the idp_tasks[] filter on the backend. */
  idpTasks?: string[];
  startDate?: string;
  endDate?: string;
}

interface Aggregate {
  needed: number;
  approved: number;
  delivered: number;
  committed?: number;
}

export interface SupportDashboardSummary {
  totals: Aggregate & {
    committed_sessions?: number;
    committed_services?: number;
    committed_assets?: number;
  };
  by_support_offering_type: (Aggregate & { support_offering_type: string })[];
  monthly: (Aggregate & { month: string })[];
  sessions_per_province: { province: string; sessions_completed: number }[];
  by_province?: (Aggregate & { province: string })[];
}

export interface ByMentorRow {
  mentor_id: string;
  needed: number;
  approved: number;
  /** Total delivered across all support types */
  delivered: number;
  delivered_sessions: number;
  delivered_services: number;
  delivered_assets: number;
  committed_sessions: number;
  committed_services: number;
  committed_assets: number;
}

export interface AssetTotals {
  total_requests: number;
  total_quantity: number;
  total_value: number;
  /** Number of asset requests that have been accepted (session linked) */
  approved_count: number;
  /** Sum of (estimated_value × seats_limit) for accepted requests */
  approved_value: number;
  /** Sum of (estimated_value × attended_count) — field-verified deliveries */
  delivered_value: number;
}

export interface AssetRow {
  request_id: number;
  tenant_code: string;
  requestor_id: string;
  requestee_id: string;
  request_status: string;
  title: string;
  requested_at: string;
  request_month: string;
  session_id: number | null;
  session_status: string | null;
  mentor_id: string | null;
  support_offering_type: string;
  estimated_value: number | null;
  quantity: number | null;
  total_value: number;
  asset_type: string | null;
  livelihood_category: string | null;
  asset_description: string | null;
  provinces: string[];
  sites: string[];
}

export interface AssetsSummary {
  totals: AssetTotals;
  data: AssetRow[];
  count: number;
}

export interface ProviderOption {
  value: string;
  label: string;
}

// Asset approval has its own section, so it is not a support type in the main filter dropdown
const isExcludedSupportType = (option: MentoringOption) =>
  /asset/i.test(`${option.value} ${option.label}`);

const buildParams = (filters: SupportDashboardFilters): Record<string, string> => {
  const params: Record<string, string> = {};
  if (filters.provinces?.length) params.provinces = filters.provinces.join(',');
  if (filters.sites?.length) params.sites = filters.sites.join(',');
  if (filters.mentorId) params.mentor_id = filters.mentorId;
  if (filters.supportOfferingType) params.support_offering_type = filters.supportOfferingType;
  if (filters.pillar) params.pillar = filters.pillar;
  if (filters.idpTasks?.length) params.idp_tasks = filters.idpTasks.join(',');
  if (filters.startDate) params.start_date = filters.startDate;
  if (filters.endDate) params.end_date = filters.endDate;
  return params;
};

export const getSupportDashboardSummary = async (
  filters: SupportDashboardFilters,
): Promise<SupportDashboardSummary> => {
  const response = await api.get(API_ENDPOINTS.SUPPORT_DASHBOARD, {
    params: { ...buildParams(filters), view: 'summary' },
  });
  return response.data?.result;
};

export const getSupportDashboardByMentor = async (
  filters: SupportDashboardFilters,
): Promise<ByMentorRow[]> => {
  const response = await api.get(API_ENDPOINTS.SUPPORT_DASHBOARD, {
    params: { ...buildParams(filters), view: 'by_mentor' },
  });
  return response.data?.result ?? [];
};

export const getSupportDashboardAssets = async (
  filters: SupportDashboardFilters,
  page = 1,
  limit = 20,
): Promise<AssetsSummary> => {
  const response = await api.get(API_ENDPOINTS.SUPPORT_DASHBOARD, {
    params: { ...buildParams(filters), view: 'assets', page: String(page), limit: String(limit) },
  });
  return response.data?.result;
};

export const getSupportTypeOptionsWithExclusion = async (): Promise<MentoringOption[]> => {
  const options = await getMentoringEntities({ value: MENTORING_ENTITY_TYPES.SUPPORT_OFFERING_TYPE });
  return options.filter((option) => !isExcludedSupportType(option));
};

export const getSupportTypeOptions = async (): Promise<MentoringOption[]> => {
  return getMentoringEntities({ value: MENTORING_ENTITY_TYPES.SUPPORT_OFFERING_TYPE });
};

// Pillars depend on the selected support type: trainings use session categories, services and assets use service categories
export const getPillarOptions = async (supportType?: string): Promise<MentoringOption[]> => {
  if (supportType === SUPPORT_OFFERING_TYPE_VALUES.TRAINING_SESSION) {
    return getMentoringEntities({ value: MENTORING_ENTITY_TYPES.SESSION_CATEGORIES });
  }
  if (
    supportType === SUPPORT_OFFERING_TYPE_VALUES.ADDITIONAL_SERVICE ||
    supportType === SUPPORT_OFFERING_TYPE_VALUES.ASSET
  ) {
    return getMentoringEntities({ value: MENTORING_ENTITY_TYPES.ADDITIONAL_SERVICE_CATEGORIES });
  }
  return [];
};

const PROVIDERS_PAGE_SIZE = 100;

/**
 * Providers are the mentor user extensions, labelled by meta.provider_name.
 * Endpoint: GET /mentoring/v1/mentors/list (paged, so every page is collected)
 */
export const getProviderOptions = async (): Promise<ProviderOption[]> => {
  const providers: ProviderOption[] = [];
  try {
    for (let page = 1; ; page++) {
      const response = await api.get(API_ENDPOINTS.MENTORS_LIST, {
        params: { type: 'mentor', notNullFields: 'provider_name', page, limit: PROVIDERS_PAGE_SIZE },
      });
      const result = response.data?.result?.data ?? [];
      const rows: any[] = Array.isArray(result) ? result : [];
      rows.forEach((row) => {
        const label = row.provider_name;
        if (row?.user_id && label) providers.push({ value: String(row.user_id), label });
      });
      if (rows.length < PROVIDERS_PAGE_SIZE) break;
    }
  } catch (error) {
    console.error('Error fetching providers:', error);
  }
  return providers.sort((a, b) => a.label.localeCompare(b.label));
};

// Each support type is committed to on the provider's profile under its own field
export const COMMITMENT_FIELD_BY_SUPPORT_TYPE: Record<string, string> = {
  [SUPPORT_OFFERING_TYPE_VALUES.TRAINING_SESSION]: 'committed_sessions',
  [SUPPORT_OFFERING_TYPE_VALUES.ADDITIONAL_SERVICE]: 'committed_services',
  [SUPPORT_OFFERING_TYPE_VALUES.ASSET]: 'committed_assets',
};

/**
 * Record the units a provider commits to for a support type.
 * Endpoint: POST /mentoring/v1/org-admin/updateMentorExtension
 */
export const recordInterventionCommitment = async (params: {
  providerId: string;
  supportType: string;
  units: number;
}): Promise<void> => {
  const field = COMMITMENT_FIELD_BY_SUPPORT_TYPE[params.supportType];
  if (!field) throw new Error(`Unsupported support type: ${params.supportType}`);
  await updateMentorExtension({
    user_id: params.providerId,
    [field]: String(params.units),
    skipValidation: true,
  });
};
