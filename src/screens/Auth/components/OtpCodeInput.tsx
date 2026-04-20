import React, { useMemo, useRef,useEffect } from 'react';
import { Box, HStack, Input, InputField } from '@ui';

interface OtpCodeInputProps {
  value: string[];
  isDisabled?: boolean;
  onChange: (value: string[]) => void;
  otpLength: number;
}

const OtpCodeInput: React.FC<OtpCodeInputProps> = ({
  value,
  isDisabled = false,
  onChange,
  otpLength,
  }) => {
  const inputRefs = useRef<Array<any | null>>([]);
  const otpValues = useMemo(() => {
    return Array.from({ length: otpLength }, (_, index) => value[index] || '');
  }, [value,otpLength]);

  const focusInput = (index: number) => {
    inputRefs.current[index]?.focus?.();
  };

  useEffect(() => {
    if (otpLength > 1) {
      // Focus all except first, then focus first
      for (let i = 1; i < otpLength; i++) {
        focusInput(i);
      }
      focusInput(0);
    } else {
      focusInput(0);
    }
  }, [otpLength]);
  const updateOtpAtIndex = (index: number, rawValue: string) => {
    const sanitized = rawValue.replace(/\D/g, '');
    const nextValue = [...otpValues];

    if (!sanitized) {
      nextValue[index] = '';
      onChange(nextValue);
      return;
    }

    if (sanitized.length > 1) {
      for (let offset = 0; offset < sanitized.length; offset += 1) {
        const targetIndex = index + offset;

        if (targetIndex >= otpLength) {
          break;
        }

        nextValue[targetIndex] = sanitized[offset];
      }

      onChange(nextValue);
      focusInput(Math.min(index + sanitized.length, otpLength - 1));
      return;
    }

    nextValue[index] = sanitized;
    onChange(nextValue);

    if (index < otpLength - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key !== 'Backspace') {
      return;
    }

    if (otpValues[index]) {
      const nextValue = [...otpValues];
      nextValue[index] = '';
      onChange(nextValue);
      return;
    }

    if (index > 0) {
      focusInput(index - 1);
    }
  };

  return (
    <Box width="$full" alignItems="center">
      <HStack space="sm" width="$full" maxWidth={320} justifyContent="center">
        {otpValues.map((otpValue, index) => (
          <Input isDisabled={isDisabled} width="$full" key={`otp-${index}`} flex={1} maxWidth={48}>
            <InputField
              ref={(ref: any) => {
                inputRefs.current[index] = ref;
              }}
              value={otpValue}
              onChangeText={(text: string) => updateOtpAtIndex(index, text)}
              keyboardType="number-pad"
              maxLength={index === 0 ? otpLength : 1}
              textAlign="center"
              autoCapitalize="none"
              returnKeyType={index === otpLength - 1 ? 'done' : 'next'}
              onKeyPress={(event: any) =>
                handleKeyPress(index, event?.nativeEvent?.key || '')
              }
            />
          </Input>
        ))}
      </HStack>
    </Box>
  );
};

export default OtpCodeInput;
