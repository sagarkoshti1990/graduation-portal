import React from 'react';
import { Pressable } from 'react-native';
import { Box, Input, InputField, LucideIcon, Text, VStack } from '@ui';
import { loginStyles } from '../Styles';
import AuthErrorMessage from './AuthErrorMessage';

interface PasswordInputFieldProps {
  label: string;
  placeholder: string;
  value: string;
  showPassword: boolean;
  error?: string;
  isDisabled?: boolean;
  returnKeyType?: 'next' | 'done';
  onChangeText: (value: string) => void;
  onToggleVisibility: () => void;
  onSubmitEditing?: () => void;
}

const PasswordInputField: React.FC<PasswordInputFieldProps> = ({
  label,
  placeholder,
  value,
  showPassword,
  error,
  isDisabled = false,
  returnKeyType = 'done',
  onChangeText,
  onToggleVisibility,
  onSubmitEditing,
}) => {
  return (
    <VStack {...loginStyles.vstack4}>
      <Text {...loginStyles.text5}>{label}</Text>
      <Box position="relative">
        <Input isDisabled={isDisabled} isInvalid={!!error}>
          <InputField
            placeholder={placeholder}
            value={value}
            onChangeText={onChangeText}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            pr="$12"
            returnKeyType={returnKeyType}
            onSubmitEditing={onSubmitEditing}
          />
        </Input>
        <Pressable
          onPress={onToggleVisibility}
          disabled={isDisabled}
          style={loginStyles.eyeIconButton}
        >
          <LucideIcon
            name={showPassword ? 'EyeOff' : 'Eye'}
            size={20}
            color="#6B7280"
          />
        </Pressable>
      </Box>
      <AuthErrorMessage message={error} />
    </VStack>
  );
};

export default PasswordInputField;
