/**
 * CREATE_USER_FORM_SCHEMA
 *
 * Schema-driven definition for the Create User form.
 * Each section contains rows; each row contains fields.
 * Field-level validation rules are declared inline and enforced
 * by SchemaFormRenderer at submit time.
 */

import { FormSection } from "@components/SchemaFormRenderer/type";

// ─── Schema ───────────────────────────────────────────────────────────────────

export const INPUT_STYLE = {
  variant: 'outline' as const,
  size: 'sm' as const,
  bg: '$bgSidebar',
} as const;

const TITLE_STYLE = {
  fontSize: 14, fontWeight: 'normal', color: '$textMutedForeground', p: 0, m: 0,
} as const;

const CONTAINER_STYLE = {
  borderWidth: 0, p: 0, m: 0,
} as const;

export const CREATE_USER_FORM_SCHEMA: FormSection[] = [
  {
    type: "section",
    id: 'personalInformation',
    icon: 'User',
    title: { key: 'personalInformation', fallback: 'Personal Information' },
    _title: TITLE_STYLE,
    _container: CONTAINER_STYLE,
    rows: [
      {
        fields: [
          {
            name: 'name',
            type: 'text',
            autoFocus: true,
            required: true,
            label: { key: 'name', fallback: 'Name' },
            placeholder: { key: 'namePlaceholder', fallback: 'Enter Name' },
            validation: [
              {
                rule: 'required',
                message: {
                  key: 'errors.nameRequired',
                  fallback: 'Name is required',
                },
              },
              {
                rule: 'minLength',
                value: 2,
                message: {
                  key: 'errors.nameMin',
                  fallback: 'Name must be at least 2 characters',
                },
              },
              {
                rule: 'maxLength',
                value: 100,
                message: {
                  key: 'errors.nameMax',
                  fallback: 'Name is too long',
                },
              },
              {
                rule: 'pattern',
                value: '^[A-Z][a-z]*(?: [A-Z][a-z]*)*$',
                message: {
                  key: 'errors.nameFormat',
                  fallback: 'Each name must start with a capital letter',
                },
              },
              {
                rule: 'pattern',
                value: '^[A-Z][a-z]*(?:[ \'-][A-Z][a-z]*)*$',
                message: {
                  key: 'errors.nameFormat',
                  fallback: 'Each name must start with a capital letter',
                },
              },
            ]
          },
          {
            name: 'email',
            type: 'email',
            required: true,
            icon: 'Mail',
            label: { key: 'email', fallback: 'Email Address' },
            placeholder: { key: 'emailPlaceholder', fallback: 'user@skillssa.co.za' },
            inputProps: { keyboardType: 'email-address', autoCapitalize: 'none' },
            validation: [
              { rule: 'required', message: { key: 'errors.emailRequired', fallback: 'Email address is required' } },
              { rule: 'email', message: { key: 'errors.emailInvalid', fallback: 'Enter a valid email address' } },
              { rule: 'maxLength', value: 254, message: { key: 'errors.emailLength', fallback: 'Email address is too long', } },
              { rule: 'pattern', value: '^\\S(?:.*\\S)?$', message: { key: 'errors.emailSpaces', fallback: 'Email must not start or end with spaces', } },
            ],
          },
        ],
      },
      {
        fields: [
          {
            name: 'username',
            type: 'text',
            required: true,
            label: { key: 'username', fallback: 'Username' },
            placeholder: { fallback: 'Enter username' },
            validation: [
              { rule: 'required', message: { key: 'errors.usernameRequired', fallback: 'Username is required' } },
              {
                rule: 'pattern',
                value: '^(?![0-9]+$)[A-Za-z0-9_.@]+$',
                message: {
                  key: 'errors.usernameInvalid',
                  fallback: 'Username can contain only letters, numbers, underscores, dots, and @',
                },
              },
            ],
          },
          {
            name: 'nationalId',
            type: 'text',
            required: true,
            label: { key: 'nationalId', fallback: 'National ID' },
            placeholder: { key: 'nationalIdPlaceholder', fallback: 'Enter National ID' },
            inputProps: { keyboardType: 'numeric', maxLength: 20 },
            validation: [
              {
                rule: 'required',
                message: {
                  key: 'errors.nationalIdRequired',
                  fallback: 'National ID is required',
                },
              },
              {
                rule: 'pattern',
                value: '^[0-9]{1,20}$',
                message: {
                  key: 'errors.nationalIdInvalid',
                  fallback: 'National ID must contain only digits and can be up to 20 digits',
                },
              },
            ],
          },
        ],
      },
      {
        fields: [
          {
            type: 'group',
            name: 'phoneNumber',
            required: false,
            label: { key: 'phoneNumber', fallback: 'Phone Number' },
            _input: INPUT_STYLE,
            fields: [
              {
                name: 'countryCode',
                type: 'select',
                required: false,
                label: { key: 'countryCode', fallback: 'Country Code' },
                defaultValue: '+27',
                optionsSource: 'countryCodes',
                searchable: true,
              },
              {
                name: 'phoneNumber',
                type: 'tel',
                required: false,
                label: { key: 'phoneNumber', fallback: 'Phone Number' },
                placeholder: { key: 'phoneNumberPlaceholder', fallback: '000 000 0000' },
                inputProps: { keyboardType: 'phone-pad', maxLength: 10 },
                validation: [
                  {
                    rule: 'pattern',
                    value: '^[0-9]{9,10}$',
                    message: { key: 'errors.phoneInvalid', fallback: 'Phone number must be 9 or 10 digits' },
                  },
                ],
              },
            ],
          },
          {
            type: 'group',
            name: 'alternativePhone',
            required: false,
            label: { key: 'alternativePhone', fallback: 'Alt Phone Number' },
            _input: INPUT_STYLE,
            fields: [
              {
                name: 'alternativePhoneCode',
                type: 'select',
                required: false,
                label: { key: 'alternativeCountryCode', fallback: 'Alt Country Code' },
                _input: INPUT_STYLE,
                defaultValue: '+27',
                optionsSource: 'countryCodes',
                searchable: true,
              },
              {
                name: 'alternativePhone',
                type: 'tel',
                required: false,
                label: { key: 'alternativePhone', fallback: 'Alternative Phone' },
                placeholder: { key: 'alternativePhonePlaceholder', fallback: '000 000 0000' },
                _input: INPUT_STYLE,
                inputProps: { keyboardType: 'phone-pad', maxLength: 10 },
                validation: [
                  {
                    rule: 'pattern',
                    value: '^[0-9]{9,10}$',
                    message: { key: 'errors.altPhoneInvalid', fallback: 'Alt phone number must be 9 or 10 digits' },
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },

  {
    type: "section",
    id: 'roleAndPermissions',
    icon: 'Shield',
    title: { key: 'roleAndPermissions', fallback: 'Role & Permissions' },
    _title: TITLE_STYLE,
    _container: CONTAINER_STYLE,
    rows: [
      {
        fields: [
          {
            name: 'roleId',
            type: 'select',
            required: true,
            zIndex: 1000,
            label: { key: 'role', fallback: 'Role' },
            placeholder: { key: 'rolePlaceholder', fallback: 'Select user role' },
            optionsSource: 'roles',
            validation: [
              { rule: 'required', message: { key: 'errors.roleRequired', fallback: 'Role is required' } },
            ],
          },
        ],
      },
    ],
  },

  {
    type: "section",
    id: 'additionalInformation',
    icon: 'FileText',
    title: { key: 'additionalInformation', fallback: 'Additional Information' },
    _title: TITLE_STYLE,
    _container: CONTAINER_STYLE,
    rows: [
      {
        fields: [
          {
            name: 'gender',
            type: 'select',
            required: true,
            label: { key: 'gender', fallback: 'Gender' },
            placeholder: { fallback: 'Select gender' },
            optionsSource: 'genders',
            validation: [
              { rule: 'required', message: { key: 'errors.genderRequired', fallback: 'Gender is required' } },
            ],
          },
          {
            name: 'dob',
            type: 'date',
            required: true,
            zIndex: 999,
            label: { key: 'dob', fallback: 'DOB' },
            placeholder: { fallback: 'DD/MM/YYYY' },
            valueFormat: 'YYYY_MM_DD',
            displayFormat: 'dateFormat@DD/MM/YYYY',
            validation: [
              { rule: 'required', message: { key: 'errors.dobRequired', fallback: 'Date of birth is required' } },
              { rule: 'dateNotInFuture', message: { key: 'errors.dobFuture', fallback: 'Date of birth cannot be in the future' } },
              {
                rule: 'minAge',
                value: 18,
                message: {
                  key: 'errors.dobMinAge',
                  fallback: 'User must be at least 18 years old',
                },
              },
            ],
          },
        ],
      },

      // {
      //   visibleWhen: { flag: 'isSupervisorOrLC' },
      //   fields: [
      //     {
      //       name: 'employee_id',
      //       type: 'text',
      //       required: true,
      //       visibleWhen: { flag: 'isSupervisorOrLC' },
      //       label: { key: 'employeeId', fallback: 'Employee ID' },
      //       placeholder: {
      //         key: 'employeeIdPlaceholder',
      //         fallback: 'Enter Employee ID',
      //       },
      //       validation: [
      //         {
      //           rule: 'required',
      //           message: {
      //             key: 'errors.employeeIdRequired',
      //             fallback: 'Employee ID is required',
      //           },
      //         },
      //         {
      //           rule: 'pattern',
      //           value: '^[A-Z]{3}[0-9]{5}$',
      //           message: {
      //             key: 'errors.employeeIdInvalid',
      //             fallback: 'Enter a valid Employee ID (e.g. ADM00001)',
      //           },
      //         },
      //       ],
      //     },
      //   ],
      // },
      {
        visibleWhen: { flag: 'isSupervisorOrLC' },
        fields: [
          {
            name: 'organisationId',
            type: 'select',
            required: true,
            label: { key: 'organisation', fallback: 'Organisation' },
            placeholder: { key: 'organisationPlaceholder', fallback: 'Select organisation' },
            optionsSource: 'organisations',
            validation: [
              { rule: 'required', message: { key: 'errors.organisationRequired', fallback: 'Organisation is required' } },
            ],
          },
          {
            name: 'positionId',
            type: 'select',
            required: true,
            label: { key: 'position', fallback: 'Position' },
            placeholder: { key: 'positionPlaceholder', fallback: 'Select position' },
            optionsSource: 'positions',
            validation: [
              { rule: 'required', message: { key: 'errors.positionRequired', fallback: 'Position is required' } },
            ],
          },
        ],
      },
    ],
  },

  {
    type: "section",
    id: 'geographicAssignment',
    icon: 'MapPin',
    title: { key: 'geographicAssignment', fallback: 'Geographic Assignment' },
    _title: TITLE_STYLE,
    _container: CONTAINER_STYLE,
    hint: {
      type: 'info', icon: "Lock",
      _icon: { color: "$danger500" },
      _title: { color: "$text200" },
      title: { fallback: 'A temporary password will be generated for the account. The user must reset this password before they can log in for the first time.' }
    },
    rows: [
      {
        fields: [
          {
            name: 'provinceId',
            type: 'select',
            required: false,
            label: { key: 'province', fallback: 'Province' },
            placeholder: { key: 'provincePlaceholder', fallback: 'Select province' },
            optionsSource: 'provinces',
            visibleIf: [
              { name: 'isParticipant', operator: '!=', value: 'true' }
            ],
            validation: [],
          },
          {
            name: 'siteId',
            type: 'select',
            required: false,
            dependsOn: 'provinceId',
            disabledWhen: { field: 'provinceId', empty: true },
            label: { key: 'site', fallback: 'Site' },
            placeholder: { key: 'sitePlaceholder', fallback: 'Select province first' },
            placeholderWhenReady: { key: 'sitePlaceholderReady', fallback: 'Select site' },
            optionsSource: 'sites',
            visibleIf: [
              { name: 'isParticipant', operator: '!=', value: 'true' }
            ],
            validation: [],
          },
          {
            name: 'provinceId',
            type: 'select',
            required: true,
            label: { key: 'province', fallback: 'Province' },
            placeholder: { key: 'provincePlaceholder', fallback: 'Select province' },
            optionsSource: 'provinces',
            visibleIf: [
              { name: 'isParticipant', operator: '===', value: 'true' }
            ],
            validation: [
              { rule: 'required', message: { key: 'errors.provinceRequired', fallback: 'Province is required' } },
            ],
          },
          {
            name: 'siteId',
            type: 'select',
            required: true,
            dependsOn: 'provinceId',
            disabledWhen: { field: 'provinceId', empty: true },
            label: { key: 'site', fallback: 'Site' },
            placeholder: { key: 'sitePlaceholder', fallback: 'Select province first' },
            placeholderWhenReady: { key: 'sitePlaceholderReady', fallback: 'Select site' },
            optionsSource: 'sites',
            visibleIf: [
              { name: 'isParticipant', operator: '===', value: 'true' }
            ],
            validation: [
              { rule: 'required', message: { key: 'errors.siteRequired', fallback: 'Site is required' } },
            ],
          },
        ],
      },
      {
        fields: [
          {
            name: 'location',
            type: 'textarea',
            required: false,
            icon: 'MapPin',
            label: { key: 'address', fallback: 'Address' },
            placeholder: { key: 'addressPlaceholder', fallback: 'Enter address' },
            _input: {
              borderWidth: '1 !important',
              height: "auto",
            },
            validation: [
              { rule: 'maxLength', value: 255, message: { key: 'errors.addressMax', fallback: 'Address is too long' } },
              {
                rule: 'pattern',
                value: '^(?=.*[a-zA-Z0-9])[a-zA-Z0-9\\s,.\\/\\-\\#\\\'&()[\\]]+$',
                message: {
                  key: 'errors.addressInvalid',
                  fallback: 'Address must contain at least one letter or number, and only allowed characters',
                },
              },
            ],
          },
        ],
      },
    ],
  },
];
