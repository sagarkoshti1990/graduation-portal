import React from 'react';
import { Box, Text } from '@ui';
import { loginStyles } from '../Styles';

interface AuthErrorMessageProps {
  message?: string;
  boxed?: boolean;
}

const AuthErrorMessage: React.FC<AuthErrorMessageProps> = ({
  message,
  boxed = false,
}) => {
  if (!message) {
    return null;
  }

  if (boxed) {
    return (
      <Box {...loginStyles.errorBox}>
        <Text {...loginStyles.errorText}>{message}</Text>
      </Box>
    );
  }

  return <Text {...loginStyles.errorText}>{message}</Text>;
};

export default AuthErrorMessage;
