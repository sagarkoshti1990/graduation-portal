export type PasswordValidationRuleKey =
  | 'minLength'
  | 'uppercase'
  | 'lowercase'
  | 'number'
  | 'specialCharacter'
  | 'noSpaces';

export interface PasswordValidationLabels {
  minLength: string;
  uppercase: string;
  lowercase: string;
  number: string;
  specialCharacter: string;
  noSpaces: string;
}

export interface PasswordValidationItem {
  key: PasswordValidationRuleKey;
  label: string;
  isValid: boolean;
}

const ALLOWED_SPECIAL_CHARACTER_REGEX = /[@$!%*?&]/;
const DISALLOWED_SPECIAL_CHARACTER_REGEX = /[^A-Za-z0-9@$!%*?&]/;

const PASSWORD_VALIDATORS: Record<PasswordValidationRuleKey, (password: string) => boolean> = {
  minLength: password => password.length >= 8,
  uppercase: password => /[A-Z]/.test(password),
  lowercase: password => /[a-z]/.test(password),
  number: password => /[0-9]/.test(password),
  specialCharacter: password =>
    ALLOWED_SPECIAL_CHARACTER_REGEX.test(password) &&
    !DISALLOWED_SPECIAL_CHARACTER_REGEX.test(password),
  noSpaces: password => /^\S+$/.test(password),
};

const PASSWORD_VALIDATION_RULE_ORDER: PasswordValidationRuleKey[] = [
  'minLength',
  'uppercase',
  'lowercase',
  'number',
  'specialCharacter',
  'noSpaces',
];

export const getPasswordValidationItems = (
  password: string,
  labels: PasswordValidationLabels
): PasswordValidationItem[] =>
  PASSWORD_VALIDATION_RULE_ORDER.map(key => ({
    key,
    label: labels[key],
    isValid: PASSWORD_VALIDATORS[key](password),
  }));

export const isPasswordValid = (password: string) =>
  !!password.trim() && PASSWORD_VALIDATION_RULE_ORDER.every(key => PASSWORD_VALIDATORS[key](password));
