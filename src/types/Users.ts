/**
 * User Management Type Definitions
 * Type definitions for User Management screen
 */

/**
 * Role data from API
 */
export interface Role {
  id: number;
  title: string;
  user_type: number;
  visibility: string;
  label: string;
  status: string;
  organization_id: number;
  tenant_code: string;
}

/**
 * Province Entity Interface
 * Structure for province entities from API
 */
export interface ProvinceEntity {
  _id: string;
  externalId: string;
  name: string;
  locationId: string;
}

/**
 * Site Entity Interface
 * Structure for site entities from API
 */
export interface SiteEntity {
  _id: string;
  externalId?: string;
  name: string;
  locationId?: string;
}

/**
 * Entity Types List Response
 * Response structure from the entity types API
 */
export interface EntityTypesListResponse {
  message: string;
  status: number;
  result: Array<{
    _id: string;
    name: string;
  }>;
}

/**
 * User Search Parameters
 * Parameters for searching/filtering users
 */
export interface UserSearchParams {
  tenant_code?: string;
  type?: string;
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
  province?: string;
  site?: string;
}

/**
 * User Search Response
 * Response structure from user search API
 */
export interface UserSearchResponse {
  responseCode: string;
  message: string;
  result: {
    data: any[];
    count?: number;
    total?: number;
  };
}

/**
 * Roles List Parameters
 * Parameters for fetching roles list
 */
export interface RolesListParams {
  page?: number;
  limit?: number;
}

/**
 * Roles List Response
 * Response structure from roles list API
 */
export interface RolesListResponse {
  responseCode: string;
  message: string;
  result: {
    data: Role[];
    count: number;
  };
}

/**
 * Admin User Management Data
 * Type definition for User Management table data
 */
export interface AdminUserManagementData {
  id: string;
  name: string;
  email: string;
  role: 'BRAC admin' | 'Supervisor' | 'Linkage Champion' | 'Participant';
  status: 'Active' | 'Deactivated';
  province: string;
  lastLogin: string;
  extra:any;
  user_organizations?: any[];
  details: {
    type: 'assigned' | 'progress';
    value: number; // For assigned: count, for progress: percentage
  } | null;
}
