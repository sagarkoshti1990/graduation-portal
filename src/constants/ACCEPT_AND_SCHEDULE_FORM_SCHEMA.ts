import type { FormSection } from '@components/SchemaFormRenderer/type';
import { ACCEPT_AND_SCHEDULE_FORM_SECTION_STYLES } from '../screens/ServiceProvider/SupportRequests/styles';

const BASE_PATH = 'supportProvider.supportRequests';

export const DURATION_OPTIONS = [
  { label: `${BASE_PATH}.durationOptions.1hour`, value: '1_hour' },
  { label: `${BASE_PATH}.durationOptions.1_5hours`, value: '1.5_hours' },
  { label: `${BASE_PATH}.durationOptions.2hours`, value: '2_hours' },
  { label: `${BASE_PATH}.durationOptions.3hours`, value: '3_hours' },
  { label: `${BASE_PATH}.durationOptions.fullDay`, value: 'full_day' },
];

export const ACCEPT_AND_SCHEDULE_FORM_SCHEMA: FormSection[] = [
  {
    type: 'section',
    id: 'sessionDetailsSpecification',
    ...ACCEPT_AND_SCHEDULE_FORM_SECTION_STYLES,
    title: {
      key: 'supportProvider.supportRequests.titles.sessionDetails',
      fallback: 'Session Details & Specification',
    },
    icon: 'GraduationCap',
    rows: [
      {
        fields: [
          {
            name: 'province',
            type: 'select',
            required: true,
            label: {
              key: 'supportProvider.supportRequests.labels.province',
              fallback: 'Province',
            },
            placeholder: {
              key: 'supportProvider.supportRequests.placeholders.province',
              fallback: 'Select province',
            },
            optionsSource: 'provinces',
            validation: [
              {
                rule: 'required',
                message: {
                  key: 'supportProvider.supportRequests.errors.provinceRequired',
                  fallback: 'Province is required',
                },
              },
            ],
          },
          {
            name: 'sites',
            type: 'multiselect',
            required: true,
            label: {
              key: 'supportProvider.supportRequests.labels.site',
              fallback: 'Site(s)',
            },
            placeholder: {
              key: 'supportProvider.supportRequests.placeholders.site',
              fallback: 'Select site(s)',
            },
            placeholderWhenReady: {
              key: 'supportProvider.supportRequests.placeholders.siteReady',
              fallback: 'Select site(s)',
            },
            optionsSource: 'sites',
            dependsOn: 'province',
            disabledWhen: { field: 'province', empty: true },
            validation: [
              {
                rule: 'required',
                message: {
                  key: 'supportProvider.supportRequests.errors.siteRequired',
                  fallback: 'At least one site is required',
                },
              },
            ],
          }
          
        ],
      },
      {
        fields: [
          {
            name: 'title',
            type: 'text',
            required: true,
            label: {
              key: 'supportProvider.supportRequests.labels.sessionTitle',
              fallback: 'Session Title',
            },
            placeholder: {
              key: 'supportProvider.supportRequests.placeholders.title',
              fallback: 'Enter session title',
            },
            validation: [
              {
                rule: 'required',
                message: {
                  key: 'supportProvider.supportRequests.errors.titleRequired',
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
            required: false,
            label: {
              key: 'supportProvider.supportRequests.labels.sessionDescription',
              fallback: 'Session Description & Justification',
            },
            placeholder: {
              key: 'supportProvider.supportRequests.placeholders.description',
              fallback: 'Enter description & justification',
            },
          },
        ],
      },
      {
        fields: [
          {
            name: 'targetAudience',
            type: 'textarea',
            required: false,
            label: {
              key: 'supportProvider.supportRequests.labels.targetAudienceProfile',
              fallback: 'Target Audience & Participant Profile',
            },
            placeholder: {
              key: 'supportProvider.supportRequests.placeholders.targetAudience',
              fallback: 'Enter target audience & participant profile',
            },
          },
        ],
      },
    ],
  },
  {
    type: 'section',
    id: 'scheduleFormatCapacity',
    ...ACCEPT_AND_SCHEDULE_FORM_SECTION_STYLES,
    title: {
      key: 'supportProvider.supportRequests.titles.scheduleFormat',
      fallback: 'Schedule, Format & Capacity',
    },
    icon: 'Calendar',
    rows: [
      {
        fields: [
          {
            name: 'date',
            type: 'date',
            required: true,
            icon: 'Calendar',
            label: {
              key: 'supportProvider.supportRequests.labels.date',
              fallback: 'Date',
            },
            placeholder: {
              key: 'supportProvider.supportRequests.placeholders.date',
              fallback: 'Select date',
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
            type: 'time',
            required: true,
            icon: 'Clock',
            label: {
              key: 'supportProvider.supportRequests.labels.startTime',
              fallback: 'Start Time',
            },
            placeholder: {
              key: 'supportProvider.supportRequests.placeholders.time',
              fallback: 'Select time',
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
            name: 'delivery_mode',
            type: 'select',
            required: true,
            label: {
              key: 'supportProvider.supportRequests.labels.deliveryFormat',
              fallback: 'Delivery Format',
            },
            placeholder: {
              key: 'supportProvider.supportRequests.placeholders.deliveryFormat',
              fallback: 'Select delivery format',
            },
            optionsSource: 'formatOptions',
            validation: [
              {
                rule: 'required',
                message: {
                  key: 'supportProvider.supportRequests.errors.deliveryFormatRequired',
                  fallback: 'Delivery format is required',
                },
              },
            ],
          },
          {
            name: 'capacity',
            type: 'text',
            required: true,
            label: {
              key: 'supportProvider.supportRequests.labels.maxCapacity',
              fallback: 'Max Capacity (Participants)',
            },
            placeholder: {
              key: 'supportProvider.supportRequests.placeholders.capacity',
              fallback: 'e.g. 15',
            },
            inputProps: {
              keyboardType: 'numeric',
            },
            validation: [
              {
                rule: 'required',
                message: {
                  key: 'supportProvider.supportRequests.errors.capacityRequired',
                  fallback: 'Capacity is required',
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
            label: {
              key: 'supportProvider.supportRequests.labels.venueLocation',
              fallback: 'Venue Location',
            },
            placeholder: {
              key: 'supportProvider.supportRequests.placeholders.location',
              fallback: 'e.g. BRAC Hub Room 1',
            },
            visibleIf: [
              {
                name: 'delivery_mode',
                operator: '!=',
                value: 'online',
              },
            ],
            validation: [
              {
                rule: 'required',
                message: {
                  key: 'supportProvider.supportRequests.errors.locationRequired',
                  fallback: 'Venue location is required',
                },
              },
            ],
          },
          {
            name: 'meetingLink',
            type: 'text',
            required: true,
            label: {
              key: 'supportProvider.supportRequests.labels.virtualMeetingLink',
              fallback: 'Virtual Meeting Link',
            },
            placeholder: {
              key: 'supportProvider.supportRequests.placeholders.meetingLink',
              fallback: 'https://...',
            },
            visibleIf: [
              {
                name: 'delivery_mode',
                operator: '!=',
                value: 'offline',
              },
            ],
            validation: [
              {
                rule: 'required',
                message: {
                  key: 'supportProvider.supportRequests.errors.meetingLinkRequired',
                  fallback: 'Virtual meeting link is required',
                },
              },
            ],
          },
        ],
      },
    ],
  },
];

// Assets reuse the session details section; schedule/duration/capacity are replaced by value and quantity
export const ACCEPT_ASSET_REQUEST_FORM_SCHEMA: FormSection[] = [
  ACCEPT_AND_SCHEDULE_FORM_SCHEMA[0],
  {
    type: 'section',
    id: 'scheduleFormatCapacity',
    ...ACCEPT_AND_SCHEDULE_FORM_SECTION_STYLES,
    title: {
      key: 'supportProvider.supportRequests.titles.scheduleFormat',
      fallback: 'Schedule, Format & Capacity',
    },
    icon: 'Calendar',
    rows: [
      {
        fields: [
          {
            name: 'estimatedValue',
            type: 'text',
            required: true,
            label: {
              key: 'supportProvider.supportRequests.labels.estimatedValue',
              fallback: 'Estimated Asset Value per Participant (Rands)',
            },
            placeholder: {
              key: 'supportProvider.supportRequests.placeholders.estimatedValue',
              fallback: 'R 0.00',
            },
            inputProps: {
              keyboardType: 'numeric',
            },
            validation: [
              {
                rule: 'required',
                message: {
                  key: 'supportProvider.supportRequests.errors.estimatedValueRequired',
                  fallback: 'Estimated asset value is required',
                },
              },
              {
                rule: 'pattern',
                value: '^[0-9]+(\\.[0-9]{1,2})?$',
                message: {
                  key: 'supportProvider.supportRequests.errors.invalidNumber',
                  fallback: 'Please enter a valid number',
                },
              },
            ],
          },
          {
            name: 'capacity',
            type: 'text',
            required: true,
            label: {
              key: 'supportProvider.supportRequests.labels.availableQuantity',
              fallback: 'Available Quantity',
            },
            placeholder: {
              key: 'supportProvider.supportRequests.placeholders.availableQuantity',
              fallback: 'e.g. 50',
            },
            inputProps: {
              keyboardType: 'numeric',
            },
            validation: [
              {
                rule: 'required',
                message: {
                  key: 'supportProvider.supportRequests.errors.availableQuantityRequired',
                  fallback: 'Available quantity is required',
                },
              },
              {
                rule: 'pattern',
                value: '^[1-9][0-9]*$',
                message: {
                  key: 'supportProvider.supportRequests.errors.invalidNumber',
                  fallback: 'Please enter a valid number',
                },
              },
            ],
          },
        ],
      },
    ],
  },
];

// Additional Services: start/end date-times come from the request, always offline (no format, venue or link)
export const ACCEPT_ADDITIONAL_SERVICE_FORM_SCHEMA: FormSection[] = [
  ACCEPT_AND_SCHEDULE_FORM_SCHEMA[0],
  {
    type: 'section',
    id: 'scheduleFormatCapacity',
    ...ACCEPT_AND_SCHEDULE_FORM_SECTION_STYLES,
    title: {
      key: 'supportProvider.supportRequests.titles.scheduleFormat',
      fallback: 'Schedule, Format & Capacity',
    },
    icon: 'Calendar',
    rows: [
      {
        fields: [
          {
            name: 'start_date',
            type: 'datetime',
            required: true,
            label: { key: 'supportProvider.supportRequests.labels.startDate', fallback: 'Start Date' },
            placeholder: { key: 'supportProvider.supportRequests.placeholders.startDate', fallback: 'DD/MM/YYYY HH:MM' },
            validation: [
              {
                rule: 'required',
                message: {
                  key: 'supportProvider.supportRequests.errors.startDateRequired',
                  fallback: 'Start date is required',
                },
              },
            ],
          },
          {
            name: 'end_date',
            type: 'datetime',
            required: true,
            label: { key: 'supportProvider.supportRequests.labels.endDate', fallback: 'End Date' },
            placeholder: { key: 'supportProvider.supportRequests.placeholders.endDate', fallback: 'DD/MM/YYYY HH:MM' },
            validation: [
              {
                rule: 'required',
                message: {
                  key: 'supportProvider.supportRequests.errors.endDateRequired',
                  fallback: 'End date is required',
                },
              },
              {
                rule: 'dateCompare',
                value: { field: 'start_date', operator: '>=' },
                message: {
                  key: 'errors.dateCompareStartDate',
                  fallback: 'End Date must be after or equal to Start Date.',
                },
              },
            ],
          },
        ],
      },
      {
        fields: [(ACCEPT_AND_SCHEDULE_FORM_SCHEMA[1] as any).rows[1].fields[1]],
      },
    ],
  },
];
