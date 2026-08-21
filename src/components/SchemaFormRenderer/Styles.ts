/**
 * PageHeader Component Styles
 * Reusable styles for the PageHeader component
 */

export default {
  input : {
    bg:"$white",
    borderRadius: 10 as const,
    borderWidth: 1,
    borderColor: '$borderColor' as const,
  },
  select : {

  },
  resetPasswordEyeIconButton : {
    
  },

  filesListVStack: {
    space: 'sm' as const,
    width: '100%' as const,
  } as const,

  resourceCard: {
    borderWidth: 1,
    borderColor: '$borderColor',
    borderRadius: '$lg',
    py: '$2.5' as const,
    px: '$3.5' as const,
    bg: '$white' as const,
    width: '100%' as const,
  } as const,
  fileCardOuterHStack: {
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    space: 'sm' as const,
    width: '100%' as const,
  } as const,
  fileCardInnerHStack: {
    space: 'sm' as const,
    alignItems: 'center' as const,
    flex: 1,
  } as const,
  cardFileTextIconProps: {
    size: 15,
    color: '$blue600' as const,
  },
  resourceFileNameText: {
    fontSize: '$xs' as const,
    fontWeight: '$normal' as const,
    color: '$textPrimary' as const,
  } as const,
} as const;

