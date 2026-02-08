/**
 * Styles for UserManagement screen components
 * Centralized style definitions for better maintainability
 */

// Base column text style - common properties shared by all column text styles
const columnTextBase = {
  fontWeight: '$normal' as const,
  fontSize: '$sm' as const,
};

export const styles = {
  // Role Badge Styles
  roleBadge: {
    paddingHorizontal: '$2' as const,
    paddingVertical: '$0.5' as const,
    borderRadius: '$md' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  roleBadgeParticipant: {
    paddingHorizontal: '$2' as const,
    paddingVertical: '$0.5' as const,
    borderRadius: '$md' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: '$borderLight200' as const,
  },
  roleBadgeText: {
    color: '$white' as const,
    fontWeight: '$medium' as const,
    fontSize: '$xs' as const,
  },
  roleBadgeParticipantColor: {
    bg: '$white' as const,
    color: '$textForeground' as const,
    fontWeight: '$medium' as const,
    fontSize: '$xs' as const,
  
  },
  roleColors: {
    'BRAC admin': '$error600' as const,
    Supervisor: '$primary500' as const,
    'Linkage Champion': '$textMutedForeground' as const,
    Participant: '$white' as const,
  },

  // Status Badge Styles
  statusBadge: {
    paddingHorizontal: '$2' as const,
    paddingVertical: '$0.5' as const,
    borderRadius: '$md' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  statusBadgeText: {
    color: '$white' as const,
    fontWeight: '$medium' as const,
    fontSize: '$xs' as const,
  },
  statusBadgeActive: {
    bg: '$success600' as const,
  },
  statusBadgeInactive: {
    bg: '$textMutedForeground' as const,
  },

  // Details Cell Styles
  detailsAssignedText: {
    color: '$primary500' as const,
    fontWeight: '$medium' as const,
  },
  detailsProgressContainer: {
    space: 'sm' as const,
    alignItems: 'center' as const,
    width: '$full' as const,
    maxWidth: 200,
  },
  detailsProgressText: {
    color: '$textMutedForeground' as const,
    minWidth: 40,
  },

  // Column Text Styles - using base style with color overrides
  nameText: {
    ...columnTextBase,
    color: '$textForeground' as const,
  },
  emailText: {
    ...columnTextBase,
    color: '$textForeground' as const,
  },
  provinceText: {
    ...columnTextBase,
    color: '$textForeground' as const,
  },
  districtText: {
    ...columnTextBase,
    color: '$textMutedForeground' as const,
  },
  lastLoginText: {
    ...columnTextBase,
    color: '$textForeground' as const,
  },

  // Table Container Styles
  tableContainer: {
    bg: '$white' as const,
    padding: '$4' as const,
    borderRadius: '$xl' as const,
    borderWidth: 1,
    borderColor: '$borderColor' as const,
    mt: '$3' as const,
  },

  // Table Header Styles
  tableHeader: {
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: '$4' as const,
  },

  // Table Header Actions Styles
  tableHeaderActions: {
    space: 'md' as const,
    alignItems: 'center' as const,
  },
  // Upload Users Modal Card Styles
  uploadOptionCard: {
    borderRadius: '$lg',
    borderWidth: 1,
    borderColor: '$borderLight200',
    padding: '$4',
    '$web-cursor': 'pointer' as const,
    '$web-transition': 'background-color 0.2s ease-in-out' as const,
    '$web-boxShadow': 'none' as const,
    elevation: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  uploadOptionCardDisabled: {
    borderRadius: '$lg',
    borderWidth: 1,
    borderColor: '$borderLight200',
    padding: '$4',
    opacity: 0.5,
    '$web-boxShadow': 'none' as const,
    elevation: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  uploadCSVIconContainer: {
    bg: '$primary300',
    borderRadius: '$lg',
    width: 40,
    height: 40,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  addUserIconContainer: {
    bg: '$gray100',
    borderRadius: '$lg',
    width: 40,
    height: 40,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
} as const;
