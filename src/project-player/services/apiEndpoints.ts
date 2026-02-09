const prefix = '/api';
const templateId = process.env.PROJECT_TEMPLATE_EXTERNAL_ID;

export const API_ENDPOINTS = {
  PROJECT_TEMPLATES_LIST: `${prefix}/project/v1/project/templates/list`,
  CREATE_PROJECT: `${prefix}/project/v1/userProjects/details?templateId=${templateId}`,
  PROJECT_DETAILS: (id: string) =>
    `${prefix}/project/v1/userProjects/details/${id}`,
  GET_CATEGORY_LIST: (id: string) =>
    `${prefix}/project/v1/library/categories/list?parentId=${id}`,
  GET_TEMPLATE: (id: string) =>
    `${prefix}/project/v1/library/categories/details/${id}?getChildren=true`,
  GET_TASK_DETAILS: (ids: string) =>
    `${prefix}/project/v1/project/templates/list?categoryIds=${ids}&groupByCategory=true&taskDetails=true`,
  UPDATE_TASK: (id: string) => `${prefix}/project/v1/userProjects/update/${id}`,
  SUBMIT_INTERVENTION_PLAN: `${prefix}/project/v1/userProjects/createProjectPlan`,
  GET_SOLUTION_DETAILS: (solutionId: string, taskId: string) =>
    `${prefix}/project/v1/userProjects/solutionDetails/${solutionId}?taskId=${taskId}`,
  PRE_SIGNED_URLS: `${prefix}/project/v1/cloud-services/files/preSignedUrls`,
  UPDATE_PROJECT_INFO: (id: string) => `${prefix}/project/v1/userProjects/update/${id}`,
} as const;
