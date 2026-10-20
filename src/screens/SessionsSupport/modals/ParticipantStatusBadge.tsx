import React from 'react';
import { Box, Text } from '@ui';
import { STATUS as PARTICIPANT_DISPLAY_STATUS } from '@constants/PARTICIPANTS_LIST';
import styles from '../styles';

interface ParticipantStatusBadgeProps {
  status: string;
}

export const getParticipantStatusColors = (status: string) => {
  const s = (status || '').toUpperCase();
  if (s === 'IN_PROGRESS' || s === 'IN PROGRESS') {
    return {
      bg: '$observationTaskBg',
      border: '$optionalTaskYellowBorder',
      text: '$warningIconColor',
    };
  }
  if (s === 'GRADUATED' || s === 'COMPLETED') {
    return {
      bg: '$success50',
      border: '$success300',
      text: '$success600',
    };
  }
  return {
    bg: '$gray100',
    border: '$gray300',
    text: '$gray700',
  };
};

const ParticipantStatusBadge: React.FC<ParticipantStatusBadgeProps> = ({ status }) => {
  const colors = getParticipantStatusColors(status);
  const displayStatus =
    PARTICIPANT_DISPLAY_STATUS[
      status as keyof typeof PARTICIPANT_DISPLAY_STATUS
    ] || status;

  return (
    <Box
      {...styles.assignParticipantsBadge}
      bg={colors.bg}
      borderColor={colors.border}>
      <Text
        {...styles.assignParticipantsBadgeText}
        color={colors.text}>
        {displayStatus}
      </Text>
    </Box>
  );
};

export default ParticipantStatusBadge;
