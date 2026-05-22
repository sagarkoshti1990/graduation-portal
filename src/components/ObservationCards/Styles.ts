/**
 * AssessmentCard Styles
 * Centralized styles for AssessmentCard component
 */

// Common status badge base styles
const statusBadgeBaseStyles = {
  borderRadius: '$full' as const,
  px: '$2' as const,
  py: '$0.5' as const,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  textTransform:'capitalize' as const,
};

// Status badge with icon (for graduated, completed, and not-started)
const statusBadgeWithIconStyles = {
  ...statusBadgeBaseStyles,
  flexDirection: 'row' as const,
  gap: '$1' as const,
};

export const assessmentSurveyCardStyles = {
  cardContainer: {
    bg: '$white',
    borderWidth: 1,
    borderColor: '$borderLight200',
    borderRadius: '$2xl',
    width: '$full',
    space: '$4',
    elevation: 0, // Remove shadow on React Native
    padding: '$5',
  },
  cardHeader: {
    width: '$full',
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
  },
  iconContainer: {
    width: '$12',
    height: '$12',
    borderRadius: '$2xl',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    color: '$white',
  },
  title: {
    fontSize: '$md',
    fontWeight: '$normal',
    color: '$textForeground',
    flex: 1,
  },
  statusBadgeNotStarted: {
    ...statusBadgeWithIconStyles,
    bg: "$gray100",
    borderWidth: 1,
    borderColor: "$gray300"
  },
  statusBadgeInProgress: {
    ...statusBadgeBaseStyles,
    bg: '$warning50',
    borderWidth: 1,
    borderColor: "$warning600",
  },
  statusBadgeCompleted: {
    ...statusBadgeWithIconStyles,
    bg: '$success50',
    borderWidth: 1,
    borderColor: "$success600",
  },
  statusBadgeGraduated: {
    ...statusBadgeWithIconStyles,
    bg: '$success50',
    borderWidth: 1,
    borderColor: "$success600",
  },
  statusBadgeText: {
    fontSize: '$xs',
    fontWeight: '$medium',
    color: '$gray700',
    $web: {
      whiteSpace: 'nowrap' as const,
    },
  },
  statusBadgeTextWarning: {
    fontSize: '$xs',
    fontWeight: '$medium',
    color: '$warning600',
    $web: {
      whiteSpace: 'nowrap' as const,
    },
  },
  statusBadgeTextCompleted: {
    fontSize: '$xs',
    fontWeight: '$medium',
    color: '$success600',
    $web: {
      whiteSpace: 'nowrap' as const,
    },
  },
  statusBadgeTextGraduated: {
    fontSize: '$xs',
    fontWeight: '$medium',
    color: '$white',
    $web: {
      whiteSpace: 'nowrap' as const,
    },
  },
  contentContainer: {
    mb: '$4',
  },
  description: {
    fontSize: '$md',
    color: '$textMutedForeground',
    lineHeight: '$md',
  },
  additionalInfo: {
    fontSize: '$md',
    color: '$textMutedForeground',
    fontStyle: 'normal' as const,
    lineHeight: '$sm',
  },
  buttonText: {
    fontSize: '$sm',
    fontWeight: '$medium',
  },
  emptyCard:{
    alignItems: "center",
    width: "$full",
  },
  emptyCardTitale: {
    color:"$textMutedForeground",
    textAlign:"center",
    py:"$4"
  }
} as const;

