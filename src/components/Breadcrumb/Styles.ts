/**
 * Breadcrumb Component Styles
 * Centralized styles for the Breadcrumb component
 */

export const breadcrumbStyles = {
  container: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flexWrap: 'wrap' as const,
    space: 'xs' as const,
  },
  backButton: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    width: 24,
    height: 24,
    borderRadius: '$sm' as const,
    bg: 'transparent' as const,
    $web: {
      cursor: 'pointer' as const,
      _hover: {
        bg: '$backgroundLight100' as const,
      },
    },
  },
  itemContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flexWrap: 'wrap' as const,
    flex: 1,
    minWidth: 0,
    space: 'xs' as const,
  },
  item: {
    fontSize: '$sm' as const,
    color: '$textMutedForeground' as const,
    flexShrink: 1,
    minWidth: 0,
    $web: {
      cursor: 'pointer' as const,
      _hover: {
        color: '$primary500' as const,
        textDecorationLine: 'underline' as const,
      },
    },
  },
  itemActive: {
    fontSize: '$sm' as const,
    color: '$textForeground' as const,
    fontWeight: '$semibold' as const,
    flexShrink: 1,
    minWidth: 0,
  },
  separator: {
    fontSize: '$sm' as const,
    color: '$textMutedForeground' as const,
    mx: '$1' as const,
    flexShrink: 0,
  },
  ellipsis: {
    fontSize: '$sm' as const,
    color: '$textMutedForeground' as const,
    mx: '$1' as const,
  },
};
