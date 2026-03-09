// Validation utilities for forms and data

export const validators = {
  required: (value: unknown): string | undefined => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return 'This field is required';
    }
    return undefined;
  },

  minLength:
    (min: number) =>
    (value: string): string | undefined => {
      if (value && value.length < min) {
        return `Minimum length is ${min} characters`;
      }
      return undefined;
    },

  maxLength:
    (max: number) =>
    (value: string): string | undefined => {
      if (value && value.length > max) {
        return `Maximum length is ${max} characters`;
      }
      return undefined;
    },

  email: (value: string): string | undefined => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value && !emailRegex.test(value)) {
      return 'Invalid email address';
    }
    return undefined;
  },

  fileSize:
    (maxSizeMB: number) =>
    (file: File): string | undefined => {
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      if (file && file.size > maxSizeBytes) {
        return `File size must be less than ${maxSizeMB}MB`;
      }
      return undefined;
    },

  fileType:
    (allowedTypes: string[]) =>
    (file: File): string | undefined => {
      if (file && !allowedTypes.includes(file.type)) {
        return `File type must be one of: ${allowedTypes.join(', ')}`;
      }
      return undefined;
    },
};

// Validate a form object against a schema
export const validateForm = (
  data: Record<string, unknown>,
  schema: Record<string, unknown>,
): Record<string, string> => {
  const errors: Record<string, string> = {};

  Object.keys(schema).forEach(field => {
    const rules = schema[field];
    const value = data[field];

    type ValidatorFn = (v: unknown) => string | undefined;
    if (Array.isArray(rules)) {
      for (const rule of rules as ValidatorFn[]) {
        const error = rule(value);
        if (error) {
          errors[field] = error;
          break;
        }
      }
    } else if (typeof rules === 'function') {
      const error = (rules as ValidatorFn)(value);
      if (error) {
        errors[field] = error;
      }
    }
  });

  return errors;
};
