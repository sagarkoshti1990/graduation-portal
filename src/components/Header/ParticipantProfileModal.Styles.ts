export const participantProfileModalStyles = {
  mobileContent: {
    width: '90%' as const,
  },
  headerSection: {
    bg: '$bgSidebar' as const,
    borderRadius: '$xl' as const,
    p: '$4' as const,
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    space: 'md' as const,
    mb: '$2' as const,
  },
  headerInfo: {
    space: 'xs' as const,
  },
  nameText: {
    fontSize: '$lg' as const,
    fontWeight: '$bold' as const,
    color: '$textDark900' as const,
  },
  idText: {
    fontSize: '$sm' as const,
    color: '$textDark600' as const,
  },
  fieldGroup: {
    space: 'xs' as const,
  },
  fieldGroupMobile: {
    space: 'sm' as const,
  },
  labelRow: {
    space: 'xs' as const,
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    mb: '$1' as const,
  },
  labelRowMobile: {
    space: 'sm' as const,
  },
  fieldLabel: {
    fontSize: '$sm' as const,
    fontWeight: '$medium' as const,
    color: '$textDark900' as const,
  },
  valueField: {
    bg: '$bgSidebar' as const,
    width: '$full' as const,
    px: '$4' as const,
    py: '$2.5' as const,
    borderRadius: '$md' as const,
    minHeight: 40 as const,
    justifyContent: 'center' as const,
  },
  fieldValue: {
    fontSize: '$sm' as const,
    color: '$textDark900' as const,
    fontWeight: '$normal' as const,
  },
  footerContainer: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    width: 'calc(100% + 48px)' as const,
    marginHorizontal: '-$6' as const,
    paddingHorizontal: '$6' as const,
    paddingTop: '$4' as const,
    borderTopWidth: 1 as const,
    borderTopColor: '$borderLight200' as const,
  },
  closeButton: {
    width: '$full' as const,
    variant: 'outline' as const,
    size: 'sm' as const,
    borderColor: '$inputBorder' as const,
    borderRadius: '$md' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  closeButtonText: {
    color: '$textDark900' as const,
    fontWeight: '$medium' as const,
  },
  avatarIconBox: {
    position: 'absolute' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    width: '100%' as const,
    height: '100%' as const,
  },
} as const;
