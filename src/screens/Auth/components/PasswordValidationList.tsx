import React, { useMemo } from 'react';
import { HStack, LucideIcon, Text, VStack } from '@ui';
import { loginStyles } from '../Styles';
import {
  getPasswordValidationItems,
  PasswordValidationLabels,
} from './passwordValidation';

interface PasswordValidationListProps {
  password: string;
  labels: PasswordValidationLabels;
}

const PasswordValidationList: React.FC<PasswordValidationListProps> = ({
  password,
  labels,
}) => {
  const validationItems = useMemo(
    () => getPasswordValidationItems(password, labels),
    [labels, password]
  );

  if (!password) {
    return null;
  }

  return (
    <VStack {...loginStyles.vstack6}>
      {validationItems.map(({ key, label, isValid }) => (
        <HStack key={key} {...loginStyles.hstack}>
          <LucideIcon
            name={isValid ? 'CheckCircle' : 'XCircle'}
            size={14}
            color={isValid ? '$success500' : '$error500'}
          />
          <Text
            {...loginStyles.text6ForgotPassword}
            color={isValid ? '$success600' : '$error600'}
          >
            {label}
          </Text>
        </HStack>
      ))}
    </VStack>
  );
};

export default PasswordValidationList;
