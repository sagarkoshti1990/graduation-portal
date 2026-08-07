import type { FormSection } from '@components/SchemaFormRenderer/type';

export const ASSET_SCHEMA: FormSection[] = [
  // ─── Tab 1: Asset Details ──────────────────────────────────────────────────
  {
    type: 'tab',
    id: 'assetDetails',
    title: {
      key: 'supportProvider.assetForm.tabs.assetDetails',
      fallback: 'Asset Details',
    },
    icon: 'FileText',
    children: [
      {
        type: 'section',
        id: 'assetDetailsSection',
        title: {
          key: 'supportProvider.assetForm.step1.title',
          fallback: 'Asset Details',
        },
        subTitle: {
          key: 'supportProvider.assetForm.step1.subTitle',
          fallback: 'Fields marked * are required',
        },
        rows: [
          {
            fields: [
              {
                name: 'province',
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
                name: 'site',
                type: 'multiselect',
                required: true,
                label: { key: 'site', fallback: 'Site' },
                placeholder: { fallback: 'Select province first' },
                placeholderWhenReady: {
                  key: 'sitePlaceholderReady',
                  fallback: 'Select site',
                },
                optionsSource: 'sites',
                dependsOn: 'province',
                disabledWhen: { field: 'province', empty: true },
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
                name: 'assetType',
                type: 'pillselect',
                required: true,
                label: { key: 'assetType', fallback: 'Asset Type' },
                optionsSource: 'assetTypes',
                validation: [
                  {
                    rule: 'required',
                    message: {
                      key: 'errors.assetTypeRequired',
                      fallback: 'Asset type is required',
                    },
                  },
                ],
              },
            ],
          },
          {
            fields: [
              {
                name: 'livelihoodCategory',
                type: 'select',
                required: true,
                label: { key: 'livelihoodCategory', fallback: 'Category of Livelihoods' },
                placeholder: { fallback: 'Select livelihood category' },
                optionsSource: 'livelihoodCategories',
                validation: [
                  {
                    rule: 'required',
                    message: {
                      key: 'errors.livelihoodCategoryRequired',
                      fallback: 'Category of livelihoods is required',
                    },
                  },
                ],
              },
            ],
          },
          {
            fields: [
              {
                name: 'assetTitle',
                type: 'text',
                required: true,
                label: { key: 'assetTitle', fallback: 'Asset Title' },
                placeholder: { fallback: 'Name of this asset...' },
                validation: [
                  {
                    rule: 'required',
                    message: {
                      key: 'errors.assetTitleRequired',
                      fallback: 'Asset title is required',
                    },
                  },
                ],
              },
            ],
          },
          {
            fields: [
              {
                name: 'assetDescription',
                type: 'textarea',
                required: true,
                label: { key: 'assetDescription', fallback: 'Asset Description' },
                placeholder: {
                  fallback: 'Describe this asset, its purpose, and how it benefits the recipient...',
                },
                validation: [
                  {
                    rule: 'required',
                    message: {
                      key: 'errors.assetDescriptionRequired',
                      fallback: 'Asset description is required',
                    },
                  },
                ],
              },
            ],
          },
          {
            fields: [
              {
                name: 'estimatedValue',
                type: 'text',
                required: true,
                label: { key: 'estimatedValue', fallback: 'Estimated Asset Value (Rands)' },
                placeholder: { fallback: 'R 0.00' },
                inputProps: { keyboardType: 'numeric' },
                validation: [
                  {
                    rule: 'required',
                    message: {
                      key: 'errors.estimatedValueRequired',
                      fallback: 'Estimated asset value is required',
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
        id: 'availability',
        title: {
          key: 'supportProvider.assetForm.step1.availabilityTitle',
          fallback: 'Availability (optional)',
        },
        rows: [
          {
            fields: [
              {
                name: 'startDate',
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
                      field: "endDate",
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
                name: 'endDate',
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
                      field: "startDate",
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
        ],
      },
    ],
  },

  // ─── Tab 2: Review & Publish ───────────────────────────────────────────────
  {
    type: 'tab',
    id: 'review',
    title: {
      key: 'supportProvider.assetForm.tabs.review',
      fallback: 'Review & Publish',
    },
    icon: 'Check',
    children: [
      {
        type: 'section',
        id: 'reviewPublishSection',
        title: {
          key: 'supportProvider.assetForm.step2.title',
          fallback: 'Review & Publish',
        },
        hint: {
          title: {
            key: 'supportProvider.assetForm.step2.infoTitle',
            fallback: 'Before you publish:',
          },
          bullets: [
            {
              key: 'supportProvider.assetForm.step2.infoBullet1',
              fallback: 'This support will be visible to all Coaches in the GBL network',
            },
            {
              key: 'supportProvider.assetForm.step2.infoBullet2',
              fallback: 'Coaches can submit requests on behalf of participants',
            },
            {
              key: 'supportProvider.assetForm.step2.infoBullet3',
              fallback: "You'll receive notifications when requests are submitted",
            },
          ],
        },
        children: [
          {
            type: 'section',
            id: 'reviewAssetDetails',
            title: {
              key: 'supportProvider.assetForm.step2.assetDetailsTitle',
              fallback: 'Asset Details',
            },
            rows:[
              {
                fields: [
                  {
                    type: 'view',
                    name: 'province',
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
                    name: 'site',
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
                    name: 'assetType',
                    label: { key: 'assetType', fallback: 'Asset Type' },
                    optionsSource: 'assetTypes',
                  },
                ],
              },
              {
                fields: [
                  {
                    type: 'view',
                    name: 'livelihoodCategory',
                    label: { key: 'livelihoodCategory', fallback: 'Category of Livelihoods' },
                    optionsSource: 'livelihoodCategories',
                  },
                ],
              },
              {
                fields: [
                  {
                    type: 'view',
                    name: 'assetTitle',
                    label: { key: 'assetTitle', fallback: 'Asset Title' },
                    placeholder: { fallback: 'Name of this asset...' },
                  },
                ],
              },
              {
                fields: [
                  {
                    name: 'estimatedValue',
                    type: 'view',
                    label: { key: 'estimatedValue', fallback: 'Estimated Value' },
                  },
                ],
              },
              {
                fields: [
                  {
                    name: 'startDate',
                    type: 'view',
                    displayFormat: "dateFormat@DD/MM/YYYY hh:mm A",
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
                    name: 'endDate',
                    type: 'view',
                    displayFormat: "dateFormat@DD/MM/YYYY hh:mm A",
                    label: { key: 'endDate', fallback: 'End Date' },
                  },
                  // {
                  //   name: 'endTime',
                  //   type: 'view',
                  //   label: { key: 'endTime', fallback: 'End Time' },
                  // },
                ],
              },
            ]
          },
        ],
      },
    ],
  },
];

export const ASSET_FORM_SCHEMA = ASSET_SCHEMA;
