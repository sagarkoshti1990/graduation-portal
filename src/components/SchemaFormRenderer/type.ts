
// ─── Types ────────────────────────────────────────────────────────────────────

export interface ValidationRule {
  rule:
    | 'required'
    | 'email'
    | 'minLength'
    | 'maxLength'
    | 'pattern'
    | 'matchField'
    | 'dateNotInFuture'
    | 'fileType'
    | 'fileCount';
  /**
   * Numeric/string payload depending on rule (minLength value, pattern string,
   * field name); `fileType` takes a string array of allowed MIME types.
   */
  value?: number | string | string[];
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
  DateTime: 'datetime',
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
  /** `file` fields only: allow selecting/storing more than one file (stored as an array). Default/undefined = single file, unchanged from before. */
  multiple?: boolean;
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
