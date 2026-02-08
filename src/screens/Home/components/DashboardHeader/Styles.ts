export const dashboardHeaderStyles = {
  container: {
    space: 'md',
    mb: '$4',
  },
  filtersContainer: {
    flexWrap: 'wrap',
    gap: '$3',
    $md: {
      flexWrap: 'nowrap',
    },
  },
  filterItem: {
    flex: 1,
    minWidth: '150px',
    $md: {
      flex: 'none',
      width: 'auto',
    },
  },
} as const;

