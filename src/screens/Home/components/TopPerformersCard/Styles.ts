export const topPerformersCardStyles = {
  container: {
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
  header: {
    space: 'sm',
    alignItems: 'center',
    mb: '$4',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: '$md',
    bg: '$primary100',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    space: 'md',
  },
  performerItem: {
    space: 'xs',
  },
  performerRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  performerInfo: {
    flex: 1,
    space: 'xs',
  },
  progressBar: {
    borderRadius: '$full',
  },
} as const;

