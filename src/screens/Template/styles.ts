export const templateStyles = {
  iconContainer: {
    $md: {
      width: '$12',
      height: '$12',
      mr: '$4',
    },
  },
  leftSection: {
    width: '50%',
  },
  rightSection: {
    width: '50%',
  },
  headerContainer: {
    py: "$4",
    px: "$6",
    "$sm-px": "$4",
  },
  pressableCard: {
    px: '$4',
    py: '$4',
    pb: "$6",
    bg: '$white',
    borderWidth: 1,
    borderColor: '$borderColor',
    borderRadius: '$xl',
    _pressed: { opacity: 0.8 },
    $web: {
      boxShadow: '$primary500',
      outline: 'none',
      transform: 'none',
      width: '$full',
      cursor: 'pointer',
      ':hover': {
        borderColor: '$primary500',
      },
    },
  },
  iconBox: {
    width: '$10',
    height: '$10',
    borderRadius: '$xl',
    bg: '$accent200',
    justifyContent: 'center',
    alignItems: 'center',
    mr: '$3',
  },
  badge: {
    borderRadius: '$full',
    px: '$2',
    py: '$1',
    mr: '$2',
  },
  pillarsSection: {
    pt: '$4',
    borderTopWidth: 1,
    borderTopColor: '$borderLight300',
    mt: '$3',
  },
  modalHeaderIcon: {
    width: '$10',
    height: '$10',
    borderRadius: '$full',
    bg: '$iconBackground',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1
  },
  mainContent: {
    flex: 1,
    px: '$4',
    py: '$6',
    "$md-px": '$6',
  },
  modalFooter: {
    flexDirection: 'column-reverse',
    sx: {
      '@md': {
        flexDirection: 'row',
        justifyContent: 'flex-end',
      },
      width: '$full',
      justifyContent: 'center',
      gap: '$3',
    },
  },
  summaryBox: {
    bg: '$blue50',
    padding: '$4',
    borderRadius: '$lg',
    borderWidth: 1,
    borderColor: '$blue200',
    mt: '$4',
  },
  selectWrapper: {
    borderWidth: 1,
    borderColor: '$borderLight300',
    borderRadius: '$xl',
    overflow: 'hidden',
  },
  backLinkContainer: {
    alignItems: 'center' as const,
    px: '$0' as const,
    py: '$0' as const,
    pb: '$4' as const,
    "$sm-pb": '$2' as const,
    '$md-px': '$0' as const,
    flexWrap: 'nowrap' as const,
  },
  headerContent: {
    flexDirection: 'column',
    gap: '$1',
  },
  pageTitle: {
    fontSize: '$2xl',
    fontWeight: '$medium',
    lineHeight: 36,
    color: '$textForeground',
    mb: '$1',
  },
  pageSubtitle: {
    fontSize: '$md',
    color: '$textSecondary',
  },
};

export default templateStyles;
