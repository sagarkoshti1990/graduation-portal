/**
 * Change Requests Service
 * Service functions for the Review Requests (tenant_admin approval) screen.
 * Handles listing and approving/rejecting changeRequests documents.
 */

import api from './api';
import { API_ENDPOINTS } from './apiEndpoints';

export type ChangeRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type ChangeRequestAction = 'USER_PROJECT_TEMPLATE_CHANGE' | 'PROGRAM_USER_DROPPING_OUT';

export interface ChangeRequestListParams {
  programId:string; 
  status: ChangeRequestStatus;
  action?: ChangeRequestAction;
  province?: string;
  site?: string;
  pageNo?: number;
  pageSize?: number;
}

export interface ChangeSummaryFromChange {
  oldRootCat?: string | null;
  oldLivelihoodCat?: string | null;
}

export interface ChangeSummaryToChange {
  newRootCat?: string | null;
  newLivelihoodCat?: string | null;
}

export interface ChangeRequestRecord {
  _id: string;
  action: ChangeRequestAction;
  status: ChangeRequestStatus;
  entityId: string;
  requestorId: string;
  programId?: string;
  tenantId?: string;
  changePayload?: any;
  changeSummary?: {
    fromChange?: ChangeSummaryFromChange | null;
    toChange?: ChangeSummaryToChange | null;
    keywords?: string[];
  } | null;
  entityName?: string | null;
  province?: string | null;
  site?: string | null;
  requestorName?: string | null;
  createdAt?: string;
  updatedAt?: string;
  decidedAt?: string;
  decidedBy?: string;
  reason?: string;
}

export interface ChangeRequestListResponse {
  data: ChangeRequestRecord[];
  count: number;
}

/**
 * List change requests (paginated, filterable by status/action/province/site).
 *
 * @param params - list query parameters
 * @returns A promise resolving to { data, count }
 */
export const listChangeRequests = async (
  params: ChangeRequestListParams,
): Promise<ChangeRequestListResponse> => {
  try {
    const { programId, status, action, province, site, pageNo = 1, pageSize = 10 } = params;

    const queryParams = new URLSearchParams({
      programId,
      status,
      page: pageNo.toString(),
      limit: pageSize.toString(),
    });

    if (action) queryParams.append('action', action);
    if (province) queryParams.append('province', province);
    if (site) queryParams.append('site', site);

    const endpoint = `${API_ENDPOINTS.CHANGE_REQUESTS_LIST}?${queryParams.toString()}`;

    const response = await api.get<{ result?: ChangeRequestRecord[]; data?: ChangeRequestRecord[]; count?: number }>(
      endpoint,
    );

    const body = response.data || {};
    return {
      data: body.result || body.data || [],
      count: body.count ?? 0,
    };
  } catch (error) {
    // Error is already handled by axios interceptor
    throw error;
  }
};

/**
 * Approve or reject a pending change request.
 *
 * @param params - decision parameters
 * @returns A promise resolving to the API response
 */
export const decideChangeRequest = async (params: {
  id: string;
  decision: 'APPROVED' | 'REJECTED';
  reason?: string;
}): Promise<any> => {
  try {
    const { id, decision, reason } = params;

    const requestBody: Record<string, any> = { id, decision };
    if (reason) requestBody.reason = reason;

    const response = await api.post(API_ENDPOINTS.CHANGE_REQUESTS_DECISION, requestBody);

    return response.data;
  } catch (error) {
    // Error is already handled by axios interceptor
    throw error;
  }
};
