export const templateStyles = {
  iconContainer: {
    $md: {
      width: '$12',
      height: '$12',
      mr: '$4',
    },
  },
  pressableCard: {
    mb: '$4',
    mt: '$1',
    p: '$2',
    bg: '$white',
    borderWidth: 1,
    borderColor: '$borderLight300',
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
    borderRadius: '$md',
    bg: '$gray100',
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
    flexGrow: 1,
    bg: '$bgSecondary',
  },
  mainContent: {
    flex: 1,
    px: '$3',
    py: '$2',
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
    bg: '$progressBarBackground',
    padding: '$3',
    borderRadius: '$md',
    borderWidth: '$px',
    borderColor: '$progressBarFillColor',
    mt: '$3',
  },
  headerContainer: {
    bg: '$white',
    px: '$6',
    py: '$5',
    borderBottomWidth: 1,
    borderBottomColor: '$borderLight200',
    mb: '$2',
  },
  contentContainer: {
    width: '100%',
    maxWidth: 1150,
    alignSelf: 'center',
  },
  navigationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    mb: '$4',
  },
  backLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backLinkText: {
    fontSize: '$sm',
    fontWeight: '$medium',
    color: '$textPrimary',
    ml: '$2',
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
  viewCheckInsButton: {
    borderWidth: 1,
    borderColor: '$borderLight300',
    borderRadius: '$md',
    px: '$4',
    py: '$2',
    bg: '$white',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '$2',
  },
  viewCheckInsButtonText: {
    color: '$textPrimary',
    fontSize: '$sm',
    fontWeight: '$medium',
  },
};

export default templateStyles;
