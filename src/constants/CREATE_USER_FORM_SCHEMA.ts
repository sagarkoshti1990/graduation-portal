/**
 * CREATE_USER_FORM_SCHEMA
 *
 * Schema-driven definition for the Create User form.
 * Each section contains rows; each row contains fields.
 * Field-level validation rules are declared inline and enforced
 * by SchemaFormRenderer at submit time.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ValidationRule {
  rule:
    | 'required'
    | 'email'
    | 'minLength'
    | 'maxLength'
    | 'pattern'
    | 'matchField'
    | 'dateNotInFuture';
  /** Numeric or string payload depending on rule (e.g. minLength value, pattern string, field name) */
  value?: number | string;
  message: { key: string; fallback: string };
}

export interface VisibleWhenFlag {
  flag: string;
}

export interface DisabledWhenCondition {
  field: string;
  empty: boolean;
}

/** Comparison operator supported by a field's `visibleIf` conditions. */
export type VisibleIfOperator = '===' | '!=' | '>' | '<' | '>=' | '<=';

/**
 * A single condition evaluated against another field's current value.
 * A field is rendered only when every condition in its `visibleIf` array is true.
 */
export interface VisibleIfCondition {
  /** Name of the field whose current value is being compared */
  name: string;
  operator: VisibleIfOperator;
  value: any;
}

export const FORM_FIELD_TYPES = {
  TEXT: 'text',
  EMAIL: 'email',
  TEL: 'tel',
  PASSWORD: 'password',
  SELECT: 'select',
  DATE: 'date',
  TEXTAREA: 'textarea',
  NOTE: 'note',
  GROUP: 'group',
  /** Read-only display of another field's label/value, resolved by name */
  VIEW: 'view',
} as const;

export type FormFieldType = typeof FORM_FIELD_TYPES[keyof typeof FORM_FIELD_TYPES];

export interface FormField {
  name?: string;
  type: FormFieldType;
  label: { key: string; fallback: string };
  required?: boolean;
  placeholder?: { key?: string; fallback: string };
  defaultValue?: string;
  /** When present and the flag resolves to false, this field is hidden */
  visibleWhen?: VisibleWhenFlag;
  disabled?: boolean;
  autoFocus?: boolean;
  icon?: string;
  /** Gluestack zIndex override for dropdowns that must float above siblings */
  zIndex?: number;
  /** Key into the options map provided at runtime */
  optionsSource?: string;
  searchable?: boolean;
  /** Marks this field as depending on another field's value (informational) */
  dependsOn?: string;
  disabledWhen?: DisabledWhenCondition;
  inputProps?: {
    keyboardType?: string;
    autoCapitalize?: string;
    maxLength?: number;
  };
  /** Display format hint for date fields (e.g. "YYYY-MM-DD") */
  displayFormat?: string;
  /** Storage format hint for date fields (e.g. "YYYY_MM_DD") */
  valueFormat?: string;
  /** Password fields with the same group share a single visibility toggle */
  toggleVisibility?: boolean;
  visibilityToggleGroup?: string;
  validation?: ValidationRule[];
  placeholderWhenReady?: { key: string; fallback: string };
  fields?: FormField[];
  isReadOnly?: boolean;
  /** Field is rendered only when every condition here evaluates to true (AND logic) */
  visibleIf?: VisibleIfCondition[];
}

export interface FormRow {
  id?: string;
  fields: FormField[];
  /** If set, the entire row is hidden unless the named flag is truthy */
  visibleWhen?: VisibleWhenFlag;
}

/**
 * A schema node — used for tabs, sections, and (nested) rows.
 * Any node with `children` is rendered recursively, to unlimited depth.
 */
export interface FormSection {
  id: string;
  type: string;
  /** Lucide icon name */
  icon?: string;
  title?: { key: string; fallback: string };
  /** Alternate to `title` accepted for tab/section nodes */
  label?: { key?: string; fallback: string };
  subheading?: { key?: string; fallback: string };
  children?: FormSection[]
  rows?: FormRow[];
}

// ─── Schema ───────────────────────────────────────────────────────────────────

export const CREATE_USER_FORM_SCHEMA: FormSection[] = [
  {
    type:"section",
    id: 'personalInformation',
    icon: 'User',
    title: { key: 'personalInformation', fallback: 'Personal Information' },
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
              { rule: 'required', message: { key: 'errors.nameRequired', fallback: 'Name is required' } },
              { rule: 'maxLength', value: 100, message: { key: 'errors.nameMax', fallback: 'Name is too long' } },
            ],
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
              { rule: 'minLength', value: 3, message: { key: 'errors.usernameMin', fallback: 'Username must be at least 3 characters' } },
            ],
          },
          {
            name: 'nationalId',
            type: 'text',
            required: true,
            label: { key: 'nationalId', fallback: 'National ID' },
            placeholder: { key: 'nationalIdPlaceholder', fallback: 'Enter National ID' },
            inputProps: { keyboardType: 'numeric' },
            validation: [
              {
                rule: 'required',
                message: {key: 'errors.nationalIdRequired', fallback: 'National ID is required'},
              },
            ],
          },
        ],
      },
      {
        fields: [
          {
            type: 'group',
            required: false,
            label: { key: 'phoneNumber', fallback: 'Phone Number' },
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
                placeholder: { key: 'phoneNumberPlaceholder', fallback: '000 000 000' },
                inputProps: { keyboardType: 'phone-pad', maxLength: 10 },
                validation: [
                  {
                    rule: 'pattern',
                    value: '^[0-9]{10}$',
                    message: { key: 'errors.phoneInvalid', fallback: 'Enter a valid 10-digit phone number' },
                  },
                ],
              },
            ],
          },
          {
            type: 'group',
            required: false,
            label: { key: 'alternativePhone', fallback: 'Alt Phone Number' },
            fields: [
              {
                name: 'alternativePhoneCode',
                type: 'select',
                required: false,
                label: { key: 'alternativeCountryCode', fallback: 'Alt Country Code' },
                defaultValue: '+27',
                optionsSource: 'countryCodes',
                searchable: true,
              },
              {
                name: 'alternativePhone',
                type: 'tel',
                required: false,
                label: { key: 'alternativePhone', fallback: 'Alternative Phone' },
                placeholder: { key: 'alternativePhonePlaceholder', fallback: '000 000 000' },
                inputProps: { keyboardType: 'phone-pad', maxLength: 10 },
                validation: [
                  {
                    rule: 'pattern',
                    value: '^[0-9]{10}$',
                    message: { key: 'errors.altPhoneInvalid', fallback: 'Enter a valid 10-digit phone number' },
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
    type:"section",
    id: 'roleAndPermissions',
    icon: 'Shield',
    title: { key: 'roleAndPermissions', fallback: 'Role & Permissions' },
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
    type:"section",
    id: 'additionalInformation',
    icon: 'FileText',
    title: { key: 'additionalInformation', fallback: 'Additional Information' },
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
            placeholder: { fallback: 'YYYY-MM-DD' },
            valueFormat: 'YYYY_MM_DD',
            displayFormat: 'YYYY-MM-DD',
            validation: [
              { rule: 'required', message: { key: 'errors.dobRequired', fallback: 'Date of birth is required' } },
              { rule: 'dateNotInFuture', message: { key: 'errors.dobFuture', fallback: 'Date of birth cannot be in the future' } },
            ],
          },
        ],
      },

      {
        visibleWhen: { flag: 'isSupervisorOrLC' },
        fields: [
          {
            name: 'employee_id',
            type: 'text',
            required: true,
            visibleWhen: { flag: 'isSupervisorOrLC' },
            label: { key: 'employeeId', fallback: 'Employee ID' },
            placeholder: { key: 'employeeIdPlaceholder', fallback: 'Enter Employee ID' },
            validation: [
              { rule: 'required', message: { key: 'errors.employeeIdRequired', fallback: 'Employee ID is required' } },
            ],
          },
        ],
      },
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
    type:"section",
    id: 'geographicAssignment',
    icon: 'MapPin',
    title: { key: 'geographicAssignment', fallback: 'Geographic Assignment' },
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
            validation: [
              { rule: 'maxLength', value: 255, message: { key: 'errors.addressMax', fallback: 'Address is too long' } },
            ],
          },
        ],
      },
      {
        fields: [
          {
            name: 'tempPasswordNote',
            type: 'note',
            required: false,
            icon: 'Info',
            label: {
              key: 'tempPasswordNote',
              fallback: 'A temporary password will be generated for the account. The user must reset this password before they can log in for the first time.',
            },
          },
        ],
      },
    ],
  },
];
