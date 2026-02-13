/**
 * Styles for DataTable component
 * Centralized style definitions for better maintainability
 */

export const styles = {
  // Menu icon container
  menuIconContainer: {
    marginRight: '$2' as const,
  },

  // Custom trigger (menu button) - small rounded pill, matches mobile card design
  customTrigger: {
    paddingHorizontal: '$3' as const,
    borderRadius: '$xl' as const,
    height: '$8' as const,
    borderWidth: 1,
    borderColor: '$borderLight300' as const,
    bg: '$white' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    $web: {
      cursor: 'pointer' as const,
    },
    sx: {
      ':hover': {
        bg: '$backgroundLight100',
      },
    },
  },

  // Table Header
  tableHeader: {
    bg: '$tableHeaderBg' as const,
    padding: '$4' as const,
    borderBottomColor: '$borderLight300' as const,
    space: 'md' as const,
    borderTopLeftRadius: '$2xl' as const,
    borderTopRightRadius: '$2xl' as const,
  },

  // Table Row
  tableRow: {
    padding: '$4' as const,
    borderBottomColor: '$borderLight200' as const,
    space: 'md' as const,
    alignItems: 'center' as const,
    $web: {
      transition: 'background-color 0.2s' as const,
    },
    sx: {
      ':hover': {
        bg: '$backgroundLight50',
      },
    },
  },

  tableRowLast: {
    borderBottomWidth: 0,
  },

  tableRowNotLast: {
    borderBottomWidth: 1,
  },

  // View Details Button - full-width pill with border
  viewDetailsButton: {
    flex: 1,
    paddingHorizontal: '$2' as const,
    paddingVertical: '$0' as const,
    borderRadius: '$xl' as const,
    bg: '$backgroundLight50' as const,
    borderWidth: 1,
    borderColor: '$borderLight300' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    height: '$8' as const,
    $web: {
      cursor: 'pointer' as const,
    },
    sx: {
      ':hover': {
        bg: '$backgroundLight100',
      },
    },
  },

  // Card View
  cardContainer: {
    bg: '$white' as const,
    py:"$4",
    px:"$4",
    pb:"$5",
    borderRadius: '$2xl' as const,
    borderWidth: 1,
    borderColor: '$borderLight300' as const,
  },

  cardContent: {
    space: 'sm' as const, 
  },

  cardFullWidthRow: {
    space: 'sm' as const,
  },

  cardColumn: {
    space: 'xs' as const,
  },

  cardLeftRightRow: {
    alignItems: 'flex-start' as const,
    justifyContent: 'space-between' as const,
  },

  cardActionsSection: {
    space: 'sm' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },

  // Modal Input
  modalInput: {
    variant: 'outline' as const,
    size: 'lg' as const,
    borderWidth: 2,
    borderRadius: '$md' as const,
    minHeight: 80,
  },

  modalInputField: {
    paddingTop: '$3' as const,
    multiline: true,
    numberOfLines: 3,
    textAlignVertical: 'top' as const,
  },

  // Empty State
  emptyState: {
    padding: '$8' as const,
    alignItems: 'center' as const,
  },

  // Loading State
  loadingState: {
    padding: '$8' as const,
    alignItems: 'center' as const,
  },

  // Main Container
  mainContainer: {
    width: '$full' as const,
  },

  tableWrapper: {
    borderRadius: '$2xl' as const,
  },

  tableWrapperWeb: {
    borderWidth: 1,
    borderColor: '$borderLight300' as const,
  },

  // Card Content Container
  cardContentContainer: {
    width: '$full' as const,
    space: 'lg' as const,
  },

  // Table Content Container
  tableContentContainer: {
    width: '$full' as const,
  },

  // Desktop Scroll Container
  desktopScrollContainer: {
    width: '$full' as const,
    overflow: 'scroll' as const,
    $web: {
      overflowX: 'auto' as const,
      overflowY: 'hidden' as const,
      WebkitOverflowScrolling: 'touch' as const,
    },
  },

  // Pagination Controls
  paginationContainer: {
    space: 'md' as const,
    paddingVertical: '$4' as const,
  },

  paginationMainRow: {
    justifyContent: 'center' as const,
    $md: {
      justifyContent: 'space-between' as const,
    },
    alignItems: 'center' as const,
    flexWrap: 'wrap' as const,
    space: 'md' as const,
  },

  paginationLeftSide: {
    space: 'md' as const,
    alignItems: 'center' as const,
    flexWrap: 'wrap' as const,
    width:"fit-content",
    justifyContent:"center"
  },

  paginationPageSizeContainer: {
    space: 'sm' as const,
    alignItems: 'center' as const,
  },

  paginationPageSizeSelect: {
    width: '$20' as const,
  },

  paginationRightSide: {
    justifyContent: 'flex-end' as const,
    alignItems: 'center' as const,
    space: 'sm' as const,
    flexWrap: 'wrap' as const,
  },

  paginationButton: {
    padding: '$2' as const,
    borderRadius: '$sm' as const,
  },

  paginationButtonDisabled: {
    opacity: 0.5,
  },

  paginationButtonEnabled: {
    opacity: 1,
    $web: {
      cursor: 'pointer' as const,
    },
  },

  paginationPageNumbers: {
    space: 'xs' as const,
    alignItems: 'center' as const,
  },

  paginationEllipsis: {
    paddingHorizontal: '$2' as const,
  },

  paginationPageNumber: {
    paddingHorizontal: '$2' as const,
    paddingVertical: '$1' as const,
    borderRadius: '$sm' as const,
    minWidth: 25,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    $web: {
      cursor: 'pointer' as const,
    },
  },

  paginationPageNumberActive: {
    bg: '$primary500' as const,
  },

  paginationPageNumberInactive: {
    bg: 'transparent' as const,
  },
};

