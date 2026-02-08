export const metricCardStyles = {
  container: {
    flex: 1,
    minWidth: '200px',
    bg: '$white',
    borderRadius: '$xl',
    p: '$4',
    borderWidth: 1,
    borderColor: '$borderColor',
    shadowColor: '$shadowColor',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  content: {
    space: 'md',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: '$lg',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    space: 'xs',
  },
  valueText: {
    fontSize: '$2xl',
    fontWeight: '$bold',
    color: '$textPrimary',
  },
} as const;

