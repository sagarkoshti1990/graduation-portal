import type { FormSection } from '@constants/CREATE_USER_FORM_SCHEMA';

export const DECLINE_FORM_SCHEMA: FormSection[] = [
  {
    type: 'section',
    id: 'declineDetails',
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
              fallback: 'Select a reason',
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
            required: true,
            visibleIf: [
              {
                name: 'selectedReason',
                operator: '===',
                value: 'other',
              },
            ],
            label: {
              key: 'supportProvider.supportRequests.labels.reasonDetails',
              fallback: 'Reason Details',
            },
            placeholder: {
              key: 'supportProvider.supportRequests.placeholders.declineDetails',
              fallback: 'Please provide additional details...',
            },
            subLabel: {
              key: 'supportProvider.supportRequests.hints.decline',
              fallback: 'This message will be shared with the coach to explain why the request was declined.',
            },
            validation: [
              {
                rule: 'required',
                message: {
                  key: 'supportProvider.supportRequests.errors.reasonDetailsRequired',
                  fallback: 'Reason details are required',
                },
              },
            ],
          },
        ],
      },
    ],
  },
];
