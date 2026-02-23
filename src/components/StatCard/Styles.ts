import { styled } from '@gluestack-style/react';
import { View, Text } from 'react-native';

// Container for the stats row
export const StatsRowContainer = styled(View, {
  flexDirection: 'row',
  flexWrap: 'wrap',
 // marginVertical: 16,
  marginHorizontal: '-$2',
});

// Individual stat card container
export const StatCardContainer = styled(View, {
  flex: 1,
  backgroundColor: 'white',
  borderRadius: '$xl',
  padding: '$6',
  borderWidth: 1,
  borderColor: '$borderColor',
  minWidth: 150,
  marginHorizontal: '$2',
  marginBottom: '$4',
  gap:'$2',
});

export const StatTitle = styled(Text, {
  fontSize: '$sm',
  color: '$textMutedForeground',
  fontWeight: '$medium',
  lineHeight: '$sm',
});

export const StatCount = styled(Text, {
  fontSize: '$2xl',
  fontWeight: '$normal',
  marginBottom: '$2',
});

export const StatSubLabel = styled(Text, {
  fontSize: '$xs',
  color: '$textMutedForeground',
});