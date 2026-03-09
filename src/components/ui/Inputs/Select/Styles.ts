type SelectTriggerStyleSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type GluestackSelectSize = 'sm' | 'md' | 'lg' | 'xl';

export type SelectTriggerStylesReturn = {
  variant: 'outline';
  size: GluestackSelectSize;
  borderRadius: string;
  width: '$full';
  bg?: string;
  backgroundColor?: string;
  borderColor?: string;
  '$focus-borderColor': string;
  '$focus-borderWidth': 0;
  shadowColor: 'transparent';
  shadowOpacity: 0;
  fontSize: '$sm';
  lineHeight: '$sm';
  '$web-style': { boxShadow: 'none' };
};

export const getSelectTriggerStyles = (
  bg?: string,
  borderColor?: string,
  size: SelectTriggerStyleSize = 'md',
  borderRadius: string = '$xl'
): SelectTriggerStylesReturn => {
  const mappedSize: GluestackSelectSize = size === 'xs' ? 'sm' : size;
  return {
    variant: 'outline',
    size: mappedSize,
    borderRadius,
    width: '$full',
    bg,
    backgroundColor: bg,
    borderColor,
    '$focus-borderColor': borderColor ?? 'transparent',
    '$focus-borderWidth': 0 as const,
    shadowColor: 'transparent',
    shadowOpacity: 0,
    fontSize: '$sm',
    lineHeight: '$sm',
    '$web-style': {
      boxShadow: 'none',
    },
  };
};

