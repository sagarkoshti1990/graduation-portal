export const filterStyles = {
  container: {
    mt: '$5' as const,
    bg: 'transparent' as const,
    borderWidth: 1,
    borderColor: '$borderLight100' as const,
    borderRadius: '$xl' as const,
    p: '$6' as const,
    width: '$full' as const,
  },
  titleContainer: {
    mb: '$4' as const,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  titleText: {
    fontSize: '$sm' as const,
    fontWeight: '$normal' as const,
    ml: '$2' as const,
    color: '$foreground',
  },
  filterFieldsContainer: {
    gap: '$3' as const, // More spacing on mobile (vertical stack)
    flexWrap: 'wrap' as const,
    flexDirection: 'column' as const,
    $md: {
      flexDirection: 'row' as const,
      gap: '$2' as const, // Less spacing on desktop (horizontal layout)
    },
    justifyContent: 'space-between' as const,
  },
  roleContainer: {
    flex: 1,
    minWidth: '100%' as const,
    $md: {
      minWidth: 150,
     // maxWidth: 240,
    },
  },
  input: {
    variant: 'outline' as const,
    size: 'sm' as const,
    borderRadius: '$md' as const,
    bg: 'transparent' as const,
    borderColor: '$borderLight100' as const,
    height: '$9' as const,
  },
  clearLinkText: {
    fontSize: '$sm' as const,
    color: '$textMutedForeground' as const,
    fontWeight: '$medium' as const,
    textDecorationLine: 'none' as const,
  },
}

