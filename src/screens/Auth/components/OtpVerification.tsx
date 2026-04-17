import React from 'react';
import {
  Button,
  ButtonText,
  Heading,
  HStack,
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
  canResend?: boolean;
  onOtpChange: (value: string[]) => void;
  onVerify: () => void;
  onResend: () => void;
  onBack: () => void;
  title: string;
  description?: string;
  helperText?: string;
  resendPrompt: string;
  resendText: string;
  resendAvailableText: string;
  resendCountdownText: string;
  verifyText: string;
  backText: string;
  otpLength: number;
}

const OtpVerification: React.FC<OtpVerificationProps> = ({
  otpValues,
  timer,
  isVerifying = false,
  isResending = false,
  submitError,
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
  otpLength,
}) => {
  return (
    <VStack {...loginStyles.vstack} width="$full">
      <VStack {...loginStyles.vstack2} width="$full">
        {title && <Heading {...loginStyles.heading}>{title}</Heading>}
        {description && <Text {...loginStyles.text2}>{description}</Text>}
      </VStack>

      <OtpCodeInput
        value={otpValues}
        onChange={onOtpChange}
        isDisabled={isVerifying || isResending}
        otpLength={otpLength}
      />

      {helperText && <Text {...loginStyles.text6}>{helperText}</Text>}
      <AuthErrorMessage message={submitError} boxed />

      <VStack {...loginStyles.vstack2} width="$full">
        <HStack {...loginStyles.hstack2}>
          <Text {...loginStyles.text8}>{resendPrompt}</Text>
          <Button
            variant="link"
            onPress={onResend}
            isDisabled={!canResend || isVerifying || isResending}
          >
            {isResending ? (
              <Spinner color="$primary500" />
            ) : (
              <ButtonText {...loginStyles.adminLinkText} color={canResend ? "$primary500" : "$textDark500"}>{resendText}</ButtonText>
            )}
          </Button>
        </HStack>
        <Text {...loginStyles.text6ForgotPassword}>
          {canResend
            ? resendAvailableText
            : resendCountdownText.replace('{{seconds}}', String(timer))}
        </Text>
      </VStack>

      <Button
        {...loginStyles.button}
        onPress={onVerify}
        isDisabled={otpValues.filter(value => value !== '').length !== otpLength || isVerifying || isResending}
      >
        {isVerifying ? (
          <Spinner color="$white" />
        ) : (
          <ButtonText {...loginStyles.buttonText}>{verifyText}</ButtonText>
        )}
      </Button>
      <Button variant="link" onPress={onBack} isDisabled={isVerifying || isResending}>
        <ButtonText {...loginStyles.adminLinkText}>{backText}</ButtonText>
      </Button>
    </VStack>
  );
};

export default OtpVerification;
