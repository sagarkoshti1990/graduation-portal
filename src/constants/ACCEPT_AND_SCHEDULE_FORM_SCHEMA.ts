import type { FormSection } from '@components/SchemaFormRenderer/type';

export const ACCEPT_AND_SCHEDULE_FORM_SCHEMA: FormSection[] = [
  {
    type: 'section',
    id: 'acceptAndScheduleDetails',
    rows: [
      {
        fields: [
          {
            name: 'date',
            type: 'text',
            required: true,
            icon: 'Calendar',
            label: {
              key: 'supportProvider.supportRequests.labels.date',
              fallback: 'Date',
            },
            placeholder: {
              key: 'supportProvider.supportRequests.placeholders.date',
              fallback: 'Select or enter date',
            },
            validation: [
              {
                rule: 'required',
                message: {
                  key: 'supportProvider.supportRequests.errors.dateRequired',
                  fallback: 'Date is required',
                },
              },
            ],
          },
          {
            name: 'time',
            type: 'text',
            required: true,
            icon: 'Clock',
            label: {
              key: 'supportProvider.supportRequests.labels.time',
              fallback: 'Time',
            },
            placeholder: {
              key: 'supportProvider.supportRequests.placeholders.time',
              fallback: 'Select or enter time',
            },
            validation: [
              {
                rule: 'required',
                message: {
                  key: 'supportProvider.supportRequests.errors.timeRequired',
                  fallback: 'Time is required',
                },
              },
            ],
          },
        ],
      },
      {
        fields: [
          {
            name: 'duration',
            type: 'select',
            required: true,
            label: {
              key: 'supportProvider.supportRequests.labels.duration',
              fallback: 'Duration',
            },
            optionsSource: 'durationOptions',
            defaultValue: '2 hours',
          },
        ],
      },
      {
        fields: [
          {
            name: 'location',
            type: 'text',
            required: false,
            label: {
              key: 'supportProvider.supportRequests.labels.locationVenue',
              fallback: 'Location / Venue',
            },
            placeholder: {
              key: 'supportProvider.supportRequests.placeholders.location',
              fallback: 'Enter location or venue',
            },
          },
        ],
      },
      {
        fields: [
          {
            name: 'meetingLink',
            type: 'text',
            required: false,
            label: {
              key: 'supportProvider.supportRequests.labels.meetingLink',
              fallback: 'Meeting Link',
            },
            placeholder: {
              key: 'supportProvider.supportRequests.placeholders.meetingLink',
              fallback: 'Enter meeting link (e.g. Teams, Zoom)',
            },
          },
        ],
      },
      {
        fields: [
          {
            name: 'notes',
            type: 'textarea',
            required: false,
            label: {
              key: 'supportProvider.supportRequests.labels.notesForCoach',
              fallback: 'Notes for Coach',
            },
            placeholder: {
              key: 'supportProvider.supportRequests.placeholders.notes',
              fallback: 'Add any special instructions or details...',
            },
          },
        ],
      },
    ],
  },
];
