/**
 * SchemaFormRenderer
 *
 * A generic, schema-driven form component. It reads a `FormSection[]` schema and renders
 * the appropriate input widgets, handles field-level validation, conditional visibility,
 * dependency chaining, and password-toggle groups.
 *
 * Usage:
 *   <SchemaFormRenderer
 *     schema={CREATE_USER_FORM_SCHEMA}
 *     values={values}
 *     errors={errors}
 *     onFieldChange={handleChange}
 *     optionsMap={optionsMap}
 *     disabled={isSubmitting}
 *     isMobile={isMobile}
 *     t={t}
 *     firstNameRef={firstNameRef}
 *   />
 */

import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  VStack,
  HStack,
  Text,
  Box,
  Input,
  InputField,
  Pressable,
  Textarea,
  TextareaInput,
  Card,
  Tabs,
  TabsTabList,
  TabsTab,
  TabsTabPanels,
  TabsTabPanel,
  TabsTabTitle,
  Button,
  ButtonText,
  Modal,
  Progress,
  ProgressFilledTrack,
  ButtonIcon,
  Image,
  Spinner,
} from '@ui';
import { LucideIcon } from '@ui/index';
import Select from '@components/ui/Inputs/Select';
import DatePicker from '@components/ui/Inputs/DatePicker';
import { openFilePicker } from '../../project-player/components/Task/FileEvidence/file-picker';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';
import styles from './Styles';
import {
  type FormSection,
  type FormField,
  type ValidationRule,
  type VisibleIfCondition,
  type DisabledWhenCondition,
  type Hint,
  type FieldCompareValue,
  FORM_FIELD_TYPES,
} from './type';
import { formatFileSize } from '../../project-player/utils/taskUtils';
import moment from 'moment';
import Styles from './Styles';

// ─── Local FastInputField ─────────────────────────────────────────────────────
// Inlined here to avoid a circular import from the parent screen module.
// Prevents cursor-jumping during fast typing on heavy screens by buffering
// local state while the parent's state update is in flight.
export const FastInputField = React.forwardRef(
  ({ value, defaultValue, onChangeText, ...props }: any, ref: any) => {
    const initialValue = value !== undefined ? value : defaultValue || '';
    const [localValue, setLocalValue] = useState(initialValue);
    const isTyping = useRef(false);
    const timeoutRef = useRef<any>(null);

    useEffect(() => {
      if (!isTyping.current && value !== undefined && localValue !== value) {
        setLocalValue(value);
      }
    }, [value]);

    const handleChange = (text: string) => {
      setLocalValue(text);
      isTyping.current = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        isTyping.current = false;
      }, 500);
      if (onChangeText) onChangeText(text);
    };

    return (
      <InputField
        ref={ref}
        {...props}
        value={localValue}
        onChangeText={handleChange}
      />
    );
  },
);
FastInputField.displayName = 'SFR_FastInputField';

// ─── Local FastTextareaInput ──────────────────────────────────────────────────
const FastTextareaInput = React.forwardRef(
  ({ value, defaultValue, onChangeText, ...props }: any, ref: any) => {
    const initialValue = value !== undefined ? value : defaultValue || '';
    const [localValue, setLocalValue] = useState(initialValue);
    const isTyping = useRef(false);
    const timeoutRef = useRef<any>(null);

    useEffect(() => {
      if (!isTyping.current && value !== undefined && localValue !== value) {
        setLocalValue(value);
      }
    }, [value]);

    const handleChange = (text: string) => {
      setLocalValue(text);
      isTyping.current = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        isTyping.current = false;
      }, 500);
      if (onChangeText) onChangeText(text);
    };

    return (
      <TextareaInput
        ref={ref}
        {...props}
        value={localValue}
        onChangeText={handleChange}
      />
    );
  },
);
FastTextareaInput.displayName = 'SFR_FastTextareaInput';

// ─── Types ────────────────────────────────────────────────────────────────────

export type OptionsMap = Record<string, { value: string; label: string }[]>;

export interface SchemaFormRendererProps {
  schema: FormSection[];
  /**
   * Current field values keyed by field name. Most fields store a plain string;
   * `multiselect`/`pillmultiselect` store `string[]`; `file` stores a picked-file
   * asset object (or array of them) — see `FileAsset` below.
   */
  values?: Record<string, any>;
  /** Current field errors keyed by field name */
  errors?: Record<string, string>;
  /** Called when any field value changes */
  onFieldChange?: (name: string, value: any, other?: any) => void;
  /** Resolved options for every optionsSource key referenced in the schema */
  optionsMap?: OptionsMap;
  /** Global disabled state (e.g. while form is submitting) */
  disabled?: boolean;
  /** When true, renders all fields as plain read-only text instead of inputs */
  mode?: string;
  /** Translation function */
  t: (key: string, fallback?: string) => string;
  /** Optional ref forwarded to the first autoFocus field */
  firstNameRef?: React.RefObject<any>;
  /**
   * Called after whole-form validation passes when the user clicks Submit.
   * Only relevant for multi-step schemas (root schema made entirely of 2+ `tab` nodes) —
   * single/no-tab schemas keep managing their own submit button externally, unchanged.
   */
  onSubmit?: (values: Record<string, any>) => void | Promise<void>;
  /** Called when the user clicks Save Draft (multi-step schemas only); no validation is run first */
  onSaveDraft?: (values: Record<string, any>) => void | Promise<void>;
  /** Disables the Previous/Continue/Save Draft/Submit footer buttons while a request is in flight */
  isSubmitting?: boolean;
  /**
   * Global default input props/config applied to every field's input component
   * (size, placeholder, maxLength, autoFocus, etc.) unless a field declares its
   * own `_input`, which wins. Behavior/config only — never styling/color tokens.
   */
  _input?: any;
  /**
   * Uploads a single picked file and returns its URL. When provided, every
   * `file`-type field's value is resolved through this at submit time (see
   * `resolveFileUploads`) before `onSubmit` fires. Omit to leave file values
   * as-is (existing behavior, unchanged).
   */
  uploadService?: (file: FileAsset) => Promise<string>;
  // ── Internal footer (multi-step schemas only) — visibility/text/props overrides ──
  /**
   * Optional, fully caller-controlled element rendered in the footer immediately
   * before the Save Draft button. Render-only — it never touches form state,
   * validation, or the Submit/Save Draft flows.
   */
  customButton?: React.ReactNode;
  showPreviousButton?: boolean;
  showContinueButton?: boolean;
  showSaveDraftButton?: boolean;
  showSubmitButton?: boolean;
  previousButtonText?: string;
  continueButtonText?: string;
  saveDraftButtonText?: string;
  submitButtonText?: string;
  previousButtonProps?: any;
  continueButtonProps?: any;
  saveDraftButtonProps?: any;
  submitButtonProps?: any;
  lodingButton?: any;
}

/**
 * A picked file's resolved shape — matches `openFilePicker`'s actual return value
 * on both native (`@react-native-documents/picker`) and web (wraps a real `File`
 * in `.file` alongside a blob `uri`), never a bare web `File`.
 */
export interface FileAsset {
  uri: string;
  name: string;
  type?: string;
  size?: number;
  file?: any;
}

/** Thrown by `resolveFileUploads` when one or more `file` fields fail to upload. */
export class FileUploadError extends Error {
  failedFieldNames: string[];
  constructor(failedFieldNames: string[]) {
    super(`Failed to upload file(s) for: ${failedFieldNames.join(', ')}`);
    this.name = 'FileUploadError';
    this.failedFieldNames = failedFieldNames;
  }
}

// ─── Validation Engine ────────────────────────────────────────────────────────

/**
 * Helper to check visibility of a field or row based on schema rules.
 */
function isVisible(
  visibleWhen: { flag: string } | undefined,
  values: Record<string, string>,
  optionsMap: OptionsMap,
): boolean {
  if (!visibleWhen?.flag) return true;
  if (visibleWhen.flag === 'isSupervisorOrLC') {
    const roleId = values.roleId || '';
    const selectedRole = optionsMap.roles?.find((r: any) => r.value === roleId);
    const roleLabel = (selectedRole?.label || '').toLowerCase();
    return [
      'supervisor',
      'org_admin',
      'lc',
      'linkage champion',
      'tenant_admin',
    ].some((k: string) => roleLabel.includes(k));
  }
  return true;
}

/**
 * True when a field's stored value should count as "filled in" — non-empty
 * string, a non-empty array (multiselect/pillmultiselect), or a present
 * object (a picked `file` field's asset). Used anywhere a value's presence
 * is checked without needing the string itself (dependsOn/disabledWhen
 * gating, required-field progress counting).
 */
function isValuePresent(value: any): boolean {
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === 'object') return true;
  return !!String(value ?? '').trim();
}

/**
 * Evaluates a single `visibleIf` condition against the current form values.
 * A missing referenced value is treated as a failed condition (field stays hidden).
 */
function evaluateVisibleIfCondition(
  condition: VisibleIfCondition,
  values: Record<string, string>,
): boolean {
  const raw = values[condition.name];
  if (raw === undefined || raw === null) return false;

  switch (condition.operator) {
    case '===':
      return String(raw) === String(condition.value);
    case '!=':
      return String(raw) !== String(condition.value);
    case '>':
      return Number(raw) > Number(condition.value);
    case '<':
      return Number(raw) < Number(condition.value);
    case '>=':
      return Number(raw) >= Number(condition.value);
    case '<=':
      return Number(raw) <= Number(condition.value);
    default:
      return true;
  }
}

/**
 * A field is visible only when every condition in `visibleIf` evaluates to true (AND logic).
 * Undefined/empty `visibleIf` always passes — this keeps the field opt-in and backward compatible.
 */
function isVisibleIf(
  visibleIf: VisibleIfCondition[] | undefined,
  values: Record<string, string>,
): boolean {
  if (!visibleIf?.length) return true;
  return visibleIf.every(condition =>
    evaluateVisibleIfCondition(condition, values),
  );
}

/**
 * Single, centralized `disabledWhen` evaluator — every field type routes
 * through this (via `isFieldDisabled` in `FieldRenderer`) instead of each
 * branch re-implementing its own condition check. `empty` checks presence;
 * `value` reuses the same comparison engine as `visibleIf` (default `===`)
 * so both condition styles share one implementation.
 */
function isDisabledWhen(
  disabledWhen: DisabledWhenCondition | undefined,
  values: Record<string, any>,
): boolean {
  if (!disabledWhen?.field) return false;
  if (disabledWhen.empty) {
    return !isValuePresent(values[disabledWhen.field]);
  }
  if (disabledWhen.value !== undefined) {
    return evaluateVisibleIfCondition(
      { name: disabledWhen.field, operator: disabledWhen.operator, value: disabledWhen.value },
      values,
    );
  }
  return false;
}

/** Recursively walks a field (and its group sub-fields) into a flat name → field map. */
function collectFieldFromDef(
  field: FormField,
  acc: Record<string, FormField>,
): void {
  if (field.name) acc[field.name] = field;
  if (field.type === FORM_FIELD_TYPES.GROUP && Array.isArray(field.fields)) {
    field.fields.forEach(subField => collectFieldFromDef(subField, acc));
  }
}

/**
 * Recursively walks the full schema tree (tabs/sections/rows/fields) into a flat
 * name → field-definition map. Used to resolve `view` fields, which display another
 * field's label/value by name.
 */
function collectFieldsByName(
  nodes: FormSection[] | undefined,
  acc: Record<string, FormField> = {},
): Record<string, FormField> {
  nodes?.forEach(node => {
    node.rows?.forEach(row => {
      row.fields?.forEach(field => collectFieldFromDef(field, acc));
    });
    if (node.children) collectFieldsByName(node.children, acc);
  });
  return acc;
}

/**
 * Returns the first validation-rule error message for a field's current value,
 * or undefined when it currently passes (or has no rules). Does not consider
 * visibility/read-only/view-type — callers apply those skip conditions first.
 */
function getFieldError(
  field: FormField,
  values: Record<string, any>,
): string | undefined {
  if (!field.name || !field.validation?.length) return undefined;

  const rawValue = values[field.name];

  // multiselect/pillmultiselect (plain string[]) and file/multi-file (FileAsset
  // or FileAsset[]) all land here: length-based rules (required/minLength/
  // maxLength/fileCount) plus file-specific fileType. email/pattern/matchField/
  // dateNotInFuture are meaningless for an array/object value — no-op.
  if (Array.isArray(rawValue) || (rawValue && typeof rawValue === 'object')) {
    const files = Array.isArray(rawValue) ? rawValue : [rawValue];
    for (const rule of field.validation) {
      const msg = rule.message.fallback;
      if (rule.rule === 'required' && files.length === 0) return msg;
      if (rule.rule === 'minLength' && files.length < Number(rule.value)) return msg;
      if (rule.rule === 'maxLength' && files.length > Number(rule.value)) return msg;
      if (rule.rule === 'fileCount' && files.length > Number(rule.value)) return msg;
      if (rule.rule === 'fileType' && field.type === FORM_FIELD_TYPES.FILE) {
        const allowed = Array.isArray(rule.value) ? (rule.value as string[]) : [];
        const hasInvalidType = files.some(
          f => isFileAssetLike(f) && !matchesAllowedFileType(f, allowed),
        );
        if (hasInvalidType) return msg;
      }
      if (rule.rule === 'fileSize' && field.type === FORM_FIELD_TYPES.FILE) {
        const maxBytes = Number(rule.value) * 1024 * 1024;
        const hasOversized = files.some(
          f => isFileAssetLike(f) && typeof f.size === 'number' && f.size > maxBytes,
        );
        if (hasOversized) return msg;
      }
    }
    return undefined;
  }

  const val = String(rawValue ?? '').trim();

  for (const rule of field.validation) {
    const err = applyRule(rule, val, values, field.type);
    if (err) return err;
  }

  return undefined;
}

/**
 * Runs all validation rules for a single field recursively (supporting group fields).
 * Populates errors object.
 */
function validateField(
  field: FormField,
  values: Record<string, string>,
  optionsMap: OptionsMap,
  errors: Record<string, string>,
): void {
  if (field.type === FORM_FIELD_TYPES.GROUP && Array.isArray(field.fields)) {
    for (const subField of field.fields) {
      validateField(subField, values, optionsMap, errors);
    }
    return;
  }

  if (!field.name) return;

  // Skip invisible fields entirely
  if (!isVisible(field.visibleWhen, values, optionsMap)) {
    return;
  }

  if (!isVisibleIf(field.visibleIf, values)) {
    return;
  }

  // Skip read-only fields
  if (field.isReadOnly || field.type === FORM_FIELD_TYPES.VIEW) {
    return;
  }

  const err = getFieldError(field, values);
  if (err && field.name) {
    errors[field.name] = err;
  }
}

/** `dateCompare`: parses a stored date/datetime value (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss) into a comparable Date. */
function parseComparableDate(rawValue: string): Date | null {
  if (!rawValue) return null;
  const date = new Date(rawValue.replace(/_/g, '-'));
  return isNaN(date.getTime()) ? null : date;
}

/** `timeCompare`: parses a stored "HH:mm" value into minutes-since-midnight. */
function parseComparableMinutes(rawValue: string): number | null {
  const match = /^(\d{1,2}):(\d{2})/.exec(rawValue);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function compareByOperator(a: number, b: number, operator: string): boolean {
  switch (operator) {
    case '<':
      return a < b;
    case '<=':
      return a <= b;
    case '>':
      return a > b;
    case '>=':
      return a >= b;
    case '==':
      return a === b;
    default:
      return true;
  }
}

function applyRule(
  rule: ValidationRule,
  val: string,
  allValues: Record<string, string>,
  fieldType?: FormField['type'],
): string | undefined {
  const msg = rule.message.fallback;

  switch (rule.rule) {
    case 'required':
      if (!val) return msg;
      break;

    case 'email': {
      if (!val) break; // let 'required' handle empty
      const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(val)) return msg;
      break;
    }

    case 'minLength': {
      const min = Number(rule.value);
      if (val && val.length < min) return msg;
      break;
    }

    case 'maxLength': {
      const max = Number(rule.value);
      if (val && val.length > max) return msg;
      break;
    }

    case 'pattern': {
      if (!val) break;
      const re = new RegExp(String(rule.value));
      if (!re.test(val)) return msg;
      break;
    }

    case 'matchField': {
      const other = (allValues[String(rule.value)] ?? '').trim();
      if (val && val !== other) return msg;
      if (!val && other) return msg; // confirm is empty but password has value
      break;
    }

    case 'dateNotInFuture': {
      if (!val) break;
      // val is in YYYY-MM-DD (display format); raw storage may be YYYY_MM_DD
      const normalized = val.replace(/_/g, '-');
      const date = new Date(normalized);
      if (!isNaN(date.getTime()) && date > new Date()) return msg;
      break;
    }

    case 'minAge': {
      if (!val) break;
      const normalized = val.replace(/_/g, '-').replace(/\//g, '-');
      const birthDate = new Date(normalized);
      if (!isNaN(birthDate.getTime())) {
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        if (age < Number(rule.value)) return msg;
      }
      break;
    }

    // Only applicable to date/datetime fields — a schema author putting this
    // on any other field type is a no-op, not a crash.
    case 'dateCompare': {
      if (fieldType !== FORM_FIELD_TYPES.DATE && fieldType !== FORM_FIELD_TYPES.DateTime) break;
      if (!val) break; // empty — 'required' (if declared) handles that separately
      const config = rule.value as FieldCompareValue | undefined;
      if (!config?.field || !config.operator) break;
      const otherRaw = allValues[config.field];
      if (!otherRaw) break; // nothing to compare against yet

      const current = parseComparableDate(val);
      const other = parseComparableDate(String(otherRaw));
      if (!current || !other) break;
      if (!compareByOperator(current.getTime(), other.getTime(), config.operator)) return msg;
      break;
    }

    // Only applicable to time fields.
    case 'timeCompare': {
      if (fieldType !== FORM_FIELD_TYPES.Time) break;
      if (!val) break;
      const config = rule.value as FieldCompareValue | undefined;
      if (!config?.field || !config.operator) break;
      const otherRaw = allValues[config.field];
      if (!otherRaw) break;

      const current = parseComparableMinutes(val);
      const other = parseComparableMinutes(String(otherRaw));
      if (current === null || other === null) break;
      if (!compareByOperator(current, other, config.operator)) return msg;
      break;
    }
  }

  return undefined;
}

/**
 * Run validation for all fields in the schema.
 * Returns a map of fieldName → errorMessage (only for invalid fields).
 * Call this from the parent's submit handler.
 */
export function validateSchema(
  schema: FormSection[],
  values: Record<string, string>,
  optionsMap: OptionsMap,
): Record<string, string> {
  const errors: Record<string, string> = {};
  validateNodes(schema, values, optionsMap, errors);
  return errors;
}

function isFileAssetLike(value: any): value is FileAsset {
  return !!value && typeof value === 'object' && typeof value.uri === 'string';
}

/**
 * `fileType` rule values may be full MIME types ("application/pdf",
 * "image/*") or bare file extensions ("pdf", ".pdf") — schema authors
 * naturally reach for extensions since they're what they actually see in a
 * file dialog, so both forms need to work, not just MIME types.
 */
function matchesAllowedFileType(file: FileAsset, allowed: string[]): boolean {
  const mime = (file.type || '').toLowerCase();
  const ext = (file.name.split('.').pop() || '').toLowerCase();

  return allowed.some(entry => {
    const normalized = entry.toLowerCase().trim();
    if (normalized.includes('/')) {
      if (normalized.endsWith('/*')) return mime.startsWith(normalized.slice(0, -1));
      return mime === normalized;
    }
    return ext === normalized.replace(/^\./, '');
  });
}

const IMAGE_EXTENSION_RE = /\.(png|jpe?g|gif|webp|bmp|svg|heic|heif)(\?.*)?$/i;

function isImageFile(type: string | undefined, name: string): boolean {
  if (type) return type.startsWith('image/');
  return IMAGE_EXTENSION_RE.test(name);
}

/** Last path segment of a URL (query string stripped), or the string itself if that fails. */
function fileNameFromUrl(url: string): string {
  const withoutQuery = url.split('?')[0];
  const segment = withoutQuery.substring(withoutQuery.lastIndexOf('/') + 1);
  return segment || url;
}

interface FilePreviewItem {
  key: string;
  name: string;
  previewUri?: string;
  isImage: boolean;
  raw: FileAsset | string;
}

/**
 * Normalizes a `file` field's value — `undefined`, a single `FileAsset`, a
 * single URL string (pre-filled/edit-mode value), or an array mixing any of
 * those (the normal case once existing URLs and newly-picked files coexist in
 * a `multiple` field) — into a flat list for preview rendering.
 */
function toFilePreviewItems(value: any): FilePreviewItem[] {
  const items: (FileAsset | string)[] = Array.isArray(value)
    ? value
    : value
      ? [value]
      : [];

  return items.map((item, index) => {
    if (typeof item === 'string') {
      const name = fileNameFromUrl(item);
      return {
        key: `${item}-${index}`,
        name,
        previewUri: item,
        isImage: isImageFile(undefined, name),
        raw: item,
      };
    }
    return {
      key: `${item.uri || item.name}-${index}`,
      name: item.name,
      previewUri: item.uri,
      isImage: isImageFile(item.type, item.name),
      raw: item,
    };
  });
}

/**
 * Uploads every `file`-type field's picked asset(s) via `uploadService` and
 * replaces the value with the returned URL string(s) — single asset in →
 * `string` out, array in → `string[]` out. Fields with no file-shaped value
 * pass through unchanged, and the whole call is a no-op (returns `values`
 * as-is) when `uploadService` is omitted, so existing consumers that don't
 * use it see zero behavior change. Fails closed: if any upload throws, this
 * rejects with a single `FileUploadError` listing every failed field name
 * rather than silently keeping a session-local file reference.
 */
export async function resolveFileUploads(
  schema: FormSection[],
  values: Record<string, any>,
  uploadService?: (file: FileAsset) => Promise<string>,
): Promise<Record<string, any>> {
  if (!uploadService) return values;

  const fieldsByName = collectFieldsByName(schema);
  const fileFieldNames = Object.keys(fieldsByName).filter(
    name => fieldsByName[name].type === FORM_FIELD_TYPES.FILE,
  );

  const result: Record<string, any> = { ...values };
  const failedFieldNames: string[] = [];

  await Promise.all(
    fileFieldNames.map(async name => {
      const raw = values[name];
      try {
        if (Array.isArray(raw)) {
          // A multi-file field's array can legitimately mix newly-picked
          // `FileAsset`s with already-uploaded URL strings (pre-filled edit-mode
          // values the user didn't remove) — upload only the former, and pass
          // the latter through unchanged, rather than skipping the whole array.
          if (raw.length === 0 || !raw.some(isFileAssetLike)) return;
          result[name] = await Promise.all(
            raw.map(item => (isFileAssetLike(item) ? uploadService(item) : item)),
          );
        } else if (isFileAssetLike(raw)) {
          result[name] = await uploadService(raw);
        }
      } catch {
        failedFieldNames.push(name);
      }
    }),
  );

  if (failedFieldNames.length > 0) {
    throw new FileUploadError(failedFieldNames);
  }

  return result;
}

/** Recurses through tabs/sections (via `children`) and their `rows`, validating every field found. */
function validateNodes(
  nodes: FormSection[] | undefined,
  values: Record<string, string>,
  optionsMap: OptionsMap,
  errors: Record<string, string>,
): void {
  nodes?.forEach(node => {
    node.rows?.forEach(row => {
      // Skip hidden rows
      if (!isVisible(row.visibleWhen, values, optionsMap)) return;

      row.fields.forEach(field =>
        validateField(field, values, optionsMap, errors),
      );
    });

    if (node.children) validateNodes(node.children, values, optionsMap, errors);
  });
}

// ─── Validation Issues (multi-step Continue/Submit + validation popup) ────────
//
// Mirrors `validateNodes`/`validateField` above (same skip conditions, same
// `getFieldError`), but additionally records WHERE each invalid field lives
// (which step tab, which section) so the validation popup can group and
// navigate to it, and which root-level tab it belongs to for step navigation.

export interface ValidationIssue {
  fieldName: string;
  fieldLabel: string;
  message: string;
  tabTitle?: string;
  sectionTitle?: string;
  /** Index into the root schema's tab nodes — used to jump back to the right step */
  rootTabIndex?: number;
}

interface ValidationAncestry {
  tabTitle?: string;
  sectionTitle?: string;
  rootTabIndex?: number;
}

function collectFieldIssues(
  field: FormField,
  values: Record<string, string>,
  optionsMap: OptionsMap,
  t: (key: string, fallback?: string) => string,
  ancestry: ValidationAncestry,
  errors: Record<string, string>,
  issues: ValidationIssue[],
  visited: Set<string>,
): void {
  if (field.type === FORM_FIELD_TYPES.GROUP && Array.isArray(field.fields)) {
    field.fields.forEach(subField =>
      collectFieldIssues(
        subField,
        values,
        optionsMap,
        t,
        ancestry,
        errors,
        issues,
        visited,
      ),
    );
    return;
  }

  if (!field.name) return;
  if (!isVisible(field.visibleWhen, values, optionsMap)) return;
  if (!isVisibleIf(field.visibleIf, values)) return;
  if (field.isReadOnly || field.type === FORM_FIELD_TYPES.VIEW) return;

  visited.add(field.name);

  const err = getFieldError(field, values);
  if (!err) return;

  errors[field.name] = err;
  issues.push({
    fieldName: field.name,
    fieldLabel: field.label
      ? t(`admin.users.createUser.${field.label.key}`, field.label.fallback)
      : field.name,
    message: err,
    tabTitle: ancestry.tabTitle,
    sectionTitle: ancestry.sectionTitle,
    rootTabIndex: ancestry.rootTabIndex,
  });
}

/** Recurses through the given nodes, collecting an errors map, a rich issues list, and every field name checked. */
function collectValidationIssues(
  nodes: FormSection[] | undefined,
  values: Record<string, string>,
  optionsMap: OptionsMap,
  t: (key: string, fallback?: string) => string,
  errors: Record<string, string>,
  issues: ValidationIssue[],
  visited: Set<string>,
  ancestry: ValidationAncestry = {},
): void {
  nodes?.forEach(node => {
    let nextAncestry = ancestry;
    if (node.type === 'tab') {
      nextAncestry = {
        ...ancestry,
        tabTitle: nodeTitleText(node, t) ?? node.id,
      };
    } else {
      const title = nodeTitleText(node, t);
      if (title) nextAncestry = { ...ancestry, sectionTitle: title };
    }

    node.rows?.forEach(row => {
      if (!isVisible(row.visibleWhen, values, optionsMap)) return;
      row.fields.forEach(field =>
        collectFieldIssues(
          field,
          values,
          optionsMap,
          t,
          nextAncestry,
          errors,
          issues,
          visited,
        ),
      );
    });

    if (node.children) {
      collectValidationIssues(
        node.children,
        values,
        optionsMap,
        t,
        errors,
        issues,
        visited,
        nextAncestry,
      );
    }
  });
}

/**
 * Validates the given root-level nodes (pass the whole schema for Submit, or a single
 * tab's node for Continue), tagging each issue with its root-level tab index for step
 * navigation. `visited` lists every field name that was checked, valid or not — callers
 * use it to clear stale errors for fields that were re-checked and are now valid.
 */
function collectValidationForRoots(
  rootNodes: FormSection[],
  schema: FormSection[],
  values: Record<string, string>,
  optionsMap: OptionsMap,
  t: (key: string, fallback?: string) => string,
): {
  errors: Record<string, string>;
  issues: ValidationIssue[];
  visited: Set<string>;
} {
  const errors: Record<string, string> = {};
  const issues: ValidationIssue[] = [];
  const visited = new Set<string>();

  rootNodes.forEach(node => {
    const rootTabIndex = schema.indexOf(node);
    const ancestry: ValidationAncestry =
      node.type === 'tab' && rootTabIndex !== -1 ? { rootTabIndex } : {};
    collectValidationIssues(
      [node],
      values,
      optionsMap,
      t,
      errors,
      issues,
      visited,
      ancestry,
    );
  });

  return { errors, issues, visited };
}

// ─── Required-Field Progress (current step / active tab) ──────────────────────
//
// Counts only visible, required, editable fields — mirrors the same skip
// conditions as validation (isVisible/isVisibleIf/isReadOnly/VIEW), so a field
// that wouldn't be validated also doesn't count toward progress.

function countRequiredFieldProgress(
  field: FormField,
  values: Record<string, string>,
  optionsMap: OptionsMap,
  counts: { total: number; completed: number },
): void {
  if (field.type === FORM_FIELD_TYPES.GROUP && Array.isArray(field.fields)) {
    field.fields.forEach(subField =>
      countRequiredFieldProgress(subField, values, optionsMap, counts),
    );
    return;
  }

  if (!field.name || !field.required) return;
  if (!isVisible(field.visibleWhen, values, optionsMap)) return;
  if (!isVisibleIf(field.visibleIf, values)) return;
  if (field.isReadOnly || field.type === FORM_FIELD_TYPES.VIEW) return;

  counts.total += 1;
  if (isValuePresent(values[field.name])) counts.completed += 1;
}

/** Recurses through the given nodes — pass the whole schema for whole-form progress. */
function computeRequiredFieldProgress(
  nodes: FormSection[] | undefined,
  values: Record<string, string>,
  optionsMap: OptionsMap,
): { total: number; completed: number } {
  const counts = { total: 0, completed: 0 };

  function visitNodes(list: FormSection[] | undefined) {
    list?.forEach(node => {
      node.rows?.forEach(row => {
        if (!isVisible(row.visibleWhen, values, optionsMap)) return;
        row.fields.forEach(field =>
          countRequiredFieldProgress(field, values, optionsMap, counts),
        );
      });
      if (node.children) visitNodes(node.children);
    });
  }

  visitNodes(nodes);
  return counts;
}

// ─── Field Renderers ──────────────────────────────────────────────────────────

interface FieldRendererProps {
  field: FormField;
  /** Plain string for most fields; `string[]` for multiselect/pillmultiselect; a `FileAsset`/`FileAsset[]` for `file`. */
  value: any;
  error?: string;
  errors: Record<string, string>;
  onChange: (name: string, value: any, other?: any) => void;
  disabled: boolean;
  optionsMap: OptionsMap;
  values: Record<string, any>;
  t: (key: string, fallback?: string) => string;
  /** Shared visibility state for password toggle groups */
  visibilityGroups: Record<string, boolean>;
  toggleVisibilityGroup: (group: string) => void;
  /** Forwarded ref for the first autoFocus field */
  autoFocusRef?: React.RefObject<any>;
  isNested?: boolean;
  isEditMode?: boolean;
  /** Global default input props (from `SchemaFormRendererProps._input`); `field._input` wins over this. */
  globalInputProps?: any;
}

/**
 * A row of clickable pill buttons, shared by the single-select `pillselect`
 * and multi-select `pillmultiselect` field types so the active-styling tokens
 * (`$primary500`/`$bgPrimary/5`/`$2xl` etc.) live in exactly one place.
 */
const PillOptionsRow: React.FC<{
  options: { value: string; label: string }[];
  isSelected: (value: string) => boolean;
  onToggle: (value: string, other?: any) => void;
  isDisabled: boolean;
  /** pillmultiselect only — shows a checked/unchecked checkbox beside each pill's label. */
  isMulti?: boolean;
}> = memo(({ options, isSelected, onToggle, isDisabled, isMulti = false }) => (
  <HStack space="sm" flexWrap="wrap">
    {options.map(option => {
      const selected = isSelected(option.value);
      return (
        <Pressable
          key={option.value}
          disabled={isDisabled}
          onPress={() => onToggle(option.value, option)}
          flex={1}
          px="$3"
          py={isMulti ? "$2" : "$2.5"}
          borderRadius={isMulti ? "$xl" : "$2xl"}
          borderWidth={1}
          borderColor={selected ? '$primary500' : '$borderColor'}
          bg={selected ? '$bgPrimary/5' : 'transparent'}
          opacity={isDisabled ? 0.5 : 1}
        >
          <HStack space="xs" alignItems={"center"} justifyContent={isMulti ? "flex-start" : "center"}>
            {isMulti && (
              <LucideIcon
                name={selected ? 'SquareCheckBig' : 'Square'}
                size={16}
                color={selected ? '$primary500' : '$textMuted'}
              />
            )}
            <Text
              {...TYPOGRAPHY.bodySmall}
              color={selected ? '$primary500' : '$textForeground'}
              textAlign={"center"}
            >
              {option.label}
            </Text>
          </HStack>
        </Pressable>
      );
    })}
  </HStack>
));

const FieldRenderer: React.FC<FieldRendererProps> = ({
  field,
  value,
  error,
  errors,
  onChange,
  disabled,
  optionsMap,
  values,
  t,
  visibilityGroups,
  toggleVisibilityGroup,
  autoFocusRef,
  isNested = false,
  isEditMode = false,
  globalInputProps,
}) => {
  // Centralized for every field type below — `disabled`/`field.disabled` are
  // permanent and always win; `disabledWhen` is re-evaluated from `values` on
  // every render, so it recalculates automatically when its dependency changes.
  const isFieldDisabled =
    disabled ||
    !!field.disabled ||
    (isEditMode && field.name === 'roleId') ||
    isDisabledWhen(field.disabledWhen, values);

  // Single resolution point for Task 4's two-level `_input` override: field-level
  // wins over the global default. Behavior/config props only (size, placeholder,
  // maxLength, autoFocus, ...) — never styling, and never allowed to clobber the
  // wiring props (value/onChange/isInvalid/isDisabled/isReadOnly) each branch
  // applies after spreading this.
  const resolvedInputProps = { ...globalInputProps, ...field._input };

  useEffect(() => {
    if (
      field.type === FORM_FIELD_TYPES.SELECT ||
      field.type === FORM_FIELD_TYPES.PILLSELECT
    ) {
      const rawOptions = field.optionsSource
        ? optionsMap[field.optionsSource] ?? []
        : [];
      if (rawOptions.length > 0) {
        const optionValues = rawOptions.map((o: any) => o.value);
        let nextValue = value;

        if (nextValue && !optionValues.includes(nextValue)) {
          nextValue = '';
        }

        if (!nextValue && field.defaultValue) {
          if (optionValues.includes(field.defaultValue)) {
            nextValue = field.defaultValue;
          } else {
            nextValue = optionValues[0] || '';
          }
        }

        if (nextValue !== value && field.name) {
          onChange(field.name, nextValue);
        }
      }
    }
  }, [
    field.type,
    field.name,
    field.defaultValue,
    field.optionsSource,
    optionsMap[field.optionsSource || ''],
    value,
    onChange,
  ]);

  // ── Group ───────────────────────────────────────────────────────────────────
  if (field.type === FORM_FIELD_TYPES.GROUP) {
    const subFields = field.fields || [];
    if (subFields.length === 0) return null;

    const combinedError = subFields.map(sf => errors[sf.name!]).find(Boolean);

    return (
      <HStack
        {...(styles.input as any)}
        {...(field._input as any)}
        isInvalid={!!combinedError}
        isDisabled={isFieldDisabled}
        alignItems="center"
        paddingLeft={0}
        height={40}
        width="100%"
        {...(!!combinedError && {
          borderWidth: 1,
          borderColor: '$red500',
        })}
      >
        {subFields.map((subField, idx) => (
          <React.Fragment key={subField.name || subField.label.key}>
            {idx > 0 && (
              <Box
                width={1}
                bg="$borderColor"
                height="60%"
                alignSelf="center"
              />
            )}
            <FieldRenderer
              field={subField}
              value={subField.name ? values[subField.name] ?? '' : ''}
              // error={subField.name ? errors[subField.name] : undefined}
              errors={errors}
              onChange={onChange}
              disabled={isFieldDisabled || !!subField.disabled}
              optionsMap={optionsMap}
              values={values}
              t={t}
              visibilityGroups={visibilityGroups}
              toggleVisibilityGroup={toggleVisibilityGroup}
              autoFocusRef={autoFocusRef}
              isNested={true}
            />
          </React.Fragment>
        ))}
      </HStack>
    );
  }
  // ── Note ────────────────────────────────────────────────────────────────────
  if (field.type === FORM_FIELD_TYPES.NOTE) {
    return (
      <HStack
        space="sm"
        alignItems="flex-start"
        bg="$backgroundLight100"
        p="$3"
        borderRadius="$md"
        borderWidth={1}
        borderColor="$borderColor"
        width="100%"
      >
        <Box mt={2}>
          <LucideIcon name="Info" size={16} color="$primary500" />
        </Box>
        <Text size="sm" color="$textMutedForeground" flex={1}>
          {t(`admin.users.createUser.${field.label.key}`, field.label.fallback)}
        </Text>
      </HStack>
    );
  }

  const placeholder = field.placeholder?.fallback ?? '';

  // ── Select ──────────────────────────────────────────────────────────────────
  if (field.type === FORM_FIELD_TYPES.SELECT) {
    const rawOptions = field.optionsSource
      ? optionsMap[field.optionsSource] ?? []
      : [];
    const options = rawOptions.map(o => ({ value: o.value, label: o.label }));
    const isDisabled = isFieldDisabled;

    // Dynamic placeholder when dependency is satisfied
    const activePlaceholder =
      field.placeholderWhenReady && isValuePresent(values[field.dependsOn ?? ''])
        ? field.placeholderWhenReady.fallback
        : placeholder;

    return (
      <Box
        width={isNested ? 95 : '100%'}
        zIndex={field.zIndex ?? (isNested ? 1000 : 1)}
      >
        <Select
          {...(isNested ? {} : styles.select)}
          {...resolvedInputProps}
          {...(!!error && {
            borderWidth: 1,
            borderColor: '$red500',
          })}
          options={options}
          value={value}
          onChange={(val: string | string[], label?: any) =>
            onChange(field.name || '', val, { label })
          }
          placeholder={activePlaceholder}
          disabled={isDisabled}
          isReadOnly={field.isReadOnly}
          {...(isNested
            ? { borderColor: 'transparent', bg: 'transparent' }
            : {})}
        />
      </Box>
    );
  }

  // ── Pill Select (single-select rendered as a row of pill buttons) ────────────
  if (field.type === FORM_FIELD_TYPES.PILLSELECT) {
    const rawOptions = field.optionsSource
      ? optionsMap[field.optionsSource] ?? []
      : [];
    const isDisabled = isFieldDisabled || !!field.isReadOnly;

    return (
      <PillOptionsRow
        options={rawOptions}
        isSelected={optionValue => optionValue === value}
        onToggle={(optionValue, other) => onChange(field.name || '', optionValue, other)}
        isDisabled={isDisabled}
      />
    );
  }

  // ── Pill Multi Select (multi-select rendered as a row of togglable pill buttons) ──
  if (field.type === FORM_FIELD_TYPES.PILLMULTISELECT) {
    const rawOptions = field.optionsSource
      ? optionsMap[field.optionsSource] ?? []
      : [];
    const isDisabled = isFieldDisabled || !!field.isReadOnly;
    const selectedValues: string[] = Array.isArray(value) ? value : [];

    return (
      <PillOptionsRow
        options={rawOptions}
        isSelected={optionValue => selectedValues.includes(optionValue)}
        onToggle={optionValue => {
          const next = selectedValues.includes(optionValue)
            ? selectedValues.filter(v => v !== optionValue)
            : [...selectedValues, optionValue];
          onChange(field.name || '', next);
        }}
        isDisabled={isDisabled}
        isMulti
      />
    );
  }

  // ── Multi Select (dropdown with a checkbox per option, stores string[]) ──────
  if (field.type === FORM_FIELD_TYPES.MULTISELECT) {
    const rawOptions = field.optionsSource
      ? optionsMap[field.optionsSource] ?? []
      : [];
    const options = rawOptions.map(o => ({ value: o.value, label: o.label }));
    const isDisabled = isFieldDisabled || !!field.isReadOnly;
    const selectedValues: string[] = Array.isArray(value) ? value : [];

    return (
      <Box width="100%" zIndex={field.zIndex ?? 1}>
        <Select
          {...styles.select}
          {...resolvedInputProps}
          multiple
          options={options}
          value={selectedValues}
          onChange={(vals: string | string[], other?: any) =>
            onChange(field.name || '', Array.isArray(vals) ? vals : [], other)
          }
          placeholder={placeholder}
          disabled={isDisabled}
          isReadOnly={field.isReadOnly}
        />
      </Box>
    );
  }

  // ── File Upload ───────────────────────────────────────────────────────────────
  if (field.type === FORM_FIELD_TYPES.FILE) {
    const isDisabled = isFieldDisabled || !!field.isReadOnly;
    const subLabelText = field.subLabel
      ? t(
        `admin.users.createUser.${field.subLabel.key}`,
        field.subLabel.fallback,
      )
      : undefined;

    const isMultiple = !!field.multiple;
    // Existing files in storage order, supporting single/multiple files and pre-filled URLs.
    // Used to preserve order when adding or removing files.
    const existingItems: (FileAsset | string)[] = Array.isArray(value)
      ? value
      : value
        ? [value]
        : [];
    const previewItems = toFilePreviewItems(value);

    // Applies OS-level file filtering only for valid MIME types (when supported).
    // Extension-only rules rely on post-selection validation.
    const fileTypeRule = field.validation?.find(r => r.rule === 'fileType');
    const fileTypeValues = Array.isArray(fileTypeRule?.value)
      ? (fileTypeRule!.value as string[])
      : undefined;
    const allowedTypes =
      fileTypeValues?.length && fileTypeValues.every(entry => entry.includes('/'))
        ? fileTypeValues
        : undefined;

    // Stores the full picked-file asset(s) (not just names) so `resolveFileUploads`
    // has something to actually upload at submit time — see `FileAsset`.
    const handlePick = async () => {
      if (isDisabled) return;
      try {
        const picked = await openFilePicker({
          allowMultiSelection: isMultiple,
          ...(allowedTypes ? { type: allowedTypes } : {}),
        });
        const newAssets = (picked || [])
          .filter((f: any) => f?.name)
          .map((f: any) => ({
            uri: f.uri,
            name: f.name,
            type: f.type,
            size: f.size,
            file: f.file,
          }));
        if (newAssets.length === 0) return;

        if (isMultiple) {
          onChange(field.name || '', [...existingItems, ...newAssets]);
        } else {
          onChange(field.name || '', newAssets[0]);
        }
      } catch {
        // User cancelled the picker — nothing to persist.
      }
    };

    const handleRemove = (raw: FileAsset | string) => {
      const next = existingItems.filter(item => item !== raw);
      onChange(field.name || '', isMultiple ? next : next[0] ?? '');
    };

    const triggerLabel =
      previewItems.length === 0
        ? placeholder || t('common.clickToUpload', 'Click to upload')
        : isMultiple
          ? t('common.addMoreFiles', 'Add more files')
          : previewItems[0].name;

    return (
      <VStack space="xs">
        <Pressable onPress={handlePick} disabled={isDisabled}>
          <VStack
            alignItems="center"
            justifyContent="center"
            borderWidth={2}
            borderStyle="dashed"
            borderColor="$borderColor"
            borderRadius="$lg"
            // minHeight={140}
            px="$4"
            py="$6"
            opacity={isDisabled ? 0.5 : 1}
            space="xs"
          >
            <LucideIcon
              name="Upload"
              size={32}
              color="$gray300"
            />

            <Text
              {...TYPOGRAPHY.bodySmall}
              color="$textMuted"
              textAlign="center"
            >
              {triggerLabel}
            </Text>

            <Text
              {...TYPOGRAPHY.caption}
              color="$gray300"
              textAlign="center"
            >
              Max 10 MB
            </Text>
          </VStack>
        </Pressable>

        {previewItems.length > 0 && (
          <VStack {...Styles.filesListVStack}>
            {previewItems.map((item: any, idx) => (
              <Box key={idx} {...styles.resourceCard}>
                <HStack {...styles.fileCardOuterHStack}>
                  <HStack {...styles.fileCardInnerHStack}>
                    <LucideIcon name="FileText" {...styles.cardFileTextIconProps} />
                    <Text {...styles.resourceFileNameText} numberOfLines={1} ellipsizeMode="tail">
                      {item.name}
                    </Text>
                    <Text
                      {...TYPOGRAPHY.caption}
                      color="$textForeground"
                      flex={1}
                      numberOfLines={1}
                    >
                      {formatFileSize(item?.raw?.size || 0)}
                    </Text>
                  </HStack>
                  <Pressable onPress={() => handleRemove(item.raw)} disabled={isDisabled}>
                    <LucideIcon name="X" size={16} color="$textMutedForeground" />
                  </Pressable>
                </HStack>
              </Box>
            ))}
          </VStack>
        )}

        {!!subLabelText && (
          <Text {...TYPOGRAPHY.caption} color="$textMutedForeground">
            {subLabelText}
          </Text>
        )}
      </VStack>
    );
  }

  // ── Date ────────────────────────────────────────────────────────────────────
  if (field.type === FORM_FIELD_TYPES.DATE || field.type === FORM_FIELD_TYPES.Time || field.type === FORM_FIELD_TYPES.DateTime) {
    // Internal display value: stored as YYYY-MM-DD, displayed as YYYY-MM-DD
    const displayValue = value ? value : '';

    return (
      <Box zIndex={field.zIndex ?? 999}>
        <DatePicker
          {...styles.input}
          {...resolvedInputProps}
          {...(!!error && {
            borderWidth: 1,
            borderColor: '$red500',
          })}
          mode={field.type}
          placeholder={placeholder || 'YYYY-MM-DD'}
          value={displayValue}
          onChange={(date: string) =>
            onChange(field.name || '', date)
          }
          maximumDate={
            field.validation?.some(r => r.rule === 'dateNotInFuture')
              ? new Date()
              : undefined
          }
          minimumDate={
            field.validation?.some(r => r.rule === 'dateNotInPast')
              ? new Date(new Date().setDate(new Date().getDate() - 1))
              : undefined
          }
          iconSize={20}
          isDisabled={isFieldDisabled}
          isReadOnly={field.isReadOnly}
        />
      </Box>
    );
  }

  // ── Password ─────────────────────────────────────────────────────────────────
  if (field.type === FORM_FIELD_TYPES.PASSWORD) {
    const group = field.visibilityToggleGroup ?? field.name ?? '';
    const isVisible = visibilityGroups[group] ?? false;

    return (
      <Box position="relative">
        <Input
          {...styles.input}
          {...resolvedInputProps}
          isInvalid={!!error}
          isDisabled={isFieldDisabled}
          isReadOnly={field.isReadOnly}
        >
          <FastInputField
            {...resolvedInputProps}
            placeholder={placeholder}
            value={value}
            onChangeText={(text: string) => onChange(field.name || '', text)}
            secureTextEntry={!isVisible}
            pr="$12"
          />
        </Input>
        {field.toggleVisibility && (
          <Pressable
            onPress={() => toggleVisibilityGroup(group)}
            disabled={isFieldDisabled}
            style={styles.resetPasswordEyeIconButton}
          >
            <LucideIcon
              name={isVisible ? 'EyeOff' : 'Eye'}
              size={20}
              color="#6B7280"
            />
          </Pressable>
        )}
      </Box>
    );
  }

  // ── Textarea ────────────────────────────────────────────────────────────────
  if (field.type === FORM_FIELD_TYPES.TEXTAREA) {
    // Precedence: the existing narrow `field.inputProps` wins (backward compat),
    // then the resolved `_input` (global default, field-level override), then a
    // hardcoded default.
    const keyboardType =
      (field.inputProps?.keyboardType as any) ??
      resolvedInputProps.keyboardType ??
      'default';
    const autoCapitalize =
      (field.inputProps?.autoCapitalize as any) ??
      resolvedInputProps.autoCapitalize ??
      'sentences';
    const maxLength = field.inputProps?.maxLength ?? resolvedInputProps.maxLength;

    return (
      <Textarea
        {...(styles.input as any)}
        {...resolvedInputProps}
        isInvalid={!!error}
        isDisabled={isFieldDisabled}
        isReadOnly={field.isReadOnly}
      >
        <FastTextareaInput
          {...(styles.input as any)}
          {...resolvedInputProps}
          ref={field.autoFocus ? autoFocusRef : undefined}
          placeholder={placeholder}
          value={value}
          onChangeText={(text: string) => onChange(field.name || '', text)}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          maxLength={maxLength}
          minHeight={100}
        />
      </Textarea>
    );
  }

  // ── Text / Email / Tel ───────────────────────────────────────────────────────
  const keyboardType =
    (field.inputProps?.keyboardType as any) ??
    resolvedInputProps.keyboardType ??
    'default';
  const autoCapitalize =
    (field.inputProps?.autoCapitalize as any) ??
    resolvedInputProps.autoCapitalize ??
    'sentences';
  const maxLength = field.inputProps?.maxLength ?? resolvedInputProps.maxLength;

  return (
    <Input
      {...(isNested ? {} : (styles.input as any))}
      {...resolvedInputProps}
      isInvalid={!!error}
      isDisabled={isFieldDisabled}
      isReadOnly={field.isReadOnly}
      alignItems={field.icon ? 'center' : undefined}
      {...(isNested
        ? {
          borderColor: 'transparent',
          bg: 'transparent',
          flex: 1,
          variant: 'outline',
        }
        : {})}
    >
      {field.icon && (
        <Box pl="$3">
          <LucideIcon
            name={field.icon as any}
            size={16}
            color="$textMutedForeground"
          />
        </Box>
      )}
      <FastInputField
        {...resolvedInputProps}
        ref={field.autoFocus ? autoFocusRef : undefined}
        placeholder={placeholder}
        value={value}
        onChangeText={(text: string) => onChange(field.name || '', text)}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        maxLength={maxLength}
      />
    </Input>
  );
};

// ─── Recursive Node Rendering (tabs / sections) ───────────────────────────────
//
// The schema is a tree: any node with `children` recurses to unlimited depth.
// Node types:
//   - "tab"     → rendered with @gluestack-ui/themed Tabs (skipped when it's the only tab)
//   - "section" → rendered with an @ui Card + header, then its rows/children
//   - anything else falls back to the section renderer, so legacy/unknown nodes
//     (including schemas that never set `type`) keep working unmodified.

/** Shared render context threaded down through the recursive node tree. */
interface NodeRenderContext {
  values: Record<string, any>;
  errors: Record<string, string>;
  optionsMap: OptionsMap;
  mode: string;
  t: (key: string, fallback?: string) => string;
  onFieldChange: (name: string, value: any, other?: any) => void;
  disabled: boolean;
  visibilityGroups: Record<string, boolean>;
  toggleVisibilityGroup: (group: string) => void;
  firstNameRef?: React.RefObject<any>;
  fieldsByName: Record<string, FormField>;
  /** Registers a field's rendered container node, keyed by field name — used to scroll/focus/highlight it from the validation popup */
  registerFieldRef?: (name: string, node: any) => void;
  /** Name of the field to temporarily highlight (set after navigating from the validation popup) */
  highlightedField?: string | null;
  /** Global default input props (from `SchemaFormRendererProps._input`); a field's own `_input` wins over this. */
  globalInputProps?: any;
}

function nodeTitleText(
  node: FormSection,
  t: (key: string, fallback?: string) => string,
): string | undefined {
  const titleDef = node.title ?? node.label;
  if (!titleDef) return undefined;
  return t(`admin.users.createUser.${titleDef.key}`, titleDef.fallback);
}

/** Renders a sibling list of nodes, grouping consecutive `tab` nodes into one Tabs system. */
const RenderNodes: React.FC<{
  nodes?: FormSection[];
  ctx: NodeRenderContext;
}> = memo(({ nodes, ctx }) => {
  if (!nodes?.length) return null;

  const items: React.ReactNode[] = [];
  let i = 0;
  while (i < nodes.length) {
    const node = nodes[i];

    if (node.type === 'tab') {
      const tabGroup: FormSection[] = [];
      while (i < nodes.length && nodes[i].type === 'tab') {
        tabGroup.push(nodes[i]);
        i += 1;
      }
      items.push(
        <TabGroupRenderer
          key={`tabgroup-${tabGroup[0].id}`}
          tabs={tabGroup}
          ctx={ctx}
        />,
      );
      continue;
    }

    items.push(<SectionNode key={node.id} node={node} ctx={ctx} />);
    i += 1;
  }

  return <>{items}</>;
});

/**
 * Single Tab Rule: one tab renders its children directly, no TabList/navigation chrome.
 * For 2+ tabs, `activeTabId` is local UI state used only to drive active-tab styling
 * (`$primary500` text/icon/bottom-border, per the design system) — gluestack's own
 * internal switching still governs which `TabsTabPanel` is visible; both are set from
 * the same click so they never disagree.
 */
const TabGroupRenderer: React.FC<{
  tabs: FormSection[];
  ctx: NodeRenderContext;
}> = memo(({ tabs, ctx }) => {
  const [activeTabId, setActiveTabId] = useState(tabs[0]?.id);

  if (tabs.length <= 1) {
    return <RenderNodes nodes={tabs[0]?.children} ctx={ctx} />;
  }

  return (
    <Tabs value={tabs[0].id} width="100%">
      <TabsTabList
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
        flexWrap="wrap"
      >
        {tabs.map(tab => {
          const isActive = tab.id === activeTabId;
          return (
            <TabsTab
              key={tab.id}
              value={tab.id}
              onPress={() => setActiveTabId(tab.id)}
              paddingHorizontal="$6"
              paddingVertical="$3"
              borderBottomWidth={3}
              borderBottomColor={isActive ? '$primary500' : 'transparent'}
              mb={-1}
            >
              <HStack space="xs" alignItems="center">
                {!!tab.icon && (
                  <LucideIcon
                    name={tab.icon as any}
                    size={16}
                    color={isActive ? '$primary500' : '$textMutedForeground'}
                  />
                )}
                <TabsTabTitle
                  {...TYPOGRAPHY.label}
                  color={isActive ? '$primary500' : '$textMutedForeground'}
                >
                  {nodeTitleText(tab, ctx.t) ?? tab.id}
                </TabsTabTitle>
              </HStack>
            </TabsTab>
          );
        })}
      </TabsTabList>
      <TabsTabPanels>
        {tabs.map(tab => {
          const subTitleText = tab.subTitle
            ? ctx.t(
              `admin.users.createUser.${tab.subTitle.key}`,
              tab.subTitle.fallback,
            )
            : undefined;
          return (
            <TabsTabPanel key={tab.id} value={tab.id} {...tab._container}>
              <VStack space="md" {...tab._content}>
                {!!subTitleText && (
                  <Text {...TYPOGRAPHY.caption} color="$textMutedForeground">
                    {subTitleText}
                  </Text>
                )}
                {!!tab.hint && <HintDisplay hint={tab.hint} t={ctx.t} />}
                <RenderNodes nodes={tab.children} ctx={ctx} />
              </VStack>
            </TabsTabPanel>
          );
        })}
      </TabsTabPanels>
    </Tabs>
  );
});

/** Renders a "section" node: an @ui Card header (icon/title/subTitle/hint) plus its rows and children. */
const SectionNode: React.FC<{ node: FormSection; ctx: NodeRenderContext }> = memo(({
  node,
  ctx,
}) => {
  const titleText = nodeTitleText(node, ctx.t);
  const subTitleText = node.subTitle
    ? ctx.t(
      `admin.users.createUser.${node.subTitle.key}`,
      node.subTitle.fallback,
    )
    : undefined;

  return (
    <Card
      variant="outline"
      borderRadius="$lg"
      borderWidth={1}
      borderColor="$borderColor"
      p="$6"
      width="100%"
      {...node._container}
    >
      <VStack space={subTitleText ? 'xl' : 'sm'} {...node._content}>
        {!!titleText && (
          <VStack space="xs">
            <HStack space="xs" alignItems="center" {...node._header}>
              {!!node.icon && (
                <LucideIcon
                  name={node.icon as any}
                  size={16}
                  color="$textMutedForeground"
                  {...node._icon}
                />
              )}
              <Text
                {...TYPOGRAPHY.h2}
                color="$blueGray900"
                fontWeight="$bold"
                {...node._title}
              >
                {titleText}
              </Text>
            </HStack>
            {!!subTitleText && (
              <Text
                {...TYPOGRAPHY.caption}
                color="$textMutedForeground"
                {...node._subTitle}
              >
                {subTitleText}
              </Text>
            )}
          </VStack>
        )}

        {!!node.rows?.length && <RenderRow rows={node.rows} {...ctx} />}

        {!!node.children?.length && (
          <RenderNodes nodes={node.children} ctx={ctx} />
        )}

        {!!node.hint && <HintDisplay hint={node.hint} t={ctx.t} />}
      </VStack>
    </Card>
  );
});

// ─── Multi-Step Navigation (Previous / Continue / Save Draft / Submit) ────────
//
// Engages only when the ENTIRE root schema is made of 2+ `tab` nodes (a genuine
// step wizard). Mixed/single-tab/no-tab schemas fall through to the plain
// recursive rendering above, unchanged — this keeps every existing screen
// (CREATE_USER_FORM_SCHEMA, etc.) byte-for-byte backward compatible.

/**
 * Step indicator built on the same `@gluestack-ui/themed` Tabs primitives as the
 * in-page `TabGroupRenderer` above, so clicking a tab behaves like standard tab
 * navigation. gluestack's `Tabs` has no external-control API (`value` only seeds
 * its internal state once), so the wizard's Previous/Continue buttons remain the
 * source of truth: `key={activeTabId}` forces a remount with the right initial
 * value whenever they change step, while direct clicks call `onSelectStep`
 * (composed alongside gluestack's own internal switch — both fire on a tap, and
 * since we don't render TabsTabPanels here, only our own `onSelectStep` matters).
 */
const StepHeader: React.FC<{
  tabs: FormSection[];
  activeStepIndex: number;
  onSelectStep: (index: number) => void;
  t: (key: string, fallback?: string) => string;
}> = memo(({ tabs, activeStepIndex, onSelectStep, t }) => {
  const activeTabId = tabs[activeStepIndex]?.id;

  return (
    <Tabs
      key={activeTabId}
      value={activeTabId}
      width="100%"
      borderBottomWidth={1}
      borderBottomColor="$borderColor"
    >
      <TabsTabList flexWrap="wrap" borderRadius={0}>
        {tabs.map((tab, index) => {
          const isActive = index === activeStepIndex;
          return (
            <TabsTab
              key={tab.id}
              value={tab.id}
              onPress={() => onSelectStep(index)}
              paddingHorizontal="$6"
              paddingVertical="$3"
              borderBottomWidth={3}
              borderBottomColor={isActive ? '$primary500' : 'transparent'}
              mb={-1}
              borderRadius={0}
            >
              <HStack space="xs" alignItems="center">
                {!!tab.icon && (
                  <LucideIcon
                    name={tab.icon as any}
                    size={16}
                    color={isActive ? '$primary500' : '$textMutedForeground'}
                  />
                )}
                <TabsTabTitle
                  {...TYPOGRAPHY.bodySmall}
                  fontWeight={isActive ? '$medium' : '$normal'}
                  color={isActive ? '$primary500' : '$textMutedForeground'}
                >
                  {nodeTitleText(tab, t) ?? tab.id}
                </TabsTabTitle>
              </HStack>
            </TabsTab>
          );
        })}
      </TabsTabList>
    </Tabs>
  );
});

/** Required-fields-only completion for the active step, via the same gluestack Progress primitives already used elsewhere in the app (e.g. TasksOverviewCard). */
const StepProgress: React.FC<{
  total: number;
  completed: number;
  t: (key: string, fallback?: string) => string;
}> = memo(({ total, completed, t }) => {
  const percent = total > 0 ? (completed / total) * 100 : 100;
  const displayPercent = Math.ceil((percent * 10) / 10);

  return (
    <VStack
      space="xs"
      width="100%"
      borderBottomWidth={1}
      borderBottomColor="$borderColor"
      pb="$3"
    >
      <HStack justifyContent="space-between" alignItems="center">
        <Text {...TYPOGRAPHY.bodySmall} color="$textForeground">
          {t('common.progress', 'Progress')}
        </Text>
        <Text {...TYPOGRAPHY.bodySmall} color="$progressBarFillColor" fontWeight="$bold">
          {displayPercent}%
        </Text>
      </HStack>
      <Progress value={percent} w="$full" h="$1.5" bg="$progressBarBackground">
        <ProgressFilledTrack bg="$progressBarFillColor" />
      </Progress>
    </VStack>
  );
});

const StepFooter: React.FC<{
  isFirstStep: boolean;
  isLastStep: boolean;
  disabled?: boolean;
  onPrevious: () => void;
  onContinue: () => void;
  onSaveDraft?: () => void;
  onSubmit: () => void;
  t: (key: string, fallback?: string) => string;
  customButton?: React.ReactNode;
  showPreviousButton?: boolean;
  showContinueButton?: boolean;
  showSaveDraftButton?: boolean;
  showSubmitButton?: boolean;
  previousButtonText?: string;
  continueButtonText?: string;
  saveDraftButtonText?: string;
  submitButtonText?: string;
  previousButtonProps?: any;
  continueButtonProps?: any;
  saveDraftButtonProps?: any;
  submitButtonProps?: any;
  lodingButton?: string;
}> = memo(({
  isFirstStep,
  isLastStep,
  disabled,
  onPrevious,
  onContinue,
  onSaveDraft,
  onSubmit,
  t,
  customButton,
  showPreviousButton,
  showContinueButton,
  showSaveDraftButton,
  showSubmitButton,
  previousButtonText,
  continueButtonText,
  saveDraftButtonText,
  submitButtonText,
  previousButtonProps,
  continueButtonProps,
  saveDraftButtonProps,
  submitButtonProps,
  lodingButton
}) => (
  <HStack
    space="sm"
    justifyContent="space-between"
    width="100%"
    flexWrap="wrap"
  >
    {(showPreviousButton ?? true) && (
      <Button
        variant="outlineghost"
        {...previousButtonProps}
        onPress={onPrevious}
        isDisabled={isFirstStep || disabled}
      >
        <ButtonIcon as={LucideIcon} name={previousButtonProps?.icon || "ArrowLeft"} />
        <ButtonText>{previousButtonText ?? t('common.previous', 'Previous')}</ButtonText>
      </Button>
    )}
    <HStack space="sm">
      {customButton}
      {(showSaveDraftButton ?? true) && !!onSaveDraft && (
        <Button
          variant="outlineghost"
          {...saveDraftButtonProps}
          onPress={onSaveDraft}
          isDisabled={disabled || !!lodingButton}
        >
          {lodingButton === "saveDraft" ?
            <Spinner color="$primary500" {...saveDraftButtonProps?._icon} /> :
            <ButtonIcon as={LucideIcon} name={saveDraftButtonProps?.icon || "FileText"}
              {...saveDraftButtonProps?._icon}
            />
          }
          <ButtonText>{saveDraftButtonText ?? t('common.saveDraft', 'Save Draft')}</ButtonText>
        </Button>
      )}
      {(showContinueButton ?? true) && !isLastStep && (
        <Button {...continueButtonProps} onPress={onContinue} isDisabled={disabled || !!lodingButton}>
          <ButtonText>{continueButtonText ?? t('common.continue', 'Continue')}</ButtonText>
          {lodingButton === "continue" ?
            <Spinner color="$primary500" {...continueButtonProps?._icon} /> :
            <ButtonIcon as={LucideIcon} name={continueButtonProps?.icon || "ArrowRight"}
              {...continueButtonProps?._icon}
            />
          }
        </Button>
      )}
      {(showSubmitButton ?? true) && isLastStep && (
        <Button {...submitButtonProps} onPress={onSubmit} isDisabled={disabled || !!lodingButton}>
          {lodingButton === "submit" ?
            <Spinner color="$primary500" {...submitButtonProps?._icon} /> :
            <ButtonIcon as={LucideIcon} name={submitButtonProps?.icon || "FileText"}
              {...submitButtonProps?._icon}
            />
          }
          <ButtonText>{submitButtonText ?? t('common.submit', 'Submit')}</ButtonText>
        </Button>
      )}
    </HStack>
  </HStack>
));

/**
 * Centralized validation popup — lists every invalid field grouped by
 * step (tab) then section, matching the existing inline error text
 * (no custom validation style is introduced). Clicking an item lets the
 * caller navigate to, scroll to, and focus/highlight that field.
 */
const ValidationPopup: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  issues: ValidationIssue[];
  onSelectIssue: (issue: ValidationIssue) => void;
  t: (key: string, fallback?: string) => string;
}> = memo(({ isOpen, onClose, issues, onSelectIssue, t }) => {
  const groups = useMemo(() => {
    const byTab = new Map<string, Map<string, ValidationIssue[]>>();
    issues.forEach(issue => {
      const tabKey = issue.tabTitle ?? '';
      const sectionKey = issue.sectionTitle ?? '';
      if (!byTab.has(tabKey)) byTab.set(tabKey, new Map());
      const bySection = byTab.get(tabKey)!;
      if (!bySection.has(sectionKey)) bySection.set(sectionKey, []);
      bySection.get(sectionKey)!.push(issue);
    });
    return Array.from(byTab.entries()).map(([tabTitle, bySection]) => ({
      tabTitle,
      sections: Array.from(bySection.entries()).map(
        ([sectionTitle, sectionIssues]) => ({
          sectionTitle,
          issues: sectionIssues,
        }),
      ),
    }));
  }, [issues]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      headerTitle={t('common.validationErrors', 'Validation Errors')}
    >
      <VStack space="md">
        {groups.map(group => (
          <VStack key={group.tabTitle || 'untitled-tab'} space="sm">
            {!!group.tabTitle && (
              <Text {...TYPOGRAPHY.label} color="$textForeground">
                {group.tabTitle}
              </Text>
            )}
            {group.sections.map(section => (
              <VStack
                key={section.sectionTitle || 'untitled-section'}
                space="xs"
                pl={group.tabTitle ? '$4' : undefined}
              >
                {!!section.sectionTitle && (
                  <Text {...TYPOGRAPHY.bodySmall} color="$textMutedForeground">
                    {section.sectionTitle}
                  </Text>
                )}
                <VStack space="xs" pl="$2">
                  {section.issues.map(issue => (
                    <Pressable
                      key={issue.fieldName}
                      onPress={() => onSelectIssue(issue)}
                      display="flex"
                      flexDirection="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Text
                        {...TYPOGRAPHY.bodySmall}
                        color="$blue600"
                        textDecorationLine="underline"
                        cursor="pointer"
                      >
                        {issue.fieldLabel}
                        {/* — {issue.message} */}
                      </Text>
                      <LucideIcon
                        name={'ChevronRight' as any}
                        size={16}
                        color={'$blue600'}
                      />
                    </Pressable>
                  ))}
                </VStack>
              </VStack>
            ))}
          </VStack>
        ))}
      </VStack>
    </Modal>
  );
});

// ─── Main Component ───────────────────────────────────────────────────────────

/**
 * Returns a permanently-stable function identity that always calls through to
 * the latest `fn` passed in. Lets callbacks that close over fast-changing state
 * (like `values`, which gets a new reference every keystroke) be handed to
 * memoized children without defeating their memoization — the child's props
 * see the same function reference across renders, while the call itself still
 * runs against current data. Standard "latest ref" pattern, not a new
 * architecture.
 */
function useStableCallback<T extends (...args: any[]) => any>(fn: T): T {
  const ref = useRef(fn);
  ref.current = fn;
  return useCallback((...args: Parameters<T>) => ref.current(...args), []) as T;
}

const SchemaFormRenderer: React.FC<SchemaFormRendererProps> = ({
  schema,
  values = {},
  errors = {},
  onFieldChange: onFieldChangeProp = (...e) => {
    console.log(e);
  },
  optionsMap = {},
  disabled = false,
  t,
  mode = 'edit',
  firstNameRef,
  onSubmit,
  onSaveDraft,
  isSubmitting = false,
  _input,
  uploadService,
  customButton,
  showPreviousButton,
  showContinueButton,
  showSaveDraftButton,
  showSubmitButton,
  previousButtonText,
  continueButtonText,
  saveDraftButtonText,
  submitButtonText,
  previousButtonProps,
  continueButtonProps,
  saveDraftButtonProps,
  submitButtonProps,
  lodingButton,
}) => {
  // Caller-supplied `onFieldChange` can't be assumed referentially stable —
  // wrap it once so every child that receives it keeps the same identity
  // across renders (required for the memoization below to do anything).
  const onFieldChange = useStableCallback(onFieldChangeProp);

  // Track password visibility per group
  const [visibilityGroups, setVisibilityGroups] = useState<
    Record<string, boolean>
  >({});

  // Only closes over the stable `setVisibilityGroups` dispatcher, so a plain
  // useCallback([]) is enough — no latest-ref wrapper needed.
  const toggleVisibilityGroup = useCallback((group: string) => {
    setVisibilityGroups(prev => ({ ...prev, [group]: !prev[group] }));
  }, []);

  // Flat name → field-definition lookup, used to resolve `view` fields by name.
  const fieldsByName = useMemo(() => collectFieldsByName(schema), [schema]);

  // ── Multi-step wizard state (only used when the root schema is 2+ `tab` nodes) ──
  const rootTabs = useMemo(
    () => schema.filter(node => node.type === 'tab'),
    [schema],
  );
  const isMultiStep = rootTabs.length > 1 && rootTabs.length === schema.length;

  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const safeStepIndex = Math.min(
    activeStepIndex,
    Math.max(rootTabs.length - 1, 0),
  );

  const [internalErrors, setInternalErrors] = useState<Record<string, string>>(
    {},
  );
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupIssues, setPopupIssues] = useState<ValidationIssue[]>([]);
  const [highlightedField, setHighlightedField] = useState<string | null>(null);

  const fieldRefsRef = useRef<Record<string, any>>({});
  const pendingFocusFieldRef = useRef<{
    fieldName: string;
    message: string;
  } | null>(null);
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // Only closes over the stable `fieldRefsRef` ref, so a plain useCallback([])
  // is enough here too.
  const registerFieldRef = useCallback((name: string, node: any) => {
    fieldRefsRef.current[name] = node;
  }, []);

  // Reveals the standard inline error for exactly this one field, then scrolls,
  // focuses, and temporarily highlights it. Other invalid fields stay quiet —
  // Task 2 explicitly asks that the popup, not a wall of inline errors, be the
  // first thing the user sees after a failed validation.
  const revealAndFocusField = (name: string, message: string) => {
    setInternalErrors(prev => ({ ...prev, [name]: message }));

    setHighlightedField(name);
    if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
    highlightTimeoutRef.current = setTimeout(
      () => setHighlightedField(null),
      1600,
    );

    setTimeout(() => {
      const node = fieldRefsRef.current[name];
      if (node?.scrollIntoView)
        node.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (node?.focus) node.focus();
    }, 50);
  };

  // Applies a fresh validation pass without auto-revealing newly-invalid fields:
  // a field only ever gets an inline message once the user has opened it from the
  // validation popup (`revealAndFocusField`). Already-revealed fields still track
  // the live result (cleared once fixed, updated if still invalid).
  const applyValidationResult = (
    freshErrors: Record<string, string>,
    visited: Set<string>,
  ) => {
    setInternalErrors(prev => {
      const next = { ...prev };
      visited.forEach(name => {
        if (!(name in next)) return; // never revealed — stays hidden
        if (freshErrors[name]) next[name] = freshErrors[name];
        else delete next[name]; // now valid — clear it
      });
      return next;
    });
  };

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current)
        clearTimeout(highlightTimeoutRef.current);
    };
  }, []);

  // Runs after navigating to a different step from the validation popup — the target
  // field only mounts once that step's content renders, so this waits a tick for it.
  useEffect(() => {
    const pending = pendingFocusFieldRef.current;
    if (!pending) return;
    pendingFocusFieldRef.current = null;

    const timer = setTimeout(() => {
      revealAndFocusField(pending.fieldName, pending.message);
    }, 50);

    return () => clearTimeout(timer);
  }, [safeStepIndex]);

  // Only closes over the stable `setActiveStepIndex` dispatcher.
  const handlePrevious = useCallback(() => {
    setActiveStepIndex(i => Math.max(0, i - 1));
  }, []);

  // Direct tab clicks navigate freely (no validation gating) — only the
  // Continue button validates before advancing. Values/errors/draft state
  // are untouched since they live outside `activeStepIndex`.
  // Only closes over the stable `setActiveStepIndex` dispatcher.
  const handleSelectStep = useCallback((index: number) => {
    setActiveStepIndex(index);
  }, []);

  // The rest of these close over `values`/`schema`/`optionsMap`/`t`/`rootTabs`/
  // etc., which legitimately change across renders — useStableCallback keeps
  // their prop identity stable for memoized children while still always
  // running against the latest closure.
  const handleContinue = useStableCallback(() => {
    const currentTab = rootTabs[safeStepIndex];
    if (!currentTab) return;

    const {
      errors: stepErrors,
      issues: stepIssues,
      visited,
    } = collectValidationForRoots([currentTab], schema, values, optionsMap, t);

    applyValidationResult(stepErrors, visited);

    if (stepIssues.length === 0) {
      setActiveStepIndex(i => Math.min(i + 1, rootTabs.length - 1));
    } else {
      setPopupIssues(stepIssues);
      setIsPopupOpen(true);
    }
  });

  // Shared by Submit and Save Draft — both resolve file uploads through the
  // exact same `resolveFileUploads` call and report failures the same way;
  // the only difference between the two flows is whether validation runs first.
  const buildFileUploadIssues = (failedFieldNames: string[]): ValidationIssue[] =>
    failedFieldNames.map(name => {
      const field = fieldsByName[name];
      return {
        fieldName: name,
        fieldLabel: field?.label
          ? t(`admin.users.createUser.${field.label.key}`, field.label.fallback)
          : name,
        message: t('common.fileUploadFailed', 'File upload failed'),
      };
    });

  const handleSubmit = useStableCallback(async () => {
    const {
      errors: allErrors,
      issues: allIssues,
      visited,
    } = collectValidationForRoots(schema, schema, values, optionsMap, t);

    applyValidationResult(allErrors, visited);

    if (allIssues.length > 0) {
      setPopupIssues(allIssues);
      setIsPopupOpen(true);
      return;
    }

    let resolvedValues = values;
    try {
      resolvedValues = await resolveFileUploads(schema, values, uploadService);
    } catch (err) {
      if (err instanceof FileUploadError) {
        setPopupIssues(buildFileUploadIssues(err.failedFieldNames));
        setIsPopupOpen(true);
        return;
      }
      throw err;
    }

    onSubmit?.(resolvedValues);
  });

  const handleSaveDraft = useStableCallback(async () => {
    // No validation here by design — Save Draft only differs from Submit by
    // skipping it; the upload step itself is identical.
    let resolvedValues = values;
    try {
      resolvedValues = await resolveFileUploads(schema, values, uploadService);
    } catch (err) {
      if (err instanceof FileUploadError) {
        setPopupIssues(buildFileUploadIssues(err.failedFieldNames));
        setIsPopupOpen(true);
        return;
      }
      throw err;
    }

    onSaveDraft?.(resolvedValues);
  });

  const handleSelectIssue = useStableCallback((issue: ValidationIssue) => {
    setIsPopupOpen(false);

    if (
      issue.rootTabIndex !== undefined &&
      issue.rootTabIndex !== safeStepIndex
    ) {
      // Defer scroll/focus/highlight until the new step's fields mount (see effect above).
      pendingFocusFieldRef.current = {
        fieldName: issue.fieldName,
        message: issue.message,
      };
      setActiveStepIndex(issue.rootTabIndex);
      return;
    }

    revealAndFocusField(issue.fieldName, issue.message);
  });

  // Only closes over the stable `setIsPopupOpen` dispatcher.
  const handleClosePopup = useCallback(() => setIsPopupOpen(false), []);

  // Memoized so its reference only changes when one of these actually
  // changes — e.g. toggling the validation popup touches none of them, so
  // memoized descendants (RenderNodes/SectionNode/TabGroupRenderer/...) see
  // the same `ctx` prop and skip re-rendering entirely.
  const baseCtx: NodeRenderContext = useMemo(
    () => ({
      values,
      errors,
      optionsMap,
      mode,
      t,
      onFieldChange,
      disabled,
      visibilityGroups,
      toggleVisibilityGroup,
      firstNameRef,
      fieldsByName,
      globalInputProps: _input,
    }),
    [
      values,
      errors,
      optionsMap,
      mode,
      t,
      onFieldChange,
      disabled,
      visibilityGroups,
      toggleVisibilityGroup,
      firstNameRef,
      fieldsByName,
      _input,
    ],
  );

  const activeTab = rootTabs[safeStepIndex];

  const stepCtx: NodeRenderContext = useMemo(
    () => ({
      ...baseCtx,
      errors: { ...errors, ...internalErrors },
      registerFieldRef,
      highlightedField,
    }),
    [baseCtx, errors, internalErrors, registerFieldRef, highlightedField],
  );

  // Whole-form progress (every tab/section/nested node), not just the active step.
  // Memoized so it isn't recomputed on renders unrelated to values/optionsMap
  // (e.g. popup toggling) — it still recomputes on every keystroke, same as
  // before, since `values` itself changes reference every keystroke.
  const { total: requiredTotal, completed: requiredCompleted } = useMemo(
    () => computeRequiredFieldProgress(schema, values, optionsMap),
    [schema, values, optionsMap],
  );

  if (isMultiStep) {
    const stepSubTitleText = activeTab?.subTitle
      ? t(
        `admin.users.createUser.${activeTab.subTitle.key}`,
        activeTab.subTitle.fallback,
      )
      : undefined;

    return (
      <VStack space="md" width="100%">
        <VStack width="100%">
          <StepProgress
            total={requiredTotal}
            completed={requiredCompleted}
            t={t}
          />

          <StepHeader
            tabs={rootTabs}
            activeStepIndex={safeStepIndex}
            onSelectStep={handleSelectStep}
            t={t}
          />
        </VStack>

        {!!stepSubTitleText && (
          <Text {...TYPOGRAPHY.caption} color="$textMutedForeground">
            {stepSubTitleText}
          </Text>
        )}

        {!!activeTab?.hint && <HintDisplay hint={activeTab.hint} t={t} />}

        <RenderNodes nodes={activeTab?.children} ctx={stepCtx} />

        <StepFooter
          isFirstStep={safeStepIndex === 0}
          isLastStep={safeStepIndex === rootTabs.length - 1}
          disabled={disabled || isSubmitting}
          onPrevious={handlePrevious}
          onContinue={handleContinue}
          onSaveDraft={onSaveDraft ? handleSaveDraft : undefined}
          onSubmit={handleSubmit}
          t={t}
          customButton={customButton}
          showPreviousButton={showPreviousButton}
          showContinueButton={showContinueButton}
          showSaveDraftButton={showSaveDraftButton}
          showSubmitButton={showSubmitButton}
          previousButtonText={previousButtonText}
          continueButtonText={continueButtonText}
          saveDraftButtonText={saveDraftButtonText}
          submitButtonText={submitButtonText}
          previousButtonProps={previousButtonProps}
          continueButtonProps={continueButtonProps}
          saveDraftButtonProps={saveDraftButtonProps}
          submitButtonProps={submitButtonProps}
          lodingButton={lodingButton}
        />

        <ValidationPopup
          isOpen={isPopupOpen}
          onClose={handleClosePopup}
          issues={popupIssues}
          onSelectIssue={handleSelectIssue}
          t={t}
        />
      </VStack>
    );
  }

  return (
    <VStack space="md" width="100%">
      <RenderNodes nodes={schema} ctx={baseCtx} />
    </VStack>
  );
};

export default SchemaFormRenderer;

export const RenderRow = memo(
  ({ rows, values = {}, optionsMap = {}, mode, ...rest }: any) => {
    // Not wrapped in useMemo: the previous version keyed its cache on `rest`
    // (an object-rest-spread — a new object every render), so the cache never
    // actually hit and this recomputed every render anyway. The computation
    // itself is a cheap flatMap over a handful of rows/fields, and `values`/
    // `optionsMap` already change reference every keystroke regardless — the
    // real memoization payoff for this file lives in FieldContainer, below.
    const renderedRows = rows?.map((row: any, index: number) => {
      if (!isVisible(row.visibleWhen, values, optionsMap)) {
        return null;
      }

      const visibleFields = row.fields.flatMap((field: any) => {
        if (!isVisible(field.visibleWhen, values, optionsMap)) {
          return [];
        }

        if (!isVisibleIf(field.visibleIf, values)) {
          return [];
        }

        if (
          mode === 'preview' &&
          field.type === FORM_FIELD_TYPES.GROUP &&
          field.fields
        ) {
          return field;
        }

        return [field];
      });

      if (!visibleFields.length) {
        return null;
      }

      return (
        <RowRenderer
          key={row.id ?? index}
          fields={visibleFields}
          isMobile={false}
          values={values}
          optionsMap={optionsMap}
          mode={mode}
          {...rest}
        />
      );
    });

    return <>{renderedRows}</>;
  },
);

interface FieldType {
  field: FormField;
  t: (key: string, fallback?: string) => string;
  isMultiField?: boolean;
  values?: Record<string, any>;
  errors?: Record<string, string>;
  optionsMap?: OptionsMap;
  mode?: string;
  onFieldChange?: (name: string, value: any, other?: any) => void;
  disabled?: boolean;
  visibilityGroups?: Record<string, boolean>;
  toggleVisibilityGroup?: (group: string) => void;
  /** Forwarded ref for the first autoFocus field */
  firstNameRef?: React.RefObject<any>;
  isNested?: boolean;
  isEditMode?: boolean;
  /** Flat name → field-definition lookup, used to resolve `view` fields */
  fieldsByName?: Record<string, FormField>;
  /** Registers a field's rendered container node, keyed by field name */
  registerFieldRef?: (name: string, node: any) => void;
  /** Name of the field to temporarily highlight (navigated to from the validation popup) */
  highlightedField?: string | null;
  /** Global default input props (from `SchemaFormRendererProps._input`); a field's own `_input` wins over this. */
  globalInputProps?: any;
}

const RowRenderer = memo(
  ({
    isMobile,
    fields,
    t,
    ...fieldsProps
  }: FieldType | { isMobile: boolean; fields: FormField[] }) => {
    const isMultiField = fields.length > 1;

    return (
      <HStack
        space="md"
        flexDirection={isMobile || !isMultiField ? 'column' : 'row'}
      >
        {fields.map((field: any) => (
          <FieldContainer
            key={field.name ?? field.label.key}
            isMultiField={isMultiField}
            field={field}
            t={t}
            {...fieldsProps}
          />
        ))}
      </HStack>
    );
  },
);

// ─── Hint (simple helper string, or an info/warning/danger/success banner) ────

const HINT_TYPE_CONFIG: Record<
  string,
  {
    bg: string;
    borderColor: string;
    textColor: string;
    icon: string;
    iconColor?: string;
    bulletTextColor?: string;
  }
> = {
  info: {
    bg: '$blue50',
    borderColor: '$blue200',
    bulletTextColor: '$blue800',
    textColor: '$blue900',
    iconColor: '$blue600',
    icon: 'Info',
  },
  warning: {
    bg: '$warning100',
    borderColor: '$warning700',
    textColor: '$warning700',
    icon: 'AlertTriangle',
  },
  danger: {
    bg: '$error100',
    borderColor: '$error700',
    textColor: '$error700',
    icon: 'XCircle',
  },
  success: {
    bg: '$success100',
    borderColor: '$success700',
    textColor: '$success700',
    icon: 'CheckCircle',
  },
};

const HintDisplay: React.FC<{
  hint: Hint;
  t: (key: string, fallback?: string) => string;
}> = memo(({ hint, t }) => {
  if (typeof hint === 'string') {
    return (
      <HStack
        space="sm"
        alignItems="flex-start"
        bg="$backgroundLight100"
        p="$3"
        borderRadius="$md"
        borderWidth={1}
        borderColor="$borderColor"
        width="100%"
      >
        <Box mt={2}>
          <LucideIcon name="Info" size={16} color="$primary500" />
        </Box>
        <Text {...TYPOGRAPHY.bodySmall} color="$textMutedForeground" flex={1}>
          {t(hint)}
        </Text>
      </HStack>
    );
  }

  const config = HINT_TYPE_CONFIG[hint.type ?? 'info'] ?? HINT_TYPE_CONFIG.info;
  const iconName = hint.icon ?? config.icon;
  const titleText = hint.title
    ? t(`admin.users.createUser.${hint.title.key}`, hint.title.fallback)
    : undefined;

  return (
    <VStack
      space="xs"
      bg={config.bg}
      borderWidth={1}
      borderColor={config.borderColor}
      borderRadius="$xl"
      p="$3"
      width="100%"
    >
      <HStack space="sm" alignItems="flex-start">
        <Box mt={2}>
          <LucideIcon
            name={iconName as any}
            size={16}
            color={config?.iconColor || config.textColor}
            {...hint?._icon}
          />
        </Box>
        <VStack space="xs" flex={1}>
          {!!titleText && (
            <Text
              {...TYPOGRAPHY.bodySmall}
              color={config.textColor}
              fontWeight="$medium"
              {...hint?._title}
            >
              {titleText}
            </Text>
          )}
          {!!hint.bullets?.length && (
            <VStack space="xs">
              {hint.bullets.map((bullet: any, index: number) => (
                <HStack
                  key={bullet.key ?? index}
                  space="xs"
                  alignItems="flex-start"
                >
                  <Text color={config?.bulletTextColor || config.textColor}>
                    {'•'}
                  </Text>
                  <Text
                    {...TYPOGRAPHY.bodySmall}
                    color={config?.bulletTextColor || config.textColor}
                    flex={1}
                  >
                    {t(`admin.users.createUser.${bullet.key}`, bullet.fallback)}
                  </Text>
                </HStack>
              ))}
            </VStack>
          )}
        </VStack>
      </HStack>
    </VStack>
  );
});

/**
 * Formats a stored field value for read-only display (preview mode, `view`
 * fields): resolves option labels, joins multiselect/pillmultiselect arrays
 * with ", ", and falls back to the raw value's name/string form for anything
 * else (e.g. a `file` field's picked-asset object). Shared by `ViewFieldDisplay`
 * and `FieldContainer`'s preview-mode branch so the array/object handling
 * isn't duplicated.
 */
function formatFieldValueForDisplay(
  values: any,
  field: (FormField & { fields?: FormField[] }) | undefined,
  optionsMap: OptionsMap,
): string {

  let rawValue = field?.name ? values[field?.name] : undefined;
  if (!isValuePresent(rawValue) && field?.defaultValue) {
    rawValue = field.defaultValue;
  }
  
  const resolveLabel = (v: any): string => {
    if (field?.displayFormat) {
      const [type, format] = field?.displayFormat?.split("@")
      if (type === "dateFormat") {
        if (field?.valueFormat) {
          return moment(v, field?.valueFormat).format(format)
        }
        return moment(v).format(format)
      }
    }
    const option = field?.optionsSource
      ? optionsMap[field?.optionsSource]?.find(o => o.value === v)
      : undefined;
    return option?.label || String(v);
  };

  if(field?.type === FORM_FIELD_TYPES.GROUP) {
    let newValue:string[] = []
    field?.fields?.forEach((item:FormField | undefined) => newValue.push(item?.name && values[item?.name] ? resolveLabel(values[item?.name]) : '-'))
    return newValue.join(" ")
  }

  if (Array.isArray(rawValue)) {
    if (rawValue.length === 0) return '-';
    return rawValue.map(v => (v && typeof v === 'object' ? v.name ?? String(v) : resolveLabel(v))).join(', ');
  }

  if (rawValue && typeof rawValue === 'object') {
    return rawValue.name ?? '-';
  }

  const display = rawValue ? resolveLabel(rawValue) : '-';
  return typeof display === 'string' ? display.replace(/_/g, '-') : String(display);
}

// ─── View Field (read-only display of another field's label/value) ───────────

interface ViewFieldDisplayProps {
  field: FormField;
  values: Record<string, any>;
  optionsMap: OptionsMap;
  t: (key: string, fallback?: string) => string;
  isMultiField?: boolean;
  fieldsByName: Record<string, FormField>;
}

const ViewFieldDisplay: React.FC<ViewFieldDisplayProps> = memo(({
  field,
  values,
  optionsMap,
  t,
  isMultiField,
  fieldsByName,
}) => {
  const targetField = field.name ? fieldsByName[field.name] : undefined;

  const label = targetField?.label
    ? t(
      `admin.users.createUser.${targetField.label.key}`,
      targetField.label.fallback,
    )
    : field.name ?? '-';

  const displayValue = formatFieldValueForDisplay(
    values,
    targetField,
    optionsMap,
  );

  return (
    <HStack
      space="xs"
      flex={isMultiField ? 1 : undefined}
      width={!isMultiField ? '100%' : undefined}
    >
      <Text {...TYPOGRAPHY.bodySmall} color="$textMutedForeground" flex={1}>
        {label}
      </Text>
      <Text {...TYPOGRAPHY.bodySmall} color="$textForeground" flex={2}>
        {displayValue}
      </Text>
    </HStack>
  );
});

// ─── FieldContainer's fine-grained re-render gate ─────────────────────────────
//
// `values`/`errors` always get a new object reference on every keystroke (this
// component is fully controlled), so no comparison based on their identity can
// ever skip a re-render. Instead, for a given field, we compare only the
// specific `values`/`errors`/`optionsMap` KEYS that field actually reads —
// its own name, plus (for GROUP) every sub-field's name, plus whatever
// `disabledWhen`/`dependsOn`/`optionsSource` it references.
//
// Deliberately excluded: `visibleIf`/`visibleWhen`. Visibility is resolved one
// level up, in `RenderRow`, before a `<FieldContainer>` element is even
// constructed — when a field becomes visible/invisible, React mounts/unmounts
// it by key, and a memo comparator is never invoked for a mount/unmount.
interface FieldStructuralDeps {
  valueKeys: string[];
  errorKeys: string[];
  optionsKeys: string[];
}

const fieldStructuralDepsCache = new WeakMap<FormField, FieldStructuralDeps>();

function extractStructuralDeps(field: FormField): FieldStructuralDeps {
  const cached = fieldStructuralDepsCache.get(field);
  if (cached) return cached;

  const valueKeys = new Set<string>();
  const errorKeys = new Set<string>();
  const optionsKeys = new Set<string>();

  const walk = (f: FormField) => {
    if (f.name) {
      valueKeys.add(f.name);
      errorKeys.add(f.name);
    }
    if (f.optionsSource) optionsKeys.add(f.optionsSource);
    if (f.disabledWhen?.field) valueKeys.add(f.disabledWhen.field);
    if (f.dependsOn) valueKeys.add(f.dependsOn);
    if (f.type === FORM_FIELD_TYPES.GROUP && Array.isArray(f.fields)) {
      f.fields.forEach(walk);
    }
  };
  walk(field);

  const deps: FieldStructuralDeps = {
    valueKeys: Array.from(valueKeys),
    errorKeys: Array.from(errorKeys),
    optionsKeys: Array.from(optionsKeys),
  };
  fieldStructuralDepsCache.set(field, deps);
  return deps;
}

// `view` fields display another field's value by name — resolved fresh every
// comparison (a couple of property lookups, not worth caching) since it
// depends on `fieldsByName`, which isn't part of the cache key above.
function extraViewOptionsKey(
  field: FormField,
  fieldsByName: Record<string, FormField>,
): string | undefined {
  if (field.type === FORM_FIELD_TYPES.VIEW && field.name) {
    return fieldsByName[field.name]?.optionsSource;
  }
  return undefined;
}

function shallowEqualObjects(a: any, b: any): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every(key => a[key] === b[key]);
}

function fieldContainerPropsAreEqual(prev: FieldType, next: FieldType): boolean {
  if (prev.field !== next.field) return false;
  if (prev.mode !== next.mode) return false;
  if (prev.disabled !== next.disabled) return false;
  if (prev.isMultiField !== next.isMultiField) return false;
  if (prev.t !== next.t) return false;
  if (prev.visibilityGroups !== next.visibilityGroups) return false;
  if (prev.toggleVisibilityGroup !== next.toggleVisibilityGroup) return false;
  if (prev.firstNameRef !== next.firstNameRef) return false;
  if (prev.fieldsByName !== next.fieldsByName) return false;
  if (prev.registerFieldRef !== next.registerFieldRef) return false;
  if (prev.onFieldChange !== next.onFieldChange) return false;
  if (!shallowEqualObjects(prev.globalInputProps, next.globalInputProps)) return false;

  const prevHighlighted = !!next.field.name && prev.highlightedField === next.field.name;
  const nextHighlighted = !!next.field.name && next.highlightedField === next.field.name;
  if (prevHighlighted !== nextHighlighted) return false;

  const prevValues = prev.values ?? {};
  const nextValues = next.values ?? {};
  const prevErrors = prev.errors ?? {};
  const nextErrors = next.errors ?? {};
  const prevOptionsMap = prev.optionsMap ?? {};
  const nextOptionsMap = next.optionsMap ?? {};

  const deps = extractStructuralDeps(next.field);

  for (const key of deps.valueKeys) {
    if (prevValues[key] !== nextValues[key]) return false;
  }
  for (const key of deps.errorKeys) {
    if (prevErrors[key] !== nextErrors[key]) return false;
  }
  for (const key of deps.optionsKeys) {
    if (prevOptionsMap[key] !== nextOptionsMap[key]) return false;
  }

  const viewOptionsKey = extraViewOptionsKey(next.field, next.fieldsByName ?? {});
  if (viewOptionsKey && prevOptionsMap[viewOptionsKey] !== nextOptionsMap[viewOptionsKey]) {
    return false;
  }

  return true;
}

const FieldContainer = memo(
  ({
    field,
    isMultiField,
    values = {},
    errors = {},
    optionsMap = {},
    mode = '',
    t = e => e,
    disabled = false,
    visibilityGroups,
    toggleVisibilityGroup,
    firstNameRef,
    fieldsByName = {},
    registerFieldRef,
    highlightedField,
    globalInputProps,
    onFieldChange = (...e) => {
      console.log(e);
    },
  }: FieldType) => {
    const value = field.name ? values[field.name] ?? '' : '';
    const error = field.name ? errors[field.name] : undefined;
    const isHighlighted = !!field.name && highlightedField === field.name;
    const containerRef = (node: any) => {
      if (field.name) registerFieldRef?.(field.name, node);
    };

    if (field.type === FORM_FIELD_TYPES.VIEW) {
      return (
        <ViewFieldDisplay
          field={field}
          values={values}
          optionsMap={optionsMap}
          t={t}
          isMultiField={isMultiField}
          fieldsByName={fieldsByName}
        />
      );
    }

    if (mode === 'preview') {
      if (field.type === FORM_FIELD_TYPES.NOTE) {
        return null;
      }

      const displayValue = formatFieldValueForDisplay(
        values,
        field,
        optionsMap,
      );

      return (
        <VStack
          ref={containerRef}
          space="xs"
          flex={isMultiField ? 1 : undefined}
          width={!isMultiField ? '100%' : undefined}
        >
          <Text {...TYPOGRAPHY.caption} color="$textMutedForeground">
            {t(
              `admin.users.createUser.${field.label.key}`,
              field.label.fallback,
            )}
          </Text>

          {!!field.subTitle && (
            <Text {...TYPOGRAPHY.caption} color="$textMutedForeground">
              {t(
                `admin.users.createUser.${field.subTitle.key}`,
                field.subTitle.fallback,
              )}
            </Text>
          )}

          <Text {...TYPOGRAPHY.bodySmall} color="$textForeground">
            {displayValue}
          </Text>
        </VStack>
      );
    }

    return (
      <VStack
        ref={containerRef}
        space="xs"
        flex={isMultiField ? 1 : undefined}
        width={!isMultiField ? '100%' : undefined}
        p={isHighlighted ? '$2' : undefined}
        borderRadius={isHighlighted ? '$md' : undefined}
        bg={isHighlighted ? '$warning100' : undefined}
        {...field._container}
      >
        {field.type !== FORM_FIELD_TYPES.NOTE && (
          <>
            <Text
              {...TYPOGRAPHY.bodySmall}
              color="$textForeground"
              fontWeight="$medium"
              {...field._title}
            >
              {t(
                `admin.users.createUser.${field.label.key}`,
                field.label.fallback,
              )}
              <Text ml="$1" color={field.required ? "$red500" : "$blueGray400"} fontSize={"$sm"}>{field.required ? "*" : "(optional)"}</Text>
            </Text>
            {!!field.subTitle && (
              <Text
                {...TYPOGRAPHY.caption}
                color="$textMutedForeground"
                {...field._subTitle}
              >
                {t(
                  `admin.users.createUser.${field.subTitle.key}`,
                  field.subTitle.fallback,
                )}
              </Text>
            )}
            {!!field.hint && <HintDisplay hint={field.hint} t={t} />}
          </>
        )}

        <FieldRenderer
          field={field}
          value={value}
          error={error}
          errors={errors}
          onChange={onFieldChange}
          disabled={disabled}
          optionsMap={optionsMap}
          values={values}
          t={t}
          visibilityGroups={visibilityGroups}
          toggleVisibilityGroup={toggleVisibilityGroup}
          autoFocusRef={firstNameRef}
          globalInputProps={globalInputProps}
        />

        {error && (
          <Text color="$error600" fontSize="$xs">
            {error}
          </Text>
        )}
      </VStack>
    );
  },
  fieldContainerPropsAreEqual,
);
