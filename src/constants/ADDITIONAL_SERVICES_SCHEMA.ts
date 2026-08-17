import type { FormField, FormSection } from '@components/SchemaFormRenderer/type';

export const ADDITIONAL_SERVICES_SCHEMA = (): FormSection[] => ([
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
                placeholder: { fallback: 'Select province first' },
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
              },
            ],
          },
          {
            fields: [{
              name: 'idp_additional_services_tasks',
              type: 'pillmultiselect',
              label: { key: 'servicesCategory', fallback: 'Tags' },
              optionsSource: 'sessionTypes',
              dependsOn: 'categories',
              visibleIf: [
                { name: 'categories', value: 'other_attention', operator: '!=' },
              ]
            }
            ],
          },
          {
            fields: [
              {
                name: 'title',
                type: 'text',
                required: true,
                label: { key: 'servicesTitle', fallback: 'Services Title' },
                placeholder: { fallback: 'Name of this service...' },
                validation: [
                  {
                    rule: 'required',
                    message: {
                      key: 'errors.servicesTitleRequired',
                      fallback: 'Services title is required',
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
                label: { key: 'servicesDescription', fallback: 'Services Description' },
                placeholder: {
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
              },
            ],
          },
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
              {
                name: 'start_date',
                type: 'datetime',
                required: false,
                label: { key: 'startDate', fallback: 'Start Date' },
                placeholder: { fallback: 'DD/MM/YYYY HH:MM' },
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
                      field: "end_date",
                      operator: "<="
                    },
                    message: {
                      key: "errors.dateCompare",
                      fallback: "Start Date must be before or equal to End Date."
                    }
                  }
                ],
              },
              // {
              //   name: 'startTime',
              //   type: 'time',
              //   required: false,
              //   label: { key: 'startTime', fallback: 'Start Time' },
              //   placeholder: { fallback: '--:--' },
              //   validation: [
              //     {
              //       rule: "timeCompare",
              //       value: {
              //         field: "endTime",
              //         operator: "<"
              //       },
              //       message: {
              //         key: "errors.timeCompareEndTime",
              //         fallback: "Start Time must be before End Time."
              //       }
              //     }
              //   ],
              // },
            ],
          },
          {
            fields: [
              {
                name: 'end_date',
                type: 'datetime',
                required: false,
                label: { key: 'endDate', fallback: 'End Date' },
                placeholder: { fallback: 'DD/MM/YYYY HH:MM' },
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
              },
              // {
              //   name: 'endTime',
              //   type: 'time',
              //   required: false,
              //   label: { key: 'endTime', fallback: 'End Time' },
              //   placeholder: { fallback: '--:--' },
              //   validation: [
              //     {
              //       rule: "timeCompare",
              //       value: {
              //         field: "startTime",
              //         operator: ">"
              //       },
              //       message: {
              //         key: "errors.timeCompareStartTime",
              //         fallback: "End Time must be after Start Time."
              //       }
              //     }
              //   ],
              // },
            ],
          },
          {
            fields: [
              {
                name: 'location',
                type: 'text',
                required: false,
                label: { key: 'serviceLocation', fallback: 'Location where service is provided' },
                placeholder: { fallback: "Address or indicate 'Online / Remote'..." },
              },
            ],
          },
          {
            fields: [
              {
                name: 'learning_objectives',
                type: 'textarea',
                required: false,
                label: { key: 'eligibilityCriteria', fallback: 'Eligibility Criteria' },
                placeholder: { fallback: 'Who can access this service? Any specific requirements?' },
              },
            ],
          },
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
              {
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
                ],
              },
              {
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
                ],
              },
              {
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
                ],
              },
              {
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
                ],
              },
              {
                fields: [
                  {
                    name: 'title',
                    type: 'view',
                    label: { key: 'servicesTitle', fallback: 'Title' },
                  },
                ],
              },
              {
                fields: [
                  {
                    name: 'start_date',
                    type: 'view',
                    displayFormat: "dateFormat@DD-MM-YYYY hh:mm A",
                    label: { key: 'startDate', fallback: 'Start Date' },
                  },
                  // {
                  //   name: 'startTime',
                  //   type: 'view',
                  //   label: { key: 'startTime', fallback: 'Start Time' },
                  // },
                ],
              },
              {
                fields: [
                  {
                    name: 'end_date',
                    type: 'view',
                    displayFormat: "dateFormat@DD-MM-YYYY hh:mm A",
                    label: { key: 'endDate', fallback: 'End Date' },
                  },
                  // {
                  //   name: 'endTime',
                  //   type: 'view',
                  //   label: { key: 'endTime', fallback: 'End Time' },
                  // },
                ],
              },
              {
                fields: [
                  {
                    name: 'location',
                    type: 'view',
                    label: { key: 'serviceLocation', fallback: 'Location' },
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
]);

export const ADDITIONAL_SERVICES_FORM_SCHEMA = ADDITIONAL_SERVICES_SCHEMA;
