import type { FormSection } from '@components/SchemaFormRenderer/type';

// Minimum minutes between now and a session's start time, configurable via .env
// @ts-ignore - process.env is injected by webpack DefinePlugin on web
export const SESSION_MIN_LEAD_MINUTES = Number(process.env.SESSION_MIN_LEAD_MINUTES);

export const TRAINING_SESSION_SCHEMA = (hideFields: string[] = [], originalStartDate?: string) => ([
  // ─── Tab 1: Session Details ───────────────────────────────────────────────
  {
    type: 'tab',
    id: 'sessionDetails',
    title: {
      key: 'supportProvider.additionalServicesForm.tabs.sessionDetails',
      fallback: 'Session Details',
    },
    icon: 'FileText',
    children: [
      {
        type: 'section',
        id: 'trainingDetails',
        title: {
          key: 'trainingDetails',
          fallback: 'Training Session Details',
        },
        subTitle: {
          key: 'trainingDetailsSubTitle',
          fallback: 'Fields marked * are required',
        },
        rows: [
          {
            fields: [
              ...(hideFields.includes('provinces') ? [] : [{
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
              ...(hideFields.includes('sites') ? [] : [{
                name: 'sites',
                type: 'multiselect',
                required: true,
                label: { key: 'site', fallback: 'Site' },
                placeholder: { key: 'sitePlaceholder', fallback: 'Select Site' },
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
            ],
          },
          {
            fields: [
              ...(hideFields.includes('categories') ? [] : [{
                name: 'categories',
                type: 'pillselect',
                required: true,
                label: { key: 'pillar', fallback: 'Pillar' },
                optionsSource: 'pillars',
                validation: [
                  {
                    rule: 'required',
                    message: {
                      key: 'errors.pillarRequired',
                      fallback: 'Pillar is required',
                    },
                  },
                ],
              }]),
            ],
          },
          {
            fields: [
              ...(hideFields.includes('idp_tasks') ? [] : [{
                name: 'idp_tasks',
                type: 'select',
                required: true,
                label: {
                  key: 'idp_training_task',
                  fallback: 'Training / Session Type',
                },
                placeholder: { key: 'idp_training_taskPlaceholder', fallback: 'Select session type' },
                optionsSource: 'sessionTypes',
                dependsOn: 'categories',
                disabledWhen: { field: 'categories', empty: true },
                validation: [
                  {
                    rule: 'required',
                    message: {
                      key: 'errors.sessionTypeRequired',
                      fallback: 'Session type is required',
                    },
                  },
                ],
              }]),
            ],
          },
          {
            fields: [
              ...(hideFields.includes('livelihoodCategory') ? [] : [{
                name: 'livelihoodCategory',
                type: 'select',
                required: true,
                label: { key: 'livelihoodCategory', fallback: 'Category of Livelihoods' },
                placeholder: { key: 'livelihoodCategoryPlaceholder', fallback: 'Select livelihood category' },
                optionsSource: 'livelihoodCategories',
                visibleIf: [
                  { name: 'idp_tasks', value: LIVELIHOOD_CATEGORY_TASK_IDS, operator: 'in' },
                ],
                validation: [
                  {
                    rule: 'required',
                    message: {
                      key: 'errors.livelihoodCategoryRequired',
                      fallback: 'Category of livelihoods is required',
                    },
                  },
                ],
              }]),
            ],
          },
          {
            fields: [
              ...(hideFields.includes('sessionTypeOther') ? [] : [{
                name: 'sessionTypeOther',
                type: 'text',
                required: true,
                label: {
                  key: 'sessionType',
                  fallback: 'Please specify',
                },
                placeholder: { key: 'sessionTypePlaceholder', fallback: 'Describe this session...' },
                visibleIf: [
                  { name: 'idp_tasks', value: 'custom', operator: '===' },
                ],
                validation: [
                  {
                    rule: 'required',
                    message: {
                      key: 'errors.sessionTitleRequired',
                      fallback: 'Session title is required',
                    },
                  },
                ],
              }]),
            ],
          },
          {
            fields: [
              ...(hideFields.includes('description') ? [] : [{
                name: 'description',
                type: 'textarea',
                required: true,
                label: {
                  key: 'description',
                  fallback: 'Training / Session Description',
                },
                placeholder: {
                  key: 'descriptionPlaceholder',
                  fallback: 'Describe what this session covers and what participants will learn...',
                },
                validation: [
                  {
                    rule: 'required',
                    message: {
                      key: 'errors.descriptionRequired',
                      fallback: 'Description is required',
                    },
                  },
                ],
              }]),
            ],
          },
          {
            fields: [
              ...(hideFields.includes('learning_objectives') ? [] : [{
                name: 'learning_objectives',
                type: 'textarea',
                required: false,
                label: {
                  key: 'learningObjectives',
                  fallback: 'Learning Objectives',
                },
                placeholder: {
                  key: 'learningObjectivesPlaceholder',
                  fallback: 'List the key learning outcomes, one per line...',
                },
              }]),
            ],
          },
          {
            fields: [
              ...(hideFields.includes('recommended_for') ? [] : [{
                name: 'recommended_for',
                type: 'pillselect',
                required: true,
                label: { key: 'targetAudience', fallback: 'Target Audience' },
                optionsSource: 'targetAudienceOptions',
                validation: [
                  {
                    rule: 'required',
                    message: {
                      key: 'errors.targetAudienceRequired',
                      fallback: 'Target audience is required',
                    },
                  },
                ],
              }]),
            ],
          },
          {
            fields: [
              ...(hideFields.includes('certificate_provided') ? [] : [{
                name: 'certificate_provided',
                type: 'pillselect',
                required: true,
                label: {
                  key: 'certificateProvided',
                  fallback: 'Certificate Provided',
                },
                optionsSource: 'certificateOptions',
                validation: [
                  {
                    rule: 'required',
                    message: {
                      key: 'errors.certificateRequired',
                      fallback: 'Certificate choice is required',
                    },
                  },
                ],
              }]),
            ],
          },
          {
            fields: [
              ...(hideFields.includes('seats_limit') ? [] : [{
                name: 'seats_limit',
                type: 'text',
                required: true,
                label: { key: 'maxCapacity', fallback: 'Maximum Capacity' },
                placeholder: { key: 'maxCapacityPlaceholder', fallback: 'e.g. 20' },
                inputProps: { keyboardType: 'numeric' },
                validation: [
                  {
                    rule: 'required',
                    message: {
                      key: 'errors.maxCapacityRequired',
                      fallback: 'Maximum capacity is required',
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
              }]),
              ...(hideFields.includes('can_be_copied') ? [] : [{
                name: 'can_be_copied',
                type: 'select',
                required: false,
                label: {
                  key: 'recurringSession',
                  fallback: 'Recurring Session',
                },
                optionsSource: 'recurringOptions',
                defaultValue: 'Yes',
              }]),
            ],
          },
          {
            fields: [
              ...(hideFields.includes('resources') ? [] : [{
                name: 'resources',
                type: 'file',
                multiple: true,
                required: false,
                showOptionalTag: true,
                validation:[
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
                    rule: "fileSize",
                    value: 10,
                    message: {
                      key: "errors.fileSize10",
                      fallback: "Maximum file size is 10 MB."
                    }
                  }
                ],
                label: {
                  key: 'supportProvider.trainingSession.step1.resourceContent',
                  fallback: 'Resource Content',
                },
                subTitle: {
                  key: 'supportProvider.trainingSession.step1.resourceUploadSub',
                  fallback: 'Upload PDF or DOC training materials',
                },
                placeholder: {
                  key: 'supportProvider.trainingSession.step1.uploadPrompt',
                  fallback: 'Click to upload PDF / DOC',
                },
              }]),
            ],
          },
        ],
      },
    ],
  },

  // ─── Tab 2: Schedule & Format ─────────────────────────────────────────────
  {
    type: 'tab',
    id: 'scheduleFormat',
    title: { key: 'scheduleFormat', fallback: 'Schedule & Format' },
    icon: 'Calendar',
    children: [
      {
        type: 'section',
        id: 'scheduleDetails',
        title: {
          key: 'scheduleDetails',
          fallback: 'Schedule & Format',
        },
        subTitle: {
          key: 'scheduleDetailsSubTitle',
          fallback: 'Set when and how the session will be delivered',
        },
        rows: [
          {
            fields: [
              ...(hideFields.includes('start_date') ? [] : [{
                name: 'start_date',
                type: 'datetime',
                required: true,
                label: { key: 'start_date', fallback: 'Start Date & Time' },
                placeholder: { key: 'start_datePlaceholder', fallback: 'dd-mm-yyyy hh:mm' },
                validation: [
                  {
                    rule: 'required',
                    message: {
                      key: 'errors.startDateRequired',
                      fallback: 'Start date & time is required',
                    },
                  },
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
                      fallback: `Session must start at least ${SESSION_MIN_LEAD_MINUTES} minutes from now.`,
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
                      fallback: "Start Date & Time must be before or equal to End Date & Time."
                    }
                  }
                ],
              }]),
            ]
          },
          {
            fields: [
              ...(hideFields.includes('end_date') ? [] : [{
                name: 'end_date',
                type: 'datetime',
                required: true,
                label: { key: 'end_date', fallback: 'End Date & Time' },
                placeholder: { key: 'end_datePlaceholder', fallback: 'dd-mm-yyyy hh:mm' },
                validation: [
                  {
                    rule: 'required',
                    message: {
                      key: 'errors.endDateRequired',
                      fallback: 'End date & time is required',
                    },
                  },
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
                      fallback: "End Date & Time must be after or equal to Start Date & Time."
                    }
                  }
                ],
              }]),
            ],
          },
          {
            fields: [
              ...(hideFields.includes('delivery_mode') ? [] : [{
                name: 'delivery_mode',
                type: 'pillselect',
                required: true,
                label: { key: 'formatType', fallback: 'Type' },
                optionsSource: 'formatOptions',
                validation: [
                  {
                    rule: 'required',
                    message: {
                      key: 'errors.formatTypeRequired',
                      fallback: 'Format type is required',
                    },
                  },
                ],
              }]),
            ],
          },
          {
            fields: [
              ...(hideFields.includes('location') ? [] : [{
                name: 'location',
                type: 'text',
                required: true,
                label: { key: 'location', fallback: 'Venue Location' },
                placeholder: { key: 'locationPlaceholder', fallback: 'Venue name and address...' },
                visibleIf: [
                  { name: 'delivery_mode', value: 'online', operator: '!=' },
                ],
                validation: [
                  {
                    rule: 'required',
                    message: {
                      key: 'errors.venueRequired',
                      fallback: 'Venue location is required',
                    },
                  },
                ],
              }]),
            ],
          },
          {
            fields: [
              ...(hideFields.includes('meeting_link') ? [] : [{
                name: 'meeting_link',
                type: 'text',
                required: true,
                label: { key: 'meetingLink', fallback: 'Meeting Link' },
                placeholder: { key: 'meetingLinkPlaceholder', fallback: 'https://...' },
                visibleIf: [
                  { name: 'delivery_mode', value: 'offline', operator: '!=' },
                ],
                validation: [
                  {
                    rule: 'required',
                    message: {
                      key: 'errors.meetingLinkRequired',
                      fallback: 'Meeting link is required',
                    },
                  },
                ],
              }]),
            ],
          },
        ],
      },
    ],
  },

  // // ─── Tab 3: Review Tab ─────────────────────────────────────────────
  {
    type: 'tab',
    id: 'review',
    label: {
      key: 'review',
      fallback: 'Review & Publish',
    },
    icon: 'Check',
    children: [
      {
        type: 'section',
        id: 'serviceDetails',
        title: {
          key: 'supportProvider.trainingSession.step3.title',
          fallback: 'Review & Publish',
        },
        hint: {
          title: {
            key: 'supportProvider.trainingSession.step3.infoTitle',
            fallback: 'Before you publish:',
          },
          bullets: [
            {
              key: 'supportProvider.trainingSession.step3.infoBullet1',
              fallback: 'This support will be visible to all Coaches in the GBL network',
            },
            {
              key: 'supportProvider.trainingSession.step3.infoBullet2',
              fallback: 'Coaches can submit requests on behalf of participants',
            },
            {
              key: 'supportProvider.trainingSession.step3.infoBullet3',
              fallback: "You'll receive notifications when requests are submitted",
            },
          ],
        },
        children: [
          {
            type: 'section',
            id: 'serviceDetails',
            title: {
              key: 'supportProvider.trainingSession.step3.sessionDetailsTitle',
              fallback: 'Session Details',
            },
            rows: [
              {
                fields: [
                  ...(hideFields.includes('provinces') ? [] : [{
                    name: 'provinces',
                    type: 'view',
                    label: { key: 'province', fallback: 'Province' },
                    optionsSource: 'provinces',
                  }]),
                ],
              },
              {
                fields: [
                  ...(hideFields.includes('sites') ? [] : [{
                    name: 'sites',
                    type: 'view',
                    label: { key: 'site', fallback: 'Site' },
                    optionsSource: 'sites',
                  }]),
                ],
              },
              {
                fields: [
                  ...(hideFields.includes('categories') ? [] : [{
                    name: 'categories',
                    type: 'view',
                    required: true,
                    label: { key: 'pillar', fallback: 'Pillar' },
                    optionsSource: 'pillars',
                  }]),
                ],
              },
              {
                fields: [
                  ...(hideFields.includes('idp_tasks') ? [] : [{
                    name: 'idp_tasks',
                    type: 'view',
                    required: true,
                    label: {
                      key: 'idp_training_task',
                      fallback: 'Training / Session Type',
                    },
                    optionsSource: 'sessionTypes',
                  }]),
                ],
              },
              {
                fields: [
                  ...(hideFields.includes('recommended_for') ? [] : [{
                    name: 'recommended_for',
                    type: 'view',
                    required: true,
                    label: { key: 'targetAudience', fallback: 'Target Audience' },
                    optionsSource: 'targetAudienceOptions',
                  }]),
                ],
              },
              {
                fields: [
                  ...(hideFields.includes('can_be_copied') ? [] : [{
                    name: 'can_be_copied',
                    type: 'view',
                    label: {
                      key: 'recurringSession',
                      fallback: 'Recurring Session',
                    },
                    optionsSource: 'recurringOptions'
                  }]),
                ],
              },
              {
                fields: [
                  ...(hideFields.includes('certificate_provided') ? [] : [{
                    name: 'certificate_provided',
                    type: 'view',
                    label: {
                      key: 'certificateProvided',
                      fallback: 'Certificate Provided',
                    },
                    optionsSource: 'certificateOptions',
                  }]),
                ],
              },
              {
                fields: [
                  ...(hideFields.includes('seats_limit') ? [] : [{
                    name: 'seats_limit',
                    type: 'view',
                    label: { key: 'maxCapacity', fallback: 'Maximum Capacity' },
                  }]),
                ],
              },
            ],
          },
          {
            type: 'section',
            id: 'availability',
            title: {
              key: 'supportProvider.trainingSession.step3.scheduleTitle',
              fallback: 'Schedule',
            },
            rows: [
              {
                fields: [
                  ...(hideFields.includes('start_date') ? [] : [{
                    type: 'view',
                    name: 'start_date',
                    displayFormat: 'dateFormat@DD-MM-YYYY hh:mm A',
                    label: {
                      key: 'supportProvider.trainingSession.step3.startLabel',
                      fallback: 'Start Date & Time',
                    },
                  }]),
                ],
              },
              {
                fields: [
                  ...(hideFields.includes('end_date') ? [] : [{
                    type: 'view',
                    name: 'end_date',
                    displayFormat: 'dateFormat@DD-MM-YYYY hh:mm A',
                    label: {
                      key: 'supportProvider.trainingSession.step3.endLabel',
                      fallback: 'End Date & Time',
                    },
                  }]),
                ],
              },
              {
                fields: [
                  ...(hideFields.includes('delivery_mode') ? [] : [{
                    type: 'view',
                    name: 'delivery_mode',
                    label: {
                      key: 'supportProvider.trainingSession.step3.formatLabel',
                      fallback: 'Format',
                    },
                  }]),
                ],
              },
              {
                fields: [
                  ...(hideFields.includes('location') ? [] : [{
                    type: 'view',
                    name: 'location',
                    label: {
                      key: 'location',
                      fallback: 'Venue Location',
                    },
                    visibleIf: [
                      { name: 'delivery_mode', value: 'online', operator: '!=' },
                    ],
                  }]),
                ],
              },
              {
                fields: [
                  ...(hideFields.includes('meeting_link') ? [] : [{
                    type: 'view',
                    name: 'meeting_link',
                    label: {
                      key: 'meetingLink',
                      fallback: 'Meeting Link',
                    },
                    visibleIf: [
                      { name: 'delivery_mode', value: 'offline', operator: '!=' },
                    ],
                  }]),
                ],
              },
            ],
          },
        ],
      },
    ],
  },
] as FormSection[]);

// ─── Field visibility presets ────────────────────────────────────────────────
// "Request a Session" flow only needs the core fields; everything else is
// filled in / managed elsewhere, so we hide it from that form.
// Session types (idp_tasks) that additionally require a livelihood category
export const LIVELIHOOD_CATEGORY_TASK_IDS: string[] = [
  process.env.EMPLOYMENT_LIVELIHOOD_TASK_ID,
  process.env.ENTREPRENEURSHIP_LIVELIHOOD_TASK_ID,
].filter(Boolean) as string[];

export const REQUEST_SESSION_HIDE_FIELDS: string[] = [
  'recommended_for',
  'certificate_provided',
  'seats_limit',
  'can_be_copied',
  'resources',
  'delivery_mode',
  'location',
  'meeting_link',
];

// "Create" (Service Provider) flow keeps everything else as-is; only the
// recurring-session toggle is hidden.
export const CREATE_SESSION_HIDE_FIELDS: string[] = [
  'can_be_copied',
  'recommended_for',
  'certificate_provided'
];

export const schema = (
  { role, hideFields }: { role?: string; hideFields?: string[] } = {}
): FormSection[] => {
  if (hideFields) {
    return TRAINING_SESSION_SCHEMA(hideFields);
  }

  if (role === 'request') {
    return TRAINING_SESSION_SCHEMA(REQUEST_SESSION_HIDE_FIELDS);
  }

    if (role === 'create') {
    return TRAINING_SESSION_SCHEMA(CREATE_SESSION_HIDE_FIELDS);
  }

  return TRAINING_SESSION_SCHEMA([]);
};

export const TRAINING_FORM_SCHEMA = TRAINING_SESSION_SCHEMA;
