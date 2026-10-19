export default {
  container: {
    px: '$4',
    py: '$6',
    '$md-px': '$8',
    bg: '$background50',
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    pb: '$12',
  },
  sectionCard: {
    bg: '$white',
    borderRadius: '$2xl',
    p: '$6',
    mb: '$6',
    borderWidth: 1,
    borderColor: '$borderColor',
    shadowColor: '$black',
    shadowOffset: { width: 0, height: 2 } as const,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitleRow: {
    alignItems: 'center' as const,
    gap: '$2',
  },
  sectionIcon: {
    size: 20,
    color: '$primary500',
  },
  sectionTitle: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700' as const,
    color: '$textForeground',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '$textMutedForeground',
    mt: '$0.5',
    mb: '$4',
  },
  filterRow: {
    flexWrap: 'wrap' as const,
    gap: '$4',
  },
  filterCol: {
    flexGrow: 1,
    flexBasis: 200,
    minWidth: 180,
    space: 'xs' as const,
  },
  label: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '$textMutedForeground',
  },
  statsRow: {
    flexWrap: 'wrap' as const,
    gap: '$4',
    mb: '$6',
  },
  statCard: {
    flexGrow: 1,
    flexBasis: 200,
    bg: '$white',
    borderRadius: '$2xl',
    p: '$5',
    borderWidth: 1,
    borderColor: '$borderColor',
    space: 'xs' as const,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '$textMutedForeground',
  },
  statValue: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700' as const,
    color: '$textForeground',
  },
  chartsRow: {
    gap: '$6',
  },
  barRow: {
    alignItems: 'center' as const,
    gap: '$3',
    mb: '$3',
  },
  barLabel: {
    width: 120,
    fontSize: 13,
    color: '$textForeground',
  },
  barTrack: {
    flex: 1,
    height: 10,
    borderRadius: '$full',
    bg: '$backgroundLight100',
    overflow: 'hidden' as const,
  },
  barValue: {
    width: 48,
    fontSize: 13,
    fontWeight: '600' as const,
    color: '$textForeground',
    textAlign: 'right' as const,
  },
  legendRow: {
    gap: '$4',
    mb: '$3',
  },
  legendItem: {
    alignItems: 'center' as const,
    gap: '$1.5',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: '$full',
  },
  legendText: {
    fontSize: 12,
    color: '$textMutedForeground',
  },
  emptyText: {
    fontSize: 13,
    color: '$textMutedForeground',
  },
  loadingBox: {
    py: '$10',
    alignItems: 'center' as const,
  },
  saveRow: {
    justifyContent: 'flex-end' as const,
    mt: '$4',
  },
} as const;

export const BAR_COLORS = {
  needed: '#94A3B8',
  committed: '#F59E0B',
  approved: '#0284C7',
  delivered: '#16A34A',
  sessions: '#7C3AED',
  coverage: '#0D9488',
};
