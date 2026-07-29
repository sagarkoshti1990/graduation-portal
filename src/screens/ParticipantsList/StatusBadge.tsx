import React from 'react';
import { Badge, BadgeText } from '@ui';
import { STATUS, USER_STATUS, USER_STATUS_DISPLAY } from '@constants/app.constant';
import { STATUS as PARTICIPANT_STATUS } from '@constants/PARTICIPANTS_LIST';
import { styles } from './Styles';

export interface StatusBadgeColors {
  bg: string;
  text: string;
  border: string;
}

/**
 * Get status colors based on status value
 * Returns color configuration for background, text, and border
 */
export const getStatusColors = (statusValue: string): StatusBadgeColors => {
  switch (statusValue) {
    case STATUS.NOT_ENROLLED:
      return {
        bg: "$gray100",
        text: "$gray700",
        border: "$gray300",
      };
    case STATUS.ENROLLED:
      return {
        bg: "$purple100",
        text: "$purple700",
        border: "$purple300",
      };
    case STATUS.IN_PROGRESS:
      return {
        bg: "$blue100", // TODO: Change to blue100
        text: "$blue700",
        border: "$blue300", // TODO: Change to blue100
      };
    case STATUS.COMPLETED:
      return {
        bg: "$success100",
        text: "$success700",
        border: "$success300",
      };
    case STATUS.GRADUATED:
      return {
        bg: "$success100",  
        text: "$success700",
        border: "$success300",
      };
    case STATUS.DROPOUT:
    case STATUS.NOT_ELIGIBLE:
      return {
        bg: "$error100",
        text: "$error600",
        border: "$error300",
      };
    default:
      return {
        bg: "$gray100",
        text: "$gray700",
        border: "$gray300",
      };
  }
};

/**
 * Status Badge Component for Participants Table
 * Color-coded badge that changes based on status
 */
export const StatusBadge: React.FC<{ status?: string,user?:any }> = ({ status, user }) => {
  if (!status) return null;

  const colors = getStatusColors(status);
  if(user?.userDetails?.status === USER_STATUS.INACTIVE) {
    return <Badge
      {...styles.statusBadgeBox}
      bg={"$error100"}
      borderColor={"$error300"}
    >
      <BadgeText
        {...styles.statusBadgeText}
        color={"$error600"}
      >
        {USER_STATUS_DISPLAY[user?.userDetails?.status as keyof typeof USER_STATUS]}
      </BadgeText>
    </Badge>
  }

  return (
    <Badge
      {...styles.statusBadgeBox}
      bg={colors.bg}
      borderColor={colors.border}
    >
      <BadgeText
        {...styles.statusBadgeText}
        color={colors.text}
      >
        {PARTICIPANT_STATUS[status as keyof typeof PARTICIPANT_STATUS] || status}
      </BadgeText>
    </Badge>
  );
};

