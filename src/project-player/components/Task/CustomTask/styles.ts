export const addCustomTaskStyles = {
  buttonBox: {
    borderRadius: '$md',
    borderWidth: 1,
    borderStyle: 'dashed' as const,
    borderColor: '$mutedBorder',
    padding: '$1',
    marginTop: '$1',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    bg: '$accent100',
    cursor: 'pointer' as const,
    sx: {
      ':hover': {
        bg: '$primary100',
        borderColor: '$primary500',
      },
    },
  },
  buttonBoxHovered: {
    bg: '$primary100',
  },
  buttonContent: {
    space: 'sm' as const,
    alignItems: 'center' as const,
  },
} as const;

export const addCustomTaskModalStyles = {
  modalBody: {
    padding: '$6',
    paddingTop: '$2',
  },
  formStack: {
    space: 'lg' as const,
  },
  fieldStack: {
    space: 'xs' as const,
  },
  input: {
    variant: 'outline' as const,
    size: 'lg' as const,
    borderWidth: 1,
    borderColor: '$inputBorder',
    borderRadius: '$md',
    bg: '$backgroundPrimary.light',
    focusBorderColor: '$primary500',
    focusBorderWidth: 2,
  },
  textarea: {
    size: 'lg' as const,
    borderWidth: 1,
    borderColor: '$inputBorder',
    borderRadius: '$md',
    bg: '$backgroundPrimary.light',
    focusBorderColor: '$primary500',
    focusBorderWidth: 2,
    minHeight: 100,
  },
  select: {
    bg: '$backgroundPrimary.light',
    borderColor: '$inputBorder',
  },
  pillarDisplayBox: {
    bg: '$mutedForeground',
    padding: '$3',
    borderRadius: '$md',
    borderWidth: 1,
    borderColor: '$inputBorder',
  },
  modalFooter: {
    borderTopWidth: 0,
    padding: '$6',
    paddingTop: '$4',
  },
  footerButtons: {
    space: 'md' as const,
    width: '$full',
    justifyContent: 'flex-end' as const,
  },
  cancelButton: {
    variant: 'outline' as const,
    borderWidth: 1,
    borderColor: '$inputBorder',
    bg: '$backgroundPrimary.light',
    paddingHorizontal: '$6',
    paddingVertical: '$2',
    borderRadius: '$md',
    hoverBg: '$hoverBackground' as const,
    cursor: 'pointer' as const,
  },
  submitButton: {
    variant: 'solid' as const,
    bg: '$primary500',
    paddingHorizontal: '$6',
    paddingVertical: '$2',
    borderRadius: '$md',
    hoverBg: '$primary500' as const,
    hoverOpacity: 0.9,
    cursor: 'pointer' as const,
  },
  submitButtonContent: {
    space: 'xs' as const,
    alignItems: 'center' as const,
  },
  // Service provider selection section
  serviceProviderSection: {
    space: 'sm' as const,
    padding: '$3',
    borderRadius: '$md',
    borderWidth: 1,
    borderColor: '$borderLight300',
    bg: '$taskCardBg',
  },
  serviceProviderHeader: {
    alignItems: 'center' as const,
    space: 'xs' as const,
  },
} as const;
