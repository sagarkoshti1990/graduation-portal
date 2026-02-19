import api from './api';
import { API_ENDPOINTS } from './apiEndpoints';
import logger from '@utils/logger';
import { STORAGE_KEYS } from '@constants/STORAGE_KEYS';
import offlineStorage from './offlineStorage';

/**
 * Interface for signed URL response
 */
export interface SignedUrlResponse {
  success: boolean;
  message: string;
  result: {
    signedUrl: string;
    filePath: string;
    destFilePath: string;
  };
}

/**
 * Interface for bulk user create response
 */
export interface BulkUserCreateResponse {
  success: boolean;
  message: string;
  result: {
    id: number;
    name: string;
    input_path: string;
    type: string;
    organization_id: number;
    created_by: number;
    tenant_code: string;
    uploadType: string;
    status: string;
    created_at: string;
    updated_at: string;
  };
}

/**
 * Step 1: Get signed URL for file upload
 * Requests a pre-signed S3 URL from the backend to upload the CSV file directly to S3
 * @param fileName - Name of the CSV file
 * @returns Promise with signed URL response
 */
export const getSignedUrl = async (fileName: string): Promise<SignedUrlResponse> => {
  try {
    const response = await api.get<SignedUrlResponse>(API_ENDPOINTS.GET_SIGNED_URL, {
      params: { fileName },
    });
    
    return response.data;
  } catch (error: any) {
    logger.error('Error getting signed URL:', error);
    throw error;
  }
};

/**
 * Step 2: Upload file to signed URL
 * Uploads the CSV file directly to S3 using the pre-signed URL (no headers needed for S3)
 * @param signedUrl - The signed URL from Step 1
 * @param file - The CSV file to upload
 * @returns Promise that resolves when upload is complete
 */
export const uploadFileToSignedUrl = async (
  signedUrl: string,
  file: File
): Promise<void> => {
  try {
    // Use fetch for direct S3 upload - S3 signed URLs don't accept extra headers
    const uploadResponse = await fetch(signedUrl, {
      method: 'PUT',
      body: file,
    });
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`File upload failed: ${uploadResponse.status} ${uploadResponse.statusText} - ${errorText}`);
    }
  } catch (error: any) {
    logger.error('Error uploading file to signed URL:', error);
    throw error;
  }
};

/**
 * Step 3: Trigger bulk user creation
 * Triggers the backend to process the uploaded CSV file and create users in bulk
 * Uses Postman-compatible headers (x-tenant-code, orgId) instead of default interceptor headers
 * @param filePath - The file path from Step 1 response
 * @param editableFields - Fields that can be edited (default: ["name", "email"])
 * @param uploadType - Type of upload: "CREATE", "UPLOAD", or "INVITE"
 * @returns Promise with bulk user create response
 */
export const bulkUserCreate = async (
  filePath: string,
  editableFields: string[] = ['name', 'email'],
  uploadType: 'CREATE' | 'UPLOAD' | 'INVITE' = 'UPLOAD'
): Promise<BulkUserCreateResponse> => {
  try {
    const requestBody = {
      file_path: filePath,
      editable_fields: editableFields,
      upload_type: uploadType,
    };
    
    // Get organization and tenant codes from stored user data
    const userData = await offlineStorage.read<any>(STORAGE_KEYS.AUTH_USER);
    const tenantCode = userData?.tenant_code;
    const orgCode = userData?.organizations?.[0]?.code;
    
    console.log('=== BULK UPLOAD API HEADERS ===');
    console.log('OrgId from login response:', orgCode);
    console.log('Tenant Code from login response:', tenantCode);
    
    // Set headers as required by API (orgid, tenantid for admin override)
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // API expects 'orgid' (lowercase) and 'x-tenant-code' headers for admin override
    if (!orgCode) {
      throw new Error('Organization code (orgid) is required but not found in user data');
    }
    
    if (!tenantCode) {
      throw new Error('Tenant code (x-tenant-code) is required but not found in user data');
    }
    
    headers['orgid'] = orgCode;
    headers['tenantid'] = tenantCode;
    
    console.log('Headers being sent:', headers);
    
    // Remove interceptor's default headers (tenant, organization) and use API-specific headers (x-tenant-code, orgId)
    // This is necessary because the bulkUserCreate API endpoint expects specific header names that differ from
    // the default interceptor headers, and having both sets of headers can cause conflicts or validation errors
    const interceptorId = api.interceptors.request.use(
      (config) => {
        if (config.headers) {
          delete config.headers['tenant'];
          delete config.headers['organization'];
        }
        api.interceptors.request.eject(interceptorId);
        return config;
      },
      (error) => {
        api.interceptors.request.eject(interceptorId);
        return Promise.reject(error);
      }
    );
    
    const response = await api.post<BulkUserCreateResponse>(
      API_ENDPOINTS.BULK_USER_CREATE,
      requestBody,
      {
        headers,
      }
    );
    
    return response.data;
  } catch (error: any) {
    logger.error('Error triggering bulk user create:', error);
    throw error;
  }
};
