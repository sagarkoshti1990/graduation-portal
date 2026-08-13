import type { FormSection } from '@components/SchemaFormRenderer/type';

export const TRAINING_SESSION_SCHEMA: FormSection[] = [
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
          key: 'trainingDetails',
          fallback: 'Fields marked * are required',
        },
        rows: [
          {
            fields: [
              {
                name: 'provinces',
                type: 'select',
                required: true,
                label: { key: 'province', fallback: 'Province' },
                placeholder: { fallback: 'Select province' },
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
              },
              {
                name: 'sites',
                type: 'multiselect',
                required: true,
                label: { key: 'site', fallback: 'Site' },
                placeholder: { fallback: 'Select Site' },
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
              },
            ],
          },
          {
            fields: [
              {
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
              },
            ],
          },
          {
            fields: [
              {
                name: 'idp_training_task',
                type: 'select',
                required: true,
                label: {
                  key: 'idp_training_task',
                  fallback: 'Training / Session Type',
                },
                placeholder: { fallback: 'Select session type' },
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
              },
            ],
          },
          {
            fields: [
              {
                name: 'sessionTypeOther',
                type: 'text',
                required: true,
                label: {
                  key: 'sessionType',
                  fallback: 'Please specify',
                },
                placeholder: { fallback: 'Describe this session...' },
                visibleIf: [
                  { name: 'sessionType', value: 'other', operator: '===' },
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
              },
            ],
          },
          {
            fields: [
              {
                name: 'description',
                type: 'textarea',
                required: true,
                label: {
                  key: 'description',
                  fallback: 'Training / Session Description',
                },
                placeholder: {
                  fallback:
                    'Describe what this session covers and what participants will learn...',
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
              },
            ],
          },
          {
            fields: [
              {
                name: 'learning_objectives',
                type: 'textarea',
                required: false,
                label: {
                  key: 'learningObjectives',
                  fallback: 'Learning Objectives',
                },
                placeholder: {
                  fallback: 'List the key learning outcomes, one per line...',
                },
              },
            ],
          },
          {
            fields: [
              {
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
              },
            ],
          },
          {
            fields: [
              {
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
              },
            ],
          },
          {
            fields: [
              {
                name: 'max_capacity',
                type: 'text',
                required: true,
                label: { key: 'maxCapacity', fallback: 'Maximum Capacity' },
                placeholder: { fallback: 'e.g. 20' },
                inputProps: { keyboardType: 'numeric' },
                validation: [
                  {
                    rule: 'required',
                    message: {
                      key: 'errors.maxCapacityRequired',
                      fallback: 'Maximum capacity is required',
                    },
                  },
                ],
              },
              {
                name: 'can_be_copied',
                type: 'select',
                required: false,
                label: {
                  key: 'recurringSession',
                  fallback: 'Recurring Session',
                },
                optionsSource: 'recurringOptions',
                defaultValue: 'Yes',
              },
            ],
          },
          {
            fields: [
              {
                name: 'resources',
                type: 'file',
                multiple: true,
                required: false,
                showOptionalTag: true,
                validation:[
                   {
                    rule: 'fileType',
                    value: ['pdf','doc'],
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
              },
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
          key: 'scheduleDetails',
          fallback: 'Set when and how the session will be delivered',
        },
        rows: [
          {
            fields: [
              {
                name: 'start_date',
                type: 'datetime',
                required: true,
                label: { key: 'start_date', fallback: 'Start Date & Time' },
                placeholder: { fallback: 'DD/MM/YYYY HH:MM' },
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
              },
            ]
          },
          {
            fields: [    
              {
                name: 'end_date',
                type: 'datetime',
                required: true,
                label: { key: 'end_date', fallback: 'End Date & Time' },
                placeholder: { fallback: 'DD/MM/YYYY HH:MM' },
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
              },
            ],
          },
          {
            fields: [
              {
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
              },
            ],
          },
          {
            fields: [
              {
                name: 'location',
                type: 'text',
                required: true,
                label: { key: 'location', fallback: 'Venue Location' },
                placeholder: { fallback: 'Venue name and address...' },
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
              },
            ],
          },
          {
            fields: [
              {
                name: 'meeting_link',
                type: 'text',
                required: true,
                label: { key: 'meetingLink', fallback: 'Meeting Link' },
                placeholder: { fallback: 'https://...' },
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
              },
            ],
          },
        ],
      },
    ],
  },

  // // ─── Tab 2: Review Tab ─────────────────────────────────────────────
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
          key: 'supportProvider.trainingSession.step3.sessionDetailsTitle',
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
              fallback:
                'This support will be visible to all Coaches in the GBL network',
            },
            {
              key: 'supportProvider.trainingSession.step3.infoBullet2',
              fallback: 'Coaches can submit requests on behalf of participants',
            },
            {
              key: 'supportProvider.trainingSession.step3.infoBullet3',
              fallback:
                "You'll receive notifications when requests are submitted",
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
                  {
                    name: 'provinces',
                    type: 'view',
                    label: { key: 'province', fallback: 'Province' },
                    optionsSource: 'provinces',
                  }],
              },
              {
                  fields: [
                  {
                    name: 'sites',
                    type: 'view',
                    label: { key: 'site', fallback: 'Site' },
                    optionsSource: 'sites',
                  },
                ],
              },
              {
                fields: [
                  {
                    name: 'categories',
                    type: 'view',
                    required: true,
                    label: { key: 'pillar', fallback: 'Pillar' },
                    optionsSource: 'pillars',
                    
                  },
                ],
              },
              {
                fields: [
                  {
                    name: 'idp_training_task',
                    type: 'view',
                    required: true,
                    label: {
                      key: 'idp_training_task',
                      fallback: 'Training / Session Type',
                    },
                    optionsSource: 'sessionTypes',
                  },
                ],
              },
              {
                fields: [
                  {
                    name: 'recommended_for',
                    type: 'view',
                    required: true,
                    label: { key: 'targetAudience', fallback: 'Target Audience' },
                    optionsSource: 'targetAudienceOptions',
                  },
                ],
              },
              {
                fields: [
                  {
                    name: 'can_be_copied',
                    type: 'view',
                    label: {
                      key: 'recurringSession',
                      fallback: 'Recurring Session',
                    },
                    optionsSource: 'recurringOptions'
                  },
                ],
              },
              {
                fields: [
                  {
                    name: 'certificate_provided',
                    type: 'view',
                    label: {
                      key: 'certificateProvided',
                      fallback: 'Certificate Provided',
                    },
                    optionsSource: 'certificateOptions',
                  },
                ],
              },
              {
                fields: [
                  {
                    name: 'max_capacity',
                    type: 'view',
                    label: { key: 'maxCapacity', fallback: 'Maximum Capacity' },
                  },
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
                  {
                    type: 'view',
                    name: 'start_date',
                    displayFormat: 'dateFormat@DD/MM/YYYY hh:mm A',
                    label: {
                      key: 'supportProvider.trainingSession.step3.startLabel',
                      fallback: 'Start Date & Time',
                    },
                  },
                ],
              },
              {
                fields: [
                  {
                    type: 'view',
                    name: 'end_date',
                    displayFormat: 'dateFormat@DD/MM/YYYY hh:mm A',
                    label: {
                      key: 'supportProvider.trainingSession.step3.endLabel',
                      fallback: 'End Date & Time',
                    },
                  },
                ],
              },
              {
                fields: [
                  {
                    type: 'view',
                    name: 'delivery_mode',
                    label: {
                      key: 'supportProvider.trainingSession.step3.formatLabel',
                      fallback: 'Format',
                    },
                  },
                ],
              },
              {
                fields: [
                  {
                    type: 'view',
                    name: 'location',
                    label: {
                      key: 'location',
                      fallback: 'Venue Location',
                    },
                    visibleIf: [
                      { name: 'delivery_mode', value: 'online', operator: '!=' },
                    ],
                  },
                ],
              },
              {
                fields: [
                  {
                    type: 'view',
                    name: 'link',
                    label: {
                      key: 'meetingLink',
                      fallback: 'Meeting Link',
                    },
                    visibleIf: [
                      { name: 'delivery_mode', value: 'offline', operator: '!=' },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

export const TRAINING_FORM_SCHEMA = TRAINING_SESSION_SCHEMA;
