import type { FormField, FormSection } from '@components/SchemaFormRenderer/type';
import { SESSION_MIN_LEAD_MINUTES } from './TRAINING_FORM_SCHEMA';

export const ADDITIONAL_SERVICES_SCHEMA = (hideFileds: string[] = [], originalStartDate?: string): FormSection[] => {
  const allTabs: FormSection[] = [
    // ─── Tab 1: Service Details ───────────────────────────────────────────────
    {
      type: 'tab',
      id: 'serviceDetails',
      title: {
        key: 'supportProvider.additionalServicesForm.tabs.serviceDetails',
        fallback: 'Service Details',
      },
      icon: 'FileText',
      children: [
        {
          type: 'section',
          id: 'additionalServiceDetails',
          title: {
            key: 'supportProvider.additionalServicesForm.step1.title',
            fallback: 'Additional Service Details',
          },
          subTitle: {
            key: 'supportProvider.additionalServicesForm.step1.subTitle',
            fallback: 'Fields marked * are required',
          },
          rows: [
            {
              fields: [
                ...(hideFileds.includes('provinces') ? [] : [{
                  name: 'provinces',
                  type: 'select',
                  required: true,
                  label: { key: 'province', fallback: 'Province' },
                  placeholder: { key: 'provincePlaceholder', fallback: 'Select province' },
                  optionsSource: 'provinces',
                  validation: [
                    {
                      rule: 'required',
                      message: {
                        key: 'errors.provinceRequired',
                        fallback: 'Province is required',
                      },
                    },
                  ],
                }]),
                ...(hideFileds.includes('sites') ? [] : [{
                  name: 'sites',
                  type: 'multiselect',
                  required: true,
                  label: { key: 'site', fallback: 'Site' },
                  placeholder: { key: 'sitePlaceholder', fallback: 'Select province first' },
                  placeholderWhenReady: {
                    key: 'sitePlaceholderReady',
                    fallback: 'Select site',
                  },
                  optionsSource: 'sites',
                  dependsOn: 'provinces',
                  disabledWhen: { field: 'provinces', empty: true },
                  validation: [
                    {
                      rule: 'required',
                      message: {
                        key: 'errors.siteRequired',
                        fallback: 'Site is required',
                      },
                    },
                  ],
                }]),
              ] as FormField[],
            },
            {
              fields: [
                ...(hideFileds.includes('categories') ? [] : [{
                  name: 'categories',
                  type: 'pillselect',
                  required: true,
                  label: { key: 'servicesCategory', fallback: 'Services Category' },
                  optionsSource: 'pillars',
                  validation: [
                    {
                      rule: 'required',
                      message: {
                        key: 'errors.servicesCategoryRequired',
                        fallback: 'Services category is required',
                      },
                    },
                  ],
                }]),
              ] as FormField[],
            },
            {
              fields: [
                ...(hideFileds.includes('idp_additional_services_tasks') ? [] : [{
                  name: 'idp_additional_services_tasks',
                  type: 'pillmultiselect',
                  label: { key: 'servicesCategory', fallback: 'Tags' },
                  optionsSource: 'sessionTypes',
                  dependsOn: 'categories',
                  visibleIf: [
                    { name: 'categories', value: 'other_attention', operator: '!=' },
                  ]
                }]),
              ] as FormField[],
            },
            {
              fields: [
                ...(hideFileds.includes('title') ? [] : [{
                  name: 'title',
                  type: 'text',
                  required: true,
                  label: { key: 'servicesTitle', fallback: 'Services Title' },
                  placeholder: { key: 'servicesTitlePlaceholder', fallback: 'Name of this service...' },
                  validation: [
                    {
                      rule: 'required',
                      message: {
                        key: 'errors.servicesTitleRequired',
                        fallback: 'Services title is required',
                      },
                    },
                  ],
                }]),
              ] as FormField[],
            },
            {
              fields: [
                ...(hideFileds.includes('description') ? [] : [{
                  name: 'description',
                  type: 'textarea',
                  required: true,
                  label: { key: 'servicesDescription', fallback: 'Services Description' },
                  placeholder: {
                    key: 'servicesDescriptionPlaceholder',
                    fallback: 'Describe what this service provides and who it benefits...',
                  },
                  validation: [
                    {
                      rule: 'required',
                      message: {
                        key: 'errors.servicesDescriptionRequired',
                        fallback: 'Services description is required',
                      },
                    },
                  ],
                }]),
              ] as FormField[],
            },
            ...(hideFileds.includes('seats_limit') ? [] : [{
              fields: [
                {
                  name: 'seats_limit',
                  type: 'text',
                  required: true,
                  label: { key: 'numberOfParticipants', fallback: 'Number of Participants' },
                  placeholder: { key: 'numberOfParticipantsPlaceholder', fallback: 'Number of participants who can avail this service, e.g. 20' },
                  inputProps: { keyboardType: 'numeric' },
                  validateOnChange: true,
                  validation: [
                    {
                      rule: 'required',
                      message: {
                        key: 'errors.numberOfParticipantsRequired',
                        fallback: 'Number of participants is required',
                      },
                    },
                    {
                      rule: 'pattern',
                      value: '^[1-9][0-9]*$',
                      message: {
                        key: 'errors.numberOfParticipantsInvalid',
                        fallback: 'Please enter a valid number',
                      },
                    },
                  ],
                },
              ] as FormField[],
            }]),
          ],
        },
        {
          type: 'section',
          id: 'serviceAvailability',
          title: {
            key: 'supportProvider.additionalServicesForm.step1.availabilityTitle',
            fallback: 'Service Availability',
          },
          rows: [
            {
              fields: [
                ...(hideFileds.includes('start_date') ? [] : [{
                  name: 'start_date',
                  type: 'datetime',
                  required: false,
                  label: { key: 'startDate', fallback: 'Start Date' },
                  placeholder: { key: 'start_datePlaceholder', fallback: 'DD/MM/YYYY HH:MM' },
                  validation: [
                    {
                      rule: 'dateNotInPast',
                      message: {
                        key: 'errors.dateNotInPast',
                        fallback: 'Past dates are not allowed.',
                      },
                    },
                    {
                      rule: 'minLeadTime',
                      value: { minutes: SESSION_MIN_LEAD_MINUTES, ignoreValue: originalStartDate },
                      message: {
                        key: 'errors.sessionMinLeadTime',
                        fallback: `Start date must be at least ${SESSION_MIN_LEAD_MINUTES} minutes from now.`,
                      },
                    },
                    {
                      rule: "dateCompare",
                      value: {
                        field: "end_date",
                        operator: "<="
                      },
                      message: {
                        key: "errors.dateCompare",
                        fallback: "Start Date must be before or equal to End Date."
                      }
                    }
                  ],
                }]),
              ] as FormField[],
            },
            {
              fields: [
                ...(hideFileds.includes('end_date') ? [] : [{
                  name: 'end_date',
                  type: 'datetime',
                  required: false,
                  label: { key: 'endDate', fallback: 'End Date' },
                  placeholder: { key: 'end_datePlaceholder', fallback: 'DD/MM/YYYY HH:MM' },
                  validation: [
                    {
                      rule: 'dateNotInPast',
                      message: {
                        key: 'errors.dateNotInPast',
                        fallback: 'Past dates are not allowed.',
                      },
                    },
                    {
                      rule: "dateCompare",
                      value: {
                        field: "start_date",
                        operator: ">="
                      },
                      message: {
                        key: "errors.dateCompareStartDate",
                        fallback: "End Date must be after or equal to Start Date."
                      }
                    }
                  ],
                }]),
              ] as FormField[],
            },
            ...(hideFileds.includes('location') ? [] : [{
              fields: [
                {
                  name: 'location',
                  type: 'text',
                  required: false,
                  label: { key: 'serviceLocation', fallback: 'Location where service is provided' },
                  placeholder: { key: 'serviceLocationPlaceholder', fallback: "Address or indicate 'Online / Remote'..." },
                },
              ] as FormField[],
            }]),
            ...(hideFileds.includes('learning_objectives') ? [] : [{
              fields: [
                {
                  name: 'learning_objectives',
                  type: 'textarea',
                  required: false,
                  label: { key: 'eligibilityCriteria', fallback: 'Eligibility Criteria' },
                  placeholder: { key: 'eligibilityCriteriaPlaceholder', fallback: 'Who can access this service? Any specific requirements?' },
                },
              ] as FormField[],
            }]),
            ...(hideFileds.includes('resources') ? [] : [{
              fields: [
                {
                  name: 'resources',
                  type: 'file',
                  multiple: true,
                  required: false,
                  showOptionalTag: true,
                  label: {
                    key: 'supportProvider.additionalServicesForm.step1.resourceContent',
                    fallback: 'Resource Content / Documents',
                  },
                  subTitle: {
                    key: 'supportProvider.additionalServicesForm.step1.resourceUploadSub',
                    fallback: 'Upload PDF or Word service materials or guidelines (Max 10 MB per file)',
                  },
                  placeholder: {
                    key: 'supportProvider.additionalServicesForm.step1.uploadPrompt',
                    fallback: 'Click to browse or upload PDF / Word documents',
                  },
                  validation: [
                    {
                      rule: 'fileType',
                      value: [
                        'application/pdf',
                        'application/msword',
                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                      ],
                      message: {
                        key: 'errors.fileType',
                        fallback: 'Only PDF and DOC files are allowed.',
                      },
                    },
                    {
                      rule: 'fileSize',
                      value: 10,
                      message: {
                        key: 'errors.fileSize10',
                        fallback: 'Maximum file size is 10 MB.',
                      },
                    },
                  ],
                },
              ] as FormField[],
            }]),
          ],
        },
      ],
    },

    // ─── Tab 2: Review & Publish ───────────────────────────────────────────────
    {
      type: 'tab',
      id: 'review',
      title: {
        key: 'supportProvider.additionalServicesForm.tabs.review',
        fallback: 'Review & Publish',
      },
      icon: 'Check',
      children: [
        {
          type: 'section',
          id: 'reviewPublishSection',
          title: {
            key: 'supportProvider.additionalServicesForm.step2.title',
            fallback: 'Review & Publish',
          },
          hint: {
            title: {
              key: 'supportProvider.additionalServicesForm.step2.infoTitle',
              fallback: 'Before you publish:',
            },
            bullets: [
              {
                key: 'supportProvider.additionalServicesForm.step2.infoBullet1',
                fallback: 'This support will be visible to all Coaches in the GBL network',
              },
              {
                key: 'supportProvider.additionalServicesForm.step2.infoBullet2',
                fallback: 'Coaches can submit requests on behalf of participants',
              },
              {
                key: 'supportProvider.additionalServicesForm.step2.infoBullet3',
                fallback: "You'll receive notifications when requests are submitted",
              },
            ],
          },
          children: [
            {
              type: 'section',
              id: 'reviewServiceDetails',
              title: {
                key: 'supportProvider.additionalServicesForm.step2.serviceDetailsTitle',
                fallback: 'Service Details',
              },
              rows: [
                ...(hideFileds.includes('provinces') ? [] : [{
                  fields: [
                    {
                      type: 'view',
                      name: 'provinces',
                      optionsSource: 'provinces',
                      label: {
                        key: 'province',
                        fallback: 'Province',
                      },
                    },
                  ] as FormField[],
                }]),
                ...(hideFileds.includes('sites') ? [] : [{
                  fields: [
                    {
                      type: 'view',
                      name: 'sites',
                      optionsSource: 'sites',
                      label: {
                        key: 'site',
                        fallback: 'Site',
                      },
                    },
                  ] as FormField[],
                }]),
                ...(hideFileds.includes('categories') ? [] : [{
                  fields: [
                    {
                      type: 'view',
                      name: 'categories',
                      optionsSource: 'pillars',
                      label: {
                        key: 'servicesCategory',
                        fallback: 'Category',
                      },
                    },
                  ] as FormField[],
                }]),
                ...(hideFileds.includes('idp_additional_services_tasks') ? [] : [{
                  fields: [
                    {
                      type: 'view',
                      name: 'idp_additional_services_tasks',
                      optionsSource: 'sessionTypes',
                      label: {
                        key: 'servicesCategory',
                        fallback: 'Tags',
                      },
                    },
                  ] as FormField[],
                }]),
                ...(hideFileds.includes('title') ? [] : [{
                  fields: [
                    {
                      name: 'title',
                      type: 'view',
                      label: { key: 'servicesTitle', fallback: 'Title' },
                    },
                  ] as FormField[],
                }]),
                ...(hideFileds.includes('start_date') ? [] : [{
                  fields: [
                    {
                      name: 'start_date',
                      type: 'view',
                      displayFormat: "dateFormat@DD-MM-YYYY hh:mm A",
                      label: { key: 'startDate', fallback: 'Start Date' },
                    },
                  ] as FormField[],
                }]),
                ...(hideFileds.includes('end_date') ? [] : [{
                  fields: [
                    {
                      name: 'end_date',
                      type: 'view',
                      displayFormat: "dateFormat@DD-MM-YYYY hh:mm A",
                      label: { key: 'endDate', fallback: 'End Date' },
                    },
                  ] as FormField[],
                }]),
                ...(hideFileds.includes('seats_limit') ? [] : [{
                  fields: [
                    {
                      name: 'seats_limit',
                      type: 'view',
                      label: { key: 'numberOfParticipants', fallback: 'Number of Participants' },
                    },
                  ] as FormField[],
                }]),
                ...(hideFileds.includes('location') ? [] : [{
                  fields: [
                    {
                      name: 'location',
                      type: 'view',
                      label: { key: 'serviceLocation', fallback: 'Location' },
                    },
                  ] as FormField[],
                }]),
              ],
            },
          ],
        },
      ],
    },
  ];

  return allTabs;
};

export const REQUEST_ADDITIONAL_SERVICE_HIDE_FIELDS: string[] = [
  'seats_limit',
  'location',
  'learning_objectives',
  'resources',
];

export const ADDITIONAL_SERVICES_FORM_SCHEMA = ADDITIONAL_SERVICES_SCHEMA;
