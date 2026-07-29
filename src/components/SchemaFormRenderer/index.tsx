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

import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
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
} from '@ui';
import { LucideIcon } from '@ui/index';
import Select from '@components/ui/Inputs/Select';
import DatePicker from '@components/ui/Inputs/DatePicker';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';
import { styles } from '../../screens/UserManagement/Styles';
import { FORM_FIELD_TYPES } from '@constants/CREATE_USER_FORM_SCHEMA';
import type {
  FormSection,
  FormField,
  ValidationRule,
  VisibleIfCondition,
} from '@constants/CREATE_USER_FORM_SCHEMA';

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
  /** Current field values keyed by field name */
  values?: Record<string, string>;
  /** Current field errors keyed by field name */
  errors?: Record<string, string>;
  /** Called when any field value changes */
  onFieldChange?: (name: string, value: string) => void;
  /** Resolved options for every optionsSource key referenced in the schema */
  optionsMap?: OptionsMap;
  /** Global disabled state (e.g. while form is submitting) */
  disabled?: boolean;
  /** When true, renders all fields as plain read-only text instead of inputs */
  mode?: string;
  /** Layout flag — stacks fields vertically on mobile */
  isMobile?: boolean;
  /** Translation function */
  t: (key: string, fallback?: string) => string;
  /** Optional ref forwarded to the first autoFocus field */
  firstNameRef?: React.RefObject<any>;
  /**
   * Called after whole-form validation passes when the user clicks Submit.
   * Only relevant for multi-step schemas (root schema made entirely of 2+ `tab` nodes) —
   * single/no-tab schemas keep managing their own submit button externally, unchanged.
   */
  onSubmit?: (values: Record<string, string>) => void | Promise<void>;
  /** Called when the user clicks Save Draft (multi-step schemas only); no validation is run first */
  onSaveDraft?: (values: Record<string, string>) => void | Promise<void>;
  /** Disables the Previous/Continue/Save Draft/Submit footer buttons while a request is in flight */
  isSubmitting?: boolean;
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
  return visibleIf.every(condition => evaluateVisibleIfCondition(condition, values));
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
  values: Record<string, string>,
): string | undefined {
  if (!field.name || !field.validation?.length) return undefined;

  const val = (values[field.name] ?? '').trim();

  for (const rule of field.validation) {
    const err = applyRule(rule, val, values);
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

function applyRule(
  rule: ValidationRule,
  val: string,
  allValues: Record<string, string>,
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

      row.fields.forEach(field => validateField(field, values, optionsMap, errors));
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
      collectFieldIssues(subField, values, optionsMap, t, ancestry, errors, issues, visited),
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
      nextAncestry = { ...ancestry, tabTitle: nodeTitleText(node, t) ?? node.id };
    } else {
      const title = nodeTitleText(node, t);
      if (title) nextAncestry = { ...ancestry, sectionTitle: title };
    }

    node.rows?.forEach(row => {
      if (!isVisible(row.visibleWhen, values, optionsMap)) return;
      row.fields.forEach(field =>
        collectFieldIssues(field, values, optionsMap, t, nextAncestry, errors, issues, visited),
      );
    });

    if (node.children) {
      collectValidationIssues(node.children, values, optionsMap, t, errors, issues, visited, nextAncestry);
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
): { errors: Record<string, string>; issues: ValidationIssue[]; visited: Set<string> } {
  const errors: Record<string, string> = {};
  const issues: ValidationIssue[] = [];
  const visited = new Set<string>();

  rootNodes.forEach(node => {
    const rootTabIndex = schema.indexOf(node);
    const ancestry: ValidationAncestry =
      node.type === 'tab' && rootTabIndex !== -1 ? { rootTabIndex } : {};
    collectValidationIssues([node], values, optionsMap, t, errors, issues, visited, ancestry);
  });

  return { errors, issues, visited };
}

// ─── Field Renderers ──────────────────────────────────────────────────────────

interface FieldRendererProps {
  field: FormField;
  value: string;
  error?: string;
  errors: Record<string, string>;
  onChange: (name: string, value: string) => void;
  disabled: boolean;
  optionsMap: OptionsMap;
  values: Record<string, string>;
  t: (key: string, fallback?: string) => string;
  /** Shared visibility state for password toggle groups */
  visibilityGroups: Record<string, boolean>;
  toggleVisibilityGroup: (group: string) => void;
  /** Forwarded ref for the first autoFocus field */
  autoFocusRef?: React.RefObject<any>;
  isNested?: boolean;
  isEditMode?: boolean;
}

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
}) => {
  const isFieldDisabled =
    disabled || !!field.disabled || (isEditMode && field.name === 'roleId');

  useEffect(() => {
    if (field.type === FORM_FIELD_TYPES.SELECT) {
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
        {...(styles.createUserFormInput as any)}
        isInvalid={!!combinedError}
        isDisabled={disabled || field.disabled}
        alignItems="center"
        paddingLeft={0}
        height={40}
        width="100%"
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
              error={subField.name ? errors[subField.name] : undefined}
              errors={errors}
              onChange={onChange}
              disabled={disabled || !!subField.disabled}
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

    // Compute disabled-when condition
    let isDisabled = isFieldDisabled;
    if (!isDisabled && field.disabledWhen?.empty) {
      const depVal = (values[field.disabledWhen.field] ?? '').trim();
      if (!depVal) isDisabled = true;
    }

    // Dynamic placeholder when dependency is satisfied
    const activePlaceholder =
      field.placeholderWhenReady && (values[field.dependsOn ?? ''] ?? '').trim()
        ? field.placeholderWhenReady.fallback
        : placeholder;

    return (
      <Box
        width={isNested ? 95 : '100%'}
        zIndex={field.zIndex ?? (isNested ? 1000 : 1)}
      >
        <Select
          {...(isNested ? {} : styles.createUserFormSelect)}
          options={options}
          value={value}
          onChange={(val: string, _lbl: string) =>
            onChange(field.name || '', val)
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

  // ── Date ────────────────────────────────────────────────────────────────────
  if (field.type === FORM_FIELD_TYPES.DATE) {
    // Internal display value: stored as YYYY_MM_DD, displayed as YYYY-MM-DD
    const displayValue = value ? value.replace(/_/g, '-') : '';

    return (
      <Box zIndex={field.zIndex ?? 999}>
        <DatePicker
          {...styles.createUserFormInput}
          placeholder={placeholder || 'YYYY-MM-DD'}
          value={displayValue}
          onChange={(date: string) =>
            onChange(field.name || '', date.replace(/-/g, '_'))
          }
          maximumDate={
            field.validation?.some(r => r.rule === 'dateNotInFuture')
              ? new Date()
              : undefined
          }
          iconSize={20}
          isDisabled={disabled || field.disabled}
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
          {...styles.createUserFormInput}
          isInvalid={!!error}
          isDisabled={disabled || field.disabled}
          isReadOnly={field.isReadOnly}
        >
          <FastInputField
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
            disabled={disabled || field.disabled}
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
    const keyboardType = (field.inputProps?.keyboardType as any) ?? 'default';
    const autoCapitalize =
      (field.inputProps?.autoCapitalize as any) ?? 'sentences';
    const maxLength = field.inputProps?.maxLength;

    return (
      <Textarea
        {...(styles.createUserFormInput as any)}
        isInvalid={!!error}
        isDisabled={disabled || field.disabled}
        isReadOnly={field.isReadOnly}
      >
        <FastTextareaInput
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
  const keyboardType = (field.inputProps?.keyboardType as any) ?? 'default';
  const autoCapitalize =
    (field.inputProps?.autoCapitalize as any) ?? 'sentences';
  const maxLength = field.inputProps?.maxLength;

  return (
    <Input
      {...(isNested ? {} : (styles.createUserFormInput as any))}
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
        <Box pr="$2">
          <LucideIcon
            name={field.icon as any}
            size={16}
            color="$textMutedForeground"
          />
        </Box>
      )}
      <FastInputField
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
  values: Record<string, string>;
  errors: Record<string, string>;
  optionsMap: OptionsMap;
  mode: string;
  t: (key: string, fallback?: string) => string;
  onFieldChange: (name: string, value: string) => void;
  disabled: boolean;
  visibilityGroups: Record<string, boolean>;
  toggleVisibilityGroup: (group: string) => void;
  firstNameRef?: React.RefObject<any>;
  fieldsByName: Record<string, FormField>;
  /** Registers a field's rendered container node, keyed by field name — used to scroll/focus/highlight it from the validation popup */
  registerFieldRef?: (name: string, node: any) => void;
  /** Name of the field to temporarily highlight (set after navigating from the validation popup) */
  highlightedField?: string | null;
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
const RenderNodes: React.FC<{ nodes?: FormSection[]; ctx: NodeRenderContext }> = ({
  nodes,
  ctx,
}) => {
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
        <TabGroupRenderer key={`tabgroup-${tabGroup[0].id}`} tabs={tabGroup} ctx={ctx} />,
      );
      continue;
    }

    items.push(<SectionNode key={node.id} node={node} ctx={ctx} />);
    i += 1;
  }

  return <>{items}</>;
};

/** Single Tab Rule: one tab renders its children directly, no TabList/navigation chrome. */
const TabGroupRenderer: React.FC<{ tabs: FormSection[]; ctx: NodeRenderContext }> = ({
  tabs,
  ctx,
}) => {
  if (tabs.length <= 1) {
    return <RenderNodes nodes={tabs[0]?.children} ctx={ctx} />;
  }

  return (
    <Tabs value={tabs[0].id} width="100%">
      <TabsTabList>
        {tabs.map(tab => (
          <TabsTab key={tab.id} value={tab.id}>
            <TabsTabTitle>{nodeTitleText(tab, ctx.t) ?? tab.id}</TabsTabTitle>
          </TabsTab>
        ))}
      </TabsTabList>
      <TabsTabPanels>
        {tabs.map(tab => (
          <TabsTabPanel key={tab.id} value={tab.id}>
            <RenderNodes nodes={tab.children} ctx={ctx} />
          </TabsTabPanel>
        ))}
      </TabsTabPanels>
    </Tabs>
  );
};

/** Renders a "section" node: an @ui Card header (icon/title/subheading) plus its rows and children. */
const SectionNode: React.FC<{ node: FormSection; ctx: NodeRenderContext }> = ({
  node,
  ctx,
}) => {
  const titleText = nodeTitleText(node, ctx.t);
  const subheadingText = node.subheading
    ? ctx.t(`admin.users.createUser.${node.subheading.key}`, node.subheading.fallback)
    : undefined;

  return (
    <Card variant="outline" borderRadius="$lg" borderWidth={1} borderColor="$borderColor" p="$4" width="100%">
      <VStack space="sm">
        {!!titleText && (
          <VStack space="xs">
            <HStack space="xs" alignItems="center">
              {!!node.icon && (
                <LucideIcon name={node.icon as any} size={16} color="$textMutedForeground" />
              )}
              <Text {...TYPOGRAPHY.bodySmall} color="$textMutedForeground" fontWeight="$normal">
                {titleText}
              </Text>
            </HStack>
            {!!subheadingText && (
              <Text {...TYPOGRAPHY.caption} color="$textMutedForeground">
                {subheadingText}
              </Text>
            )}
          </VStack>
        )}

        {!!node.rows?.length && <RenderRow rows={node.rows} {...ctx} />}

        {!!node.children?.length && <RenderNodes nodes={node.children} ctx={ctx} />}
      </VStack>
    </Card>
  );
};

// ─── Multi-Step Navigation (Previous / Continue / Save Draft / Submit) ────────
//
// Engages only when the ENTIRE root schema is made of 2+ `tab` nodes (a genuine
// step wizard). Mixed/single-tab/no-tab schemas fall through to the plain
// recursive rendering above, unchanged — this keeps every existing screen
// (CREATE_USER_FORM_SCHEMA, etc.) byte-for-byte backward compatible.

/** Simple step indicator — deliberately not gluestack's Tabs, since Tabs has no
 * external-control API and the wizard's Previous/Continue buttons must be the
 * single source of truth for which step is active. */
const StepHeader: React.FC<{
  tabs: FormSection[];
  activeStepIndex: number;
  t: (key: string, fallback?: string) => string;
}> = ({ tabs, activeStepIndex, t }) => (
  <HStack space="lg" alignItems="center" flexWrap="wrap">
    {tabs.map((tab, index) => {
      const isActive = index === activeStepIndex;
      const isComplete = index < activeStepIndex;
      return (
        <HStack key={tab.id} space="xs" alignItems="center">
          <Box
            width={24}
            height={24}
            borderRadius="$full"
            alignItems="center"
            justifyContent="center"
            bg={isActive || isComplete ? '$primary500' : '$backgroundLight200'}
          >
            {isComplete ? (
              <LucideIcon name="Check" size={14} color="$white" />
            ) : (
              <Text {...TYPOGRAPHY.caption} color={isActive ? '$white' : '$textMutedForeground'}>
                {index + 1}
              </Text>
            )}
          </Box>
          <Text
            {...TYPOGRAPHY.bodySmall}
            color={isActive ? '$textForeground' : '$textMutedForeground'}
            fontWeight={isActive ? '$bold' : '$normal'}
          >
            {nodeTitleText(tab, t) ?? tab.id}
          </Text>
        </HStack>
      );
    })}
  </HStack>
);

const StepFooter: React.FC<{
  isFirstStep: boolean;
  isLastStep: boolean;
  disabled?: boolean;
  onPrevious: () => void;
  onContinue: () => void;
  onSaveDraft?: () => void;
  onSubmit: () => void;
  t: (key: string, fallback?: string) => string;
}> = ({ isFirstStep, isLastStep, disabled, onPrevious, onContinue, onSaveDraft, onSubmit, t }) => (
  <HStack space="sm" justifyContent="space-between" width="100%" flexWrap="wrap">
    <Button variant="outline" onPress={onPrevious} isDisabled={isFirstStep || disabled}>
      <ButtonText>{t('common.previous', 'Previous')}</ButtonText>
    </Button>
    <HStack space="sm">
      {!!onSaveDraft && (
        <Button variant="outline" onPress={onSaveDraft} isDisabled={disabled}>
          <ButtonText>{t('common.saveDraft', 'Save Draft')}</ButtonText>
        </Button>
      )}
      {!isLastStep && (
        <Button onPress={onContinue} isDisabled={disabled}>
          <ButtonText>{t('common.continue', 'Continue')}</ButtonText>
        </Button>
      )}
      {isLastStep && (
        <Button onPress={onSubmit} isDisabled={disabled}>
          <ButtonText>{t('common.submit', 'Submit')}</ButtonText>
        </Button>
      )}
    </HStack>
  </HStack>
);

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
}> = ({ isOpen, onClose, issues, onSelectIssue, t }) => {
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
      sections: Array.from(bySection.entries()).map(([sectionTitle, sectionIssues]) => ({
        sectionTitle,
        issues: sectionIssues,
      })),
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
                    <Pressable key={issue.fieldName} onPress={() => onSelectIssue(issue)}>
                      <Text {...TYPOGRAPHY.bodySmall} color="$error600">
                        {issue.fieldLabel} — {issue.message}
                      </Text>
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
};

// ─── Main Component ───────────────────────────────────────────────────────────

const SchemaFormRenderer: React.FC<SchemaFormRendererProps> = ({
  schema,
  values = {},
  errors = {},
  onFieldChange = (...e) => {
    console.log(e);
  },
  optionsMap = {},
  disabled = false,
  isMobile = false,
  t,
  mode = 'edit',
  firstNameRef,
  onSubmit,
  onSaveDraft,
  isSubmitting = false,
}) => {
  // Track password visibility per group
  const [visibilityGroups, setVisibilityGroups] = useState<
    Record<string, boolean>
  >({});

  const toggleVisibilityGroup = (group: string) => {
    setVisibilityGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  // Flat name → field-definition lookup, used to resolve `view` fields by name.
  const fieldsByName = useMemo(() => collectFieldsByName(schema), [schema]);

  // ── Multi-step wizard state (only used when the root schema is 2+ `tab` nodes) ──
  const rootTabs = useMemo(() => schema.filter(node => node.type === 'tab'), [schema]);
  const isMultiStep = rootTabs.length > 1 && rootTabs.length === schema.length;

  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const safeStepIndex = Math.min(activeStepIndex, Math.max(rootTabs.length - 1, 0));

  const [internalErrors, setInternalErrors] = useState<Record<string, string>>({});
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupIssues, setPopupIssues] = useState<ValidationIssue[]>([]);
  const [highlightedField, setHighlightedField] = useState<string | null>(null);

  const fieldRefsRef = useRef<Record<string, any>>({});
  const pendingFocusFieldRef = useRef<string | null>(null);
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const registerFieldRef = (name: string, node: any) => {
    fieldRefsRef.current[name] = node;
  };

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
    };
  }, []);

  // Runs after navigating to a different step from the validation popup — the target
  // field only mounts once that step's content renders, so this waits a tick for it.
  useEffect(() => {
    const name = pendingFocusFieldRef.current;
    if (!name) return;
    pendingFocusFieldRef.current = null;

    const timer = setTimeout(() => {
      setHighlightedField(name);
      if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
      highlightTimeoutRef.current = setTimeout(() => setHighlightedField(null), 1600);

      const node = fieldRefsRef.current[name];
      if (node?.scrollIntoView) node.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (node?.focus) node.focus();
    }, 50);

    return () => clearTimeout(timer);
  }, [safeStepIndex]);

  const handlePrevious = () => {
    setActiveStepIndex(i => Math.max(0, i - 1));
  };

  const handleContinue = () => {
    const currentTab = rootTabs[safeStepIndex];
    if (!currentTab) return;

    const { errors: stepErrors, issues: stepIssues, visited } = collectValidationForRoots(
      [currentTab],
      schema,
      values,
      optionsMap,
      t,
    );

    setInternalErrors(prev => {
      const next = { ...prev };
      visited.forEach(name => delete next[name]);
      return { ...next, ...stepErrors };
    });

    if (stepIssues.length === 0) {
      setActiveStepIndex(i => Math.min(i + 1, rootTabs.length - 1));
    } else {
      setPopupIssues(stepIssues);
      setIsPopupOpen(true);
    }
  };

  const handleSubmit = () => {
    const { errors: allErrors, issues: allIssues, visited } = collectValidationForRoots(
      schema,
      schema,
      values,
      optionsMap,
      t,
    );

    setInternalErrors(prev => {
      const next = { ...prev };
      visited.forEach(name => delete next[name]);
      return { ...next, ...allErrors };
    });

    if (allIssues.length === 0) {
      onSubmit?.(values);
    } else {
      setPopupIssues(allIssues);
      setIsPopupOpen(true);
    }
  };

  const handleSaveDraft = () => {
    onSaveDraft?.(values);
  };

  const handleSelectIssue = (issue: ValidationIssue) => {
    setIsPopupOpen(false);

    if (issue.rootTabIndex !== undefined && issue.rootTabIndex !== safeStepIndex) {
      // Defer scroll/focus/highlight until the new step's fields mount (see effect above).
      pendingFocusFieldRef.current = issue.fieldName;
      setActiveStepIndex(issue.rootTabIndex);
      return;
    }

    setHighlightedField(issue.fieldName);
    if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
    highlightTimeoutRef.current = setTimeout(() => setHighlightedField(null), 1600);

    setTimeout(() => {
      const node = fieldRefsRef.current[issue.fieldName];
      if (node?.scrollIntoView) node.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (node?.focus) node.focus();
    }, 50);
  };

  const baseCtx: NodeRenderContext = {
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
  };

  if (isMultiStep) {
    const activeTab = rootTabs[safeStepIndex];
    const stepCtx: NodeRenderContext = {
      ...baseCtx,
      errors: { ...errors, ...internalErrors },
      registerFieldRef,
      highlightedField,
    };

    return (
      <VStack space="md" width="100%">
        <StepHeader tabs={rootTabs} activeStepIndex={safeStepIndex} t={t} />

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
        />

        <ValidationPopup
          isOpen={isPopupOpen}
          onClose={() => setIsPopupOpen(false)}
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
    const renderedRows = useMemo(() => {
      return rows?.map((row: any, index: number) => {
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
            return field.fields;
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
    }, [rows, values, optionsMap, mode, rest]);

    return <>{renderedRows}</>;
  },
);

interface FieldType {
  field: FormField;
  t: (key: string, fallback?: string) => string;
  isMultiField?: boolean;
  values?: Record<string, string>;
  errors?: Record<string, string>;
  optionsMap?: OptionsMap;
  mode?: string;
  onFieldChange?: () => void;
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

// ─── View Field (read-only display of another field's label/value) ───────────

interface ViewFieldDisplayProps {
  field: FormField;
  values: Record<string, string>;
  optionsMap: OptionsMap;
  t: (key: string, fallback?: string) => string;
  isMultiField?: boolean;
  fieldsByName: Record<string, FormField>;
}

const ViewFieldDisplay: React.FC<ViewFieldDisplayProps> = ({
  field,
  values,
  optionsMap,
  t,
  isMultiField,
  fieldsByName,
}) => {
  const targetField = field.name ? fieldsByName[field.name] : undefined;

  const label = targetField?.label
    ? t(`admin.users.createUser.${targetField.label.key}`, targetField.label.fallback)
    : field.name ?? '-';

  let rawValue = field.name ? values[field.name] : undefined;
  if (!rawValue && targetField?.defaultValue) {
    rawValue = targetField.defaultValue;
  }

  let displayValue: string = rawValue || '-';
  if (targetField?.optionsSource) {
    const option = optionsMap[targetField.optionsSource]?.find(o => o.value === rawValue);
    displayValue = option?.label || rawValue || '-';
  }
  displayValue = displayValue.replace(/_/g, '-');

  return (
    <VStack
      space="xs"
      flex={isMultiField ? 1 : undefined}
      width={!isMultiField ? '100%' : undefined}
    >
      <Text {...TYPOGRAPHY.caption} color="$textMutedForeground">
        {label}
      </Text>
      <Text {...TYPOGRAPHY.bodySmall} color="$textForeground">
        {displayValue}
      </Text>
    </VStack>
  );
};

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

      let displayValue = value || '-';

      if (field.optionsSource) {
        const option = optionsMap[field.optionsSource]?.find(
          o => o.value === value,
        );

        displayValue = option?.label || value || '-';
      }

      displayValue =
        typeof displayValue === 'string'
          ? displayValue.replace(/_/g, '-')
          : String(displayValue);

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
      >
        {field.type !== FORM_FIELD_TYPES.NOTE && (
          <Text
            {...TYPOGRAPHY.caption}
            color="$textForeground"
            fontWeight="$bold"
          >
            {t(
              `admin.users.createUser.${field.label.key}`,
              field.label.fallback,
            )}
            {field.required && ' *'}
          </Text>
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
        />

        {error && (
          <Text color="$error600" fontSize="$xs">
            {error}
          </Text>
        )}
      </VStack>
    );
  },
);
