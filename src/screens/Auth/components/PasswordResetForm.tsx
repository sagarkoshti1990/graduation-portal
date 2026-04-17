import React from 'react';
import {
  Button,
  ButtonText,
  Input,
  InputField,
  Spinner,
  Text,
  VStack,
} from '@ui';
import { loginStyles } from '../Styles';
import AuthErrorMessage from './AuthErrorMessage';
import PasswordInputField from './PasswordInputField';

interface PasswordResetFormProps {
  identifier: string;
  newPassword: string;
  confirmPassword: string;
  identifierError?: string;
  newPasswordError?: string;
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
  title: string;
  description: string;
  identifierLabel: string;
  identifierPlaceholder: string;
  newPasswordLabel: string;
  confirmPasswordLabel: string;
  passwordPlaceholder: string;
  confirmPasswordPlaceholder: string;
  passwordRulesText: string;
  sendOtpText: string;
  backToLoginText: string;
}

const PasswordResetForm: React.FC<PasswordResetFormProps> = ({
  identifier,
  newPassword,
  confirmPassword,
  identifierError,
  newPasswordError,
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
  passwordRulesText,
  sendOtpText,
  backToLoginText,
}) => {
  return (
    <VStack {...loginStyles.vstack} width="$full">
      <VStack {...loginStyles.vstack2} width="$full">
        <Text {...loginStyles.text2}>{title}</Text>
        <Text {...loginStyles.text3}>{description}</Text>
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
        error={newPasswordError}
        isDisabled={isSubmitting}
        returnKeyType="next"
        onChangeText={onNewPasswordChange}
        onToggleVisibility={onToggleNewPassword}
      />

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

      <Text {...loginStyles.text6}>{passwordRulesText}</Text>

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
