export default {
  container: {
    px: '$4',
    pt: '$0',
    pb: '$6',
    '$md-px': '$6',
  } as const,
  contentContainer: {
    space: 'lg',
    width: '100%',
  } as const,
  uploadButtonProps: {
    bg: '$primary500',
    px: '$4',
    py: '$2.5',
    borderRadius: '$xl',
    sx: { ':active': { bg: '$primary600' } },
  } as const,
  filterBoxContainerProps: {
    p: '$4',
    mt: '$1',
  } as const,

  // ─── index.tsx ────────────────────────────────────────────────────────────────
  screenWrapper: {
    flex: 1,
    bg: '$backgroundColor',
  } as const,

  // Stat Cards
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: '-$2',
    mt: '$4',
    mb: '-$4',
  } as const,
  statCardContainer: {
    flex: 1,
    bg: '$white',
    borderRadius: '$2xl',
    borderWidth: 1,
    borderColor: '$borderLight200',
    p: '$5',
    minWidth: 200,
    marginHorizontal: '$2',
    marginBottom: '$4',
    shadowColor: '$black',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  } as const,
  statCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  } as const,
  statTextCol: {
    space: 'xs',
    flex: 1,
  } as const,
  statTitleText: {
    fontSize: '$sm',
    fontWeight: '$medium',
    color: '$textMutedForeground',
    lineHeight: '$sm',
  } as const,
  statCountText: {
    fontSize: '$2xl',
    fontWeight: '$bold',
    color: '$textPrimary',
  } as const,
  statIconBox: {
    width: 44,
    height: 44,
    borderRadius: '$xl',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  } as const,

  // Stat icon variants (bg + borderColor per card)
  statIconBoxResources: {
    width: 44,
    height: 44,
    borderRadius: '$xl',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    bg: '$error50',
    borderColor: '$error100',
  } as const,
  statIconBoxPdf: {
    width: 44,
    height: 44,
    borderRadius: '$xl',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    bg: '$blue50',
    borderColor: '$blue100',
  } as const,
  statIconBoxTemplates: {
    width: 44,
    height: 44,
    borderRadius: '$xl',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    bg: '$purple50',
    borderColor: '$purple200',
  } as const,
  statIconBoxDownloads: {
    width: 44,
    height: 44,
    borderRadius: '$xl',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    bg: '$success50',
    borderColor: '$success100',
  } as const,

  // Stat icon sizes / colors
  statIconFolder: {
    size: 20,
    color: '$primary500',
  } as const,
  statIconFileText: {
    size: 20,
    color: '$blue600',
  } as const,
  statIconTrendingUp: {
    size: 20,
    color: '$purple600',
  } as const,
  statIconDownload: {
    size: 20,
    color: '$success600',
  } as const,

  // ─── MaterialCard.tsx ─────────────────────────────────────────────────────────
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: '-$3',
  } as const,
  cardWrapper: {
    width: '100%',
    '$md-width': '33.33%',
    px: '$3',
    mb: '$6',
  } as const,
  materialCard: {
    bg: '$white',
    borderRadius: '$2xl',
    borderWidth: 1,
    borderColor: '$borderLight200',
    p: '$5',
    shadowColor: '$black',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
    height: '100%',
    justifyContent: 'space-between',
  } as const,
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    mb: '$3',
    width: '100%',
  } as const,
  // HStack wrapping icon box + title/badge column
  cardHeaderRow: {
    space: 'md',
    alignItems: 'center',
    mb: '$3',
    width: '100%',
  } as const,
  cardHeaderTextCol: {
    flex: 1,
  } as const,
  cardBadgeWrapper: {
    alignSelf: 'flex-start',
  } as const,
  cardHeaderIconBox: {
    width: 44,
    height: 44,
    borderRadius: '$xl',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  } as const,
  // Icon inside the category icon box (size + color come from dynamic badge)
  cardHeaderIconProps: {
    size: 20,
  } as const,
  categoryBadgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    px: '$2.5',
    py: '$0.5',
    borderRadius: '$full',
    borderWidth: 1,
    borderColor: '$borderLight300',
    bg: '$backgroundLight50',
    alignSelf: 'flex-start',
  } as const,
  categoryBadgeTextCard: {
    fontSize: '$xs',
    fontWeight: '$medium',
    color: '$textSecondary',
  } as const,
  cardTitle: {
    fontSize: '$md',
    fontWeight: '$bold',
    color: '$textPrimary',
    mt: '$1',
  } as const,
  cardDescription: {
    fontSize: '$sm',
    color: '$textSecondary',
    lineHeight: '$md',
    mb: '$4',
  } as const,
  fileInfoBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    bg: '$backgroundLight50',
    borderRadius: '$lg',
    px: '$3.5',
    py: '$2.5',
    mb: '$3',
    width: '100%',
  } as const,
  fileInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    space: 'xs',
    flex: 1,
  } as const,
  fileInfoIcon: {
    size: 14,
    color: '$textSecondary',
  } as const,
  fileNameText: {
    fontSize: '$xs',
    color: '$textPrimary',
    fontWeight: '$medium',
    flex: 1,
  } as const,
  fileSizeText: {
    fontSize: '$xs',
    color: '$textSecondary',
  } as const,
  linkedOfferingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    space: 'xs',
    bg: '$blue50',
    borderRadius: '$lg',
    px: '$3.5',
    py: '$2.5',
    mb: '$4',
  } as const,
  linkedOfferingIcon: {
    size: 14,
    color: '$blue700',
  } as const,
  linkedOfferingText: {
    fontSize: '$xs',
    fontWeight: '$semibold',
    color: '$blue700',
    flex: 1,
  } as const,
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    mb: '$5',
    borderTopWidth: 1,
    borderTopColor: '$borderLight100',
    pt: '$3.5',
  } as const,
  metaItemText: {
    fontSize: '$xs',
    color: '$textSecondary',
  } as const,
  downloadsText: {
    fontSize: '$xs',
    color: '$success700',
    fontWeight: '$semibold',
  } as const,
  downloadsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    space: 'xs',
  } as const,
  downloadsIcon: {
    size: 12,
    color: '$success700',
  } as const,
  cardFooterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    space: 'xs',
    width: '100%',
  } as const,
  // Left group of footer buttons (Preview + Delete)
  cardFooterLeftGroup: {
    space: 'xs',
    alignItems: 'center',
  } as const,
  previewBtn: {
    borderWidth: 1,
    borderColor: '$borderLight200',
    bg: '$white',
    px: '$3',
    py: '$2',
    borderRadius: '$lg',
    sx: { ':active': { bg: '$backgroundLight50' } },
  } as const,
  previewBtnRow: {
    space: 'xs',
    alignItems: 'center',
  } as const,
  previewBtnIcon: {
    size: 14,
    color: '$textPrimary',
  } as const,
  previewBtnText: {
    fontSize: '$xs',
    fontWeight: '$semibold',
    color: '$textPrimary',
  } as const,
  deleteBtn: {
    borderWidth: 1,
    borderColor: '$red200',
    bg: '$white',
    p: '$2',
    borderRadius: '$lg',
    alignItems: 'center',
    justifyContent: 'center',
    sx: { ':active': { bg: '$red50' } },
  } as const,
  deleteBtnIcon: {
    size: 14,
    color: '$red600',
  } as const,
  downloadBtn: {
    bg: '$success600',
    px: '$4',
    py: '$2',
    borderRadius: '$lg',
    sx: { ':active': { bg: '$success700' } },
  } as const,
  downloadBtnRow: {
    space: 'xs',
    alignItems: 'center',
  } as const,
  downloadBtnIcon: {
    size: 14,
    color: '$white',
  } as const,
  downloadBtnText: {
    fontSize: '$xs',
    fontWeight: '$bold',
    color: '$white',
  } as const,

  // ─── MaterialsContent.tsx ─────────────────────────────────────────────────────
  contentVStack: {
    space: 'lg',
    width: '100%',
  } as const,
  emptyStateBox: {
    py: '$10',
    alignItems: 'center',
    justifyContent: 'center',
  } as const,
  emptyStateIcon: {
    size: 48,
    color: '$textMuted',
  } as const,
  emptyStateText: {
    color: '$textSecondary',
    mt: '$3',
    fontSize: '$sm',
  } as const,

  // ─── UploadResourceModal.tsx ──────────────────────────────────────────────────
  uploadModalBtn: {
    bg: '$primary500',
    px: '$4',
    py: '$2.5',
    borderRadius: '$xl',
    sx: { ':active': { bg: '$primary600' } },
  } as const,
  modalBodyVStack: {
    space: 'lg',
    py: '$2',
    width: '100%',
  } as const,
  modalFooterRow: {
    space: 'md',
    width: '$full',
    justifyContent: 'flex-end',
  } as const,
  modalConfirmBtnRow: {
    space: 'xs',
    alignItems: 'center',
  } as const,
  modalConfirmBtnIcon: {
    size: 16,
    color: '$white',
  } as const,
  categoryFormatRow: {
    space: 'md',
    width: '100%',
  } as const,
  categoryFormatCol: {
    flex: 1,
  } as const,
  selectIconWrapper: {
    mr: '$1',
  } as const,
  selectChevronIcon: {
    size: 16,
    color: '$textSecondary',
  } as const,
  formInputGroup: {
    space: 'xs',
    width: '100%',
  } as const,
  formLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    space: 'xs',
  } as const,
  formLabelText: {
    fontSize: '$sm',
    fontWeight: '$semibold',
    color: '$textPrimary',
  } as const,
  formRequiredText: {
    color: '$red600',
    fontSize: '$sm',
    fontWeight: '$bold',
  } as const,
  formInput: {
    borderWidth: 1,
    borderColor: '$borderLight300',
    borderRadius: '$lg',
    bg: '$white',
    px: '$3',
    height: 44,
    justifyContent: 'center',
    width: '100%',
    '$focus-borderColor': '$primary500',
  } as const,
  formTextarea: {
    borderWidth: 1,
    borderColor: '$borderLight300',
    borderRadius: '$lg',
    bg: '$white',
    px: '$3',
    py: '$2',
    height: 90,
    width: '100%',
    '$focus-borderColor': '$primary500',
  } as const,
  selectTrigger: {
    borderWidth: 1,
    borderColor: '$borderLight300',
    borderRadius: '$lg',
    bg: '$white',
    px: '$3',
    height: 44,
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    '$focus-borderColor': '$primary500',
  } as const,
  selectInputProps: {
    fontSize: '$sm',
    color: '$textPrimary',
  } as const,
  formInputField: {
    fontSize: '$sm',
    color: '$textPrimary',
  } as const,
  errorMsgBox: {
    bg: '$red50',
    borderWidth: 1,
    borderColor: '$red200',
    p: '$3',
    borderRadius: '$lg',
  } as const,
  errorMsgText: {
    color: '$red700',
    fontSize: '$sm',
    fontWeight: '$semibold',
  } as const,

  // ─── PreviewModal.tsx ─────────────────────────────────────────────────────────
  previewDetailsBox: {
    width: '100%',
    mb: '$2',
  } as const,
  previewPurposeTitle: {
    fontSize: '$xs',
    fontWeight: '$bold',
    color: '$textSecondary',
    textTransform: 'uppercase',
    letterSpacing: '$sm',
    mb: '$1',
  } as const,
  previewPurposeValue: {
    fontSize: '$sm',
    fontWeight: '$bold',
    color: '$textPrimary',
    mb: '$2',
  } as const,
  previewPurposeDesc: {
    fontSize: '$sm',
    color: '$textSecondary',
    lineHeight: '$md',
  } as const,
  previewMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: '-$2',
    mt: '$2',
  } as const,
  previewGridItem: {
    width: '50%',
    px: '$2',
    mb: '$3',
  } as const,
  previewGridLabel: {
    fontSize: '$xs',
    color: '$textSecondary',
    mb: '$0.5',
  } as const,
  previewGridValue: {
    fontSize: '$sm',
    fontWeight: '$bold',
    color: '$textPrimary',
  } as const,

  // Modal shared
  modalHeaderProps: {
    borderBottomWidth: 1,
    borderBottomColor: '$borderLight200',
    pb: '$4',
  } as const,
  modalCancelBtn: {
    borderWidth: 1,
    borderColor: '$borderLight300',
    bg: '$white',
    px: '$5',
    py: '$2',
    borderRadius: '$lg',
    sx: { ':active': { bg: '$backgroundLight50' } },
  } as const,
  modalCancelBtnText: {
    fontSize: '$sm',
    fontWeight: '$bold',
    color: '$textDark700',
  } as const,
  modalConfirmBtn: {
    bg: '$primary500',
    px: '$5',
    py: '$2',
    borderRadius: '$lg',
    sx: { ':active': { bg: '$primary600' } },
  } as const,
  modalConfirmBtnText: {
    fontSize: '$sm',
    fontWeight: '$bold',
    color: '$white',
  } as const,
  modalDownloadBtn: {
    bg: '$success600',
    px: '$5',
    py: '$2',
    borderRadius: '$lg',
    sx: { ':active': { bg: '$success700' } },
  } as const,
  modalDownloadBtnText: {
    fontSize: '$sm',
    fontWeight: '$bold',
    color: '$white',
  } as const,
  modalDeleteBtn: {
    bg: '$red600',
    px: '$5',
    py: '$2',
    borderRadius: '$lg',
    sx: { ':active': { bg: '$red700' } },
  } as const,
  modalDeleteBtnText: {
    fontSize: '$sm',
    fontWeight: '$bold',
    color: '$white',
  } as const,
  modalDescriptionText: {
    fontSize: '$sm',
    color: '$textSecondary',
    lineHeight: '$md',
    py: '$2',
  } as const,

  // Preview modal header
  previewHeaderRow: {
    space: 'sm',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'space-between',
    width: '100%',
  } as const,
  previewHeaderLeft: {
    space: 'sm',
    alignItems: 'center',
    flex: 1,
  } as const,
  previewHeaderTag: {
    borderWidth: 1,
    px: '$2.5',
    py: '$0.5',
    borderRadius: '$md',
  } as const,
  previewHeaderTagText: {
    fontSize: '$xs',
    fontWeight: '$bold',
  } as const,
  previewHeaderTitle: {
    fontSize: '$lg',
    fontWeight: '$bold',
    color: '$textPrimary',
    flex: 1,
  } as const,
  previewCloseBtn: {
    p: '$1',
  } as const,
  previewCloseIcon: {
    size: 20,
    color: '$red600',
  } as const,

  // Preview footer
  previewFooterRow: {
    space: 'md',
    width: '$full',
    justifyContent: 'flex-end',
  } as const,
  previewDownloadBtnRow: {
    space: 'xs',
    alignItems: 'center',
  } as const,
  previewDownloadBtnIcon: {
    size: 16,
    color: '$white',
  } as const,

  // Preview body
  previewBodyVStack: {
    space: 'lg',
    py: '$2',
    width: '100%',
  } as const,

  // Linked offering in preview (with extra bottom margin)
  previewLinkedOfferingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    space: 'xs',
    bg: '$blue50',
    borderRadius: '$lg',
    px: '$3.5',
    py: '$2.5',
    mb: '$2',
  } as const,
  previewLinkedOfferingIcon: {
    size: 16,
    color: '$blue700',
  } as const,
  previewLinkedOfferingTextCol: {
    space: 'xs',
    flex: 1,
  } as const,
  linkedOfferingLabel: {
    fontSize: '$xs',
    color: '$blue500',
  } as const,
  linkedOfferingValue: {
    fontSize: '$sm',
    fontWeight: '$bold',
    color: '$blue800',
  } as const,
};