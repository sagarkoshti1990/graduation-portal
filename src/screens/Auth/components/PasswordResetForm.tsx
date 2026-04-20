import React from 'react';
import {
  Button,
  ButtonText,
  Heading,
  Input,
  InputField,
  Spinner,
  Text,
  VStack,
} from '@ui';
import { loginStyles } from '../Styles';
import AuthErrorMessage from './AuthErrorMessage';
import PasswordInputField from './PasswordInputField';
import PasswordValidationList from './PasswordValidationList';
import { PasswordValidationLabels } from './passwordValidation';

interface PasswordResetFormProps {
  identifier: string;
  newPassword: string;
  confirmPassword: string;
  identifierError?: string;
  confirmPasswordError?: string;
  submitError?: string;
  isSubmitting?: boolean;
  isSubmitDisabled?: boolean;
  showNewPassword: boolean;
  showConfirmPassword: boolean;
  onIdentifierChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onToggleNewPassword: () => void;
  onToggleConfirmPassword: () => void;
  onSubmit: () => void;
  onBackToLogin: () => void;
  title?: string;
  description?: string;
  identifierLabel: string;
  identifierPlaceholder: string;
  newPasswordLabel: string;
  confirmPasswordLabel: string;
  passwordPlaceholder: string;
  confirmPasswordPlaceholder: string;
  passwordRuleLabels: PasswordValidationLabels;
  sendOtpText: string;
  backToLoginText: string;
}

const PasswordResetForm: React.FC<PasswordResetFormProps> = ({
  identifier,
  newPassword,
  confirmPassword,
  identifierError,
  confirmPasswordError,
  submitError,
  isSubmitting = false,
  isSubmitDisabled = false,
  showNewPassword,
  showConfirmPassword,
  onIdentifierChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onToggleNewPassword,
  onToggleConfirmPassword,
  onSubmit,
  onBackToLogin,
  title,
  description,
  identifierLabel,
  identifierPlaceholder,
  newPasswordLabel,
  confirmPasswordLabel,
  passwordPlaceholder,
  confirmPasswordPlaceholder,
  passwordRuleLabels,
  sendOtpText,
  backToLoginText,
}) => {
  return (
    <VStack {...loginStyles.vstack} width="$full">
      <VStack {...loginStyles.vstack2} width="$full">
        {title && <Heading {...loginStyles.heading}>{title}</Heading>}
        {description && <Text {...loginStyles.text3}>{description}</Text>}
      </VStack>

      <VStack {...loginStyles.vstack3}>
        <Text {...loginStyles.text4}>{identifierLabel}</Text>
        <Input isDisabled={isSubmitting} isInvalid={!!identifierError}>
          <InputField
            placeholder={identifierPlaceholder}
            value={identifier}
            onChangeText={onIdentifierChange}
            autoCapitalize="none"
            returnKeyType="next"
          />
        </Input>
        <AuthErrorMessage message={identifierError} />
      </VStack>

      <PasswordInputField
        label={newPasswordLabel}
        placeholder={passwordPlaceholder}
        value={newPassword}
        showPassword={showNewPassword}
        isDisabled={isSubmitting}
        returnKeyType="next"
        onChangeText={onNewPasswordChange}
        onToggleVisibility={onToggleNewPassword}
      />

      <PasswordValidationList password={newPassword} labels={passwordRuleLabels} />


      <PasswordInputField
        label={confirmPasswordLabel}
        placeholder={confirmPasswordPlaceholder}
        value={confirmPassword}
        showPassword={showConfirmPassword}
        error={confirmPasswordError}
        isDisabled={isSubmitting}
        returnKeyType="done"
        onChangeText={onConfirmPasswordChange}
        onToggleVisibility={onToggleConfirmPassword}
        onSubmitEditing={onSubmit}
      />

      <AuthErrorMessage message={submitError} boxed />

      <Button
        {...loginStyles.button}
        onPress={onSubmit}
        isDisabled={isSubmitDisabled}
      >
        {isSubmitting ? (
          <Spinner color="$white" />
        ) : (
          <ButtonText {...loginStyles.buttonText}>{sendOtpText}</ButtonText>
        )}
      </Button>

      <Button variant="link" onPress={onBackToLogin} isDisabled={isSubmitting}>
        <ButtonText {...loginStyles.adminLinkText}>{backToLoginText}</ButtonText>
      </Button>
    </VStack>
  );
};

export default PasswordResetForm;
