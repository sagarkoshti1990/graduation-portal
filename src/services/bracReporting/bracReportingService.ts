import axios, { AxiosInstance } from 'axios';
import { getToken } from '../api';
import { isAndroid } from '@utils/platform';
import logger from '@utils/logger';
import { BRAC_REPORTING_ENDPOINTS } from './bracReportingEndpoints';
import type { LcDashboardOverviewResponse } from '../../screens/LcDashboard/utils/reportingMetrics';
import type { ParticipantOutcomesResponse } from '../../screens/LcDashboard/utils/outcomesTypes';
import type {
  GraduationOverviewResponse,
  GraduationReadinessResponse,
} from '../../screens/LcDashboard/utils/graduationTypes';

// Type declaration for process.env (injected by webpack DefinePlugin on web, available in React Native)
declare const process: {
  env: Record<string, string | undefined>;
};

const getReportingBaseUrl = (): string => {
  // @ts-ignore - process.env is injected by webpack DefinePlugin on web
  const base = (process.env.BRAC_REPORTING_API_BASE_URL || '').trim();
  return base.replace(/\/$/, '');
};

const createReportingClient = (): AxiosInstance => {
  const client = axios.create({
    timeout: 60000,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/plain, */*',
      // @ts-ignore - process.env is injected by webpack DefinePlugin on web
      'internal-access-token': process.env.INTERNAL_ACCESS_TOKEN || '',
      // @ts-ignore - process.env is injected by webpack DefinePlugin on web
      ...(!isAndroid ? {} : { origin: process.env.ORIGIN || '' }),
    },
  });

  client.interceptors.request.use(async config => {
    const baseURL = getReportingBaseUrl();
    if (!baseURL) {
      throw new Error(
        'BRAC_REPORTING_API_BASE_URL is not configured. Add it to your .env file.',
      );
    }
    config.baseURL = baseURL;

    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return client;
};

const reportingClient = createReportingClient();

export const fetchLcDashboardOverview = async (
  coachId: string | number,
): Promise<LcDashboardOverviewResponse> => {
  const response = await reportingClient.get(BRAC_REPORTING_ENDPOINTS.OVERVIEW, {
    params: { coachId },
  });
  return response.data;
};

export const fetchParticipantOutcomes = async (
  participantId: string | number,
): Promise<ParticipantOutcomesResponse> => {
  const response = await reportingClient.get(BRAC_REPORTING_ENDPOINTS.OUTCOMES, {
    params: { participantId },
  });
  return response.data;
};

export const fetchGraduationOverview = async (
  coachId: string | number,
): Promise<GraduationOverviewResponse> => {
  const response = await reportingClient.get(BRAC_REPORTING_ENDPOINTS.GRADUATION_OVERVIEW, {
    params: { coachId },
  });
  return response.data;
};

export const fetchGraduationReadiness = async (
  participantId: string | number,
): Promise<GraduationReadinessResponse> => {
  const response = await reportingClient.get(BRAC_REPORTING_ENDPOINTS.GRADUATION_READINESS, {
    params: { participantId },
  });
  return response.data;
};

export const deleteAllBracReportingRawData = async (): Promise<unknown> => {
  const path = BRAC_REPORTING_ENDPOINTS.DELETE_RAW_DATA || '/';
  const response = await reportingClient.delete(path);
  return response.data;
};

export const getBracReportingBaseUrl = getReportingBaseUrl;

export const logReportingConfig = (): void => {
  const base = getReportingBaseUrl();
  if (!base) {
    logger.warn('BRAC reporting API base URL is empty');
  }
};
