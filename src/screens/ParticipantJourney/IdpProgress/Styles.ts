export const idpProgressStyles = {
  page: {
    flex: 1 as const,
    bg: '$white' as const,
  },
  topHeaderBar: {
    width: '$full' as const,
    bg: '$white' as const,
    borderBottomWidth: 1 as const,
    borderBottomColor: '$inputBorder' as const,
  },
  headerContainer: {
    width: '$full' as const,
    px: '$6' as const,
    py: '$4' as const,
    '$md-px': '$8' as const,
  },
  headerTitleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    space: 'sm' as const,
  },
  backPressable: {
    borderRadius: '$md' as const,
  },
  backIconBox: {
    p: '$2' as const,
    bg: 'transparent' as const,
    borderRadius: '$md' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  backIconBoxHover: {
    bg: '$primary100' as const,
  },
  title: {
    color: '$textDark900' as const,
    fontSize: '$xl' as const,
    fontWeight: '$bold' as const,
  },
  contentArea: {
    flex: 1 as const,
    width: '$full' as const,
    bg: '$accent100' as const,
  },
  container: {
    width: '$full' as const,
    px: '$6' as const,
    py: '$6' as const,
    '$md-px': '$8' as const,
    '$md-py': '$8' as const,
  },
  content: {
    space: 'md' as const,
    alignItems: 'stretch' as const,
    width: '$full' as const,
  },
  subtitle: {
    color: '$textDark600' as const,
    fontSize: '$md' as const,
    fontWeight: '$normal' as const,
    mt: '$0' as const,
    mb: '$2' as const,
  },
  idpContent: {
    flex: 1 as const,
    width: '$full' as const,
  },
} as const;

export const overallProgressCardStyles = {
  cardBox: {
    bg: '$blue50' as const,
    borderWidth: 1 as const,
    borderColor: '$blue200' as const,
    borderRadius: '$2xl' as const,
    p: '$4' as const,
    my: '$2' as const,
    shadowColor: '$shadowColor' as const,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08 as const,
    shadowRadius: 8 as const,
    elevation: 2 as const,
  },
} as const;

