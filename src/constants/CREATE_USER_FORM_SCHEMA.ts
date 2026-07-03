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

export interface FormField {
  name: string;
  type: 'text' | 'email' | 'tel' | 'password' | 'select' | 'date' | 'textarea';
  required: boolean;
  label: { key: string; fallback: string };
  placeholder?: { key?: string; fallback: string };
  /** When present and the flag resolves to false, this field is hidden */
  visibleWhen?: VisibleWhenFlag;
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
}

export interface FormRow {
  fields: FormField[];
  /** If set, the entire row is hidden unless the named flag is truthy */
  visibleWhen?: VisibleWhenFlag;
}

export interface FormSection {
  id: string;
  /** Lucide icon name */
  icon: string;
  title: { key: string; fallback: string };
  rows: FormRow[];
}

// ─── Schema ───────────────────────────────────────────────────────────────────

export const CREATE_USER_FORM_SCHEMA: FormSection[] = [
  {
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
        ],
      },
      {
        fields: [
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
          {
            name: 'nationalId',
            type: 'text',
            required: true,
            label: { key: 'nationalId', fallback: 'National ID' },
            placeholder: { key: 'nationalIdPlaceholder', fallback: 'Enter National ID' },
            inputProps: { keyboardType: 'numeric' },
            validation: [
              {
                rule: 'pattern',
                value: '^[0-9]{13}$',
                message: { key: 'errors.nationalIdInvalid', fallback: 'National ID must be 13 digits' },
              },
            ],
          },
        ],
      },
      {
        fields: [
          {
            name: 'countryCode',
            type: 'select',
            required: false,
            label: { key: 'countryCode', fallback: 'Country Code' },
            placeholder: { fallback: '+27' },
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
        fields: [
          {
            name: 'alternativePhoneCode',
            type: 'select',
            required: false,
            label: { key: 'alternativeCountryCode', fallback: 'Alt Country Code' },
            placeholder: { fallback: '+27' },
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

  {
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
        fields: [
          {
            name: 'password',
            type: 'password',
            required: true,
            toggleVisibility: true,
            visibilityToggleGroup: 'userPassword',
            label: { key: 'password', fallback: 'Password' },
            placeholder: { fallback: 'Enter password' },
            validation: [
              {
                rule: 'minLength',
                value: 8,
                message: {
                  key: 'errors.passwordMinLength',
                  fallback: 'Password must be at least 8 characters long',
                },
              },
              {
                rule: 'pattern',
                value: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#^()_+\\-=[\\]{};:\'",.<>/?\\\\|`~]).+$',
                message: {
                  key: 'errors.passwordInvalid',
                  fallback:
                    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
                },
              },
            ],
          },
          {
            name: 'confirmPassword',
            type: 'password',
            required: true,
            toggleVisibility: true,
            visibilityToggleGroup: 'userPassword',
            label: { key: 'confirmPassword', fallback: 'Confirm Password' },
            placeholder: { fallback: 'Confirm password' },
            validation: [
              { rule: 'required', message: { key: 'errors.confirmPasswordRequired', fallback: 'Please confirm the password' } },
              { rule: 'matchField', value: 'password', message: { key: 'errors.passwordMismatch', fallback: 'Passwords do not match' } },
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
      {
        fields: [
          {
            name: 'employeeId',
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
    ],
  },

  {
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
            name: 'address',
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
    ],
  },
];
