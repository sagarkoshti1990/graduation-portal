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
  operator?: VisibleIfOperator;
  value?: any;
}

/** Severity of a `hint` object — drives its default icon/colors when `icon` isn't set */
export type HintSeverity = 'info' | 'warning' | 'danger' | 'success';

export interface HintBullet {
  key?: string;
  fallback: string;
}

export interface HintObject {
  type?: HintSeverity;
  /** Lucide icon name; falls back to a default icon for `type` when omitted */
  icon?: string;
  title?: { key?: string; fallback: string };
  bullets?: HintBullet[];
}

/** A simple helper string, or a richer info/warning/danger/success banner */
export type Hint = string | HintObject;

export const FORM_FIELD_TYPES = {
  TEXT: 'text',
  EMAIL: 'email',
  TEL: 'tel',
  PASSWORD: 'password',
  SELECT: 'select',
  DATE: 'date',
  TEXTAREA: 'textarea',
  NOTE: 'note',
  Time: 'time',
  GROUP: 'group',
  /** Read-only display of another field's label/value, resolved by name */
  VIEW: 'view',
  /** Single-select rendered as a row of clickable pill buttons instead of a dropdown */
  PILLSELECT: 'pillselect',
  /** Multi-select dropdown with a checkbox per option; stores `string[]` */
  MULTISELECT: 'multiselect',
  /** Multi-select rendered as a row of togglable pill buttons; stores `string[]` */
  PILLMULTISELECT: 'pillmultiselect',
  /** File upload trigger */
  FILE: 'file',
} as const;

export type FormFieldType = typeof FORM_FIELD_TYPES[keyof typeof FORM_FIELD_TYPES];

export interface FormField {
  name?: string;
  type: FormFieldType;
  label: { key: string; fallback: string };
  required?: boolean;
  placeholder?: { key?: string; fallback: string };
  /** Plain string for most fields; `string[]` for multiselect/pillmultiselect defaults */
  defaultValue?: string | string[];
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
  /** Small helper text rendered under the field (currently used by `file` fields) */
  subLabel?: { key?: string; fallback: string };
  /** Renders an "(optional)" tag next to the label (currently used by `file` fields) */
  showOptionalTag?: boolean;
  /** Rendered below the label, above the input, using the standard helper-text typography */
  subTitle?: { key?: string; fallback: string };
  /** Informational message rendered above the input — simple string or a severity banner */
  hint?: Hint;
  /**
   * UI-only prop overrides, merged (never replacing) over the corresponding
   * element's default props in `FieldContainer`. `_input` is distinct from
   * `inputProps` above — it's for input *behavior/config* (size, maxLength,
   * placeholder, autoFocus), not styling/color tokens.
   */
  _container?: any;
  _title?: any;
  _subTitle?: any;
  _input?: any;
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
  /** Larger page-level heading, distinct from the compact card-header `title` */
  subTitle?: { key?: string; fallback: string };
  /** Informational message rendered below the title/subTitle — simple string or a severity banner */
  hint?: Hint;
  children?: FormSection[]
  rows?: FormRow[];
  /**
   * UI-only prop overrides, merged (never replacing) over the corresponding
   * element's default props. `_container`/`_content` apply to section AND tab
   * nodes; `_header`/`_icon` apply to section nodes only (tabs have no header
   * concept of their own beyond the tab button, which is intentionally not
   * overridable here since its styling is driven by active/inactive state).
   */
  _container?: any;
  _content?: any;
  _header?: any;
  _title?: any;
  _subTitle?: any;
  _icon?: any;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const INPUT_STYLE = {
  variant: 'outline' as const,
  size: 'sm' as const,
  bg: '#e8f0f9ff',
  borderRadius: '$md',
  borderWidth: 1,
  borderColor: 'transparent',
  '$focus': {
    borderColor: '#833247ff' as const,
    borderWidth: 1 as const,
    boxShadow: '0 0 0 2px rgba(131, 50, 71, 0.2)' as const,
    '$web-boxShadow': '0 0 0 2px rgba(131, 50, 71, 0.2)' as const,
  },
} as const;

export const CREATE_USER_FORM_SCHEMA: FormSection[] = [
  {
    type:"section",
    id: 'personalInformation',
    icon: 'User',
    title: { key: 'personalInformation', fallback: 'Personal Information' },
    _title: { fontSize: 14, fontWeight: 'normal', color: '$textMutedForeground', p: 0, m: 0, },
    _container: { borderWidth: 0, p: 0, m: 0, },
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
            _input: INPUT_STYLE,
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
            _input: INPUT_STYLE,
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
            _input: INPUT_STYLE,
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
            _input: INPUT_STYLE,
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
                _input: INPUT_STYLE,
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
                placeholder: { key: 'alternativePhonePlaceholder', fallback: '000 000 000' },
                _input: INPUT_STYLE,
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
    _title: { fontSize: 14, fontWeight: 'normal', color: '$textMutedForeground', p: 0, m: 0, },
    _container: { borderWidth: 0, p: 0, m: 0, },
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
            _input: INPUT_STYLE,
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
    _title: { fontSize: 14, fontWeight: 'normal', color: '$textMutedForeground', p: 0, m: 0, },
    _container: { borderWidth: 0, p: 0, m: 0, },
    rows: [
      {
        fields: [
          {
            name: 'gender',
            type: 'select',
            required: true,
            label: { key: 'gender', fallback: 'Gender' },
            placeholder: { fallback: 'Select gender' },
            _input: INPUT_STYLE,
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
            _input: INPUT_STYLE,
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
            _input: INPUT_STYLE,
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
            _input: INPUT_STYLE,
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
            _input: INPUT_STYLE,
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
    _title: { fontSize: 14, fontWeight: 'normal', color: '$textMutedForeground', p: 0, m: 0, },
    _container: { borderWidth: 0, p: 0, m: 0, },
    rows: [
      {
        fields: [
          {
            name: 'provinceId',
            type: 'select',
            required: false,
            label: { key: 'province', fallback: 'Province' },
            placeholder: { key: 'provincePlaceholder', fallback: 'Select province' },
            _input: INPUT_STYLE,
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
            _input: INPUT_STYLE,
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
            _input: INPUT_STYLE,
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
