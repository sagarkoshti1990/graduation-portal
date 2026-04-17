import React from 'react';
import {
  Button,
  ButtonText,
  Spinner,
  Text,
  VStack,
} from '@ui';
import { loginStyles } from '../Styles';
import AuthErrorMessage from './AuthErrorMessage';
import OtpCodeInput from './OtpCodeInput';

interface OtpVerificationProps {
  otpValues: string[];
  timer: number;
  isVerifying?: boolean;
  isResending?: boolean;
  submitError?: string;
  isVerifyDisabled?: boolean;
  canResend?: boolean;
  onOtpChange: (value: string[]) => void;
  onVerify: () => void;
  onResend: () => void;
  onBack: () => void;
  title: string;
  description: string;
  helperText: string;
  resendPrompt: string;
  resendText: string;
  resendAvailableText: string;
  resendCountdownText: string;
  verifyText: string;
  backText: string;
}

const OtpVerification: React.FC<OtpVerificationProps> = ({
  otpValues,
  timer,
  isVerifying = false,
  isResending = false,
  submitError,
  isVerifyDisabled = false,
  canResend = false,
  onOtpChange,
  onVerify,
  onResend,
  onBack,
  title,
  description,
  helperText,
  resendPrompt,
  resendText,
  resendAvailableText,
  resendCountdownText,
  verifyText,
  backText,
}) => {
  return (
    <VStack {...loginStyles.vstack} width="$full">
      <VStack {...loginStyles.vstack2} width="$full">
        <Button variant="link" onPress={onBack} isDisabled={isVerifying || isResending}>
          <ButtonText {...loginStyles.adminLinkText}>{backText}</ButtonText>
        </Button>
        <Text {...loginStyles.text2}>{title}</Text>
        <Text {...loginStyles.text3}>{description}</Text>
      </VStack>

      <OtpCodeInput
        value={otpValues}
        onChange={onOtpChange}
        isDisabled={isVerifying || isResending}
      />

      <Text {...loginStyles.text6}>{helperText}</Text>
      <AuthErrorMessage message={submitError} boxed />

      <VStack {...loginStyles.vstack2} width="$full">
        <Text {...loginStyles.text3}>{resendPrompt}</Text>
        <Button
          variant="link"
          onPress={onResend}
          isDisabled={!canResend || isVerifying || isResending}
        >
          {isResending ? (
            <Spinner color="$primary500" />
          ) : (
            <ButtonText {...loginStyles.adminLinkText}>{resendText}</ButtonText>
          )}
        </Button>
        <Text {...loginStyles.text6}>
          {canResend
            ? resendAvailableText
            : resendCountdownText.replace('{{seconds}}', String(timer))}
        </Text>
      </VStack>

      <Button
        {...loginStyles.button}
        onPress={onVerify}
        isDisabled={isVerifyDisabled}
      >
        {isVerifying ? (
          <Spinner color="$white" />
        ) : (
          <ButtonText {...loginStyles.buttonText}>{verifyText}</ButtonText>
        )}
      </Button>
    </VStack>
  );
};

export default OtpVerification;
