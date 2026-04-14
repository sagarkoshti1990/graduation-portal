import React, { useEffect, useMemo, useState } from 'react';
import { resetToScreen } from '@utils/navigationRef';
import { useAlert } from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import {
  resendResetOtp,
  sendResetOtp,
  verifyResetOtp,
} from '../../../services/authenticationService';
import PasswordResetForm from './PasswordResetForm';
import OtpVerification from './OtpVerification';

type ForgotPasswordStep = 'FORM' | 'OTP';

const OTP_TIMER_SECONDS = 60;

const hasUppercase = /[A-Z]/;
const hasLowercase = /[a-z]/;
const hasNumber = /\d/;
const hasSpecialCharacter = /[^A-Za-z0-9]/;
const hasWhitespace = /\s/;

const validatePassword = (password: string, message: string) => {
  if (!password.trim()) {
    return message;
  }

  if (
    password.length < 8 ||
    !hasUppercase.test(password) ||
    !hasLowercase.test(password) ||
    !hasNumber.test(password) ||
    !hasSpecialCharacter.test(password) ||
    hasWhitespace.test(password)
  ) {
    return message;
  }

  return '';
};

const ForgotPasswordContainer: React.FC = () => {
  const { t } = useLanguage();
  const { showAlert } = useAlert();
  const [step, setStep] = useState<ForgotPasswordStep>('FORM');
  const [identifier, setIdentifier] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpValues, setOtpValues] = useState<string[]>(Array(6).fill(''));
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [timer, setTimer] = useState(0);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);

  useEffect(() => {
    if (step !== 'OTP' || timer <= 0) {
      return undefined;
    }

    const interval = setInterval(() => {
      setTimer(currentTimer => {
        if (currentTimer <= 1) {
          clearInterval(interval);
          return 0;
        }

        return currentTimer - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [step, timer]);

  const formErrors = useMemo(() => {
    const errors = {
      identifier: '',
      newPassword: '',
      confirmPassword: '',
    };

    if (!identifier.trim() && submitAttempted) {
      errors.identifier = t('forgotPassword.identifierRequired');
    }

    errors.newPassword = validatePassword(
      newPassword,
      t('forgotPassword.passwordValidation')
    );

    if (!newPassword.trim() && !submitAttempted) {
      errors.newPassword = '';
    }

    if (!confirmPassword.trim()) {
      if (submitAttempted) {
        errors.confirmPassword = t('forgotPassword.confirmPasswordRequired');
      }
    } else if (confirmPassword !== newPassword) {
      errors.confirmPassword = t('forgotPassword.passwordMismatch');
    }

    return errors;
  }, [confirmPassword, identifier, newPassword, submitAttempted, t]);

  const isFormValid = useMemo(() => {
    return (
      !!identifier.trim() &&
      !!newPassword &&
      !!confirmPassword &&
      !formErrors.identifier &&
      !formErrors.newPassword &&
      !formErrors.confirmPassword
    );
  }, [confirmPassword, formErrors, identifier, newPassword]);

  const otp = useMemo(() => otpValues.join(''), [otpValues]);

  const handleBackToLogin = () => {
    resetToScreen('login');
  };

  const handleSendOtp = async () => {
    setSubmitAttempted(true);
    setSubmitError('');

    if (!isFormValid) {
      return;
    }

    setIsSendingOtp(true);

    try {
      await sendResetOtp(identifier.trim(), newPassword);
      setOtpValues(Array(6).fill(''));
      setStep('OTP');
      setTimer(OTP_TIMER_SECONDS);
      setSubmitError('');
    } catch (error: any) {
      setSubmitError(error?.message || t('forgotPassword.sendOtpError'));
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (timer > 0) {
      return;
    }

    setSubmitError('');
    setIsResendingOtp(true);

    try {
      await resendResetOtp(identifier.trim(), newPassword);
      setOtpValues(Array(6).fill(''));
      setTimer(OTP_TIMER_SECONDS);
    } catch (error: any) {
      setSubmitError(error?.message || t('forgotPassword.resendOtpError'));
    } finally {
      setIsResendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    setSubmitError('');

    if (otp.length !== 6) {
      setSubmitError(t('forgotPassword.invalidOtpLength'));
      return;
    }

    setIsVerifyingOtp(true);

    try {
      await verifyResetOtp(identifier.trim(), otp, newPassword);
      showAlert('success', t('forgotPassword.passwordResetSuccess'));
      resetToScreen('login');
    } catch (error: any) {
      setSubmitError(error?.message || t('forgotPassword.verifyOtpError'));
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleOtpBack = () => {
    setStep('FORM');
    setSubmitError('');
    setOtpValues(Array(6).fill(''));
  };

  return step === 'FORM' ? (
    <PasswordResetForm
      identifier={identifier}
      newPassword={newPassword}
      confirmPassword={confirmPassword}
      identifierError={formErrors.identifier}
      newPasswordError={formErrors.newPassword}
      confirmPasswordError={formErrors.confirmPassword}
      submitError={submitError}
      isSubmitting={isSendingOtp}
      isSubmitDisabled={!isFormValid || isSendingOtp}
      showNewPassword={showNewPassword}
      showConfirmPassword={showConfirmPassword}
      onIdentifierChange={value => {
        setIdentifier(value);
        setSubmitError('');
      }}
      onNewPasswordChange={value => {
        setNewPassword(value);
        setSubmitError('');
      }}
      onConfirmPasswordChange={value => {
        setConfirmPassword(value);
        setSubmitError('');
      }}
      onToggleNewPassword={() => setShowNewPassword(current => !current)}
      onToggleConfirmPassword={() => setShowConfirmPassword(current => !current)}
      onSubmit={handleSendOtp}
      onBackToLogin={handleBackToLogin}
      title={t('forgotPassword.title')}
      description={t('forgotPassword.description')}
      identifierLabel={t('forgotPassword.identifierLabel')}
      identifierPlaceholder={t('forgotPassword.identifierPlaceholder')}
      newPasswordLabel={t('forgotPassword.newPassword')}
      confirmPasswordLabel={t('forgotPassword.confirmPassword')}
      passwordPlaceholder={t('forgotPassword.passwordPlaceholder')}
      confirmPasswordPlaceholder={t('forgotPassword.confirmPasswordPlaceholder')}
      passwordRulesText={t('forgotPassword.passwordRules')}
      sendOtpText={t('forgotPassword.sendOtp')}
      backToLoginText={t('forgotPassword.backToLogin')}
    />
  ) : (
    <OtpVerification
      otpValues={otpValues}
      timer={timer}
      isVerifying={isVerifyingOtp}
      isResending={isResendingOtp}
      submitError={submitError}
      isVerifyDisabled={otp.length !== 6 || isVerifyingOtp}
      canResend={timer === 0}
      onOtpChange={value => {
        setOtpValues(value.map(digit => digit.replace(/\D/g, '').slice(0, 1)));
        setSubmitError('');
      }}
      onVerify={handleVerifyOtp}
      onResend={handleResendOtp}
      onBack={handleOtpBack}
      title={t('forgotPassword.otpTitle')}
      description={t('forgotPassword.otpDescription', {
        identifier: identifier.trim(),
      })}
      helperText={t('forgotPassword.otpHelperText')}
      resendPrompt={t('forgotPassword.resendPrompt')}
      resendText={t('forgotPassword.resendOtp')}
      resendAvailableText={t('forgotPassword.resendAvailable')}
      resendCountdownText={t('forgotPassword.otpExpiresIn')}
      verifyText={t('forgotPassword.verifyOtp')}
      backText={t('common.back')}
    />
  );
};

export default ForgotPasswordContainer;
