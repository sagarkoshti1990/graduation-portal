import { theme } from '@config/theme';

/**
 * Common Modal Container Styles
 * Applied to Modal component itself
 */
export const commonModalContainerStyles = {
  alignItems: 'center' as const,
  display: 'flex' as const,
  height: '$full' as const,
  width: '$full' as const,
  $web: {
    position: 'fixed' as const,
  },
} as const;

/**
 * Common Web Positioning Styles for Modal Content
 * Applied to both confirmation and profile variants
 */
export const commonModalWebStyles = {
  $web: {
    position: 'fixed !important' as const,
    top: '50% !important' as const,
    left: '50% !important' as const,
    transform: 'translate(-50%, -50%) !important' as const,
    margin: '0 !important' as const,
  },
} as const;

/**
 * Common Modal Content Base Styles
 * Shared styles for both confirmation and profile variants
 */
export const commonModalContentStyles = {
  borderRadius: '$xl' as const,
  bg: '$bgSidebar' as const,
  shadowColor: '$black' as const,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.2,
  shadowRadius: 16,
  elevation: 24,
  marginHorizontal: '$6' as const,
  marginVertical: 'auto' as const,
  alignSelf: 'center' as const,
  ...commonModalWebStyles,
} as const;

/**
 * Profile Variant Styles for Modal
 * Styles specific to profile variant display
 */
export const profileStyles = {
  modalContent: {
    ...commonModalContentStyles,
  },
  modalHeader: {
    borderBottomWidth: 0,
    padding: '$6' as const,
    paddingBottom: '$4' as const,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
  },
  modalTitle: {
    fontSize: '$lg' as const,
    fontWeight: '$semibold' as const,
    color: '$textForeground' as const,
  },
  modalSubtitle: {
    fontSize: '$sm' as const,
    color: '$textMutedForeground' as const,
  },
  modalBody: {
    paddingHorizontal: '$6' as const,
    paddingTop: '$4' as const,
    paddingBottom: '$6' as const,

  },
  headerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: '$full' as const,
    bg: theme.tokens.colors.iconBackground,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  fieldLabel: {
    fontSize: '$sm' as const,
    fontWeight: '$medium' as const,
    color: '$textMutedForeground' as const,
    letterSpacing: 0.5,
  },
  fieldValue: {
    fontSize: '$sm' as const,
    color: '$textForeground' as const,
    lineHeight: '$sm' as const,
    fontWeight: '$normal' as const,
  },
  fieldSection: {
    borderBottomWidth: 1,
    borderBottomColor: '$borderLight200' as const,
    paddingBottom: '$4' as const,
  },
  input: {
    variant: 'outline' as const,
    size: 'md' as const,
    borderWidth: 1,
    borderColor: 'transparent' as const,
    borderRadius: '$md' as const,
    bg: '$white' as const,
  },
  cancelButton: {
    variant: 'outline' as const,
    borderWidth: 1,
    borderColor: theme.tokens.colors.inputBorder,
    bg: theme.tokens.colors.modalBackground,
    paddingHorizontal: '$6' as const,
    paddingVertical: '$3' as const,
    borderRadius: '$md' as const,
    $hoverBg: theme.tokens.colors.hoverBackground,
    $webCursor: 'pointer' as const,
  },
  confirmButton: {
    paddingHorizontal: '$6' as const,
    paddingVertical: '$3' as const,
    borderRadius: '$md' as const,
    $hoverOpacity: 0.9,
    $webCursor: 'pointer' as const,
  },
  languageButton: {
    px: '$3' as const,
    py: '$1' as const,
    borderRadius: '$full' as const,
  },
  languageButtonActive: {
    bg: '$primary500' as const,
    borderWidth: 0,
  },
  languageButtonInactive: {
    bg: 'transparent' as const,
    borderWidth: 1,
    borderColor: '$primary500' as const,
  },
  languageButtonText: {
    fontSize: '$xs' as const,
    fontWeight: '$medium' as const,
  },
  languageButtonTextActive: {
    color: '#fff' as const,
  },
  languageButtonTextInactive: {
    color: '$primary500' as const,
  },
} as const;

export const LCProfileStyles = {
  lcProfileCard: {
    bg: '$white' as const,
    p: '$4' as const,
    borderRadius: '$lg' as const,
    borderWidth: 1,
    borderColor: '$borderLight300' as const,
    width: '$full' as const,

    // responsive layout for fields
    sx: {
      _web: {
        maxWidth: '720px',      // popup width like reference UI
        width: '100%',
        margin: '0 auto',
      },
    },
  },

  // Wrapper for all profile detail items
  lcFieldWrapper: {
    flexDirection: 'column' as const,
    flexWrap: 'wrap' as const,
    gap: '$4' as const,

    sx: {
      _web: {
        display: 'flex',
      },
    },
  },

  lcItem: {
    width: '$full' as const,
    flex: 1,
    sx: {
      _web: {
        flexBasis: '45%',    // maintains two columns without minWidth
      },
    },
  },

  headerAvatar: {
    width: '$16' as const,
    height: '$16' as const,
    borderRadius: '$full' as const,
    bg: theme.tokens.colors.primary500,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },

  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: '$sm' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },

  // Value field background for LC profile
  lcValueField: {
    bg: '$bgSidebar' as const,
    py: '$1' as const,
    px: '$3' as const,
    minHeight: '$9' as const,
    borderRadius: '$md' as const,
    alignItems: 'flex-start' as const,
    justifyContent: 'center' as const,
    display: 'flex' as const,
    opacity: 0.8,
  },
};

