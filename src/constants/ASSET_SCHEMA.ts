import type { FormField, FormSection } from '@components/SchemaFormRenderer/type';

export const ASSET_SCHEMA = (hideFileds: string[] = []): FormSection[] => {
  const allTabs: FormSection[] = [
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
                ...(hideFileds.includes('province') ? [] : [{
                  name: 'province',
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
                ...(hideFileds.includes('site') ? [] : [{
                  name: 'site',
                  type: 'multiselect',
                  required: true,
                  label: { key: 'site', fallback: 'Site' },
                  placeholder: { key: 'sitePlaceholder', fallback: 'Select province first' },
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
                }]),
              ] as FormField[],
            },
            {
              fields: [
                ...(hideFileds.includes('assetType') ? [] : [{
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
                }]),
              ] as FormField[],
            },
            {
              fields: [
                ...(hideFileds.includes('livelihoodCategory') ? [] : [{
                  name: 'livelihoodCategory',
                  type: 'select',
                  required: true,
                  label: { key: 'livelihoodCategory', fallback: 'Category of Livelihoods' },
                  placeholder: { key: 'livelihoodCategoryPlaceholder', fallback: 'Select livelihood category' },
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
                }]),
              ] as FormField[],
            },
            {
              fields: [
                ...(hideFileds.includes('assetTitle') ? [] : [{
                  name: 'assetTitle',
                  type: 'text',
                  required: true,
                  label: { key: 'assetTitle', fallback: 'Asset Title' },
                  placeholder: { key: 'assetTitlePlaceholder', fallback: 'Name of this asset...' },
                  validation: [
                    {
                      rule: 'required',
                      message: {
                        key: 'errors.assetTitleRequired',
                        fallback: 'Asset title is required',
                      },
                    },
                  ],
                }]),
              ] as FormField[],
            },
            {
              fields: [
                ...(hideFileds.includes('assetDescription') ? [] : [{
                  name: 'assetDescription',
                  type: 'textarea',
                  required: true,
                  label: { key: 'assetDescription', fallback: 'Asset Description (optional)' },
                  placeholder: {
                    key: 'assetDescriptionPlaceholder',
                    fallback: 'Describe this asset, its purpose, and how it benefits the recipient...',
                  },
                  validation: [
                    {
                      rule: 'required',
                      message: {
                        key: 'errors.assetDescriptionRequired',
                      },
                    },
                  ],
                }]),
              ] as FormField[],
            },
            {
              fields: [
                ...(hideFileds.includes('estimatedValue') ? [] : [{
                  name: 'estimatedValue',
                  type: 'text',
                  required: true,
                  label: { key: 'estimatedValue', fallback: 'Estimated Asset Value per Participant (Rands)' },
                  subTitle: {
                    key: 'supportProvider.assetForm.step1.estimatedValueSubTitle',
                    fallback: 'Monetary value allocated per individual participant (1:1 ratio)',
                  },
                  placeholder: { key: 'estimatedValuePlaceholder', fallback: 'R 0.00' },
                  inputProps: { keyboardType: 'numeric' },
                  validation: [
                    {
                      rule: 'required',
                      message: {
                        key: 'errors.estimatedValueRequired',
                        fallback: 'Estimated asset value is required',
                      },
                    },
                    {
                      rule: 'pattern',
                      value: '^[0-9]+(\\.[0-9]{1,2})?$',
                      message: {
                        key: 'errors.numberOfParticipantsInvalid',
                        fallback: 'Please enter a valid number',
                      },
                    },
                  ],
                }]),
                ...(hideFileds.includes('availableQuantity') ? [] : [{
                  name: 'availableQuantity',
                  type: 'text',
                  required: true,
                  label: { key: 'availableQuantity', fallback: 'Available Quantity' },
                  subTitle: {
                    key: 'supportProvider.assetForm.step1.availableQuantitySubTitle',
                    fallback: 'Total number of participants / units funded for this asset',
                  },
                  placeholder: { key: 'availableQuantityPlaceholder', fallback: 'e.g. 50' },
                  inputProps: { keyboardType: 'numeric' },
                  validation: [
                    {
                      rule: 'required',
                      message: {
                        key: 'errors.availableQuantityRequired',
                        fallback: 'Available quantity is required',
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
              ] as FormField[],
            },
            {
              fields: [
                {
                  name: 'totalFundBreakdown',
                  type: 'note',
                  variant: 'success',
                  label: {
                    key: 'totalFundBreakdownTitle',
                    fallback: 'Total Asset Fund Breakdown',
                  },
                  subTitle: { key: 'totalFundBreakdown' },
                  badge: {
                    label: {
                      key: 'totalFundAvailableLabel',
                      fallback: 'Total Fund Available',
                    },
                    value: { key: 'totalFundAvailableValue' },
                  },
                  visibleIf: [
                    { name: 'estimatedValue', operator: '!=', value: '' },
                    { name: 'availableQuantity', operator: '!=', value: '' },
                  ],
                } as FormField,
              ] as FormField[],
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
                ...(hideFileds.includes('startDate') ? [] : [{
                  name: 'startDate',
                  type: 'datetime',
                  required: false,
                  label: { key: 'startDate', fallback: 'Start Date' },
                  placeholder: { key: 'startDatePlaceholder', fallback: 'DD/MM/YYYY HH:MM' },
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
                }]),
              ] as FormField[],
            },
            {
              fields: [
                ...(hideFileds.includes('endDate') ? [] : [{
                  name: 'endDate',
                  type: 'datetime',
                  required: false,
                  label: { key: 'endDate', fallback: 'End Date' },
                  placeholder: { key: 'endDatePlaceholder', fallback: 'DD/MM/YYYY HH:MM' },
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
                }]),
              ] as FormField[],
            },
          ],
        },
        ...(hideFileds.includes('assetDocuments') ? [] : [{
          type: 'section',
          id: 'assetDocuments',
          rows: [
            {
              fields: [
                {
                  name: 'assetDocuments',
                  type: 'file',
                  multiple: true,
                  required: false,
                  showOptionalTag: true,
                  label: {
                    key: 'supportProvider.assetForm.step1.resourceContent',
                    fallback: 'Resource Content / Asset Documents',
                  },
                  subTitle: {
                    key: 'supportProvider.assetForm.step1.resourceUploadSub',
                    fallback: 'Upload PDF or Word specification documents (Max 10 MB per file)',
                  },
                  placeholder: {
                    key: 'supportProvider.assetForm.step1.uploadPrompt',
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
            },
          ],
        } as FormSection]),
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
                    label: { key: 'estimatedValueReview', fallback: 'Estimated Value per Participant' },
                  },
                  {
                    name: 'availableQuantity',
                    type: 'view',
                    label: { key: 'availableQuantity', fallback: 'Available Quantity' },
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
                  //   label: { key: 'startTime' },
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
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

  return allTabs;
};

export const REQUEST_ASSET_HIDE_FIELDS: string[] = [ 'assetDocuments' ];

export const ASSET_FORM_SCHEMA = ASSET_SCHEMA;
