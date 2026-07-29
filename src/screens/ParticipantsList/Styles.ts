
/**
 * Styles for ParticipantsList screen component
 * Centralized style definitions for better maintainability
 */
export const styles = {
  // Main container
  mainContainer: {
    flex: 1 as const,
  },

  // ScrollView
  scrollView: {
    flex: 1 as const,
    bg: '$accent100',
  },

  // Header VStack
  headerVStack: {
    bg: '$white' as const,
  },

  // Heading
  heading: {
    "$md-px":"$6",
    px:"$4",
    py:"$4",
    lineHeight:"$lg",
    fontWeight:"$normal",
    boxShadow:"0 1px 3px 0  #0000001a, 0 1px 2px -1px #0000001a",
  },

  // Content container VStack
  contentVStack: {
    space: 'lg' as const,
    "$md-px":"$6",
    px:"$4",
    py:"$6",
    flex: 1 as const,
  },

  // Search bar and filter HStack
  searchFilterHStack: {
    space: 'md' as const,
    width: '$full' as const,
    flexDirection: 'column' as const,
    $md:{
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    }
  },

  searchFilterHStackSub: {
    space: 'md' as const,
    flexWrap:"wrap",
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    $md:{
      width: '$auto' as const,
    },
    $sm:{
      width: '$full' as const,
    },
    $xs:{
      width: '$full' as const,
    }
  },

  searchFilterHStackButton : {
    space: 'md' as const,
  },

  searchFilterHStackButtonSub : {
    size:"sm" as const,
    flex: 1 as const,
    $web:{ sx: { flex: "auto" }}
  },

  // Search bar container
  searchBarContainer: {
    flex: 1 as const,
    width: '$full' as const,
    $md: {
      flex: 1 as const,
    },
  },

  // Active/Inactive select container
  selectContainer: {
    width: '$full' as const,
    $md: {
      width: '$48' as const,
    },
  },
  buttonContainer: {
    width: '$full' as const,
    $md: {
      width: '$48' as const,
    },
  },

  // Mobile status select container
  mobileStatusSelectContainer: {
    width: '$full' as const,
  },

  // Desktop filter container
  desktopFilterContainer: {
    bg: '$accent200' as const,
    borderRadius: '$lg' as const,
    padding: '$1' as const,
    width: '$full' as const,
  },

  // Desktop filter HStack
  desktopFilterHStack: {
    space: 'xs' as const,
    width: '$full' as const,
  },

  // Status item Pressable
  statusItemPressable: {
    flex: 1 as const,
    py: '$2' as const,
    px: '$4' as const,
    borderRadius: '$md' as const,
    $web: {
      cursor: 'pointer' as const,
      transition: 'all 0.2s' as const,
    },
    sx: {
      ':hover': {
        opacity: 0.8,
      },
    },
  },

  // Status item Pressable - Active state
  statusItemPressableActive: {
    bg: "$primary50" as const,
    borderBottomWidth: 3 as const,
    borderColor: "$primary500" as const,
    borderRadius: '$lg' as const,
  },

  // Status item Pressable - Inactive state
  statusItemPressableInactive: {
    bg: 'transparent' as const,
  },

  // Status item inner HStack
  statusItemHStack: {
    space: 'xs' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },

  // Status label Text
  statusLabelText: {
    fontSize: '$md' as const,
    fontWeight: '$normal' as const,
    textAlign: 'center' as const,
  },

  // Status label Text - Active state
  statusLabelTextActive: {
    color: '$primary500',
  },

  // Status label Text - Inactive state
  statusLabelTextInactive: {
    color: '$mutedForeground',
  },

  // Count badge Box
  countBadgeBox: {
    borderRadius: '$full' as const,
    paddingHorizontal: '$2' as const,
    paddingVertical: '$0.5' as const,
    minWidth: 24 as const,
    height: 20 as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },

  // Count badge Box - Active state
  countBadgeBoxActive: {
    bg: '$iconBackground',
  },

  // Count badge Box - Inactive state
  countBadgeBoxInactive: {
    bg: '$backgroundLightGray100',
  },

  // Count Text
  countText: {
    fontSize: '$xs' as const,
    fontWeight: '$normal' as const,
  },

  // Count Text - Active state
  countTextActive: {
    color: '$primary500',
  },

  // Count Text - Inactive state
  countTextInactive: {
    color: '$textMutedForeground',
  },

  // Status Badge Box
  statusBadgeBox: {
    borderWidth: 1 as const,
    paddingHorizontal: '$2' as const,
    paddingVertical: '$1' as const,
    borderRadius: '$full' as const,
    alignSelf: 'flex-start' as const,
    flexShrink: 0 as const,
  },

  // Status Badge Text
  statusBadgeText: {
    fontSize: '$xs' as const,
    fontWeight: '$medium' as const,
    numberOfLines: 1 as const,
    textTransform: 'none' as const,
    lineHeight: 16 as const,
  },
} as const;

