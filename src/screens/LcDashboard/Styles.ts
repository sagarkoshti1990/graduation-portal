export const styles = {
  // Main container
 
  scrollView: {
    p: '$4',
    bg: '$white',
    flex: 1,
  },
  mainVStack: {
    space: 'lg',
  },
  titleText: {
    fontSize: '$2xl',
  },
  welcomeText: {
    paddingTop: '$1',
    fontSize: '$sm',
    color: '$textLight500',
  },
  placeholderBox: {
    p: '$8',
    bg: '$white',
    borderRadius: '$xl',
    borderWidth: 1,
    borderColor: '$borderColor',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
} as const;
