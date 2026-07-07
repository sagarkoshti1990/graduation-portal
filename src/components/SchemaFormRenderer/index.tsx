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
 *     flags={flags}
 *     disabled={isSubmitting}
 *     isMobile={isMobile}
 *     t={t}
 *     firstNameRef={firstNameRef}
 *   />
 */

import React, { useEffect, useRef, useState } from 'react';
import { VStack, HStack, Text, Box, Input, InputField, Pressable, Textarea, TextareaInput } from '@ui';
import { LucideIcon } from '@ui/index';
import Select from '@components/ui/Inputs/Select';
import DatePicker from '@components/ui/Inputs/DatePicker';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';
import { styles } from '../../screens/UserManagement/Styles';
import type { FormSection, FormField, ValidationRule } from '@constants/CREATE_USER_FORM_SCHEMA';

// ─── Local FastInputField ─────────────────────────────────────────────────────
// Inlined here to avoid a circular import from the parent screen module.
// Prevents cursor-jumping during fast typing on heavy screens by buffering
// local state while the parent's state update is in flight.
export const FastInputField = React.forwardRef(({ value, defaultValue, onChangeText, ...props }: any, ref: any) => {
  const initialValue = value !== undefined ? value : (defaultValue || '');
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
    timeoutRef.current = setTimeout(() => { isTyping.current = false; }, 500);
    if (onChangeText) onChangeText(text);
  };

  return <InputField ref={ref} {...props} value={localValue} onChangeText={handleChange} />;
});
FastInputField.displayName = 'SFR_FastInputField';


// ─── Local FastTextareaInput ──────────────────────────────────────────────────
const FastTextareaInput = React.forwardRef(({ value, defaultValue, onChangeText, ...props }: any, ref: any) => {
  const initialValue = value !== undefined ? value : (defaultValue || '');
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
    timeoutRef.current = setTimeout(() => { isTyping.current = false; }, 500);
    if (onChangeText) onChangeText(text);
  };

  return <TextareaInput ref={ref} {...props} value={localValue} onChangeText={handleChange} />;
});
FastTextareaInput.displayName = 'SFR_FastTextareaInput';


// ─── Types ────────────────────────────────────────────────────────────────────

export type OptionsMap = Record<string, { value: string; label: string }[]>;
export type FlagsMap = Record<string, boolean>;

export interface SchemaFormRendererProps {
  schema: FormSection[];
  /** Current field values keyed by field name */
  values: Record<string, string>;
  /** Current field errors keyed by field name */
  errors: Record<string, string>;
  /** Called when any field value changes */
  onFieldChange: (name: string, value: string) => void;
  /** Resolved options for every optionsSource key referenced in the schema */
  optionsMap: OptionsMap;
  /** Runtime boolean flags referenced by visibleWhen.flag */
  flags: FlagsMap;
  /** Global disabled state (e.g. while form is submitting) */
  disabled?: boolean;
  /** Layout flag — stacks fields vertically on mobile */
  isMobile?: boolean;
  /** Translation function */
  t: (key: string, fallback?: string) => string;
  /** Optional ref forwarded to the first autoFocus field */
  firstNameRef?: React.RefObject<any>;
}

// ─── Validation Engine ────────────────────────────────────────────────────────

/**
 * Runs all validation rules for a single field against the current values.
 * Returns the first error message found, or undefined if the field is valid.
 */
function validateField(
  field: FormField,
  values: Record<string, string>,
  flags: FlagsMap
): string | undefined {
  // Skip invisible fields entirely
  if (field.visibleWhen?.flag && !flags[field.visibleWhen.flag]) {
    return undefined;
  }

  const raw = values[field.name] ?? '';
  const val = raw.trim();

  if (!field.validation?.length) return undefined;

  for (const rule of field.validation) {
    const err = applyRule(rule, val, values);
    if (err) return err;
  }

  return undefined;
}

function applyRule(
  rule: ValidationRule,
  val: string,
  allValues: Record<string, string>
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
  flags: FlagsMap
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const section of schema) {
    for (const row of section.rows) {
      // Skip hidden rows
      if (row.visibleWhen?.flag && !flags[row.visibleWhen.flag]) continue;

      for (const field of row.fields) {
        const err = validateField(field, values, flags);
        if (err) errors[field.name] = err;
      }
    }
  }

  return errors;
}

// ─── Field Renderers ──────────────────────────────────────────────────────────

interface FieldRendererProps {
  field: FormField;
  value: string;
  error?: string;
  onChange: (name: string, value: string) => void;
  disabled: boolean;
  optionsMap: OptionsMap;
  flags: FlagsMap;
  values: Record<string, string>;
  t: (key: string, fallback?: string) => string;
  /** Shared visibility state for password toggle groups */
  visibilityGroups: Record<string, boolean>;
  toggleVisibilityGroup: (group: string) => void;
  /** Forwarded ref for the first autoFocus field */
  autoFocusRef?: React.RefObject<any>;
}

const FieldRenderer: React.FC<FieldRendererProps> = ({
  field,
  value,
  error,
  onChange,
  disabled,
  optionsMap,
  flags,
  values,
  t,
  visibilityGroups,
  toggleVisibilityGroup,
  autoFocusRef,
}) => {
  const placeholder = field.placeholder?.fallback ?? '';

  // ── Select ──────────────────────────────────────────────────────────────────
  if (field.type === 'select') {
    const rawOptions = field.optionsSource ? (optionsMap[field.optionsSource] ?? []) : [];
    const options = rawOptions.map(o => ({ value: o.value, label: o.label }));

    // Compute disabled-when condition
    let isDisabled = disabled;
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
      <Box zIndex={field.zIndex}>
        <Select
          {...styles.createUserFormSelect}
          options={options}
          value={value}
          onChange={(val: string) => onChange(field.name, val)}
          placeholder={activePlaceholder}
          disabled={isDisabled}
          searchable={field.searchable ?? false}
        />
      </Box>
    );
  }

  // ── Date ────────────────────────────────────────────────────────────────────
  if (field.type === 'date') {
    // Internal display value: stored as YYYY_MM_DD, displayed as YYYY-MM-DD
    const displayValue = value ? value.replace(/_/g, '-') : '';

    return (
      <Box zIndex={field.zIndex ?? 999}>
        <DatePicker
          {...styles.createUserFormInput}
          placeholder={placeholder || 'YYYY-MM-DD'}
          value={displayValue}
          onChange={(date: string) => onChange(field.name, date.replace(/-/g, '_'))}
          maximumDate={
            field.validation?.some(r => r.rule === 'dateNotInFuture') ? new Date() : undefined
          }
          iconSize={20}
        />
      </Box>
    );
  }

  // ── Password ─────────────────────────────────────────────────────────────────
  if (field.type === 'password') {
    const group = field.visibilityToggleGroup ?? field.name;
    const isVisible = visibilityGroups[group] ?? false;

    return (
      <Box position="relative">
        <Input
          {...styles.createUserFormInput}
          isInvalid={!!error}
          isDisabled={disabled}
        >
          <FastInputField
            placeholder={placeholder}
            value={value}
            onChangeText={(text: string) => onChange(field.name, text)}
            secureTextEntry={!isVisible}
            pr="$12"
          />
        </Input>
        {field.toggleVisibility && (
          <Pressable
            onPress={() => toggleVisibilityGroup(group)}
            disabled={disabled}
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
  if (field.type === 'textarea') {
    const keyboardType = (field.inputProps?.keyboardType as any) ?? 'default';
    const autoCapitalize = (field.inputProps?.autoCapitalize as any) ?? 'sentences';
    const maxLength = field.inputProps?.maxLength;

    return (
      <Textarea
        {...styles.createUserFormInput}
        isInvalid={!!error}
        isDisabled={disabled}
      >
        <FastTextareaInput
          ref={field.autoFocus ? autoFocusRef : undefined}
          placeholder={placeholder}
          value={value}
          onChangeText={(text: string) => onChange(field.name, text)}
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
  const autoCapitalize = (field.inputProps?.autoCapitalize as any) ?? 'sentences';
  const maxLength = field.inputProps?.maxLength;

  return (
    <Input
      {...styles.createUserFormInput}
      isInvalid={!!error}
      isDisabled={disabled}
      alignItems={field.icon ? 'center' : undefined}
    >
      {field.icon && (
        <Box pr="$2">
          <LucideIcon name={field.icon as any} size={16} color="$textMutedForeground" />
        </Box>
      )}
      <FastInputField
        ref={field.autoFocus ? autoFocusRef : undefined}
        placeholder={placeholder}
        value={value}
        onChangeText={(text: string) => onChange(field.name, text)}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        maxLength={maxLength}
      />
    </Input>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const SchemaFormRenderer: React.FC<SchemaFormRendererProps> = ({
  schema,
  values,
  errors,
  onFieldChange,
  optionsMap,
  flags,
  disabled = false,
  isMobile = false,
  t,
  firstNameRef,
}) => {
  // Track password visibility per group
  const [visibilityGroups, setVisibilityGroups] = useState<Record<string, boolean>>({});

  const toggleVisibilityGroup = (group: string) => {
    setVisibilityGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  return (
    <VStack space="md" width="100%">
      {schema.map(section => (
        <VStack key={section.id} space="sm">
          {/* Section header */}
          <HStack space="xs" alignItems="center">
            <LucideIcon name={section.icon as any} size={16} color="$textMutedForeground" />
            <Text {...TYPOGRAPHY.bodySmall} color="$textMutedForeground" fontWeight="$normal">
              {t(`admin.users.createUser.${section.title.key}`, section.title.fallback)}
            </Text>
          </HStack>

          {/* Section rows */}
          {section.rows.map((row, rowIdx) => {
            // Row-level visibility
            if (row.visibleWhen?.flag && !flags[row.visibleWhen.flag]) {
              return null;
            }
            // Check if this row has primary phone or alternative phone fields
            const hasPrimary = row.fields.some(f => f.name === 'countryCode');
            const hasAlt = row.fields.some(f => f.name === 'alternativePhoneCode');

            if (hasPrimary || hasAlt) {
              const renderPhoneWidget = (
                codeFieldName: string,
                phoneFieldName: string,
                flexValue: number | undefined
              ) => {
                const codeField = row.fields.find(f => f.name === codeFieldName);
                const phoneField = row.fields.find(f => f.name === phoneFieldName);

                if (!codeField || !phoneField) return null;

                const codeValue = values[codeFieldName] ?? '';
                const phoneValue = values[phoneFieldName] ?? '';

                const codeError = errors[codeFieldName];
                const phoneError = errors[phoneFieldName];
                const combinedError = phoneError || codeError;

                const rawOptions = codeField.optionsSource ? (optionsMap[codeField.optionsSource] ?? []) : [];
                const options = rawOptions.map(o => ({ value: o.value, label: o.label }));

                return (
                  <VStack key={phoneFieldName} space="xs" flex={flexValue} width={flexValue ? undefined : '100%'}>
                    {/* Field label */}
                    <Text {...TYPOGRAPHY.caption} color="$textForeground" fontWeight="$bold">
                      {t(`admin.users.createUser.${phoneField.label.key}`, phoneField.label.fallback)}
                      {phoneField.required ? ' *' : ''}
                    </Text>

                    {/* Side-by-side Select and Input Group */}
                    <HStack space="xs" alignItems="center" width="100%">
                      {/* Country Code Select */}
                      <Box width={95} zIndex={1000}>
                        <Select
                          {...styles.createUserFormSelect}
                          options={options}
                          value={codeValue}
                          onChange={(val: string) => onFieldChange(codeFieldName, val)}
                          placeholder={codeField.placeholder?.fallback ?? '+27'}
                          disabled={disabled}
                          searchable={true}
                        />
                      </Box>

                      {/* Phone Number Input */}
                      <Input
                        {...styles.createUserFormInput}
                        isInvalid={!!combinedError}
                        isDisabled={disabled}
                        flex={1}
                      >
                        <FastInputField
                          placeholder={phoneField.placeholder?.fallback ?? '000 000 000'}
                          value={phoneValue}
                          onChangeText={(text: string) => onFieldChange(phoneFieldName, text)}
                          keyboardType={phoneField.inputProps?.keyboardType ?? 'phone-pad'}
                          maxLength={phoneField.inputProps?.maxLength ?? 10}
                        />
                      </Input>
                    </HStack>

                    {/* Combined Error message */}
                    {combinedError ? (
                      <Text color="$error600" fontSize="$xs">
                        {combinedError}
                      </Text>
                    ) : null}
                  </VStack>
                );
              };

              const widgets = [];
              if (hasPrimary) {
                widgets.push({ code: 'countryCode', phone: 'phoneNumber' });
              }
              if (hasAlt) {
                widgets.push({ code: 'alternativePhoneCode', phone: 'alternativePhone' });
              }

              const isMultiWidget = widgets.length > 1;

              return (
                <HStack
                  key={rowIdx}
                  space="md"
                  flexDirection={isMobile || !isMultiWidget ? 'column' : 'row'}
                  width="100%"
                >
                  {widgets.map(w => renderPhoneWidget(w.code, w.phone, isMultiWidget ? 1 : undefined))}
                </HStack>
              );
            }

            // Determine which fields in this row are visible
            const visibleFields = row.fields.filter(
              f => !f.visibleWhen?.flag || flags[f.visibleWhen.flag]
            );

            if (visibleFields.length === 0) return null;

            const isMultiField = visibleFields.length > 1;

            return (
              <HStack
                key={rowIdx}
                space="md"
                flexDirection={isMobile || !isMultiField ? 'column' : 'row'}
              >
                {visibleFields.map(field => {
                  const fieldValue = values[field.name] ?? '';
                  const fieldError = errors[field.name];

                  return (
                    <VStack key={field.name} space="xs" flex={isMultiField ? 1 : undefined} width={!isMultiField ? '100%' : undefined}>
                      {/* Field label */}
                      <Text {...TYPOGRAPHY.caption} color="$textForeground" fontWeight="$bold">
                        {t(`admin.users.createUser.${field.label.key}`, field.label.fallback)}
                        {field.required ? ' *' : ''}
                      </Text>

                      {/* Field input */}
                      <FieldRenderer
                        field={field}
                        value={fieldValue}
                        error={fieldError}
                        onChange={onFieldChange}
                        disabled={disabled}
                        optionsMap={optionsMap}
                        flags={flags}
                        values={values}
                        t={t}
                        visibilityGroups={visibilityGroups}
                        toggleVisibilityGroup={toggleVisibilityGroup}
                        autoFocusRef={firstNameRef}
                      />

                      {/* Field error */}
                      {fieldError ? (
                        <Text color="$error600" fontSize="$xs">
                          {fieldError}
                        </Text>
                      ) : null}
                    </VStack>
                  );
                })}
              </HStack>
            );
          })}
        </VStack>
      ))}
    </VStack>
  );
};

export default SchemaFormRenderer;
