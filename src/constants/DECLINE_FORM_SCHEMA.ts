import type { FormSection } from '@components/SchemaFormRenderer/type';

export const DECLINE_FORM_SCHEMA: FormSection[] = [
  {
    type: 'section',
    id: 'declineDetails',
    _container: {
      borderWidth: 0,
      p: 0,
      bg: 'transparent',
    },
    rows: [
      {
        fields: [
          {
            name: 'selectedReason',
            type: 'select',
            required: true,
            label: {
              key: 'supportProvider.supportRequests.labels.selectReason',
              fallback: 'Select Reason',
            },
            placeholder: {
              key: 'supportProvider.supportRequests.placeholders.declineReason',
              fallback: 'Choose a preset reason or write your own',
            },
            optionsSource: 'declineReasonOptions',
            validation: [
              {
                rule: 'required',
                message: {
                  key: 'supportProvider.supportRequests.errors.reasonRequired',
                  fallback: 'Reason is required',
                },
              },
            ],
          },
        ],
      },
      {
        fields: [
          {
            name: 'reasonDetails',
            type: 'textarea',
            required: false,
            label: {
              key: 'supportProvider.supportRequests.labels.reasonDetails',
              fallback: 'Reason Details',
            },
            placeholder: {
              key: 'supportProvider.supportRequests.placeholders.declineDetails',
              fallback: 'Provide additional context or details for the Coach...',
            },

            subLabel: {
              key: 'supportProvider.supportRequests.hints.decline',
              fallback: 'This feedback will be shared with the Coach',
            },
          },
        ],
      },
    ],
  },
];
