// API utility functions for Project Player
import { ApiResponse } from '../types/components.types';

// Helper to get API config from global context or config
let API_CONFIG = {
  baseUrl: '/api',
  accessToken: '',
};

// Set API configuration (called from ProjectProvider or components)
export const setApiConfig = (config: {
  baseUrl?: string;
  accessToken?: string;
}) => {
  if (config.baseUrl) API_CONFIG.baseUrl = config.baseUrl;
  if (config.accessToken) API_CONFIG.accessToken = config.accessToken;
};

// Get auth headers
const getHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (API_CONFIG.accessToken) {
    headers['Authorization'] = `Bearer ${API_CONFIG.accessToken}`;
  }

  return headers;
};

export const api = {
  // Get template details
  getTemplateDetails: async (solutionId: string): Promise<ApiResponse<any>> => {
    try {
      const response = await fetch(
        `${API_CONFIG.baseUrl}/template/details/${solutionId}`,
        { headers: getHeaders() },
      );
      if (!response.ok) {
        return {
          data: null,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }
      const data = await response.json();
      return { data };
    } catch (error) {
      return { data: null, error: (error as Error).message };
    }
  },

  // Get project details
  getProjectDetails: async (projectId: string): Promise<ApiResponse<any>> => {
    try {
      const response = await fetch(
        `${API_CONFIG.baseUrl}/project/details/${projectId}`,
        { headers: getHeaders() },
      );
      const data = await response.json();
      return { data };
    } catch (error) {
      return { data: null, error: (error as Error).message };
    }
  },

  // Update task status
  updateTaskStatus: async (
    projectId: string,
    taskId: string,
    status: string,
  ): Promise<ApiResponse<any>> => {
    try {
      const response = await fetch(
        `${API_CONFIG.baseUrl}/project/${projectId}/task/${taskId}`,
        {
          method: 'PATCH',
          headers: getHeaders(),
          body: JSON.stringify({ status }),
        },
      );
      const data = await response.json();
      return { data };
    } catch (error) {
      return { data: null, error: (error as Error).message };
    }
  },

  // Upload file
  uploadFile: async (
    projectId: string,
    taskId: string,
    file: File,
  ): Promise<ApiResponse<any>> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const headers: Record<string, string> = {};
      if (API_CONFIG.accessToken) {
        headers['Authorization'] = `Bearer ${API_CONFIG.accessToken}`;
      }

      const response = await fetch(
        `${API_CONFIG.baseUrl}/project/${projectId}/task/${taskId}/upload`,
        {
          method: 'POST',
          headers,
          body: formData,
        },
      );
      const data = await response.json();
      return { data };
    } catch (error) {
      return { data: null, error: (error as Error).message };
    }
  },

  // Add custom task
  addTask: async (
    projectId: string,
    taskData: Record<string, unknown>,
  ): Promise<ApiResponse<unknown>> => {
    try {
      const response = await fetch(
        `${API_CONFIG.baseUrl}/project/${projectId}/task`,
        {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(taskData),
        },
      );
      const data = await response.json();
      return { data };
    } catch (error) {
      return { data: null, error: (error as Error).message };
    }
  },
};
